import {
    isPlannerState,
    PLANNER_SCHEMA_VERSION,
} from '../planner/plannerStorage.js'
import {
    commitStates,
    compareStorageChanges,
    getState,
    STORAGE_KEYS,
} from './indexedDbStorage.js'
import { migrateV2LocalStorage, V2_LOCAL_STORAGE_KEYS } from './v2Migration.js'

export const APP_STORAGE_SCHEMA_VERSION = 1
export const V3_MIRROR_META_KEY = 'A2Z_Tracker_v3_mirror'

let latestRevision = 0
let latestSnapshotSignature = null
let latestDatabaseMeta = {}
let writeQueue = Promise.resolve()
let currentMode = 'primary'
let observedTracker = null
let observedPlanner = null
let lastChangeClock = 0
const writerId =
    globalThis.crypto?.randomUUID?.() ??
    `writer-${Date.now()}-${Math.random().toString(36).slice(2)}`
let writerSequence = 0

function nextStorageChange(changedAt = Date.now()) {
    writerSequence += 1
    lastChangeClock = Math.max(lastChangeClock + 1, changedAt)

    return {
        id: `${lastChangeClock}:${writerId}:${writerSequence}`,
        changedAt: lastChangeClock,
        writerId,
        sequence: writerSequence,
    }
}

function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function clone(value) {
    if (typeof structuredClone === 'function') return structuredClone(value)
    return JSON.parse(JSON.stringify(value))
}

function resolveLocalStorage(storage) {
    if (storage !== undefined) return storage

    try {
        return globalThis.localStorage ?? null
    } catch {
        return null
    }
}

function serializePlanner(plan) {
    if (!plan) return null

    return JSON.stringify({
        ...plan,
        schemaVersion: PLANNER_SCHEMA_VERSION,
    })
}

function storedPlanner(plan) {
    if (!plan) return null

    return {
        ...plan,
        schemaVersion: PLANNER_SCHEMA_VERSION,
    }
}

function hashString(value) {
    let hash = 2166136261

    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index)
        hash = Math.imul(hash, 16777619)
    }

    return (hash >>> 0).toString(36)
}

function snapshotParts(tracker, planner) {
    const trackerJson = JSON.stringify(tracker)
    const plannerJson = serializePlanner(planner)

    return {
        trackerJson,
        plannerJson,
        trackerSignature: hashString(trackerJson),
        plannerSignature: hashString(plannerJson ?? ''),
        signature: `${hashString(trackerJson)}:${hashString(plannerJson ?? '')}`,
    }
}

function parseJson(value) {
    if (value === null) return { present: false, value: null, error: null }

    try {
        return { present: true, value: JSON.parse(value), error: null }
    } catch (error) {
        return { present: true, value: null, error }
    }
}

export function readCompatibilitySnapshot(storage) {
    const target = resolveLocalStorage(storage)
    if (!target || typeof target.getItem !== 'function') {
        return {
            available: false,
            tracker: null,
            trackerPresent: false,
            planner: null,
            plannerPresent: false,
            meta: null,
            rawTracker: null,
            rawPlanner: null,
            issues: [],
        }
    }

    const issues = []

    try {
        const rawTracker = target.getItem(
            V2_LOCAL_STORAGE_KEYS[STORAGE_KEYS.TRACKER]
        )
        const rawPlanner = target.getItem(
            V2_LOCAL_STORAGE_KEYS[STORAGE_KEYS.PLANNER]
        )
        const rawMeta = target.getItem(V3_MIRROR_META_KEY)
        const trackerResult = parseJson(rawTracker)
        const plannerResult = parseJson(rawPlanner)
        const metaResult = parseJson(rawMeta)

        if (trackerResult.error)
            issues.push('Tracker mirror contains invalid JSON.')
        if (plannerResult.error)
            issues.push('Planly mirror contains invalid JSON.')
        if (metaResult.error)
            issues.push('Storage metadata contains invalid JSON.')

        return {
            available: true,
            tracker: isRecord(trackerResult.value) ? trackerResult.value : null,
            trackerPresent: trackerResult.present,
            planner: isPlannerState(plannerResult.value)
                ? plannerResult.value
                : null,
            plannerPresent: plannerResult.present,
            meta: isRecord(metaResult.value) ? metaResult.value : null,
            rawTracker,
            rawPlanner,
            issues,
        }
    } catch (error) {
        return {
            available: false,
            tracker: null,
            trackerPresent: false,
            planner: null,
            plannerPresent: false,
            meta: null,
            rawTracker: null,
            rawPlanner: null,
            issues: [
                error instanceof Error
                    ? error.message
                    : 'Compatibility storage could not be read.',
            ],
        }
    }
}

