import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import {
  notifyFocusSessionEnded,
  primeFocusNotifications,
} from "@/lib/notifications/focus-notifications"
import {
  formatClock,
  getPhaseDurationMs,
  getRemainingMs,
  pauseTimer,
  restartTimer,
  setDurations,
  startTimer,
  transitionPhase,
} from "@/lib/utils/focus-timer"
import { useBlocksStore } from "@/store/blocks.store"

const TIMER_TICK_MS = 250

export function useFocusBlock(blockId: string) {
  const block = useBlocksStore((state) => {
    const item = state.blocks[blockId]
    if (!item || item.type !== "focus") {
      return null
    }

    return item
  })
  const updateBlock = useBlocksStore((state) => state.updateBlock)
  const [now, setNow] = useState(() => Date.now())
  const completionTokenRef = useRef<string | null>(null)

  const remainingMs = useMemo(() => {
    if (!block) {
      return 0
    }

    return getRemainingMs(block.data, now)
  }, [block, now])

  const durationMs = useMemo(() => {
    if (!block) {
      return 0
    }

    return getPhaseDurationMs(
      block.data.phase,
      block.data.focusMinutes,
      block.data.restMinutes
    )
  }, [block])

  const progress = useMemo(() => {
    if (durationMs <= 0) {
      return 0
    }

    return Math.min(1, Math.max(0, 1 - remainingMs / durationMs))
  }, [durationMs, remainingMs])

  const clock = useMemo(() => formatClock(remainingMs), [remainingMs])

  const start = useCallback(() => {
    if (!block || block.data.status === "running") {
      return
    }

    completionTokenRef.current = null
    const started = startTimer(block.data, Date.now())
    updateBlock(blockId, { data: started })
    setNow(Date.now())
    void primeFocusNotifications()
  }, [block, blockId, updateBlock])

  const pause = useCallback(() => {
    if (!block || block.data.status !== "running") {
      return
    }

    const paused = pauseTimer(block.data, Date.now())
    updateBlock(blockId, { data: paused })
    setNow(Date.now())
  }, [block, blockId, updateBlock])

  const toggleRunning = useCallback(() => {
    if (!block) {
      return
    }

    if (block.data.status === "running") {
      pause()
      return
    }

    start()
  }, [block, pause, start])

  const restart = useCallback(() => {
    if (!block) {
      return
    }

    const reset = restartTimer(block.data)
    completionTokenRef.current = null
    updateBlock(blockId, { data: reset })
    setNow(Date.now())
  }, [block, blockId, updateBlock])

  const setFocusMinutes = useCallback(
    (minutes: number) => {
      if (!block) {
        return
      }

      const next = setDurations(block.data, minutes, block.data.restMinutes)
      completionTokenRef.current = null
      updateBlock(blockId, { data: next })
      setNow(Date.now())
    },
    [block, blockId, updateBlock]
  )

  const setRestMinutes = useCallback(
    (minutes: number) => {
      if (!block) {
        return
      }

      const next = setDurations(block.data, block.data.focusMinutes, minutes)
      completionTokenRef.current = null
      updateBlock(blockId, { data: next })
      setNow(Date.now())
    },
    [block, blockId, updateBlock]
  )

  const toggleCompact = useCallback(() => {
    if (!block) {
      return
    }

    updateBlock(blockId, {
      data: {
        ...block.data,
        compact: !block.data.compact,
      },
    })
  }, [block, blockId, updateBlock])

  useEffect(() => {
    if (!block || block.data.status !== "running") {
      return
    }

    const timerId = window.setInterval(() => {
      setNow(Date.now())
    }, TIMER_TICK_MS)

    return () => {
      window.clearInterval(timerId)
    }
  }, [block])

  useEffect(() => {
    if (
      !block ||
      block.data.status !== "running" ||
      typeof block.data.endsAt !== "number"
    ) {
      return
    }

    if (remainingMs > 0) {
      return
    }

    const completionToken = `${block.id}:${block.data.endsAt}`
    if (completionTokenRef.current === completionToken) {
      return
    }
    completionTokenRef.current = completionToken

    const next = transitionPhase(block.data)
    updateBlock(blockId, { data: next })
    void notifyFocusSessionEnded(next.phase)
  }, [block, blockId, remainingMs, updateBlock])

  return {
    block,
    clock,
    progress,
    remainingMs,
    isRunning: block?.data.status === "running",
    start,
    pause,
    restart,
    toggleRunning,
    setFocusMinutes,
    setRestMinutes,
    toggleCompact,
  }
}
