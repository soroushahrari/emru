import { describe, expect, it } from "vitest"

import {
  getBlocksBoundingBox,
  getFitTransform,
  toCanvas,
  toScreen,
} from "@/lib/utils/canvas.utils"
import type { Block } from "@/types/block.types"

describe("canvas utils", () => {
  it("converts screen to canvas space", () => {
    expect(toCanvas(500, 300, 100, 50, 2)).toEqual({ x: 200, y: 125 })
  })

  it("converts canvas to screen space", () => {
    expect(toScreen(200, 125, 100, 50, 2)).toEqual({ x: 500, y: 300 })
  })

  it("computes content bounding box", () => {
    const blocks: Block[] = [
      {
        id: "a",
        type: "tasks",
        x: 20,
        y: 10,
        width: 100,
        height: 80,
        zIndex: 10,
        data: { title: "tasks", items: [] },
      },
      {
        id: "b",
        type: "notes",
        x: 220,
        y: 120,
        width: 200,
        height: 100,
        zIndex: 11,
        data: { title: "notes", text: "" },
      },
    ]

    expect(getBlocksBoundingBox(blocks)).toEqual({
      minX: 20,
      minY: 10,
      maxX: 420,
      maxY: 220,
      width: 400,
      height: 210,
    })
  })

  it("computes fit transform with zoom clamp", () => {
    const transform = getFitTransform(
      {
        minX: 0,
        minY: 0,
        maxX: 1000,
        maxY: 1000,
        width: 1000,
        height: 1000,
      },
      1200,
      800,
      80
    )

    expect(transform.zoom).toBeLessThanOrEqual(1)
    expect(transform.zoom).toBeGreaterThanOrEqual(0.2)
  })
})
