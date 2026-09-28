import assert from 'node:assert/strict'

import {
    APP_STORAGE_SCHEMA_VERSION,
    compareStorageChanges,
    deleteState,
    flushAppStorage,
    getState,
    getStoragePersistenceStatus,
    initializeAppStorage,
    inspectV2LocalStorage,
    migrateV2LocalStorage,
    normalizeTrackerState,
    readCompatibilitySnapshot,
    requestStoragePersistence,
    saveAppState,
    setState,
    setStates,
    STORAGE_DATABASE_NAME,
    STORAGE_DATABASE_VERSION,
    STORAGE_KEYS,
    STORAGE_STORE_NAME,
    TrackerStorageError,
    V3_MIRROR_META_KEY,
    V2_LOCAL_STORAGE_KEYS,
} from '../src/components/storage/index.js'
import ultimateData from '../src/components/common/enhancedData.js'

assert.equal(STORAGE_DATABASE_NAME, 'a2z-tracker-v3')
assert.equal(STORAGE_DATABASE_VERSION, 1)
assert.equal(STORAGE_STORE_NAME, 'state')
assert.equal(APP_STORAGE_SCHEMA_VERSION, 1)
assert.equal(V3_MIRROR_META_KEY, 'A2Z_Tracker_v3_mirror')
assert.deepEqual(Object.values(STORAGE_KEYS), ['tracker', 'planner', 'meta'])
assert.deepEqual(V2_LOCAL_STORAGE_KEYS, {
    tracker: 'A2Z_Archive',
    planner: 'A2Z_Planly_v2',
})
assert.equal(
    compareStorageChanges(
        { id: 'new', changedAt: 2, writerId: 'a', sequence: 1 },
        { id: 'old', changedAt: 1, writerId: 'b', sequence: 10 }
    ),
    1
)
assert.equal(
    compareStorageChanges(
        { id: 'later', changedAt: 1, writerId: 'same', sequence: 2 },
        { id: 'earlier', changedAt: 2, writerId: 'same', sequence: 1 }
    ),
    1
)

await assert.rejects(
    getState('unknown'),
    error =>
        error instanceof TrackerStorageError && error.code === 'invalid-key'
)
await assert.rejects(
    setState(STORAGE_KEYS.TRACKER, undefined),
    error =>
        error instanceof TrackerStorageError && error.code === 'invalid-value'
)
await assert.rejects(
    setStates({ unknown: {} }),
    error =>
        error instanceof TrackerStorageError && error.code === 'invalid-key'
)
await assert.rejects(
    deleteState(STORAGE_KEYS.TRACKER),
    error =>
        error instanceof TrackerStorageError && error.code === 'unavailable'
)

const sourceMemory = new Map([
    ['A2Z_Archive', JSON.stringify({ data: { content: [] } })],
    ['A2Z_Planly_v2', JSON.stringify({ name: 'My plan' })],
])
const sourceStorage = {
    getItem: key => sourceMemory.get(key) ?? null,
}
const snapshot = inspectV2LocalStorage(sourceStorage)

assert.equal(snapshot.available, true)
assert.deepEqual(snapshot.records.tracker, { data: { content: [] } })
assert.deepEqual(snapshot.records.planner, { name: 'My plan' })
assert.deepEqual(snapshot.issues, [])

const targetMemory = new Map()
const readState = async key => targetMemory.get(key)
const writeState = async (key, value) => {
    targetMemory.set(key, value)
    return true
}
const migrated = await migrateV2LocalStorage({
    storage: sourceStorage,
    readState,
    writeState,
    now: () => '2026-09-21T12:00:00.000Z',
})

assert.equal(migrated.alreadyMigrated, false)
assert.deepEqual(migrated.importedKeys, ['tracker', 'planner'])
assert.deepEqual(migrated.skippedKeys, [])
assert.deepEqual(targetMemory.get(STORAGE_KEYS.TRACKER), {
    data: { content: [] },
})
assert.deepEqual(targetMemory.get(STORAGE_KEYS.PLANNER), { name: 'My plan' })
assert.equal(
    targetMemory.get(STORAGE_KEYS.META).migrations.v2LocalStorage.completedAt,
    '2026-09-21T12:00:00.000Z'
)
assert.equal(sourceMemory.has('A2Z_Archive'), true)
assert.equal(sourceMemory.has('A2Z_Planly_v2'), true)

