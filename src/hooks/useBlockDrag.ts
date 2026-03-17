import { useEffect, useMemo, useRef, useState } from "react"
import type { DragEndEvent, DragMoveEvent, DragStartEvent } from "@dnd-kit/core"

import { useBlocksStore, type BlocksSnapshot } from "@/store/blocks.store"
import { useCanvasStore } from "@/store/canvas.store"

type PositionMap = Record<string, { x: number; y: number }>

export function useBlockDrag() {
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [draggingIdsState, setDraggingIdsState] = useState<string[]>([])
  const [landedIdsState, setLandedIdsState] = useState<string[]>([])
  const movingIdsRef = useRef<string[]>([])
  const startPositionsRef = useRef<PositionMap>({})
  const snapshotRef = useRef<BlocksSnapshot | null>(null)
  const landedTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (landedTimeoutRef.current !== null) {
        window.clearTimeout(landedTimeoutRef.current)
      }
    }
  }, [])

  const reset = () => {
    setActiveDragId(null)
    setDraggingIdsState([])
    movingIdsRef.current = []
    startPositionsRef.current = {}
    snapshotRef.current = null
    const canvasState = useCanvasStore.getState()
    canvasState.setCursor(canvasState.tool === "pan" ? "grab" : "default")
  }

  const onDragStart = (event: DragStartEvent) => {
    const blockId = String(event.active.id)
    const blocksStore = useBlocksStore.getState()
    const canvasStore = useCanvasStore.getState()
    const activeBlock = blocksStore.blocks[blockId]

    if (!activeBlock) {
      return
    }

    const movingIds = canvasStore.selectedIds.includes(blockId)
      ? canvasStore.selectedIds
      : [blockId]

    if (!canvasStore.selectedIds.includes(blockId)) {
      canvasStore.select([blockId])
    }

    blocksStore.bringToFront(blockId)
    canvasStore.setCursor("grabbing")
    setActiveDragId(blockId)

    movingIdsRef.current = movingIds
    setDraggingIdsState(movingIds)
    snapshotRef.current = blocksStore.getSnapshot("Move blocks")
    startPositionsRef.current = Object.fromEntries(
      movingIds
        .map((id) => {
          const block = blocksStore.blocks[id]
          if (!block) {
            return null
          }

          return [id, { x: block.x, y: block.y }] as const
        })
        .filter((entry): entry is readonly [string, { x: number; y: number }] =>
          Boolean(entry)
        )
    )
  }

  const onDragMove = (event: DragMoveEvent) => {
    if (!activeDragId) {
      return
    }

    const zoom = useCanvasStore.getState().zoom
    const updates = movingIdsRef.current
      .map((id) => {
        const start = startPositionsRef.current[id]
        if (!start) {
          return null
        }

        return {
          id,
          x: start.x + event.delta.x / zoom,
          y: start.y + event.delta.y / zoom,
        }
      })
      .filter((update): update is { id: string; x: number; y: number } =>
        Boolean(update)
      )

    useBlocksStore.getState().setBlocksPosition(updates)
  }

  const onDragEnd = (event: DragEndEvent) => {
    const snapshot = snapshotRef.current
    if (snapshot && (Math.abs(event.delta.x) > 0 || Math.abs(event.delta.y) > 0)) {
      useBlocksStore.getState().pushSnapshot(snapshot)
      setLandedIdsState([...movingIdsRef.current])
      if (landedTimeoutRef.current !== null) {
        window.clearTimeout(landedTimeoutRef.current)
      }
      landedTimeoutRef.current = window.setTimeout(() => {
        setLandedIdsState([])
      }, 220)
    }

    reset()
  }

  const onDragCancel = () => {
    const snapshot = snapshotRef.current
    if (snapshot) {
      const updates = Object.entries(snapshot.blocks).map(([id, block]) => ({
        id,
        x: block.x,
        y: block.y,
      }))
      useBlocksStore.getState().setBlocksPosition(updates)
    }

    reset()
  }

  const draggingIds = useMemo(
    () => new Set(draggingIdsState),
    [draggingIdsState]
  )
  const landedIds = useMemo(() => new Set(landedIdsState), [landedIdsState])

  return {
    activeDragId,
    draggingIds,
    landedIds,
    onDragStart,
    onDragMove,
    onDragEnd,
    onDragCancel,
  }
}
