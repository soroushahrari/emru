import { memo, useEffect, useRef, useState, type HTMLAttributes } from "react"
import { SlidersHorizontalIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@/components/ui/button"
import { useBlockResize } from "@/hooks/useBlockResize"
import { getBlockSizeBounds } from "@/lib/utils/block-sanitizers"
import {
  MAX_FOCUS_MINUTES,
  MIN_FOCUS_MINUTES,
} from "@/lib/utils/focus-timer"
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

function getAutoRestMinutes(focusMinutes: number) {
  return Math.min(MAX_FOCUS_MINUTES, Math.max(3, Math.round(focusMinutes / 5)))
}

interface SessionLengthControlProps {
  focusValue: number
  disabled: boolean
  onChange: (focusMinutes: number) => void
}

function SessionLengthControl({
  focusValue,
  disabled,
  onChange,
}: SessionLengthControlProps) {
  const autoRest = getAutoRestMinutes(focusValue)

  return (
    <div className="canvas-block-inset focus-session-control rounded-lg px-2.5 py-2">
      <div className="mb-1 flex min-w-0 items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="truncate font-medium text-foreground/88">Session length</span>
        <span className="min-w-0 text-right font-sans text-[11px] tabular-nums normal-case text-foreground [overflow-wrap:anywhere]">
          {focusValue}m / auto break {autoRest}m
        </span>
      </div>
      <input
        type="range"
        min={MIN_FOCUS_MINUTES}
        max={MAX_FOCUS_MINUTES}
        step={1}
        value={focusValue}
        disabled={disabled}
        onChange={(event) => {
          const next = Number.parseInt(event.target.value, 10)
          if (!Number.isFinite(next)) {
            return
          }

          onChange(next)
        }}
        aria-label="Session length"
        className="focus-session-slider h-4 w-full"
      />
    </div>
  )
}

interface FocusClockProps {
  clock: string
  fontSize: number
}

function FocusClock({ clock, fontSize }: FocusClockProps) {
  return (
    <div
      className="focus-clock-shell font-sans tabular-nums font-medium text-foreground"
      style={{
        fontSize: `${fontSize}px`,
        lineHeight: 0.94,
        letterSpacing: "-0.04em",
      }}
      dir="ltr"
      aria-live="off"
    >
      {clock}
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
  const [isSettingsView, setIsSettingsView] = useState(false)
  const [sessionIndex, setSessionIndex] = useState(0)
  const previousPhaseRef = useRef<"focus" | "rest" | null>(null)
  const previousStatusRef = useRef<"idle" | "running" | "paused" | null>(null)
  const {
    block,
    clock,
    progress,
    isRunning,
    toggleRunning,
    restart,
    setDurations,
  } = useFocusBlock(blockId)
  const { resizeHandleProps } = useBlockResize(blockId)

  useEffect(() => {
    setIsSettingsView(false)
    setSessionIndex(0)
    previousPhaseRef.current = null
    previousStatusRef.current = null
  }, [blockId])

  useEffect(() => {
    if (!block) {
      return
    }

    if (previousPhaseRef.current === null || previousStatusRef.current === null) {
      previousPhaseRef.current = block.data.phase
      previousStatusRef.current = block.data.status
      return
    }

    const phaseChanged = previousPhaseRef.current !== block.data.phase
    const completedRun =
      previousStatusRef.current === "running" &&
      block.data.status === "idle" &&
      phaseChanged

    if (completedRun) {
      setSessionIndex((value) => (value + 1) % 4)
    }

    previousPhaseRef.current = block.data.phase
    previousStatusRef.current = block.data.status
  }, [block?.data.phase, block?.data.status])

  if (!block) {
    return null
  }

  const sizeBounds = getBlockSizeBounds(block.type)
  const phaseToken = "var(--primary)"
  const progressPercent = Math.max(0, Math.min(100, progress * 100))
  const shortSide = Math.min(block.width, block.height)
  const isCompact = shortSide < 360
  const isTight = shortSide < 320
  const isMicro = shortSide < 290
  const autoRest = getAutoRestMinutes(block.data.focusMinutes)
  const progressScale = Math.max(0, Math.min(1, progressPercent / 100))
  const isOrbLarge = block.width >= 390 && block.height >= 360
  const isOrbMedium = block.width >= 330 && block.height >= 312
  const isOrbCompact = block.width >= 290 && block.height >= 252
  const orbBaseSize = isOrbLarge ? 214 : isOrbMedium ? 188 : isOrbCompact ? 160 : 138
  const orbWidthLimit = Math.max(118, block.width - (isMicro ? 108 : isTight ? 114 : 126))
  const orbHeightLimit = Math.max(118, block.height - (isMicro ? 142 : isTight ? 152 : 166))
  const orbSize = Math.min(orbBaseSize, orbWidthLimit, orbHeightLimit)
  const progressRadius = 106
  const progressStroke = isOrbLarge ? 4.25 : isOrbMedium ? 4 : 3.5
  const progressCircumference = 2 * Math.PI * progressRadius
  const progressOffset = progressCircumference * (1 - progressScale)
  const clockFontSize = Math.max(28, Math.min(50, Math.round(orbSize * 0.23)))
  const sessionSteps = 4
  const activeSteps = Math.max(1, Math.min(sessionSteps, sessionIndex + 1))
  const secondaryButtonSize = isMicro ? "icon-sm" : "icon"
  const primaryButtonSize = isMicro ? "icon-sm" : isTight ? "icon" : "icon-lg"
  const bodyGap = isMicro ? "gap-1.5" : isTight ? "gap-2" : isCompact ? "gap-3" : "gap-4"
  const controlGap = isMicro ? "gap-2" : isTight ? "gap-3" : "gap-4"
  const headerMargin = isMicro ? "mb-2" : isCompact ? "mb-2.5" : "mb-3.5"
  const settingsColumnWidth = isMicro ? "max-w-full" : isTight ? "max-w-[13rem]" : "max-w-[14.5rem]"
  const settingsGap = isTight ? "gap-2" : "gap-3"
  const clockInset =
    orbSize >= 200
      ? "1rem"
      : orbSize >= 176
        ? "0.9rem"
        : orbSize >= 148
          ? "0.8rem"
          : "0.68rem"
  const timerSpacing = isMicro ? "gap-1.5" : isTight ? "gap-2.5" : "gap-4"
  const shellPadding = isMicro ? "p-2.5" : "p-3"
  const headerChrome = isMicro ? "px-2 py-1" : "px-2.5 py-1.5"
  const controlPadding = isMicro ? "px-1 pb-0.5 pt-0" : "px-2 pb-1 pt-1"

  return (
    <article
      className={cn(
        "canvas-block-shell absolute flex min-w-0 flex-col overflow-hidden rounded-2xl bg-card shadow-[0_6px_20px_rgba(0,0,0,0.16)]",
        shellPadding,
        "canvas-block-enter select-none",
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
      }}
    >
      <header
        className={cn(
          headerMargin,
          "flex min-w-0 items-center justify-between gap-3 rounded-lg bg-secondary/80 text-xs uppercase tracking-wide text-muted-foreground",
          headerChrome,
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        {...dragHandleProps}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="focus-grip inline-flex items-center justify-center rounded-full">
            <IconGrip />
          </span>
          <span
            className="canvas-block-title truncate normal-case text-foreground [overflow-wrap:anywhere]"
            dir="auto"
          >
            Focus
          </span>
        </div>
      </header>

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          bodyGap
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          {isSettingsView ? (
            <div className={cn("focus-settings-scroll mx-auto flex min-h-0 w-full flex-1 flex-col overflow-auto pr-1", settingsColumnWidth, settingsGap)}>
              {!isMicro ? (
                <div className="px-1 text-xs font-medium text-muted-foreground">
                  Timer settings
                </div>
              ) : null}

              <SessionLengthControl
                focusValue={block.data.focusMinutes}
                disabled={isRunning}
                onChange={(focusMinutes) => {
                  setSessionIndex(0)
                  setDurations(focusMinutes, getAutoRestMinutes(focusMinutes))
                }}
              />
              {!isMicro ? (
                <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/88">Break</span>
                  <span className="font-sans tabular-nums text-foreground/90">
                    Auto {autoRest}m
                  </span>
                </div>
              ) : null}
            </div>
          ) : (
            <div
              className={cn(
                "flex min-h-0 flex-1 flex-col items-center justify-center",
                timerSpacing
              )}
            >
              <div
                className={cn(
                  "focus-orb relative mx-auto flex shrink-0 flex-col items-center justify-center"
                )}
                style={{ width: orbSize, height: orbSize }}
              >
                <svg
                  viewBox="0 0 240 240"
                  className="absolute inset-0 h-full w-full -rotate-90"
                  aria-hidden="true"
                >
                  <circle
                    cx="120"
                    cy="120"
                    r={progressRadius}
                    className="focus-orb-track"
                    strokeWidth={progressStroke}
                    fill="none"
                  />
                  <circle
                    cx="120"
                    cy="120"
                    r={progressRadius}
                    className="focus-orb-progress"
                    strokeWidth={progressStroke}
                    strokeDasharray={progressCircumference}
                    strokeDashoffset={progressOffset}
                    fill="none"
                    style={{
                      stroke: `color-mix(in oklab, ${phaseToken} 84%, white 10%)`,
                    }}
                  />
                </svg>

                <div
                  className="focus-orb-inner absolute flex flex-col items-center justify-center rounded-full"
                  style={{ inset: clockInset }}
                >
                  <FocusClock clock={clock} fontSize={clockFontSize} />
                  <div
                    className={cn("focus-session-indicator", isOrbCompact ? "mt-2.5" : "mt-2")}
                    role="status"
                    aria-label={`Session progress ${activeSteps} of ${sessionSteps}`}
                  >
                    <div className="focus-session-dots">
                      {Array.from({ length: sessionSteps }, (_, index) => (
                        <span
                          key={index}
                          className="focus-style-dot"
                          data-active={index < activeSteps}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          className={cn(
            "focus-control-row mt-auto flex w-full items-center justify-center",
            controlPadding,
            controlGap
          )}
        >
          <Button
            type="button"
            variant="ghost"
            size={secondaryButtonSize}
            className="focus-tap-target focus-control-button focus-control-button-secondary rounded-full"
            onClick={() => {
              setSessionIndex(0)
              restart()
            }}
            aria-label="Reset timer"
          >
            <IconReset />
          </Button>
          <Button
            type="button"
            variant="default"
            size={primaryButtonSize}
            className="focus-tap-target focus-control-button rounded-full"
            onClick={toggleRunning}
            aria-label={isRunning ? "Pause timer" : "Start timer"}
          >
            {isRunning ? <IconPause /> : <IconPlay />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size={secondaryButtonSize}
            className={cn(
              "focus-tap-target focus-control-button focus-control-button-secondary rounded-full",
              isSettingsView && "bg-secondary text-foreground"
            )}
            onClick={() => {
              setIsSettingsView((current) => !current)
            }}
            aria-label={isSettingsView ? "Close settings" : "Open settings"}
            aria-pressed={isSettingsView}
          >
            <HugeiconsIcon
              icon={SlidersHorizontalIcon}
              size={16}
              strokeWidth={1.7}
              className="size-4"
              aria-hidden="true"
            />
          </Button>
        </div>
      </div>

      <div
        className="resize-grip absolute right-1 bottom-1 h-5 w-5 cursor-se-resize"
        data-visible={selected ? "true" : undefined}
        {...resizeHandleProps}
      />
    </article>
  )
})
