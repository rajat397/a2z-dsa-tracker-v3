import {
    ArrowBackIcon,
    ArrowForwardIcon,
    CalendarIcon,
    CheckIcon,
} from '@chakra-ui/icons'
import {
    Badge,
    Box,
    Button,
    Checkbox,
    Divider,
    Flex,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Grid,
    Heading,
    Input,
    Progress,
    Radio,
    RadioGroup,
    Stack,
    Text,
} from '@chakra-ui/react'
import { useMemo, useState } from 'react'

import AvailabilityEditor from './AvailabilityEditor.jsx'
import {
    addDaysToDateInput,
    createDefaultAvailability,
    DAYS,
    formatDuration,
    getLocalDateInputValue,
    getPalette,
    getTopicRemainingQuestions,
} from './plannerUi.js'

const STEPS = [
    { id: 'roadmap', label: 'Review roadmap' },
    { id: 'availability', label: 'Set availability' },
    { id: 'finalise', label: 'Finalise plan' },
]

/**
 * Guided planner setup.
 *
 * Topic shape: { id, name, questionCount, remainingCount, estimatedMinutes,
 * selected? }
 * onGenerate receives { planName, topicIds, weeklyAvailability,
 * startDate, startOption }.
 */
const PlannerWizard = ({
    topics = [],
    tasks = [],
    defaultAvailability,
    onGenerate,
    onCancel,
    isDarkMode = false,
    initialPlanName = 'My A2Z plan',
}) => {
    const palette = getPalette(isDarkMode)
    const [stepIndex, setStepIndex] = useState(0)
    const [selectedTopicIds, setSelectedTopicIds] = useState(() =>
        topics
            .filter(topic => topic.selected !== false)
            .map(topic => String(topic.id))
    )
    const [availability, setAvailability] = useState(() =>
        createDefaultAvailability(defaultAvailability)
    )
    const [planName, setPlanName] = useState(initialPlanName)
    const [startOption, setStartOption] = useState('today')
    const today = getLocalDateInputValue()
    const tomorrow = addDaysToDateInput(today, 1)
    const [customStartDate, setCustomStartDate] = useState(tomorrow)
    const now = new Date()
    const todayId = DAYS[(now.getDay() + 6) % 7].id
    const remainingMinutesToday =
        24 * 60 - (now.getHours() * 60 + now.getMinutes())
    const canStartToday = availability[todayId] * 60 <= remainingMinutesToday

    const selectedTopics = useMemo(
        () =>
            topics.filter(topic => selectedTopicIds.includes(String(topic.id))),
        [selectedTopicIds, topics]
    )
    const selectedQuestionCount = selectedTopics.reduce(
        (total, topic) => total + getTopicRemainingQuestions(topic),
        0
    )
    const selectedEstimatedMinutes = selectedTopics.reduce(
        (total, topic) => total + (Number(topic.estimatedMinutes) || 0),
        0
    )
    const selectedTaskEstimates = useMemo(() => {
        const topicIds = new Set(selectedTopicIds)
        return tasks
            .filter(task => topicIds.has(String(task.topicId)) && !task.isDone)
            .map(task => task.estimatedMinutes)
    }, [selectedTopicIds, tasks])
    const weeklyHours = DAYS.reduce(
        (total, day) => total + availability[day.id],
        0
    )
    const customDateInvalid =
        startOption === 'custom' &&
        (customStartDate === '' || customStartDate < today)
    const todayUnavailable = startOption === 'today' && !canStartToday
    const canContinue =
        stepIndex === 0
            ? selectedQuestionCount > 0
            : stepIndex === 1
              ? weeklyHours > 0
              : planName.trim() !== '' &&
                !customDateInvalid &&
                !todayUnavailable

    const toggleTopic = topicId => {
        const normalizedId = String(topicId)
        setSelectedTopicIds(currentIds =>
            currentIds.includes(normalizedId)
                ? currentIds.filter(currentId => currentId !== normalizedId)
                : [...currentIds, normalizedId]
        )
    }

    const handlePrimaryAction = () => {
        if (stepIndex < STEPS.length - 1) {
            setStepIndex(currentStep => currentStep + 1)
            return
        }

        const startDate =
            startOption === 'today'
                ? today
                : startOption === 'tomorrow'
                  ? tomorrow
                  : customStartDate

        onGenerate?.({
            planName: planName.trim(),
            topicIds: selectedTopicIds,
            weeklyAvailability: availability,
            startDate,
            startOption,
        })
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
                px={{ base: 4, md: 8 }}
                py={5}
                bg={palette.panel}
                borderBottom={'1px solid'}
                borderColor={palette.border}
            >
                <Flex
                    maxW={'1180px'}
                    mx={'auto'}
                    align={{ base: 'flex-start', md: 'center' }}
                    justify={'space-between'}
                    gap={4}
                    direction={{ base: 'column', md: 'row' }}
                >
                    <Box>
                        <Badge
                            mb={2}
                            color={palette.accent}
                            bg={palette.accentSoft}
                            borderRadius={'full'}
                            px={2}
                        >
                            PLANLY
                        </Badge>
                        <Heading size={'lg'}>Build your study plan</Heading>
                        <Text mt={1} color={palette.muted} fontSize={'sm'}>
                            Turn the remaining roadmap into achievable daily
                            sessions.
                        </Text>
                    </Box>
                    {onCancel && (
                        <Button
                            variant={'ghost'}
                            color={palette.subtle}
                            onClick={onCancel}
                        >
                            Exit planner
                        </Button>
                    )}
                </Flex>
            </Box>

            <Box
                as={'main'}
                w={'100%'}
                maxW={'1180px'}
                mx={'auto'}
                px={{ base: 4, md: 8 }}
                py={{ base: 6, md: 10 }}
            >
                <Flex
                    as={'ol'}
                    aria-label={'Plan creation progress'}
                    listStyleType={'none'}
                    p={0}
                    m={0}
                    mb={8}
                    align={'center'}
                >
                    {STEPS.map((step, index) => {
                        const isComplete = index < stepIndex
                        const isCurrent = index === stepIndex

                        return (
                            <Flex
                                as={'li'}
                                key={step.id}
                                flex={index < STEPS.length - 1 ? 1 : 'none'}
                                align={'center'}
                                aria-current={isCurrent ? 'step' : undefined}
                                aria-label={`${step.label}${
                                    isComplete
                                        ? ' completed'
                                        : isCurrent
                                          ? ' current step'
                                          : ''
                                }`}
                            >
                                <Flex align={'center'} minW={0}>
                                    <Flex
                                        w={8}
                                        h={8}
                                        flexShrink={0}
                                        align={'center'}
                                        justify={'center'}
                                        borderRadius={'full'}
                                        border={'1px solid'}
                                        borderColor={
                                            isComplete || isCurrent
                                                ? palette.accent
                                                : palette.border
                                        }
                                        bg={
                                            isComplete
                                                ? palette.accent
                                                : isCurrent
                                                  ? palette.accentSoft
                                                  : palette.panel
                                        }
                                        color={
                                            isComplete
                                                ? '#ffffff'
                                                : isCurrent
                                                  ? palette.accent
                                                  : palette.muted
                                        }
                                        fontSize={'sm'}
                                        fontWeight={'bold'}
                                    >
                                        {isComplete ? (
                                            <CheckIcon boxSize={3} />
                                        ) : (
                                            index + 1
                                        )}
                                    </Flex>
                                    <Text
                                        ml={2}
                                        display={{ base: 'none', sm: 'block' }}
                                        color={
                                            isCurrent
                                                ? palette.text
                                                : palette.muted
                                        }
                                        fontSize={'sm'}
                                        fontWeight={
                                            isCurrent ? 'semibold' : 'normal'
                                        }
                                        whiteSpace={'nowrap'}
                                    >
                                        {step.label}
                                    </Text>
                                </Flex>
                                {index < STEPS.length - 1 && (
                                    <Box
                                        h={'1px'}
                                        flex={1}
                                        mx={{ base: 2, md: 4 }}
                                        bg={
                                            index < stepIndex
                                                ? palette.accent
                                                : palette.border
                                        }
                                    />
                                )}
                            </Flex>
                        )
                    })}
                </Flex>

                <Box
                    bg={palette.panel}
                    border={'1px solid'}
                    borderColor={palette.border}
                    borderRadius={'2xl'}
                    boxShadow={
                        isDarkMode
                            ? '0 16px 40px rgba(0, 0, 0, 0.22)'
                            : '0 16px 40px rgba(15, 23, 42, 0.08)'
                    }
                    overflow={'hidden'}
                >
                    <Box px={{ base: 4, md: 7 }} py={6}>
                        {stepIndex === 0 && (
                            <RoadmapStep
                                topics={topics}
                                selectedTopicIds={selectedTopicIds}
                                selectedQuestionCount={selectedQuestionCount}
                                onToggleTopic={toggleTopic}
                                onSelectAll={() =>
                                    setSelectedTopicIds(
                                        topics.map(topic => String(topic.id))
                                    )
                                }
                                onClear={() => setSelectedTopicIds([])}
                                palette={palette}
                            />
                        )}
                        {stepIndex === 1 && (
                            <AvailabilityStep
                                availability={availability}
                                onChange={setAvailability}
                                isDarkMode={isDarkMode}
                                totalEstimatedMinutes={selectedEstimatedMinutes}
                                taskEstimates={selectedTaskEstimates}
                                palette={palette}
                            />
                        )}
                        {stepIndex === 2 && (
                            <FinaliseStep
                                planName={planName}
                                onPlanNameChange={setPlanName}
                                startOption={startOption}
                                onStartOptionChange={setStartOption}
                                customStartDate={customStartDate}
                                onCustomStartDateChange={setCustomStartDate}
                                minStartDate={today}
                                customDateInvalid={customDateInvalid}
                                canStartToday={canStartToday}
                                selectedTopicCount={selectedTopicIds.length}
                                selectedQuestionCount={selectedQuestionCount}
                                weeklyHours={weeklyHours}
                                palette={palette}
                            />
                        )}
                    </Box>

                    <Divider borderColor={palette.border} />
                    <Flex
                        px={{ base: 4, md: 7 }}
                        py={4}
                        gap={3}
                        justify={'space-between'}
                        bg={palette.elevated}
                    >
                        <Button
                            leftIcon={<ArrowBackIcon />}
                            variant={'ghost'}
                            color={palette.subtle}
                            visibility={stepIndex === 0 ? 'hidden' : 'visible'}
                            onClick={() =>
                                setStepIndex(currentStep => currentStep - 1)
                            }
                        >
                            Back
                        </Button>
                        <Button
                            rightIcon={
                                stepIndex === STEPS.length - 1 ? (
                                    <CheckIcon />
                                ) : (
                                    <ArrowForwardIcon />
                                )
                            }
                            colorScheme={'blue'}
                            isDisabled={!canContinue}
                            onClick={handlePrimaryAction}
                        >
                            {stepIndex === STEPS.length - 1
                                ? 'Create my plan'
                                : 'Continue'}
                        </Button>
                    </Flex>
                </Box>
            </Box>
        </Flex>
    )
}

