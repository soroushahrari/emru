import { useEffect, useMemo, useRef, useState } from "react"
import type { DragEndEvent, DragMoveEvent, DragStartEvent } from "@dnd-kit/core"

import { resolveMagneticArrangement } from "@/lib/utils/arrangement.utils"
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
    canvasState.clearArrangement()
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
    const nextArrangement = {
      activeBlockId: blockId,
      guides: [],
      relatedBlockIds: [],
    }
    canvasStore.setArrangement(nextArrangement)

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
    const result = resolveMagneticArrangement({
      activeBlockId: activeDragId,
      movingIds: movingIdsRef.current,
      startPositions: startPositionsRef.current,
      deltaX: event.delta.x,
      deltaY: event.delta.y,
      zoom,
      blocks: useBlocksStore.getState().blocks,
    })
    const updates = Object.entries(result.positions).map(([id, position]) => ({
      id,
      x: position.x,
      y: position.y,
    }))

    useBlocksStore.getState().setBlocksPosition(updates)
    const nextArrangement = {
      activeBlockId: activeDragId,
      guides: result.guides,
      relatedBlockIds: result.relatedBlockIds,
    }
    useCanvasStore.getState().setArrangement(nextArrangement)
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
