import { memo, type HTMLAttributes } from "react"

import { useBlockResize } from "@/hooks/useBlockResize"
import { cn } from "@/lib/utils"
import { MAX_NOTES_TEXT_LENGTH } from "@/lib/utils/block-sanitizers"

import { useNotesBlock } from "./useNotesBlock"

interface NotesBlockProps {
  blockId: string
  selected: boolean
  isDragging: boolean
  landed: boolean
  dragHandleProps: HTMLAttributes<HTMLDivElement>
}

export const NotesBlock = memo(function NotesBlock({
  blockId,
  selected,
  isDragging,
  landed,
  dragHandleProps,
}: NotesBlockProps) {
  const { block, setText } = useNotesBlock(blockId)
  const { resizeHandleProps } = useBlockResize(blockId)

  if (!block) {
    return null
  }

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
      <textarea
        value={block.data.text}
        maxLength={MAX_NOTES_TEXT_LENGTH}
        placeholder="Capture thoughts, links, and rough ideas here."
        dir="auto"
        aria-label="Notes"
        onChange={(event) => {
          setText(event.target.value)
        }}
        className="h-[calc(100%-40px)] min-h-0 w-full resize-none rounded-lg bg-secondary/50 p-2 text-sm leading-relaxed text-foreground outline-none [overflow-wrap:anywhere]"
      />
      <div
        className="resize-grip absolute bottom-1 right-1 h-5 w-5 cursor-se-resize"
        {...resizeHandleProps}
      />
    </article>
  )
})