export function normalizeTrackerState(baseTracker, savedTracker) {
    const cleanBase = clone(baseTracker)

    if (
        !isRecord(savedTracker) ||
        !isRecord(savedTracker.data) ||
        !isRecord(savedTracker.data.header) ||
        !Array.isArray(savedTracker.data.content)
    ) {
        return { tracker: cleanBase, restored: false, error: null }
    }

    try {
        const savedTopics = new Map(
            savedTracker.data.content
                .filter(topic => typeof topic?.contentPath === 'string')
                .map(topic => [topic.contentPath, topic])
        )
        const savedQuestions = new Map(
            savedTracker.data.content.flatMap(topic =>
                (topic.categoryList ?? []).flatMap(category =>
                    (category.questionList ?? [])
                        .filter(
                            question => typeof question?.questionId === 'string'
                        )
                        .map(question => [question.questionId, question])
                )
            )
        )
        let completedQuestions = 0

        cleanBase.data.header.darkMode =
            savedTracker.data.header.darkMode === true
        cleanBase.data.header.isBookmarkFilterRequired =
            savedTracker.data.header.isBookmarkFilterRequired === true

        cleanBase.data.content = cleanBase.data.content.map(topic => {
            const savedTopic = savedTopics.get(topic.contentPath)
            let contentCompletedQuestions = 0
            const categoryList = topic.categoryList.map(category => {
                let categoryCompletedQuestions = 0
                const questionList = category.questionList.map(question => {
                    const savedQuestion = savedQuestions.get(
                        question.questionId
                    )
                    if (!savedQuestion) return question

                    const isDone = savedQuestion.isDone === true
                    if (isDone) {
                        categoryCompletedQuestions += 1
                        contentCompletedQuestions += 1
                        completedQuestions += 1
                    }

                    return {
                        ...question,
                        isDone,
                        completedAt: isDone
                            ? (savedQuestion.completedAt ?? null)
                            : null,
                        isBookmarked: savedQuestion.isBookmarked === true,
                        userNotes:
                            typeof savedQuestion.userNotes === 'string'
                                ? savedQuestion.userNotes
                                : '',
                    }
                })

                return {
                    ...category,
                    categoryCompletedQuestions,
                    questionList,
                }
            })

            return {
                ...topic,
                contentUserNotes:
                    typeof savedTopic?.contentUserNotes === 'string'
                        ? savedTopic.contentUserNotes
                        : topic.contentUserNotes,
                contentCompletedQuestions,
                categoryList,
            }
        })
        cleanBase.data.header.completedQuestions = completedQuestions

        return {
            tracker: cleanBase,
            restored: true,
            error: null,
        }
    } catch (error) {
        return { tracker: cleanBase, restored: false, error }
    }
}

function questionsById(tracker) {
    return new Map(
        tracker.data.content.flatMap(topic =>
            topic.categoryList.flatMap(category =>
                category.questionList.map(question => [
                    question.questionId,
                    question,
                ])
            )
        )
    )
}

function withRecomputedProgress(tracker) {
    let completedQuestions = 0
    const content = tracker.data.content.map(topic => {
        let contentCompletedQuestions = 0
        const categoryList = topic.categoryList.map(category => {
            const categoryCompletedQuestions = category.questionList.filter(
                question => question.isDone
            ).length
            contentCompletedQuestions += categoryCompletedQuestions

            return { ...category, categoryCompletedQuestions }
        })
        completedQuestions += contentCompletedQuestions

        return { ...topic, contentCompletedQuestions, categoryList }
    })

    return {
        ...tracker,
        data: {
            ...tracker.data,
            header: {
                ...tracker.data.header,
                completedQuestions,
            },
            content,
        },
    }
}

