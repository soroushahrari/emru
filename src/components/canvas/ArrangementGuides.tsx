import { memo } from "react"

import { toScreen } from "@/lib/utils/canvas.utils"
import type { ArrangementGuide } from "@/lib/utils/arrangement.utils"
import { useCanvasStore } from "@/store/canvas.store"

interface ArrangementGuidesProps {
  guides: ArrangementGuide[]
}

export const ArrangementGuides = memo(function ArrangementGuides({
  guides,
}: ArrangementGuidesProps) {
  const offsetX = useCanvasStore((state) => state.offsetX)
  const offsetY = useCanvasStore((state) => state.offsetY)
  const zoom = useCanvasStore((state) => state.zoom)

  if (guides.length === 0) {
    return null
  }

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-30 h-full w-full overflow-visible"
      aria-hidden="true"
    >
      {guides.map((guide, index) => {
        if (guide.kind === "line") {
          if (guide.axis === "x") {
            const start = toScreen(guide.position, guide.start, offsetX, offsetY, zoom)
            const end = toScreen(guide.position, guide.end, offsetX, offsetY, zoom)

            return (
              <line
                key={`line-x-${index}`}
                className={`canvas-arrangement-line ${
                  guide.emphasis === "center"
                    ? "canvas-arrangement-line-center"
                    : "canvas-arrangement-line-edge"
                }`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
              />
            )
          }

          const start = toScreen(guide.start, guide.position, offsetX, offsetY, zoom)
          const end = toScreen(guide.end, guide.position, offsetX, offsetY, zoom)

          return (
            <line
              key={`line-y-${index}`}
              className={`canvas-arrangement-line ${
                guide.emphasis === "center"
                  ? "canvas-arrangement-line-center"
                  : "canvas-arrangement-line-edge"
              }`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
            />
          )
        }

        if (guide.orientation === "horizontal") {
          const start = toScreen(guide.x, guide.y, offsetX, offsetY, zoom)
          const end = toScreen(
            guide.x + guide.length,
            guide.y,
            offsetX,
            offsetY,
            zoom
          )

          return (
            <g key={`gap-h-${index}`} className="canvas-arrangement-gap">
              <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} />
              <circle cx={start.x} cy={start.y} r={1.6} />
              <circle cx={end.x} cy={end.y} r={1.6} />
            </g>
          )
        }

        const start = toScreen(guide.x, guide.y, offsetX, offsetY, zoom)
        const end = toScreen(
          guide.x,
          guide.y + guide.length,
          offsetX,
          offsetY,
          zoom
        )

        return (
          <g key={`gap-v-${index}`} className="canvas-arrangement-gap">
            <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} />
            <circle cx={start.x} cy={start.y} r={1.6} />
            <circle cx={end.x} cy={end.y} r={1.6} />
          </g>
        )
      })}
    </svg>
  )
})