const secondMigration = await migrateV2LocalStorage({
    storage: sourceStorage,
    readState,
    writeState,
})
assert.equal(secondMigration.alreadyMigrated, true)

const existingTarget = new Map([[STORAGE_KEYS.TRACKER, { existing: true }]])
const partialMigration = await migrateV2LocalStorage({
    storage: sourceStorage,
    readState: async key => existingTarget.get(key),
    writeState: async (key, value) => existingTarget.set(key, value),
    now: () => '2026-09-21T13:00:00.000Z',
})
assert.deepEqual(partialMigration.importedKeys, ['planner'])
assert.deepEqual(partialMigration.skippedKeys, ['tracker'])
assert.deepEqual(existingTarget.get(STORAGE_KEYS.TRACKER), { existing: true })

const invalidSnapshot = inspectV2LocalStorage({
    getItem: key => (key === 'A2Z_Archive' ? '{broken' : '[]'),
})
assert.deepEqual(invalidSnapshot.records, {})
assert.deepEqual(
    invalidSnapshot.issues.map(issue => issue.code),
    ['invalid-json', 'invalid-shape']
)
assert.deepEqual(inspectV2LocalStorage(null), {
    available: false,
    records: {},
    issues: [],
})

assert.deepEqual(
    await getStoragePersistenceStatus({ persisted: async () => true }),
    { supported: true, persisted: true, error: null }
)
assert.deepEqual(
    await requestStoragePersistence({ persist: async () => false }),
    { supported: true, persisted: false, error: null }
)
assert.deepEqual(await getStoragePersistenceStatus(null), {
    supported: false,
    persisted: false,
    error: null,
})
const failedPersistence = await requestStoragePersistence({
    persist: async () => {
        throw new Error('denied by test')
    },
})
assert.equal(failedPersistence.supported, true)
assert.equal(failedPersistence.persisted, false)
assert.deepEqual(failedPersistence.error, {
    name: 'Error',
    message: 'denied by test',
})

const legacyTracker = structuredClone(ultimateData)
const firstQuestion =
    legacyTracker.data.content[0].categoryList[0].questionList[0]
legacyTracker.data.header.darkMode = true
legacyTracker.data.header.completedQuestions = 1
legacyTracker.data.content[0].contentCompletedQuestions = 1
legacyTracker.data.content[0].categoryList[0].categoryCompletedQuestions = 1
firstQuestion.isDone = true
firstQuestion.completedAt = 1_796_684_400_000
firstQuestion.isBookmarked = true
firstQuestion.userNotes = 'Migrated note'

const legacyPlan = {
    schemaVersion: 1,
    id: 'plan-validation',
    name: 'Validation plan',
    status: 'active',
    startDate: '2026-09-21',
    topicIds: ['/array'],
    taskIds: [String(firstQuestion.questionId)],
    weeklyAvailability: { monday: 3 },
    schedule: { days: [] },
    taskStatuses: {},
}

const appStorageMemory = new Map([
    ['A2Z_Archive', JSON.stringify(legacyTracker)],
    ['A2Z_Planly_v2', JSON.stringify(legacyPlan)],
])
const appLocalStorage = {
    getItem: key => appStorageMemory.get(key) ?? null,
    setItem: (key, value) => appStorageMemory.set(key, String(value)),
    removeItem: key => appStorageMemory.delete(key),
}
const appDatabase = new Map()
const readAppState = async key => appDatabase.get(key)
const writeAppState = async (key, value) => {
    appDatabase.set(key, structuredClone(value))
    return true
}
const writeAppStates = async entries => {
    Object.entries(entries).forEach(([key, value]) => {
        appDatabase.set(key, structuredClone(value))
    })
    return true
}

const initialized = await initializeAppStorage(ultimateData, {
    storage: appLocalStorage,
    readState: readAppState,
    writeState: writeAppState,
    writeStates: writeAppStates,
})

assert.equal(initialized.mode, 'primary')
assert.equal(initialized.source, 'indexeddb')
assert.equal(initialized.tracker.data.header.darkMode, true)
assert.equal(
    initialized.tracker.data.content[0].categoryList[0].questionList[0].isDone,
    true
)
assert.equal(
    initialized.tracker.data.content[0].categoryList[0].questionList[0]
        .userNotes,
    'Migrated note'
)
assert.equal(initialized.planner.name, 'Validation plan')
assert.equal(appDatabase.get(STORAGE_KEYS.META).revision, 1)

