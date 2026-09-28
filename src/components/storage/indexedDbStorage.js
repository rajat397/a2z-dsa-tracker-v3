export const STORAGE_DATABASE_NAME = 'a2z-tracker-v3'
export const STORAGE_DATABASE_VERSION = 1
export const STORAGE_STORE_NAME = 'state'

export const STORAGE_KEYS = Object.freeze({
    TRACKER: 'tracker',
    PLANNER: 'planner',
    META: 'meta',
})

const ALLOWED_KEYS = new Set(Object.values(STORAGE_KEYS))

export class TrackerStorageError extends Error {
    constructor(code, message, options = {}) {
        super(message, options)
        this.name = 'TrackerStorageError'
        this.code = code
    }
}

function storageError(code, message, cause) {
    if (cause instanceof TrackerStorageError) return cause

    return new TrackerStorageError(code, message, { cause })
}

function validateKey(key) {
    if (!ALLOWED_KEYS.has(key)) {
        throw new TrackerStorageError(
            'invalid-key',
            `Unknown tracker storage key: ${String(key)}`
        )
    }
}

function resolveIndexedDb(indexedDb) {
    const factory = indexedDb ?? globalThis.indexedDB

    if (!factory || typeof factory.open !== 'function') {
        throw new TrackerStorageError(
            'unavailable',
            'IndexedDB is not available in this browser context.'
        )
    }

    return factory
}

export function openStateDatabase({ indexedDb } = {}) {
    let factory

    try {
        factory = resolveIndexedDb(indexedDb)
    } catch (error) {
        return Promise.reject(error)
    }

    return new Promise((resolve, reject) => {
        let settled = false
        let request

        try {
            request = factory.open(
                STORAGE_DATABASE_NAME,
                STORAGE_DATABASE_VERSION
            )
        } catch (error) {
            reject(
                storageError(
                    'open-failed',
                    'The tracker database could not be opened.',
                    error
                )
            )
            return
        }

        request.onupgradeneeded = () => {
            const database = request.result

            if (!database.objectStoreNames.contains(STORAGE_STORE_NAME)) {
                database.createObjectStore(STORAGE_STORE_NAME)
            }
        }

        request.onerror = () => {
            if (settled) return
            settled = true
            reject(
                storageError(
                    'open-failed',
                    'The tracker database could not be opened.',
                    request.error
                )
            )
        }

        request.onblocked = () => {
            if (settled) return
            settled = true
            reject(
                new TrackerStorageError(
                    'upgrade-blocked',
                    'Another tracker tab is blocking the database upgrade.'
                )
            )
        }

        request.onsuccess = () => {
            const database = request.result

            if (settled) {
                database.close()
                return
            }

            settled = true
            database.onversionchange = () => database.close()
            resolve(database)
        }
    })
}

async function runStateRequest(mode, operation, options) {
    const database = await openStateDatabase(options)

    return new Promise((resolve, reject) => {
        let result
        let settled = false
        let transaction

        const finish = callback => value => {
            if (settled) return
            settled = true
            database.close()
            callback(value)
        }

        const succeed = finish(resolve)
        const fail = finish(reject)

        try {
            transaction = database.transaction(STORAGE_STORE_NAME, mode)
            const store = transaction.objectStore(STORAGE_STORE_NAME)
            const request = operation(store)

            request.onsuccess = () => {
                result = request.result
            }

            request.onerror = () => {
                fail(
                    storageError(
                        'request-failed',
                        'The tracker database operation failed.',
                        request.error
                    )
                )
            }

            transaction.oncomplete = () => succeed(result)
            transaction.onerror = () => {
                fail(
                    storageError(
                        'transaction-failed',
                        'The tracker database transaction failed.',
                        transaction.error
                    )
                )
            }
            transaction.onabort = () => {
                fail(
                    storageError(
                        'transaction-aborted',
                        'The tracker database transaction was aborted.',
                        transaction.error
                    )
                )
            }
        } catch (error) {
            try {
                transaction?.abort()
            } catch {
                // The transaction may already be inactive.
            }

            fail(
                storageError(
                    'operation-failed',
                    'The tracker database operation could not start.',
                    error
                )
            )
        }
    })
}

function normalizeEntries(entries) {
    if (!entries || typeof entries !== 'object' || Array.isArray(entries)) {
        throw new TrackerStorageError(
            'invalid-value',
            'Tracker storage entries must be an object.'
        )
    }

    const normalizedEntries = Object.entries(entries)
    normalizedEntries.forEach(([key, value]) => {
        validateKey(key)
        if (value === undefined) {
            throw new TrackerStorageError(
                'invalid-value',
                'Undefined cannot be saved as tracker state.'
            )
        }
    })

    return normalizedEntries
}

function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function compareStorageChanges(left, right) {
    if (!isRecord(left) && !isRecord(right)) return 0
    if (!isRecord(left)) return -1
    if (!isRecord(right)) return 1

    if (left.writerId === right.writerId) {
        const sequenceDifference =
            (Number(left.sequence) || 0) - (Number(right.sequence) || 0)
        if (sequenceDifference !== 0) return Math.sign(sequenceDifference)
    }

    const timeDifference =
        (Number(left.changedAt) || 0) - (Number(right.changedAt) || 0)
    if (timeDifference !== 0) return Math.sign(timeDifference)

    return String(left.id ?? '').localeCompare(String(right.id ?? ''))
}

