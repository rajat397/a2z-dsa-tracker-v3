import {
    CalendarIcon,
    CheckIcon,
    ChevronDownIcon,
    ExternalLinkIcon,
    RepeatClockIcon,
    SettingsIcon,
    SmallCloseIcon,
    TimeIcon,
    WarningTwoIcon,
} from '@chakra-ui/icons'
import {
    Badge,
    Box,
    Button,
    Checkbox,
    CircularProgress,
    CircularProgressLabel,
    Divider,
    Flex,
    Grid,
    Heading,
    IconButton,
    Link,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Progress,
    Select,
    Stack,
    Text,
    Tooltip,
    useDisclosure,
} from '@chakra-ui/react'
import { useEffect, useMemo, useState } from 'react'

import AvailabilityEditor from './AvailabilityEditor.jsx'
import {
    createDefaultAvailability,
    formatDuration,
    formatTimer,
    getDifficultyColor,
    getPalette,
} from './plannerUi.js'

/**
 * Plan shape:
 * {
 *   id, name, status: 'active' | 'paused', startDate, estimatedEndDate,
 *   weeklyAvailability, activeTimer?: { taskId, elapsedSeconds, isRunning },
 *   progress: { completed, total, percent? },
 *   currentWeek: { id, label, startDate, endDate, completed, total,
 *     days: [{ id, label, dateLabel, isToday, isPast, capacityMinutes,
 *       scheduledMinutes, tasks: Task[] }] },
 *   backlog: Task[], streakDays?: number
 * }
 * Task shape: { id, title, topic, difficulty, estimateMinutes, completed,
 * practiceUrl?, articleUrl? }
 */
