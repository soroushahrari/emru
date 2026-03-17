import { useRef } from "react"
import type React from "react"

import { getMinimumBlockHeight } from "@/lib/utils/block-sanitizers"
import { useBlocksStore, type BlocksSnapshot } from "@/store/blocks.store"
import { useCanvasStore } from "@/store/canvas.store"

interface ResizeSession {
  pointerId: number
  startX: number
  startY: number
  startWidth: number
  startHeight: number
  moved: boolean
}

export function useBlockResize(blockId: string) {
  const sessionRef = useRef<ResizeSession | null>(null)
  const snapshotRef = useRef<BlocksSnapshot | null>(null)

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (event.button !== 0) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const block = useBlocksStore.getState().blocks[blockId]
    if (!block) {
      return
    }

    snapshotRef.current = useBlocksStore.getState().getSnapshot("Resize block")
    sessionRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: block.width,
      startHeight: block.height,
      moved: false,
    }

    useCanvasStore.getState().setCursor("se-resize")
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (event) => {
    const session = sessionRef.current
    if (!session || event.pointerId !== session.pointerId) {
      return
    }

    event.preventDefault()

    const block = useBlocksStore.getState().blocks[blockId]
    if (!block) {
      return
    }

    const nextWidth = Math.max(
      160,
      session.startWidth + (event.clientX - session.startX)
    )
    const minimumHeight = getMinimumBlockHeight(block.type)
    const nextHeight = Math.max(
      minimumHeight,
      session.startHeight + (event.clientY - session.startY)
    )

    useBlocksStore
      .getState()
      .setBlockSize({ id: blockId, width: nextWidth, height: nextHeight })

    if (
      nextWidth !== session.startWidth ||
      nextHeight !== session.startHeight
    ) {
      sessionRef.current = {
        ...session,
        moved: true,
      }
    }
  }

  const onPointerUp: React.PointerEventHandler<HTMLDivElement> = (event) => {
    const session = sessionRef.current
    if (!session || event.pointerId !== session.pointerId) {
      return
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    if (session.moved && snapshotRef.current) {
      useBlocksStore.getState().pushSnapshot(snapshotRef.current)
    }

    sessionRef.current = null
    snapshotRef.current = null

    const canvasState = useCanvasStore.getState()
    canvasState.setCursor(canvasState.tool === "pan" ? "grab" : "default")
  }

  const onPointerCancel: React.PointerEventHandler<HTMLDivElement> = (
    event
  ) => {
    const session = sessionRef.current
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    if (session?.moved && snapshotRef.current) {
      const snapshotBlock = snapshotRef.current.blocks[blockId]
      if (snapshotBlock) {
        useBlocksStore.getState().setBlockSize({
          id: blockId,
          width: snapshotBlock.width,
          height: snapshotBlock.height,
        })
      }
    }

    sessionRef.current = null
    snapshotRef.current = null
    const canvasState = useCanvasStore.getState()
    canvasState.setCursor(canvasState.tool === "pan" ? "grab" : "default")
  }

  return {
    resizeHandleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
  }
}
