import { useCallback, useEffect, useState } from "react"

import { Canvas } from "@/components/canvas/Canvas"

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"
const SPLASH_HOLD_MS = 860
const SPLASH_HOLD_REDUCED_MS = 420
const SPLASH_EXIT_MS = 260
const SPLASH_EXIT_REDUCED_MS = 120

function prefersReducedMotion() {
  try {
    return window.matchMedia(REDUCED_MOTION_QUERY).matches
  } catch {
    return false
  }
}

function AppSplashMark() {
  return (
    <svg viewBox="0 0 64 64" className="app-splash-logo" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient
          id="app-splash-mark-outer"
          x1="14"
          y1="54"
          x2="50"
          y2="22"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#d4692a" />
          <stop offset="1" stopColor="#e09060" />
        </linearGradient>
        <linearGradient
          id="app-splash-mark-mid"
          x1="20"
          y1="45"
          x2="44"
          y2="25"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#e09060" />
          <stop offset="1" stopColor="#f7c68a" />
        </linearGradient>
        <linearGradient
          id="app-splash-mark-inner"
          x1="28"
          y1="38"
          x2="37"
          y2="31"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#f7c68a" />
          <stop offset="1" stopColor="#ffd77a" />
        </linearGradient>
      </defs>

      <g className="app-splash-logo-group">
        <path
          className="app-splash-path app-splash-path-outer"
          d="M14 42c2 7 9 12 17 12 10 0 19-8 19-19"
          fill="none"
          stroke="url(#app-splash-mark-outer)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          className="app-splash-path app-splash-path-mid"
          d="M20 38c2 4 6 7 11 7 7 0 13-6 13-13"
          fill="none"
          stroke="url(#app-splash-mark-mid)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          className="app-splash-path app-splash-path-inner"
          d="M28 34c1 2 2 3 4 3 3 0 5-2 5-5"
          fill="none"
          stroke="url(#app-splash-mark-inner)"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}

export function CanvasPage() {
  const [showSplash, setShowSplash] = useState(true)
  const [isSplashLeaving, setIsSplashLeaving] = useState(false)

  const dismissSplash = useCallback(() => {
    setIsSplashLeaving(true)
  }, [])

  useEffect(() => {
    if (!showSplash) {
      return
    }

    const holdMs = prefersReducedMotion() ? SPLASH_HOLD_REDUCED_MS : SPLASH_HOLD_MS
    const holdTimeout = window.setTimeout(() => {
      setIsSplashLeaving(true)
    }, holdMs)

    return () => {
      window.clearTimeout(holdTimeout)
    }
  }, [showSplash])

  useEffect(() => {
    if (!showSplash || !isSplashLeaving) {
      return
    }

    const exitMs = prefersReducedMotion() ? SPLASH_EXIT_REDUCED_MS : SPLASH_EXIT_MS
    const exitTimeout = window.setTimeout(() => {
      setShowSplash(false)
      setIsSplashLeaving(false)
    }, exitMs)

    return () => {
      window.clearTimeout(exitTimeout)
    }
  }, [isSplashLeaving, showSplash])

  useEffect(() => {
    if (!showSplash) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
        dismissSplash()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [dismissSplash, showSplash])

  return (
    <main className="relative isolate h-svh w-full overflow-hidden bg-background text-foreground">
      {showSplash ? (
        <div
          className={`app-splash ${isSplashLeaving ? "is-leaving" : ""}`}
          onPointerDown={dismissSplash}
          role="status"
          aria-label="Opening emru workspace"
        >
          <div className="app-splash-core">
            <AppSplashMark />
          </div>
        </div>
      ) : null}
      <Canvas />
    </main>
  )
}
