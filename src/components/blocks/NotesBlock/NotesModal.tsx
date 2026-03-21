import { ArrowShrink02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Dialog } from "@base-ui/react/dialog"
import { AnimatePresence, motion } from "motion/react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { NotesContent } from "./NotesContent"
import { type NoteSaveState } from "./notes-utils"

interface NotesModalProps {
  open: boolean
  title: string
  text: string
  isEditing: boolean
  layoutId: string
  saveState: NoteSaveState
  words: number
  characters: number
  density?: "micro" | "compact" | "regular"
  onOpenChange: (open: boolean) => void
  onBeginEditing: () => void
  onEndEditing: () => void
  onChangeText: (text: string) => void
}

export function NotesModal({
  open,
  title,
  text,
  isEditing,
  layoutId,
  saveState,
  words,
  characters,
  density = "regular",
  onOpenChange,
  onBeginEditing,
  onEndEditing,
  onChangeText,
}: NotesModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence initial={false}>
        {open ? (
          <Dialog.Portal keepMounted>
            <Dialog.Backdrop className="notes-dialog-backdrop" />
            <Dialog.Viewport className="notes-dialog-viewport">
              <Dialog.Popup className="notes-dialog-popup">
                <motion.div
                  layoutId={layoutId}
                  transition={{
                    duration: 0.42,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="notes-dialog-card pointer-events-auto"
                >
                  <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
                    <Dialog.Title
                      className="canvas-block-modal-title min-w-0 truncate text-foreground"
                      dir="auto"
                    >
                      {title}
                    </Dialog.Title>
                    <Dialog.Close
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon-sm" }),
                        "shrink-0 rounded-full text-muted-foreground"
                      )}
                      aria-label="Collapse note focus mode"
                    >
                      <HugeiconsIcon icon={ArrowShrink02Icon} />
                    </Dialog.Close>
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
                </motion.div>
              </Dialog.Popup>
            </Dialog.Viewport>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  )
}
