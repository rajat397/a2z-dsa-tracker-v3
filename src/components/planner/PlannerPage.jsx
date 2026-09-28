import { ArrowBackIcon } from '@chakra-ui/icons'
import { Button } from '@chakra-ui/react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import questionDifficultyById from '../common/questionDifficultyById.js'
import {
    createSchedule,
    rebuildRemainingSchedule,
    TASK_STATUS,
} from './createSchedule.js'
import {
    buildPlannerTopics,
    flattenPlannerQuestions,
    updateQuestionCompletion,
} from './plannerData.js'
import { PlannerDashboard, PlannerWizard } from './ui/index.js'

const TIMER_STORAGE_KEY = 'A2Z_Planly_v2_timer'

const EMPTY_TIMER = {
    taskId: null,
    elapsedSeconds: 0,
    isRunning: false,
    startedAt: null,
}

function localDateKey(date = new Date()) {
    const offset = date.getTimezoneOffset() * 60_000
    return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

function addCalendarDays(date, numberOfDays) {
    const parsed = new Date(`${date}T00:00:00Z`)
    parsed.setUTCDate(parsed.getUTCDate() + numberOfDays)
    return parsed.toISOString().slice(0, 10)
}

function calendarDaysBetween(startDate, endDate) {
    return Math.floor(
        (Date.parse(`${endDate}T00:00:00Z`) -
            Date.parse(`${startDate}T00:00:00Z`)) /
            86_400_000
    )
}

function availabilityHoursForDate(
    availability,
    date,
    dateAvailabilityOverrides = {}
) {
    if (dateAvailabilityOverrides[date] !== undefined) {
        return dateAvailabilityOverrides[date]
    }

    const day = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
    ][new Date(`${date}T12:00:00`).getDay()]

    return availability[day] ?? 0
}

function formatDate(date) {
    if (!date) return ''

    return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(new Date(`${date}T12:00:00`))
}

function loadTimer() {
    try {
        const saved = JSON.parse(sessionStorage.getItem(TIMER_STORAGE_KEY))
        if (!saved || typeof saved !== 'object') return EMPTY_TIMER
        const elapsedSeconds = elapsedTimerSeconds(saved)

        return {
            ...EMPTY_TIMER,
            ...saved,
            elapsedSeconds,
            isRunning: false,
            startedAt: null,
        }
    } catch {
        return EMPTY_TIMER
    }
}

function elapsedTimerSeconds(timer, now = Date.now()) {
    const storedElapsed = Math.max(0, Number(timer.elapsedSeconds) || 0)
    if (!timer.isRunning || !timer.startedAt) return storedElapsed

    return (
        storedElapsed + Math.max(0, Math.floor((now - timer.startedAt) / 1000))
    )
}

function taskStatus(plan, taskId) {
    return plan.taskStatuses?.[String(taskId)]?.status
}

function isTaskComplete(plan, task) {
    return (
        task?.isDone === true ||
        taskStatus(plan, task?.id) === TASK_STATUS.COMPLETED
    )
}

function dashboardTask(plan, task, scheduledTask) {
    const source = task ?? scheduledTask

    return {
        id: String(source.id ?? source.taskId),
        title: source.title ?? source.questionHeading,
        topic: source.topicName,
        difficulty: source.tier,
        estimateMinutes:
            source.estimatedMinutes ?? scheduledTask?.estimatedMinutes ?? 0,
        completed: isTaskComplete(plan, source),
        practiceUrl: source.practiceLink,
        articleUrl: source.articleLink,
    }
}

function chooseSprint(schedule, plan, taskMap, today, selectedSprintNumber) {
    const sprints = new Map()

    schedule.days.forEach(day => {
        const sprint = sprints.get(day.sprintNumber) ?? []
        sprint.push(day)
        sprints.set(day.sprintNumber, sprint)
    })

    const entries = [...sprints.entries()]
    const selectedSprint = entries.find(
        ([sprintNumber]) => sprintNumber === selectedSprintNumber
    )
    if (selectedSprint) return selectedSprint

    const containingToday = entries.find(([, days]) =>
        days.some(day => day.date === today)
    )
    if (containingToday) return containingToday

    const firstPending = entries.find(([, days]) =>
        days.some(day =>
            day.tasks.some(scheduledTask => {
                const id = String(scheduledTask.taskId)
                const task = taskMap.get(id)
                return (
                    taskStatus(plan, id) !== TASK_STATUS.BACKLOG &&
                    !isTaskComplete(plan, task ?? scheduledTask)
                )
            })
        )
    )

    return firstPending ?? entries.at(-1) ?? [1, []]
}