const PlannerDashboard = ({
    plan,
    onToggleTask,
    onStartTimer,
    onPauseTimer,
    onAdjustAvailability,
    onPausePlan,
    onResumePlan,
    onMoveMissedToBacklog,
    onRebuildPlan,
    onSelectSprint,
    onResetPlan,
    isDarkMode = false,
}) => {
    const palette = getPalette(isDarkMode)
    const statusLabel =
        {
            active: 'Active',
            completed: 'Completed',
            paused: 'Paused',
            scheduled: 'Scheduled',
        }[plan.status] ?? plan.status
    const statusColor =
        plan.status === 'paused'
            ? 'orange'
            : plan.status === 'scheduled'
              ? 'blue'
              : 'green'
    const currentWeek = plan.currentWeek
    const days = currentWeek?.days ?? []
    const preferredDayId =
        days.find(day => day.isToday)?.id ??
        days.find(day => day.tasks.length)?.id
    const [selectedDayId, setSelectedDayId] = useState(
        preferredDayId ?? days[0]?.id
    )
    const {
        isOpen: isAvailabilityOpen,
        onOpen: openAvailability,
        onClose: closeAvailability,
    } = useDisclosure()
    const {
        isOpen: isCatchUpOpen,
        onOpen: openCatchUp,
        onClose: closeCatchUp,
    } = useDisclosure()
    const [availabilityDraft, setAvailabilityDraft] = useState(() =>
        createDefaultAvailability(plan.weeklyAvailability)
    )
    const availabilityTotal = Object.values(availabilityDraft).reduce(
        (total, hours) => total + hours,
        0
    )

    useEffect(() => {
        if (!days.some(day => day.id === selectedDayId)) {
            setSelectedDayId(preferredDayId ?? days[0]?.id)
        }
    }, [days, preferredDayId, selectedDayId])

    const selectedDay =
        days.find(day => day.id === selectedDayId) ?? days[0] ?? null
    const progress = plan.progress ?? { completed: 0, total: 0 }
    const progressPercent =
        progress.percent ??
        (progress.total > 0 ? (progress.completed / progress.total) * 100 : 0)
    const backlog = plan.backlog ?? []
    const missedTasks = selectedDay
        ? selectedDay.tasks.filter(
              task => !isTaskCompleted(task) && selectedDay.isPast
          )
        : []

    const openAvailabilityEditor = () => {
        setAvailabilityDraft(createDefaultAvailability(plan.weeklyAvailability))
        openAvailability()
    }

    const saveAvailability = () => {
        if (availabilityTotal === 0) return
        onAdjustAvailability?.(availabilityDraft)
        closeAvailability()
    }

    return (
        <Flex
            minH={'100%'}
            bg={palette.page}
            color={palette.text}
            direction={'column'}
        >
            <Box
                as={'header'}
                bg={palette.panel}
                borderBottom={'1px solid'}
                borderColor={palette.border}
            >
                <Flex
                    maxW={'1280px'}
                    mx={'auto'}
                    px={{ base: 4, md: 8 }}
                    py={5}
                    align={{ base: 'flex-start', md: 'center' }}
                    justify={'space-between'}
                    gap={4}
                    direction={{ base: 'column', md: 'row' }}
                >
                    <Box>
                        <Flex mb={2} align={'center'} gap={2}>
                            <Badge
                                bg={palette.accentSoft}
                                color={palette.accent}
                                borderRadius={'full'}
                                px={2}
                            >
                                PLANLY
                            </Badge>
                            <Badge
                                colorScheme={statusColor}
                                variant={'subtle'}
                                borderRadius={'full'}
                            >
                                {statusLabel}
                            </Badge>
                        </Flex>
                        <Heading size={'lg'}>{plan.name}</Heading>
                        <Text mt={1} color={palette.muted} fontSize={'sm'}>
                            {formatDateRange(
                                plan.startDate,
                                plan.estimatedEndDate
                            )}
                        </Text>
                    </Box>
                    <Flex gap={2} wrap={'wrap'}>
                        <Button
                            leftIcon={<SettingsIcon />}
                            variant={'outline'}
                            borderColor={palette.border}
                            color={palette.subtle}
                            isDisabled={['paused', 'completed'].includes(
                                plan.status
                            )}
                            onClick={openAvailabilityEditor}
                        >
                            Availability
                        </Button>
                        {plan.status === 'paused' ? (
                            <Button colorScheme={'blue'} onClick={onResumePlan}>
                                Resume plan
                            </Button>
                        ) : plan.status === 'completed' ? null : (
                            <Button
                                variant={'outline'}
                                borderColor={palette.border}
                                color={palette.subtle}
                                onClick={onPausePlan}
                            >
                                Pause plan
                            </Button>
                        )}
                        <Menu placement={'bottom-end'}>
                            <MenuButton
                                as={IconButton}
                                aria-label={'More plan actions'}
                                icon={<ChevronDownIcon />}
                                variant={'ghost'}
                                color={palette.muted}
                            />
                            <MenuList
                                bg={palette.panel}
                                borderColor={palette.border}
                            >
                                <MenuItem
                                    bg={palette.panel}
                                    color={palette.danger}
                                    onClick={onResetPlan}
                                >
                                    Reset this plan
                                </MenuItem>
                            </MenuList>
                        </Menu>
                    </Flex>
                </Flex>
            </Box>

            <Box
                as={'main'}
                w={'100%'}
                maxW={'1280px'}
                mx={'auto'}
                px={{ base: 4, md: 8 }}
                pt={{ base: 6, md: 8 }}
                pb={{ base: 20, md: 8 }}
            >
                {plan.status === 'paused' && (
                    <Flex
                        mb={5}
                        p={4}
                        align={{ base: 'flex-start', sm: 'center' }}
                        justify={'space-between'}
                        gap={4}
                        direction={{ base: 'column', sm: 'row' }}
                        border={'1px solid'}
                        borderColor={palette.warning}
                        borderRadius={'xl'}
                        bg={palette.warningSoft}
                    >
                        <Box>
                            <Text fontWeight={'semibold'}>
                                Your plan is paused
                            </Text>
                            <Text color={palette.muted} fontSize={'sm'}>
                                The schedule will stay unchanged until you
                                resume.
                            </Text>
                        </Box>
                        <Button
                            size={'sm'}
                            colorScheme={'blue'}
                            onClick={onResumePlan}
                        >
                            Resume
                        </Button>
                    </Flex>
                )}

                <Grid
                    mb={6}
                    templateColumns={{
                        base: '1fr',
                        sm: 'repeat(2, minmax(0, 1fr))',
                        lg: 'repeat(4, minmax(0, 1fr))',
                    }}
                    gap={4}
                >
                    <MetricCard
                        label={'Overall progress'}
                        value={`${progress.completed}/${progress.total}`}
                        detail={`${Math.round(progressPercent)}% complete`}
                        palette={palette}
                        progress={progressPercent}
                    />
                    <MetricCard
                        label={'This sprint'}
                        value={`${currentWeek?.completed ?? 0}/${currentWeek?.total ?? 0}`}
                        detail={currentWeek?.label ?? 'Current week'}
                        palette={palette}
                    />
                    <MetricCard
                        label={'Today'}
                        value={formatDuration(
                            plan.todayScheduledMinutes ??
                                days.find(day => day.isToday)
                                    ?.scheduledMinutes ??
                                0,
                            true
                        )}
                        detail={'Planned study time'}
                        palette={palette}
                    />
                    <MetricCard
                        label={'Study streak'}
                        value={`${plan.streakDays ?? 0} days`}
                        detail={'Keep the momentum going'}
                        palette={palette}
                    />
                </Grid>

                <Grid
                    templateColumns={{
                        base: '1fr',
                        xl: 'minmax(0, 1fr) 330px',
                    }}
                    gap={6}
                    alignItems={'start'}
                >
                    <Box
                        bg={palette.panel}
                        border={'1px solid'}
                        borderColor={palette.border}
                        borderRadius={'2xl'}
                        overflow={'hidden'}
                    >
                        <Flex
                            px={{ base: 4, md: 6 }}
                            py={5}
                            align={{ base: 'flex-start', md: 'center' }}
                            justify={'space-between'}
                            gap={3}
                            direction={{ base: 'column', md: 'row' }}
                        >
                            <Box>
                                <Heading size={'md'}>Weekly sprint</Heading>
                                <Text
                                    mt={1}
                                    color={palette.muted}
                                    fontSize={'sm'}
                                >
                                    {formatDateRange(
                                        currentWeek?.startDate,
                                        currentWeek?.endDate
                                    )}
                                </Text>
                            </Box>
                            <Flex gap={2} wrap={'wrap'}>
                                {(plan.sprints?.length ?? 0) > 1 && (
                                    <Select
                                        aria-label={'Choose sprint'}
                                        size={'sm'}
                                        w={'140px'}
                                        value={currentWeek?.number}
                                        bg={palette.panel}
                                        borderColor={palette.border}
                                        onChange={event =>
                                            onSelectSprint?.(
                                                Number(event.target.value)
                                            )
                                        }
                                    >
                                        {plan.sprints.map(sprint => (
                                            <option
                                                key={sprint.number}
                                                value={sprint.number}
                                            >
                                                {sprint.label} ·{' '}
                                                {sprint.completed}/
                                                {sprint.total}
                                            </option>
                                        ))}
                                    </Select>
                                )}
                                <Button
                                    leftIcon={<RepeatClockIcon />}
                                    size={'sm'}
                                    variant={'outline'}
                                    borderColor={palette.border}
                                    color={palette.subtle}
                                    isDisabled={[
                                        'paused',
                                        'completed',
                                    ].includes(plan.status)}
                                    onClick={() =>
                                        onRebuildPlan?.({
                                            includeBacklog: true,
                                        })
                                    }
                                >
                                    Rebuild sprint
                                </Button>
                            </Flex>
                        </Flex>

                        <Divider borderColor={palette.border} />
                        <DaySelector
                            days={days}
                            selectedDayId={selectedDay?.id}
                            onSelect={setSelectedDayId}
                            palette={palette}
                        />
                        <Divider borderColor={palette.border} />

                        <Box px={{ base: 4, md: 6 }} py={5}>
                            {selectedDay ? (
                                <Box
                                    id={'selected-day-panel'}
                                    role={'tabpanel'}
                                    aria-labelledby={`day-tab-${selectedDay.id}`}
                                >
                                    <DaySummary
                                        day={selectedDay}
                                        palette={palette}
                                    />

                                    {missedTasks.length > 0 && (
                                        <Flex
                                            mt={4}
                                            p={3}
                                            align={{
                                                base: 'flex-start',
                                                sm: 'center',
                                            }}
                                            justify={'space-between'}
                                            gap={3}
                                            direction={{
                                                base: 'column',
                                                sm: 'row',
                                            }}
                                            border={'1px solid'}
                                            borderColor={palette.warning}
                                            borderRadius={'lg'}
                                            bg={palette.warningSoft}
                                        >
                                            <Flex align={'flex-start'} gap={2}>
                                                <WarningTwoIcon
                                                    mt={1}
                                                    color={palette.warning}
                                                />
                                                <Box>
                                                    <Text
                                                        color={palette.text}
                                                        fontSize={'sm'}
                                                        fontWeight={'semibold'}
                                                    >
                                                        {missedTasks.length}{' '}
                                                        unfinished
                                                        {missedTasks.length ===
                                                        1
                                                            ? ' task'
                                                            : ' tasks'}
                                                    </Text>
                                                    <Text
                                                        color={palette.muted}
                                                        fontSize={'xs'}
                                                    >
                                                        Move them to backlog and
                                                        catch up when you have
                                                        room.
                                                    </Text>
                                                </Box>
                                            </Flex>
                                            <Button
                                                size={'xs'}
                                                colorScheme={'orange'}
                                                variant={'outline'}
                                                isDisabled={
                                                    plan.status !== 'active'
                                                }
                                                onClick={() =>
                                                    onMoveMissedToBacklog?.({
                                                        dayId: selectedDay.id,
                                                        taskIds:
                                                            missedTasks.map(
                                                                task =>
                                                                    task.taskId ??
                                                                    task.id
                                                            ),
                                                    })
                                                }
                                            >
                                                Move to backlog
                                            </Button>
                                        </Flex>
                                    )}

                                    <Stack mt={5} spacing={3}>
                                        {selectedDay.tasks.length > 0 ? (
                                            selectedDay.tasks.map(task => (
                                                <TaskCard
                                                    key={task.taskId ?? task.id}
                                                    task={task}
                                                    timer={plan.activeTimer}
                                                    onToggle={onToggleTask}
                                                    onStartTimer={onStartTimer}
                                                    onPauseTimer={onPauseTimer}
                                                    isPlanPaused={
                                                        plan.status !== 'active'
                                                    }
                                                    palette={palette}
                                                />
                                            ))
                                        ) : (
                                            <EmptyDay palette={palette} />
                                        )}
                                    </Stack>
                                </Box>
                            ) : (
                                <EmptyWeek palette={palette} />
                            )}
                        </Box>
                    </Box>

                    <BacklogPanel
                        tasks={backlog}
                        timer={plan.activeTimer}
                        onToggle={onToggleTask}
                        onStartTimer={onStartTimer}
                        onPauseTimer={onPauseTimer}
                        onCatchUp={openCatchUp}
                        isPlanPaused={plan.status !== 'active'}
                        palette={palette}
                    />
                </Grid>
            </Box>

            <Modal
                isOpen={isAvailabilityOpen}
                onClose={closeAvailability}
                size={'3xl'}
                scrollBehavior={'inside'}
            >
                <ModalOverlay />
                <ModalContent bg={palette.panel} color={palette.text}>
                    <ModalHeader>Adjust weekly availability</ModalHeader>
                    <ModalCloseButton
                        aria-label={'Close availability editor'}
                    />
                    <ModalBody>
                        <Text mb={5} color={palette.muted} fontSize={'sm'}>
                            Your unfinished work will be rebalanced after you
                            save.
                        </Text>
                        <AvailabilityEditor
                            availability={availabilityDraft}
                            onChange={setAvailabilityDraft}
                            isDarkMode={isDarkMode}
                            compact
                        />
                        {availabilityTotal === 0 && (
                            <Text
                                mt={4}
                                role={'alert'}
                                color={palette.danger}
                                fontSize={'sm'}
                            >
                                Allocate at least one study hour in the week.
                            </Text>
                        )}
                    </ModalBody>
                    <ModalFooter gap={3}>
                        <Button variant={'ghost'} onClick={closeAvailability}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme={'blue'}
                            isDisabled={availabilityTotal === 0}
                            onClick={saveAvailability}
                        >
                            Save and rebalance
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Modal isOpen={isCatchUpOpen} onClose={closeCatchUp} size={'lg'}>
                <ModalOverlay />
                <ModalContent bg={palette.panel} color={palette.text}>
                    <ModalHeader>Choose a recovery option</ModalHeader>
                    <ModalCloseButton aria-label={'Close recovery options'} />
                    <ModalBody>
                        <Text mb={4} color={palette.muted} fontSize={'sm'}>
                            Pick how you want to recover missed work. Your
                            remaining roadmap will update after you apply it.
                        </Text>
                        <Stack spacing={3}>
                            <RecoveryOption
                                title={'Finish faster'}
                                description={
                                    'Pack backlog into the earliest available study days.'
                                }
                                onClick={() => {
                                    onRebuildPlan?.({
                                        strategy: 'finish_faster',
                                        includeBacklog: true,
                                    })
                                    closeCatchUp()
                                }}
                                palette={palette}
                            />
                            <RecoveryOption
                                title={'Add catch-up day'}
                                description={
                                    'Use the next day off once, or add one hour to the next lightest day.'
                                }
                                onClick={() => {
                                    onRebuildPlan?.({
                                        strategy: 'add_catch_up_day',
                                        includeBacklog: true,
                                    })
                                    closeCatchUp()
                                }}
                                palette={palette}
                            />
                            <RecoveryOption
                                title={'Increase hours'}
                                description={
                                    'Adjust your Monday–Sunday availability before rebuilding.'
                                }
                                onClick={() => {
                                    closeCatchUp()
                                    openAvailabilityEditor()
                                }}
                                palette={palette}
                            />
                            <RecoveryOption
                                title={'Keep in backlog'}
                                description={
                                    'Leave missed tasks in backlog and continue the current plan.'
                                }
                                onClick={closeCatchUp}
                                palette={palette}
                            />
                        </Stack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant={'ghost'} onClick={closeCatchUp}>
                            Cancel
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Flex>
    )
}

