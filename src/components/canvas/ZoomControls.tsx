import { memo } from "react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const percentFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
})

interface ZoomControlsProps {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
}

export const ZoomControls = memo(function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
}: ZoomControlsProps) {
  const zoomPercent = percentFormatter.format(Math.round(zoom * 100))
  const isDefaultZoom = Math.abs(zoom - 1) < 0.001

  return (
    <div className="pointer-events-auto fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-4 z-40 flex flex-col items-center gap-1 rounded-xl bg-card/82 px-1.5 py-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.12)] backdrop-blur-md transition-opacity duration-200 opacity-78 hover:opacity-100 focus-within:opacity-100">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onZoomIn}
            aria-label="Zoom in"
            className="h-7 w-7 rounded-md bg-card/80 text-sm transition-[transform,background-color] duration-150 hover:bg-card active:scale-[0.96]"
          >
            +
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Zoom in</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onReset}
            className={cn(
              "rounded-md bg-card/80 px-2 py-1 text-[11px] font-medium transition-[opacity,transform,background-color] duration-150 hover:bg-card active:translate-y-0 active:scale-[0.97]",
              isDefaultZoom ? "opacity-40" : "opacity-100"
            )}
          >
            {zoomPercent}%
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          <span>Reset zoom</span>
          <span className="opacity-70">Ctrl/Cmd+0</span>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onZoomOut}
            aria-label="Zoom out"
            className="h-7 w-7 rounded-md bg-card/80 text-sm transition-[transform,background-color] duration-150 hover:bg-card active:scale-[0.96]"
          >
            -
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Zoom out</TooltipContent>
      </Tooltip>
    </div>
  )
})
