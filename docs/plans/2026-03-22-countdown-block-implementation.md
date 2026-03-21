# Countdown Block Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship a new Countdown canvas block with a typographic hero layout, inline label/date editing, date-only countdown math, original-creation-based progress dots, and full local persistence through the existing blocks store.

**Architecture:** Keep Countdown aligned with the current Store -> Hook -> Component split. Persist only `label`, `targetDate`, and `createdAt` in the blocks store, move all date math into a pure utility module, and let `useCountdownBlock` bridge store updates with minute-based recalculation for the UI.

**Tech Stack:** React 19, TypeScript, Vite, Zustand, Tailwind v4, shadcn/ui primitives already in repo, Testing Library, Vitest, jsdom.

---

References: @writing-plans, `docs/plans/2026-03-22-countdown-block-design.md`

### Task 1: Extend the block contract and sanitizer for `countdown`

**Files:**
- Modify: `src/types/block.types.ts`
- Modify: `src/lib/utils/block-sanitizers.ts`
- Modify: `src/lib/utils/block-sanitizers.test.ts`

**Step 1: Write the failing test**

Add sanitizer coverage for a malformed countdown payload and for countdown size bounds.

```ts
const countdown = sanitizeBlock({
  id: "",
  type: "countdown",
  x: 0,
  y: 0,
  width: 10,
  height: 10,
  zIndex: 0,
  data: {
    label: "   ",
    targetDate: "not-a-date",
    createdAt: "bad-iso",
  },
})

expect(countdown?.type).toBe("countdown")
if (!countdown || countdown.type !== "countdown") {
  throw new Error("expected countdown block")
}
expect(countdown.data.label).toBe("Countdown")
expect(countdown.data.targetDate).toBeNull()
expect(countdown.data.createdAt.length).toBeGreaterThan(0)
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/lib/utils/block-sanitizers.test.ts`
Expected: FAIL because `countdown` is not a valid block type yet.

**Step 3: Write minimal implementation**

- Add `countdown` to `BlockType`.
- Add:

```ts
export interface CountdownBlockData {
  label: string
  targetDate: string | null
  createdAt: string
}
```

- Add a `CountdownBlock` union member.
- Add countdown size bounds close to the approved shape:
  - `defaultWidth: 200`
  - `defaultHeight: 220`
  - `minWidth: 180`
  - `minHeight: 200`
  - `maxWidth: 420`
  - `maxHeight: 420`
- Add sanitizer support:
  - trim and bound `label`
  - normalize `targetDate` to `YYYY-MM-DD | null`
  - validate `createdAt` as a real ISO timestamp
  - fall back to `new Date().toISOString()` when invalid

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/lib/utils/block-sanitizers.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/types/block.types.ts src/lib/utils/block-sanitizers.ts src/lib/utils/block-sanitizers.test.ts
git commit -m "feat(countdown): add countdown block contract and sanitizer"
```

### Task 2: Add pure countdown date and progress utilities

**Files:**
- Create: `src/lib/utils/countdown.ts`
- Create: `src/lib/utils/countdown.test.ts`

**Step 1: Write the failing test**

Create utility tests that lock down:
- date-only normalization
- future/today/past day diffs
- unit selection for days, weeks, months
- progress dots using original `createdAt`

```ts
import { describe, expect, it, vi } from "vitest"
import { getCountdownSnapshot } from "@/lib/utils/countdown"