const RecoveryOption = ({ title, description, onClick, palette }) => (
    <Button
        h={'auto'}
        py={3}
        px={4}
        justifyContent={'flex-start'}
        textAlign={'left'}
        variant={'outline'}
        borderColor={palette.border}
        onClick={onClick}
    >
        <Box>
            <Text color={palette.text} fontWeight={'semibold'}>
                {title}
            </Text>
            <Text
                mt={1}
                color={palette.muted}
                fontSize={'xs'}
                whiteSpace={'normal'}
            >
                {description}
            </Text>
        </Box>
    </Button>
)

const MetricCard = ({ label, value, detail, palette, progress }) => (
    <Box
        p={4}
        bg={palette.panel}
        border={'1px solid'}
        borderColor={palette.border}
        borderRadius={'xl'}
    >
        <Text color={palette.muted} fontSize={'xs'} fontWeight={'semibold'}>
            {label.toUpperCase()}
        </Text>
        <Text mt={2} color={palette.text} fontSize={'2xl'} fontWeight={'bold'}>
            {value}
        </Text>
        {progress === undefined ? (
            <Text mt={1} color={palette.muted} fontSize={'xs'} noOfLines={1}>
                {detail}
            </Text>
        ) : (
            <Box mt={2}>
                <Progress
                    value={progress}
                    size={'xs'}
                    colorScheme={'blue'}
                    bg={palette.border}
                    borderRadius={'full'}
                    aria-label={detail}
                />
                <Text mt={1} color={palette.muted} fontSize={'xs'}>
                    {detail}
                </Text>
            </Box>
        )}
    </Box>
)

