export type NoteSaveState = "autosaved" | "saving"

const countFormatter = new Intl.NumberFormat()

function stripMarkdownSyntax(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/[*_~>#-]/g, " ")
}

export function getNoteCounts(markdown: string) {
  const characters = markdown.length
  const plainText = stripMarkdownSyntax(markdown)
  const trimmed = plainText.trim()
  const words = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length

  return { words, characters }
}

export function formatNoteCount(count: number) {
  return countFormatter.format(Math.max(0, Math.floor(count)))
}

export function getNoteSaveLabel(state: NoteSaveState) {
  return state === "saving" ? "Saving..." : "Autosaved"
}
