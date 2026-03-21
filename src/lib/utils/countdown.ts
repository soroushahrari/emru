const DAY_MS = 86_400_000

type CountdownUnit = "days" | "weeks" | "months"
type CountdownMode = "empty" | "future" | "today" | "past"

interface CountdownSnapshotOptions {
  targetDate: string | null
  createdAt: string
  now: Date
}

export interface CountdownSnapshot {
  mode: CountdownMode
  diffDays: number | null
  value: number | null
  unit: CountdownUnit | null
  pastLabel: string | null
  activeDots: number
}

function pluralize(value: number, unit: "day") {
  return value === 1 ? unit : `${unit}s`
}

export function toLocalDateStart(value: Date | string) {
  if (typeof value === "string") {
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch
      return new Date(Number(year), Number(month) - 1, Number(day))
    }
  }

  const parsed = value instanceof Date ? value : new Date(value)
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
}

export function getDateDiffInDays(targetDate: string, now: Date) {
  const target = toLocalDateStart(targetDate)
  const today = toLocalDateStart(now)
  return Math.ceil((target.getTime() - today.getTime()) / DAY_MS)
}

function getActiveDots(createdAt: string, targetDate: string, now: Date) {
  const created = toLocalDateStart(createdAt)
  const target = toLocalDateStart(targetDate)
  const today = toLocalDateStart(now)
  const totalDays = Math.ceil((target.getTime() - created.getTime()) / DAY_MS)

  if (totalDays <= 0) {
    return 0
  }

  const elapsedDays = Math.ceil((today.getTime() - created.getTime()) / DAY_MS)
  const progress = Math.min(1, Math.max(0, elapsedDays / totalDays))
  return Math.min(5, Math.max(0, Math.floor(progress * 5)))
}

function getFutureValue(diffDays: number) {
  if (diffDays >= 90) {
    return {
      value: Math.round(diffDays / 30),
      unit: "months" as const,
    }
  }

  if (diffDays >= 14) {
    return {
      value: Math.round(diffDays / 7),
      unit: "weeks" as const,
    }
  }

  return {
    value: diffDays,
    unit: "days" as const,
  }
}

export function getCountdownSnapshot({
  targetDate,
  createdAt,
  now,
}: CountdownSnapshotOptions): CountdownSnapshot {
  if (!targetDate) {
    return {
      mode: "empty",
      diffDays: null,
      value: null,
      unit: null,
      pastLabel: null,
      activeDots: 0,
    }
  }

  const diffDays = getDateDiffInDays(targetDate, now)

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays)
    return {
      mode: "past",
      diffDays,
      value: null,
      unit: null,
      pastLabel: `${daysAgo} ${pluralize(daysAgo, "day")} ago`,
      activeDots: 0,
    }
  }

  if (diffDays === 0) {
    return {
      mode: "today",
      diffDays,
      value: null,
      unit: null,
      pastLabel: null,
      activeDots: 0,
    }
  }

  const futureValue = getFutureValue(diffDays)

  return {
    mode: "future",
    diffDays,
    value: futureValue.value,
    unit: futureValue.unit,
    pastLabel: null,
    activeDots: getActiveDots(createdAt, targetDate, now),
  }
}
