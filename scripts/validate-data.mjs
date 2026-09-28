import data from '../src/components/common/enhancedData.js'

const questions = data.data.content.flatMap(content =>
    content.categoryList.flatMap(category => category.questionList)
)
const addedQuestions = questions.filter(question =>
    question.questionId.startsWith('added_')
)
const articleQuestions = questions.filter(question => question.articleLink)
const gfgArticleQuestions = questions.filter(
    question => question.gfgArticleLink
)

function hostname(link) {
    if (!link) return ''

    try {
        return new URL(link).hostname.replace(/^www\./, '')
    } catch {
        return ''
    }
}

function isHost(link, hosts) {
    const host = hostname(link)
    return hosts.some(item => host === item || host.endsWith(`.${item}`))
}

function practiceLink(question) {
    if (isHost(question.leetCodeLink, ['leetcode.com'])) {
        return question.leetCodeLink
    }
    if (
        isHost(question.gfgLink, [
            'geeksforgeeks.org',
            'practice.geeksforgeeks.org',
        ])
    ) {
        return question.gfgLink
    }
    if (isHost(question.code360Link, ['naukri.com', 'codingninjas.com'])) {
        return question.code360Link
    }
    return ''
}

function invariant(condition, message) {
    if (!condition) throw new Error(message)
}

invariant(
    questions.length === 487,
    `Expected 487 questions, got ${questions.length}`
)
invariant(
    data.data.header.totalQuestions === questions.length,
    'Header total does not match question rows'
)
invariant(
    addedQuestions.length === 31,
    `Expected 31 added questions, got ${addedQuestions.length}`
)
invariant(
    articleQuestions.length === 313,
    `Expected 313 verified Article links, got ${articleQuestions.length}`
)

const addedArticleTitles = addedQuestions
    .filter(question => question.articleLink)
    .map(question => question.questionHeading)
    .sort()
invariant(
    addedArticleTitles.length === 26,
    `Expected 26 added questions with verified articles, got ${addedArticleTitles.length}`
)

const uniqueArticleLinks = new Set(
    articleQuestions.map(question => question.articleLink)
)
invariant(
    uniqueArticleLinks.size === 271,
    `Expected 271 unique Article URLs, got ${uniqueArticleLinks.size}`
)

invariant(
    gfgArticleQuestions.length === questions.length,
    `Expected a GFG Article on all ${questions.length} questions, got ${gfgArticleQuestions.length}`
)

const invalidGfgArticles = gfgArticleQuestions.filter(
    question =>
        !isHost(question.gfgArticleLink, ['geeksforgeeks.org']) ||
        new URL(question.gfgArticleLink).pathname.startsWith('/problems/') ||
        new URL(question.gfgArticleLink).pathname.startsWith('/search/')
)
invariant(
    invalidGfgArticles.length === 0,
    `Invalid GFG Article URLs: ${invalidGfgArticles
        .map(question => question.questionHeading)
        .join(', ')}`
)

const uniqueGfgArticleLinks = new Set(
    gfgArticleQuestions.map(question => question.gfgArticleLink)
)
invariant(
    uniqueGfgArticleLinks.size === 291,
    `Expected 291 unique GFG Article URLs, got ${uniqueGfgArticleLinks.size}`
)

const missingAddedLinks = addedQuestions.filter(
    question => !practiceLink(question)
)
invariant(
    missingAddedLinks.length === 0,
    `Added questions without a practice destination: ${missingAddedLinks
        .map(question => question.questionHeading)
        .join(', ')}`
)

const badArticles = questions.filter(
    question =>
        question.articleLink &&
        !isHost(question.articleLink, ['takeuforward.org'])
)
invariant(
    badArticles.length === 0,
    `Non-takeUforward article URLs: ${badArticles
        .map(question => question.questionHeading)
        .join(', ')}`
)

const ids = questions.map(question => question.questionId)
invariant(
    new Set(ids).size === ids.length,
    'Question IDs are not globally unique'
)

const codingWithoutPractice = questions.filter(
    question =>
        !practiceLink(question) &&
        !question.articleLink &&
        !question.gfgArticleLink &&
        !question.youTubeLink
)

console.log(
    JSON.stringify(
        {
            totalQuestions: questions.length,
            addedQuestions: addedQuestions.length,
            articleLinks: articleQuestions.length,
            uniqueArticleLinks: uniqueArticleLinks.size,
            gfgArticleLinks: gfgArticleQuestions.length,
            uniqueGfgArticleLinks: uniqueGfgArticleLinks.size,
            rowsWithTufAndGfg: articleQuestions.length,
            rowsWithGfgOnly: questions.length - articleQuestions.length,
            leetCodeFirst: questions.filter(
                question =>
                    isHost(question.leetCodeLink, ['leetcode.com']) &&
                    practiceLink(question) === question.leetCodeLink
            ).length,
            gfgFallback: questions.filter(
                question =>
                    isHost(question.gfgLink, ['geeksforgeeks.org']) &&
                    practiceLink(question) === question.gfgLink
            ).length,
            code360Fallback: questions.filter(
                question =>
                    isHost(question.code360Link, [
                        'naukri.com',
                        'codingninjas.com',
                    ]) && practiceLink(question) === question.code360Link
            ).length,
            theoryWithoutPractice: questions.filter(
                question => !practiceLink(question)
            ).length,
            rowsWithoutAnyLearningDestination: codingWithoutPractice.map(
                question => question.questionHeading
            ),
        },
        null,
        2
    )
)
