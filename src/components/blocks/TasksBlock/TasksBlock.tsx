import { memo, type HTMLAttributes } from "react"

import { useBlockResize } from "@/hooks/useBlockResize"
import { cn } from "@/lib/utils"

import { useTasksBlock } from "./useTasksBlock"

interface TasksBlockProps {
  blockId: string
  selected: boolean
  isDragging: boolean
  landed: boolean
  dragHandleProps: HTMLAttributes<HTMLDivElement>
}

const MAX_VISIBLE_TASK_ITEMS = 250

export const TasksBlock = memo(function TasksBlock({
  blockId,
  selected,
  isDragging,
  landed,
  dragHandleProps,
}: TasksBlockProps) {
  const { block } = useTasksBlock(blockId)
  const { resizeHandleProps } = useBlockResize(blockId)

  if (!block) {
    return null
  }

  const visibleItems = block.data.items.slice(0, MAX_VISIBLE_TASK_ITEMS)
  const hiddenCount = block.data.items.length - visibleItems.length

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
      <div className="flex h-[calc(100%-40px)] min-h-0 flex-col gap-2">
        {visibleItems.length > 0 ? (
          <ul className="min-h-0 space-y-2 overflow-auto pr-1 text-sm text-foreground/90">
            {visibleItems.map((item, index) => (
              <li
                key={`${item}-${index}`}
                className="rounded-md bg-secondary/60 px-2 py-1.5 [overflow-wrap:anywhere]"
                dir="auto"
              >
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-md border border-dashed border-border/70 bg-secondary/30 px-2 py-2 text-xs text-muted-foreground">
            No tasks yet. Add one quick next action.
          </p>
        )}
        {hiddenCount > 0 ? (
          <p className="text-xs text-muted-foreground">+{hiddenCount} more items</p>
        ) : null}
      </div>
      <div
        className="resize-grip absolute bottom-1 right-1 h-5 w-5 cursor-se-resize"
        {...resizeHandleProps}
      />
    </article>
  )
})
