import { renderHook, act } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useBlocksStore } from "@/store/blocks.store"

import { useCountdownBlock } from "./useCountdownBlock"

describe("useCountdownBlock", () => {
  afterEach(() => {
    vi.useRealTimers()
    useBlocksStore.setState({
      blocks: {},
      nextZ: 10,
      history: [],
    })
  })

  it("returns null when the block is missing", () => {
    const { result } = renderHook(() => useCountdownBlock("missing"))

    expect(result.current.block).toBeNull()
  })

  it("derives a future snapshot from store data", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-22T09:00:00.000Z"))
    useBlocksStore.setState({
      blocks: {
        countdown: {
          id: "countdown",
          type: "countdown",
          x: 0,
          y: 0,
          width: 200,
          height: 220,
          zIndex: 10,
          data: {
            label: "Trip",
            targetDate: "2026-04-05",
            createdAt: "2026-03-01T12:00:00.000Z",
          },
        },
      },
    })

    const { result } = renderHook(() => useCountdownBlock("countdown"))

    expect(result.current.snapshot.mode).toBe("future")
    expect(result.current.snapshot.unit).toBe("weeks")
    expect(result.current.snapshot.value).toBe(2)
  })

  it("trims and persists label updates", () => {
    useBlocksStore.setState({
      blocks: {
        countdown: {
          id: "countdown",
          type: "countdown",
          x: 0,
          y: 0,
          width: 200,
          height: 220,
          zIndex: 10,
          data: {
            label: "Trip",
            targetDate: "2026-04-05",
            createdAt: "2026-03-01T12:00:00.000Z",
          },
        },
      },
    })

    const { result } = renderHook(() => useCountdownBlock("countdown"))

    act(() => {
      result.current.setLabel("  Launch day  ")
    })

    expect(useBlocksStore.getState().blocks.countdown).toMatchObject({
      data: {
        label: "Launch day",
      },
    })
  })

  it("updates targetDate without changing createdAt", () => {
    const createdAt = "2026-03-01T10:00:00.000Z"
    useBlocksStore.setState({
      blocks: {
        countdown: {
          id: "countdown",
          type: "countdown",
          x: 0,
          y: 0,
          width: 200,
          height: 220,
          zIndex: 10,
          data: {
            label: "Trip",
            targetDate: "2026-04-05",
            createdAt,
          },
        },
      },
    })

    const { result } = renderHook(() => useCountdownBlock("countdown"))

    act(() => {
      result.current.setTargetDate("2026-04-10")
    })

    expect(useBlocksStore.getState().blocks.countdown).toMatchObject({
      data: {
        targetDate: "2026-04-10",
        createdAt,
      },
    })
  })

  it("refreshes the derived snapshot every minute", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-21T23:59:00.000Z"))
    useBlocksStore.setState({
      blocks: {
        countdown: {
          id: "countdown",
          type: "countdown",
          x: 0,
          y: 0,
          width: 200,
          height: 220,
          zIndex: 10,
          data: {
            label: "Trip",
            targetDate: "2026-03-22",
            createdAt: "2026-03-01T12:00:00.000Z",
          },
        },
      },
    })

    const { result } = renderHook(() => useCountdownBlock("countdown"))

    expect(result.current.snapshot.mode).toBe("future")

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(result.current.snapshot.mode).toBe("today")
  })
})