function mergeTrackerChanges(baseline, nextTracker, sharedTracker) {
    if (!baseline || !sharedTracker) return clone(nextTracker)

    const merged = normalizeTrackerState(nextTracker, sharedTracker).tracker
    const baselineQuestions = questionsById(baseline)
    const nextQuestions = questionsById(nextTracker)
    const mergedQuestions = questionsById(merged)

    nextQuestions.forEach((nextQuestion, id) => {
        const baselineQuestion = baselineQuestions.get(id)
        const mergedQuestion = mergedQuestions.get(id)
        if (!baselineQuestion || !mergedQuestion) return

        if (
            nextQuestion.isDone !== baselineQuestion.isDone ||
            nextQuestion.completedAt !== baselineQuestion.completedAt
        ) {
            mergedQuestion.isDone = nextQuestion.isDone
            mergedQuestion.completedAt = nextQuestion.completedAt
        }
        if (nextQuestion.isBookmarked !== baselineQuestion.isBookmarked) {
            mergedQuestion.isBookmarked = nextQuestion.isBookmarked
        }
        if (nextQuestion.userNotes !== baselineQuestion.userNotes) {
            mergedQuestion.userNotes = nextQuestion.userNotes
        }
    })

    for (const field of ['darkMode', 'isBookmarkFilterRequired']) {
        if (nextTracker.data.header[field] !== baseline.data.header[field]) {
            merged.data.header[field] = nextTracker.data.header[field]
        }
    }

    const baselineTopics = new Map(
        baseline.data.content.map(topic => [topic.contentPath, topic])
    )
    const nextTopics = new Map(
        nextTracker.data.content.map(topic => [topic.contentPath, topic])
    )
    merged.data.content.forEach(topic => {
        const baselineTopic = baselineTopics.get(topic.contentPath)
        const nextTopic = nextTopics.get(topic.contentPath)

        if (
            baselineTopic &&
            nextTopic &&
            baselineTopic.contentUserNotes !== nextTopic.contentUserNotes
        ) {
            topic.contentUserNotes = nextTopic.contentUserNotes
        }
    })

    return withRecomputedProgress(merged)
}

function valuesEqual(left, right) {
    return JSON.stringify(left) === JSON.stringify(right)
}

function cloneValue(value) {
    return value === undefined ? undefined : clone(value)
}

function mergeChangedValues(baseline, local, shared) {
    if (valuesEqual(local, baseline)) return cloneValue(shared)
    if (valuesEqual(shared, baseline)) return cloneValue(local)
    if (valuesEqual(local, shared)) return cloneValue(local)

    if (isRecord(local) && isRecord(shared)) {
        const baselineRecord = isRecord(baseline) ? baseline : {}
        const keys = new Set([
            ...Object.keys(baselineRecord),
            ...Object.keys(local),
            ...Object.keys(shared),
        ])

        return Object.fromEntries(
            [...keys].map(key => [
                key,
                mergeChangedValues(
                    baselineRecord[key],
                    local[key],
                    shared[key]
                ),
            ])
        )
    }

    return cloneValue(local)
}

function mergePlannerChanges(baseline, local, shared) {
    const localChanged = serializePlanner(local) !== serializePlanner(baseline)
    const sharedChanged =
        serializePlanner(shared) !== serializePlanner(baseline)

    if (!localChanged) return cloneValue(shared)
    if (!sharedChanged || !local || !shared) return cloneValue(local)

    return {
        ...mergeChangedValues(baseline, local, shared),
        needsScheduleRebuild: true,
        schemaVersion: PLANNER_SCHEMA_VERSION,
    }
}

