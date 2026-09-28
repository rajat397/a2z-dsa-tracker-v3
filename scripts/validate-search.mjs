import assert from 'node:assert/strict'

import DiffChecker from '../src/components/common/DiffChecker.js'
import trackerData from '../src/components/common/enhancedData.js'
import { updateQuestionCompletion } from '../src/components/planner/plannerData.js'
import {
    flattenQuestionsForSearch,
    orderQuestionsForDisplay,
    searchQuestions,
} from '../src/components/search/questionSearch.js'

const questions = flattenQuestionsForSearch(trackerData)

assert.equal(questions.length, 487)
assert.equal(new Set(questions.map(question => question.id)).size, 487)

const mergeMatches = searchQuestions(questions, 'merge sort')
assert.ok(mergeMatches.some(question => question.title === 'Merge Sort'))
assert.ok(mergeMatches.every(question => question.topicPath))

const topicMatches = searchQuestions(questions, 'dynamic programming')
assert.ok(topicMatches.length >= 56)
const broadMatches = searchQuestions(questions, 'array')
assert.ok(broadMatches.length > 10)

const ordered = orderQuestionsForDisplay([
    { questionIndex: 0, isDone: true, completedAt: 100 },
    { questionIndex: 1, isDone: false },
    { questionIndex: 2, isDone: true, completedAt: 200 },
    { questionIndex: 3, isDone: false },
])
assert.deepEqual(
    ordered.map(question => question.questionIndex),
    [1, 3, 0, 2]
)

const bulkCompleted = orderQuestionsForDisplay([
    { questionIndex: 2, isDone: true, completedAt: 500 },
    { questionIndex: 0, isDone: true, completedAt: 500 },
    { questionIndex: 1, isDone: true, completedAt: 500 },
])
assert.deepEqual(
    bulkCompleted.map(question => question.questionIndex),
    [0, 1, 2]
)

const source = structuredClone(trackerData)
const targetQuestion = questions.find(
    question => question.title === 'Largest Element in an Array'
)
const completed = updateQuestionCompletion(source, targetQuestion.id, true)
const completedQuestion = completed.data.content
    .flatMap(topic => topic.categoryList)
    .flatMap(category => category.questionList)
    .find(question => question.questionId === targetQuestion.id)

assert.equal(completedQuestion.isDone, true)
assert.ok(Number(completedQuestion.completedAt) > 0)

const restored = DiffChecker(structuredClone(trackerData), completed)
const restoredQuestion = restored.data.content
    .flatMap(topic => topic.categoryList)
    .flatMap(category => category.questionList)
    .find(question => question.questionId === targetQuestion.id)
assert.equal(restoredQuestion.completedAt, completedQuestion.completedAt)

console.log(
    JSON.stringify(
        {
            verdict: 'PASS',
            searchableQuestions: questions.length,
            mergeMatches: mergeMatches.length,
            dynamicProgrammingMatches: topicMatches.length,
            broadMatches: broadMatches.length,
            completedAtBottomOrder: ordered.map(
                question => question.questionIndex
            ),
        },
        null,
        2
    )
)
