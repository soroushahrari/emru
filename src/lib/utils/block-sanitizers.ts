import type {
  Block,
  BlockType,
  CountdownBlockData,
  FocusBlockData,
  NotesBlockData,
  TaskItem,
  TasksBlockData,
} from "@/types/block.types"
import {
  MAX_FOCUS_MINUTES,
  MIN_FOCUS_MINUTES,
  getPhaseDurationMs,
} from "@/lib/utils/focus-timer"

const VALID_BLOCK_TYPES: BlockType[] = ["tasks", "notes", "focus", "countdown"]
const MAX_COORDINATE = 1_000_000
const MAX_TITLE_LENGTH = 120
export const MAX_TASK_ITEMS = 1_000
export const MAX_TASK_ITEM_LENGTH = 280
export const MAX_NOTES_TEXT_LENGTH = 20_000

interface BlockSizeBounds {
  defaultWidth: number
  defaultHeight: number
  minWidth: number
  minHeight: number
  maxWidth: number
  maxHeight: number
}

const BLOCK_SIZE_BOUNDS: Record<BlockType, Readonly<BlockSizeBounds>> = {
  tasks: {
    defaultWidth: 320,
    defaultHeight: 220,
    minWidth: 240,
    minHeight: 170,
    maxWidth: 760,
    maxHeight: 680,
  },
  notes: {
    defaultWidth: 340,
    defaultHeight: 248,
    minWidth: 260,
    minHeight: 196,
    maxWidth: 880,
    maxHeight: 760,
  },
  focus: {
    defaultWidth: 312,
    defaultHeight: 288,
    minWidth: 260,
    minHeight: 236,
    maxWidth: 460,
    maxHeight: 420,
  },
  countdown: {
    defaultWidth: 200,
    defaultHeight: 220,
    minWidth: 180,
    minHeight: 200,
    maxWidth: 420,
    maxHeight: 420,
  },
}

const DEFAULT_TITLE: Record<BlockType, string> = {
  tasks: "tasks",
  notes: "notes",
  focus: "focus",
  countdown: "Countdown",
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function asFiniteNumber(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback
  }

  return value
}

function asString(value: unknown) {
  return typeof value === "string" ? value : ""
}

function asBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") {
    return value
  }

  return fallback
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value
  }

  return value.slice(0, maxLength)
}

function normalizeTitle(value: unknown, fallback: string) {
  const trimmed = asString(value).trim()
  if (trimmed.length === 0) {
    return fallback
  }

  return truncate(trimmed, MAX_TITLE_LENGTH)
}

function isBlockType(value: unknown): value is BlockType {
  return (
    typeof value === "string" && VALID_BLOCK_TYPES.includes(value as BlockType)
  )
}

function normalizeTaskItem(value: unknown): TaskItem | null {
  if (typeof value === "string") {
    const text = truncate(value.trim(), MAX_TASK_ITEM_LENGTH)
    if (text.length === 0) {
      return null
    }

    return {
      id: createBlockId(),
      text,
      completed: false,
    }
  }

  if (!value || typeof value !== "object") {
    return null
  }

  const candidate = value as Partial<TaskItem> & { text?: unknown }
  const text = truncate(asString(candidate.text).trim(), MAX_TASK_ITEM_LENGTH)
  if (text.length === 0) {
    return null
  }

  const id = asString(candidate.id).trim() || createBlockId()

  return {
    id,
    text,
    completed: asBoolean(candidate.completed, false),
  }
}

function normalizeTasksData(value: unknown): TasksBlockData {
  const source =
    value && typeof value === "object" ? (value as Partial<TasksBlockData>) : {}
  const rawItems = Array.isArray(source.items) ? source.items : []

  const items = rawItems
    .map((item) => normalizeTaskItem(item))
    .filter((item): item is TaskItem => item !== null)
    .slice(0, MAX_TASK_ITEMS)

  return {
    title: normalizeTitle(source.title, DEFAULT_TITLE.tasks),
    items,
  }
}

function normalizeNotesData(value: unknown): NotesBlockData {
  const source =
    value && typeof value === "object" ? (value as Partial<NotesBlockData>) : {}

  return {
    title: normalizeTitle(source.title, DEFAULT_TITLE.notes),
    text: truncate(asString(source.text), MAX_NOTES_TEXT_LENGTH),
  }
}

