import { describe, expect, it } from "vitest"

import type { FocusBlockData } from "@/types/block.types"

import {
  formatClock,
  getPhaseDurationMs,
  getRemainingMs,
  pauseTimer,
  restartTimer,
  startTimer,
  transitionPhase,
} from "./focus-timer"

function makeData(overrides: Partial<FocusBlockData> = {}): FocusBlockData {
  return {
    title: "focus",
    focusMinutes: 25,
    restMinutes: 5,
    phase: "focus",
    status: "idle",
    startedAt: null,
    endsAt: null,
    remainingMs: 25 * 60 * 1000,
    compact: false,
    ...overrides,
  }
}

describe("focus timer utils", () => {
  it("computes remaining from endsAt while running", () => {
    const now = 1_700_000_000_000
    const data = makeData({
      status: "running",
      endsAt: now + 30_000,
      remainingMs: 0,
    })

    expect(getRemainingMs(data, now)).toBe(30_000)
  })

  it("starts and pauses with wall-clock timestamps", () => {
    const now = 1_700_000_000_000
    const running = startTimer(makeData(), now)

    expect(running.status).toBe("running")
    expect(running.startedAt).toBe(now)
    expect(running.endsAt).toBe(now + 25 * 60 * 1000)

    const paused = pauseTimer(running, now + 45_000)
    expect(paused.status).toBe("paused")
    expect(paused.startedAt).toBeNull()
    expect(paused.endsAt).toBeNull()
    expect(paused.remainingMs).toBe(25 * 60 * 1000 - 45_000)
  })

  it("transitions phase and resets to idle", () => {
    const transitioned = transitionPhase(makeData())
    expect(transitioned.phase).toBe("rest")
    expect(transitioned.status).toBe("idle")
    expect(transitioned.remainingMs).toBe(5 * 60 * 1000)
  })

  it("restarts current phase duration", () => {
    const restarted = restartTimer(
      makeData({ phase: "rest", remainingMs: 10_000 })
    )
    expect(restarted.status).toBe("idle")
    expect(restarted.remainingMs).toBe(5 * 60 * 1000)
  })

  it("formats clock values", () => {
    expect(formatClock(65_000)).toBe("01:05")
    expect(formatClock(getPhaseDurationMs("focus", 125, 5))).toBe("2:05:00")
  })
})
