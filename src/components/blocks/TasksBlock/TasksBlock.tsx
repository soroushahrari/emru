import {
  type DragEvent,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type HTMLAttributes,
} from "react"

import { Button } from "@/components/ui/button"
import { useBlockResize } from "@/hooks/useBlockResize"
import {
  MAX_TASK_ITEM_LENGTH,
  MAX_TASK_ITEMS,
  getBlockSizeBounds,
} from "@/lib/utils/block-sanitizers"
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

function IconEyeOff() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        d="M3.5 4.5 19.5 20.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
      />
      <path
        d="M10.5 6.4c.5-.1 1-.2 1.5-.2 4.3 0 7.7 2.7 9.4 5.8-.7 1.3-1.7 2.5-2.9 3.5M6.6 9C5.4 9.9 4.4 10.9 3.7 12c1.6 3.1 5.1 5.8 9.3 5.8 1.3 0 2.4-.2 3.5-.7M9.9 9.8a3.2 3.2 0 0 0 4.3 4.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconReturn() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        d="M17.5 7.5v6h-10m0 0 3.2-3.2M7.5 13.5l3.2 3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden="true">
      <path
        d="m6.8 12.5 3.2 3.1 7.2-7.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden="true">
      <path
        d="M7 7 17 17M17 7 7 17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconRowGrip() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden="true">
      <circle cx="9" cy="8" r="1.1" fill="currentColor" />
      <circle cx="9" cy="12" r="1.1" fill="currentColor" />
      <circle cx="9" cy="16" r="1.1" fill="currentColor" />
      <circle cx="14" cy="8" r="1.1" fill="currentColor" />
      <circle cx="14" cy="12" r="1.1" fill="currentColor" />
      <circle cx="14" cy="16" r="1.1" fill="currentColor" />
    </svg>
  )
}

