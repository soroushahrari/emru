import {
  memo,
  useMemo,
  type HTMLAttributes,
} from "react"
import { DndContext, useDraggable } from "@dnd-kit/core"

import { FocusBlock, NotesBlock, TasksBlock } from "@/components/blocks"
import { useBlockDrag } from "@/hooks/useBlockDrag"
import { useBlocksStore } from "@/store/blocks.store"
import { useCanvasStore } from "@/store/canvas.store"

interface TransformLayerProps {
  transition: string | null
}

interface DraggableBlockProps {
  blockId: string
  selected: boolean
  isDragging: boolean
}

const DraggableBlock = memo(function DraggableBlock({
  blockId,
  selected,
  isDragging,
}: DraggableBlockProps) {
  const blockType = useBlocksStore((state) => state.blocks[blockId]?.type)
  const { attributes, listeners, setNodeRef } = useDraggable({ id: blockId })

  if (!blockType) {
    return null
  }

  const dragHandleProps = {
    ...(attributes as HTMLAttributes<HTMLDivElement>),
    ...(listeners as HTMLAttributes<HTMLDivElement>),
  }

  switch (blockType) {
    case "tasks":
      return (
        <div ref={setNodeRef}>
          <TasksBlock
            blockId={blockId}
            selected={selected}
            isDragging={isDragging}
            landed={false}
            dragHandleProps={dragHandleProps}
          />
        </div>
      )
    case "notes":
      return (
        <div ref={setNodeRef}>
          <NotesBlock
            blockId={blockId}
            selected={selected}
            isDragging={isDragging}
            landed={false}
            dragHandleProps={dragHandleProps}
          />
        </div>
      )
    case "focus":
      return (
        <div ref={setNodeRef}>
          <FocusBlock
            blockId={blockId}
            selected={selected}
            isDragging={isDragging}
            landed={false}
            dragHandleProps={dragHandleProps}
          />
        </div>
      )
    default:
      return null
  }
})

export const TransformLayer = memo(function TransformLayer({
  transition,
}: TransformLayerProps) {
  const blocksMap = useBlocksStore((state) => state.blocks)
  const selectedIds = useCanvasStore((state) => state.selectedIds)
  const offsetX = useCanvasStore((state) => state.offsetX)
  const offsetY = useCanvasStore((state) => state.offsetY)
  const zoom = useCanvasStore((state) => state.zoom)
  const {
    activeDragId,
    draggingIds,
    onDragStart,
    onDragMove,
    onDragEnd,
    onDragCancel,
  } = useBlockDrag()

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const blocks = useMemo(() => Object.values(blocksMap), [blocksMap])
  const sortedBlocks = useMemo(
    () => [...blocks].sort((a, b) => a.zIndex - b.zIndex),
    [blocks]
  )

  return (
    <DndContext
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div
        data-testid="transform-layer"
        className="absolute inset-0"
        style={{
          transform: `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`,
          transformOrigin: "0 0",
          willChange: "transform",
          transition: transition ?? undefined,
          pointerEvents: activeDragId ? "none" : "auto",
        }}
      >
        {sortedBlocks.map((block) => (
          <DraggableBlock
            key={block.id}
            blockId={block.id}
            selected={selectedIdSet.has(block.id)}
            isDragging={draggingIds.has(block.id)}
          />
        ))}
      </div>
    </DndContext>
  )
})
