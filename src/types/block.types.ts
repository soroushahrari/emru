export type BlockType = "tasks" | "notes" | "focus"

export interface BlockBase {
  id: string
  type: BlockType
  x: number
  y: number
  width: number
  height: number
  zIndex: number
}

export interface TasksBlockData {
  title: string
  items: string[]
}

export interface NotesBlockData {
  title: string
  text: string
}

export interface FocusBlockData {
  title: string
  seconds: number
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

export type Block = TasksBlock | NotesBlock | FocusBlock

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
