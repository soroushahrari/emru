export type BlockType = "tasks" | "notes" | "focus" | "countdown"

export interface BlockBase {
  id: string
  type: BlockType
  x: number
  y: number
  width: number
  height: number
  zIndex: number
}

export interface TaskItem {
  id: string
  text: string
  completed: boolean
}

export interface TasksBlockData {
  title: string
  items: TaskItem[]
}

export interface NotesBlockData {
  title: string
  text: string
}

export interface FocusBlockData {
  title: string
  focusMinutes: number
  restMinutes: number
  phase: "focus" | "rest"
  status: "idle" | "running" | "paused"
  startedAt: number | null
  endsAt: number | null
  remainingMs: number
  compact: boolean
}

export interface CountdownBlockData {
  label: string
  targetDate: string | null
  createdAt: string
}

export interface TasksBlock extends BlockBase {
  type: "tasks"
  data: TasksBlockData
}

export interface NotesBlock extends BlockBase {
  type: "notes"
  data: NotesBlockData
}

export interface FocusBlock extends BlockBase {
  type: "focus"
  data: FocusBlockData
}

export interface CountdownBlock extends BlockBase {
  type: "countdown"
  data: CountdownBlockData
}

export type Block = TasksBlock | NotesBlock | FocusBlock | CountdownBlock

export interface BlockPositionUpdate {
  id: string
  x: number
  y: number
}

export interface BlockSizeUpdate {
  id: string
  width: number
  height: number
}
