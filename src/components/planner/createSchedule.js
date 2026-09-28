export const DAYS_OF_WEEK = Object.freeze([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
])

export const TASK_STATUS = Object.freeze({
    NOT_STARTED: 'not_started',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    SKIPPED: 'skipped',
    MOVED_TO_NEXT_DAY: 'moved_to_next_day',
    BACKLOG: 'backlog',
    PLANNED: 'not_started',
    CARRIED: 'moved_to_next_day',
})

export const DEFAULT_DIFFICULTY_MINUTES = Object.freeze({
    easy: 25,
    basic: 25,
    medium: 40,
    core: 40,
    hard: 50,
    pro: 50,
})

const VALID_TASK_STATUSES = new Set(Object.values(TASK_STATUS))
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function parseDate(date, fieldName = 'date') {
    if (typeof date !== 'string' || !DATE_PATTERN.test(date)) {
        throw new TypeError(`${fieldName} must use YYYY-MM-DD format`)
    }

    const [year, month, day] = date.split('-').map(Number)
    const parsed = new Date(Date.UTC(year, month - 1, day))

    if (
        parsed.getUTCFullYear() !== year ||
        parsed.getUTCMonth() !== month - 1 ||
        parsed.getUTCDate() !== day
    ) {
        throw new RangeError(`${fieldName} must be a valid calendar date`)
    }

    return parsed
}

function dateKey(date) {
    return date.toISOString().slice(0, 10)
}

function addDays(date, numberOfDays) {
    const nextDate = new Date(date)
    nextDate.setUTCDate(nextDate.getUTCDate() + numberOfDays)
    return nextDate
}

function daysBetween(startDate, endDate) {
    return Math.floor((endDate - startDate) / 86_400_000)
}

function dayName(date) {
    return DAYS_OF_WEEK[(date.getUTCDay() + 6) % 7]
}

function availabilityValue(weeklyAvailability, day, index) {
    if (Array.isArray(weeklyAvailability)) {
        return weeklyAvailability[index]
    }

    return weeklyAvailability?.[day] ?? weeklyAvailability?.[day.toLowerCase()]
}

export function normalizeWeeklyAvailability(weeklyAvailability) {
    if (
        !Array.isArray(weeklyAvailability) &&
        (weeklyAvailability === null || typeof weeklyAvailability !== 'object')
    ) {
        throw new TypeError(
            'weeklyAvailability must be an object or a Monday-Sunday array'
        )
    }

    if (
        Array.isArray(weeklyAvailability) &&
        weeklyAvailability.length !== DAYS_OF_WEEK.length
    ) {
        throw new RangeError(
            'weeklyAvailability arrays must contain exactly seven values'
        )
    }

    return Object.fromEntries(
        DAYS_OF_WEEK.map((day, index) => {
            const hours = availabilityValue(weeklyAvailability, day, index)

            if (!Number.isInteger(hours) || hours < 0 || hours > 16) {
                throw new RangeError(
                    `${day} availability must be an integer from 0 to 16 hours`
                )
            }

            return [day, hours]
        })
    )
}

function normalizeDateAvailabilityOverrides(dateAvailabilityOverrides = {}) {
    if (
        dateAvailabilityOverrides === null ||
        typeof dateAvailabilityOverrides !== 'object' ||
        Array.isArray(dateAvailabilityOverrides)
    ) {
        throw new TypeError('dateAvailabilityOverrides must be an object')
    }

    return Object.fromEntries(
        Object.entries(dateAvailabilityOverrides).map(([date, hours]) => {
            parseDate(date, 'availability override date')
            if (!Number.isInteger(hours) || hours < 0 || hours > 16) {
                throw new RangeError(
                    `${date} availability override must be an integer from 0 to 16 hours`
                )
            }
            return [date, hours]
        })
    )
}

function taskId(task, index) {
    const id = task.questionId ?? task.id

    if (id === undefined || id === null || String(id).trim() === '') {
        throw new TypeError(
            `Task at index ${index} must have an id or questionId`
        )
    }

    return String(id)
}

