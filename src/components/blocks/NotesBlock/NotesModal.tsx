import { useEffect, useRef, useState } from "react"

import { ArrowShrink02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Dialog } from "@base-ui/react/dialog"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { NotesContent } from "./NotesContent"
import { type NoteSaveState } from "./notes-utils"

interface NotesModalProps {
  open: boolean
  title: string
  text: string
  isEditing: boolean
  originRect: {
    left: number
    top: number
    width: number
    height: number
  } | null
  saveState: NoteSaveState
  words: number
  characters: number
  density?: "micro" | "compact" | "regular"
  onOpenChange: (open: boolean) => void
  onBeginEditing: () => void
  onEndEditing: () => void
  onChangeText: (text: string) => void
}

const OPEN_DURATION_MS = 420
const CLOSE_DURATION_MS = 300
const OPEN_EASING = "cubic-bezier(0.22, 1, 0.36, 1)"
const CLOSE_EASING = "cubic-bezier(0.4, 0, 0.2, 1)"

export function NotesModal({
  open,
  title,
  text,
  isEditing,
  originRect,
  saveState,
  words,
  characters,
  density = "regular",
  onOpenChange,
  onBeginEditing,
  onEndEditing,
  onChangeText,
}: NotesModalProps) {
  const backdropRef = useRef<HTMLDivElement | null>(null)
  const popupRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const isClosingRef = useRef(false)
  const closeTimeoutRef = useRef<number | null>(null)
  const [isPresent, setIsPresent] = useState(open)

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (open) {
      setIsPresent(true)
      isClosingRef.current = false
    } else {
      setIsPresent(false)
      isClosingRef.current = false
    }
  }, [open])

  useEffect(() => {
    if (!open || !isPresent) {
      return
    }

    const popup = popupRef.current
    const backdrop = backdropRef.current
    const content = contentRef.current
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (backdrop) {
      backdrop.getAnimations().forEach((animation) => animation.cancel())

      if (!reduceMotion) {
        backdrop.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 220,
          easing: OPEN_EASING,
          fill: "both",
        })
      }
    }

    if (!popup || reduceMotion || !originRect) {
      if (content) {
        content.getAnimations().forEach((animation) => animation.cancel())
      }
      return
    }

    popup.getAnimations().forEach((animation) => animation.cancel())
    content?.getAnimations().forEach((animation) => animation.cancel())

    const finalRect = popup.getBoundingClientRect()
    const scaleX = Math.max(originRect.width / finalRect.width, 0.2)
    const scaleY = Math.max(originRect.height / finalRect.height, 0.2)
    const translateX =
      originRect.left + originRect.width / 2 - (finalRect.left + finalRect.width / 2)
    const translateY =
      originRect.top + originRect.height / 2 - (finalRect.top + finalRect.height / 2)

    popup.animate(
      [
        {
          opacity: 0.86,
          transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scaleX}, ${scaleY})`,
        },
        {
          opacity: 1,
          transform: "translate3d(0, 0, 0) scale(1, 1)",
        },
      ],
      {
        duration: OPEN_DURATION_MS,
        easing: OPEN_EASING,
        fill: "both",
      }
    )

    content?.animate(
      [
        {
          opacity: 0,
          transform: "translate3d(0, 10px, 0)",
        },
        {
          opacity: 0,
          transform: "translate3d(0, 10px, 0)",
          offset: 0.58,
        },
        {
          opacity: 1,
          transform: "translate3d(0, 0, 0)",
        },
      ],
      {
        duration: OPEN_DURATION_MS,
        easing: OPEN_EASING,
        fill: "both",
      }
    )
  }, [isPresent, open, originRect])

  function finishClose() {
    isClosingRef.current = false
    setIsPresent(false)
    onOpenChange(false)
  }

  function requestClose() {
    if (!open || isClosingRef.current) {
      return
    }

    const popup = popupRef.current
    const backdrop = backdropRef.current
    const content = contentRef.current
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (reduceMotion || !popup || !originRect) {
      finishClose()
      return
    }

    isClosingRef.current = true
    popup.getAnimations().forEach((animation) => animation.cancel())
    backdrop?.getAnimations().forEach((animation) => animation.cancel())
    content?.getAnimations().forEach((animation) => animation.cancel())

    const finalRect = popup.getBoundingClientRect()
    const scaleX = Math.max(originRect.width / finalRect.width, 0.2)
    const scaleY = Math.max(originRect.height / finalRect.height, 0.2)
    const translateX =
      originRect.left + originRect.width / 2 - (finalRect.left + finalRect.width / 2)
    const translateY =
      originRect.top + originRect.height / 2 - (finalRect.top + finalRect.height / 2)

    popup.animate(
      [
        {
          opacity: 1,
          transform: "translate3d(0, 0, 0) scale(1, 1)",
        },
        {
          opacity: 0.82,
          transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scaleX}, ${scaleY})`,
        },
      ],
      {
        duration: CLOSE_DURATION_MS,
        easing: CLOSE_EASING,
        fill: "both",
      }
    )

    content?.animate(
      [
        {
          opacity: 1,
          transform: "translate3d(0, 0, 0)",
        },
        {
          opacity: 0,
          transform: "translate3d(0, 6px, 0)",
        },
      ],
      {
        duration: 140,
        easing: CLOSE_EASING,
        fill: "both",
      }
    )

    backdrop?.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 220,
      easing: CLOSE_EASING,
      fill: "both",
    })

    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current)
    }

    closeTimeoutRef.current = window.setTimeout(() => {
      closeTimeoutRef.current = null
      finishClose()
    }, CLOSE_DURATION_MS)
  }

  if (!isPresent) {
    return null
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          onOpenChange(true)
          return
        }

        requestClose()
      }}
    >
      <Dialog.Portal keepMounted>
        <Dialog.Backdrop ref={backdropRef} className="notes-dialog-backdrop" />
        <Dialog.Viewport className="notes-dialog-viewport">
          <Dialog.Popup ref={popupRef} className="notes-dialog-popup">
            <div className="notes-dialog-card pointer-events-auto">
              <div ref={contentRef} className="notes-dialog-content">
                <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
                  <Dialog.Title
                    className="canvas-block-modal-title min-w-0 truncate text-foreground"
                    dir="auto"
                  >
                    {title}
                  </Dialog.Title>
                  <button
                    type="button"
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon-sm" }),
                      "shrink-0 rounded-full text-muted-foreground"
                    )}
                    aria-label="Collapse note focus mode"
                    onClick={requestClose}
                  >
                    <HugeiconsIcon icon={ArrowShrink02Icon} />
                  </button>
                </div>

                <NotesContent
                  text={text}
                  isEditing={isEditing}
                  saveState={saveState}
                  words={words}
                  characters={characters}
                  density={density}
                  surface="modal"
                  autoFocus={open && isEditing}
                  bodyClassName="notes-modal-body"
                  onBeginEditing={onBeginEditing}
                  onEndEditing={onEndEditing}
                  onChangeText={onChangeText}
                />
              </div>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
