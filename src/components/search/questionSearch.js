export function normalizeQuestionSearch(value) {
    return String(value ?? '')
        .trim()
        .toLowerCase()
}

export function flattenQuestionsForSearch(data) {
    return data.data.content.flatMap((topic, topicIndex) =>
        topic.categoryList.flatMap((category, categoryIndex) =>
            category.questionList.map(question => ({
                id: question.questionId,
                title: question.questionHeading,
                topic: topic.contentHeading,
                topicPath: topic.contentPath,
                topicIndex,
                category: category.categoryName,
                categoryIndex,
                questionIndex: question.questionIndex,
                isDone: question.isDone,
            }))
        )
    )
}

export function searchQuestions(questions, query) {
    const normalizedQuery = normalizeQuestionSearch(query)
    if (!normalizedQuery) return []

    return questions.filter(question =>
        [question.title, question.topic, question.category].some(value =>
            normalizeQuestionSearch(value).includes(normalizedQuery)
        )
    )
}

export function orderQuestionsForDisplay(questions) {
    return [...questions].sort((first, second) => {
        if (first.isDone !== second.isDone) return first.isDone ? 1 : -1
        if (!first.isDone) return first.questionIndex - second.questionIndex

        const firstCompletedAt = Number(first.completedAt) || 0
        const secondCompletedAt = Number(second.completedAt) || 0
        return (
            firstCompletedAt - secondCompletedAt ||
            first.questionIndex - second.questionIndex
        )
    })
}
