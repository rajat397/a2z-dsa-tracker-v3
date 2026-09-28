function resolveStorageManager(storageManager) {
    if (storageManager !== undefined) return storageManager

    try {
        return globalThis.navigator?.storage ?? null
    } catch {
        return null
    }
}

function safeError(error) {
    return {
        name: error instanceof Error ? error.name : 'Error',
        message:
            error instanceof Error && error.message
                ? error.message
                : 'The browser storage request failed.',
    }
}

export async function getStoragePersistenceStatus(storageManager) {
    const manager = resolveStorageManager(storageManager)

    if (!manager || typeof manager.persisted !== 'function') {
        return { supported: false, persisted: false, error: null }
    }

    try {
        return {
            supported: true,
            persisted: Boolean(await manager.persisted()),
            error: null,
        }
    } catch (error) {
        return {
            supported: true,
            persisted: false,
            error: safeError(error),
        }
    }
}

export async function requestStoragePersistence(storageManager) {
    const manager = resolveStorageManager(storageManager)

    if (!manager || typeof manager.persist !== 'function') {
        return { supported: false, persisted: false, error: null }
    }

    try {
        return {
            supported: true,
            persisted: Boolean(await manager.persist()),
            error: null,
        }
    } catch (error) {
        return {
            supported: true,
            persisted: false,
            error: safeError(error),
        }
    }
}