function calculateStreak(schedule, plan, taskMap, today) {
    const completedStudyDays = schedule.days
        .filter(day => day.date <= today && day.tasks.length > 0)
        .map(day => ({
            date: day.date,
            completed: day.tasks.every(scheduledTask => {
                const id = String(scheduledTask.taskId)
                return isTaskComplete(plan, taskMap.get(id) ?? scheduledTask)
            }),
        }))
        .reverse()

    let streak = 0
    for (const day of completedStudyDays) {
        if (day.date === today && !day.completed) continue
        if (!day.completed) break
        streak += 1
    }
    return streak
}

function toDashboardPlan(plan, tasks, selectedSprintNumber) {
    const today = localDateKey()
    const taskMap = new Map(tasks.map(task => [String(task.id), task]))
    const [sprintNumber, sprintDays] = chooseSprint(
        plan.schedule,
        plan,
        taskMap,
        today,
        selectedSprintNumber
    )

    const days = sprintDays.map(day => {
        const visibleTasks = day.tasks
            .filter(
                task => taskStatus(plan, task.taskId) !== TASK_STATUS.BACKLOG
            )
            .map(scheduledTask =>
                dashboardTask(
                    plan,
                    taskMap.get(String(scheduledTask.taskId)),
                    scheduledTask
                )
            )

        return {
            id: day.date,
            label: `Day ${day.sprintDay}`,
            dateLabel: `${formatDate(day.date)} · ${day.dayOfWeek}`,
            isToday: day.date === today,
            isPast: day.date < today,
            capacityMinutes: day.capacityMinutes,
            scheduledMinutes: visibleTasks.reduce(
                (total, task) => total + task.estimateMinutes,
                0
            ),
            tasks: visibleTasks,
        }
    })

    const plannedTasks = plan.taskIds
        .map(id => taskMap.get(String(id)))
        .filter(Boolean)
    const completed = plannedTasks.filter(task =>
        isTaskComplete(plan, task)
    ).length
    const backlogIds = new Set(
        Object.entries(plan.taskStatuses ?? {})
            .filter(([, details]) => details.status === TASK_STATUS.BACKLOG)
            .map(([id]) => id)
    )
    const unscheduledTasks = new Map(
        (plan.schedule.unscheduledTasks ?? []).map(task => [
            String(task.taskId),
            task,
        ])
    )
    unscheduledTasks.forEach((_, id) => backlogIds.add(id))
    const backlog = [...backlogIds]
        .map(id =>
            dashboardTask(plan, taskMap.get(id), unscheduledTasks.get(id))
        )
        .filter(Boolean)
    const sprintTasks = days.flatMap(day => day.tasks)
    const sprintNumbers = [
        ...new Set(plan.schedule.days.map(day => day.sprintNumber)),
    ]
    const sprints = sprintNumbers.map(number => {
        const scheduledDays = plan.schedule.days.filter(
            day => day.sprintNumber === number
        )
        const scheduledTasks = scheduledDays
            .flatMap(day => day.tasks)
            .filter(
                task => taskStatus(plan, task.taskId) !== TASK_STATUS.BACKLOG
            )
        const completedTasks = scheduledTasks.filter(scheduledTask => {
            const id = String(scheduledTask.taskId)
            return isTaskComplete(plan, taskMap.get(id) ?? scheduledTask)
        }).length

        return {
            number,
            label: `Sprint ${number}`,
            startDate: formatDate(scheduledDays[0]?.date),
            endDate: formatDate(scheduledDays.at(-1)?.date),
            completed: completedTasks,
            total: scheduledTasks.length,
        }
    })

    return {
        id: plan.id,
        name: plan.name,
        status: plan.status,
        startDate: formatDate(plan.startDate),
        estimatedEndDate: formatDate(plan.schedule.endDate),
        weeklyAvailability: plan.weeklyAvailability,
        activeTimer: plan.activeTimer,
        progress: {
            completed,
            total: plannedTasks.length,
        },
        todayScheduledMinutes: (
            plan.schedule.days.find(day => day.date === today)?.tasks ?? []
        )
            .filter(
                task => taskStatus(plan, task.taskId) !== TASK_STATUS.BACKLOG
            )
            .reduce((total, task) => total + task.estimatedMinutes, 0),
        currentWeek: {
            id: `sprint-${sprintNumber}`,
            number: sprintNumber,
            label: `Sprint ${sprintNumber}`,
            startDate: formatDate(sprintDays[0]?.date),
            endDate: formatDate(sprintDays.at(-1)?.date),
            completed: sprintTasks.filter(task => task.completed).length,
            total: sprintTasks.length,
            days,
        },
        sprints,
        backlog,
        streakDays: calculateStreak(plan.schedule, plan, taskMap, today),
    }
}

