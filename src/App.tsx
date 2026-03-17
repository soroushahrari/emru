import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"

const HERO_ENTER_STEP_MS = 110
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"
const PRIVACY_PROMISE =
  "No server. No account. No trackers. Your emru data stays in your browser."

function getDayGreeting() {
  const hour = new Date().getHours()

  if (hour < 12) {
    return "good morning - clear starts early"
  }

  if (hour < 18) {
    return "good afternoon - keep it light"
  }

  return "good evening - close the day calmly"
}

type FeatureSectionProps = {
  pill: string
  title: string
  description: string
  children: ReactNode
  reverse?: boolean
  id?: string
  reducedMotion: boolean
}

type RevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  reducedMotion: boolean
}

type FeatureCard = {
  title: string
  description: string
  icon: "layout" | "spark" | "square" | "lines" | "upload" | "home"
}

const FEATURE_CARDS: FeatureCard[] = [
  {
    title: "blocks with structure",
    description: "Move, resize, and group cards without fighting rigid layouts.",
    icon: "layout",
  },
  {
    title: "focus that stays gentle",
    description: "Work and break cycles that support flow without pressure loops.",
    icon: "spark",
  },
  {
    title: "local-first by default",
    description: "Your data stays on device with no hidden sync assumptions.",
    icon: "square",
  },
  {
    title: "short-horizon planning",
    description: "Keep today visible while tomorrow waits quietly in the wings.",
    icon: "lines",
  },
  {
    title: "export when you want",
    description: "Leave with your data in a clean JSON backup at any time.",
    icon: "upload",
  },
  {
    title: "quiet, polished motion",
    description: "Subtle movement supports attention instead of stealing it.",
    icon: "home",
  },
]

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY)
    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches)
    }

    updatePreference()
    mediaQuery.addEventListener("change", updatePreference)

    return () => {
      mediaQuery.removeEventListener("change", updatePreference)
    }
  }, [])

  return prefersReducedMotion
}

function delayStyle(
  key: "--hero-delay" | "--reveal-delay",
  stepOrDelay: number,
  stepSize = 1
): CSSProperties {
  return {
    [key]: `${Math.round(stepOrDelay * stepSize)}ms`,
  } as CSSProperties
}

function EmruMark({ size = 34 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className="drop-shadow-[0_2px_10px_rgba(224,144,96,0.4)]"
    >
      <path
        d="M14 42c2 7 9 12 17 12 10 0 19-8 19-19"
        fill="none"
        stroke="var(--ember)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M20 38c2 4 6 7 11 7 7 0 13-6 13-13"
        fill="none"
        stroke="var(--dawn)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M28 34c1 2 2 3 4 3 3 0 5-2 5-5"
        fill="none"
        stroke="var(--saffron)"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path
        d="M4 12h15m0 0-5-5m5 5-5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function GridIcon({ icon }: { icon: FeatureCard["icon"] }) {
  switch (icon) {
    case "layout":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
          <path
            d="M3.5 8.5h7v-5h-7v5Zm10 0h7v-5h-7v5Zm-10 12h7v-9h-7v9Zm10 0h7v-9h-7v9Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      )
    case "spark":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
          <path
            d="M12 2.5v5m0 9v5m9.5-9h-5m-9 0h-5M19.4 5.6l-3.5 3.5M8.1 16.9l-3.5 3.5m0-14.8 3.5 3.5m7.8 7.8 3.5 3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      )
    case "square":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
          <path
            d="M4 4h16v16H4z M8 8h8v8H8z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      )
    case "lines":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
          <path
            d="M5 6h14M5 12h14M5 18h9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      )
    case "upload":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
          <path
            d="M12 5v14m-5-9 5-5 5 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    default:
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
          <path
            d="M5 19V8l7-4 7 4v11M9 12h6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
  }
}

function IconShell({ children }: { children: ReactNode }) {
  return (
    <div className="icon-shell flex h-8 w-8 items-center justify-center rounded-xl border border-border/70 bg-secondary text-muted-foreground">
      {children}
    </div>
  )
}

function Reveal({ children, className, delay = 0, reducedMotion }: RevealProps) {
  const [hasRevealed, setHasRevealed] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (reducedMotion) {
      return
    }

    const node = ref.current
    if (!node) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue
          }

          setHasRevealed(true)
          observer.disconnect()
          break
        }
      },
      {
        threshold: 0.22,
        rootMargin: "0px 0px -8% 0px",
      }
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [reducedMotion])

  const isVisible = reducedMotion || hasRevealed

  return (
    <div
      ref={ref}
      className={`reveal ${isVisible ? "is-visible" : ""} ${className ?? ""}`}
      style={delayStyle("--reveal-delay", delay)}
    >
      {children}
    </div>
  )
}

