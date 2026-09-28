import data from '../src/components/common/enhancedData.js'
import questionDifficultyById from '../src/components/common/questionDifficultyById.js'

const expectedMinutes = {
    easy: 25,
    medium: 40,
    hard: 50,
}
const allowedSources = new Set([
    'gfg',
    'leetcode',
    'local-category',
    'planner-rule',
    'tuf-tier',
])

const questions = data.data.content.flatMap(content =>
    content.categoryList.flatMap(category =>
        category.questionList.map(question => ({
            ...question,
            categoryName: category.categoryName,
        }))
    )
)

function invariant(condition, message) {
    if (!condition) throw new Error(message)
}

invariant(
    questions.length === 487,
    `Expected 487 tracker questions, got ${questions.length}`
)

const questionIds = questions.map(question => question.questionId)
invariant(
    new Set(questionIds).size === questionIds.length,
    'Tracker question IDs are not globally unique'
)

const mapIds = Object.keys(questionDifficultyById)
const missingIds = questionIds.filter(id => !questionDifficultyById[id])
const extraIds = mapIds.filter(id => !questionIds.includes(id))
invariant(
    missingIds.length === 0,
    `Questions without an effort tier: ${missingIds.join(', ')}`
)
invariant(
    extraIds.length === 0,
    `Effort tiers for unknown questions: ${extraIds.join(', ')}`
)
invariant(
    mapIds.length === questions.length,
    `Expected ${questions.length} effort-tier entries, got ${mapIds.length}`
)

for (const question of questions) {
    const entry = questionDifficultyById[question.questionId]
    invariant(
        Object.hasOwn(expectedMinutes, entry.tier),
        `${question.questionId} has unsupported tier “${entry.tier}”`
    )
    invariant(
        entry.estimatedMinutes === expectedMinutes[entry.tier],
        `${question.questionId} has ${entry.estimatedMinutes} minutes for ${entry.tier}; expected ${expectedMinutes[entry.tier]}`
    )
    invariant(
        allowedSources.has(entry.source),
        `${question.questionId} has unsupported source “${entry.source}”`
    )
    invariant(
        typeof entry.sourceLabel === 'string' && entry.sourceLabel.trim(),
        `${question.questionId} is missing sourceLabel`
    )
    invariant(
        typeof entry.reason === 'string' && entry.reason.trim(),
        `${question.questionId} is missing a classification reason`
    )

    if (entry.source === 'local-category') {
        invariant(
            entry.sourceLabel === question.categoryName,
            `${question.questionId} does not preserve its tracker category label`
        )
        invariant(
            new RegExp(`\\b${entry.tier}\\b`, 'i').test(question.categoryName),
            `${question.questionId} tier does not match category “${question.categoryName}”`
        )
    }

    if (entry.source === 'tuf-tier') {
        invariant(
            /^TUF (Basic|Core|Pro)$/.test(entry.sourceLabel),
            `${question.questionId} has invalid TUF source label “${entry.sourceLabel}”`
        )
    }
}

const entries = Object.values(questionDifficultyById)
const counts = values =>
    Object.fromEntries(
        Object.entries(Object.groupBy(entries, entry => entry[values])).map(
            ([key, matches]) => [key, matches.length]
        )
    )
const plannerRuleQuestions = questions
    .filter(
        question =>
            questionDifficultyById[question.questionId].source ===
            'planner-rule'
    )
    .map(question => ({
        questionId: question.questionId,
        title: question.questionHeading,
        rule: questionDifficultyById[question.questionId].sourceLabel,
    }))

console.log(
    JSON.stringify(
        {
            totalQuestions: questions.length,
            byTier: counts('tier'),
            bySource: counts('source'),
            externallyUnclassified: plannerRuleQuestions.length,
            plannerRuleQuestions,
        },
        null,
        2
    )
)
