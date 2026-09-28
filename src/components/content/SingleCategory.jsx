import { Flex, Text } from '@chakra-ui/react'

import SingleQuestion from './SingleQuestion.jsx'

import { Tick, UnTick } from '../icons/ProjectIcons'
import { orderQuestionsForDisplay } from '../search/questionSearch.js'

const SingleCategory = ({
    data,
    setData,
    selectedContentIndex,
    selectedCategoryIndex,
    searchValue,
    focusedQuestionId,
}) => {
    const isDarkMode = data.data.header.darkMode
    const current =
        data.data.content[selectedContentIndex].categoryList[
            selectedCategoryIndex
        ]
    const categoryId = current.categoryId
    const categoryName = current.categoryName
    const listOfQuestion = current.questionList
    const isCompleted =
        current.categoryTotalQuestions === current.categoryCompletedQuestions
    const isBookmark = data.data.header.isBookmarkFilterRequired
    const isSearchable = searchValue !== ''
    const isCategoryDone = current.questionList.every(q => q.isDone)

    const filteredListOfQuestions = () => {
        const filteredData = listOfQuestion.filter(singleQuestion => {
            if (isSearchable) {
                return singleQuestion.questionHeading
                    .toLowerCase()
                    .includes(searchValue.toLowerCase())
            }

            return (
                !isBookmark ||
                singleQuestion.isBookmarked ||
                singleQuestion.questionId === focusedQuestionId
            )
        })
        const orderedData = orderQuestionsForDisplay(filteredData)

        return [orderedData, orderedData.length !== 0]
    }

    function onCategoryTickClicked(nextState) {
        const totalQuestions = current.questionList.length
        const completedQuestions = current.questionList.filter(
            q => q.isDone
        ).length
        const completedAt = Date.now()

        const delta = nextState
            ? totalQuestions - completedQuestions
            : -completedQuestions

        setData({
            data: {
                header: {
                    ...data.data.header,
                    completedQuestions:
                        data.data.header.completedQuestions + delta,
                },
                content: data.data.content.map((singleContent, contentIndex) =>
                    contentIndex !== selectedContentIndex
                        ? singleContent
                        : {
                              ...singleContent,
                              contentCompletedQuestions:
                                  singleContent.contentCompletedQuestions +
                                  delta,
                              categoryList: singleContent.categoryList.map(
                                  (singleCategory, categoryIndex) =>
                                      categoryIndex !== selectedCategoryIndex
                                          ? singleCategory
                                          : {
                                                ...singleCategory,
                                                categoryCompletedQuestions:
                                                    nextState
                                                        ? totalQuestions
                                                        : 0,
                                                questionList:
                                                    singleCategory.questionList.map(
                                                        singleQuestion => ({
                                                            ...singleQuestion,
                                                            isDone: nextState,
                                                            completedAt:
                                                                nextState
                                                                    ? (singleQuestion.completedAt ??
                                                                      completedAt)
                                                                    : null,
                                                        })
                                                    ),
                                            }
                              ),
                          }
                ),
                footer: { ...data.data.footer },
            },
        })
    }
    const [visibleQuestions, hasVisibleQuestions] = filteredListOfQuestions()

    return (
        <Flex
            className={'singleCategory'}
            p={2}
            flexDirection={'column'}
            display={hasVisibleQuestions ? 'flex' : 'none'}
        >
            <Flex
                flexDirection={'row'}
                justifyContent={'start'}
                alignItems={'center'}
            >
                {isCategoryDone ? (
                    <Tick
                        color={
                            isDarkMode
                                ? 'highlightedColor_dark'
                                : 'highlightedColor'
                        }
                        onClick={() => onCategoryTickClicked(false)}
                    />
                ) : (
                    <UnTick
                        color={
                            isDarkMode
                                ? 'highlightedColor_dark'
                                : 'highlightedColor'
                        }
                        onClick={() => onCategoryTickClicked(true)}
                    />
                )}
                <Text
                    ml={{ base: 1, md: 2 }}
                    h={'100%'}
                    fontWeight={'lg'}
                    fontSize={{ base: 'sm', md: 'xl' }}
                    fontFamily={'customFamily'}
                    fontStyle={'normal'}
                    color={isDarkMode ? 'defaultColor_dark' : 'defaultColor'}
                    whiteSpace={'nowrap'}
                >
                    {'Step ' + categoryId + '.'}
                </Text>
                <Text
                    ml={{ base: 1, md: 2 }}
                    fontWeight={'lg'}
                    fontSize={{ base: 'sm', md: 'xl' }}
                    fontFamily={'customFamily'}
                    fontStyle={'normal'}
                    color={isDarkMode ? 'defaultColor_dark' : 'defaultColor'}
                    textDecorationLine={isCompleted ? 'line-through' : 'none'}
                >
                    {categoryName}
                </Text>
            </Flex>

            <Flex
                mt={4}
                flexDirection={'column'}
                alignItems={'start'}
                justifyContent={'center'}
            >
                {visibleQuestions.map(questionData => {
                    return (
                        <SingleQuestion
                            data={data}
                            setData={setData}
                            selectedContentIndex={selectedContentIndex}
                            selectedCategoryIndex={selectedCategoryIndex}
                            selectedQuestionIndex={questionData.questionIndex}
                            key={questionData.questionId}
                        />
                    )
                })}
            </Flex>
        </Flex>
    )
}

export default SingleCategory
