import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type CSSProperties,
} from "react"
import { LayoutGroup, motion } from "motion/react"

import { Button } from "@/components/ui/button"
import { useBlockResize } from "@/hooks/useBlockResize"
import {
  MAX_NOTES_TEXT_LENGTH,
  getBlockSizeBounds,
} from "@/lib/utils/block-sanitizers"
import { cn } from "@/lib/utils"

import { NotesContent } from "./NotesContent"
import { NotesModal } from "./NotesModal"
import { getNoteCounts, type NoteSaveState } from "./notes-utils"
import { useNotesBlock } from "./useNotesBlock"

interface NotesBlockProps {
  blockId: string
  selected: boolean
  isDragging: boolean
  landed: boolean
  dragHandleProps: HTMLAttributes<HTMLDivElement>
}

function IconGrip() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <circle cx="8" cy="8" r="1.15" fill="currentColor" />
      <circle cx="8" cy="12" r="1.15" fill="currentColor" />
      <circle cx="8" cy="16" r="1.15" fill="currentColor" />
      <circle cx="12" cy="8" r="1.15" fill="currentColor" />
      <circle cx="12" cy="12" r="1.15" fill="currentColor" />
      <circle cx="12" cy="16" r="1.15" fill="currentColor" />
    </svg>
  )
}

function IconExpand() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        d="M14 5h5v5M19 5l-6.3 6.3M10 19H5v-5M5 19l6.3-6.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
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
  const [isEditingInline, setIsEditingInline] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isModalEditing, setIsModalEditing] = useState(false)
  const [saveState, setSaveState] = useState<NoteSaveState>("autosaved")
  const saveTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    setIsEditingInline(false)
    setIsModalOpen(false)
    setIsModalEditing(false)
    setSaveState("autosaved")
  }, [blockId])

  if (!block) {
    return null
  }

  const sizeBounds = getBlockSizeBounds(block.type)
  const isMicro = block.width < 300 || block.height < 220
  const isCompact = isMicro || block.width < 360 || block.height < 280
  const density = isMicro ? "micro" : isCompact ? "compact" : "regular"
  const displayTitle = block.data.title === "notes" ? "Notes" : block.data.title
  const counts = useMemo(() => getNoteCounts(block.data.text), [block.data.text])
  const headerMargin = isMicro ? "mb-2" : isCompact ? "mb-2.5" : "mb-3"
  const shellPadding = isMicro ? "p-2.5" : isCompact ? "p-2.5" : "p-3"
  const headerChrome = isMicro ? "px-2 py-1" : isCompact ? "px-2.5 py-1.25" : "px-2.5 py-1.5"
  const notesLayoutId = `notes-shell-${blockId}`

  function updateText(nextText: string) {
    setSaveState("saving")
    setText(nextText.slice(0, MAX_NOTES_TEXT_LENGTH))

    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      setSaveState("autosaved")
      saveTimeoutRef.current = null
    }, 420)
  }

  return (
    <LayoutGroup id={`notes-layout-${blockId}`}>
      <motion.article
        layoutId={notesLayoutId}
        transition={{
          duration: 0.42,
          ease: [0.22, 1, 0.36, 1],
        }}
        className={cn(
          "canvas-block-shell absolute flex min-w-0 flex-col overflow-hidden rounded-2xl bg-card shadow-[0_6px_20px_rgba(0,0,0,0.16)]",
          shellPadding,
          "select-none canvas-block-enter",
          landed && "canvas-drag-landed"
        )}
        style={{
          left: block.x,
          top: block.y,
          width: block.width,
          height: block.height,
          minWidth: sizeBounds.minWidth,
          minHeight: sizeBounds.minHeight,
          maxWidth: sizeBounds.maxWidth,
          maxHeight: sizeBounds.maxHeight,
          zIndex: block.zIndex,
          outline: selected ? "1.5px solid rgba(212, 105, 42, 0.7)" : "none",
          outlineOffset: selected ? "1px" : "0",
          boxShadow: isDragging
            ? "0 0 0 0.5px rgba(0,0,0,0.14), 0 8px 32px rgba(0,0,0,0.14)"
            : undefined,
          willChange: isDragging ? "transform" : undefined,
        } satisfies CSSProperties}
      >
        <header
          className={cn(
            headerMargin,
            "flex min-w-0 items-center justify-between gap-3 rounded-lg bg-secondary/80 text-xs uppercase tracking-wide text-muted-foreground",
            headerChrome
          )}
        >
          <div
            className={cn(
              "flex min-w-0 items-center gap-2",
              isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            {...dragHandleProps}
          >
            <span className="focus-grip inline-flex items-center justify-center rounded-full">
              <IconGrip />
            </span>
            <span
              className="canvas-block-title min-w-0 truncate normal-case text-foreground [overflow-wrap:anywhere]"
              dir="auto"
            >
              {displayTitle}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size={isMicro ? "icon-sm" : "icon"}
            className="notes-expand-button rounded-full text-muted-foreground"
            aria-label="Open note in focus mode"
            onClick={() => {
              setIsEditingInline(false)
              setIsModalOpen(true)
            }}
          >
            <IconExpand />
          </Button>
        </header>

        <div className="notes-card-frame flex min-h-0 flex-1 flex-col">
          <NotesContent
            text={block.data.text}
            isEditing={isEditingInline}
            saveState={saveState}
            words={counts.words}
            characters={counts.characters}
            density={density}
            surface="block"
            autoFocus={isEditingInline}
            bodyClassName="notes-body-surface"
            onBeginEditing={() => {
              setIsModalOpen(false)
              setIsModalEditing(false)
              setIsEditingInline(true)
            }}
            onEndEditing={() => {
              setIsEditingInline(false)
            }}
            onChangeText={updateText}
          />
        </div>

        <div
          className="resize-grip absolute bottom-1 right-1 h-5 w-5 cursor-se-resize"
          data-visible={selected ? "true" : undefined}
          {...resizeHandleProps}
        />
      </motion.article>

      <NotesModal
        open={isModalOpen}
        title={displayTitle}
        text={block.data.text}
        isEditing={isModalEditing}
        layoutId={notesLayoutId}
        saveState={saveState}
        words={counts.words}
        characters={counts.characters}
        density="regular"
        onOpenChange={(open) => {
          setIsModalOpen(open)
          if (!open) {
            setIsModalEditing(false)
          }
        }}
        onBeginEditing={() => {
          setIsModalEditing(true)
        }}
        onEndEditing={() => {
          setIsModalEditing(false)
        }}
        onChangeText={updateText}
      />
    </LayoutGroup>
  )
})