const DaySelector = ({ days, selectedDayId, onSelect, palette }) => {
    const selectDayAt = index => {
        const day = days[index]
        if (!day) return

        onSelect(day.id)
        window.requestAnimationFrame(() =>
            document.getElementById(`day-tab-${day.id}`)?.focus()
        )
    }

    const handleKeyDown = (event, index) => {
        let nextIndex = null

        if (event.key === 'ArrowRight') nextIndex = (index + 1) % days.length
        if (event.key === 'ArrowLeft') {
            nextIndex = (index - 1 + days.length) % days.length
        }
        if (event.key === 'Home') nextIndex = 0
        if (event.key === 'End') nextIndex = days.length - 1
        if (nextIndex === null) return

        event.preventDefault()
        selectDayAt(nextIndex)
    }

    return (
        <Flex
            role={'tablist'}
            aria-label={'Days in this sprint'}
            px={{ base: 2, md: 4 }}
            py={3}
            gap={2}
            overflowX={'auto'}
        >
            {days.map((day, index) => {
                const isSelected = day.id === selectedDayId
                const completed = day.tasks.filter(isTaskCompleted).length

                return (
                    <Button
                        id={`day-tab-${day.id}`}
                        key={day.id}
                        role={'tab'}
                        tabIndex={isSelected ? 0 : -1}
                        aria-selected={isSelected}
                        aria-label={`${day.label}${
                            day.isToday ? ', Today' : ''
                        }, ${completed} of ${day.tasks.length} done`}
                        aria-controls={'selected-day-panel'}
                        minW={'88px'}
                        h={'auto'}
                        px={3}
                        py={3}
                        variant={'outline'}
                        borderColor={
                            isSelected ? palette.accent : palette.border
                        }
                        bg={isSelected ? palette.accentSoft : 'transparent'}
                        color={isSelected ? palette.accent : palette.subtle}
                        onClick={() => onSelect(day.id)}
                        onKeyDown={event => handleKeyDown(event, index)}
                    >
                        <Box>
                            <Flex align={'center'} justify={'center'} gap={1}>
                                <Text fontSize={'sm'} fontWeight={'semibold'}>
                                    {day.label}
                                </Text>
                                {day.isToday && (
                                    <Box
                                        w={1.5}
                                        h={1.5}
                                        borderRadius={'full'}
                                        bg={palette.accent}
                                        aria-hidden={'true'}
                                    />
                                )}
                            </Flex>
                            <Text mt={1} color={palette.muted} fontSize={'xs'}>
                                {completed}/{day.tasks.length} done
                            </Text>
                        </Box>
                    </Button>
                )
            })}
        </Flex>
    )
}

