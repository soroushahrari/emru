import { useBlocksStore } from "@/store/blocks.store"

export function useFocusBlock(blockId: string) {
  const block = useBlocksStore((state) => {
    const item = state.blocks[blockId]
    if (!item || item.type !== "focus") {
      return null
    }

    return item
  })

  return {
    block,
  }
}
