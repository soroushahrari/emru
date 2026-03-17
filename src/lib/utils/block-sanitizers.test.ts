import { describe, expect, it } from "vitest"

import {
  MAX_NOTES_TEXT_LENGTH,
  createBlockId,
  sanitizeBlock,
  sanitizeBlocksRecord,
} from "@/lib/utils/block-sanitizers"

describe("block sanitizers", () => {
  it("normalizes malformed tasks block payload", () => {
    const block = sanitizeBlock({
      id: "",
      type: "tasks",
      x: Number.POSITIVE_INFINITY,
      y: Number.NEGATIVE_INFINITY,
      width: 10,
      height: 10,
      zIndex: -20,
      data: {
        title: "",
        items: ["", "  ship feature  ", 42, "emoji ✅", "x".repeat(500)],
      },
    })

    expect(block).not.toBeNull()
    expect(block?.type).toBe("tasks")
    if (!block || block.type !== "tasks") {
      throw new Error("expected tasks block")
    }
    expect(block?.id.length).toBeGreaterThan(0)
    expect(block?.width).toBeGreaterThanOrEqual(160)
    expect(block?.height).toBeGreaterThanOrEqual(120)
    expect(block?.zIndex).toBe(1)
    expect(block.data.title).toBe("tasks")
    expect(block.data.items).toEqual([
      "ship feature",
      "emoji ✅",
      "x".repeat(280),
    ])
  })

  it("limits notes text and normalizes focus timer data", () => {
    const notes = sanitizeBlock({
      id: "n1",
      type: "notes",
      x: 0,
      y: 0,
      width: 300,
      height: 220,
      zIndex: 10,
      data: {
        title: "Mein sehr langes Notizfeld",
        text: "a".repeat(MAX_NOTES_TEXT_LENGTH + 200),
      },
    })

    const focus = sanitizeBlock({
      id: "f1",
      type: "focus",
      x: 0,
      y: 0,
      width: 280,
      height: 180,
      zIndex: 10,
      data: {
        title: "focus",
        focusMinutes: Number.MAX_SAFE_INTEGER,
        restMinutes: Number.NEGATIVE_INFINITY,
        phase: "focus",
        status: "running",
        startedAt: Number.NaN,
        endsAt: Number.POSITIVE_INFINITY,
        remainingMs: Number.MAX_SAFE_INTEGER,
        compact: "yes",
      },
    })

    expect(notes?.type).toBe("notes")
    if (!notes || notes.type !== "notes") {
      throw new Error("expected notes block")
    }
    expect(notes.data.text.length).toBe(MAX_NOTES_TEXT_LENGTH)
    expect(focus?.type).toBe("focus")
    if (!focus || focus.type !== "focus") {
      throw new Error("expected focus block")
    }
    expect(focus.data.focusMinutes).toBe(180)
    expect(focus.data.restMinutes).toBe(5)
    expect(focus.data.phase).toBe("focus")
    expect(focus.data.status).toBe("idle")
    expect(focus.data.startedAt).toBeNull()
    expect(focus.data.endsAt).toBeNull()
    expect(focus.data.remainingMs).toBe(180 * 60 * 1000)
    expect(focus.data.compact).toBe(false)
  })

  it("filters invalid persisted records", () => {
    const blocks = sanitizeBlocksRecord({
      ok: {
        id: "ok",
        type: "notes",
        x: 10,
        y: 20,
        width: 320,
        height: 240,
        zIndex: 2,
        data: {
          title: "  keep me  ",
          text: "hello",
        },
      },
      badType: {
        id: "badType",
        type: "unknown",
      },
      wrongShape: "oops",
    })

    expect(Object.keys(blocks)).toEqual(["ok"])
    expect(blocks.ok.type).toBe("notes")
    expect(blocks.ok.data.title).toBe("keep me")
  })

  it("creates non-empty ids", () => {
    expect(createBlockId().length).toBeGreaterThan(8)
  })

  it("keeps a single focus block when persisted data has duplicates", () => {
    const blocks = sanitizeBlocksRecord({
      focusA: {
        id: "focusA",
        type: "focus",
        x: 0,
        y: 0,
        width: 280,
        height: 180,
        zIndex: 10,
        data: {
          title: "focus",
          focusMinutes: 25,
          restMinutes: 5,
          phase: "focus",
          status: "idle",
          startedAt: null,
          endsAt: null,
          remainingMs: 1500000,
          compact: false,
        },
      },
      focusB: {
        id: "focusB",
        type: "focus",
        x: 20,
        y: 30,
        width: 280,
        height: 180,
        zIndex: 20,
        data: {
          title: "focus",
          focusMinutes: 25,
          restMinutes: 5,
          phase: "rest",
          status: "paused",
          startedAt: null,
          endsAt: null,
          remainingMs: 300000,
          compact: true,
        },
      },
    })

    const focusBlocks = Object.values(blocks).filter(
      (block) => block.type === "focus"
    )
    expect(focusBlocks).toHaveLength(1)
    expect(focusBlocks[0]?.id).toBe("focusB")
  })
})
