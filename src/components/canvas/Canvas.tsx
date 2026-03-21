import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEventHandler,
} from "react"

import { useCanvasGestures } from "@/hooks/useCanvasGestures"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import {
  blockIntersectsRect,
  getBlocksBoundingBox,
  getFitTransform,
  normalizeScreenRect,
  toCanvas,
  toCanvasRect,
} from "@/lib/utils/canvas.utils"
import { createBlockId, getBlockSizeBounds } from "@/lib/utils/block-sanitizers"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"
import { useBlocksStore } from "@/store/blocks.store"
import { useCanvasStore } from "@/store/canvas.store"
import type { Block, BlockType } from "@/types/block.types"
import type { ScreenRect } from "@/types/canvas.types"
import { Toolbar } from "@/components/toolbar"

import { Minimap } from "./Minimap"
import { SelectionRect } from "./SelectionRect"
import { TransformLayer } from "./TransformLayer"
import { ZoomControls } from "./ZoomControls"

const FIT_TRANSITION = "transform 350ms cubic-bezier(0.4, 0, 0.2, 1)"
const ZOOM_TRANSITION = "transform 150ms ease-out"
const ONBOARDING_STORAGE_KEY = "emru:canvas-onboarding-seen:v1"

interface SelectionStart {
  x: number
  y: number
  pointerId: number
}

function shouldShowOnboarding() {
  try {
    return window.sessionStorage.getItem(ONBOARDING_STORAGE_KEY) !== "1"
  } catch {
    return true
  }
}

function markOnboardingSeen() {
  try {
    window.sessionStorage.setItem(ONBOARDING_STORAGE_KEY, "1")
  } catch {
    // noop
  }
}

function createBlock(type: BlockType, x: number, y: number): Block {
  const { defaultWidth, defaultHeight } = getBlockSizeBounds(type)

  if (type === "tasks") {
    return {
      id: createBlockId(),
      type,
      x,
      y,
      width: defaultWidth,
      height: defaultHeight,
      zIndex: 10,
      data: {
        title: "tasks",
        items: [
          "Review priorities",
          "Ship one meaningful thing",
          "Close the day calm",
        ],
      },
    }
  }

  if (type === "notes") {
    return {
      id: createBlockId(),
      type,
      x,
      y,
      width: defaultWidth,
      height: defaultHeight,
      zIndex: 10,
      data: {
        title: "notes",
        text: "Capture thoughts, links, and rough ideas here.",
      },
    }
  }

  return {
    id: createBlockId(),
    type,
    x,
    y,
    width: defaultWidth,
    height: defaultHeight,
    zIndex: 10,
    data: {
      title: "focus",
      focusMinutes: 25,
      restMinutes: 5,
      phase: "focus",
      status: "idle",
      startedAt: null,
      endsAt: null,
      remainingMs: 25 * 60 * 1000,
      compact: false,
    },
  }
}

function getExistingFocusBlockId(blocks: Record<string, Block>) {
  const existing = Object.values(blocks).find((block) => block.type === "focus")
  return existing?.id ?? null
}

