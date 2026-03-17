import type { Block } from "@/types/block.types"
import type { CanvasRect, ScreenRect } from "@/types/canvas.types"

export function clampZoom(zoom: number) {
  return Math.min(2, Math.max(0.02, zoom))
}

export function toCanvas(
  screenX: number,
  screenY: number,
  offsetX: number,
  offsetY: number,
  zoom: number
) {
  return {
    x: (screenX - offsetX) / zoom,
    y: (screenY - offsetY) / zoom,
  }
}

export function toScreen(
  canvasX: number,
  canvasY: number,
  offsetX: number,
  offsetY: number,
  zoom: number
) {
  return {
    x: canvasX * zoom + offsetX,
    y: canvasY * zoom + offsetY,
  }
}

export function normalizeScreenRect(
  startX: number,
  startY: number,
  currentX: number,
  currentY: number
): ScreenRect {
  const x = Math.min(startX, currentX)
  const y = Math.min(startY, currentY)
  const width = Math.abs(currentX - startX)
  const height = Math.abs(currentY - startY)

  return { x, y, width, height }
}

export function toCanvasRect(
  rect: ScreenRect,
  offsetX: number,
  offsetY: number,
  zoom: number
): CanvasRect {
  const topLeft = toCanvas(rect.x, rect.y, offsetX, offsetY, zoom)
  const bottomRight = toCanvas(
    rect.x + rect.width,
    rect.y + rect.height,
    offsetX,
    offsetY,
    zoom
  )

  return {
    x: Math.min(topLeft.x, bottomRight.x),
    y: Math.min(topLeft.y, bottomRight.y),
    width: Math.abs(bottomRight.x - topLeft.x),
    height: Math.abs(bottomRight.y - topLeft.y),
  }
}

function intersectsRect(a: CanvasRect, b: CanvasRect) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

export function blockIntersectsRect(block: Block, rect: CanvasRect) {
  return intersectsRect(
    {
      x: block.x,
      y: block.y,
      width: block.width,
      height: block.height,
    },
    rect
  )
}

export interface BoundingBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

export function getBlocksBoundingBox(blocks: Block[]): BoundingBox | null {
  if (blocks.length === 0) {
    return null
  }

  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (const block of blocks) {
    minX = Math.min(minX, block.x)
    minY = Math.min(minY, block.y)
    maxX = Math.max(maxX, block.x + block.width)
    maxY = Math.max(maxY, block.y + block.height)
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

export function getFitTransform(
  bounds: BoundingBox,
  viewportWidth: number,
  viewportHeight: number,
  padding = 80
) {
  const safeWidth = Math.max(bounds.width, 1)
  const safeHeight = Math.max(bounds.height, 1)
  const availableWidth = Math.max(viewportWidth - padding * 2, 1)
  const availableHeight = Math.max(viewportHeight - padding * 2, 1)

  const fitZoom = Math.min(availableWidth / safeWidth, availableHeight / safeHeight)
  const zoom = Math.min(1, Math.max(0.02, fitZoom))

  const centerX = bounds.minX + bounds.width / 2
  const centerY = bounds.minY + bounds.height / 2

  return {
    zoom,
    offsetX: viewportWidth / 2 - centerX * zoom,
    offsetY: viewportHeight / 2 - centerY * zoom,
  }
}
