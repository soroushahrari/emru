import { Component, type ReactNode } from "react"

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

const STORE_KEYS_TO_CLEAR = ["emru:blocks", "emru:canvas", "theme", "emru:settings"]

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  public override state: AppErrorBoundaryState = {
    hasError: false,
  }

  public static getDerivedStateFromError() {
    return { hasError: true }
  }

  public override componentDidCatch(error: Error) {
    console.error("Unexpected app error", error)
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleResetAndReload = () => {
    for (const key of STORE_KEYS_TO_CLEAR) {
      try {
        localStorage.removeItem(key)
      } catch {
        // ignore storage cleanup failures
      }
    }

    window.location.reload()
  }

  public override render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <main className="grid min-h-svh place-items-center bg-background px-4 text-foreground">
        <section className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-6 shadow-[0_14px_30px_rgba(0,0,0,0.12)]">
          <h1 className="font-display text-2xl text-foreground">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground [overflow-wrap:anywhere]">
            Emru hit an unexpected state. Reload to try again. If this keeps happening,
            reset local workspace data.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full bg-primary px-3.5 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
              onClick={this.handleReload}
            >
              reload app
            </button>
            <button
              type="button"
              className="rounded-full border border-border bg-secondary/70 px-3.5 py-1.5 text-sm hover:border-primary/40"
              onClick={this.handleResetAndReload}
            >
              reset local data
            </button>
          </div>
        </section>
      </main>
    )
  }
}