const PlannerPage = ({ data, setData, plan, setPlan }) => {
    const navigate = useNavigate()
    const isDarkMode = data.data.header.darkMode
    const questions = useMemo(
        () => flattenPlannerQuestions(data, questionDifficultyById),
        [data]
    )
    const topics = useMemo(() => buildPlannerTopics(questions), [questions])
    const [timer, setTimer] = useState(loadTimer)
    const [clock, setClock] = useState(Date.now())
    const [currentDate, setCurrentDate] = useState(localDateKey)
    const [selectedSprintNumber, setSelectedSprintNumber] = useState(null)

    useEffect(() => {
        const questionsById = new Map(
            questions.map(question => [String(question.id), question])
        )

        setPlan(current => {
            if (!current) return current

            let changed = false
            const taskStatuses = { ...current.taskStatuses }

            current.taskIds.forEach(taskId => {
                const id = String(taskId)
                const isDone = questionsById.get(id)?.isDone === true
                const status = taskStatuses[id]?.status

                if (isDone && status !== TASK_STATUS.COMPLETED) {
                    taskStatuses[id] = {
                        ...taskStatuses[id],
                        status: TASK_STATUS.COMPLETED,
                    }
                    changed = true
                } else if (!isDone && status === TASK_STATUS.COMPLETED) {
                    taskStatuses[id] = {
                        ...taskStatuses[id],
                        status: TASK_STATUS.NOT_STARTED,
                        completedAt: null,
                    }
                    changed = true
                }
            })

            const allCompleted = current.taskIds.every(
                taskId => questionsById.get(String(taskId))?.isDone === true
            )
            const status = allCompleted
                ? 'completed'
                : current.status === 'scheduled' &&
                    current.startDate <= currentDate
                  ? 'active'
                  : current.status === 'completed'
                    ? current.startDate > currentDate
                        ? 'scheduled'
                        : 'active'
                    : current.status

            if (!changed && status === current.status) return current
            return { ...current, status, taskStatuses }
        })
    }, [currentDate, questions])

    useEffect(() => {
        sessionStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timer))
    }, [timer])

    useEffect(() => {
        if (!timer.isRunning) return undefined

        const interval = window.setInterval(() => setClock(Date.now()), 1000)
        return () => window.clearInterval(interval)
    }, [timer.isRunning])

    useEffect(() => {
        const interval = window.setInterval(
            () => setCurrentDate(localDateKey()),
            60_000
        )
        return () => window.clearInterval(interval)
    }, [])

    const visibleTimer = timer.taskId
        ? {
              ...timer,
              elapsedSeconds: elapsedTimerSeconds(timer, clock),
          }
        : null

    const plannerTopics = topics.map(topic => ({
        id: topic.id,
        title: topic.name,
        totalQuestions: topic.questionCount,
        completedQuestions: topic.questionCount - topic.remainingCount,
        remainingQuestions: topic.remainingCount,
        estimatedMinutes: topic.estimatedMinutes,
    }))

    const selectedQuestions = currentPlan => {
        const selectedIds = new Set(
            currentPlan.taskIds.map(taskId => String(taskId))
        )
        return questions.filter(question =>
            selectedIds.has(String(question.id))
        )
    }

    const createPlan = values => {
        const selectedTopicIds = new Set(values.topicIds)
        const tasks = questions.filter(
            question =>
                selectedTopicIds.has(question.topicId) && !question.isDone
        )
        const weeklyAvailability = values.weeklyAvailability
        const dateAvailabilityOverrides = {}
        const schedule = createSchedule({
            tasks,
            weeklyAvailability,
            startDate: values.startDate,
            dateAvailabilityOverrides,
        })

        setPlan({
            id: `plan-${Date.now()}`,
            name: values.planName,
            status:
                tasks.length === 0
                    ? 'completed'
                    : values.startDate > currentDate
                      ? 'scheduled'
                      : 'active',
            createdAt: new Date().toISOString(),
            startDate: values.startDate,
            topicIds: values.topicIds,
            taskIds: tasks.map(task => String(task.id)),
            weeklyAvailability,
            dateAvailabilityOverrides,
            schedule,
            taskStatuses: {},
            actualSeconds: {},
        })
        setSelectedSprintNumber(null)
    }

    const commitRunningTimer = taskId => {
        if (!timer.taskId || (taskId && timer.taskId !== String(taskId))) {
            return
        }

        const elapsedSeconds = elapsedTimerSeconds(timer)
        const activeTaskId = timer.taskId
        setPlan(current => ({
            ...current,
            actualSeconds: {
                ...current.actualSeconds,
                [activeTaskId]: elapsedSeconds,
            },
        }))
        setTimer({
            taskId: activeTaskId,
            elapsedSeconds,
            isRunning: false,
            startedAt: null,
        })
    }

    const startTimer = taskId => {
        const id = String(taskId)
        let elapsedSeconds = plan.actualSeconds?.[id] ?? 0

        if (timer.taskId === id) {
            elapsedSeconds = elapsedTimerSeconds(timer)
        } else if (timer.taskId) {
            commitRunningTimer()
        }

        setTimer({
            taskId: id,
            elapsedSeconds,
            isRunning: true,
            startedAt: Date.now(),
        })
        setPlan(current => ({
            ...current,
            taskStatuses: {
                ...current.taskStatuses,
                [id]: {
                    ...current.taskStatuses?.[id],
                    status:
                        current.taskStatuses?.[id]?.status ===
                        TASK_STATUS.BACKLOG
                            ? TASK_STATUS.BACKLOG
                            : TASK_STATUS.IN_PROGRESS,
                },
            },
        }))
    }

    const toggleTask = (taskId, isDone) => {
        const id = String(taskId)
        if (isDone && timer.taskId === id) commitRunningTimer(id)

        setData(current => updateQuestionCompletion(current, id, isDone))
        setPlan(current => {
            const taskStatuses = {
                ...current.taskStatuses,
                [id]: {
                    ...current.taskStatuses?.[id],
                    status: isDone
                        ? TASK_STATUS.COMPLETED
                        : TASK_STATUS.NOT_STARTED,
                    completedAt: isDone ? new Date().toISOString() : null,
                },
            }
            const nextCompleted = current.taskIds.every(plannedId =>
                String(plannedId) === id
                    ? isDone
                    : questions.find(
                          question => String(question.id) === String(plannedId)
                      )?.isDone ||
                      taskStatuses[String(plannedId)]?.status ===
                          TASK_STATUS.COMPLETED
            )

            return {
                ...current,
                status: nextCompleted
                    ? 'completed'
                    : current.status === 'completed'
                      ? current.startDate > currentDate
                          ? 'scheduled'
                          : 'active'
                      : current.status,
                taskStatuses,
            }
        })
    }

    const rebuildPlan = (
        current,
        availability = current.weeklyAvailability,
        dateAvailabilityOverrides = current.dateAvailabilityOverrides ?? {}
    ) => {
        const today = localDateKey()
        const questionsById = new Map(
            questions.map(question => [String(question.id), question])
        )
        const completedTasksToday = (
            current.schedule.days.find(day => day.date === today)?.tasks ?? []
        ).filter(task =>
            isTaskComplete(
                current,
                questionsById.get(String(task.taskId)) ?? task
            )
        )
        const startsInFuture = current.startDate > today
        const todayCapacity =
            availabilityHoursForDate(
                availability,
                today,
                dateAvailabilityOverrides
            ) * 60
        const completedMinutesToday = completedTasksToday.reduce(
            (total, task) => total + task.estimatedMinutes,
            0
        )
        const remainingCapacityToday = Math.max(
            0,
            todayCapacity - completedMinutesToday
        )
        const pendingTasks = selectedQuestions(current).filter(task => {
            const status = taskStatus(current, task.id)
            return (
                !task.isDone &&
                status !== TASK_STATUS.COMPLETED &&
                status !== TASK_STATUS.BACKLOG &&
                status !== TASK_STATUS.SKIPPED
            )
        })
        const tasksKeptToday = []
        let packedMinutesToday = 0

        if (!startsInFuture && completedTasksToday.length > 0) {
            for (const task of pendingTasks) {
                if (
                    packedMinutesToday + task.estimatedMinutes >
                    remainingCapacityToday
                ) {
                    break
                }

                tasksKeptToday.push(task)
                packedMinutesToday += task.estimatedMinutes
            }
        }

        const temporaryStatuses = tasksKeptToday.reduce(
            (statuses, task) => ({
                ...statuses,
                [String(task.id)]: {
                    ...statuses[String(task.id)],
                    status: TASK_STATUS.SKIPPED,
                },
            }),
            { ...current.taskStatuses }
        )
        const fromDate = startsInFuture
            ? current.startDate
            : completedTasksToday.length > 0
              ? addCalendarDays(today, 1)
              : today
        const rebuilt = rebuildRemainingSchedule({
            tasks: selectedQuestions(current),
            weeklyAvailability: availability,
            fromDate,
            existingSchedule: current.schedule,
            taskStatuses: temporaryStatuses,
            dateAvailabilityOverrides,
        })
        const historyDays = current.schedule.days
            .filter(day => day.date < fromDate)
            .map(day => {
                const completedTasks = day.tasks.filter(task =>
                    isTaskComplete(
                        current,
                        questionsById.get(String(task.taskId)) ?? task
                    )
                )
                const retainedTasks =
                    day.date === today
                        ? [
                              ...completedTasks,
                              ...tasksKeptToday.map(task => ({
                                  ...task,
                                  taskId: String(task.id),
                                  plannerStatus:
                                      current.taskStatuses?.[String(task.id)]
                                          ?.status ?? TASK_STATUS.NOT_STARTED,
                              })),
                          ]
                        : completedTasks
                const plannedMinutes = retainedTasks.reduce(
                    (total, task) => total + task.estimatedMinutes,
                    0
                )
                const capacityMinutes =
                    day.date === today ? todayCapacity : day.capacityMinutes

                return {
                    ...day,
                    availableHours:
                        day.date === today
                            ? availabilityHoursForDate(
                                  availability,
                                  today,
                                  dateAvailabilityOverrides
                              )
                            : day.availableHours,
                    capacityMinutes,
                    isDayOff: capacityMinutes === 0,
                    tasks: retainedTasks,
                    plannedMinutes,
                    remainingMinutes: Math.max(
                        0,
                        capacityMinutes - plannedMinutes
                    ),
                    isOverCapacity: plannedMinutes > capacityMinutes,
                }
            })
        const rebuiltDays = rebuilt.days.map(day => {
            const offset = Math.max(
                0,
                calendarDaysBetween(current.startDate, day.date)
            )

            return {
                ...day,
                sprintNumber: Math.floor(offset / 7) + 1,
                sprintDay: (offset % 7) + 1,
            }
        })
        const days = [...historyDays, ...rebuiltDays]
        const scheduledTasks = days.reduce(
            (total, day) => total + day.tasks.length,
            0
        )

        return {
            ...current,
            weeklyAvailability: availability,
            dateAvailabilityOverrides,
            schedule: {
                ...rebuilt,
                startDate: current.startDate,
                weeklyAvailability: availability,
                dateAvailabilityOverrides,
                days,
                endDate: days.at(-1)?.date ?? null,
                scheduledTasks,
                totalTasks: scheduledTasks + rebuilt.unscheduledTasks.length,
                totalPlannedMinutes: days.reduce(
                    (total, day) => total + day.plannedMinutes,
                    0
                ),
            },
        }
    }

    useEffect(() => {
        if (!plan?.needsScheduleRebuild) return

        setPlan(current => {
            if (!current?.needsScheduleRebuild) return current

            const planToRebuild = { ...current }
            delete planToRebuild.needsScheduleRebuild
            return rebuildPlan(planToRebuild)
        })
    }, [plan?.needsScheduleRebuild])

    const adjustAvailability = weeklyAvailability => {
        setPlan(current => rebuildPlan(current, weeklyAvailability))
        setSelectedSprintNumber(null)
    }

    const pausePlan = () => {
        commitRunningTimer()
        setPlan(current => ({
            ...current,
            status: 'paused',
            pausedAt: new Date().toISOString(),
        }))
    }

    const resumePlan = () => {
        setPlan(current => ({
            ...rebuildPlan(current),
            status: current.startDate > currentDate ? 'scheduled' : 'active',
            pausedAt: null,
        }))
        setSelectedSprintNumber(null)
    }

    const moveMissedToBacklog = ({ taskIds }) => {
        setPlan(current => ({
            ...current,
            taskStatuses: taskIds.reduce(
                (statuses, taskId) => ({
                    ...statuses,
                    [String(taskId)]: {
                        ...statuses[String(taskId)],
                        status: TASK_STATUS.BACKLOG,
                    },
                }),
                { ...current.taskStatuses }
            ),
        }))
    }

    const catchUp = ({ strategy = 'finish_faster' } = {}) => {
        setPlan(current => {
            const taskStatuses = Object.fromEntries(
                Object.entries(current.taskStatuses).map(([id, details]) => [
                    id,
                    details.status === TASK_STATUS.BACKLOG
                        ? {
                              ...details,
                              status: TASK_STATUS.MOVED_TO_NEXT_DAY,
                          }
                        : details,
                ])
            )
            const weeklyAvailability = current.weeklyAvailability
            let dateAvailabilityOverrides = {
                ...(current.dateAvailabilityOverrides ?? {}),
            }

            if (strategy === 'add_catch_up_day') {
                const taskMap = new Map(
                    questions.map(question => [String(question.id), question])
                )
                const backlogMinutes = Object.entries(current.taskStatuses)
                    .filter(
                        ([, details]) => details.status === TASK_STATUS.BACKLOG
                    )
                    .reduce(
                        (total, [id]) =>
                            total + (taskMap.get(id)?.estimatedMinutes ?? 0),
                        0
                    )
                const entries = Object.entries(current.weeklyAvailability)
                const dayOrder = [
                    'sunday',
                    'monday',
                    'tuesday',
                    'wednesday',
                    'thursday',
                    'friday',
                    'saturday',
                ]
                const currentDayIndex = new Date(
                    `${currentDate}T12:00:00`
                ).getDay()
                const rankedDays = entries
                    .map(([day, hours]) => {
                        const dayIndex = dayOrder.indexOf(day.toLowerCase())
                        const rawDistance = (dayIndex - currentDayIndex + 7) % 7
                        return {
                            day,
                            hours,
                            distance: rawDistance === 0 ? 7 : rawDistance,
                        }
                    })
                    .sort((first, second) => first.distance - second.distance)
                const dayOff = rankedDays.find(({ hours }) => hours === 0)
                const lightestDay = [...rankedDays].sort(
                    (first, second) =>
                        first.hours - second.hours ||
                        first.distance - second.distance
                )[0]
                const { hours: currentHours, distance } = dayOff ?? lightestDay
                const catchUpHours = dayOff
                    ? Math.min(16, Math.max(1, Math.ceil(backlogMinutes / 60)))
                    : Math.min(16, currentHours + 1)
                const catchUpDate = addCalendarDays(currentDate, distance)

                dateAvailabilityOverrides = {
                    ...dateAvailabilityOverrides,
                    [catchUpDate]: catchUpHours,
                }
            }

            return rebuildPlan(
                { ...current, taskStatuses },
                weeklyAvailability,
                dateAvailabilityOverrides
            )
        })
        setSelectedSprintNumber(null)
    }

    const resetPlan = () => {
        if (!window.confirm('Reset this plan and its timer?')) return

        sessionStorage.removeItem(TIMER_STORAGE_KEY)
        setTimer(EMPTY_TIMER)
        setPlan(null)
    }

    if (!plan) {
        return (
            <PlannerWizard
                topics={plannerTopics}
                tasks={questions}
                onGenerate={createPlan}
                onCancel={() => navigate('/')}
                isDarkMode={isDarkMode}
            />
        )
    }

    const dashboardPlan = toDashboardPlan(
        { ...plan, activeTimer: visibleTimer },
        questions,
        selectedSprintNumber
    )

    return (
        <>
            <Button
                as={Link}
                to={'/'}
                position={'fixed'}
                left={{ base: 3, md: 5 }}
                bottom={{ base: 3, md: 5 }}
                zIndex={20}
                size={'sm'}
                leftIcon={<ArrowBackIcon />}
                colorScheme={'blue'}
                boxShadow={'lg'}
            >
                Tracker
            </Button>
            <PlannerDashboard
                plan={dashboardPlan}
                onToggleTask={toggleTask}
                onStartTimer={startTimer}
                onPauseTimer={commitRunningTimer}
                onAdjustAvailability={adjustAvailability}
                onPausePlan={pausePlan}
                onResumePlan={resumePlan}
                onMoveMissedToBacklog={moveMissedToBacklog}
                onRebuildPlan={catchUp}
                onSelectSprint={setSelectedSprintNumber}
                onResetPlan={resetPlan}
                isDarkMode={isDarkMode}
            />
        </>
    )
}

export default PlannerPage
