import { useEffect, type RefObject } from "react"
import { useGesture } from "@use-gesture/react"

import { useCanvasStore } from "@/store/canvas.store"

interface CanvasGesturesOptions {
  rootRef: RefObject<HTMLDivElement | null>
  spaceHeldRef: RefObject<boolean>
}

export function useCanvasGestures({
  rootRef,
  spaceHeldRef,
}: CanvasGesturesOptions) {
  useEffect(() => {
    const node = rootRef.current
    if (!node) {
      return
    }

    const blockWheelZoom = (event: WheelEvent) => {
      event.preventDefault()
    }

    node.addEventListener("wheel", blockWheelZoom, { passive: false })

    return () => {
      node.removeEventListener("wheel", blockWheelZoom)
    }
  }, [rootRef])

  useGesture(
    {
      onWheel: ({ event, delta }) => {
        event.preventDefault()
        const wheelEvent = event as WheelEvent
        const canvasState = useCanvasStore.getState()

        if (wheelEvent.ctrlKey || wheelEvent.metaKey) {
          canvasState.zoomAround(
            canvasState.zoom * (1 - delta[1] * 0.0008),
            wheelEvent.clientX,
            wheelEvent.clientY
          )
          return
        }

        canvasState.setOffset(
          canvasState.offsetX - delta[0],
          canvasState.offsetY - delta[1]
        )
      },
      onPinchStart: () => {
        return useCanvasStore.getState().zoom
      },
      onPinch: ({ event, origin, offset: [scale], memo }) => {
        event.preventDefault()
        if (typeof memo !== "number") {
          return memo
        }

        useCanvasStore
          .getState()
          .zoomAround(memo * scale, origin[0], origin[1])
        return memo
      },
      onDragStart: () => {
        const canvasState = useCanvasStore.getState()
        if (canvasState.tool !== "pan" && !spaceHeldRef.current) {
          return undefined
        }

        canvasState.setCursor("grabbing")
        return {
          startX: canvasState.offsetX,
          startY: canvasState.offsetY,
        }
      },
      onDrag: ({ memo, movement: [mx, my] }) => {
        if (!memo) {
          return memo
        }

        const canvasState = useCanvasStore.getState()
        if (canvasState.tool !== "pan" && !spaceHeldRef.current) {
          return memo
        }

        canvasState.setOffset(memo.startX + mx, memo.startY + my)
        return memo
      },
      onDragEnd: () => {
        const canvasState = useCanvasStore.getState()
        canvasState.setCursor(canvasState.tool === "pan" ? "grab" : "default")
      },
    },
    {
      target: rootRef,
      eventOptions: { passive: false },
      drag: {
        filterTaps: true,
        threshold: 4,
      },
    }
  )
}
