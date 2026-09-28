import { TASK_STATUS } from './createSchedule.js'

export const PLANNER_STORAGE_KEY = 'A2Z_Planly_v2'
export const PLANNER_SCHEMA_VERSION = 1

const VALID_TASK_STATUSES = new Set(Object.values(TASK_STATUS))

export function isPlannerState(state) {
    return (
        state &&
        typeof state === 'object' &&
        !Array.isArray(state) &&
        state.schemaVersion === PLANNER_SCHEMA_VERSION &&
        typeof state.name === 'string' &&
        typeof state.status === 'string' &&
        typeof state.startDate === 'string' &&
        Array.isArray(state.topicIds) &&
        Array.isArray(state.taskIds) &&
        state.weeklyAvailability &&
        typeof state.weeklyAvailability === 'object' &&
        state.schedule &&
        typeof state.schedule === 'object' &&
        Array.isArray(state.schedule.days) &&
        state.taskStatuses &&
        typeof state.taskStatuses === 'object'
    )
}

function availableStorage(storage) {
    if (storage !== undefined) return storage
    return globalThis.localStorage ?? null
}

export function loadPlannerState(storage) {
    const targetStorage = availableStorage(storage)
    if (!targetStorage) return null

    const serializedState = targetStorage.getItem(PLANNER_STORAGE_KEY)
    if (!serializedState) return null

    try {
        const state = JSON.parse(serializedState)
        return isPlannerState(state) ? state : null
    } catch {
        return null
    }
}

export function savePlannerState(state, storage) {
    if (state === null || typeof state !== 'object' || Array.isArray(state)) {
        throw new TypeError('Planner state must be an object')
    }

    const targetStorage = availableStorage(storage)
    if (!targetStorage) return false

    targetStorage.setItem(
        PLANNER_STORAGE_KEY,
        JSON.stringify({
            ...state,
            schemaVersion: PLANNER_SCHEMA_VERSION,
        })
    )
    return true
}

export function clearPlannerState(storage) {
    const targetStorage = availableStorage(storage)
    if (!targetStorage) return false

    targetStorage.removeItem(PLANNER_STORAGE_KEY)
    return true
}

export function withTaskStatus(state, taskId, status, details = {}) {
    if (state === null || typeof state !== 'object' || Array.isArray(state)) {
        throw new TypeError('Planner state must be an object')
    }

    if (!VALID_TASK_STATUSES.has(status)) {
        throw new RangeError(`Unsupported planner status: ${status}`)
    }

    if (
        taskId === undefined ||
        taskId === null ||
        String(taskId).trim() === ''
    ) {
        throw new TypeError('taskId is required')
    }

    const id = String(taskId)

    return {
        ...state,
        taskStatuses: {
            ...state.taskStatuses,
            [id]: {
                ...details,
                status,
            },
        },
    }
}
