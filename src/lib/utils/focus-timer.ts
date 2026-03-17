import type { FocusBlockData } from "@/types/block.types"

export const MIN_FOCUS_MINUTES = 1
export const MAX_FOCUS_MINUTES = 180

function clampMinutes(value: number) {
  if (!Number.isFinite(value)) {
    return MIN_FOCUS_MINUTES
  }

  return Math.min(
    MAX_FOCUS_MINUTES,
    Math.max(MIN_FOCUS_MINUTES, Math.round(value))
  )
}

export function getPhaseDurationMs(
  phase: FocusBlockData["phase"],
  focusMinutes: number,
  restMinutes: number
) {
  const focus = clampMinutes(focusMinutes)
  const rest = clampMinutes(restMinutes)
  return (phase === "focus" ? focus : rest) * 60 * 1000
}

export function getRemainingMs(data: FocusBlockData, now: number) {
  const maxRemaining = getPhaseDurationMs(
    data.phase,
    data.focusMinutes,
    data.restMinutes
  )

  if (data.status === "running" && typeof data.endsAt === "number") {
    return Math.min(maxRemaining, Math.max(0, Math.floor(data.endsAt - now)))
  }

  if (!Number.isFinite(data.remainingMs)) {
    return maxRemaining
  }

  return Math.min(maxRemaining, Math.max(0, Math.floor(data.remainingMs)))
}

export function startTimer(data: FocusBlockData, now: number): FocusBlockData {
  const remaining = getRemainingMs(data, now)
  const normalizedRemaining =
    remaining > 0
      ? remaining
      : getPhaseDurationMs(data.phase, data.focusMinutes, data.restMinutes)

  return {
    ...data,
    status: "running",
    startedAt: now,
    endsAt: now + normalizedRemaining,
    remainingMs: normalizedRemaining,
  }
}

export function pauseTimer(data: FocusBlockData, now: number): FocusBlockData {
  const remaining = getRemainingMs(data, now)

  return {
    ...data,
    status: "paused",
    startedAt: null,
    endsAt: null,
    remainingMs: remaining,
  }
}

export function restartTimer(data: FocusBlockData): FocusBlockData {
  return {
    ...data,
    status: "idle",
    startedAt: null,
    endsAt: null,
    remainingMs: getPhaseDurationMs(
      data.phase,
      data.focusMinutes,
      data.restMinutes
    ),
  }
}

export function transitionPhase(data: FocusBlockData): FocusBlockData {
  const nextPhase: FocusBlockData["phase"] =
    data.phase === "focus" ? "rest" : "focus"

  return {
    ...data,
    phase: nextPhase,
    status: "idle",
    startedAt: null,
    endsAt: null,
    remainingMs: getPhaseDurationMs(
      nextPhase,
      data.focusMinutes,
      data.restMinutes
    ),
  }
}

export function setDurations(
  data: FocusBlockData,
  focusMinutes: number,
  restMinutes: number
): FocusBlockData {
  const nextFocus = clampMinutes(focusMinutes)
  const nextRest = clampMinutes(restMinutes)

  return {
    ...data,
    focusMinutes: nextFocus,
    restMinutes: nextRest,
    status: "idle",
    startedAt: null,
    endsAt: null,
    remainingMs: getPhaseDurationMs(data.phase, nextFocus, nextRest),
  }
}

export function formatClock(ms: number) {
  if (!Number.isFinite(ms)) {
    return "00:00"
  }

  const wholeSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(wholeSeconds / 3600)
  const minutes = Math.floor((wholeSeconds % 3600) / 60)
  const seconds = wholeSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}
