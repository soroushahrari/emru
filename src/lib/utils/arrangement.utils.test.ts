import { describe, expect, it } from "vitest"

import type { Block } from "@/types/block.types"

import {
  arrangementConstants,
  resolveMagneticArrangement,
} from "./arrangement.utils"

function createBlock(
  id: string,
  x: number,
  y: number,
  width = 200,
  height = 120
): Block {
  return {
    id,
    type: "tasks",
    x,
    y,
    width,
    height,
    zIndex: 1,
    data: {
      title: "tasks",
      items: [],
    },
  }
}

describe("resolveMagneticArrangement", () => {
  it("snaps a near edge alignment to the reference edge", () => {
    const active = createBlock("active", 100, 100)
    const reference = createBlock("reference", 320, 104)

    const result = resolveMagneticArrangement({
      activeBlockId: "active",
      movingIds: ["active"],
      startPositions: {
        active: { x: active.x, y: active.y },
      },
      deltaX: 218,
      deltaY: 0,
      zoom: 1,
      blocks: {
        active,
        reference,
      },
    })

    expect(result.positions.active?.x).toBe(320)
    expect(result.guides).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "line",
          axis: "x",
          position: 320,
        }),
      ])
    )
    expect(result.relatedBlockIds).toEqual(["reference"])
  })

  it("applies a soft pull before exact snap", () => {
    const active = createBlock("active", 100, 100)
    const reference = createBlock("reference", 320, 100)

    const result = resolveMagneticArrangement({
      activeBlockId: "active",
      movingIds: ["active"],
      startPositions: {
        active: { x: active.x, y: active.y },
      },
      deltaX: 210,
      deltaY: 0,
      zoom: 1,
      blocks: {
        active,
        reference,
      },
    })

    expect(result.positions.active?.x).toBeGreaterThan(310)
    expect(result.positions.active?.x).toBeLessThan(320)
  })

  it("detects preferred horizontal spacing and emits a gap guide", () => {
    const reference = createBlock("reference", 100, 100)
    const active = createBlock("active", 360, 108)
    const targetX =
      reference.x + reference.width + arrangementConstants.defaultGap

    const result = resolveMagneticArrangement({
      activeBlockId: "active",
      movingIds: ["active"],
      startPositions: {
        active: { x: active.x, y: active.y },
      },
      deltaX: targetX - active.x - 3,
      deltaY: 0,
      zoom: 1,
      blocks: {
        active,
        reference,
      },
    })

    expect(result.positions.active?.x).toBe(targetX)
    expect(result.guides).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "gap",
          orientation: "horizontal",
          length: arrangementConstants.defaultGap,
        }),
      ])
    )
  })

  it("supports vertical center alignment", () => {
    const active = createBlock("active", 120, 100)
    const reference = createBlock("reference", 108, 320, 200, 180)
    const referenceMiddle = reference.y + reference.height / 2
    const activeMiddle = active.y + active.height / 2
    const deltaY = referenceMiddle - activeMiddle

    const result = resolveMagneticArrangement({
      activeBlockId: "active",
      movingIds: ["active"],
      startPositions: {
        active: { x: active.x, y: active.y },
      },
      deltaX: 0,
      deltaY,
      zoom: 1,
      blocks: {
        active,
        reference,
      },
    })

    expect(result.positions.active?.y).toBe(referenceMiddle - active.height / 2)
    expect(result.guides).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "line",
          axis: "y",
          position: referenceMiddle,
        }),
      ])
    )
  })

  it("propagates the magnetized delta across a drag group", () => {
    const active = createBlock("active", 100, 100)
    const sibling = createBlock("sibling", 360, 180)
    const reference = createBlock("reference", 320, 260)

    const result = resolveMagneticArrangement({
      activeBlockId: "active",
      movingIds: ["active", "sibling"],
      startPositions: {
        active: { x: active.x, y: active.y },
        sibling: { x: sibling.x, y: sibling.y },
      },
      deltaX: 218,
      deltaY: 0,
      zoom: 1,
      blocks: {
        active,
        sibling,
        reference,
      },
    })

    expect(result.positions.active?.x).toBe(320)
    expect(result.positions.sibling?.x).toBe(580)
    expect(result.positions.sibling?.y).toBe(
      180 + ((result.positions.active?.y ?? active.y) - active.y)
    )
  })
})
