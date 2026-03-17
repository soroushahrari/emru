# Focus Block Polished Pomodoro Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship a polished single-instance Focus block with configurable focus/rest durations, start-pause-restart controls, compact mode, session-end browser notification + sound, and wall-clock accurate resume after reload.

**Architecture:** Keep strict Store -> Hook -> Component layering. Store remains dumb and persistence-focused, timer orchestration lives in focused hooks and pure timer utilities, and `FocusBlock.tsx` stays render-first with no business logic. Enforce one Focus block invariant at creation points and sanitize malformed persisted states.

**Tech Stack:** React 19, TypeScript, Zustand persist, Vitest, Tailwind v4, existing canvas architecture.

---

References: @writing-plans

### Task 1: Extend focus data model with explicit timer state

**Files:**
- Modify: `src/types/block.types.ts`
- Modify: `src/lib/utils/block-sanitizers.ts`
- Modify: `src/lib/utils/block-sanitizers.test.ts`

**Step 1: Write the failing test**

Add test coverage for new Focus defaults and clamping:

```ts
it("normalizes focus timer fields", () => {
  const focus = sanitizeBlock({
    id: "f1",
    type: "focus",
    x: 0,
    y: 0,
    width: 280,
    height: 180,
    zIndex: 10,
    data: {
      title: "focus",
      focusMinutes: 999,
      restMinutes: -4,
      phase: "oops",
      status: "wat",
      remainingMs: Number.POSITIVE_INFINITY,
      compact: "yes",
    },
  })

  expect(focus?.type).toBe("focus")
  expect(focus?.data.phase).toBe("focus")
  expect(focus?.data.status).toBe("idle")
  expect(focus?.data.focusMinutes).toBeLessThanOrEqual(180)
  expect(focus?.data.restMinutes).toBeGreaterThanOrEqual(1)
  expect(typeof focus?.data.compact).toBe("boolean")
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/lib/utils/block-sanitizers.test.ts`
Expected: FAIL because Focus type and sanitizer do not contain new fields.

**Step 3: Write minimal implementation**

- Expand `FocusBlockData` with:
  - `focusMinutes`, `restMinutes`
  - `phase`, `status`
  - `startedAt`, `endsAt`, `remainingMs`
  - `compact`
- Add sanitizer support and defaults (25/5, idle, phase focus).
- Clamp duration ranges and normalize invalid enum values.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/lib/utils/block-sanitizers.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/types/block.types.ts src/lib/utils/block-sanitizers.ts src/lib/utils/block-sanitizers.test.ts
git commit -m "feat(focus): extend timer data model and sanitizer defaults"
```

### Task 2: Add pure timer utility functions (wall-clock logic)

**Files:**
- Create: `src/lib/utils/focus-timer.ts`
- Create: `src/lib/utils/focus-timer.test.ts`

**Step 1: Write the failing test**

Add tests for deterministic timer math:

```ts
it("computes running remaining from endsAt", () => {
  const now = 1_700_000_000_000
  const remaining = getRemainingMs({ status: "running", endsAt: now + 30_000, remainingMs: 0 }, now)
  expect(remaining).toBe(30_000)
})

