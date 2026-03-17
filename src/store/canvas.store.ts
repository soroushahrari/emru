import { create } from "zustand"
import { persist } from "zustand/middleware"

import { clampZoom } from "@/lib/utils/canvas.utils"
import type { CanvasCursor, CanvasTool } from "@/types/canvas.types"

const MIN_ZOOM = 0.02
const MAX_ZOOM = 2

interface CanvasStore {
  offsetX: number
  offsetY: number
  zoom: number
  tool: CanvasTool
  selectedIds: string[]
  activeCursor: CanvasCursor
  setOffset: (x: number, y: number) => void
  setZoom: (zoom: number) => void
  zoomAround: (newZoom: number, screenX: number, screenY: number) => void
  setTool: (tool: CanvasTool) => void
  select: (ids: string[]) => void
  clearSelection: () => void
  setCursor: (cursor: CanvasCursor) => void
}

function isCanvasTool(value: unknown): value is CanvasTool {
  return value === "select" || value === "pan"
}

function sanitizeOffset(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0
  }

  return Math.min(1_000_000, Math.max(-1_000_000, value))
}

export const useCanvasStore = create<CanvasStore>()(
  persist(
    (set, get) => ({
      offsetX: 0,
      offsetY: 0,
      zoom: 1,
      tool: "select",
      selectedIds: [],
      activeCursor: "default",
      setOffset: (x, y) => {
        set({ offsetX: x, offsetY: y })
      },
      setZoom: (zoom) => {
        set({ zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom)) })
      },
      zoomAround: (newZoom, screenX, screenY) => {
        const { offsetX, offsetY, zoom } = get()
        const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom))
        const newOffsetX = screenX - (screenX - offsetX) * (clampedZoom / zoom)
        const newOffsetY = screenY - (screenY - offsetY) * (clampedZoom / zoom)
        set({ zoom: clampedZoom, offsetX: newOffsetX, offsetY: newOffsetY })
      },
      setTool: (tool) => {
        set({ tool })
      },
      select: (ids) => {
        set({ selectedIds: ids })
      },
      clearSelection: () => {
        set({ selectedIds: [] })
      },
      setCursor: (cursor) => {
        set({ activeCursor: cursor })
      },
    }),
    {
      name: "emru:canvas",
      partialize: (state) => ({
        offsetX: state.offsetX,
        offsetY: state.offsetY,
        zoom: state.zoom,
        tool: state.tool,
      }),
      merge: (persistedState, currentState) => {
        if (!persistedState || typeof persistedState !== "object") {
          return currentState
        }

        const persisted = persistedState as Partial<CanvasStore>
        const tool = isCanvasTool(persisted.tool) ? persisted.tool : currentState.tool

        return {
          ...currentState,
          offsetX: sanitizeOffset(persisted.offsetX ?? currentState.offsetX),
          offsetY: sanitizeOffset(persisted.offsetY ?? currentState.offsetY),
          zoom: clampZoom(
            typeof persisted.zoom === "number" && Number.isFinite(persisted.zoom)
              ? persisted.zoom
              : currentState.zoom
          ),
          tool,
          selectedIds: [],
          activeCursor: (tool === "pan" ? "grab" : "default") as CanvasCursor,
        }
      },
    }
  )
)

export type { CanvasStore }