const RoadmapStep = ({
    topics,
    selectedTopicIds,
    selectedQuestionCount,
    onToggleTopic,
    onSelectAll,
    onClear,
    palette,
}) => (
    <Box>
        <Flex
            align={{ base: 'flex-start', md: 'center' }}
            justify={'space-between'}
            gap={4}
            direction={{ base: 'column', md: 'row' }}
        >
            <Box>
                <Heading size={'md'}>Review your roadmap</Heading>
                <Text mt={2} color={palette.muted}>
                    Choose the topics Planly should schedule. Completed
                    questions stay out of the plan.
                </Text>
            </Box>
            <Box
                px={4}
                py={3}
                bg={palette.accentSoft}
                borderRadius={'xl'}
                minW={'160px'}
            >
                <Text color={palette.muted} fontSize={'xs'}>
                    QUESTIONS TO PLAN
                </Text>
                <Text
                    color={palette.accent}
                    fontSize={'2xl'}
                    fontWeight={'bold'}
                >
                    {selectedQuestionCount}
                </Text>
            </Box>
        </Flex>

        <Flex mt={6} mb={3} gap={2} justify={'flex-end'}>
            <Button size={'sm'} variant={'ghost'} onClick={onSelectAll}>
                Select all
            </Button>
            <Button size={'sm'} variant={'ghost'} onClick={onClear}>
                Clear
            </Button>
        </Flex>

        <Grid
            maxH={'430px'}
            overflowY={'auto'}
            templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
            gap={3}
            pr={1}
        >
            {topics.map(topic => {
                const id = String(topic.id)
                const isSelected = selectedTopicIds.includes(id)
                const totalQuestions =
                    Number(topic.questionCount ?? topic.totalQuestions) || 0
                const remainingQuestions = getTopicRemainingQuestions(topic)
                const completedQuestions = Math.max(
                    0,
                    totalQuestions - remainingQuestions
                )
                const completedPercent = totalQuestions
                    ? Math.min(100, (completedQuestions / totalQuestions) * 100)
                    : 0

                return (
                    <Box
                        as={'div'}
                        key={id}
                        p={4}
                        border={'1px solid'}
                        borderColor={
                            isSelected ? palette.accent : palette.border
                        }
                        borderRadius={'xl'}
                        bg={isSelected ? palette.accentSoft : palette.elevated}
                        transition={'border-color 0.15s ease'}
                    >
                        <Flex align={'flex-start'} gap={3}>
                            <Checkbox
                                mt={1}
                                colorScheme={'blue'}
                                isChecked={isSelected}
                                onChange={() => onToggleTopic(id)}
                                aria-label={`Include ${
                                    topic.name ?? topic.title
                                }`}
                            />
                            <Box minW={0} flex={1}>
                                <Text
                                    color={palette.text}
                                    fontWeight={'semibold'}
                                    noOfLines={2}
                                >
                                    {topic.name ?? topic.title}
                                </Text>
                                <Flex
                                    mt={2}
                                    justify={'space-between'}
                                    color={palette.muted}
                                    fontSize={'xs'}
                                >
                                    <Text>{remainingQuestions} remaining</Text>
                                    <Text>
                                        {completedQuestions}/{totalQuestions}
                                    </Text>
                                </Flex>
                                <Progress
                                    mt={2}
                                    value={completedPercent}
                                    size={'xs'}
                                    colorScheme={'green'}
                                    borderRadius={'full'}
                                    bg={palette.border}
                                    aria-label={`${
                                        topic.name ?? topic.title
                                    } completion`}
                                />
                            </Box>
                        </Flex>
                    </Box>
                )
            })}
        </Grid>
    </Box>
)

