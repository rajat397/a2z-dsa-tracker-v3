export const DAYS = [
    { id: 'monday', shortLabel: 'Mon', label: 'Monday' },
    { id: 'tuesday', shortLabel: 'Tue', label: 'Tuesday' },
    { id: 'wednesday', shortLabel: 'Wed', label: 'Wednesday' },
    { id: 'thursday', shortLabel: 'Thu', label: 'Thursday' },
    { id: 'friday', shortLabel: 'Fri', label: 'Friday' },
    { id: 'saturday', shortLabel: 'Sat', label: 'Saturday' },
    { id: 'sunday', shortLabel: 'Sun', label: 'Sunday' },
]

export const DEFAULT_DAILY_HOURS = 3
export const DEFAULT_WEEKEND_HOURS = 5
export const MAX_DAILY_HOURS = 16

export function createDefaultAvailability(defaultAvailability = {}) {
    return DAYS.reduce(
        (availability, day) => ({
            ...availability,
            [day.id]: clampHours(
                defaultAvailability[day.id] ??
                    defaultAvailability[day.label] ??
                    (day.id === 'saturday' || day.id === 'sunday'
                        ? DEFAULT_WEEKEND_HOURS
                        : DEFAULT_DAILY_HOURS)
            ),
        }),
        {}
    )
}

export function clampHours(value) {
    const numericValue = Number(value)

    if (!Number.isFinite(numericValue)) return 0

    return Math.min(MAX_DAILY_HOURS, Math.max(0, Math.round(numericValue)))
}

export function formatDuration(minutes = 0, compact = false) {
    const safeMinutes = Math.max(0, Math.round(Number(minutes) || 0))
    const hours = Math.floor(safeMinutes / 60)
    const remainingMinutes = safeMinutes % 60

    if (compact) {
        if (hours === 0) return `${remainingMinutes}m`
        if (remainingMinutes === 0) return `${hours}h`
        return `${hours}h ${remainingMinutes}m`
    }

    if (hours === 0) {
        return `${remainingMinutes} ${remainingMinutes === 1 ? 'minute' : 'minutes'}`
    }

    if (remainingMinutes === 0) {
        return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
    }

    return `${hours}h ${remainingMinutes}m`
}

export function formatTimer(seconds = 0) {
    const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0))
    const hours = Math.floor(safeSeconds / 3600)
    const minutes = Math.floor((safeSeconds % 3600) / 60)
    const remainingSeconds = safeSeconds % 60
    const pairs = [minutes, remainingSeconds]

    if (hours > 0) pairs.unshift(hours)

    return pairs.map(value => String(value).padStart(2, '0')).join(':')
}

export function getLocalDateInputValue(date = new Date()) {
    const timezoneOffset = date.getTimezoneOffset() * 60 * 1000
    return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

export function addDaysToDateInput(dateInput, days) {
    const date = new Date(`${dateInput}T12:00:00`)
    date.setDate(date.getDate() + days)
    return getLocalDateInputValue(date)
}

export function getDifficultyColor(difficulty = '') {
    const normalizedDifficulty = difficulty.toLowerCase()

    if (normalizedDifficulty === 'easy' || normalizedDifficulty === 'basic') {
        return 'green'
    }

    if (normalizedDifficulty === 'hard' || normalizedDifficulty === 'pro') {
        return 'red'
    }

    return 'orange'
}

export function getTopicRemainingQuestions(topic) {
    if (Number.isFinite(topic.remainingCount)) {
        return Math.max(0, topic.remainingCount)
    }

    if (Number.isFinite(topic.remainingQuestions)) {
        return Math.max(0, topic.remainingQuestions)
    }

    return Math.max(
        0,
        (Number(topic.questionCount ?? topic.totalQuestions) || 0) -
            (Number(topic.completedQuestions) || 0)
    )
}

export function getPalette(isDarkMode) {
    return isDarkMode
        ? {
              page: '#0d1117',
              panel: '#161b22',
              elevated: '#21262d',
              border: '#30363d',
              text: '#f0f6fc',
              muted: '#8b949e',
              subtle: '#c9d1d9',
              accent: '#58a6ff',
              accentSoft: 'rgba(88, 166, 255, 0.14)',
              success: '#3fb950',
              successSoft: 'rgba(63, 185, 80, 0.14)',
              warning: '#d29922',
              warningSoft: 'rgba(210, 153, 34, 0.14)',
              danger: '#f85149',
          }
        : {
              page: '#f8fafc',
              panel: '#ffffff',
              elevated: '#f8fafc',
              border: '#e2e8f0',
              text: '#0f172a',
              muted: '#64748b',
              subtle: '#334155',
              accent: '#2563eb',
              accentSoft: '#eff6ff',
              success: '#15803d',
              successSoft: '#f0fdf4',
              warning: '#b45309',
              warningSoft: '#fffbeb',
              danger: '#dc2626',
          }
}