function normalizeFocusData(value: unknown): FocusBlockData {
  const source =
    value && typeof value === "object" ? (value as Partial<FocusBlockData>) : {}
  const phase = source.phase === "rest" ? "rest" : "focus"
  const status =
    source.status === "running" ||
    source.status === "paused" ||
    source.status === "idle"
      ? source.status
      : "idle"
  const focusMinutes = Math.round(
    clamp(
      asFiniteNumber(source.focusMinutes, 25),
      MIN_FOCUS_MINUTES,
      MAX_FOCUS_MINUTES
    )
  )
  const restMinutes = Math.round(
    clamp(
      asFiniteNumber(source.restMinutes, 5),
      MIN_FOCUS_MINUTES,
      MAX_FOCUS_MINUTES
    )
  )
  const maxRemainingMs = getPhaseDurationMs(phase, focusMinutes, restMinutes)
  const remainingMs = Math.floor(
    clamp(asFiniteNumber(source.remainingMs, maxRemainingMs), 0, maxRemainingMs)
  )
  const rawStartedAt =
    typeof source.startedAt === "number" && Number.isFinite(source.startedAt)
      ? Math.floor(source.startedAt)
      : null
  const rawEndsAt =
    typeof source.endsAt === "number" && Number.isFinite(source.endsAt)
      ? Math.floor(source.endsAt)
      : null
  const isRunning = status === "running" && rawEndsAt !== null
  const startedAt = isRunning ? rawStartedAt : null
  const endsAt = isRunning ? rawEndsAt : null

  return {
    title: normalizeTitle(source.title, DEFAULT_TITLE.focus),
    focusMinutes,
    restMinutes,
    phase,
    status: isRunning ? "running" : status === "running" ? "idle" : status,
    startedAt,
    endsAt,
    remainingMs,
    compact: asBoolean(source.compact, false),
  }
}

function normalizeDateOnly(value: unknown) {
  const raw = asString(value).trim()
  if (raw.length === 0) {
    return null
  }

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw)
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch
    const normalized = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    )

    if (
      normalized.getFullYear() !== Number(year) ||
      normalized.getMonth() !== Number(month) - 1 ||
      normalized.getDate() !== Number(day)
    ) {
      return null
    }

    return raw
  }

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  const year = parsed.getFullYear()
  const month = `${parsed.getMonth() + 1}`.padStart(2, "0")
  const day = `${parsed.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function normalizeIsoTimestamp(value: unknown) {
  const raw = asString(value).trim()
  if (raw.length === 0) {
    return new Date().toISOString()
  }

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString()
  }

  return parsed.toISOString()
}

function normalizeCountdownData(value: unknown): CountdownBlockData {
  const source =
    value && typeof value === "object"
      ? (value as Partial<CountdownBlockData>)
      : {}

  return {
    label: normalizeTitle(source.label, DEFAULT_TITLE.countdown),
    targetDate: normalizeDateOnly(source.targetDate),
    createdAt: normalizeIsoTimestamp(source.createdAt),
  }
}

export function createBlockId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID()
  }

  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function getBlockSizeBounds(type: BlockType) {
  return BLOCK_SIZE_BOUNDS[type]
}

export function sanitizeBlock(input: unknown): Block | null {
  if (!input || typeof input !== "object") {
    return null
  }

  const candidate = input as Partial<Block>
  const type = isBlockType(candidate.type) ? candidate.type : null
  if (!type) {
    return null
  }

  const sizeBounds = getBlockSizeBounds(type)
  const width = Math.round(
    clamp(
      asFiniteNumber(candidate.width, sizeBounds.defaultWidth),
      sizeBounds.minWidth,
      sizeBounds.maxWidth
    )
  )
  const height = Math.round(
    clamp(
      asFiniteNumber(candidate.height, sizeBounds.defaultHeight),
      sizeBounds.minHeight,
      sizeBounds.maxHeight
    )
  )
  const x = clamp(
    asFiniteNumber(candidate.x, 0),
    -MAX_COORDINATE,
    MAX_COORDINATE
  )
  const y = clamp(
    asFiniteNumber(candidate.y, 0),
    -MAX_COORDINATE,
    MAX_COORDINATE
  )
  const zIndex = Math.max(1, Math.round(asFiniteNumber(candidate.zIndex, 10)))
  const id = asString(candidate.id).trim() || createBlockId()

  if (type === "tasks") {
    return {
      id,
      type,
      x,
      y,
      width,
      height,
      zIndex,
      data: normalizeTasksData(candidate.data),
    }
  }

  if (type === "notes") {
    return {
      id,
      type,
      x,
      y,
      width,
      height,
      zIndex,
      data: normalizeNotesData(candidate.data),
    }
  }

  if (type === "countdown") {
    return {
      id,
      type,
      x,
      y,
      width,
      height,
      zIndex,
      data: normalizeCountdownData(candidate.data),
    }
  }

  return {
    id,
    type,
    x,
    y,
    width,
    height,
    zIndex,
    data: normalizeFocusData(candidate.data),
  }
}

export function sanitizeBlocksRecord(input: unknown) {
  if (!input || typeof input !== "object") {
    return {}
  }

  const sanitized: Record<string, Block> = {}
  const blocks = input as Record<string, unknown>
  let winnerFocus: Block | null = null

  for (const [key, value] of Object.entries(blocks)) {
    if (!value || typeof value !== "object") {
      continue
    }

    const block = sanitizeBlock({ id: key, ...value })
    if (!block) {
      continue
    }

    if (block.type !== "focus") {
      sanitized[block.id] = block
      continue
    }

    if (!winnerFocus) {
      winnerFocus = block
      continue
    }

    if (
      block.zIndex > winnerFocus.zIndex ||
      (block.zIndex === winnerFocus.zIndex && block.id > winnerFocus.id)
    ) {
      winnerFocus = block
    }
  }

  if (winnerFocus) {
    sanitized[winnerFocus.id] = winnerFocus
  }

  return sanitized
}
