import { memo, type HTMLAttributes } from "react"

import { useBlockResize } from "@/hooks/useBlockResize"
import { cn } from "@/lib/utils"

import { useFocusBlock } from "./useFocusBlock"

interface FocusBlockProps {
  blockId: string
  selected: boolean
  isDragging: boolean
  landed: boolean
  dragHandleProps: HTMLAttributes<HTMLDivElement>
}

function toClock(seconds: number) {
  if (!Number.isFinite(seconds)) {
    return "00:00"
  }

  const normalizedSeconds = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(normalizedSeconds / 3600)
  const minutes = Math.floor((normalizedSeconds % 3600) / 60)
  const restSeconds = normalizedSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(restSeconds).padStart(2, "0")}`
  }

  return `${String(minutes).padStart(2, "0")}:${String(restSeconds).padStart(2, "0")}`
}

export const FocusBlock = memo(function FocusBlock({
  blockId,
  selected,
  isDragging,
  landed,
  dragHandleProps,
}: FocusBlockProps) {
  const { block } = useFocusBlock(blockId)
  const { resizeHandleProps } = useBlockResize(blockId)

  if (!block) {
    return null
  }

  const clock = toClock(block.data.seconds)

  return (
    <article
      className={cn(
        "absolute min-w-0 overflow-hidden rounded-2xl bg-card p-3 shadow-[0_6px_20px_rgba(0,0,0,0.16)]",
        "select-none canvas-block-enter",
        landed && "canvas-drag-landed"
      )}
      style={{
        left: block.x,
        top: block.y,
        width: block.width,
        height: block.height,
        zIndex: block.zIndex,
        outline: selected ? "1.5px solid rgba(212, 105, 42, 0.7)" : "none",
        outlineOffset: selected ? "1px" : "0",
        boxShadow: isDragging
          ? "0 0 0 0.5px rgba(0,0,0,0.14), 0 8px 32px rgba(0,0,0,0.14)"
          : undefined,
        willChange: isDragging ? "transform" : undefined,
      }}
    >
      <header
        className={cn(
          "mb-3 flex min-w-0 items-center justify-between rounded-lg bg-secondary/80 px-2.5 py-1.5 text-xs uppercase tracking-wide text-muted-foreground",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        {...dragHandleProps}
      >
        <span className="truncate [overflow-wrap:anywhere]" dir="auto">
          {block.data.title}
        </span>
      </header>
      <div className="flex h-[calc(100%-40px)] min-h-0 items-center justify-center">
        <div
          className={cn(
            "flex h-24 w-24 max-w-full items-center justify-center rounded-full bg-secondary/60 px-2 text-center font-mono tabular-nums shadow-[inset_0_0_0_2px_rgba(212,105,42,0.45)]",
            clock.length > 5 ? "text-sm" : "text-xl"
          )}
          dir="ltr"
        >
          {clock}
        </div>
      </div>
      <div
        className="resize-grip absolute bottom-1 right-1 h-5 w-5 cursor-se-resize"
        {...resizeHandleProps}
      />
    </article>
  )
})