function reconcileWithCompatibility(tracker, planner, storage) {
    const mirror = readCompatibilitySnapshot(storage)
    if (!mirror.tracker || !mirror.meta) {
        return { tracker, planner, reconciled: false }
    }

    lastChangeClock = Math.max(
        lastChangeClock,
        Number(mirror.meta.change?.changedAt) || 0
    )

    const trackerResult = mergeTrackerChanges(
        observedTracker,
        tracker,
        mirror.tracker
    )
    const plannerMirrorIsComplete = !mirrorChanges(mirror).planner
    const sharedPlanner = plannerMirrorIsComplete
        ? mirror.plannerPresent
            ? mirror.planner
            : null
        : observedPlanner
    const plannerResult = mergePlannerChanges(
        observedPlanner,
        planner,
        sharedPlanner
    )
    const reconciled =
        snapshotParts(trackerResult, plannerResult).signature !==
        snapshotParts(tracker, planner).signature

    return {
        tracker: trackerResult,
        planner: plannerResult,
        reconciled,
    }
}

function mirrorChanges(snapshot) {
    const meta = snapshot.meta
    if (!meta || meta.schemaVersion !== APP_STORAGE_SCHEMA_VERSION) {
        return { tracker: false, planner: false }
    }

    const trackerSignature = snapshot.rawTracker
        ? hashString(snapshot.rawTracker)
        : hashString('')
    const plannerSignature = snapshot.rawPlanner
        ? hashString(snapshot.rawPlanner)
        : hashString('')

    return {
        tracker: trackerSignature !== meta.trackerSignature,
        planner: plannerSignature !== meta.plannerSignature,
    }
}

function writeCompatibilitySnapshot(
    tracker,
    planner,
    revision,
    pending,
    change,
    storage
) {
    const target = resolveLocalStorage(storage)
    if (!target || typeof target.setItem !== 'function') {
        return { mirrored: false, error: null }
    }

    const parts = snapshotParts(tracker, planner)

    try {
        target.setItem(
            V2_LOCAL_STORAGE_KEYS[STORAGE_KEYS.TRACKER],
            parts.trackerJson
        )

        if (parts.plannerJson === null) {
            target.removeItem(V2_LOCAL_STORAGE_KEYS[STORAGE_KEYS.PLANNER])
        } else {
            target.setItem(
                V2_LOCAL_STORAGE_KEYS[STORAGE_KEYS.PLANNER],
                parts.plannerJson
            )
        }

        target.setItem(
            V3_MIRROR_META_KEY,
            JSON.stringify({
                schemaVersion: APP_STORAGE_SCHEMA_VERSION,
                revision,
                pending,
                change,
                updatedAt: new Date().toISOString(),
                trackerSignature: parts.trackerSignature,
                plannerSignature: parts.plannerSignature,
            })
        )

        return { mirrored: true, error: null }
    } catch (error) {
        return { mirrored: false, error }
    }
}

function databaseMeta(change) {
    return {
        schemaVersion: APP_STORAGE_SCHEMA_VERSION,
        updatedAt: new Date().toISOString(),
        change,
    }
}

async function writePrimarySnapshot(tracker, planner, change, options = {}) {
    const entries = {
        [STORAGE_KEYS.TRACKER]: tracker,
        [STORAGE_KEYS.PLANNER]: storedPlanner(planner),
    }
    const proposedMeta = databaseMeta(change)
    let result

    if (options.writeStates && !options.commitStates) {
        const meta = {
            ...latestDatabaseMeta,
            ...proposedMeta,
            revision: latestRevision + 1,
        }
        await options.writeStates({ ...entries, [STORAGE_KEYS.META]: meta })
        result = { committed: true, entries, meta }
    } else {
        const commit = options.commitStates ?? commitStates
        const commitOptions = options.indexedDb
            ? { indexedDb: options.indexedDb }
            : {}
        if (options.mergeEntries) {
            commitOptions.mergeEntries = options.mergeEntries
        }
        result = await commit(entries, proposedMeta, commitOptions)
    }

    latestDatabaseMeta = result.meta
    lastChangeClock = Math.max(
        lastChangeClock,
        Number(result.meta?.change?.changedAt) || 0
    )
    latestRevision = Math.max(
        latestRevision,
        Number(result.meta?.revision) || 0
    )
    return result
}

