import { create } from "zustand"
import { persist } from "zustand/middleware"

import { sanitizeBlock, sanitizeBlocksRecord } from "@/lib/utils/block-sanitizers"
import type { Block, BlockPositionUpdate, BlockSizeUpdate } from "@/types/block.types"

interface BlocksSnapshot {
  blocks: Record<string, Block>
  nextZ: number
  description: string
}

interface BlocksStore {
  blocks: Record<string, Block>
  nextZ: number
  history: BlocksSnapshot[]
  addBlock: (block: Block) => void
  updateBlock: (id: string, patch: Partial<Block>) => void
  removeBlocks: (ids: string[]) => void
  setBlockPosition: (id: string, x: number, y: number) => void
  setBlocksPosition: (updates: BlockPositionUpdate[]) => void
  setBlockSize: (update: BlockSizeUpdate) => void
  bringToFront: (id: string) => void
  getSnapshot: (description: string) => BlocksSnapshot
  pushSnapshot: (snapshot: BlocksSnapshot) => void
  undo: () => void
}

function cloneBlocks(blocks: Record<string, Block>) {
  try {
    return structuredClone(blocks)
  } catch {
    return JSON.parse(JSON.stringify(blocks)) as Record<string, Block>
  }
}

function appendSnapshot(history: BlocksSnapshot[], snapshot: BlocksSnapshot) {
  if (history.length >= 50) {
    return [...history.slice(1), snapshot]
  }

  return [...history, snapshot]
}

export const useBlocksStore = create<BlocksStore>()(
  persist(
    (set, get) => ({
      blocks: {},
      nextZ: 10,
      history: [],
      addBlock: (block) => {
        const normalized = sanitizeBlock(block)
        if (!normalized) {
          return
        }

        const snapshot = get().getSnapshot(`Add ${normalized.type} block`)
        set((state) => {
          const nextBlock = sanitizeBlock({
            ...normalized,
            zIndex: state.nextZ,
          })
          if (!nextBlock) {
            return state
          }

          return {
            history: appendSnapshot(state.history, snapshot),
            nextZ: state.nextZ + 1,
            blocks: {
              ...state.blocks,
              [nextBlock.id]: nextBlock,
            },
          }
        })
      },
      updateBlock: (id, patch) => {
        set((state) => {
          const existing = state.blocks[id]
          if (!existing) {
            return state
          }

          const updatedBlock = sanitizeBlock({
            ...existing,
            ...patch,
            id: existing.id,
            type: existing.type,
            data: patch.data ?? existing.data,
          })
          if (!updatedBlock) {
            return state
          }

          return {
            blocks: {
              ...state.blocks,
              [id]: updatedBlock,
            },
          }
        })
      },
      removeBlocks: (ids) => {
        if (ids.length === 0) {
          return
        }

        const snapshot = get().getSnapshot("Delete blocks")
        set((state) => {
          const nextBlocks = { ...state.blocks }
          for (const id of ids) {
            delete nextBlocks[id]
          }

          return {
            history: appendSnapshot(state.history, snapshot),
            blocks: nextBlocks,
          }
        })
      },
      setBlockPosition: (id, x, y) => {
        set((state) => {
          const existing = state.blocks[id]
          if (!existing) {
            return state
          }

          const updatedBlock = sanitizeBlock({ ...existing, x, y })
          if (!updatedBlock) {
            return state
          }

          return {
            blocks: {
              ...state.blocks,
              [id]: updatedBlock,
            },
          }
        })
      },
      setBlocksPosition: (updates) => {
        if (updates.length === 0) {
          return
        }

        set((state) => {
          const nextBlocks = { ...state.blocks }
          for (const update of updates) {
            const existing = nextBlocks[update.id]
            if (!existing) {
              continue
            }

            const updatedBlock = sanitizeBlock({
              ...existing,
              x: update.x,
              y: update.y,
            })
            if (!updatedBlock) {
              continue
            }

            nextBlocks[update.id] = updatedBlock
          }

          return { blocks: nextBlocks }
        })
      },
      setBlockSize: (update) => {
        set((state) => {
          const existing = state.blocks[update.id]
          if (!existing) {
            return state
          }

          const updatedBlock = sanitizeBlock({
            ...existing,
            width: update.width,
            height: update.height,
          })
          if (!updatedBlock) {
            return state
          }

          return {
            blocks: {
              ...state.blocks,
              [update.id]: updatedBlock,
            },
          }
        })
      },
      bringToFront: (id) => {
        set((state) => {
          const existing = state.blocks[id]
          if (!existing) {
            return state
          }

          return {
            nextZ: state.nextZ + 1,
            blocks: {
              ...state.blocks,
              [id]: {
                ...existing,
                zIndex: state.nextZ,
              },
            },
          }
        })
      },
      getSnapshot: (description) => {
        const { blocks, nextZ } = get()
        return {
          blocks: cloneBlocks(blocks),
          nextZ,
          description,
        }
      },
      pushSnapshot: (snapshot) => {
        set((state) => ({
          history: appendSnapshot(state.history, snapshot),
        }))
      },
      undo: () => {
        set((state) => {
          const snapshot = state.history[state.history.length - 1]
          if (!snapshot) {
            return state
          }

          return {
            blocks: snapshot.blocks,
            nextZ: snapshot.nextZ,
            history: state.history.slice(0, -1),
          }
        })
      },
    }),
    {
      name: "emru:blocks",
      partialize: (state) => ({
        blocks: state.blocks,
        nextZ: state.nextZ,
      }),
      merge: (persistedState, currentState) => {
        if (!persistedState || typeof persistedState !== "object") {
          return currentState
        }

        const persisted = persistedState as Partial<BlocksStore>
        const blocks = sanitizeBlocksRecord(persisted.blocks)
        const highestZ = Object.values(blocks).reduce(
          (maxZ, block) => Math.max(maxZ, block.zIndex),
          9
        )
        const persistedNextZ =
          typeof persisted.nextZ === "number" && Number.isFinite(persisted.nextZ)
            ? Math.max(1, Math.round(persisted.nextZ))
            : highestZ + 1

        return {
          ...currentState,
          blocks,
          nextZ: Math.max(highestZ + 1, persistedNextZ),
          history: [],
        }
      },
    }
  )
)

export type { BlocksStore, BlocksSnapshot }