const savedTracker = structuredClone(initialized.tracker)
savedTracker.data.header.isBookmarkFilterRequired = true
const firstSave = saveAppState(
    { tracker: savedTracker, planner: initialized.planner },
    { storage: appLocalStorage, writeStates: writeAppStates }
)
const newestTracker = structuredClone(savedTracker)
newestTracker.data.header.darkMode = false
const secondSave = saveAppState(
    { tracker: newestTracker, planner: null },
    { storage: appLocalStorage, writeStates: writeAppStates }
)

await Promise.all([firstSave, secondSave])
await flushAppStorage()

assert.equal(appDatabase.get(STORAGE_KEYS.TRACKER).data.header.darkMode, false)
assert.equal(appDatabase.get(STORAGE_KEYS.PLANNER), null)
assert.equal(appStorageMemory.has('A2Z_Planly_v2'), false)
const compatibilitySnapshot = readCompatibilitySnapshot(appLocalStorage)
assert.equal(compatibilitySnapshot.meta.pending, false)
assert.equal(
    compatibilitySnapshot.meta.revision,
    appDatabase.get(STORAGE_KEYS.META).revision
)

const reorderedBase = structuredClone(ultimateData)
const reorderedQuestions =
    reorderedBase.data.content[0].categoryList[0].questionList
reorderedBase.data.content[0].categoryList[0].questionList = [
    reorderedQuestions[1],
    reorderedQuestions[0],
    ...reorderedQuestions.slice(2),
]
const reorderedRestore = normalizeTrackerState(reorderedBase, legacyTracker)
const restoredById = new Map(
    reorderedRestore.tracker.data.content[0].categoryList[0].questionList.map(
        question => [question.questionId, question]
    )
)
assert.equal(restoredById.get(firstQuestion.questionId).isDone, true)
assert.equal(
    restoredById.get(firstQuestion.questionId).userNotes,
    'Migrated note'
)
assert.notEqual(
    reorderedRestore.tracker.data.content[0].categoryList[0].questionList[0]
        .questionId,
    firstQuestion.questionId
)

const movedBase = structuredClone(ultimateData)
const [movedQuestion] =
    movedBase.data.content[0].categoryList[0].questionList.splice(0, 1)
movedBase.data.content[1].categoryList[0].questionList.push(movedQuestion)
const movedRestore = normalizeTrackerState(movedBase, legacyTracker)
const movedRestoredQuestion = movedRestore.tracker.data.content
    .flatMap(topic => topic.categoryList)
    .flatMap(category => category.questionList)
    .find(question => question.questionId === firstQuestion.questionId)
assert.equal(movedRestoredQuestion.isDone, true)
assert.equal(movedRestoredQuestion.userNotes, 'Migrated note')

const oldPlan = { ...legacyPlan, name: 'Old mirror plan' }
await saveAppState(
    { tracker: newestTracker, planner: oldPlan },
    { storage: appLocalStorage, writeStates: writeAppStates }
)
const oldMeta = structuredClone(appDatabase.get(STORAGE_KEYS.META))
const newPlan = { ...legacyPlan, name: 'Newest database plan' }
const partiallyWrittenTracker = structuredClone(newestTracker)
partiallyWrittenTracker.data.header.darkMode = true
appDatabase.set(STORAGE_KEYS.TRACKER, structuredClone(partiallyWrittenTracker))
appDatabase.set(STORAGE_KEYS.PLANNER, structuredClone(newPlan))
appDatabase.set(STORAGE_KEYS.META, {
    ...oldMeta,
    revision: oldMeta.revision + 1,
    change: {
        id: 'database-newer',
        changedAt: 1,
        writerId: 'database',
        sequence: 1,
    },
})
appLocalStorage.setItem('A2Z_Archive', JSON.stringify(partiallyWrittenTracker))

const partialRecovery = await initializeAppStorage(ultimateData, {
    storage: appLocalStorage,
    readState: readAppState,
    writeState: writeAppState,
    writeStates: writeAppStates,
})
assert.equal(partialRecovery.tracker.data.header.darkMode, true)
assert.equal(partialRecovery.planner.name, 'Newest database plan')

function hashForMirror(value) {
    let hash = 2166136261
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index)
        hash = Math.imul(hash, 16777619)
    }
    return (hash >>> 0).toString(36)
}

const sharedTabTracker = structuredClone(partialRecovery.tracker)
const localTabTracker = structuredClone(partialRecovery.tracker)
const sharedQuestion =
    sharedTabTracker.data.content[0].categoryList[0].questionList[1]
