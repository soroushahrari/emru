import type { ScreenRect } from "@/types/canvas.types"

interface SelectionRectProps {
  rect: ScreenRect | null
}

export function SelectionRect({ rect }: SelectionRectProps) {
  if (!rect) {
    return null
  }

  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        border: "1px solid rgba(212, 105, 42, 0.5)",
        background: "rgba(212, 105, 42, 0.06)",
        borderRadius: "3px",
      }}
    />
  )
}
