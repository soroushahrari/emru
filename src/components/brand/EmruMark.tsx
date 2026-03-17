import { cn } from "@/lib/utils"

type EmruMarkProps = {
  size?: number
  className?: string
  decorative?: boolean
  alt?: string
}

export function EmruMark({
  size = 34,
  className,
  decorative = true,
  alt = "emru mark",
}: EmruMarkProps) {
  return (
    <img
      src="/brand/emru-mark.svg"
      alt={decorative ? "" : alt}
      aria-hidden={decorative ? true : undefined}
      width={size}
      height={size}
      decoding="async"
      className={cn("drop-shadow-[0_2px_10px_rgba(224,144,96,0.4)]", className)}
    />
  )
}
