export type CanvasTool = "select" | "pan"

export type CanvasCursor = "default" | "grab" | "grabbing" | "se-resize"

export interface ScreenRect {
  x: number
  y: number
  width: number
  height: number
}

export interface CanvasRect {
  x: number
  y: number
  width: number
  height: number
}

export interface ViewportTransform {
  offsetX: number
  offsetY: number
  zoom: number
}
