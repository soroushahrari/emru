import { useBlocksStore } from "@/store/blocks.store"

export function useTasksBlock(blockId: string) {
  const block = useBlocksStore((state) => {
    const item = state.blocks[blockId]
    if (!item || item.type !== "tasks") {
      return null
    }

    return item
  })

  return {
    block,
  }
}