const DaySummary = ({ day, palette }) => {
    const completedTasks = day.tasks.filter(isTaskCompleted).length
    const completionPercent = day.tasks.length
        ? (completedTasks / day.tasks.length) * 100
        : 0
    const loadPercent = day.capacityMinutes
        ? Math.min(100, (day.scheduledMinutes / day.capacityMinutes) * 100)
        : 0

    return (
        <Flex
            align={{ base: 'flex-start', md: 'center' }}
            justify={'space-between'}
            gap={4}
            direction={{ base: 'column', md: 'row' }}
        >
            <Box>
                <Flex align={'center'} gap={2}>
                    <Heading size={'sm'}>
                        {day.isToday ? 'Today' : day.label}
                    </Heading>
                    {day.isToday && (
                        <Badge colorScheme={'blue'} borderRadius={'full'}>
                            Current
                        </Badge>
                    )}
                </Flex>
                <Text mt={1} color={palette.muted} fontSize={'sm'}>
                    {day.dateLabel} · {day.tasks.length} questions ·{' '}
                    {formatDuration(day.scheduledMinutes, true)}
                </Text>
            </Box>
            <Flex minW={{ base: '100%', md: '250px' }} align={'center'} gap={3}>
                <CircularProgress
                    value={completionPercent}
                    aria-label={'Daily task completion'}
                    aria-valuetext={`${completedTasks} of ${day.tasks.length} tasks completed`}
                    size={'52px'}
                    thickness={'10px'}
                    color={palette.success}
                    trackColor={palette.border}
                >
                    <CircularProgressLabel fontSize={'xs'}>
                        {completedTasks}/{day.tasks.length}
                    </CircularProgressLabel>
                </CircularProgress>
                <Box flex={1}>
                    <Flex
                        mb={1}
                        justify={'space-between'}
                        color={palette.muted}
                        fontSize={'xs'}
                    >
                        <Text>Daily load</Text>
                        <Text>
                            {formatDuration(day.scheduledMinutes, true)} /{' '}
                            {formatDuration(day.capacityMinutes, true)}
                        </Text>
                    </Flex>
                    <Progress
                        value={loadPercent}
                        size={'xs'}
                        colorScheme={loadPercent >= 100 ? 'orange' : 'blue'}
                        bg={palette.border}
                        borderRadius={'full'}
                        aria-label={'Daily capacity used'}
                    />
                </Box>
            </Flex>
        </Flex>
    )
}

