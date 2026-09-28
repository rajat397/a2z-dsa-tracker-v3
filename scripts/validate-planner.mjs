import assert from 'node:assert/strict'

import trackerData from '../src/components/common/enhancedData.js'
import questionDifficultyById from '../src/components/common/questionDifficultyById.js'
import {
    createSchedule,
    rebuildRemainingSchedule,
    TASK_STATUS,
} from '../src/components/planner/createSchedule.js'
import {
    clearPlannerState,
    loadPlannerState,
    PLANNER_STORAGE_KEY,
    savePlannerState,
    withTaskStatus,
} from '../src/components/planner/plannerStorage.js'
import { flattenPlannerQuestions } from '../src/components/planner/plannerData.js'
import { createDefaultAvailability } from '../src/components/planner/ui/plannerUi.js'

assert.deepEqual(createDefaultAvailability(), {
    monday: 3,
    tuesday: 3,
    wednesday: 3,
    thursday: 3,
    friday: 3,
    saturday: 5,
    sunday: 5,
})

const availability = {
    Monday: 1,
    Tuesday: 0,
    Wednesday: 1,
    Thursday: 0,
    Friday: 1,
    Saturday: 1,
    Sunday: 0,
}

const tasks = [
    { id: 'easy', difficulty: 'Easy' },
    { id: 'medium', difficulty: 'Medium' },
    { id: 'hard', difficulty: 'Hard' },
    { id: 'oversized', estimatedMinutes: 70 },
    { id: 'done-in-sheet', difficulty: 'Easy', isDone: true },
    { id: 'done-in-plan', difficulty: 'Hard' },
]

const schedule = createSchedule({
    tasks,
    weeklyAvailability: availability,
    startDate: '2026-09-21',
    taskStatuses: {
        'done-in-plan': TASK_STATUS.COMPLETED,
    },
})

assert.deepEqual(
    schedule.days.flatMap(day => day.tasks.map(task => task.taskId)),
    ['easy', 'medium', 'hard', 'oversized']
)
assert.equal(schedule.days[0].plannedMinutes, 25)
assert.equal(schedule.days[1].isDayOff, true)
assert.equal(schedule.days[2].plannedMinutes, 40)
assert.equal(schedule.days[4].plannedMinutes, 50)
assert.equal(schedule.days[5].plannedMinutes, 70)
assert.equal(schedule.days[5].isOverCapacity, true)
assert.equal(schedule.unscheduledTasks.length, 0)

const secondSprint = createSchedule({
    tasks: Array.from({ length: 5 }, (_, index) => ({
        id: `sprint-${index}`,
        estimatedMinutes: 60,
    })),
    weeklyAvailability: availability,
    startDate: '2026-09-21',
})
assert.equal(secondSprint.days.at(-1).sprintNumber, 2)
assert.equal(secondSprint.days.at(-1).date, '2026-09-28')

const noAvailability = createSchedule({
    tasks: [{ id: 'backlog', difficulty: 'Core' }],
    weeklyAvailability: Array(7).fill(0),
    startDate: '2026-09-21',
})
assert.equal(noAvailability.days.length, 0)
assert.equal(noAvailability.unscheduledTasks[0].plannerStatus, 'backlog')

const oneTimeCatchUp = createSchedule({
    tasks: [
        { id: 'monday-full', estimatedMinutes: 60 },
        { id: 'tuesday-catch-up', estimatedMinutes: 60 },
    ],
    weeklyAvailability: availability,
    dateAvailabilityOverrides: { '2026-09-22': 1 },
    startDate: '2026-09-21',
})
assert.equal(oneTimeCatchUp.days[1].dayOfWeek, 'Tuesday')
assert.equal(oneTimeCatchUp.days[1].isDayOff, false)
assert.equal(oneTimeCatchUp.days[1].tasks[0].taskId, 'tuesday-catch-up')

const originalSchedule = createSchedule({
    tasks: [
        { id: 'first', estimatedMinutes: 40 },
        { id: 'second', estimatedMinutes: 40 },
        { id: 'third', estimatedMinutes: 40 },
    ],
    weeklyAvailability: availability,
    startDate: '2026-09-21',
})
const rebuiltSchedule = rebuildRemainingSchedule({
    tasks: [
        { id: 'first', estimatedMinutes: 40 },
        { id: 'second', estimatedMinutes: 40 },
        { id: 'third', estimatedMinutes: 40 },
    ],
    weeklyAvailability: availability,
    fromDate: '2026-09-25',
    existingSchedule: originalSchedule,
    taskStatuses: { first: TASK_STATUS.COMPLETED },
})

