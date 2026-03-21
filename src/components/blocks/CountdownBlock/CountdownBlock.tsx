import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
} from "react"

import { Button } from "@/components/ui/button"
import { useBlockResize } from "@/hooks/useBlockResize"
import { getBlockSizeBounds } from "@/lib/utils/block-sanitizers"
import { cn } from "@/lib/utils"

import { useCountdownBlock } from "./useCountdownBlock"

interface CountdownBlockProps {
  blockId: string
  selected: boolean
  isDragging: boolean
  landed: boolean
  dragHandleProps: HTMLAttributes<HTMLDivElement>
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
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

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        d="M7 4.75v2.5M17 4.75v2.5M5.75 9.25h12.5M7.25 6.25h9.5a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2h-9.5a2 2 0 0 1-2-2v-8.5a2 2 0 0 1 2-2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export const CountdownBlock = memo(function CountdownBlock({
  blockId,
  selected,
  isDragging,
  landed,
  dragHandleProps,
}: CountdownBlockProps) {
  const { block, snapshot, setLabel, setTargetDate } = useCountdownBlock(blockId)
  const { resizeHandleProps } = useBlockResize(blockId)
  const [isEditingLabel, setIsEditingLabel] = useState(false)
  const [isEditingDate, setIsEditingDate] = useState(false)
  const [labelDraft, setLabelDraft] = useState("")
  const labelInputRef = useRef<HTMLInputElement | null>(null)
  const dateInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!block) {
      return
    }

    setLabelDraft(block.data.label)
    setIsEditingLabel(false)
    setIsEditingDate(false)
  }, [block?.id])

  useEffect(() => {
    if (!block || isEditingLabel) {
      return
    }

    setLabelDraft(block.data.label)
  }, [block, isEditingLabel])

  useEffect(() => {
    if (!isEditingLabel) {
      return
    }

    labelInputRef.current?.focus()
    labelInputRef.current?.select()
  }, [isEditingLabel])

  useEffect(() => {
    if (!isEditingDate) {
      return
    }

    dateInputRef.current?.focus()
    dateInputRef.current?.showPicker?.()
  }, [isEditingDate])

  const layout = useMemo(() => {
    if (!block) {
      return null
    }

    return {
      horizontalPadding: clamp(14 + (block.width - 200) / 14, 14, 28),
      verticalPadding: clamp(10 + (block.height - 220) / 14, 10, 28),
      heroFontSize: clamp(
        Math.round(Math.min(block.width * 0.36, block.height * 0.39)),
        56,
        72
      ),
    }
  }, [block])

  if (!block || !layout) {
    return null
  }

  const sizeBounds = getBlockSizeBounds(block.type)
  const isCompact = block.width < 220 || block.height < 220

  function commitLabel() {
    setLabel(labelDraft)
    setIsEditingLabel(false)
  }

  return (
    <article
      className={cn(
        "canvas-block-shell group/countdown absolute flex min-w-0 flex-col overflow-hidden rounded-2xl bg-card shadow-[0_6px_20px_rgba(0,0,0,0.16)]",
        "select-none countdown-block-enter",
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
        padding: "12px",
      }}
    >
      <header className="mb-3 flex min-w-0 items-center justify-between gap-3 rounded-lg bg-secondary/80 px-2.5 py-1.5 text-xs uppercase tracking-wide text-muted-foreground">
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
          <span className="canvas-block-title min-w-0 truncate normal-case text-foreground">
            Countdown
          </span>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="countdown-header-action rounded-full text-muted-foreground"
          aria-label="Edit countdown date"
          onClick={() => {
            setIsEditingDate(true)
          }}
        >
          <IconCalendar />
        </Button>
      </header>

      <div
        className="relative flex min-h-0 flex-1 flex-col items-center justify-center text-center"
        style={{
          paddingInline: `${layout.horizontalPadding}px`,
          paddingBlock: `${layout.verticalPadding}px`,
        }}
      >
        {snapshot.mode === "empty" ? (
          <div className="countdown-edit-fade flex w-full max-w-[12rem] flex-col items-center gap-3">
            <p className="countdown-empty-label text-muted-foreground/80">set a date</p>
            <input
              ref={dateInputRef}
              type="date"
              aria-label="Countdown date"
              value={block.data.targetDate ?? ""}
              onChange={(event) => {
                setTargetDate(event.target.value || null)
                setIsEditingDate(false)
              }}
              className="countdown-date-input w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
            />
          </div>
        ) : (
          <div className="countdown-edit-fade flex w-full flex-col items-center justify-center gap-2">
            <div className="min-h-[1.75rem]">
              {isEditingLabel ? (
                <input
                  ref={labelInputRef}
                  aria-label="Countdown label"
                  value={labelDraft}
                  onChange={(event) => {
                    setLabelDraft(event.target.value)
                  }}
                  onBlur={commitLabel}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      commitLabel()
                    }

                    if (event.key === "Escape") {
                      event.preventDefault()
                      setLabelDraft(block.data.label)
                      setIsEditingLabel(false)
                    }
                  }}
                  className="countdown-label-input w-full min-w-0 bg-transparent text-center outline-none"
                />
              ) : (
                <button
                  type="button"
                  className="countdown-label-display min-w-0"
                  aria-label="Edit countdown label"
                  onClick={() => {
                    setIsEditingLabel(true)
                  }}
                >
                  {block.data.label}
                </button>
              )}
            </div>

            {isEditingDate ? (
              <input
                ref={dateInputRef}
                type="date"
                aria-label="Countdown date"
                value={block.data.targetDate ?? ""}
                onBlur={() => {
                  setIsEditingDate(false)
                }}
                onChange={(event) => {
                  setTargetDate(event.target.value || null)
                  setIsEditingDate(false)
                }}
                className="countdown-date-input rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
              />
            ) : snapshot.mode === "today" ? (
              <button
                type="button"
                className="countdown-date-trigger flex flex-col items-center gap-1"
                aria-label="Edit countdown date"
                onClick={() => {
                  setIsEditingDate(true)
                }}
              >
                <span
                  className="countdown-today text-[1.1rem] font-semibold lowercase"
                  style={{ color: "var(--dawn)" }}
                >
                  today
                </span>
              </button>
            ) : snapshot.mode === "past" ? (
              <button
                type="button"
                className="countdown-date-trigger flex flex-col items-center gap-1"
                aria-label="Edit countdown date"
                onClick={() => {
                  setIsEditingDate(true)
                }}
              >
                <span className="text-sm text-muted-foreground">{snapshot.pastLabel}</span>
              </button>
            ) : (
              <button
                type="button"
                className="countdown-date-trigger flex flex-col items-center gap-2"
                aria-label="Edit countdown date"
                onClick={() => {
                  setIsEditingDate(true)
                }}
              >
                <span
                  className="leading-none text-foreground"
                  style={{
                    fontFamily: "inherit",
                    fontSize: `${layout.heroFontSize}px`,
                    fontWeight: 700,
                    letterSpacing: "-3px",
                    lineHeight: 1,
                  }}
                >
                  {snapshot.value}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground/75",
                    isCompact && "tracking-[0.14em]"
                  )}
                >
                  {snapshot.unit}
                </span>
                <span className="flex items-center justify-center gap-2">
                  {Array.from({ length: 5 }, (_, index) => (
                    <span
                      key={index}
                      data-testid="countdown-dot"
                      className={cn(
                        "countdown-dot",
                        index < snapshot.activeDots && "countdown-dot-active"
                      )}
                    />
                  ))}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      <div
        className="resize-grip absolute bottom-1 right-1 h-5 w-5 cursor-se-resize"
        data-visible={selected ? "true" : undefined}
        {...resizeHandleProps}
      />
    </article>
  )
})