function restorePlanner(primaryPlanner, mirror) {
    if (primaryPlanner === null) return null
    if (isPlannerState(primaryPlanner)) return primaryPlanner
    if (mirror.plannerPresent) return mirror.planner
    return null
}

export async function initializeAppStorage(baseTracker, options = {}) {
    const storage = resolveLocalStorage(options.storage)
    const mirror = readCompatibilitySnapshot(storage)
    const warnings = [...mirror.issues]
    const readState = options.readState ?? getState
    const read = key =>
        readState(
            key,
            options.indexedDb ? { indexedDb: options.indexedDb } : undefined
        )

    try {
        await migrateV2LocalStorage({
            storage,
            indexedDb: options.indexedDb,
            readState: options.readState,
            writeState: options.writeState,
        })

        const [primaryTracker, primaryPlanner, primaryMeta] = await Promise.all(
            [
                read(STORAGE_KEYS.TRACKER),
                read(STORAGE_KEYS.PLANNER),
                read(STORAGE_KEYS.META),
            ]
        )
        latestDatabaseMeta = isRecord(primaryMeta) ? primaryMeta : {}
        lastChangeClock = Math.max(
            lastChangeClock,
            Number(primaryMeta?.change?.changedAt) || 0,
            Number(mirror.meta?.change?.changedAt) || 0
        )
        const primaryRevision = Number(primaryMeta?.revision) || 0
        const mirrorRevision = Number(mirror.meta?.revision) || 0
        const changedMirrorParts = mirrorChanges(mirror)
        const repairPendingMirror =
            mirror.meta?.pending === true &&
            (mirror.meta.change
                ? compareStorageChanges(
                      mirror.meta.change,
                      primaryMeta?.change
                  ) > 0
                : mirrorRevision > primaryRevision)
        const useMirrorTracker =
            Boolean(mirror.tracker) &&
            (repairPendingMirror || changedMirrorParts.tracker)
        const mirrorPlannerUsable =
            !mirror.plannerPresent || Boolean(mirror.planner)
        const useMirrorPlanner =
            mirrorPlannerUsable &&
            (repairPendingMirror || changedMirrorParts.planner)
        const repairedFromMirror = useMirrorTracker || useMirrorPlanner

        const trackerCandidate = useMirrorTracker
            ? mirror.tracker
            : (primaryTracker ?? mirror.tracker)
        const plannerCandidate = useMirrorPlanner
            ? mirror.plannerPresent
                ? mirror.planner
                : null
            : restorePlanner(primaryPlanner, mirror)
        const normalized = normalizeTrackerState(baseTracker, trackerCandidate)
        const trackerCandidateInvalid =
            trackerCandidate !== undefined &&
            trackerCandidate !== null &&
            !normalized.restored

        if (trackerCandidateInvalid) {
            warnings.push(
                'Saved tracker progress was malformed, so the base sheet was loaded.'
            )
        }
        if (mirror.plannerPresent && !mirror.planner) {
            warnings.push(
                'Saved Planly data was malformed and could not be restored.'
            )
        }

        latestRevision = Math.max(primaryRevision, mirrorRevision, 0)
        const primaryPlannerInvalid =
            primaryPlanner !== undefined &&
            primaryPlanner !== null &&
            !isPlannerState(primaryPlanner)
        const needsPrimaryWrite =
            repairedFromMirror ||
            primaryTracker === undefined ||
            !primaryMeta?.change ||
            trackerCandidateInvalid ||
            primaryPlannerInvalid

        if (needsPrimaryWrite) {
            const change = repairPendingMirror
                ? mirror.meta.change
                : nextStorageChange()
            const result = await writePrimarySnapshot(
                normalized.tracker,
                plannerCandidate,
                change,
                options
            )

            if (!result.committed && (options._retryCount ?? 0) < 1) {
                return initializeAppStorage(baseTracker, {
                    ...options,
                    _retryCount: (options._retryCount ?? 0) + 1,
                })
            }
        }

        writeCompatibilitySnapshot(
            normalized.tracker,
            plannerCandidate,
            latestRevision,
            false,
            latestDatabaseMeta.change,
            storage
        )
        latestSnapshotSignature = snapshotParts(
            normalized.tracker,
            plannerCandidate
        ).signature
        observedTracker = clone(normalized.tracker)
        observedPlanner = storedPlanner(plannerCandidate)
        currentMode = 'primary'

        return {
            tracker: normalized.tracker,
            planner: plannerCandidate,
            revision: latestRevision,
            source: repairedFromMirror
                ? 'compatibility-mirror'
                : primaryTracker !== undefined
                  ? 'indexeddb'
                  : mirror.tracker
                    ? 'v2-local-storage'
                    : 'defaults',
            mode: 'primary',
            warnings,
        }
    } catch (error) {
        const normalized = normalizeTrackerState(baseTracker, mirror.tracker)
        const planner = mirror.planner

        if (mirror.tracker && !normalized.restored) {
            warnings.push(
                'Saved tracker progress was malformed, so the base sheet was loaded.'
            )
        }
        warnings.push(
            'IndexedDB could not be opened. Progress is using the local compatibility copy for this session.'
        )
        lastChangeClock = Math.max(
            lastChangeClock,
            Number(mirror.meta?.change?.changedAt) || 0
        )
        latestRevision = Number(mirror.meta?.revision) || 0
        latestSnapshotSignature = snapshotParts(
            normalized.tracker,
            planner
        ).signature
        observedTracker = clone(normalized.tracker)
        observedPlanner = storedPlanner(planner)
        currentMode = 'degraded'

        return {
            tracker: normalized.tracker,
            planner,
            revision: latestRevision,
            source: mirror.tracker ? 'v2-local-storage' : 'defaults',
            mode: 'degraded',
            warnings,
            error,
        }
    }
}

