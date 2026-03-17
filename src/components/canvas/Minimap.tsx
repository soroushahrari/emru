import { memo, useEffect, useMemo, useRef, useState } from "react"

import { getBlocksBoundingBox } from "@/lib/utils/canvas.utils"
import { cn } from "@/lib/utils"
import { useBlocksStore } from "@/store/blocks.store"
import { useCanvasStore } from "@/store/canvas.store"

const MINIMAP_WIDTH_DESKTOP = 220
const MINIMAP_HEIGHT_DESKTOP = 140
const MINIMAP_WIDTH_MOBILE = 168
const MINIMAP_HEIGHT_MOBILE = 112
const MINIMAP_PADDING = 8
const EMPTY_WORLD_SCALE = 2
const MAX_MINIMAP_BLOCKS = 400

interface DragSession {
  pointerId: number
}

function useViewportSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  useEffect(() => {
    const onResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }

    window.addEventListener("resize", onResize)
    return () => {
      window.removeEventListener("resize", onResize)
    }
  }, [])

  return size
}

export const Minimap = memo(function Minimap() {
  const blocksMap = useBlocksStore((state) => state.blocks)
  const offsetX = useCanvasStore((state) => state.offsetX)
  const offsetY = useCanvasStore((state) => state.offsetY)
  const zoom = useCanvasStore((state) => state.zoom)
  const viewport = useViewportSize()
  const dragSessionRef = useRef<DragSession | null>(null)
  const [isDraggingViewport, setIsDraggingViewport] = useState(false)
  const pendingCenterRef = useRef<{ x: number; y: number } | null>(null)
  const rafRef = useRef<number | null>(null)
  const blocks = useMemo(() => Object.values(blocksMap), [blocksMap])
  const sortedBlocks = useMemo(
    () => [...blocks].sort((a, b) => a.zIndex - b.zIndex),
    [blocks]
  )
  const renderedBlocks = useMemo(
    () =>
      sortedBlocks.length > MAX_MINIMAP_BLOCKS
        ? sortedBlocks.slice(sortedBlocks.length - MAX_MINIMAP_BLOCKS)
        : sortedBlocks,
    [sortedBlocks]
  )
  const hiddenBlockCount = sortedBlocks.length - renderedBlocks.length
  const minimapWidth = viewport.width < 768 ? MINIMAP_WIDTH_MOBILE : MINIMAP_WIDTH_DESKTOP
  const minimapHeight = viewport.width < 768 ? MINIMAP_HEIGHT_MOBILE : MINIMAP_HEIGHT_DESKTOP

  const world = useMemo(() => {
    const viewportRect = {
      x: -offsetX / zoom,
      y: -offsetY / zoom,
      width: viewport.width / zoom,
      height: viewport.height / zoom,
    }

    const blockBounds = getBlocksBoundingBox(sortedBlocks)
    if (!blockBounds) {
      return {
        minX: viewportRect.x - viewportRect.width / 2,
        minY: viewportRect.y - viewportRect.height / 2,
        width: viewportRect.width * EMPTY_WORLD_SCALE,
        height: viewportRect.height * EMPTY_WORLD_SCALE,
      }
    }

    const paddingX = Math.max(blockBounds.width, viewportRect.width) * 0.2
    const paddingY = Math.max(blockBounds.height, viewportRect.height) * 0.2

    const minX = Math.min(blockBounds.minX, viewportRect.x) - paddingX
    const minY = Math.min(blockBounds.minY, viewportRect.y) - paddingY
    const maxX = Math.max(blockBounds.maxX, viewportRect.x + viewportRect.width) + paddingX
    const maxY = Math.max(blockBounds.maxY, viewportRect.y + viewportRect.height) + paddingY

    return {
      minX,
      minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
    }
  }, [offsetX, offsetY, sortedBlocks, viewport.height, viewport.width, zoom])

  const rawScale = Math.min(
    (minimapWidth - MINIMAP_PADDING * 2) / world.width,
    (minimapHeight - MINIMAP_PADDING * 2) / world.height
  )
  const scale = Number.isFinite(rawScale) && rawScale > 0 ? rawScale : 1

  const toMinimapX = (canvasX: number) =>
    MINIMAP_PADDING + (canvasX - world.minX) * scale
  const toMinimapY = (canvasY: number) =>
    MINIMAP_PADDING + (canvasY - world.minY) * scale
  const toCanvasX = (miniX: number) => world.minX + (miniX - MINIMAP_PADDING) / scale
  const toCanvasY = (miniY: number) => world.minY + (miniY - MINIMAP_PADDING) / scale

  const viewportRect = {
    x: toMinimapX(-offsetX / zoom),
    y: toMinimapY(-offsetY / zoom),
    width: (viewport.width / zoom) * scale,
    height: (viewport.height / zoom) * scale,
  }

  const clampedViewportWidth = Math.min(
    minimapWidth - MINIMAP_PADDING * 2,
    Math.max(8, viewportRect.width)
  )
  const clampedViewportHeight = Math.min(
    minimapHeight - MINIMAP_PADDING * 2,
    Math.max(8, viewportRect.height)
  )

  const clampedViewportRect = {
    width: clampedViewportWidth,
    height: clampedViewportHeight,
    x: Math.min(
      minimapWidth - MINIMAP_PADDING - clampedViewportWidth,
      Math.max(MINIMAP_PADDING, viewportRect.x)
    ),
    y: Math.min(
      minimapHeight - MINIMAP_PADDING - clampedViewportHeight,
      Math.max(MINIMAP_PADDING, viewportRect.y)
    ),
  }

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  const centerAtPointer = (clientX: number, clientY: number, element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    pendingCenterRef.current = {
      x: toCanvasX(clientX - rect.left),
      y: toCanvasY(clientY - rect.top),
    }

    if (rafRef.current !== null) {
      return
    }

    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null
      const pendingCenter = pendingCenterRef.current
      if (!pendingCenter) {
        return
      }

      useCanvasStore
        .getState()
        .setOffset(
          viewport.width / 2 - pendingCenter.x * zoom,
          viewport.height / 2 - pendingCenter.y * zoom
        )
    })
  }

  return (
    <div
      className={cn(
        "pointer-events-auto fixed bottom-[calc(env(safe-area-inset-bottom)+6rem)] right-4 z-40 overflow-hidden rounded-lg bg-card/58 shadow-[0_10px_24px_rgba(0,0,0,0.16)] transition-[opacity,background-color] duration-200 sm:bottom-[calc(env(safe-area-inset-bottom)+1rem)]",
        isDraggingViewport
          ? "opacity-100 bg-card/86"
          : "opacity-72 hover:opacity-95 focus-within:opacity-95"
      )}
      title="Minimap (click or drag to move viewport)"
      style={{ width: minimapWidth, height: minimapHeight }}
      onPointerDown={(event) => {
        if (event.button !== 0) {
          return
        }

        event.stopPropagation()
        dragSessionRef.current = { pointerId: event.pointerId }
        setIsDraggingViewport(true)
        event.currentTarget.setPointerCapture(event.pointerId)
        centerAtPointer(event.clientX, event.clientY, event.currentTarget)
      }}
      onPointerMove={(event) => {
        event.stopPropagation()
        const dragSession = dragSessionRef.current
        if (!dragSession || dragSession.pointerId !== event.pointerId) {
          return
        }

        centerAtPointer(event.clientX, event.clientY, event.currentTarget)
      }}
      onPointerUp={(event) => {
        event.stopPropagation()
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId)
        }
        setIsDraggingViewport(false)
        dragSessionRef.current = null
      }}
      onPointerCancel={(event) => {
        event.stopPropagation()
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId)
        }
        setIsDraggingViewport(false)
        dragSessionRef.current = null
      }}
    >
      <div className="pointer-events-none absolute left-2 top-1 z-20 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/90">
        map
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.08)_1px,transparent_1px)] [background-size:12px_12px]" />
      {renderedBlocks.map((block) => (
        <div
          key={block.id}
          className="absolute rounded-sm bg-foreground/30"
          style={{
            left: toMinimapX(block.x),
            top: toMinimapY(block.y),
            width: Math.max(2, block.width * scale),
            height: Math.max(2, block.height * scale),
          }}
        />
      ))}
      <div
        className={cn(
          "absolute rounded-sm bg-primary/12 transition-shadow duration-150",
          isDraggingViewport
            ? "shadow-[0_0_0_1.5px_rgba(212,105,42,0.55),0_0_0_7px_rgba(212,105,42,0.12)]"
            : "shadow-[0_0_0_1px_rgba(212,105,42,0.45)]"
        )}
        style={{
          left: clampedViewportRect.x,
          top: clampedViewportRect.y,
          width: clampedViewportRect.width,
          height: clampedViewportRect.height,
        }}
      />
      {hiddenBlockCount > 0 ? (
        <div className="pointer-events-none absolute bottom-1 right-2 rounded bg-card/80 px-1.5 py-0.5 text-[10px] text-muted-foreground">
          +{hiddenBlockCount}
        </div>
      ) : null}
    </div>
  )
})
