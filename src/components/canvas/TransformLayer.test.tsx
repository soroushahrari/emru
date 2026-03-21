import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { useBlocksStore } from "@/store/blocks.store"
import { useCanvasStore } from "@/store/canvas.store"

import { TransformLayer } from "./TransformLayer"

describe("TransformLayer", () => {
  afterEach(() => {
    localStorage.clear()
    useBlocksStore.setState({
      blocks: {},
      nextZ: 10,
      history: [],
    })
    useCanvasStore.setState({
      offsetX: 0,
      offsetY: 0,
      zoom: 1,
      tool: "select",
      selectedIds: [],
      activeCursor: "default",
      arrangement: {
        activeBlockId: null,
        guides: [],
        relatedBlockIds: [],
      },
    })
  })

  it("renders a countdown block from the store", () => {
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
            label: "Launch",
            targetDate: "2026-04-05",
            createdAt: "2026-03-01T12:00:00.000Z",
          },
        },
      },
    })

    render(<TransformLayer transition={null} />)

    expect(screen.getByText("Countdown")).toBeInTheDocument()
    expect(screen.getByText("Launch")).toBeInTheDocument()
  })
})
