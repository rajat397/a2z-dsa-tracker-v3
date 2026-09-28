import { CloseIcon, SearchIcon } from '@chakra-ui/icons'
import {
    Badge,
    Box,
    Flex,
    IconButton,
    Input,
    InputGroup,
    InputLeftElement,
    InputRightElement,
    Text,
} from '@chakra-ui/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
    flattenQuestionsForSearch,
    normalizeQuestionSearch,
    searchQuestions,
} from './questionSearch.js'

const GlobalQuestionSearch = ({ data }) => {
    const navigate = useNavigate()
    const inputRef = useRef(null)
    const optionRefs = useRef([])
    const [query, setQuery] = useState('')
    const [activeIndex, setActiveIndex] = useState(0)
    const [isExpanded, setIsExpanded] = useState(false)
    const isDarkMode = data.data.header.darkMode

    const questions = useMemo(() => flattenQuestionsForSearch(data), [data])

    const normalizedQuery = normalizeQuestionSearch(query)
    const matches = useMemo(
        () => searchQuestions(questions, normalizedQuery),
        [normalizedQuery, questions]
    )
    const visibleMatches = matches
    const isOpen = normalizedQuery !== '' && isExpanded

    useEffect(() => {
        if (!isOpen || visibleMatches.length === 0) return
        optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' })
    }, [activeIndex, isOpen, visibleMatches.length])

    const chooseResult = result => {
        setQuery('')
        setIsExpanded(false)
        navigate(
            `${result.topicPath}?question=${encodeURIComponent(result.id)}`
        )
    }

    const clearSearch = () => {
        setQuery('')
        setActiveIndex(0)
        setIsExpanded(false)
        window.requestAnimationFrame(() => inputRef.current?.focus())
    }

    const handleKeyDown = event => {
        if (event.key === 'Escape' && isOpen) {
            event.preventDefault()
            clearSearch()
            return
        }
        if (!isOpen || visibleMatches.length === 0) return

        if (event.key === 'ArrowDown') {
            event.preventDefault()
            setActiveIndex(index => (index + 1) % visibleMatches.length)
        } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            setActiveIndex(
                index =>
                    (index - 1 + visibleMatches.length) % visibleMatches.length
            )
        } else if (event.key === 'Enter') {
            event.preventDefault()
            chooseResult(visibleMatches[activeIndex] ?? visibleMatches[0])
        }
    }

    const handleChange = event => {
        setQuery(event.target.value)
        setActiveIndex(0)
        setIsExpanded(true)
    }

    return (
        <Box
            position={'relative'}
            w={'90vw'}
            maxW={'840px'}
            mt={4}
            zIndex={20}
            onBlur={event => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                    setIsExpanded(false)
                }
            }}
        >
            <InputGroup size={'lg'}>
                <InputLeftElement pointerEvents={'none'}>
                    <SearchIcon
                        color={
                            isDarkMode
                                ? 'highlightedColor_dark'
                                : 'highlightedColor'
                        }
                    />
                </InputLeftElement>
                <Input
                    ref={inputRef}
                    role={'combobox'}
                    aria-label={'Search the full DSA sheet'}
                    aria-autocomplete={'list'}
                    aria-expanded={isOpen}
                    aria-controls={'global-question-results'}
                    aria-describedby={
                        isOpen ? 'global-question-status' : undefined
                    }
                    aria-activedescendant={
                        visibleMatches.length > 0
                            ? `global-question-result-${activeIndex}`
                            : undefined
                    }
                    value={query}
                    onFocus={() => setIsExpanded(true)}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={'Search all 487 questions...'}
                    bg={isDarkMode ? 'topicStillBg_dark' : 'secondaryColor'}
                    borderColor={
                        isDarkMode ? 'borderColor_dark' : 'borderColor'
                    }
                    color={isDarkMode ? 'defaultColor_dark' : 'defaultColor'}
                    borderRadius={'full'}
                    boxShadow={'sm'}
                    pr={query ? 12 : 4}
                />
                {query && (
                    <InputRightElement>
                        <IconButton
                            aria-label={'Clear full-sheet search'}
                            icon={<CloseIcon boxSize={2.5} />}
                            size={'sm'}
                            variant={'ghost'}
                            borderRadius={'full'}
                            onClick={clearSearch}
                        />
                    </InputRightElement>
                )}
            </InputGroup>

            {isOpen && (
                <Box
                    position={'absolute'}
                    top={'calc(100% + 8px)'}
                    left={0}
                    right={0}
                    bg={isDarkMode ? 'topicStillBg_dark' : 'secondaryColor'}
                    border={'1px solid'}
                    borderColor={
                        isDarkMode ? 'borderColor_dark' : 'borderColor'
                    }
                    borderRadius={'xl'}
                    boxShadow={'xl'}
                >
                    <Flex
                        id={'global-question-status'}
                        role={'status'}
                        aria-live={'polite'}
                        px={4}
                        py={2}
                        color={isDarkMode ? 'textColor_dark' : 'textColor'}
                        fontSize={'xs'}
                    >
                        <Text>{matches.length} results</Text>
                    </Flex>
                    <Box
                        id={'global-question-results'}
                        role={'listbox'}
                        aria-label={'Full-sheet question results'}
                        maxH={'360px'}
                        overflowY={'auto'}
                    >
                        {visibleMatches.map((result, index) => (
                            <Box
                                ref={element => {
                                    optionRefs.current[index] = element
                                }}
                                id={`global-question-result-${index}`}
                                role={'option'}
                                tabIndex={-1}
                                aria-selected={index === activeIndex}
                                key={result.id}
                                w={'full'}
                                px={4}
                                py={3}
                                textAlign={'left'}
                                cursor={'pointer'}
                                bg={
                                    index === activeIndex
                                        ? isDarkMode
                                            ? 'selectedQuestion_dark'
                                            : 'selectedQuestion'
                                        : 'transparent'
                                }
                                borderTop={'1px solid'}
                                borderColor={
                                    isDarkMode
                                        ? 'borderColor_dark'
                                        : 'borderColor'
                                }
                                _hover={{
                                    bg: isDarkMode
                                        ? 'selectedQuestion_dark'
                                        : 'selectedQuestion',
                                }}
                                onMouseDown={event => event.preventDefault()}
                                onMouseMove={() => setActiveIndex(index)}
                                onClick={() => chooseResult(result)}
                            >
                                <Flex align={'center'} gap={3}>
                                    <Box minW={0} flex={1}>
                                        <Text
                                            color={
                                                isDarkMode
                                                    ? 'defaultColor_dark'
                                                    : 'defaultColor'
                                            }
                                            fontWeight={'semibold'}
                                            noOfLines={1}
                                        >
                                            {result.title}
                                        </Text>
                                        <Text
                                            mt={1}
                                            color={
                                                isDarkMode
                                                    ? 'textColor_dark'
                                                    : 'textColor'
                                            }
                                            fontSize={'xs'}
                                            noOfLines={1}
                                        >
                                            {result.topic} · {result.category}
                                        </Text>
                                    </Box>
                                    <Badge
                                        colorScheme={
                                            result.isDone ? 'green' : 'blue'
                                        }
                                        borderRadius={'full'}
                                    >
                                        {result.isDone ? 'Done' : 'Pending'}
                                    </Badge>
                                </Flex>
                            </Box>
                        ))}
                    </Box>
                    {visibleMatches.length === 0 && (
                        <Text
                            px={4}
                            py={5}
                            color={isDarkMode ? 'textColor_dark' : 'textColor'}
                            textAlign={'center'}
                        >
                            No matching questions found.
                        </Text>
                    )}
                </Box>
            )}
        </Box>
    )
}

export default GlobalQuestionSearch