it("transitions to next phase when elapsed", () => {
  const next = transitionOnComplete({ phase: "focus", focusMinutes: 25, restMinutes: 5 })
  expect(next.phase).toBe("rest")
  expect(next.remainingMs).toBe(5 * 60 * 1000)
  expect(next.status).toBe("idle")
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/lib/utils/focus-timer.test.ts`
Expected: FAIL because utility module does not exist.

**Step 3: Write minimal implementation**

Implement pure helpers:
- `phaseDurationMs(phase, focusMinutes, restMinutes)`
- `getRemainingMs(timerState, now)`
- `startSession(timerState, now)`
- `pauseSession(timerState, now)`
- `restartSession(timerState)`
- `transitionOnComplete(timerState)`
- `reconcileAfterResume(timerState, now)`

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/lib/utils/focus-timer.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/utils/focus-timer.ts src/lib/utils/focus-timer.test.ts
git commit -m "feat(focus): add pure wall-clock timer utility functions"
```

### Task 3: Enforce single Focus block invariant in create flows

**Files:**
- Modify: `src/components/canvas/Canvas.tsx`
- Modify: `src/hooks/useKeyboardShortcuts.ts`
- Modify: `src/components/toolbar/Toolbar.tsx`
- Modify: `src/store/blocks.store.ts`
- Create: `src/store/blocks.store.focus.test.ts`

**Step 1: Write the failing test**

Add store-level invariant test:

```ts
it("keeps only one focus block when persisted state has duplicates", () => {
  const sanitized = dedupeFocusBlocks({
    a: makeFocus("a", 10),
    b: makeFocus("b", 20),
  })
  const focusBlocks = Object.values(sanitized).filter((b) => b.type === "focus")
  expect(focusBlocks).toHaveLength(1)
  expect(focusBlocks[0].id).toBe("b")
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/store/blocks.store.focus.test.ts`
Expected: FAIL because dedupe behavior is not implemented.

**Step 3: Write minimal implementation**

- Add helper in store/sanitizer path to keep exactly one Focus block.
- Update add-focus entry points:
  - If focus exists, select + bring-to-front existing block.
  - Do not create second Focus block.
- Disable/hint add-focus in toolbar menu once focus exists.
- Ensure keyboard `f` does select-existing behavior.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/store/blocks.store.focus.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/canvas/Canvas.tsx src/hooks/useKeyboardShortcuts.ts src/components/toolbar/Toolbar.tsx src/store/blocks.store.ts src/store/blocks.store.focus.test.ts
git commit -m "feat(focus): enforce single focus block across all add paths"
```

### Task 4: Build focus hook actions and derived state (logic-only)

**Files:**
- Modify: `src/components/blocks/FocusBlock/useFocusBlock.ts`
- Create: `src/components/blocks/FocusBlock/useFocusBlock.test.ts`

**Step 1: Write the failing test**

Add hook behavior tests:

```ts
it("starts a focus session with timestamps", () => {
  const { result } = renderHook(() => useFocusBlock("focus-1"))
  act(() => result.current.start())
  expect(result.current.block?.data.status).toBe("running")
  expect(result.current.block?.data.startedAt).not.toBeNull()
  expect(result.current.block?.data.endsAt).not.toBeNull()
})

it("pauses and stores remainingMs", () => {
  const { result } = renderHook(() => useFocusBlock("focus-1"))
  act(() => result.current.pause())
  expect(result.current.block?.data.status).toBe("paused")
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/components/blocks/FocusBlock/useFocusBlock.test.ts`
Expected: FAIL because hook does not expose timer actions.

**Step 3: Write minimal implementation**

Expose from hook:
- `remainingMs`, `remainingLabel`, `progress`
- actions: `start`, `pause`, `restart`, `toggleRunState`
- settings: `setFocusMinutes`, `setRestMinutes`, `toggleCompact`
- computed flags: `isRunning`, `phase`, `isCompact`

Keep all business decisions in hook, no store cross-import logic.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/components/blocks/FocusBlock/useFocusBlock.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/blocks/FocusBlock/useFocusBlock.ts src/components/blocks/FocusBlock/useFocusBlock.test.ts
git commit -m "feat(focus): add timer orchestration actions in focus hook"
```

### Task 5: Add session-end notifications (browser + subtle chime)

**Files:**
- Create: `src/lib/notifications/focus-notifications.ts`
- Create: `src/lib/notifications/focus-notifications.test.ts`
- Modify: `src/components/blocks/FocusBlock/useFocusBlock.ts`

**Step 1: Write the failing test**

Add tests with API mocks:

```ts
it("uses browser notification when permission is granted", async () => {
  await notifyFocusSessionEnded("rest")
  expect(Notification).toHaveBeenCalled()
})

it("falls back safely when Notification is unavailable", async () => {
  // remove global Notification
  await expect(notifyFocusSessionEnded("focus")).resolves.toBeUndefined()
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/lib/notifications/focus-notifications.test.ts`
Expected: FAIL because notification helper does not exist.

**Step 3: Write minimal implementation**

- Implement `notifyFocusSessionEnded(nextPhase)` helper:
  - permission-aware browser notification
  - subtle chime attempt via Audio API
  - graceful catch on rejected playback/permission errors
- Wire hook to call helper exactly once on completion transition.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/lib/notifications/focus-notifications.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/notifications/focus-notifications.ts src/lib/notifications/focus-notifications.test.ts src/components/blocks/FocusBlock/useFocusBlock.ts
git commit -m "feat(focus): notify session completion with browser alert and chime"
```

### Task 6: Redesign Focus block UI for polished expanded + compact modes

**Files:**
- Modify: `src/components/blocks/FocusBlock/FocusBlock.tsx`
- Create: `src/components/blocks/FocusBlock/FocusBlock.test.tsx`
- Modify: `src/index.css`

**Step 1: Write the failing test**

Add render tests:

```tsx
it("renders compact mode with timer and toggle button only", () => {
  render(<FocusBlock ... />)
  expect(screen.getByText(/\d{2}:\d{2}/)).toBeInTheDocument()
  expect(screen.getByRole("button", { name: /start|pause/i })).toBeInTheDocument()
  expect(screen.queryByLabelText(/focus minutes/i)).not.toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/components/blocks/FocusBlock/FocusBlock.test.tsx`
Expected: FAIL because UI does not expose the new controls.

**Step 3: Write minimal implementation**

- Render expanded layout with:
  - phase label
  - large timer
  - start/pause and restart controls
  - focus/rest minute inputs
  - compact toggle
- Render compact layout with timer + start/pause only.
- Keep visual language calm and aligned with existing block aesthetics.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/components/blocks/FocusBlock/FocusBlock.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/blocks/FocusBlock/FocusBlock.tsx src/components/blocks/FocusBlock/FocusBlock.test.tsx src/index.css
git commit -m "feat(focus): ship polished pomodoro UI with compact mode"
```

### Task 7: Reconcile running sessions on reload without effect anti-patterns

**Files:**
- Modify: `src/components/blocks/FocusBlock/useFocusBlock.ts`
- Modify: `src/lib/utils/focus-timer.ts`
- Create: `src/components/blocks/FocusBlock/useFocusBlock.reconcile.test.ts`

**Step 1: Write the failing test**

Add resume/reconcile tests:

```ts
it("reconciles elapsed session after reload to next phase idle", () => {
  seedRunningFocusBlock({ phase: "focus", endsAt: Date.now() - 5_000 })
  const { result } = renderHook(() => useFocusBlock("focus-1"))
  expect(result.current.phase).toBe("rest")
  expect(result.current.isRunning).toBe(false)
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/components/blocks/FocusBlock/useFocusBlock.reconcile.test.ts`
Expected: FAIL because reconciliation flow is incomplete.

**Step 3: Write minimal implementation**

- Add hook initialization reconciliation using pure utility.
- Ensure no effect chains; only one synchronization effect for external timer tick + cleanup.
- Prevent duplicate completion notifications for the same elapsed session.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/components/blocks/FocusBlock/useFocusBlock.reconcile.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/blocks/FocusBlock/useFocusBlock.ts src/lib/utils/focus-timer.ts src/components/blocks/FocusBlock/useFocusBlock.reconcile.test.ts
git commit -m "fix(focus): reconcile elapsed sessions accurately after reload"
```

### Task 8: Final integration checks for single-instance and UX entry points

**Files:**
- Modify: `src/components/canvas/Canvas.tsx`
- Modify: `src/components/toolbar/Toolbar.tsx`
- Modify: `src/hooks/useKeyboardShortcuts.ts`
- Create: `src/components/canvas/Canvas.focus.integration.test.tsx`
- Create: `docs/testing/focus-block-manual-checklist.md`

**Step 1: Write the failing test**

Add integration assertions:

```tsx
it("pressing f with existing focus selects existing block instead of creating one", async () => {
  render(<Canvas />)
  fireEvent.keyDown(document, { key: "f" })
  fireEvent.keyDown(document, { key: "f" })
  expect(getFocusBlocksFromStore()).toHaveLength(1)
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/components/canvas/Canvas.focus.integration.test.tsx`
Expected: FAIL before final wiring and disabled menu states are complete.

**Step 3: Write minimal implementation**

- Finalize disabled/hint states for add-focus controls.
- Ensure all add entry points route through same single-instance guard.
- Add manual QA checklist for timer, notification, reload, compact mode, and one-focus invariant.

**Step 4: Run full verification suite**

Run:
- `pnpm test`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`

Expected: PASS with no type errors and successful production build.

**Step 5: Commit**

```bash
git add src/components/canvas/Canvas.tsx src/components/toolbar/Toolbar.tsx src/hooks/useKeyboardShortcuts.ts src/components/canvas/Canvas.focus.integration.test.tsx docs/testing/focus-block-manual-checklist.md
git commit -m "feat(focus): finalize single-instance pomodoro flow and QA checklist"
```

## Completion Criteria

Before marking implementation complete, verify:
- Focus block supports focus/rest duration edits, start, pause, restart.
- Session end stops and waits for manual restart in next phase.
- Browser notification + subtle chime path runs on completion with graceful fallback.
- Timer remains accurate across tab backgrounding and reload.
- Compact mode shows timer + start/pause only.
- Creating multiple Focus blocks is impossible from toolbar, quick actions, shortcut, and starter flows.
