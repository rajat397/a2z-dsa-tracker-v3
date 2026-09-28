import { Flex, Text, useDisclosure } from '@chakra-ui/react'

import {
    Bookmark,
    GfG,
    LeetCode,
    NoBookmark,
    NoNotes,
    Notes,
    Tick,
    UnTick,
    YouTube,
} from '../icons/ProjectIcons'
import NotesEditor from './NotesEditor.jsx'

const SingleQuestion = ({
    data,
    setData,
    selectedCategoryIndex,
    selectedContentIndex,
    selectedQuestionIndex,
}) => {
    const {
        isOpen: isOpenNotes,
        onOpen: onOpenNotes,
        onClose: onCloseNotes,
    } = useDisclosure()

    const current =
        data.data.content[selectedContentIndex].categoryList[
            selectedCategoryIndex
        ].questionList
    const totalLength = current.length
    const questionHeading = current[selectedQuestionIndex].questionHeading
    const tufArticleLink = current[selectedQuestionIndex].articleLink
    const gfgArticleLink = current[selectedQuestionIndex].gfgArticleLink
    const gfgLink = current[selectedQuestionIndex].gfgLink
    const leetCodeLink = current[selectedQuestionIndex].leetCodeLink
    const code360Link = current[selectedQuestionIndex].code360Link
    const youTubeLink = current[selectedQuestionIndex].youTubeLink
    const userNotes = current[selectedQuestionIndex].userNotes.trim()

    const isDarkMode = data.data.header.darkMode
    const isDone = current[selectedQuestionIndex].isDone
    const isBookmarked = current[selectedQuestionIndex].isBookmarked
    const isNoted = userNotes !== ''
    const isAllowedHost = (link, hosts) => {
        if (!link) return false

        try {
            const hostname = new URL(link).hostname.replace(/^www\./, '')
            return hosts.some(
                host => hostname === host || hostname.endsWith(`.${host}`)
            )
        } catch {
            return false
        }
    }

    const validLeetCodeLink = isAllowedHost(leetCodeLink, ['leetcode.com'])
        ? leetCodeLink
        : ''
    const validGfgLink = isAllowedHost(gfgLink, [
        'geeksforgeeks.org',
        'practice.geeksforgeeks.org',
    ])
        ? gfgLink
        : ''
    const validCode360Link = isAllowedHost(code360Link, [
        'naukri.com',
        'codingninjas.com',
    ])
        ? code360Link
        : ''
    const practiceLink = validLeetCodeLink || validGfgLink || validCode360Link
    const isPracticeLinkAvailable = practiceLink !== ''
    const isTufArticleLinkAvailable = tufArticleLink !== ''
    const isGfgArticleLinkAvailable = gfgArticleLink !== ''
    const isGfgLinkAvailable = validGfgLink !== ''
    const isLeetCodeLinkAvailable = validLeetCodeLink !== ''
    const isCode360LinkAvailable = validCode360Link !== ''
    const isYouTubeLinkAvailable = youTubeLink !== ''

    function onQuestionTickClicked(isQuestionCompleted) {
        const completedQuestion = isQuestionCompleted
            ? data.data.header['completedQuestions'] + 1
            : data.data.header['completedQuestions'] - 1

        const contentCompletedQuestions = isQuestionCompleted
            ? data.data.content[selectedContentIndex][
                  'contentCompletedQuestions'
              ] + 1
            : data.data.content[selectedContentIndex][
                  'contentCompletedQuestions'
              ] - 1

        const categoryCompletedQuestions = isQuestionCompleted
            ? data.data.content[selectedContentIndex].categoryList[
                  selectedCategoryIndex
              ]['categoryCompletedQuestions'] + 1
            : data.data.content[selectedContentIndex].categoryList[
                  selectedCategoryIndex
              ]['categoryCompletedQuestions'] - 1

        setData({
            data: {
                header: {
                    ...data.data.header,
                    completedQuestions: completedQuestion,
                },
                content: [
                    ...data.data.content.map((singleContent, contentIndex) =>
                        contentIndex === selectedContentIndex
                            ? {
                                  ...singleContent,
                                  contentCompletedQuestions:
                                      contentCompletedQuestions,
                                  categoryList: singleContent.categoryList.map(
                                      (singleCategory, categoryIndex) =>
                                          categoryIndex ===
                                          selectedCategoryIndex
                                              ? {
                                                    ...singleCategory,
                                                    categoryCompletedQuestions:
                                                        categoryCompletedQuestions,
                                                    questionList:
                                                        singleCategory.questionList.map(
                                                            (
                                                                singleQuestion,
                                                                questionIndex
                                                            ) =>
                                                                questionIndex ===
                                                                selectedQuestionIndex
                                                                    ? {
                                                                          ...singleQuestion,
                                                                          isDone: isQuestionCompleted,
                                                                          completedAt:
                                                                              isQuestionCompleted
                                                                                  ? Date.now()
                                                                                  : null,
                                                                      }
                                                                    : singleQuestion
                                                        ),
                                                }
                                              : singleCategory
                                  ),
                              }
                            : singleContent
                    ),
                ],
                footer: { ...data.data.footer },
            },
        })
    }

    function onBookmarkClicked(isBookmarked) {
        setData({
            data: {
                header: { ...data.data.header },
                content: [
                    ...data.data.content.map((singleContent, contentIndex) =>
                        contentIndex === selectedContentIndex
                            ? {
                                  ...singleContent,
                                  categoryList: singleContent.categoryList.map(
                                      (singleCategory, categoryIndex) =>
                                          categoryIndex ===
                                          selectedCategoryIndex
                                              ? {
                                                    ...singleCategory,
                                                    questionList:
                                                        singleCategory.questionList.map(
                                                            (
                                                                singleQuestion,
                                                                questionIndex
                                                            ) =>
                                                                questionIndex ===
                                                                selectedQuestionIndex
                                                                    ? {
                                                                          ...singleQuestion,
                                                                          isBookmarked:
                                                                              isBookmarked,
                                                                      }
                                                                    : singleQuestion
                                                        ),
                                                }
                                              : singleCategory
                                  ),
                              }
                            : singleContent
                    ),
                ],
                footer: { ...data.data.footer },
            },
        })
    }

    return (
        <>
            <Flex
                id={current[selectedQuestionIndex].questionId}
                w={'full'}
                py={1}
                px={{ base: 1, md: 2 }}
                borderRadius={4}
                mb={selectedQuestionIndex !== totalLength - 1 ? 2 : 0}
                key={selectedQuestionIndex}
                flexDirection={'row'}
                alignItems={'center'}
                justifyContent={'space-between'}
                _hover={{
                    bg: isDarkMode
                        ? 'selectedQuestion_dark'
                        : 'selectedQuestion',
                }}
            >
                {isDone ? (
                    <Tick
                        color={
                            isDarkMode
                                ? 'highlightedColor_dark'
                                : 'highlightedColor'
                        }
                        onClick={() => onQuestionTickClicked(false)}
                    />
                ) : (
                    <UnTick
                        color={
                            isDarkMode
                                ? 'highlightedColor_dark'
                                : 'highlightedColor'
                        }
                        onClick={() => onQuestionTickClicked(true)}
                    />
                )}

                <Text
                    ml={{ base: 2, md: 4 }}
                    flexGrow={1}
                    minW={0}
                    vertical-align={'middle'}
                    fontWeight={'md'}
                    fontSize={{ base: 'xs', md: 'md' }}
                    fontFamily={'customFamily'}
                    fontStyle={'normal'}
                    textDecorationLine={isDone ? 'line-through' : 'none'}
                    color={
                        isPracticeLinkAvailable
                            ? isDarkMode
                                ? 'highlightedColor_dark'
                                : 'highlightedColor'
                            : isDarkMode
                              ? 'defaultColor_dark'
                              : 'defaultColor'
                    }
                    noOfLines={[2, 3]}
                >
                    {isPracticeLinkAvailable ? (
                        <a
                            href={practiceLink}
                            target={'_blank'}
                            rel="noreferrer"
                        >
                            {questionHeading}
                        </a>
                    ) : (
                        questionHeading
                    )}
                </Text>

                <Flex
                    flexDirection={'row'}
                    alignItems={'center'}
                    flexShrink={0}
                    w={{ base: '220px', md: '274px' }}
                    ml={{ base: 2, md: 6 }}
                >
                    <Flex
                        w={{ base: '82px', md: '94px' }}
                        flexShrink={0}
                        alignItems={'center'}
                        gap={1}
                    >
                        <Text
                            as={'a'}
                            href={
                                isTufArticleLinkAvailable ? tufArticleLink : '#'
                            }
                            target={'_blank'}
                            rel={'noreferrer'}
                            px={1.5}
                            py={0.5}
                            borderRadius={'full'}
                            fontSize={'10px'}
                            fontWeight={'semibold'}
                            color={
                                isDarkMode
                                    ? 'highlightedColor_dark'
                                    : 'highlightedColor'
                            }
                            border={'1px solid'}
                            borderColor={
                                isDarkMode
                                    ? 'highlightedColor_dark'
                                    : 'highlightedColor'
                            }
                            whiteSpace={'nowrap'}
                            visibility={
                                isTufArticleLinkAvailable ? 'visible' : 'hidden'
                            }
                            pointerEvents={
                                isTufArticleLinkAvailable ? 'auto' : 'none'
                            }
                        >
                            TUF
                        </Text>
                        <Text
                            as={'a'}
                            href={
                                isGfgArticleLinkAvailable ? gfgArticleLink : '#'
                            }
                            target={'_blank'}
                            rel={'noreferrer'}
                            px={1.5}
                            py={0.5}
                            borderRadius={'full'}
                            fontSize={'10px'}
                            fontWeight={'semibold'}
                            color={'#2f8d46'}
                            border={'1px solid #2f8d46'}
                            whiteSpace={'nowrap'}
                            visibility={
                                isGfgArticleLinkAvailable ? 'visible' : 'hidden'
                            }
                            pointerEvents={
                                isGfgArticleLinkAvailable ? 'auto' : 'none'
                            }
                        >
                            GFG
                        </Text>
                    </Flex>
                    <Flex
                        w={{ base: '138px', md: '180px' }}
                        flexShrink={0}
                        alignItems={'center'}
                        justifyContent={'flex-end'}
                    >
                        <Flex w={'30px'} justifyContent={'center'}>
                            <YouTube
                                fontSize={'lg'}
                                href={
                                    isYouTubeLinkAvailable
                                        ? youTubeLink
                                        : '/play'
                                }
                                cursor={'pointer'}
                                visibility={
                                    isYouTubeLinkAvailable
                                        ? 'visible'
                                        : 'hidden'
                                }
                            />
                        </Flex>
                        <Flex w={'30px'} justifyContent={'center'}>
                            <GfG
                                fontSize={'lg'}
                                href={
                                    isGfgLinkAvailable ? validGfgLink : '/play'
                                }
                                cursor={'pointer'}
                                visibility={
                                    isGfgLinkAvailable ? 'visible' : 'hidden'
                                }
                            />
                        </Flex>
                        <Flex w={'30px'} justifyContent={'center'}>
                            <LeetCode
                                fontSize={'lg'}
                                href={
                                    isLeetCodeLinkAvailable
                                        ? validLeetCodeLink
                                        : '/play'
                                }
                                cursor={'pointer'}
                                visibility={
                                    isLeetCodeLinkAvailable
                                        ? 'visible'
                                        : 'hidden'
                                }
                            />
                        </Flex>
                        <Flex
                            w={{ base: '48px', md: '70px' }}
                            justifyContent={'center'}
                        >
                            <Text
                                as={'a'}
                                href={
                                    isCode360LinkAvailable
                                        ? validCode360Link
                                        : '#'
                                }
                                target={'_blank'}
                                rel={'noreferrer'}
                                px={1.5}
                                py={0.5}
                                borderRadius={4}
                                fontSize={'xs'}
                                fontWeight={'bold'}
                                color={'#ef6c00'}
                                border={'1px solid #ef6c00'}
                                visibility={
                                    isCode360LinkAvailable
                                        ? 'visible'
                                        : 'hidden'
                                }
                                pointerEvents={
                                    isCode360LinkAvailable ? 'auto' : 'none'
                                }
                            >
                                C360
                            </Text>
                        </Flex>
                    </Flex>
                </Flex>
                <Flex
                    flexDirection={'row'}
                    w={'60px'}
                    ml={4}
                    flexShrink={0}
                    display={{ base: 'none', md: 'flex' }}
                    cursor={'pointer'}
                    alignItems={'center'}
                    justifyContent={'space-between'}
                >
                    {isNoted ? (
                        <Notes
                            fontSize={'lg'}
                            color={
                                isDarkMode
                                    ? 'indianFlag1Color_dark'
                                    : 'indianFlag1Color'
                            }
                            onClick={onOpenNotes}
                        />
                    ) : (
                        <NoNotes
                            fontSize={'lg'}
                            color={
                                isDarkMode
                                    ? 'indianFlag1Color_dark'
                                    : 'indianFlag1Color'
                            }
                            onClick={onOpenNotes}
                        />
                    )}
                    {isBookmarked ? (
                        <Bookmark
                            ml={4}
                            fontSize={'lg'}
                            color={
                                isDarkMode
                                    ? 'indianFlag3Color_dark'
                                    : 'indianFlag3Color'
                            }
                            onClick={() => onBookmarkClicked(false)}
                        />
                    ) : (
                        <NoBookmark
                            ml={4}
                            fontSize={'lg'}
                            color={
                                isDarkMode
                                    ? 'indianFlag3Color_dark'
                                    : 'indianFlag3Color'
                            }
                            onClick={() => onBookmarkClicked(true)}
                        />
                    )}
                </Flex>
            </Flex>
            <NotesEditor
                data={data}
                setData={setData}
                selectedContentIndex={selectedContentIndex}
                selectedCategoryIndex={selectedCategoryIndex}
                selectedQuestionIndex={selectedQuestionIndex}
                isOpenNotes={isOpenNotes}
                onCloseNotes={onCloseNotes}
                openedBy={'question'}
            />
        </>
    )
}

export default SingleQuestion