const TaskCard = ({
    task,
    timer,
    onToggle,
    onStartTimer,
    onPauseTimer,
    isPlanPaused,
    palette,
    compact = false,
}) => {
    const taskId = task.taskId ?? task.id
    const difficulty = task.difficulty ?? task.tier
    const estimateMinutes = task.estimatedMinutes ?? task.estimateMinutes
    const practiceUrl = task.practiceLink ?? task.practiceUrl
    const articleUrl = task.articleLink ?? task.articleUrl
    const topic = task.topicName ?? task.topic
    const isCompleted = isTaskCompleted(task)
    const isActiveTimer = timer?.taskId === taskId
    const isTimerRunning = isActiveTimer && timer.isRunning
    const timerLabel = isActiveTimer
        ? formatTimer(timer.elapsedSeconds)
        : formatDuration(estimateMinutes, true)

    return (
        <Flex
            p={compact ? 3 : 4}
            align={'flex-start'}
            gap={3}
            border={'1px solid'}
            borderColor={isActiveTimer ? palette.accent : palette.border}
            borderRadius={'xl'}
            bg={isActiveTimer ? palette.accentSoft : palette.elevated}
            opacity={isCompleted ? 0.72 : 1}
        >
            <Checkbox
                mt={1}
                colorScheme={'green'}
                isChecked={isCompleted}
                isDisabled={isPlanPaused}
                onChange={event => onToggle?.(taskId, event.target.checked)}
                aria-label={`Mark ${task.title} as ${
                    isCompleted ? 'incomplete' : 'complete'
                }`}
            />
            <Box minW={0} flex={1}>
                <Text
                    color={palette.text}
                    fontSize={compact ? 'sm' : 'md'}
                    fontWeight={'semibold'}
                    textDecoration={isCompleted ? 'line-through' : 'none'}
                    noOfLines={2}
                >
                    {task.title}
                </Text>
                <Flex mt={2} gap={2} align={'center'} wrap={'wrap'}>
                    {topic && (
                        <Text
                            color={palette.muted}
                            fontSize={'xs'}
                            noOfLines={1}
                        >
                            {topic}
                        </Text>
                    )}
                    {difficulty && (
                        <Badge
                            colorScheme={getDifficultyColor(difficulty)}
                            variant={'subtle'}
                            borderRadius={'full'}
                            fontSize={'10px'}
                        >
                            {difficulty}
                        </Badge>
                    )}
                    {practiceUrl && (
                        <Link
                            href={practiceUrl}
                            isExternal
                            color={palette.accent}
                            fontSize={'xs'}
                            fontWeight={'semibold'}
                        >
                            Practice <ExternalLinkIcon mx={'2px'} />
                        </Link>
                    )}
                    {articleUrl && (
                        <Link
                            href={articleUrl}
                            isExternal
                            color={palette.accent}
                            fontSize={'xs'}
                            fontWeight={'semibold'}
                        >
                            Article <ExternalLinkIcon mx={'2px'} />
                        </Link>
                    )}
                </Flex>
            </Box>
            <Tooltip
                label={
                    isCompleted
                        ? 'Task completed'
                        : isPlanPaused
                          ? 'Activate the plan to use timers'
                          : isTimerRunning
                            ? 'Pause timer'
                            : 'Start timer'
                }
            >
                <Button
                    leftIcon={<TimeIcon />}
                    size={'sm'}
                    minW={compact ? '86px' : '98px'}
                    variant={isTimerRunning ? 'solid' : 'outline'}
                    colorScheme={isTimerRunning ? 'blue' : undefined}
                    borderColor={palette.border}
                    color={isTimerRunning ? undefined : palette.subtle}
                    isDisabled={isCompleted || isPlanPaused}
                    onClick={() =>
                        isTimerRunning
                            ? onPauseTimer?.(taskId)
                            : onStartTimer?.(taskId)
                    }
                    aria-label={`${
                        isTimerRunning ? 'Pause' : 'Start'
                    } timer for ${task.title}`}
                >
                    {timerLabel}
                </Button>
            </Tooltip>
        </Flex>
    )
}

