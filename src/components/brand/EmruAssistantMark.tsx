import { cn } from "@/lib/utils"

const VARIANT_SRC = {
  loading: "/brand/emru-assistant-loading.svg",
  thinking: "/brand/emru-assistant-thinking.svg",
  splash: "/brand/emru-assistant-splash.svg",
  interaction: "/brand/emru-assistant-interaction.svg",
} as const

type EmruAssistantVariant = keyof typeof VARIANT_SRC

type EmruAssistantMarkProps = {
  variant?: EmruAssistantVariant
  size?: number
  className?: string
  decorative?: boolean
  alt?: string
}

export function EmruAssistantMark({
  variant = "thinking",
  size = 64,
  className,
  decorative = true,
  alt = "emru assistant",
}: EmruAssistantMarkProps) {
  return (
    <img
      src={VARIANT_SRC[variant]}
      alt={decorative ? "" : alt}
      aria-hidden={decorative ? true : undefined}
      width={size}
      height={size}
      decoding="async"
      className={cn(className)}
    />
  )
}
