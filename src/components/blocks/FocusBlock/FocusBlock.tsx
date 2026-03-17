import { memo, useState, type HTMLAttributes } from "react"

import { Button } from "@/components/ui/button"
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

function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path d="M8 6.4 18 12 8 17.6Z" fill="currentColor" />
    </svg>
  )
}

function IconPause() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <rect x="7" y="6" width="3.5" height="12" rx="1" fill="currentColor" />
      <rect x="13.5" y="6" width="3.5" height="12" rx="1" fill="currentColor" />
    </svg>
  )
}

function IconReset() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        d="M18.2 10.4A6.8 6.8 0 1 0 19 13h-2.1a4.7 4.7 0 1 1-.8-2.6l-2.2 2.2H20V6.6Z"
        fill="currentColor"
      />
    </svg>
  )
}

function IconSliders() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        d="M6 5v14M18 5v14M12 5v14M4 9h4m8-4h4m-10 9h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden="true">
      <path
        d="M12 6v12M6 12h12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconMinus() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden="true">
      <path
        d="M6 12h12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

interface DurationMiniProps {
  label: string
  value: number
  disabled: boolean
  onDecrease: () => void
  onIncrease: () => void
}

function DurationMini({
  label,
  value,
  disabled,
  onDecrease,
  onIncrease,
}: DurationMiniProps) {
  return (
    <div className="flex min-w-0 items-center gap-1 rounded-full border border-border/55 bg-secondary/55 px-1 py-1">
      <span className="w-4 text-center text-[10px] font-medium text-muted-foreground uppercase">
        {label}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="focus-stepper-button rounded-full"
        disabled={disabled}
        onClick={onDecrease}
        aria-label={`Decrease ${label} duration`}
      >
        <IconMinus />
      </Button>
      <span className="min-w-8 text-center font-mono text-sm tabular-nums">
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="focus-stepper-button rounded-full"
        disabled={disabled}
        onClick={onIncrease}
        aria-label={`Increase ${label} duration`}
      >
        <IconPlus />
      </Button>
    </div>
  )
}

export const FocusBlock = memo(function FocusBlock({
  blockId,
  selected,
  isDragging,
  landed,
  dragHandleProps,
}: FocusBlockProps) {
  const {
    block,
    clock,
    progress,
    isRunning,
    toggleRunning,
    restart,
    setFocusMinutes,
    setRestMinutes,
  } = useFocusBlock(blockId)
  const { resizeHandleProps } = useBlockResize(blockId)
  const [showTimerControls, setShowTimerControls] = useState(false)

  if (!block) {
    return null
  }

  const isFocusPhase = block.data.phase === "focus"
  const phaseToken = isFocusPhase ? "var(--primary)" : "var(--accent)"
  const progressPercent = Math.max(0, Math.min(100, progress * 100))
  const canShowTimerControls = block.height >= 270 && block.width >= 270
  const showDurationPanel = showTimerControls && canShowTimerControls

  const reservedHeight = showDurationPanel ? 164 : 112
  const heightLimit = block.height - reservedHeight
  const widthLimit = block.width - 52
  const ringSize = Math.max(
    96,
    Math.min(196, Math.floor(Math.min(heightLimit, widthLimit)))
  )

  const ringBackground = `conic-gradient(color-mix(in oklab, ${phaseToken} 82%, var(--foreground)) ${progressPercent}%, color-mix(in oklab, var(--muted) 90%, transparent) ${progressPercent}%)`

  return (
    <article
      className={cn(
        "absolute min-w-0 overflow-hidden rounded-2xl bg-card/98 p-3 shadow-[0_8px_24px_rgba(0,0,0,0.16)]",
        "canvas-block-enter select-none",
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
          "mb-2 flex min-w-0 items-center justify-between rounded-full bg-secondary/72 px-2.5 py-1 text-[11px]",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        {...dragHandleProps}
      >
        <span
          className="truncate [overflow-wrap:anywhere] text-muted-foreground"
          dir="auto"
        >
          {block.data.title}
        </span>
        <span
          className="inline-flex h-5 min-w-8 items-center justify-center rounded-full border px-1.5 text-[10px] font-medium uppercase"
          style={{
            borderColor: `color-mix(in oklab, ${phaseToken} 38%, var(--border))`,
            color: `color-mix(in oklab, ${phaseToken} 74%, var(--foreground))`,
            backgroundColor: `color-mix(in oklab, ${phaseToken} 15%, transparent)`,
          }}
        >
          {isFocusPhase ? "f" : "r"}
        </span>
      </header>

      <div className="flex h-[calc(100%-34px)] min-h-0 flex-col items-center justify-between gap-3">
        <div className="grid min-h-0 flex-1 place-items-center">
          <div
            className="relative grid place-items-center rounded-full p-[3px]"
            style={{
              width: ringSize,
              height: ringSize,
              background: ringBackground,
            }}
          >
            <div
              className="absolute -inset-2 rounded-full opacity-40 blur-[10px]"
              style={{
                background: `radial-gradient(circle, color-mix(in oklab, ${phaseToken} 26%, transparent) 0%, transparent 72%)`,
              }}
            />
            <div className="absolute inset-[3px] rounded-full bg-card" />
            <div
              className="relative text-center font-mono tabular-nums"
              style={{
                fontSize: `clamp(1.6rem, ${ringSize / 6.2}px, 2.25rem)`,
              }}
              dir="ltr"
            >
              {clock}
            </div>
          </div>
        </div>

        <div className="flex w-full items-center justify-center gap-2">
          <Button
            type="button"
            size="icon"
            className="focus-tap-target rounded-full"
            onClick={toggleRunning}
            aria-label={isRunning ? "Pause focus timer" : "Start focus timer"}
          >
            {isRunning ? <IconPause /> : <IconPlay />}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="focus-tap-target rounded-full"
            onClick={restart}
            aria-label="Reset timer"
          >
            <IconReset />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="focus-tap-target rounded-full"
            disabled={!canShowTimerControls}
            onClick={() => {
              setShowTimerControls((value) => !value)
            }}
            aria-label="Toggle duration controls"
            aria-pressed={showDurationPanel}
          >
            <IconSliders />
          </Button>
        </div>

        {showDurationPanel ? (
          <div className="flex w-full items-center justify-center gap-2">
            <DurationMini
              label="f"
              value={block.data.focusMinutes}
              disabled={isRunning}
              onDecrease={() => {
                setFocusMinutes(block.data.focusMinutes - 1)
              }}
              onIncrease={() => {
                setFocusMinutes(block.data.focusMinutes + 1)
              }}
            />
            <DurationMini
              label="r"
              value={block.data.restMinutes}
              disabled={isRunning}
              onDecrease={() => {
                setRestMinutes(block.data.restMinutes - 1)
              }}
              onIncrease={() => {
                setRestMinutes(block.data.restMinutes + 1)
              }}
            />
          </div>
        ) : null}
      </div>

      <div
        className="resize-grip absolute right-1 bottom-1 h-5 w-5 cursor-se-resize"
        {...resizeHandleProps}
      />
    </article>
  )
})
