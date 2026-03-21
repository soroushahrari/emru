import { useEffect, useRef } from "react"

import { MAX_NOTES_TEXT_LENGTH } from "@/lib/utils/block-sanitizers"
import { cn } from "@/lib/utils"

import {
  formatNoteCount,
  getNoteSaveLabel,
  type NoteSaveState,
} from "./notes-utils"
import { NotesPreview } from "./NotesPreview"

interface NotesContentProps {
  text: string
  isEditing: boolean
  saveState: NoteSaveState
  words: number
  characters: number
  density?: "micro" | "compact" | "regular"
  surface?: "block" | "modal"
  autoFocus?: boolean
  className?: string
  bodyClassName?: string
  footerClassName?: string
  onBeginEditing: () => void
  onEndEditing: () => void
  onChangeText: (text: string) => void
}

export function NotesContent({
  text,
  isEditing,
  saveState,
  words,
  characters,
  density = "regular",
  surface = "block",
  autoFocus = false,
  className,
  bodyClassName,
  footerClassName,
  onBeginEditing,
  onEndEditing,
  onChangeText,
}: NotesContentProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (!isEditing || !autoFocus) {
      return
    }

    const target = textareaRef.current
    if (!target) {
      return
    }

    target.focus()
    target.setSelectionRange(target.value.length, target.value.length)
  }, [autoFocus, isEditing])

  return (
    <div
      className={cn("flex min-h-0 flex-1 flex-col", className)}
      data-density={density}
      data-surface={surface}
    >
      <div
        className={cn("min-h-0 flex-1", bodyClassName)}
        data-canvas-scroll-lock="true"
        data-density={density}
        data-editing={isEditing ? "true" : "false"}
        data-surface={surface}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={text}
            placeholder="Start writing in Markdown."
            aria-label="Notes editor"
            spellCheck={false}
            maxLength={MAX_NOTES_TEXT_LENGTH}
            dir="auto"
            onBlur={onEndEditing}
            onChange={(event) => {
              onChangeText(event.target.value)
            }}
            className="notes-editor-shell h-full min-h-0 w-full resize-none bg-transparent"
          />
        ) : (
          <NotesPreview markdown={text} className="h-full" onClick={onBeginEditing} />
        )}
      </div>

      <div
        className={cn(
          "notes-footer flex min-w-0 items-center justify-between gap-3",
          footerClassName
        )}
        data-density={density}
        data-surface={surface}
      >
        <div
          className="notes-save-indicator min-w-0"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="notes-save-dot" aria-hidden="true" data-state={saveState} />
          <span className="truncate">{getNoteSaveLabel(saveState)}</span>
        </div>
        <div className="notes-counts text-right" dir="ltr">
          <span className="notes-count-chip">W {formatNoteCount(words)}</span>
          <span className="notes-count-separator" aria-hidden="true">
            ·
          </span>
          <span className="notes-count-chip">C {formatNoteCount(characters)}</span>
        </div>
      </div>
    </div>
  )
}
