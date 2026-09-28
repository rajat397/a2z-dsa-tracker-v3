export function flattenPlannerQuestions(data, difficultyById) {
    return data.data.content.flatMap((topic, topicIndex) =>
        topic.categoryList.flatMap((category, categoryIndex) =>
            category.questionList.map(question => {
                const effort = difficultyById[question.questionId]

                return {
                    id: question.questionId,
                    title: question.questionHeading,
                    topicId: topic.contentPath,
                    topicName: topic.contentHeading,
                    topicIndex,
                    categoryName: category.categoryName,
                    categoryIndex,
                    questionIndex: question.questionIndex,
                    isDone: question.isDone,
                    tier: effort.tier,
                    estimatedMinutes: effort.estimatedMinutes,
                    practiceLink:
                        question.leetCodeLink ||
                        question.gfgLink ||
                        question.code360Link ||
                        '',
                    articleLink:
                        question.articleLink || question.gfgArticleLink || '',
                }
            })
        )
    )
}

export function buildPlannerTopics(tasks) {
    const topics = new Map()

    tasks.forEach(task => {
        const topic = topics.get(task.topicId) ?? {
            id: task.topicId,
            name: task.topicName,
            questionCount: 0,
            remainingCount: 0,
            estimatedMinutes: 0,
        }

        topic.questionCount += 1
        if (!task.isDone) {
            topic.remainingCount += 1
            topic.estimatedMinutes += task.estimatedMinutes
        }
        topics.set(task.topicId, topic)
    })

    return [...topics.values()]
}

export function updateQuestionCompletion(data, questionId, isDone) {
    let found = false
    const content = data.data.content.map(topic => {
        const categoryList = topic.categoryList.map(category => {
            const questionList = category.questionList.map(question => {
                if (question.questionId !== questionId) return question

                found = true
                return {
                    ...question,
                    isDone,
                    completedAt: isDone ? Date.now() : null,
                }
            })

            return {
                ...category,
                categoryCompletedQuestions: questionList.filter(
                    question => question.isDone
                ).length,
                questionList,
            }
        })

        return {
            ...topic,
            contentCompletedQuestions: categoryList.reduce(
                (total, category) =>
                    total + category.categoryCompletedQuestions,
                0
            ),
            categoryList,
        }
    })

    if (!found) return data

    return {
        data: {
            ...data.data,
            header: {
                ...data.data.header,
                completedQuestions: content.reduce(
                    (total, topic) => total + topic.contentCompletedQuestions,
                    0
                ),
            },
            content,
        },
    }
}
