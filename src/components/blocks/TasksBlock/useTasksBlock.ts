import { useCallback } from "react"

import {
  MAX_TASK_ITEMS,
  createBlockId,
} from "@/lib/utils/block-sanitizers"
import { useBlocksStore } from "@/store/blocks.store"

type ReorderPosition = "before" | "after"

function reorderVisibleTasks(
  visibleTaskIds: string[],
  sourceTaskId: string,
  targetTaskId: string,
  position: ReorderPosition
) {
  const sourceIndex = visibleTaskIds.indexOf(sourceTaskId)
  const targetIndex = visibleTaskIds.indexOf(targetTaskId)

  if (sourceIndex === -1 || targetIndex === -1 || sourceTaskId === targetTaskId) {
    return visibleTaskIds
  }

  const nextVisibleIds = visibleTaskIds.filter((taskId) => taskId !== sourceTaskId)
  const insertionTargetIndex = nextVisibleIds.indexOf(targetTaskId)

  if (insertionTargetIndex === -1) {
    return visibleTaskIds
  }

  const insertionIndex =
    position === "after" ? insertionTargetIndex + 1 : insertionTargetIndex

  nextVisibleIds.splice(insertionIndex, 0, sourceTaskId)
  return nextVisibleIds
}

export function useTasksBlock(blockId: string) {
  const block = useBlocksStore((state) => {
    const item = state.blocks[blockId]
    if (!item || item.type !== "tasks") {
      return null
    }

    return item
  })
  const updateBlock = useBlocksStore((state) => state.updateBlock)

  const addTask = useCallback(
    (text: string) => {
      if (!block) {
        return null
      }

      const nextText = text.trim()
      if (nextText.length === 0 || block.data.items.length >= MAX_TASK_ITEMS) {
        return null
      }

      const nextId = createBlockId()

      updateBlock(blockId, {
        data: {
          ...block.data,
          items: [
            ...block.data.items,
            {
              id: nextId,
              text: nextText,
              completed: false,
            },
          ],
        },
      })

      return nextId
    },
    [block, blockId, updateBlock]
  )

  const toggleTask = useCallback(
    (taskId: string) => {
      if (!block) {
        return
      }

      updateBlock(blockId, {
        data: {
          ...block.data,
          items: block.data.items.map((item) =>
            item.id === taskId
              ? {
                  ...item,
                  completed: !item.completed,
                }
              : item
          ),
        },
      })
    },
    [block, blockId, updateBlock]
  )

  const removeTask = useCallback(
    (taskId: string) => {
      if (!block) {
        return
      }

      updateBlock(blockId, {
        data: {
          ...block.data,
          items: block.data.items.filter((item) => item.id !== taskId),
        },
      })
    },
    [block, blockId, updateBlock]
  )

  const reorderTasks = useCallback(
    (
      sourceTaskId: string,
      targetTaskId: string,
      position: ReorderPosition,
      visibleTaskIds: string[]
    ) => {
      if (!block || visibleTaskIds.length < 2) {
        return
      }

      const visibleIdSet = new Set(visibleTaskIds)
      if (!visibleIdSet.has(sourceTaskId) || !visibleIdSet.has(targetTaskId)) {
        return
      }

      const nextVisibleIds = reorderVisibleTasks(
        visibleTaskIds,
        sourceTaskId,
        targetTaskId,
        position
      )

      if (nextVisibleIds.every((taskId, index) => taskId === visibleTaskIds[index])) {
        return
      }

      const itemsById = new Map(block.data.items.map((item) => [item.id, item]))
      const reorderedVisibleItems = nextVisibleIds
        .map((taskId) => itemsById.get(taskId))
        .filter((item) => item !== undefined)

      if (reorderedVisibleItems.length !== nextVisibleIds.length) {
        return
      }

      let visibleCursor = 0
      updateBlock(blockId, {
        data: {
          ...block.data,
          items: block.data.items.map((item) =>
            visibleIdSet.has(item.id) ? reorderedVisibleItems[visibleCursor++] : item
          ),
        },
      })
    },
    [block, blockId, updateBlock]
  )

  return {
    block,
    addTask,
    toggleTask,
    removeTask,
    reorderTasks,
  }
}