const AvailabilityStep = ({
    availability,
    onChange,
    isDarkMode,
    totalEstimatedMinutes,
    taskEstimates,
    palette,
}) => (
    <Box>
        <Heading size={'md'}>How much time do you have?</Heading>
        <Text mt={2} mb={6} color={palette.muted}>
            Start with 3 hours from Monday to Friday and 5 hours on weekends,
            then adjust each day around your routine.
        </Text>
        <AvailabilityEditor
            availability={availability}
            onChange={onChange}
            isDarkMode={isDarkMode}
            totalEstimatedMinutes={totalEstimatedMinutes}
            taskEstimates={taskEstimates}
        />
    </Box>
)

const FinaliseStep = ({
    planName,
    onPlanNameChange,
    startOption,
    onStartOptionChange,
    customStartDate,
    onCustomStartDateChange,
    minStartDate,
    customDateInvalid,
    canStartToday,
    selectedTopicCount,
    selectedQuestionCount,
    weeklyHours,
    palette,
}) => (
    <Box>
        <Heading size={'md'}>Finalise your plan</Heading>
        <Text mt={2} color={palette.muted}>
            Give it a name and choose when your first sprint should begin.
        </Text>

        <Grid
            mt={7}
            templateColumns={{ base: '1fr', lg: 'minmax(0, 1.4fr) 320px' }}
            gap={7}
        >
            <Stack spacing={6}>
                <FormControl isRequired>
                    <FormLabel color={palette.text}>Plan name</FormLabel>
                    <Input
                        value={planName}
                        onChange={event => onPlanNameChange(event.target.value)}
                        maxLength={60}
                        bg={palette.elevated}
                        borderColor={palette.border}
                        placeholder={'My A2Z plan'}
                    />
                </FormControl>

                <FormControl as={'fieldset'}>
                    <FormLabel as={'legend'} color={palette.text}>
                        Start date
                    </FormLabel>
                    <RadioGroup
                        value={startOption}
                        onChange={onStartOptionChange}
                    >
                        <Grid
                            templateColumns={{
                                base: '1fr',
                                sm: 'repeat(3, minmax(0, 1fr))',
                            }}
                            gap={3}
                        >
                            {[
                                ['today', 'Today'],
                                ['tomorrow', 'Tomorrow'],
                                ['custom', 'Choose date'],
                            ].map(([value, label]) => (
                                <Box
                                    as={'div'}
                                    key={value}
                                    p={3}
                                    border={'1px solid'}
                                    borderColor={
                                        startOption === value
                                            ? palette.accent
                                            : palette.border
                                    }
                                    borderRadius={'lg'}
                                    bg={
                                        startOption === value
                                            ? palette.accentSoft
                                            : palette.elevated
                                    }
                                >
                                    <Radio
                                        value={value}
                                        colorScheme={'blue'}
                                        isDisabled={
                                            value === 'today' && !canStartToday
                                        }
                                    >
                                        {label}
                                    </Radio>
                                </Box>
                            ))}
                        </Grid>
                    </RadioGroup>
                    {!canStartToday && (
                        <Text mt={2} color={palette.muted} fontSize={'xs'}>
                            There is not enough time left today for today&apos;s
                            allocated hours. Choose tomorrow or a later date.
                        </Text>
                    )}
                </FormControl>

                {startOption === 'custom' && (
                    <FormControl isRequired isInvalid={customDateInvalid}>
                        <FormLabel color={palette.text}>
                            Custom start date
                        </FormLabel>
                        <Input
                            type={'date'}
                            min={minStartDate}
                            value={customStartDate}
                            onChange={event =>
                                onCustomStartDateChange(event.target.value)
                            }
                            bg={palette.elevated}
                            borderColor={palette.border}
                        />
                        <FormErrorMessage>
                            Choose today or a later date.
                        </FormErrorMessage>
                    </FormControl>
                )}
            </Stack>

            <Box
                p={5}
                h={'fit-content'}
                border={'1px solid'}
                borderColor={palette.border}
                borderRadius={'xl'}
                bg={palette.elevated}
            >
                <Flex align={'center'} gap={2}>
                    <CalendarIcon color={palette.accent} />
                    <Text fontWeight={'semibold'}>Plan summary</Text>
                </Flex>
                <Stack mt={4} spacing={3}>
                    <SummaryRow
                        label={'Topics'}
                        value={selectedTopicCount}
                        palette={palette}
                    />
                    <SummaryRow
                        label={'Questions'}
                        value={selectedQuestionCount}
                        palette={palette}
                    />
                    <SummaryRow
                        label={'Weekly time'}
                        value={formatDuration(weeklyHours * 60, true)}
                        palette={palette}
                    />
                </Stack>
            </Box>
        </Grid>
    </Box>
)

const SummaryRow = ({ label, value, palette }) => (
    <Flex justify={'space-between'} gap={3}>
        <Text color={palette.muted} fontSize={'sm'}>
            {label}
        </Text>
        <Text color={palette.text} fontSize={'sm'} fontWeight={'semibold'}>
            {value}
        </Text>
    </Flex>
)

export default PlannerWizard
