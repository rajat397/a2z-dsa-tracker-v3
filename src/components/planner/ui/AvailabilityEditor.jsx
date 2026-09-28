import { CalendarIcon } from '@chakra-ui/icons'
import {
    Box,
    Flex,
    FormControl,
    FormLabel,
    Grid,
    Slider,
    SliderFilledTrack,
    SliderMark,
    SliderThumb,
    SliderTrack,
    Stack,
    Text,
} from '@chakra-ui/react'

import { createSchedule } from '../createSchedule.js'
import {
    clampHours,
    DAYS,
    formatDuration,
    getLocalDateInputValue,
    getPalette,
} from './plannerUi.js'

const HOUR_MARKS = Array.from({ length: 15 }, (_, index) => index + 1)

const AvailabilityEditor = ({
    availability,
    onChange,
    isDarkMode = false,
    compact = false,
    totalEstimatedMinutes,
    taskEstimates = [],
}) => {
    const palette = getPalette(isDarkMode)
    const weeklyHours = DAYS.reduce(
        (total, day) => total + (Number(availability[day.id]) || 0),
        0
    )
    const hasTaskEstimates = taskEstimates.length > 0
    const hasEstimate = hasTaskEstimates || Number(totalEstimatedMinutes) > 0
    const estimatedDays = (() => {
        if (!hasEstimate || weeklyHours === 0) return null
        if (hasTaskEstimates) {
            return createSchedule({
                tasks: taskEstimates.map((estimatedMinutes, index) => ({
                    id: `estimate-${index}`,
                    estimatedMinutes,
                })),
                weeklyAvailability: availability,
                startDate: getLocalDateInputValue(),
            }).days.length
        }

        return Math.ceil(
            (Number(totalEstimatedMinutes) * DAYS.length) / (weeklyHours * 60)
        )
    })()

    const updateDay = (dayId, hours) => {
        onChange({
            ...availability,
            [dayId]: clampHours(hours),
        })
    }

    return (
        <Box>
            {hasEstimate && !compact && (
                <Flex
                    mb={4}
                    px={4}
                    py={3}
                    gap={4}
                    align={'center'}
                    justify={'space-between'}
                    borderLeft={'2px solid'}
                    borderColor={palette.accent}
                    borderRadius={'lg'}
                    bg={palette.accentSoft}
                >
                    <Text color={palette.subtle} fontSize={'sm'}>
                        You can finish earlier by adding more hours on any day.
                    </Text>
                    <Text
                        color={palette.muted}
                        fontSize={'sm'}
                        whiteSpace={'nowrap'}
                    >
                        Est. days:{' '}
                        <Text
                            as={'span'}
                            color={palette.accent}
                            fontSize={'lg'}
                            fontWeight={'bold'}
                        >
                            {estimatedDays ?? '—'}
                        </Text>
                    </Text>
                </Flex>
            )}

            <Stack spacing={compact ? 2 : 3}>
                {DAYS.map(day => {
                    const hours = availability[day.id] ?? 0
                    const hourLabel = `${hours} ${
                        hours === 1 ? 'hour' : 'hours'
                    }`

                    return (
                        <FormControl
                            key={day.id}
                            px={compact ? 3 : 4}
                            py={compact ? 3 : 4}
                            border={'1px solid'}
                            borderColor={palette.border}
                            borderRadius={'lg'}
                            bg={palette.elevated}
                        >
                            <Grid
                                templateAreas={{
                                    base: '"label value" "slider slider"',
                                    md: '"label slider value"',
                                }}
                                templateColumns={{
                                    base: 'minmax(0, 1fr) auto',
                                    md: `${compact ? '100px' : '132px'} minmax(180px, 1fr) ${
                                        compact ? '72px' : '88px'
                                    }`,
                                }}
                                alignItems={'center'}
                                columnGap={compact ? 4 : 6}
                                rowGap={3}
                            >
                                <FormLabel
                                    htmlFor={`availability-${day.id}`}
                                    gridArea={'label'}
                                    mb={0}
                                    display={'flex'}
                                    alignItems={'center'}
                                    gap={2}
                                    color={palette.text}
                                    fontSize={compact ? 'sm' : 'md'}
                                    fontWeight={'semibold'}
                                >
                                    <CalendarIcon
                                        color={palette.accent}
                                        aria-hidden={'true'}
                                    />
                                    {day.label}
                                </FormLabel>

                                <Box gridArea={'slider'} minW={0}>
                                    <Slider
                                        id={`availability-${day.id}`}
                                        min={0}
                                        max={16}
                                        step={1}
                                        value={hours}
                                        onChange={value =>
                                            updateDay(day.id, value)
                                        }
                                        focusThumbOnChange={false}
                                        colorScheme={'blue'}
                                        aria-valuetext={hourLabel}
                                        aria-label={`${day.label} study hours`}
                                    >
                                        <SliderTrack
                                            h={1.5}
                                            bg={palette.border}
                                        >
                                            <SliderFilledTrack
                                                bg={palette.accent}
                                            />
                                        </SliderTrack>
                                        {HOUR_MARKS.map(mark => (
                                            <SliderMark
                                                key={mark}
                                                value={mark}
                                                top={'50%'}
                                                mt={'-4px'}
                                                ml={'-1px'}
                                                w={'2px'}
                                                h={'8px'}
                                                borderRadius={'full'}
                                                bg={
                                                    mark <= hours
                                                        ? isDarkMode
                                                            ? '#bfdbfe'
                                                            : '#ffffff'
                                                        : isDarkMode
                                                          ? '#29436d'
                                                          : '#bfdbfe'
                                                }
                                                opacity={
                                                    mark <= hours ? 0.65 : 1
                                                }
                                                pointerEvents={'none'}
                                                zIndex={1}
                                                aria-hidden={'true'}
                                            />
                                        ))}
                                        <SliderThumb
                                            boxSize={compact ? 4 : 5}
                                            bg={palette.panel}
                                            border={'2px solid'}
                                            borderColor={palette.accent}
                                            _focusVisible={{
                                                boxShadow: `0 0 0 3px ${palette.accentSoft}`,
                                            }}
                                        />
                                    </Slider>
                                    <Flex
                                        mt={1}
                                        justify={'space-between'}
                                        color={palette.muted}
                                        fontSize={'xs'}
                                        aria-hidden={'true'}
                                    >
                                        <Text>0 hr</Text>
                                        <Text>16 hr</Text>
                                    </Flex>
                                </Box>

                                <Text
                                    gridArea={'value'}
                                    color={
                                        hours > 0 ? palette.text : palette.muted
                                    }
                                    fontSize={compact ? 'sm' : 'md'}
                                    fontWeight={'medium'}
                                    textAlign={'right'}
                                    whiteSpace={'nowrap'}
                                    aria-hidden={'true'}
                                >
                                    {hourLabel}
                                </Text>
                            </Grid>
                        </FormControl>
                    )
                })}
            </Stack>

            <Text mt={4} color={palette.muted} fontSize={'sm'}>
                You have allocated a total of{' '}
                <Text as={'span'} color={palette.text} fontWeight={'semibold'}>
                    {formatDuration(weeklyHours * 60)}
                </Text>{' '}
                for your weekly schedule.
            </Text>
        </Box>
    )
}

export default AvailabilityEditor
