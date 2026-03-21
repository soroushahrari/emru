import { afterEach, describe, expect, it, vi } from "vitest"

import {
  getCountdownSnapshot,
  getDateDiffInDays,
  toLocalDateStart,
} from "@/lib/utils/countdown"

describe("countdown utils", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("normalizes a date-only string to local midnight", () => {
    const normalized = toLocalDateStart("2026-03-22")

    expect(normalized.getHours()).toBe(0)
    expect(normalized.getMinutes()).toBe(0)
    expect(normalized.getSeconds()).toBe(0)
    expect(normalized.getMilliseconds()).toBe(0)
    expect(normalized.getFullYear()).toBe(2026)
    expect(normalized.getMonth()).toBe(2)
    expect(normalized.getDate()).toBe(22)
  })

  it("computes date-only day diffs", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-22T18:45:00.000Z"))

    expect(getDateDiffInDays("2026-03-22", new Date())).toBe(0)
    expect(getDateDiffInDays("2026-03-23", new Date())).toBe(1)
    expect(getDateDiffInDays("2026-03-21", new Date())).toBe(-1)
  })

  it("shows days for 1 to 13 days remaining", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-22T09:00:00.000Z"))

    const snapshot = getCountdownSnapshot({
      targetDate: "2026-03-27",
      createdAt: "2026-03-20T12:00:00.000Z",
      now: new Date(),
    })

    expect(snapshot.mode).toBe("future")
    expect(snapshot.unit).toBe("days")
    expect(snapshot.value).toBe(5)
    expect(snapshot.activeDots).toBe(1)
  })

  it("shows weeks for 14 to 89 days and preserves createdAt-based progress", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-22T09:00:00.000Z"))

    const snapshot = getCountdownSnapshot({
      targetDate: "2026-04-19",
      createdAt: "2026-03-15T12:00:00.000Z",
      now: new Date(),
    })

    expect(snapshot.mode).toBe("future")
    expect(snapshot.unit).toBe("weeks")
    expect(snapshot.value).toBe(4)
    expect(snapshot.activeDots).toBe(1)
  })

  it("shows rounded months for 90 or more days remaining", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-22T09:00:00.000Z"))

    const snapshot = getCountdownSnapshot({
      targetDate: "2026-06-30",
      createdAt: "2026-03-01T12:00:00.000Z",
      now: new Date(),
    })

    expect(snapshot.mode).toBe("future")
    expect(snapshot.unit).toBe("months")
    expect(snapshot.value).toBe(3)
  })

  it("shows today when the target date is the current day", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-22T09:00:00.000Z"))

    const snapshot = getCountdownSnapshot({
      targetDate: "2026-03-22",
      createdAt: "2026-03-10T12:00:00.000Z",
      now: new Date(),
    })

    expect(snapshot.mode).toBe("today")
    expect(snapshot.value).toBeNull()
    expect(snapshot.unit).toBeNull()
    expect(snapshot.activeDots).toBe(0)
  })

  it("shows days ago for past targets with no dots", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-22T09:00:00.000Z"))

    const snapshot = getCountdownSnapshot({
      targetDate: "2026-03-19",
      createdAt: "2026-03-01T12:00:00.000Z",
      now: new Date(),
    })

    expect(snapshot.mode).toBe("past")
    expect(snapshot.pastLabel).toBe("3 days ago")
    expect(snapshot.activeDots).toBe(0)
  })

  it("returns empty mode when no target date exists", () => {
    const snapshot = getCountdownSnapshot({
      targetDate: null,
      createdAt: "2026-03-01T12:00:00.000Z",
      now: new Date("2026-03-22T09:00:00.000Z"),
    })

    expect(snapshot.mode).toBe("empty")
    expect(snapshot.diffDays).toBeNull()
    expect(snapshot.value).toBeNull()
    expect(snapshot.unit).toBeNull()
  })
})