export function saveAppState({ tracker, planner }, options = {}) {
    const baselineTracker = observedTracker ? clone(observedTracker) : null
    const baselinePlanner = storedPlanner(observedPlanner)
    const reconciliation = reconcileWithCompatibility(
        tracker,
        planner,
        options.storage
    )
    const snapshotTracker = reconciliation.tracker
    const snapshotPlanner = reconciliation.planner
    const parts = snapshotParts(snapshotTracker, snapshotPlanner)

    if (parts.signature === latestSnapshotSignature) {
        return Promise.resolve({
            revision: latestRevision,
            mode: currentMode,
            mirrored: true,
            tracker: snapshotTracker,
            planner: snapshotPlanner,
            reconciled: reconciliation.reconciled,
            skipped: true,
        })
    }

    const change = nextStorageChange()
    const estimatedRevision = latestRevision + 1
    const savedPlanner = storedPlanner(snapshotPlanner)
    let lastMirrorResult = writeCompatibilitySnapshot(
        snapshotTracker,
        savedPlanner,
        estimatedRevision,
        true,
        change,
        options.storage
    )
    if (lastMirrorResult.mirrored) {
        latestSnapshotSignature = parts.signature
        observedTracker = clone(snapshotTracker)
        observedPlanner = storedPlanner(snapshotPlanner)
    }

    const mergeEntries = currentEntries => {
        const currentTracker =
            currentEntries[STORAGE_KEYS.TRACKER] ?? snapshotTracker
        const currentPlannerValue = currentEntries[STORAGE_KEYS.PLANNER]
        const currentPlanner =
            currentPlannerValue === null
                ? null
                : isPlannerState(currentPlannerValue)
                  ? currentPlannerValue
                  : snapshotPlanner

        return {
            [STORAGE_KEYS.TRACKER]: mergeTrackerChanges(
                baselineTracker,
                snapshotTracker,
                currentTracker
            ),
            [STORAGE_KEYS.PLANNER]: storedPlanner(
                mergePlannerChanges(
                    baselinePlanner,
                    snapshotPlanner,
                    currentPlanner
                )
            ),
        }
    }
    const writeOptions = { ...options, mergeEntries }

    writeQueue = writeQueue
        .catch(() => undefined)
        .then(async () => {
            try {
                let activeChange = change
                let result = await writePrimarySnapshot(
                    clone(snapshotTracker),
                    savedPlanner ? clone(savedPlanner) : null,
                    activeChange,
                    writeOptions
                )

                if (!result.committed) {
                    activeChange = nextStorageChange()
                    lastMirrorResult = writeCompatibilitySnapshot(
                        snapshotTracker,
                        savedPlanner,
                        latestRevision + 1,
                        true,
                        activeChange,
                        options.storage
                    )
                    if (lastMirrorResult.mirrored) {
                        latestSnapshotSignature = parts.signature
                        observedTracker = clone(snapshotTracker)
                        observedPlanner = storedPlanner(snapshotPlanner)
                    }
                    result = await writePrimarySnapshot(
                        clone(snapshotTracker),
                        savedPlanner ? clone(savedPlanner) : null,
                        activeChange,
                        writeOptions
                    )
                }

                if (!result.committed) {
                    const winnerTracker =
                        result.entries?.[STORAGE_KEYS.TRACKER] ??
                        snapshotTracker
                    const winnerPlannerValue =
                        result.entries?.[STORAGE_KEYS.PLANNER]
                    const winnerPlanner =
                        winnerPlannerValue === null
                            ? null
                            : isPlannerState(winnerPlannerValue)
                              ? winnerPlannerValue
                              : snapshotPlanner

                    observedTracker = clone(winnerTracker)
                    observedPlanner = storedPlanner(winnerPlanner)
                    latestSnapshotSignature = snapshotParts(
                        winnerTracker,
                        winnerPlanner
                    ).signature
                    currentMode = 'primary'

                    return {
                        revision: result.meta.revision,
                        mode: 'primary',
                        mirrored: lastMirrorResult.mirrored,
                        mirrorError: lastMirrorResult.error,
                        tracker: winnerTracker,
                        planner: winnerPlanner,
                        reconciled: true,
                        stale: true,
                        skipped: false,
                    }
                }

                const committedTracker =
                    result.entries?.[STORAGE_KEYS.TRACKER] ?? snapshotTracker
                const committedPlannerValue =
                    result.entries?.[STORAGE_KEYS.PLANNER]
                const committedPlanner =
                    committedPlannerValue === null
                        ? null
                        : isPlannerState(committedPlannerValue)
                          ? committedPlannerValue
                          : snapshotPlanner
                lastMirrorResult = writeCompatibilitySnapshot(
                    committedTracker,
                    committedPlanner,
                    result.meta.revision,
                    false,
                    result.meta.change,
                    options.storage
                )
                const committedParts = snapshotParts(
                    committedTracker,
                    committedPlanner
                )
                latestSnapshotSignature = committedParts.signature
                observedTracker = clone(committedTracker)
                observedPlanner = storedPlanner(committedPlanner)
                currentMode = 'primary'

                return {
                    revision: result.meta.revision,
                    mode: 'primary',
                    mirrored: lastMirrorResult.mirrored,
                    mirrorError: lastMirrorResult.error,
                    tracker: committedTracker,
                    planner: committedPlanner,
                    reconciled:
                        committedParts.signature !==
                        snapshotParts(tracker, planner).signature,
                    stale: false,
                    skipped: false,
                }
            } catch (error) {
                currentMode = 'degraded'
                if (
                    !lastMirrorResult.mirrored &&
                    latestSnapshotSignature === parts.signature
                ) {
                    latestSnapshotSignature = null
                }
                return {
                    revision: estimatedRevision,
                    mode: 'degraded',
                    mirrored: lastMirrorResult.mirrored,
                    mirrorError: lastMirrorResult.error,
                    tracker: snapshotTracker,
                    planner: snapshotPlanner,
                    reconciled: reconciliation.reconciled,
                    error,
                    skipped: false,
                }
            }
        })

    return writeQueue
}

export function flushAppStorage() {
    return writeQueue
}