export const TasksBlock = memo(function TasksBlock({
  blockId,
  selected,
  isDragging,
  landed,
  dragHandleProps,
}: TasksBlockProps) {
  const [draft, setDraft] = useState("")
  const [hideDone, setHideDone] = useState(true)
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null)
  const [recentlyCompletedId, setRecentlyCompletedId] = useState<string | null>(null)
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{
    taskId: string
    position: "before" | "after"
  } | null>(null)
  const { block, addTask, toggleTask, removeTask, reorderTasks } = useTasksBlock(blockId)
  const { resizeHandleProps } = useBlockResize(blockId)
  const addedAnimationTimeoutRef = useRef<number | null>(null)
  const completedAnimationTimeoutRef = useRef<number | null>(null)

  function clearAddedAnimationTimeout() {
    if (addedAnimationTimeoutRef.current !== null) {
      window.clearTimeout(addedAnimationTimeoutRef.current)
      addedAnimationTimeoutRef.current = null
    }
  }

  function clearCompletedAnimationTimeout() {
    if (completedAnimationTimeoutRef.current !== null) {
      window.clearTimeout(completedAnimationTimeoutRef.current)
      completedAnimationTimeoutRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      if (addedAnimationTimeoutRef.current !== null) {
        window.clearTimeout(addedAnimationTimeoutRef.current)
      }

      if (completedAnimationTimeoutRef.current !== null) {
        window.clearTimeout(completedAnimationTimeoutRef.current)
      }
    }
  }, [])

  if (!block) {
    return null
  }

  const sizeBounds = getBlockSizeBounds(block.type)
  const shortSide = Math.min(block.width, block.height)
  const isMicro = shortSide < 270
  const visibleItems = block.data.items.slice(0, MAX_VISIBLE_TASK_ITEMS)
  const completedCount = visibleItems.filter((item) => item.completed).length
  const renderedItems = useMemo(
    () =>
      hideDone
        ? visibleItems.filter(
            (item) => !item.completed || recentlyCompletedId === item.id
          )
        : visibleItems,
    [hideDone, recentlyCompletedId, visibleItems]
  )
  const hiddenDoneCount = hideDone ? completedCount : 0
  const overflowCount = Math.max(0, block.data.items.length - MAX_VISIBLE_TASK_ITEMS)
  const isTaskLimitReached = block.data.items.length >= MAX_TASK_ITEMS
  const titleText = block.data.title.trim().length > 0 ? block.data.title : "Tasks"
  const displayTitle = titleText === "tasks" ? "Tasks" : titleText
  const shellPadding = isMicro ? "p-2.5" : "p-3"
  const headerMargin = isMicro ? "mb-2" : "mb-3"
  const headerChrome = isMicro ? "px-2 py-1" : "px-2.5 py-1.5"
  const formMargin = isMicro ? "mb-2" : "mb-3"
  const itemGap = isMicro ? "gap-1" : "gap-1.5"
  const itemTextSize = isMicro ? "text-sm" : "text-[0.95rem]"
  const chromeButtonSize = isMicro ? "icon-sm" : "icon"
  const toggleButtonSize = isMicro ? "xs" : "sm"
  const canSubmitTask = draft.trim().length > 0 && !isTaskLimitReached

  function handleAddTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextText = draft.trim()
    if (nextText.length === 0 || isTaskLimitReached) {
      return
    }

    const addedTaskId = addTask(nextText)
    if (addedTaskId) {
      setRecentlyAddedId(addedTaskId)
      clearAddedAnimationTimeout()
      addedAnimationTimeoutRef.current = window.setTimeout(() => {
        setRecentlyAddedId((current) => (current === addedTaskId ? null : current))
        addedAnimationTimeoutRef.current = null
      }, 420)
    }

    setDraft("")
  }

  function handleToggleTask(taskId: string, isCompleted: boolean) {
    if (!isCompleted) {
      setRecentlyCompletedId(taskId)
      clearCompletedAnimationTimeout()
      completedAnimationTimeoutRef.current = window.setTimeout(() => {
        setRecentlyCompletedId((current) => (current === taskId ? null : current))
        completedAnimationTimeoutRef.current = null
      }, 460)
    }

    toggleTask(taskId)
  }

  function handleRemoveTask(taskId: string) {
    if (recentlyAddedId === taskId) {
      setRecentlyAddedId(null)
      clearAddedAnimationTimeout()
    }

    if (recentlyCompletedId === taskId) {
      setRecentlyCompletedId(null)
      clearCompletedAnimationTimeout()
    }

    removeTask(taskId)
  }

  function resetDragState() {
    setDraggingTaskId(null)
    setDropTarget(null)
  }

  function handleTaskDragStart(event: DragEvent<HTMLButtonElement>, taskId: string) {
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("text/plain", taskId)
    setDraggingTaskId(taskId)
    setDropTarget(null)
  }

  function handleTaskDragOver(event: DragEvent<HTMLDivElement>, taskId: string) {
    if (!draggingTaskId) {
      return
    }

    event.preventDefault()
    event.dataTransfer.dropEffect = "move"

    if (draggingTaskId === taskId) {
      setDropTarget(null)
      return
    }

    const bounds = event.currentTarget.getBoundingClientRect()
    const nextPosition =
      event.clientY < bounds.top + bounds.height / 2 ? "before" : "after"

    setDropTarget((current) =>
      current?.taskId === taskId && current.position === nextPosition
        ? current
        : { taskId, position: nextPosition }
    )
  }

  function handleTaskDrop(event: DragEvent<HTMLDivElement>, taskId: string) {
    event.preventDefault()

    if (!draggingTaskId || draggingTaskId === taskId || dropTarget?.taskId !== taskId) {
      resetDragState()
      return
    }

    reorderTasks(
      draggingTaskId,
      taskId,
      dropTarget.position,
      renderedItems.map((item) => item.id)
    )
    resetDragState()
  }

  return (
    <article
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
      }}
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
            className={cn(
              "min-w-0 truncate font-medium normal-case tracking-normal text-foreground [overflow-wrap:anywhere]"
            )}
            dir="auto"
          >
            {displayTitle}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size={toggleButtonSize}
          className={cn(
            "tasks-visibility-toggle min-w-0 rounded-full text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground",
            isMicro && "text-[0.62rem]"
          )}
          onClick={() => {
            setHideDone((value) => !value)
          }}
          aria-pressed={hideDone}
          aria-label={hideDone ? "Show completed tasks" : "Hide completed tasks"}
        >
          <IconEyeOff />
          {!isMicro ? <span>{hideDone ? "Hide done" : "Show done"}</span> : null}
        </Button>
      </header>

      <form
        className={cn("canvas-block-inset tasks-entry-shell", formMargin)}
        onSubmit={handleAddTask}
        data-filled={canSubmitTask ? "true" : "false"}
      >
        <input
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
          }}
          placeholder={isTaskLimitReached ? "Task limit reached" : "Add a task..."}
          maxLength={MAX_TASK_ITEM_LENGTH}
          dir="auto"
          aria-label="Add a task"
          enterKeyHint="done"
          className="tasks-entry-input min-w-0 flex-1 select-text bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/62"
        />
        <Button
          type="submit"
          variant="ghost"
          size={chromeButtonSize}
          className="tasks-entry-submit rounded-full text-muted-foreground"
          disabled={!canSubmitTask}
          aria-label="Add task"
        >
          <IconReturn />
        </Button>
      </form>

      <div className="flex min-h-0 flex-1 flex-col">
        {renderedItems.length > 0 ? (
          <ul
            className={cn(
              "tasks-list flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto pr-1",
              itemGap
            )}
            data-dragging={draggingTaskId ? "true" : "false"}
          >
            {renderedItems.map((item) => (
              <li key={item.id} className="group/task">
                <div
                  className="tasks-row flex items-start gap-3 py-1"
                  data-completed={item.completed}
                  data-entering={recentlyAddedId === item.id}
                  data-completing={recentlyCompletedId === item.id}
                  data-dragging={draggingTaskId === item.id}
                  data-drop-position={
                    dropTarget?.taskId === item.id && draggingTaskId !== item.id
                      ? dropTarget.position
                      : undefined
                  }
                  onDragOver={(event) => {
                    handleTaskDragOver(event, item.id)
                  }}
                  onDrop={(event) => {
                    handleTaskDrop(event, item.id)
                  }}
                >
                  <button
                    type="button"
                    draggable
                    className="tasks-drag-handle mt-[0.05rem] inline-flex size-5 shrink-0 items-center justify-center rounded-full"
                    onDragStart={(event) => {
                      handleTaskDragStart(event, item.id)
                    }}
                    onDragEnd={() => {
                      resetDragState()
                    }}
                    aria-label={`Drag to reorder ${item.text}`}
                    aria-grabbed={draggingTaskId === item.id}
                  >
                    <IconRowGrip />
                  </button>
                  <button
                    type="button"
                    className="tasks-checkbox mt-[0.16rem] inline-flex size-5 shrink-0 items-center justify-center rounded-[4px]"
                    data-completed={item.completed}
                    onClick={() => {
                      handleToggleTask(item.id, item.completed)
                    }}
                    aria-pressed={item.completed}
                    aria-label={
                      item.completed
                        ? `Mark ${item.text} as not done`
                        : `Mark ${item.text} as done`
                    }
                  >
                    {item.completed ? (
                      <span className="tasks-checkbox-icon">
                        <IconCheck />
                      </span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "tasks-item-text min-w-0 flex-1 text-left leading-[1.45] text-foreground outline-none transition-colors",
                      itemTextSize,
                      item.completed && "text-muted-foreground/45 line-through"
                    )}
                    dir="auto"
                    onClick={() => {
                      handleToggleTask(item.id, item.completed)
                    }}
                  >
                    <span className="[overflow-wrap:anywhere]">{item.text}</span>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="tasks-remove-button mt-0.5 rounded-full text-muted-foreground"
                    onClick={() => {
                      handleRemoveTask(item.id)
                    }}
                    aria-label={`Remove ${item.text}`}
                  >
                    <IconClose />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="tasks-empty flex flex-1 items-center justify-center px-2 py-3 text-center text-sm text-muted-foreground">
            {hiddenDoneCount > 0
              ? "Completed tasks are hidden."
              : "Add one clear next action to get started."}
          </div>
        )}

        {overflowCount > 0 || isTaskLimitReached ? (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {overflowCount > 0 ? <span>Showing first {MAX_VISIBLE_TASK_ITEMS} tasks</span> : null}
            {isTaskLimitReached ? <span>Task limit reached</span> : null}
          </div>
        ) : null}
      </div>

      <div
        className="resize-grip absolute bottom-1 right-1 h-5 w-5 cursor-se-resize"
        data-visible={selected ? "true" : undefined}
        {...resizeHandleProps}
      />
    </article>
  )
})