describe("getCountdownSnapshot", () => {
  it("shows weeks for 14 to 89 days and preserves createdAt-based progress", () => {
    vi.setSystemTime(new Date("2026-03-22T09:00:00.000Z"))

    const snapshot = getCountdownSnapshot({
      targetDate: "2026-04-19",
      createdAt: "2026-03-15T12:00:00.000Z",
      now: new Date(),
    })

    expect(snapshot.mode).toBe("future")
    expect(snapshot.unit).toBe("weeks")
    expect(snapshot.value).toBe(4)
    expect(snapshot.activeDots).toBeGreaterThanOrEqual(1)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/lib/utils/countdown.test.ts`
Expected: FAIL because the utility module does not exist yet.

**Step 3: Write minimal implementation**

Create `src/lib/utils/countdown.ts` with small pure helpers:

```ts
export interface CountdownSnapshot {
  mode: "empty" | "future" | "today" | "past"
  diffDays: number | null
  value: number | null
  unit: "days" | "weeks" | "months" | null
  pastLabel: string | null
  activeDots: number
}
```

Implement:
- `toLocalDateStart(value: Date | string): Date`
- `getDateDiffInDays(targetDate: string, now: Date): number`
- `getCountdownSnapshot({ targetDate, createdAt, now })`

Rules to encode:
- `>= 90` days => rounded months
- `14..89` => rounded weeks
- `1..13` => exact days
- `0` => `today`
- `< 0` => `X days ago`
- no divide-by-zero for same-day creation/target combinations

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/lib/utils/countdown.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/utils/countdown.ts src/lib/utils/countdown.test.ts
git commit -m "feat(countdown): add countdown date and progress utilities"
```

### Task 3: Build the Countdown store hook with inline update actions

**Files:**
- Create: `src/components/blocks/CountdownBlock/useCountdownBlock.ts`
- Create: `src/components/blocks/CountdownBlock/useCountdownBlock.test.tsx`

**Step 1: Write the failing test**

Create hook tests that verify:
- it returns `null` for missing or wrong block type
- it derives snapshot state from store data
- `setLabel` trims and persists
- `setTargetDate` persists the new date but does not rewrite `createdAt`
- minute refresh updates derived state over time

```tsx
import { renderHook, act } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useBlocksStore } from "@/store/blocks.store"
import { useCountdownBlock } from "./useCountdownBlock"

it("updates targetDate without changing createdAt", () => {
  const createdAt = "2026-03-01T10:00:00.000Z"
  // seed store with a countdown block

  const { result } = renderHook(() => useCountdownBlock("countdown-1"))

  act(() => {
    result.current?.setTargetDate("2026-04-10")
  })

  expect(useBlocksStore.getState().blocks["countdown-1"]).toMatchObject({
    data: { targetDate: "2026-04-10", createdAt },
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/components/blocks/CountdownBlock/useCountdownBlock.test.tsx`
Expected: FAIL because the hook does not exist yet.

**Step 3: Write minimal implementation**

Implement `useCountdownBlock.ts` so it:
- selects the countdown block from Zustand
- exposes `setLabel(nextLabel: string)`
- exposes `setTargetDate(nextDate: string | null)`
- keeps `createdAt` untouched
- stores a local `now` state
- recalculates `snapshot` on mount and every minute with `setInterval`
- clears the interval on unmount

Return shape:

```ts
return {
  block,
  snapshot,
  setLabel,
  setTargetDate,
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/components/blocks/CountdownBlock/useCountdownBlock.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/blocks/CountdownBlock/useCountdownBlock.ts src/components/blocks/CountdownBlock/useCountdownBlock.test.tsx
git commit -m "feat(countdown): add countdown block state hook"
```

### Task 4: Build the Countdown block component and countdown-specific styles

**Files:**
- Create: `src/components/blocks/CountdownBlock/CountdownBlock.tsx`
- Create: `src/components/blocks/CountdownBlock/CountdownBlock.test.tsx`
- Create: `src/components/blocks/CountdownBlock/index.ts`
- Modify: `src/index.css`

**Step 1: Write the failing test**

Create component tests for:
- empty state shows `set a date` and a visible date input
- future state shows hero number, unit, and correct dot count
- today state hides the number and shows `today`
- past state shows `days ago` and no dots
- clicking the label enters edit mode

```tsx
render(
  <CountdownBlock
    blockId="countdown-1"
    selected={false}
    isDragging={false}
    landed={false}
    dragHandleProps={{}}
  />
)

expect(screen.getByText("set a date")).toBeInTheDocument()
expect(screen.getByLabelText("Countdown date")).toBeInTheDocument()
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/components/blocks/CountdownBlock/CountdownBlock.test.tsx`
Expected: FAIL because the component does not exist yet.

**Step 3: Write minimal implementation**

Create `CountdownBlock.tsx` following the same prop contract used by `TasksBlock`, `NotesBlock`, and `FocusBlock`.

Render rules:
- Reuse `canvas-block-shell`, hover-revealed resize grip, and current header pattern.
- Header title is always `Countdown`.
- Use inline input for the body label.
- Use native `<input type="date">` for the date editor with `aria-label="Countdown date"`.
- Use `font-family: inherit` on the hero number.
- Keep hero content centered at all sizes.

Add countdown CSS to `src/index.css`:
- countdown-specific entrance animation class if needed to match the approved cubic-bezier
- today pulse keyframes
- edit-mode fade transition
- dot row and dot active/inactive styles

Keep reduced-motion handling inside the existing `@media (prefers-reduced-motion: reduce)` section.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/components/blocks/CountdownBlock/CountdownBlock.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/blocks/CountdownBlock/CountdownBlock.tsx src/components/blocks/CountdownBlock/CountdownBlock.test.tsx src/components/blocks/CountdownBlock/index.ts src/index.css
git commit -m "feat(countdown): add countdown block component"
```

### Task 5: Wire Countdown into block rendering and creation surfaces

**Files:**
- Modify: `src/components/blocks/index.ts`
- Modify: `src/components/canvas/TransformLayer.tsx`
- Modify: `src/components/canvas/Canvas.tsx`
- Modify: `src/components/toolbar/Toolbar.tsx`
- Modify: `src/hooks/useKeyboardShortcuts.ts`
- Create: `src/components/canvas/TransformLayer.test.tsx`

**Step 1: Write the failing test**

Add a render-path smoke test that seeds the store with a countdown block and verifies `TransformLayer` renders the countdown shell.

```tsx
render(<TransformLayer transition={null} />)
expect(screen.getByText("Countdown")).toBeInTheDocument()
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/components/canvas/TransformLayer.test.tsx`
Expected: FAIL because the transform layer cannot render countdown blocks yet.

**Step 3: Write minimal implementation**

- Export `CountdownBlock` from `src/components/blocks/index.ts`.
- Add a `countdown` branch to `TransformLayer.tsx`.
- Extend `Canvas.tsx#createBlock` to create countdown blocks with:

```ts
data: {
  label: "Countdown",
  targetDate: null,
  createdAt: new Date().toISOString(),
}
```

- Add Countdown to the toolbar add menu and shortcut copy.
- Add a keyboard shortcut in `useKeyboardShortcuts.ts`; use `c` unless another local convention conflicts.
- Update any helper text in `Canvas.tsx` that currently advertises only `t`, `n`, and `f`.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/components/canvas/TransformLayer.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/blocks/index.ts src/components/canvas/TransformLayer.tsx src/components/canvas/Canvas.tsx src/components/toolbar/Toolbar.tsx src/hooks/useKeyboardShortcuts.ts src/components/canvas/TransformLayer.test.tsx
git commit -m "feat(countdown): wire countdown into canvas add flows"
```

### Task 6: Run focused verification and fix any countdown regressions

**Files:**
- Modify as needed based on failing verification steps from Tasks 1-5.

**Step 1: Run the focused test set**

Run:

```bash
pnpm test -- src/lib/utils/block-sanitizers.test.ts src/lib/utils/countdown.test.ts src/components/blocks/CountdownBlock/useCountdownBlock.test.tsx src/components/blocks/CountdownBlock/CountdownBlock.test.tsx src/components/canvas/TransformLayer.test.tsx
```

Expected: PASS.

**Step 2: Run broader safety checks**

Run:

```bash
pnpm test
pnpm typecheck
pnpm build
```

Expected:
- tests PASS
- typecheck PASS
- build PASS

**Step 3: Fix the smallest failing surface if anything breaks**

- If a sanitizer test fails, patch `src/lib/utils/block-sanitizers.ts`.
- If a rendering test fails, patch the countdown component or transform-layer wiring.
- If typecheck fails, prefer tightening block discriminated unions instead of casting.

**Step 4: Re-run the failed command until it passes**

Re-run only the previously failing command first, then re-run `pnpm build`.

**Step 5: Commit**

```bash
git add src/types/block.types.ts src/lib/utils/block-sanitizers.ts src/lib/utils/block-sanitizers.test.ts src/lib/utils/countdown.ts src/lib/utils/countdown.test.ts src/components/blocks/CountdownBlock src/components/blocks/index.ts src/components/canvas/TransformLayer.tsx src/components/canvas/Canvas.tsx src/components/toolbar/Toolbar.tsx src/hooks/useKeyboardShortcuts.ts src/index.css
git commit -m "feat(countdown): ship countdown canvas block"
```
