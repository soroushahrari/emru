import {
  memo,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react"
import { Settings01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { BlockType } from "@/types/block.types"
import type { CanvasTool } from "@/types/canvas.types"

interface ToolbarProps {
  tool: CanvasTool
  onSelectTool: () => void
  onPanTool: () => void
  onAddBlock: (type: BlockType) => void
  disableFocusAdd: boolean
  onToggleSettings: () => void
  settingsOpen: boolean
}

interface TooltipIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  shortcut?: string
  active?: boolean
  children: ReactNode
}

function TooltipIconButton({
  label,
  shortcut,
  active,
  className,
  children,
  ...props
}: TooltipIconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "grid h-10 w-10 place-items-center rounded-xl text-foreground/85 transition-[transform,background-color,color,box-shadow] duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]",
            active
              ? "bg-primary/12 shadow-[0_0_0_1px_rgba(212,105,42,0.18)_inset,0_6px_14px_rgba(212,105,42,0.14)]"
              : "bg-card",
            className
          )}
          aria-label={label}
          {...props}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="flex items-center gap-2">
        <span>{label}</span>
        {shortcut ? <span className="opacity-70">{shortcut}</span> : null}
      </TooltipContent>
    </Tooltip>
  )
}

export const Toolbar = memo(function Toolbar({
  tool,
  onSelectTool,
  onPanTool,
  onAddBlock,
  disableFocusAdd,
  onToggleSettings,
  settingsOpen,
}: ToolbarProps) {
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const addMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!addMenuOpen) {
      return
    }

    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof HTMLElement)) {
        return
      }

      if (addMenuRef.current?.contains(target)) {
        return
      }

      setAddMenuOpen(false)
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAddMenuOpen(false)
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer)
    document.addEventListener("keydown", closeOnEscape)

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [addMenuOpen])

  const iconStroke = "currentColor"

  return (
    <header className="canvas-overlay-enter canvas-overlay-delay-toolbar pointer-events-auto fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-card/94 px-2 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.2)] backdrop-blur-md">
      <div className="flex items-center gap-1 rounded-xl bg-secondary/35 px-1 py-1">
        <TooltipIconButton
          label="Select"
          shortcut="V"
          active={tool === "select"}
          onClick={onSelectTool}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              d="m5 4 6 16 2.2-6.2L20 11 5 4Z"
              fill="none"
              stroke={iconStroke}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        </TooltipIconButton>

        <TooltipIconButton
          label="Pan"
          shortcut="H / Space"
          active={tool === "pan"}
          onClick={onPanTool}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              d="M6.5 12.5V8.2a1.4 1.4 0 1 1 2.8 0v2.8m0-.8V6.3a1.4 1.4 0 1 1 2.8 0v3.9m0-.8V7.2a1.4 1.4 0 1 1 2.8 0v3.6m0-.7V8.6a1.4 1.4 0 1 1 2.8 0v5.3c0 3.4-2.8 6.1-6.1 6.1h-.6c-2.7 0-4.8-2.1-4.8-4.8v-2.7a1.4 1.4 0 0 1 2.8 0"
              fill="none"
              stroke={iconStroke}
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </TooltipIconButton>
      </div>

      <div ref={addMenuRef} className="relative">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Add block"
              aria-haspopup="menu"
              aria-expanded={addMenuOpen}
              className={cn(
                "grid h-10 w-10 place-items-center rounded-xl text-foreground/85 transition-[transform,background-color,color,box-shadow] duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]",
                addMenuOpen
                  ? "bg-primary/12 shadow-[0_0_0_1px_rgba(212,105,42,0.18)_inset,0_6px_14px_rgba(212,105,42,0.14)]"
                  : "bg-secondary/35"
              )}
              onClick={() => {
                setAddMenuOpen((open) => !open)
              }}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M12 5v14M5 12h14"
                  fill="none"
                  stroke={iconStroke}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="flex items-center gap-2">
            <span>Add block</span>
            <span className="opacity-70">T / N / C / F</span>
          </TooltipContent>
        </Tooltip>
        <div
          className={cn(
            "absolute bottom-[3.25rem] left-1/2 z-50 w-40 -translate-x-1/2 rounded-xl bg-card/98 p-1.5 shadow-[0_12px_24px_rgba(0,0,0,0.22)]",
            "origin-bottom transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
            addMenuOpen
              ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
              : "pointer-events-none translate-y-1 scale-95 opacity-0"
          )}
          role="menu"
          aria-label="Add block menu"
        >
          <button
            type="button"
            className="canvas-menu-item flex w-full min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-secondary/70"
            onClick={() => {
              onAddBlock("tasks")
              setAddMenuOpen(false)
            }}
            role="menuitem"
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary/70" />
            Tasks
          </button>
          <button
            type="button"
            className="canvas-menu-item flex w-full min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-secondary/70"
            onClick={() => {
              onAddBlock("notes")
              setAddMenuOpen(false)
            }}
            role="menuitem"
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-foreground/50" />
            Notes
          </button>
          <button
            type="button"
            className="canvas-menu-item flex w-full min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-secondary/70"
            onClick={() => {
              onAddBlock("countdown")
              setAddMenuOpen(false)
            }}
            role="menuitem"
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500/80" />
            Countdown
          </button>
          <button
            type="button"
            disabled={disableFocusAdd}
            className={cn(
              "canvas-menu-item flex w-full min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors",
              disableFocusAdd
                ? "cursor-not-allowed text-muted-foreground/80"
                : "hover:bg-secondary/70"
            )}
            onClick={() => {
              onAddBlock("focus")
              setAddMenuOpen(false)
            }}
            role="menuitem"
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent/80" />
            {disableFocusAdd ? "Focus (already added)" : "Focus"}
          </button>
        </div>
      </div>

      <TooltipIconButton
        label="Settings"
        active={settingsOpen}
        className={!settingsOpen ? "bg-secondary/35" : undefined}
        onClick={onToggleSettings}
      >
        <HugeiconsIcon
          icon={Settings01Icon}
          size={20}
          strokeWidth={1.6}
          className="h-5 w-5"
          aria-hidden="true"
        />
      </TooltipIconButton>
    </header>
  )
})
