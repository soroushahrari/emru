import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"

import { EmruMark } from "@/components/brand/EmruMark"

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
  className?: string
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
  proof: string
}

const FEATURE_CARDS: FeatureCard[] = [
  {
    title: "blocks with structure",
    description: "Move, resize, and group cards without fighting rigid layouts.",
    proof: "Drag headers, resize corners, and keep spatial memory intact.",
  },
  {
    title: "focus that stays gentle",
    description: "Work and break cycles that support flow without pressure loops.",
    proof: "A visible timer and simple progression avoid urgency theater.",
  },
  {
    title: "local-first by default",
    description: "Your data stays on device with no hidden sync assumptions.",
    proof: "Blocks and settings persist in browser storage, not remote APIs.",
  },
  {
    title: "short-horizon planning",
    description: "Keep today visible while tomorrow waits quietly in the wings.",
    proof: "The canvas is tuned for now: capture, arrange, and act.",
  },
  {
    title: "export when you want",
    description: "Leave with your data in a clean JSON backup at any time.",
    proof: "No lock-in mechanics or hidden account dependencies.",
  },
  {
    title: "quiet, polished motion",
    description: "Subtle movement supports attention instead of stealing it.",
    proof: "Reduced motion support is first-class across core interactions.",
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
  className,
  reducedMotion,
}: FeatureSectionProps) {
  return (
    <section id={id} className={`feature-section ${reverse ? "is-reverse" : ""} ${className ?? ""}`}>
      <Reveal reducedMotion={reducedMotion} delay={80} className="feature-copy">
        <span className="section-pill mb-4 inline-flex">{pill}</span>
        <h2 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
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
        className={`landing-nav fixed inset-x-0 top-0 z-50 ${isNavRaised ? "is-raised" : ""}`}
      >
        <div className="mx-auto flex h-18 w-full max-w-6xl items-center justify-between px-6">
          <a
            href="#top"
            className="brand-link landing-nav-link flex items-center gap-2.5"
            aria-label="Back to top"
            onDoubleClick={triggerSecretBloom}
          >
            <span className="brand-mark-wrap">
              <EmruMark size={24} />
            </span>
            <span className="landing-nav-brand font-display text-[1.7rem] leading-none">
              emru
            </span>
          </a>
          <div className="flex items-center gap-4 text-sm">
            <a href="#workspace" className="landing-nav-link">
              how it works
            </a>
            <a href="/app" className="landing-nav-link">
              open workspace
            </a>
          </div>
        </div>
      </nav>

      <section
        id="top"
        className="hero-gradient dot-grid-light relative min-h-screen overflow-hidden px-6 pb-18 pt-28"
      >
        <div className="hero-glow absolute inset-0" />
        {showSecretBloom ? <div className="secret-bloom absolute inset-0" /> : null}

        <div className="hero-content-grid relative z-10 mx-auto grid w-full max-w-5xl gap-12 xl:gap-16 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="text-left">
            <div className={heroItemClass} style={delayStyle("--hero-delay", 1, HERO_ENTER_STEP_MS)}>
              <EmruMark size={58} />
            </div>
            <h1
              className={`${heroItemClass} mt-8 max-w-[11ch] font-display text-[clamp(2.5rem,6vw,5.4rem)] leading-[0.95] tracking-tight text-[var(--landing-hero-title)]`}
              style={delayStyle("--hero-delay", 2, HERO_ENTER_STEP_MS)}
            >
              your day, clearly arranged.
            </h1>
            <p
              className={`${heroItemClass} mt-6 max-w-xl text-lg leading-relaxed text-[var(--landing-hero-copy)] sm:text-[1.35rem]`}
              style={delayStyle("--hero-delay", 3, HERO_ENTER_STEP_MS)}
            >
              tasks, notes, and focus in one calm canvas. local-first from the
              start, with no account, no feed, and no pressure loops.
            </p>
            <p
              className={`${heroItemClass} hero-greeting mt-5 inline-flex`}
              style={delayStyle("--hero-delay", 3.5, HERO_ENTER_STEP_MS)}
            >
              {greeting}
            </p>
            <div
              className={`${heroItemClass} mt-9 flex flex-wrap items-center gap-4`}
              style={delayStyle("--hero-delay", 4, HERO_ENTER_STEP_MS)}
            >
              <a
                href="/app"
                className="landing-cta cta-shadow cta-delight pressable group inline-flex items-center gap-2.5 rounded-full px-8 py-3.5 text-base font-medium"
              >
                open workspace
                <span className="transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5">
                  <ArrowIcon />
                </span>
              </a>
              <a href="#workspace" className="landing-inline-link text-sm">
                see the canvas workflow
              </a>
            </div>
            <p
              className={`${heroItemClass} landing-hero-subtle mt-5 text-sm`}
              style={delayStyle("--hero-delay", 5, HERO_ENTER_STEP_MS)}
            >
              no signup. everything stays in your browser.
            </p>
          </div>

          <div
            className={`${heroItemClass} hero-preview-surface relative hidden min-h-[23rem] overflow-hidden p-5 lg:block`}
            style={delayStyle("--hero-delay", 3, HERO_ENTER_STEP_MS)}
          >
            <div className="text-xs tracking-[0.08em] text-muted-foreground">today board</div>
            <div className="mt-4 grid gap-0 border-y border-border/65">
              <div className="grid gap-2 py-3">
                <div className="font-display text-lg text-foreground">tasks</div>
                <div className="space-y-1.5 text-sm text-foreground/88">
                  <div className="opacity-45 line-through">draft project brief</div>
                  <div>review shared notes</div>
                  <div>ship one calm improvement</div>
                </div>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-4 border-t border-border/60 py-3">
                <div>
                  <div className="font-display text-lg text-foreground">notes</div>
                  <div className="mt-2 space-y-1.5">
                    <div className="h-2 rounded-full bg-foreground/12" />
                    <div className="h-2 w-4/5 rounded-full bg-foreground/12" />
                    <div className="h-2 w-2/3 rounded-full bg-foreground/12" />
                  </div>
                </div>
                <div className="flex min-h-[4.5rem] w-[5.5rem] items-center justify-center rounded-full border border-border/75 bg-secondary/58 px-3 font-mono text-base text-foreground">
                  23:10
                </div>
              </div>
            </div>
          </div>
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

      <div className="h-24 bg-gradient-to-b from-[var(--landing-transition-start)] to-background" />

      <main className="layout-main">
        <FeatureSection
          id="workspace"
          reducedMotion={prefersReducedMotion}
          className="feature-workspace"
          pill="canvas"
          title="your day, arranged your way"
          description="an infinite canvas with a dot grid. drag blocks anywhere, resize them, and let your spatial memory shape your workflow."
        >
          <div className="dot-grid-light rounded-panel relative aspect-[4/3] w-full max-w-xl overflow-hidden border border-border/60 bg-card p-7 shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
            <div className="floating-card absolute left-5 top-5 w-40 p-3">
              <div className="font-display text-lg">tasks</div>
              <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                <div className="h-2 rounded-full bg-foreground/10" />
                <div className="h-2 w-5/6 rounded-full bg-foreground/10" />
                <div className="h-2 w-2/3 rounded-full bg-foreground/10" />
              </div>
            </div>
            <div className="floating-card absolute bottom-7 right-7 w-30 p-3 text-center">
              <div className="font-display text-lg">focus</div>
              <div className="mx-auto mt-2 flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary/40 font-mono text-xs">
                25:00
              </div>
            </div>
            <div className="floating-card absolute right-[28%] top-[44%] w-36 p-3">
              <div className="font-display text-lg">notes</div>
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
          className="feature-focus"
          pill="focus"
          title="stay in the zone"
          description="a timer that tracks sessions, respects your pace, and nudges you gently when breaks begin. no noise, no pressure, just clear momentum."
          reverse
        >
          <div className="floating-card flex max-w-xs flex-col items-center p-8">
            <div className="timer-ring">
              <div className="timer-inner">
                <span className="font-mono text-3xl tabular-nums">17:30</span>
                <span className="mt-0.5 text-xs tracking-[0.1em] text-muted-foreground">
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
          className="feature-privacy"
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
            <div className="mt-4 space-y-2 font-mono text-sm text-muted-foreground">
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
                className="pressable rounded-full border border-border bg-secondary px-3.5 py-1.5 text-sm font-medium text-foreground/85 hover:border-primary/40"
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
              <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
                practical by default, thoughtful in the details
              </h2>
            </Reveal>
            <Reveal
              reducedMotion={prefersReducedMotion}
              delay={70}
              className="max-w-sm text-sm leading-relaxed text-muted-foreground"
            >
              the core loop is simple: capture what matters, arrange it in
              space, and move through your day with less friction.
            </Reveal>
          </div>
          <div className="feature-points-grid">
            <Reveal reducedMotion={prefersReducedMotion} delay={60} className="feature-points-list">
              <div className="divide-y divide-border/65 border-y border-border/65">
                {FEATURE_CARDS.map((feature, index) => (
                  <article key={feature.title} className="feature-point px-3 py-4 sm:px-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-display text-xl text-foreground">{feature.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                      <span className="mt-0.5 text-sm text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <p className="mt-2 text-sm text-foreground/75">{feature.proof}</p>
                  </article>
                ))}
              </div>
            </Reveal>
            <Reveal reducedMotion={prefersReducedMotion} delay={120} className="feature-rhythm-note">
              <aside className="h-full border-l border-border/70 pl-5">
                <p className="section-pill inline-flex">workflow cue</p>
                <h3 className="mt-4 font-display text-2xl text-foreground">one canvas, three rhythms</h3>
                <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <li>1. Capture a quick task or note the moment it appears.</li>
                  <li>2. Arrange blocks spatially so your next action is obvious.</li>
                  <li>3. Run a focus session and close the day without residue.</li>
                </ol>
              </aside>
            </Reveal>
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
          <h2 className="mt-6 font-display text-4xl text-[var(--landing-hero-title)] sm:text-5xl">
            start your day in one place
          </h2>
          <p className="mt-3 max-w-sm text-base text-[var(--landing-hero-copy)]">
            keep it light, private, and clear from the first block.
          </p>
          <a
            href="/app"
            className="landing-cta cta-shadow cta-delight pressable group mt-8 inline-flex items-center gap-2.5 rounded-full px-9 py-4 text-lg font-medium"
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
            <span className="font-display text-lg">emru</span>
          </a>
          <p className="text-sm text-muted-foreground">
            your day, your canvas - built for now
          </p>
        </footer>
      </Reveal>
    </div>
  )
}

export default App
