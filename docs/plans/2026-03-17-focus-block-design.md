# Focus Block Design (Polished Pomodoro)

Date: 2026-03-17
Status: Approved
Owner: OpenCode + user

## Problem and Outcome

Upgrade the canvas Focus block into a polished Pomodoro timer that stays calm, compact, and aligned with Emru's aesthetic.

Target outcome:
- Focus block supports configurable focus/rest durations.
- Session controls support start, pause, and restart.
- Session completion notifies with browser notification + subtle sound.
- Timer state resumes accurately from wall-clock time after reload.
- Compact mode is minimal (timer + start/pause only).
- Only one Focus block can exist at any time.

## User-Approved Decisions

- Session transition: stop on completion and wait for manual start of next phase.
- Completion notification: browser notification plus sound.
- Compact mode: show timer + start/pause only.
- Default durations: focus 25 minutes, rest 5 minutes.
- Reload behavior: resume from wall-clock elapsed time.
- Focus cardinality: enforce exactly one Focus block maximum.

## Approaches Considered

### A) Timestamp-driven session state (recommended)

Store phase/status/timestamps and derive remaining time from wall-clock.

Pros:
- Accurate across background tabs, throttling, and reload.
- Avoids countdown drift and effect chains.
- Aligns with Store -> Hook -> Component separation.

Cons:
- Slightly more modeling upfront.

### B) Interval-driven countdown state

Persist and decrement remaining seconds every tick.

Pros:
- Easy to start quickly.

Cons:
- Drift-prone and brittle on tab throttling.
- Encourages overuse of `useEffect` and state mirroring.

### C) Global timer service with subscriptions

Use centralized timer runtime and block subscriptions.

Pros:
- Potentially useful with many simultaneous timers.

Cons:
- Over-engineered for V1.
- Adds indirection and harms readability.

Decision: choose A.

## Architecture

Layers remain strict:

Store -> Hook -> Component

- Store (`blocks.store.ts`): persisted block data and pure state updates only.
- Hook (`useFocusBlock.ts`): timer orchestration, derived values, and action handlers.
- Component (`FocusBlock.tsx`): declarative rendering and event binding only.

### Single Focus Block Invariant

Enforce one Focus block across all entry points:

- Toolbar add action.
- Quick action panel add button.
- Keyboard shortcut (`F`).
- Starter layout creation.
- Any direct `addBlock("focus")` path.

Behavior when a Focus block already exists:
- Do not create a second block.
- Select and bring existing Focus block to front.
- Optionally center/fit attention if triggered from keyboard shortcut.

Persisted malformed state handling:
- If multiple Focus blocks are found at hydrate/sanitize time, keep one deterministic winner (highest `zIndex`, then newest id tie-break) and discard extras.

## Data Model

Extend Focus block data shape from simple seconds to explicit timer state.

```ts
interface FocusBlockData {
  title: string
  focusMinutes: number
  restMinutes: number
  phase: "focus" | "rest"
  status: "idle" | "running" | "paused"
  startedAt: number | null
  endsAt: number | null
  remainingMs: number
  compact: boolean
}
```

Defaults for new block:

```ts
focusMinutes: 25
restMinutes: 5
phase: "focus"
status: "idle"
startedAt: null
endsAt: null
remainingMs: 25 * 60 * 1000
compact: false
```

Validation and clamping:
- Clamp duration inputs to safe bounds (for example 1-180 minutes).
- Clamp `remainingMs` to valid per-phase duration bounds.
- Reject invalid persisted values and fall back to defaults.

## Interaction Design

### Expanded mode

- Header remains draggable, matching other blocks.
- Prominent timer readout in center.
- Phase label (`focus` / `rest`) with calm tone.
- Controls: Start/Pause toggle and Restart.
- Duration controls for focus and rest minutes.
- Compact toggle.

### Compact mode

- Display only timer and Start/Pause control.
- Keep drag handle affordance consistent with block language.
- Preserve same visual quality and spacing; no noisy chrome.

### Session lifecycle

- `start`: transitions idle/paused to running and sets timestamps.
- `pause`: freezes remaining time and clears active timestamps.
- `restart`: resets current phase duration and returns to idle.
- Completion while running:
  - Transition phase (`focus` <-> `rest`).
  - Reset remaining time for next phase.
  - Set status to idle (manual re-start required).
  - Trigger completion notification.

## Timer and Notification Flow

Timer truth source:
- Running state derives remaining time from `endsAt - Date.now()`.
- Paused/idle state uses stored `remainingMs`.

Reload recovery:
- On hook initialization, reconcile running session from timestamps.
- If wall-clock has already passed end, perform one deterministic completion transition and notify once.

Notification behavior:
- Primary: Browser Notification API (permission-aware).
- Secondary: subtle chime audio.
- Fallback: in-app toast if notification permission unavailable/denied.
- Errors from notification/audio APIs are caught and do not crash UI.

## Avoid useEffect and React Anti-Patterns

`useEffect` is an escape hatch, not a default tool.

Rules:
- If logic can be done in render, do it in render.
- If logic can happen in an event handler, do it in the handler.
- If state is derived, compute it with selectors or `useMemo`; do not mirror into state.
- Use `useEffect` only for external synchronization (timers, notifications, subscriptions, listeners).

Anti-patterns to reject:
- Derived state stored as local state.
- Effect chains (`effect -> setState -> effect`).
- Business orchestration inside component files.
- Prop-to-state syncing without explicit draft intent.
- Mutable in-place updates of arrays/objects/Map/Set.
- Blanket memoization without measured need.

Readable file test:
- If a junior developer cannot understand a file in ~60 seconds, simplify ownership and move logic to the proper layer.

## Error Handling and Resilience

- localStorage hydrate data is sanitized before use.
- Invalid persisted Focus timer state falls back to safe defaults.
- Audio playback rejections are swallowed gracefully (autoplay restrictions).
- No unhandled promise rejections in notification flow.
- Deleting the Focus block during active run leaves no orphaned intervals/listeners.

## Testing Strategy

Unit tests (pure logic):
- Remaining time computation from timestamps.
- Phase transition decision logic.
- Duration clamping and sanitization.

Store/sanitizer tests:
- Enforce single Focus block invariant.
- Deduplicate malformed persisted states with multiple Focus blocks.

Hook tests:
- `start`, `pause`, `restart`, `setFocusMinutes`, `setRestMinutes`, `toggleCompact`.
- Completion transition sets next phase + idle status.
- Rehydrate recovery from elapsed wall-clock time.

Integration checks:
- Triggering add-focus while one exists selects existing block.
- Compact mode displays timer + start/pause only.
- Browser notification and sound path are invoked on completion.

## Definition of Done

- Focus block is visually polished, compact, and consistent with Emru canvas styling.
- User can configure focus/rest durations.
- Start, pause, and restart are stable and predictable.
- End of session triggers browser notification + subtle sound with graceful fallback.
- Timer resumes correctly after reload using wall-clock reconciliation.
- App prevents creating multiple Focus blocks everywhere.