const BacklogPanel = ({
    tasks,
    timer,
    onToggle,
    onStartTimer,
    onPauseTimer,
    onCatchUp,
    isPlanPaused,
    palette,
}) => {
    const backlogMinutes = useMemo(
        () =>
            tasks.reduce(
                (total, task) =>
                    total +
                    (Number(task.estimatedMinutes ?? task.estimateMinutes) ||
                        0),
                0
            ),
        [tasks]
    )

    return (
        <Box
            bg={palette.panel}
            border={'1px solid'}
            borderColor={palette.border}
            borderRadius={'2xl'}
            overflow={'hidden'}
        >
            <Box p={5}>
                <Flex align={'center'} justify={'space-between'} gap={3}>
                    <Box>
                        <Heading size={'sm'}>Backlog</Heading>
                        <Text mt={1} color={palette.muted} fontSize={'xs'}>
                            {tasks.length} questions ·{' '}
                            {formatDuration(backlogMinutes, true)}
                        </Text>
                    </Box>
                    <Badge
                        bg={
                            tasks.length > 0
                                ? palette.warningSoft
                                : palette.successSoft
                        }
                        color={
                            tasks.length > 0 ? palette.warning : palette.success
                        }
                        borderRadius={'full'}
                    >
                        {tasks.length > 0 ? 'Needs attention' : 'Clear'}
                    </Badge>
                </Flex>
            </Box>
            <Divider borderColor={palette.border} />

            <Stack p={4} spacing={3} maxH={'470px'} overflowY={'auto'}>
                {tasks.length > 0 ? (
                    tasks.map(task => (
                        <TaskCard
                            key={task.taskId ?? task.id}
                            task={task}
                            timer={timer}
                            onToggle={onToggle}
                            onStartTimer={onStartTimer}
                            onPauseTimer={onPauseTimer}
                            isPlanPaused={isPlanPaused}
                            palette={palette}
                            compact
                        />
                    ))
                ) : (
                    <Flex py={7} align={'center'} direction={'column'}>
                        <Flex
                            w={10}
                            h={10}
                            align={'center'}
                            justify={'center'}
                            borderRadius={'full'}
                            bg={palette.successSoft}
                            color={palette.success}
                        >
                            <CheckIcon />
                        </Flex>
                        <Text mt={3} fontWeight={'semibold'}>
                            You are on track
                        </Text>
                        <Text mt={1} color={palette.muted} fontSize={'xs'}>
                            Missed tasks will appear here.
                        </Text>
                    </Flex>
                )}
            </Stack>

            {tasks.length > 0 && (
                <Box p={4} pt={0}>
                    <Button
                        leftIcon={<RepeatClockIcon />}
                        w={'full'}
                        colorScheme={'blue'}
                        variant={'outline'}
                        isDisabled={isPlanPaused}
                        onClick={onCatchUp}
                    >
                        Build a catch-up plan
                    </Button>
                </Box>
            )}
        </Box>
    )
}

const EmptyDay = ({ palette }) => (
    <Flex py={12} align={'center'} direction={'column'} textAlign={'center'}>
        <CalendarIcon color={palette.muted} boxSize={6} />
        <Text mt={3} fontWeight={'semibold'}>
            Rest day
        </Text>
        <Text mt={1} color={palette.muted} fontSize={'sm'}>
            Nothing is scheduled. Use the time to recharge or clear backlog.
        </Text>
    </Flex>
)

const EmptyWeek = ({ palette }) => (
    <Flex py={14} align={'center'} direction={'column'} textAlign={'center'}>
        <SmallCloseIcon color={palette.muted} boxSize={6} />
        <Text mt={3} fontWeight={'semibold'}>
            No sprint is available
        </Text>
        <Text mt={1} color={palette.muted} fontSize={'sm'}>
            Rebuild the plan to schedule the next set of questions.
        </Text>
    </Flex>
)

function formatDateRange(startDate, endDate) {
    if (!startDate && !endDate) return 'Schedule not available'
    if (!endDate || startDate === endDate) return startDate
    return `${startDate} – ${endDate}`
}

function isTaskCompleted(task) {
    return task.completed ?? task.isDone ?? task.plannerStatus === 'completed'
}

export default PlannerDashboard