export function Canvas() {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const selectionStartRef = useRef<SelectionStart | null>(null)
  const transitionClearRef = useRef<number | null>(null)
  const [selectionRect, setSelectionRect] = useState<ScreenRect | null>(null)
  const [transition, setTransition] = useState<string | null>(null)
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(() =>
    shouldShowOnboarding()
  )

  const tool = useCanvasStore((state) => state.tool)
  const zoom = useCanvasStore((state) => state.zoom)
  const activeCursor = useCanvasStore((state) => state.activeCursor)
  const blockCount = useBlocksStore((state) => Object.keys(state.blocks).length)
  const hasFocusBlock = useBlocksStore((state) =>
    Object.values(state.blocks).some((block) => block.type === "focus")
  )
  const { theme, setTheme } = useTheme()

  const runTransformAnimation = useCallback(
    (transitionValue: string, duration: number, action: () => void) => {
      if (transitionClearRef.current !== null) {
        window.clearTimeout(transitionClearRef.current)
      }

      setTransition(transitionValue)
      window.requestAnimationFrame(() => {
        action()
      })

      transitionClearRef.current = window.setTimeout(() => {
        setTransition(null)
      }, duration + 32)
    },
    []
  )

  const addBlockAtViewportCenter = useCallback((type: BlockType) => {
    const canvasState = useCanvasStore.getState()
    const blocksStore = useBlocksStore.getState()
    const existingFocusId =
      type === "focus" ? getExistingFocusBlockId(blocksStore.blocks) : null

    if (existingFocusId) {
      blocksStore.bringToFront(existingFocusId)
      canvasState.select([existingFocusId])
      setShowOnboarding(false)
      markOnboardingSeen()
      return
    }

    const blocks = Object.values(blocksStore.blocks)
    const center = toCanvas(
      window.innerWidth / 2,
      window.innerHeight / 2,
      canvasState.offsetX,
      canvasState.offsetY,
      canvasState.zoom
    )
    const offset = blocks.length * 24

    const block = createBlock(type, center.x + offset, center.y + offset)
    blocksStore.addBlock(block)
    canvasState.select([block.id])
    setShowOnboarding(false)
    markOnboardingSeen()
  }, [])

  const addStarterLayout = useCallback(() => {
    const canvasState = useCanvasStore.getState()
    const blocksStore = useBlocksStore.getState()
    const center = toCanvas(
      window.innerWidth / 2,
      window.innerHeight / 2,
      canvasState.offsetX,
      canvasState.offsetY,
      canvasState.zoom
    )

    const starter: Array<{ type: BlockType; x: number; y: number }> = [
      { type: "tasks", x: center.x - 260, y: center.y - 140 },
      { type: "notes", x: center.x + 80, y: center.y - 120 },
      { type: "focus", x: center.x - 70, y: center.y + 130 },
    ]

    const ids: string[] = []
    for (const item of starter) {
      const block = createBlock(item.type, item.x, item.y)
      blocksStore.addBlock(block)
      ids.push(block.id)
    }

    canvasState.select(ids)
    setShowOnboarding(false)
    markOnboardingSeen()
  }, [])

  const resetZoomToOne = useCallback(() => {
    const canvasState = useCanvasStore.getState()
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2

    runTransformAnimation(ZOOM_TRANSITION, 150, () => {
      canvasState.zoomAround(1, centerX, centerY)
    })
  }, [runTransformAnimation])

  const zoomIn = useCallback(() => {
    const canvasState = useCanvasStore.getState()
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2

    runTransformAnimation(ZOOM_TRANSITION, 150, () => {
      canvasState.zoomAround(canvasState.zoom * 1.25, centerX, centerY)
    })
  }, [runTransformAnimation])

  const zoomOut = useCallback(() => {
    const canvasState = useCanvasStore.getState()
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2

    runTransformAnimation(ZOOM_TRANSITION, 150, () => {
      canvasState.zoomAround(canvasState.zoom / 1.25, centerX, centerY)
    })
  }, [runTransformAnimation])

  const fitAllContent = useCallback(() => {
    const blocks = Object.values(useBlocksStore.getState().blocks)
    const bounds = getBlocksBoundingBox(blocks)

    if (!bounds) {
      return
    }

    const nextTransform = getFitTransform(
      bounds,
      window.innerWidth,
      window.innerHeight,
      80
    )

    runTransformAnimation(FIT_TRANSITION, 350, () => {
      useCanvasStore.setState({
        zoom: nextTransform.zoom,
        offsetX: nextTransform.offsetX,
        offsetY: nextTransform.offsetY,
      })
    })
  }, [runTransformAnimation])

  const toggleAiPanel = useCallback(() => {
    setIsAiPanelOpen((open) => !open)
  }, [])

  const { spaceHeldRef } = useKeyboardShortcuts({
    addBlockAtViewportCenter,
    fitAllContent,
    resetZoomToOne,
    toggleAiPanel,
  })

  useCanvasGestures({
    rootRef,
    spaceHeldRef,
  })

  useEffect(() => {
    return () => {
      if (transitionClearRef.current !== null) {
        window.clearTimeout(transitionClearRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (spaceHeldRef.current) {
      return
    }

    useCanvasStore.getState().setCursor(tool === "pan" ? "grab" : "default")
  }, [tool, spaceHeldRef])

  useEffect(() => {
    const root = rootRef.current
    if (!root) {
      return
    }

    let frame: number | null = null
    const applyBackground = () => {
      const { offsetX, offsetY, zoom: currentZoom } = useCanvasStore.getState()
      const dotSize = Math.max(6, 24 * currentZoom)
      const isDark = document.documentElement.classList.contains("dark")
      const dotColor = isDark ? "rgba(255,255,255,0.042)" : "rgba(0,0,0,0.052)"

      root.style.backgroundImage = `radial-gradient(circle, ${dotColor} 1px, transparent 1px)`
      root.style.backgroundSize = `${dotSize}px ${dotSize}px`
      root.style.backgroundPosition = `${offsetX % dotSize}px ${offsetY % dotSize}px`
    }

    applyBackground()

    const unsub = useCanvasStore.subscribe(() => {
      if (frame !== null) {
        return
      }

      frame = window.requestAnimationFrame(() => {
        frame = null
        applyBackground()
      })
    })

    const observer = new MutationObserver(() => {
      applyBackground()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame)
      }
      observer.disconnect()
      unsub()
    }
  }, [])

  const startSelection: PointerEventHandler<HTMLDivElement> = (event) => {
    if (event.button !== 0) {
      return
    }

    if (event.target !== rootRef.current) {
      return
    }

    if (tool !== "select" || spaceHeldRef.current) {
      return
    }

    event.preventDefault()
    selectionStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
    }
    setSelectionRect({
      x: event.clientX,
      y: event.clientY,
      width: 0,
      height: 0,
    })
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const updateSelection: PointerEventHandler<HTMLDivElement> = (event) => {
    const start = selectionStartRef.current
    if (!start || start.pointerId !== event.pointerId) {
      return
    }

    setSelectionRect(
      normalizeScreenRect(start.x, start.y, event.clientX, event.clientY)
    )
  }

  const finishSelection: PointerEventHandler<HTMLDivElement> = (event) => {
    const start = selectionStartRef.current
    if (!start || start.pointerId !== event.pointerId) {
      return
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const rect = normalizeScreenRect(
      start.x,
      start.y,
      event.clientX,
      event.clientY
    )
    selectionStartRef.current = null
    setSelectionRect(null)

    if (rect.width < 4 && rect.height < 4) {
      useCanvasStore.getState().clearSelection()
      return
    }

    const { offsetX, offsetY, zoom: currentZoom } = useCanvasStore.getState()
    const canvasRect = toCanvasRect(rect, offsetX, offsetY, currentZoom)
    const selectedIds = Object.values(useBlocksStore.getState().blocks)
      .filter((block) => blockIntersectsRect(block, canvasRect))
      .map((block) => block.id)

    useCanvasStore.getState().select(selectedIds)
  }

  return (
    <section
      ref={rootRef}
      data-canvas-root="true"
      className="relative h-full w-full overflow-hidden"
      style={{ cursor: activeCursor }}
      onPointerDown={startSelection}
      onPointerMove={updateSelection}
      onPointerUp={finishSelection}
      onPointerCancel={finishSelection}
    >
      <Toolbar
        tool={tool}
        onSelectTool={() => {
          const canvasState = useCanvasStore.getState()
          canvasState.setTool("select")
          canvasState.setCursor("default")
        }}
        onPanTool={() => {
          const canvasState = useCanvasStore.getState()
          canvasState.setTool("pan")
          canvasState.setCursor("grab")
        }}
        onAddBlock={addBlockAtViewportCenter}
        disableFocusAdd={hasFocusBlock}
        onToggleSettings={() => {
          setIsSettingsOpen((open) => !open)
        }}
        settingsOpen={isSettingsOpen}
      />
      <TransformLayer transition={transition} />
      <SelectionRect rect={selectionRect} />
      <ZoomControls
        zoom={zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetZoomToOne}
      />
      <Minimap />
      <div className="fixed top-3 right-2 z-50 flex w-[min(22rem,calc(100vw-1rem))] flex-col gap-3 sm:top-4 sm:right-4 sm:w-72">
        <aside
          className={cn(
            "min-w-0 rounded-xl bg-card p-4 text-sm [overflow-wrap:anywhere] shadow-[0_10px_24px_rgba(0,0,0,0.16)]",
            "canvas-side-panel",
            "origin-top-right transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
            isAiPanelOpen
              ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
              : "pointer-events-none -translate-y-1 scale-[0.98] opacity-0"
          )}
        >
          <p className="font-medium text-foreground">quick actions</p>
          <p className="mt-1 text-xs text-muted-foreground">
            press <span className="font-mono">t</span>,{" "}
            <span className="font-mono">n</span>, or{" "}
            <span className="font-mono">f</span> to add blocks fast.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              className="min-w-0 rounded-md border border-border bg-secondary/70 px-2 py-1.5 text-left text-xs [overflow-wrap:anywhere] hover:border-primary/45"
              onClick={() => {
                addBlockAtViewportCenter("tasks")
              }}
            >
              add tasks
            </button>
            <button
              type="button"
              className="min-w-0 rounded-md border border-border bg-secondary/70 px-2 py-1.5 text-left text-xs [overflow-wrap:anywhere] hover:border-primary/45"
              onClick={() => {
                addBlockAtViewportCenter("notes")
              }}
            >
              add notes
            </button>
            <button
              type="button"
              disabled={hasFocusBlock}
              className={cn(
                "min-w-0 rounded-md border border-border px-2 py-1.5 text-left text-xs [overflow-wrap:anywhere]",
                hasFocusBlock
                  ? "cursor-not-allowed bg-secondary/45 text-muted-foreground/80"
                  : "bg-secondary/70 hover:border-primary/45"
              )}
              onClick={() => {
                addBlockAtViewportCenter("focus")
              }}
            >
              {hasFocusBlock ? "focus exists" : "add focus"}
            </button>
            <button
              type="button"
              className="min-w-0 rounded-md border border-border bg-secondary/70 px-2 py-1.5 text-left text-xs [overflow-wrap:anywhere] hover:border-primary/45"
              onClick={fitAllContent}
            >
              fit all blocks
            </button>
          </div>
        </aside>
        <aside
          className={cn(
            "min-w-0 rounded-xl bg-card p-4 text-sm [overflow-wrap:anywhere] shadow-[0_10px_24px_rgba(0,0,0,0.16)]",
            "canvas-side-panel",
            "origin-top-right transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
            isSettingsOpen
              ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
              : "pointer-events-none -translate-y-1 scale-[0.98] opacity-0"
          )}
        >
          <p className="font-medium text-foreground">settings</p>
          <div className="mt-2 flex items-center gap-2">
            {(["light", "dark", "system"] as const).map((value) => (
              <button
                key={value}
                type="button"
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs",
                  theme === value
                    ? "border-primary/60 bg-primary/10 text-foreground"
                    : "border-border bg-secondary/70 text-muted-foreground"
                )}
                onClick={() => {
                  setTheme(value)
                }}
              >
                {value}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            tips: <span className="font-mono">cmd/ctrl + shift + h</span> frames
            every block, <span className="font-mono">d</span> toggles theme.
          </p>
        </aside>
      </div>
      {showOnboarding && blockCount === 0 ? (
        <div className="pointer-events-none fixed inset-0 z-40 grid place-items-center px-6">
          <div className="pointer-events-auto max-w-md rounded-2xl border border-border/80 bg-card/95 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.18)] backdrop-blur">
            <p className="text-xs tracking-[0.08em] text-muted-foreground">
              first canvas
            </p>
            <h2 className="mt-2 font-display text-2xl text-foreground">
              start with a calm layout
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              place your first blocks, then drag headers to arrange your day.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-full bg-primary px-3.5 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
                onClick={addStarterLayout}
              >
                add starter layout
              </button>
              <button
                type="button"
                className="rounded-full border border-border bg-secondary/70 px-3.5 py-1.5 text-sm hover:border-primary/40"
                onClick={() => {
                  addBlockAtViewportCenter("tasks")
                  setShowOnboarding(false)
                  markOnboardingSeen()
                }}
              >
                add one tasks block
              </button>
              <button
                type="button"
                className="rounded-full px-3.5 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setShowOnboarding(false)
                  markOnboardingSeen()
                }}
              >
                skip for now
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