function taskEstimate(task, difficultyMinutes) {
    const explicitEstimate =
        task.estimatedMinutes ?? task.durationMinutes ?? task.minutes

    if (explicitEstimate !== undefined) {
        if (!Number.isInteger(explicitEstimate) || explicitEstimate <= 0) {
            throw new RangeError(
                'Task estimates must be positive whole minutes'
            )
        }

        return explicitEstimate
    }

    const difficulty = String(task.difficulty ?? task.level ?? '').toLowerCase()
    const estimate = difficultyMinutes[difficulty]

    if (!Number.isInteger(estimate) || estimate <= 0) {
        throw new TypeError(
            `Task "${task.questionHeading ?? task.title ?? task.id}" needs an estimatedMinutes value or a supported difficulty`
        )
    }

    return estimate
}

function statusEntry(taskStatuses, id) {
    const entry =
        taskStatuses instanceof Map ? taskStatuses.get(id) : taskStatuses?.[id]

    if (
        entry !== undefined &&
        entry !== null &&
        typeof entry !== 'string' &&
        (typeof entry !== 'object' || Array.isArray(entry))
    ) {
        throw new TypeError(`Invalid planner status for task "${id}"`)
    }

    const normalized =
        typeof entry === 'string' ? { status: entry } : { ...entry }
    const status = normalized.status ?? TASK_STATUS.NOT_STARTED

    if (!VALID_TASK_STATUSES.has(status)) {
        throw new RangeError(`Unsupported planner status for task "${id}"`)
    }

    return { ...normalized, status }
}

function orderedAssignments(tasks, taskStatuses, difficultyMinutes) {
    if (!Array.isArray(tasks)) {
        throw new TypeError('tasks must be an array')
    }

    const seenTaskIds = new Set()

    return tasks.flatMap((task, index) => {
        const id = taskId(task, index)

        if (seenTaskIds.has(id)) {
            throw new Error(`Duplicate task id: ${id}`)
        }
        seenTaskIds.add(id)

        const statusDetails = statusEntry(taskStatuses, id)
        const isCompleted =
            task.isDone === true ||
            task.completed === true ||
            statusDetails.status === TASK_STATUS.COMPLETED
        const isDeferred =
            statusDetails.status === TASK_STATUS.BACKLOG ||
            statusDetails.status === TASK_STATUS.SKIPPED

        if (isCompleted || isDeferred) return []

        return [
            {
                ...task,
                taskId: id,
                sourceIndex: index,
                estimatedMinutes: taskEstimate(task, difficultyMinutes),
                plannerStatus: statusDetails.status,
                ...(statusDetails.carriedFrom
                    ? { carriedFrom: statusDetails.carriedFrom }
                    : {}),
            },
        ]
    })
}

function scheduleSummary(schedule) {
    const scheduledTasks = schedule.days.reduce(
        (total, day) => total + day.tasks.length,
        0
    )
    const totalPlannedMinutes = schedule.days.reduce(
        (total, day) => total + day.plannedMinutes,
        0
    )

    return {
        ...schedule,
        endDate: schedule.days.at(-1)?.date ?? null,
        scheduledTasks,
        totalTasks: scheduledTasks + schedule.unscheduledTasks.length,
        totalPlannedMinutes,
    }
}

