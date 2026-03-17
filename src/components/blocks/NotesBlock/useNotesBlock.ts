import { useCallback } from "react"

import { MAX_NOTES_TEXT_LENGTH } from "@/lib/utils/block-sanitizers"
import { useBlocksStore } from "@/store/blocks.store"

export function useNotesBlock(blockId: string) {
  const block = useBlocksStore((state) => {
    const item = state.blocks[blockId]
    if (!item || item.type !== "notes") {
      return null
    }

    return item
  })
  const updateBlock = useBlocksStore((state) => state.updateBlock)

  const setText = useCallback(
    (text: string) => {
      if (!block) {
        return
      }

      updateBlock(blockId, {
        data: {
          ...block.data,
          text: text.slice(0, MAX_NOTES_TEXT_LENGTH),
        },
      })
    },
    [block, blockId, updateBlock]
  )

  return {
    block,
    setText,
  }
}
