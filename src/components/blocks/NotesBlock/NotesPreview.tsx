import { useEffect } from "react"

import Link from "@tiptap/extension-link"
import { Markdown } from "@tiptap/markdown"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"

import { cn } from "@/lib/utils"

function normalizeMarkdownForPreview(source: string) {
  return source
    .replace(/\r\n?/g, "\n")
    .replace(
      /(^|\n)([ \t]{0,3})(`{3,}|~{3,})[ \t]+([^\n]*?\S)[ \t]+\3(?=\n|$)/g,
      (_match, lineStart, indent, fence, content) =>
        `${lineStart}${indent}${fence}\n${content}\n${indent}${fence}`
    )
    .replace(
      /(^|\n)([ \t]{0,3})(?:[-+*][ \t]+)?\[(?: |x|X)?\][ \t]+(.+?)(?=\n|$)/g,
      (_match, lineStart, indent, content) => `${lineStart}${indent}- ${content}`
    )
}

interface NotesPreviewProps {
  markdown: string
  className?: string
  onClick?: () => void
}

export function NotesPreview({
  markdown,
  className,
  onClick,
}: NotesPreviewProps) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      Link.configure({
        openOnClick: true,
      }),
      Markdown.configure({
        markedOptions: {
          gfm: true,
        },
      }),
    ],
    content: "",
  })

  useEffect(() => {
    if (!editor) {
      return
    }

    const normalizedMarkdown =
      markdown.trim().length > 0 ? normalizeMarkdownForPreview(markdown) : ""

    editor.commands.setContent(normalizedMarkdown, { contentType: "markdown" })
  }, [editor, markdown])

  if (markdown.trim().length === 0) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            onClick?.()
          }
        }}
        className={cn(
          "notes-preview-shell notes-preview-placeholder flex w-full flex-1 items-start text-left",
          className
        )}
      >
        Start writing in Markdown.
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onClick?.()
        }
      }}
      className={cn(
        "notes-preview-shell flex w-full flex-1 items-start text-left",
        className
      )}
    >
      <div className="w-full min-w-0">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