export async function commitStates(entries, proposedMeta, options = {}) {
    const normalizedEntries = normalizeEntries(entries)
    if (!isRecord(proposedMeta)) {
        throw new TrackerStorageError(
            'invalid-value',
            'Tracker storage metadata must be an object.'
        )
    }

    const database = await openStateDatabase(options)

    return new Promise((resolve, reject) => {
        let settled = false
        let transaction
        let result

        const finish = callback => value => {
            if (settled) return
            settled = true
            database.close()
            callback(value)
        }

        const succeed = finish(resolve)
        const fail = finish(reject)

        try {
            transaction = database.transaction(STORAGE_STORE_NAME, 'readwrite')
            const store = transaction.objectStore(STORAGE_STORE_NAME)
            const keysToRead = new Set([
                STORAGE_KEYS.META,
                ...normalizedEntries.map(([key]) => key),
            ])
            const currentEntries = {}
            let remainingReads = keysToRead.size

            const commitAfterReads = () => {
                remainingReads -= 1
                if (remainingReads > 0) return

                const existingMeta = isRecord(currentEntries[STORAGE_KEYS.META])
                    ? currentEntries[STORAGE_KEYS.META]
                    : {}
                const candidateChange = proposedMeta.change
                const existingChange = existingMeta.change

                if (
                    candidateChange &&
                    existingChange &&
                    compareStorageChanges(candidateChange, existingChange) <= 0
                ) {
                    result = {
                        committed: false,
                        entries: currentEntries,
                        meta: existingMeta,
                    }
                    return
                }

                let entriesToCommit = Object.fromEntries(normalizedEntries)
                if (typeof options.mergeEntries === 'function') {
                    entriesToCommit = options.mergeEntries(
                        currentEntries,
                        entriesToCommit
                    )
                }
                const mergedEntries = normalizeEntries(entriesToCommit)

                const meta = {
                    ...existingMeta,
                    ...proposedMeta,
                    revision: (Number(existingMeta.revision) || 0) + 1,
                }

                mergedEntries.forEach(([key, value]) => {
                    if (key !== STORAGE_KEYS.META) store.put(value, key)
                })
                store.put(meta, STORAGE_KEYS.META)
                result = {
                    committed: true,
                    entries: Object.fromEntries(mergedEntries),
                    meta,
                }
            }

            keysToRead.forEach(key => {
                const request = store.get(key)

                request.onsuccess = () => {
                    currentEntries[key] = request.result
                    commitAfterReads()
                }
                request.onerror = () => {
                    fail(
                        storageError(
                            'request-failed',
                            'The tracker database state could not be read.',
                            request.error
                        )
                    )
                }
            })
            transaction.oncomplete = () => succeed(result)
            transaction.onerror = () => {
                fail(
                    storageError(
                        'transaction-failed',
                        'The tracker database transaction failed.',
                        transaction.error
                    )
                )
            }
            transaction.onabort = () => {
                fail(
                    storageError(
                        'transaction-aborted',
                        'The tracker database transaction was aborted.',
                        transaction.error
                    )
                )
            }
        } catch (error) {
            try {
                transaction?.abort()
            } catch {
                // The transaction may already be inactive.
            }

            fail(
                storageError(
                    'operation-failed',
                    'The tracker database operation could not start.',
                    error
                )
            )
        }
    })
}

export async function setStates(entries, options = {}) {
    const normalizedEntries = normalizeEntries(entries)
    const database = await openStateDatabase(options)

    return new Promise((resolve, reject) => {
        let settled = false
        let transaction

        const finish = callback => value => {
            if (settled) return
            settled = true
            database.close()
            callback(value)
        }

        const succeed = finish(resolve)
        const fail = finish(reject)

        try {
            transaction = database.transaction(STORAGE_STORE_NAME, 'readwrite')
            const store = transaction.objectStore(STORAGE_STORE_NAME)

            normalizedEntries.forEach(([key, value]) => {
                store.put(value, key)
            })

            transaction.oncomplete = () => succeed(true)
            transaction.onerror = () => {
                fail(
                    storageError(
                        'transaction-failed',
                        'The tracker database transaction failed.',
                        transaction.error
                    )
                )
            }
            transaction.onabort = () => {
                fail(
                    storageError(
                        'transaction-aborted',
                        'The tracker database transaction was aborted.',
                        transaction.error
                    )
                )
            }
        } catch (error) {
            try {
                transaction?.abort()
            } catch {
                // The transaction may already be inactive.
            }

            fail(
                storageError(
                    'operation-failed',
                    'The tracker database operation could not start.',
                    error
                )
            )
        }
    })
}

export async function getState(key, options = {}) {
    validateKey(key)
    return runStateRequest('readonly', store => store.get(key), options)
}

export async function setState(key, value, options = {}) {
    validateKey(key)

    if (value === undefined) {
        throw new TrackerStorageError(
            'invalid-value',
            'Undefined cannot be saved as tracker state.'
        )
    }

    await setStates({ [key]: value }, options)
    return true
}

export async function deleteState(key, options = {}) {
    validateKey(key)
    await runStateRequest('readwrite', store => store.delete(key), options)
    return true
}
