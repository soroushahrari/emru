import { useCallback, useEffect, useMemo, useState } from "react"

import { getCountdownSnapshot } from "@/lib/utils/countdown"
import { useBlocksStore } from "@/store/blocks.store"

const REFRESH_INTERVAL_MS = 60_000

export function useCountdownBlock(blockId: string) {
  const block = useBlocksStore((state) => {
    const item = state.blocks[blockId]
    if (!item || item.type !== "countdown") {
      return null
    }

    return item
  })
  const updateBlock = useBlocksStore((state) => state.updateBlock)
  const [now, setNow] = useState(() => new Date())

  const snapshot = useMemo(() => {
    return getCountdownSnapshot({
      targetDate: block?.data.targetDate ?? null,
      createdAt: block?.data.createdAt ?? new Date().toISOString(),
      now,
    })
  }, [block, now])

  const setLabel = useCallback(
    (nextLabel: string) => {
      if (!block) {
        return
      }

      updateBlock(blockId, {
        data: {
          ...block.data,
          label: nextLabel.trim(),
        },
      })
    },
    [block, blockId, updateBlock]
  )

  const setTargetDate = useCallback(
    (nextDate: string | null) => {
      if (!block) {
        return
      }

      updateBlock(blockId, {
        data: {
          ...block.data,
          targetDate: nextDate && nextDate.trim().length > 0 ? nextDate : null,
        },
      })
      setNow(new Date())
    },
    [block, blockId, updateBlock]
  )

  useEffect(() => {
    setNow(new Date())
  }, [block?.data.targetDate])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date())
    }, REFRESH_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  return {
    block,
    snapshot,
    setLabel,
    setTargetDate,
  }
}
