import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useBlocksStore } from "@/store/blocks.store"
import type { CountdownBlock as CountdownBlockType } from "@/types/block.types"

import { CountdownBlock } from "./CountdownBlock"

function createCountdownBlock(
  overrides: Partial<CountdownBlockType> = {}
): CountdownBlockType {
  const nextData = {
    label: "Trip",
    targetDate: "2026-04-05",
    createdAt: "2026-03-01T12:00:00.000Z",
    ...(overrides.data ?? {}),
  }

  return {
    id: "countdown",
    type: "countdown",
    x: 10,
    y: 20,
    width: 200,
    height: 220,
    zIndex: 10,
    ...overrides,
    data: nextData,
  }
}

describe("CountdownBlock", () => {
  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
    useBlocksStore.setState({
      blocks: {},
      nextZ: 10,
      history: [],
    })
  })

  it("shows the empty state and visible date input when no target date exists", () => {
    useBlocksStore.setState({
      blocks: {
        countdown: createCountdownBlock({
          data: {
            label: "Trip",
            targetDate: null,
            createdAt: "2026-03-01T12:00:00.000Z",
          },
        }),
      },
    })

    render(
      <CountdownBlock
        blockId="countdown"
        selected={false}
        isDragging={false}
        landed={false}
        dragHandleProps={{}}
      />
    )

    expect(screen.getByText("set a date")).toBeInTheDocument()
    expect(screen.getByLabelText("Countdown date")).toBeInTheDocument()
  })

  it("shows the future hero number, unit, and progress dots", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-22T09:00:00.000Z"))
    useBlocksStore.setState({
      blocks: {
        countdown: createCountdownBlock(),
      },
    })

    render(
      <CountdownBlock
        blockId="countdown"
        selected={false}
        isDragging={false}
        landed={false}
        dragHandleProps={{}}
      />
    )

    expect(screen.getByText("Trip")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("WEEKS")).toBeInTheDocument()
    expect(screen.getAllByTestId("countdown-dot")).toHaveLength(5)
  })

  it("shows today without the hero number", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-22T09:00:00.000Z"))
    useBlocksStore.setState({
      blocks: {
        countdown: createCountdownBlock({
          data: {
            label: "Trip",
            targetDate: "2026-03-22",
            createdAt: "2026-03-01T12:00:00.000Z",
          },
        }),
      },
    })

    render(
      <CountdownBlock
        blockId="countdown"
        selected={false}
        isDragging={false}
        landed={false}
        dragHandleProps={{}}
      />
    )

    expect(screen.getByText("today")).toBeInTheDocument()
    expect(screen.queryByText("WEEKS")).not.toBeInTheDocument()
  })

  it("shows past text and no dots for past targets", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-22T09:00:00.000Z"))
    useBlocksStore.setState({
      blocks: {
        countdown: createCountdownBlock({
          data: {
            label: "Trip",
            targetDate: "2026-03-19",
            createdAt: "2026-03-01T12:00:00.000Z",
          },
        }),
      },
    })

    render(
      <CountdownBlock
        blockId="countdown"
        selected={false}
        isDragging={false}
        landed={false}
        dragHandleProps={{}}
      />
    )

    expect(screen.getByText("3 days ago")).toBeInTheDocument()
    expect(screen.queryAllByTestId("countdown-dot")).toHaveLength(0)
  })

  it("enters label edit mode when the hero label is clicked", () => {
    useBlocksStore.setState({
      blocks: {
        countdown: createCountdownBlock(),
      },
    })

    render(
      <CountdownBlock
        blockId="countdown"
        selected={false}
        isDragging={false}
        landed={false}
        dragHandleProps={{}}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Edit countdown label" }))

    expect(screen.getByLabelText("Countdown label")).toBeInTheDocument()
  })
})