function FeatureSection({
  pill,
  title,
  description,
  children,
  reverse,
  id,
  reducedMotion,
}: FeatureSectionProps) {
  return (
    <section id={id} className={`feature-section ${reverse ? "is-reverse" : ""}`}>
      <Reveal reducedMotion={reducedMotion} delay={80} className="feature-copy">
        <span className="section-pill mb-4 inline-flex">{pill}</span>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
      </Reveal>
      <Reveal
        reducedMotion={reducedMotion}
        delay={170}
        className="feature-visual"
      >
        {children}
      </Reveal>
    </section>
  )
}

export function App() {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [hasHeroEntered, setHasHeroEntered] = useState(false)
  const [isNavRaised, setIsNavRaised] = useState(false)
  const [privacyFeedback, setPrivacyFeedback] = useState<"idle" | "copied" | "failed">(
    "idle"
  )
  const [showSecretBloom, setShowSecretBloom] = useState(false)

  const privacyTimeoutRef = useRef<number | null>(null)
  const secretTimeoutRef = useRef<number | null>(null)

  const greeting = getDayGreeting()

  useEffect(() => {
    if (prefersReducedMotion) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      setHasHeroEntered(true)
    })

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [prefersReducedMotion])

  useEffect(() => {
    const handleScroll = () => {
      setIsNavRaised(window.scrollY > 10)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (privacyTimeoutRef.current !== null) {
        window.clearTimeout(privacyTimeoutRef.current)
      }

      if (secretTimeoutRef.current !== null) {
        window.clearTimeout(secretTimeoutRef.current)
      }
    }
  }, [])

  const handleCopyPrivacy = async () => {
    try {
      await navigator.clipboard.writeText(PRIVACY_PROMISE)
      setPrivacyFeedback("copied")
    } catch {
      setPrivacyFeedback("failed")
    }

    if (privacyTimeoutRef.current !== null) {
      window.clearTimeout(privacyTimeoutRef.current)
    }

    privacyTimeoutRef.current = window.setTimeout(() => {
      setPrivacyFeedback("idle")
    }, 2200)
  }

  const triggerSecretBloom = () => {
    if (prefersReducedMotion) {
      return
    }

    setShowSecretBloom(true)

    if (secretTimeoutRef.current !== null) {
      window.clearTimeout(secretTimeoutRef.current)
    }

    secretTimeoutRef.current = window.setTimeout(() => {
      setShowSecretBloom(false)
    }, 1600)
  }

  const isHeroVisible = prefersReducedMotion || hasHeroEntered
  const heroItemClass = `hero-item ${isHeroVisible ? "is-visible" : ""}`

  return (
    <div className="min-h-svh overflow-x-hidden bg-background text-foreground">
      <nav
        className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${
          isNavRaised
            ? "border-white/15 bg-black/45 shadow-[0_8px_24px_rgba(0,0,0,0.24)]"
            : "border-white/10 bg-black/30"
        }`}
      >
        <div className="mx-auto flex h-18 w-full max-w-6xl items-center justify-between px-6">
          <a
            href="#top"
            className="brand-link flex items-center gap-2.5"
            aria-label="Back to top"
            onDoubleClick={triggerSecretBloom}
          >
            <span className="brand-mark-wrap">
              <EmruMark size={24} />
            </span>
            <span className="font-serif text-[1.7rem] leading-none text-[var(--paper-950)]">
              emru
            </span>
          </a>
          <a
            href="#workspace"
            className="pressable group inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm text-white/90 hover:border-white/35 hover:bg-white/5"
          >
            open workspace
            <span className="transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5">
              <ArrowIcon />
            </span>
          </a>
        </div>
      </nav>

      <section
        id="top"
        className="hero-gradient dot-grid-light relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-16"
      >
        <div className="hero-glow absolute inset-0" />
        {showSecretBloom ? <div className="secret-bloom absolute inset-0" /> : null}

        <div
          className={`${heroItemClass} absolute left-[8%] top-[22%] hidden w-64 rounded-2xl border border-[var(--ink-200)]/40 bg-[var(--paper-950)]/95 p-5 text-[var(--ink-900)] shadow-2xl lg:block`}
          style={delayStyle("--hero-delay", 1, HERO_ENTER_STEP_MS)}
        >
          <div className="font-serif text-2xl">tasks</div>
          <ul className="mt-4 space-y-2 text-lg">
            <li className="opacity-45 line-through">ship landing page</li>
            <li>review PR #42</li>
            <li>call with team</li>
          </ul>
        </div>

        <div
          className={`${heroItemClass} absolute left-[10%] top-[65%] hidden w-56 rounded-2xl border border-[var(--ink-200)]/40 bg-[var(--paper-950)]/95 p-5 text-[var(--ink-900)] shadow-2xl lg:block`}
          style={delayStyle("--hero-delay", 2, HERO_ENTER_STEP_MS)}
        >
          <div className="font-serif text-2xl">notes</div>
          <p className="mt-3 text-base text-[var(--ink-600)]">
            launch checklist, polish copy, test mobile, deploy to prod.
          </p>
        </div>

        <div
          className={`${heroItemClass} absolute right-[7%] top-[30%] hidden w-52 rounded-2xl border border-[var(--ink-200)]/40 bg-[var(--paper-950)]/95 p-5 text-[var(--ink-900)] shadow-2xl lg:block float-card-slow`}
          style={delayStyle("--hero-delay", 2, HERO_ENTER_STEP_MS)}
        >
          <div className="font-serif text-2xl">focus</div>
          <div className="mt-4 flex justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[var(--ember)]/80 font-mono text-xl">
              16:20
            </div>
          </div>
        </div>

        <div
          className={`${heroItemClass} absolute right-[9%] top-[66%] hidden w-64 rounded-2xl border border-[var(--ink-200)]/40 bg-[var(--paper-950)]/95 p-5 text-[var(--ink-900)] shadow-2xl xl:block`}
          style={delayStyle("--hero-delay", 3, HERO_ENTER_STEP_MS)}
        >
          <div className="font-serif text-2xl">tasks</div>
          <ul className="mt-4 space-y-2 text-lg">
            <li className="opacity-45 line-through">ship landing page</li>
            <li>review PR #42</li>
            <li>call with team</li>
          </ul>
        </div>

        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
          <div className={heroItemClass} style={delayStyle("--hero-delay", 1, HERO_ENTER_STEP_MS)}>
            <EmruMark size={64} />
          </div>
          <h1
            className={`${heroItemClass} mt-10 font-serif text-[clamp(2.7rem,6vw,6rem)] leading-[0.95] tracking-tight text-[var(--paper-950)]`}
            style={delayStyle("--hero-delay", 2, HERO_ENTER_STEP_MS)}
          >
            today, clear.
          </h1>
          <p
            className={`${heroItemClass} mt-7 max-w-2xl text-lg leading-relaxed text-[color:rgb(228_223_209_/_0.72)] sm:text-2xl`}
            style={delayStyle("--hero-delay", 3, HERO_ENTER_STEP_MS)}
          >
            a calm daily workspace. tasks, notes, and a focus timer - all on a
            free-form canvas. local-first. no account needed.
          </p>
          <p
            className={`${heroItemClass} hero-greeting mt-5`}
            style={delayStyle("--hero-delay", 3.5, HERO_ENTER_STEP_MS)}
          >
            {greeting}
          </p>
          <a
            href="#workspace"
            className={`${heroItemClass} cta-shadow cta-delight pressable group mt-12 inline-flex items-center gap-2.5 rounded-full bg-[var(--paper-950)] px-9 py-4 text-lg font-medium text-[var(--ink-900)] hover:bg-[var(--paper-900)]`}
            style={delayStyle("--hero-delay", 4, HERO_ENTER_STEP_MS)}
          >
            open workspace
            <span className="transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5">
              <ArrowIcon />
            </span>
          </a>
          <p
            className={`${heroItemClass} mt-5 text-sm text-[color:rgb(228_223_209_/_0.42)]`}
            style={delayStyle("--hero-delay", 5, HERO_ENTER_STEP_MS)}
          >
            no signup - your data stays in your browser
          </p>
        </div>

        <a
          href="#workspace"
          aria-label="Scroll to workspace details"
          className={`${heroItemClass} scroll-cue absolute bottom-7 left-1/2 z-20 -translate-x-1/2`}
          style={delayStyle("--hero-delay", 7, HERO_ENTER_STEP_MS)}
        >
          <span className="scroll-cue-dot" />
        </a>
      </section>

      <div className="h-24 bg-gradient-to-b from-[var(--canvas-dark)] to-background" />

      <main className="layout-main">
        <FeatureSection
          id="workspace"
          reducedMotion={prefersReducedMotion}
          pill="canvas"
          title="your day, arranged your way"
          description="an infinite canvas with a dot grid. drag blocks anywhere, resize them, and let your spatial memory shape your workflow."
        >
          <div className="dot-grid-light rounded-panel relative aspect-[4/3] w-full max-w-xl overflow-hidden border border-border/60 bg-card p-7 shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
            <div className="floating-card absolute left-5 top-5 w-40 p-3">
              <div className="font-serif text-lg">tasks</div>
              <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                <div className="h-2 rounded-full bg-foreground/10" />
                <div className="h-2 w-5/6 rounded-full bg-foreground/10" />
                <div className="h-2 w-2/3 rounded-full bg-foreground/10" />
              </div>
            </div>
            <div className="floating-card absolute bottom-7 right-7 w-30 p-3 text-center">
              <div className="font-serif text-lg">focus</div>
              <div className="mx-auto mt-2 flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary/40 font-mono text-xs">
                25:00
              </div>
            </div>
            <div className="floating-card absolute right-[28%] top-[44%] w-36 p-3">
              <div className="font-serif text-lg">notes</div>
              <div className="mt-2 space-y-1.5">
                <div className="h-2 rounded-full bg-foreground/9" />
                <div className="h-2 w-4/5 rounded-full bg-foreground/9" />
                <div className="h-2 w-2/5 rounded-full bg-foreground/9" />
              </div>
            </div>
          </div>
        </FeatureSection>

        <FeatureSection
          reducedMotion={prefersReducedMotion}
          pill="focus"
          title="stay in the zone"
          description="a timer that tracks sessions, respects your pace, and nudges you gently when breaks begin. no noise, no pressure, just clear momentum."
          reverse
        >
          <div className="floating-card flex max-w-xs flex-col items-center p-8">
            <div className="timer-ring">
              <div className="timer-inner">
                <span className="font-mono text-3xl tabular-nums">17:30</span>
                <span className="mt-0.5 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  focus
                </span>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-primary/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-primary/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-primary/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-muted" />
            </div>
          </div>
        </FeatureSection>

        <FeatureSection
          reducedMotion={prefersReducedMotion}
          pill="privacy"
          title="your data never leaves your device"
          description="no account, no trackers, no remote database. your blocks are stored locally and can be exported whenever you want."
        >
          <div className="floating-card w-full max-w-sm p-6">
            <div className="flex items-center gap-3">
              <IconShell>
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
                  <path
                    d="M12 3.5 5 6v5c0 4.6 2.9 8.6 7 9.9 4.1-1.3 7-5.3 7-9.9V6l-7-2.5Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </IconShell>
              <p className="text-sm font-medium">data residency</p>
            </div>
            <div className="mt-4 space-y-2 font-mono text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>emru:blocks</span>
                <span>localStorage</span>
              </div>
              <div className="flex justify-between">
                <span>emru:canvas</span>
                <span>localStorage</span>
              </div>
              <div className="flex justify-between">
                <span>emru:settings</span>
                <span>localStorage</span>
              </div>
              <div className="my-1 h-px bg-border" />
              <div className="flex justify-between text-primary/90">
                <span>server requests</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="status-dot" />
                  0
                </span>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
              <button
                type="button"
                onClick={handleCopyPrivacy}
                className="pressable rounded-full border border-border bg-secondary px-3.5 py-1.5 text-xs font-medium text-foreground/85 hover:border-primary/40"
              >
                copy privacy promise
              </button>
              <span
                className={`feedback-chip ${privacyFeedback === "copied" ? "is-copied" : ""} ${privacyFeedback === "failed" ? "is-failed" : ""}`}
                aria-live="polite"
              >
                {privacyFeedback === "copied"
                  ? "copied"
                  : privacyFeedback === "failed"
                    ? "copy unavailable"
                    : "local-first"}
              </span>
            </div>
          </div>
        </FeatureSection>

        <section className="feature-list-section">
          <div className="feature-list-intro">
            <Reveal reducedMotion={prefersReducedMotion} className="max-w-2xl">
              <span className="section-pill mb-4 inline-flex">features</span>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                everything you need, nothing you don&apos;t
              </h2>
            </Reveal>
            <Reveal
              reducedMotion={prefersReducedMotion}
              delay={70}
              className="max-w-sm text-sm leading-relaxed text-muted-foreground"
            >
              Emru keeps the canvas lightweight: the core tools are immediate,
              and supporting details stay out of your way until you need them.
            </Reveal>
          </div>
          <div className="feature-grid">
            {FEATURE_CARDS.map((feature, index) => (
              <Reveal
                key={feature.title}
                reducedMotion={prefersReducedMotion}
                delay={index * 90}
                className={
                  index === 0
                    ? "sm:col-span-2 lg:col-span-2"
                    : index === 3
                      ? "lg:col-span-2"
                      : ""
                }
              >
                <article className="floating-card feature-card min-h-36 p-5">
                  <IconShell>
                    <GridIcon icon={feature.icon} />
                  </IconShell>
                  <h3 className="mt-4 text-lg font-medium">{feature.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      </main>

      <section className="hero-gradient dot-grid-light relative overflow-hidden py-28 sm:py-32">
        <div className="hero-glow absolute inset-0" />
        <Reveal
          reducedMotion={prefersReducedMotion}
          className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 text-center"
        >
          <div>
            <EmruMark size={50} />
          </div>
          <h2 className="mt-6 font-serif text-4xl text-[var(--paper-950)] sm:text-5xl">
            experience emru today
          </h2>
          <p className="mt-3 max-w-sm text-base text-[color:rgb(228_223_209_/_0.72)]">
            your entire day, in one calm canvas.
          </p>
          <a
            href="#workspace"
            className="cta-shadow cta-delight pressable group mt-8 inline-flex items-center gap-2.5 rounded-full bg-[var(--paper-950)] px-9 py-4 text-lg font-medium text-[var(--ink-900)] hover:bg-[var(--paper-900)]"
          >
            open workspace
            <span className="transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5">
              <ArrowIcon />
            </span>
          </a>
        </Reveal>
      </section>

      <Reveal reducedMotion={prefersReducedMotion} className="border-t border-border/60 py-10 text-center">
        <footer>
          <a
            href="#top"
            className="brand-link mb-2 flex items-center justify-center gap-2"
            aria-label="Back to top"
          >
            <span className="brand-mark-wrap">
              <EmruMark size={20} />
            </span>
            <span className="font-serif text-lg">emru</span>
          </a>
          <p className="text-sm text-muted-foreground">
            your day, your canvas - built for today
          </p>
        </footer>
      </Reveal>
    </div>
  )
}

export default App