export function createSchedule({
    tasks,
    weeklyAvailability,
    startDate,
    taskStatuses = {},
    difficultyMinutes = DEFAULT_DIFFICULTY_MINUTES,
    dateAvailabilityOverrides = {},
}) {
    const normalizedAvailability =
        normalizeWeeklyAvailability(weeklyAvailability)
    const parsedStartDate = parseDate(startDate, 'startDate')
    const normalizedOverrides = normalizeDateAvailabilityOverrides(
        dateAvailabilityOverrides
    )
    const assignments = orderedAssignments(
        tasks,
        taskStatuses,
        difficultyMinutes
    )
    const availableDaysPerWeek = Object.values(normalizedAvailability).filter(
        hours => hours > 0
    ).length

    const schedule = {
        startDate,
        sprintLengthDays: 7,
        weeklyAvailability: normalizedAvailability,
        dateAvailabilityOverrides: normalizedOverrides,
        days: [],
        unscheduledTasks: [],
    }

    if (assignments.length === 0) return scheduleSummary(schedule)

    if (availableDaysPerWeek === 0) {
        schedule.unscheduledTasks = assignments.map(task => ({
            ...task,
            plannerStatus: TASK_STATUS.BACKLOG,
            unscheduledReason: 'no-available-days',
        }))
        return scheduleSummary(schedule)
    }

    let cursor = 0
    let currentDate = parsedStartDate
    const maximumCalendarDays =
        Math.ceil(assignments.length / availableDaysPerWeek) * 7 + 7

    while (
        cursor < assignments.length &&
        daysBetween(parsedStartDate, currentDate) < maximumCalendarDays
    ) {
        const name = dayName(currentDate)
        const currentDateKey = dateKey(currentDate)
        const availableHours =
            normalizedOverrides[currentDateKey] ?? normalizedAvailability[name]
        const capacityMinutes = availableHours * 60
        const scheduledForDay = []
        let plannedMinutes = 0

        if (capacityMinutes > 0) {
            while (cursor < assignments.length) {
                const task = assignments[cursor]
                const fits =
                    plannedMinutes + task.estimatedMinutes <= capacityMinutes
                const needsItsOwnDay =
                    plannedMinutes === 0 &&
                    task.estimatedMinutes > capacityMinutes

                if (!fits && !needsItsOwnDay) break

                scheduledForDay.push(task)
                plannedMinutes += task.estimatedMinutes
                cursor += 1

                if (needsItsOwnDay) break
            }
        }

        const calendarOffset = daysBetween(parsedStartDate, currentDate)
        schedule.days.push({
            date: currentDateKey,
            dayOfWeek: name,
            sprintNumber: Math.floor(calendarOffset / 7) + 1,
            sprintDay: (calendarOffset % 7) + 1,
            availableHours,
            capacityMinutes,
            isDayOff: capacityMinutes === 0,
            plannedMinutes,
            remainingMinutes: Math.max(0, capacityMinutes - plannedMinutes),
            isOverCapacity: plannedMinutes > capacityMinutes,
            tasks: scheduledForDay,
        })

        currentDate = addDays(currentDate, 1)
    }

    if (cursor < assignments.length) {
        schedule.unscheduledTasks = assignments.slice(cursor).map(task => ({
            ...task,
            plannerStatus: TASK_STATUS.BACKLOG,
            unscheduledReason: 'schedule-limit-reached',
        }))
    }

    return scheduleSummary(schedule)
}

export function rebuildRemainingSchedule({
    tasks,
    weeklyAvailability,
    fromDate,
    existingSchedule,
    taskStatuses = {},
    difficultyMinutes = DEFAULT_DIFFICULTY_MINUTES,
    dateAvailabilityOverrides = {},
}) {
    parseDate(fromDate, 'fromDate')

    const previousDates = new Map()
    for (const day of existingSchedule?.days ?? []) {
        for (const task of day.tasks ?? []) {
            const id = String(task.taskId ?? task.questionId ?? task.id)
            if (!previousDates.has(id)) previousDates.set(id, day.date)
        }
    }

    const rebuiltStatuses =
        taskStatuses instanceof Map
            ? Object.fromEntries(taskStatuses)
            : { ...taskStatuses }
    const carriedTaskIds = []

    tasks.forEach((task, index) => {
        const id = taskId(task, index)
        const currentStatus = statusEntry(taskStatuses, id)
        const wasCompleted =
            task.isDone === true ||
            task.completed === true ||
            currentStatus.status === TASK_STATUS.COMPLETED
        const previousDate = previousDates.get(id)

        const canCarry =
            currentStatus.status !== TASK_STATUS.BACKLOG &&
            currentStatus.status !== TASK_STATUS.SKIPPED

        if (
            !wasCompleted &&
            canCarry &&
            previousDate &&
            previousDate < fromDate
        ) {
            rebuiltStatuses[id] = {
                ...currentStatus,
                status: TASK_STATUS.CARRIED,
                carriedFrom: previousDate,
            }
            carriedTaskIds.push(id)
        }
    })

    return {
        ...createSchedule({
            tasks,
            weeklyAvailability,
            startDate: fromDate,
            taskStatuses: rebuiltStatuses,
            difficultyMinutes,
            dateAvailabilityOverrides,
        }),
        rebuildFrom: fromDate,
        carriedTaskIds,
    }
}
