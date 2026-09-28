import { getState, setState, STORAGE_KEYS } from './indexedDbStorage.js'

export const V2_LOCAL_STORAGE_KEYS = Object.freeze({
    [STORAGE_KEYS.TRACKER]: 'A2Z_Archive',
    [STORAGE_KEYS.PLANNER]: 'A2Z_Planly_v2',
})

export const V2_MIGRATION_ID = 'v2LocalStorage'

function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function safeIssue(code, key, error) {
    return {
        code,
        key,
        message:
            error instanceof Error && error.message
                ? error.message
                : 'The stored value could not be read.',
    }
}

function resolveLocalStorage(storage) {
    if (storage !== undefined) return storage

    try {
        return globalThis.localStorage ?? null
    } catch {
        return null
    }
}

export function inspectV2LocalStorage(storage) {
    const source = resolveLocalStorage(storage)
    const records = {}
    const issues = []

    if (!source || typeof source.getItem !== 'function') {
        return { available: false, records, issues }
    }

    for (const [targetKey, sourceKey] of Object.entries(
        V2_LOCAL_STORAGE_KEYS
    )) {
        let serialized

        try {
            serialized = source.getItem(sourceKey)
        } catch (error) {
            issues.push(safeIssue('read-failed', sourceKey, error))
            continue
        }

        if (serialized === null) continue

        try {
            const value = JSON.parse(serialized)

            if (!isRecord(value)) {
                issues.push(
                    safeIssue(
                        'invalid-shape',
                        sourceKey,
                        new TypeError('Expected a saved state object.')
                    )
                )
                continue
            }

            records[targetKey] = value
        } catch (error) {
            issues.push(safeIssue('invalid-json', sourceKey, error))
        }
    }

    return { available: true, records, issues }
}

function resolveStateAccess(readState, writeState, indexedDb) {
    return {
        read:
            readState ??
            (key => getState(key, indexedDb ? { indexedDb } : undefined)),
        write:
            writeState ??
            ((key, value) =>
                setState(key, value, indexedDb ? { indexedDb } : undefined)),
    }
}

export async function migrateV2LocalStorage({
    storage,
    indexedDb,
    readState,
    writeState,
    now = () => new Date().toISOString(),
    force = false,
} = {}) {
    const { read, write } = resolveStateAccess(readState, writeState, indexedDb)
    const existingMeta = await read(STORAGE_KEYS.META)
    const meta = isRecord(existingMeta) ? existingMeta : {}
    const previousMigration = meta.migrations?.[V2_MIGRATION_ID]

    if (!force && previousMigration?.completedAt) {
        return {
            alreadyMigrated: true,
            importedKeys: [],
            skippedKeys: [],
            issues: previousMigration.issues ?? [],
        }
    }

    const snapshot = inspectV2LocalStorage(storage)
    const importedKeys = []
    const skippedKeys = []

    for (const [key, value] of Object.entries(snapshot.records)) {
        const currentValue = await read(key)

        if (currentValue !== undefined) {
            skippedKeys.push(key)
            continue
        }

        await write(key, value)
        importedKeys.push(key)
    }

    const completedAt = now()
    const migration = {
        completedAt,
        sourceAvailable: snapshot.available,
        importedKeys,
        skippedKeys,
        issues: snapshot.issues,
    }

    await write(STORAGE_KEYS.META, {
        ...meta,
        schemaVersion: 1,
        updatedAt: completedAt,
        migrations: {
            ...(isRecord(meta.migrations) ? meta.migrations : {}),
            [V2_MIGRATION_ID]: migration,
        },
    })

    return {
        alreadyMigrated: false,
        ...migration,
    }
}
