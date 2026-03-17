import { useEffect, useRef } from "react"

import { useBlocksStore } from "@/store/blocks.store"
import { useCanvasStore } from "@/store/canvas.store"
import type { BlockType } from "@/types/block.types"
import type { CanvasTool } from "@/types/canvas.types"

interface KeyboardShortcutsOptions {
  addBlockAtViewportCenter: (type: BlockType) => void
  fitAllContent: () => void
  resetZoomToOne: () => void
  toggleAiPanel: () => void
}

function isEditableElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (target.isContentEditable) {
    return true
  }

  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"))
}

export function useKeyboardShortcuts({
  addBlockAtViewportCenter,
  fitAllContent,
  resetZoomToOne,
  toggleAiPanel,
}: KeyboardShortcutsOptions) {
  const spaceHeldRef = useRef(false)
  const previousToolRef = useRef<CanvasTool>("select")

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const isEditable = isEditableElement(event.target)
      const isMod = event.metaKey || event.ctrlKey

      if (key === " " && !isEditable) {
        event.preventDefault()
        if (event.repeat || spaceHeldRef.current) {
          return
        }

        spaceHeldRef.current = true
        const canvasState = useCanvasStore.getState()
        previousToolRef.current = canvasState.tool
        canvasState.setTool("pan")
        canvasState.setCursor("grabbing")
        return
      }

      if (isEditable) {
        if (event.key === "Escape") {
          useCanvasStore.getState().clearSelection()
        }
        return
      }

      if (isMod && key === "z" && !event.shiftKey) {
        event.preventDefault()
        useBlocksStore.getState().undo()
        return
      }

      if (isMod && key === "k") {
        event.preventDefault()
        toggleAiPanel()
        return
      }

      if (isMod && key === "0") {
        event.preventDefault()
        resetZoomToOne()
        return
      }

      if (isMod && event.shiftKey && key === "h") {
        event.preventDefault()
        fitAllContent()
        return
      }

      if (isMod && key === "a") {
        event.preventDefault()
        const allIds = Object.keys(useBlocksStore.getState().blocks)
        useCanvasStore.getState().select(allIds)
        return
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault()
        const selectedIds = useCanvasStore.getState().selectedIds
        useBlocksStore.getState().removeBlocks(selectedIds)
        useCanvasStore.getState().clearSelection()
        return
      }

      if (event.key === "Escape") {
        event.preventDefault()
        useCanvasStore.getState().clearSelection()
        return
      }

      if (isMod || event.altKey) {
        return
      }

      switch (key) {
        case "t":
          addBlockAtViewportCenter("tasks")
          return
        case "n":
          addBlockAtViewportCenter("notes")
          return
        case "f":
          addBlockAtViewportCenter("focus")
          return
        case "v":
          useCanvasStore.getState().setTool("select")
          useCanvasStore.getState().setCursor("default")
          return
        case "h":
          useCanvasStore.getState().setTool("pan")
          useCanvasStore.getState().setCursor("grab")
          return
        default:
          return
      }
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key !== " ") {
        return
      }

      if (!spaceHeldRef.current) {
        return
      }

      spaceHeldRef.current = false
      const canvasState = useCanvasStore.getState()
      canvasState.setTool(previousToolRef.current)
      canvasState.setCursor(previousToolRef.current === "pan" ? "grab" : "default")
    }

    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("keyup", onKeyUp)

    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("keyup", onKeyUp)
    }
  }, [addBlockAtViewportCenter, fitAllContent, resetZoomToOne, toggleAiPanel])

  return {
    spaceHeldRef,
  }
}