assert.deepEqual(rebuiltSchedule.carriedTaskIds, ['second'])
assert.equal(rebuiltSchedule.days[0].tasks[0].taskId, 'second')
assert.equal(
    rebuiltSchedule.days[0].tasks[0].plannerStatus,
    'moved_to_next_day'
)
assert.equal(rebuiltSchedule.days[0].tasks[0].carriedFrom, '2026-09-23')
assert.equal(rebuiltSchedule.days[1].tasks[0].taskId, 'third')

const backlogRebuild = rebuildRemainingSchedule({
    tasks: [
        { id: 'backlog-old', estimatedMinutes: 40 },
        { id: 'normal-old', estimatedMinutes: 40 },
    ],
    weeklyAvailability: {
        Monday: 1,
        Tuesday: 1,
        Wednesday: 1,
        Thursday: 1,
        Friday: 1,
        Saturday: 1,
        Sunday: 1,
    },
    fromDate: '2026-09-21',
    existingSchedule: {
        days: [
            {
                date: '2026-09-20',
                tasks: [{ taskId: 'backlog-old' }, { taskId: 'normal-old' }],
            },
        ],
    },
    taskStatuses: { 'backlog-old': TASK_STATUS.BACKLOG },
})
assert.deepEqual(
    backlogRebuild.days.flatMap(day => day.tasks.map(task => task.taskId)),
    ['normal-old']
)
assert.deepEqual(backlogRebuild.carriedTaskIds, ['normal-old'])

assert.throws(
    () =>
        createSchedule({
            tasks: [{ id: 'invalid', difficulty: 'Easy' }],
            weeklyAvailability: { ...availability, Monday: 1.5 },
            startDate: '2026-09-21',
        }),
    /integer from 0 to 16/
)

const memory = new Map()
const storage = {
    getItem: key => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
    removeItem: key => memory.delete(key),
}
const plannerState = withTaskStatus(
    {
        name: 'Validation plan',
        status: 'active',
        startDate: '2026-09-21',
        topicIds: [],
        taskIds: ['easy'],
        weeklyAvailability: availability,
        schedule: { days: [] },
        taskStatuses: {},
    },
    'easy',
    TASK_STATUS.BACKLOG
)

assert.equal(savePlannerState(plannerState, storage), true)
assert.equal(memory.has('A2Z_Archive'), false)
assert.equal(memory.has(PLANNER_STORAGE_KEY), true)
assert.equal(loadPlannerState(storage).taskStatuses.easy.status, 'backlog')
assert.equal(clearPlannerState(storage), true)
assert.equal(loadPlannerState(storage), null)
memory.set(PLANNER_STORAGE_KEY, JSON.stringify({ schemaVersion: 1 }))
assert.equal(loadPlannerState(storage), null)
memory.delete(PLANNER_STORAGE_KEY)

const trackerTasks = flattenPlannerQuestions(
    trackerData,
    questionDifficultyById
)
const trackerSchedule = createSchedule({
    tasks: trackerTasks,
    weeklyAvailability: {
        Monday: 2,
        Tuesday: 0,
        Wednesday: 4,
        Thursday: 3,
        Friday: 3,
        Saturday: 3,
        Sunday: 3,
    },
    startDate: '2026-09-21',
})

assert.equal(trackerSchedule.scheduledTasks, 487)
assert.equal(trackerSchedule.unscheduledTasks.length, 0)
assert.equal(
    new Set(
        trackerSchedule.days.flatMap(day => day.tasks.map(task => task.taskId))
    ).size,
    487
)
assert.ok(
    trackerSchedule.days
        .filter(day => day.dayOfWeek === 'Tuesday')
        .every(day => day.isDayOff && day.tasks.length === 0)
)
assert.ok(
    trackerSchedule.days.every(
        day => day.isDayOff || day.plannedMinutes <= day.capacityMinutes
    )
)

console.log(
    JSON.stringify(
        {
            verdict: 'PASS',
            scheduledTasks: schedule.scheduledTasks,
            secondSprintEnd: secondSprint.endDate,
            carriedTasks: rebuiltSchedule.carriedTaskIds,
            trackerQuestionsScheduled: trackerSchedule.scheduledTasks,
            trackerCompletionDate: trackerSchedule.endDate,
            storageKey: PLANNER_STORAGE_KEY,
        },
        null,
        2
    )
)
