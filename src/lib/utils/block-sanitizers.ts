import type { Block, BlockType, FocusBlockData, NotesBlockData, TasksBlockData } from "@/types/block.types"

const VALID_BLOCK_TYPES: BlockType[] = ["tasks", "notes", "focus"]
const MAX_COORDINATE = 1_000_000
const MIN_BLOCK_WIDTH = 160
const MAX_BLOCK_WIDTH = 1_600
const MAX_BLOCK_HEIGHT = 1_600
const MAX_TITLE_LENGTH = 120
const MAX_TASK_ITEMS = 1_000
const MAX_TASK_ITEM_LENGTH = 280
export const MAX_NOTES_TEXT_LENGTH = 20_000
const MAX_FOCUS_SECONDS = 99 * 60 * 60 + 59 * 60 + 59

const DEFAULT_TITLE: Record<BlockType, string> = {
  tasks: "tasks",
  notes: "notes",
  focus: "focus",
}

const DEFAULT_SIZE: Record<BlockType, { width: number; height: number }> = {
  tasks: { width: 320, height: 220 },
  notes: { width: 340, height: 240 },
  focus: { width: 280, height: 180 },
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
  return typeof value === "string" && VALID_BLOCK_TYPES.includes(value as BlockType)
}

function normalizeTasksData(value: unknown): TasksBlockData {
  const source = value && typeof value === "object" ? (value as Partial<TasksBlockData>) : {}
  const rawItems = Array.isArray(source.items) ? source.items : []

  const items = rawItems
    .map((item) => truncate(asString(item).trim(), MAX_TASK_ITEM_LENGTH))
    .filter((item) => item.length > 0)
    .slice(0, MAX_TASK_ITEMS)

  return {
    title: normalizeTitle(source.title, DEFAULT_TITLE.tasks),
    items,
  }
}

function normalizeNotesData(value: unknown): NotesBlockData {
  const source = value && typeof value === "object" ? (value as Partial<NotesBlockData>) : {}

  return {
    title: normalizeTitle(source.title, DEFAULT_TITLE.notes),
    text: truncate(asString(source.text), MAX_NOTES_TEXT_LENGTH),
  }
}

function normalizeFocusData(value: unknown): FocusBlockData {
  const source = value && typeof value === "object" ? (value as Partial<FocusBlockData>) : {}
  const seconds = Math.floor(
    clamp(asFiniteNumber(source.seconds, 25 * 60), 0, MAX_FOCUS_SECONDS)
  )

  return {
    title: normalizeTitle(source.title, DEFAULT_TITLE.focus),
    seconds,
  }
}

export function createBlockId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function getMinimumBlockHeight(type: BlockType) {
  if (type === "focus") {
    return 180
  }

  return 120
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

  const defaults = DEFAULT_SIZE[type]
  const minHeight = getMinimumBlockHeight(type)
  const width = Math.round(
    clamp(asFiniteNumber(candidate.width, defaults.width), MIN_BLOCK_WIDTH, MAX_BLOCK_WIDTH)
  )
  const height = Math.round(
    clamp(asFiniteNumber(candidate.height, defaults.height), minHeight, MAX_BLOCK_HEIGHT)
  )
  const x = clamp(asFiniteNumber(candidate.x, 0), -MAX_COORDINATE, MAX_COORDINATE)
  const y = clamp(asFiniteNumber(candidate.y, 0), -MAX_COORDINATE, MAX_COORDINATE)
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

  for (const [key, value] of Object.entries(blocks)) {
    if (!value || typeof value !== "object") {
      continue
    }

    const block = sanitizeBlock({ id: key, ...value })
    if (!block) {
      continue
    }

    sanitized[block.id] = block
  }

  return sanitized
}