const localQuestion =
    localTabTracker.data.content[0].categoryList[0].questionList[2]
sharedQuestion.isDone = true
sharedQuestion.completedAt = 101
localQuestion.isDone = true
localQuestion.completedAt = 102
const sharedTrackerJson = JSON.stringify(sharedTabTracker)
const sharedPlannerJson = appLocalStorage.getItem('A2Z_Planly_v2')
const sharedMirrorMeta = JSON.parse(appLocalStorage.getItem(V3_MIRROR_META_KEY))
appLocalStorage.setItem('A2Z_Archive', sharedTrackerJson)
appLocalStorage.setItem(
    V3_MIRROR_META_KEY,
    JSON.stringify({
        ...sharedMirrorMeta,
        revision: sharedMirrorMeta.revision + 1,
        pending: false,
        change: {
            id: 'other-tab',
            changedAt: Date.now() - 1,
            writerId: 'other-tab',
            sequence: 1,
        },
        trackerSignature: hashForMirror(sharedTrackerJson),
        plannerSignature: hashForMirror(sharedPlannerJson ?? ''),
    })
)

const mergedTabSave = await saveAppState(
    { tracker: localTabTracker, planner: partialRecovery.planner },
    { storage: appLocalStorage, writeStates: writeAppStates }
)
const mergedQuestions = new Map(
    mergedTabSave.tracker.data.content
        .flatMap(topic => topic.categoryList)
        .flatMap(category => category.questionList)
        .map(question => [question.questionId, question])
)
assert.equal(mergedTabSave.reconciled, true)
assert.equal(mergedQuestions.get(sharedQuestion.questionId).isDone, true)
assert.equal(mergedQuestions.get(localQuestion.questionId).isDone, true)
assert.equal(
    appDatabase.get(STORAGE_KEYS.TRACKER).data.header.completedQuestions,
    3
)

const sharedPlanner = structuredClone(mergedTabSave.planner)
const localPlanner = structuredClone(mergedTabSave.planner)
sharedPlanner.weeklyAvailability.monday = 4
localPlanner.weeklyAvailability.tuesday = 5
const otherTabPlannerJson = JSON.stringify(sharedPlanner)
const sharedTrackerAfterMerge = appLocalStorage.getItem('A2Z_Archive')
const sharedPlanMeta = JSON.parse(appLocalStorage.getItem(V3_MIRROR_META_KEY))
appLocalStorage.setItem('A2Z_Planly_v2', otherTabPlannerJson)
appLocalStorage.setItem(
    V3_MIRROR_META_KEY,
    JSON.stringify({
        ...sharedPlanMeta,
        revision: sharedPlanMeta.revision + 1,
        pending: false,
        change: {
            id: 'other-tab-plan',
            changedAt: Date.now() - 1,
            writerId: 'other-tab-plan',
            sequence: 1,
        },
        trackerSignature: hashForMirror(sharedTrackerAfterMerge),
        plannerSignature: hashForMirror(otherTabPlannerJson),
    })
)

const mergedPlanSave = await saveAppState(
    { tracker: mergedTabSave.tracker, planner: localPlanner },
    { storage: appLocalStorage, writeStates: writeAppStates }
)
assert.equal(mergedPlanSave.planner.weeklyAvailability.monday, 4)
assert.equal(mergedPlanSave.planner.weeklyAvailability.tuesday, 5)
assert.equal(mergedPlanSave.planner.needsScheduleRebuild, true)

const failedEverywhereTracker = structuredClone(mergedTabSave.tracker)
failedEverywhereTracker.data.header.isBookmarkFilterRequired = false
const failedEverywhere = await saveAppState(
    { tracker: failedEverywhereTracker, planner: mergedPlanSave.planner },
    {
        storage: {
            setItem: () => {
                throw new Error('local quota failure')
            },
            removeItem: () => {
                throw new Error('local quota failure')
            },
        },
        writeStates: async () => {
            throw new Error('database failure')
        },
    }
)
assert.equal(failedEverywhere.mode, 'degraded')
assert.equal(failedEverywhere.mirrored, false)

const retryAfterFailure = await saveAppState(
    { tracker: failedEverywhereTracker, planner: mergedPlanSave.planner },
    { storage: appLocalStorage, writeStates: writeAppStates }
)
assert.equal(retryAfterFailure.skipped, false)
assert.equal(retryAfterFailure.mode, 'primary')

console.log('Storage validation passed.')
