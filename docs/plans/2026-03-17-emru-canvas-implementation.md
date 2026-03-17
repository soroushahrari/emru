# Emru Canvas Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship the Emru workspace canvas at `/app` with smooth pan/zoom/drag/resize/select interactions while preserving the landing page at `/`.

**Architecture:** Use strict Store -> Hook -> Component layering. Keep canvas view state in `canvas.store.ts`, block entities/history in `blocks.store.ts`, and place all behavioral orchestration inside focused hooks. Components remain render-only and memoized.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind v4, Zustand, `@use-gesture/react`, `@dnd-kit/core`, React Router, Vitest.

---

References: @writing-plans

### Task 1: Bootstrap dependencies and test harness

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`

**Step 1: Write the failing test**

Create `src/lib/utils/canvas.utils.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { toCanvas } from "@/lib/utils/canvas.utils"

describe("toCanvas", () => {
  it("converts screen coordinates to canvas coordinates", () => {
    expect(toCanvas(500, 300, 100, 50, 2)).toEqual({ x: 200, y: 125 })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/utils/canvas.utils.test.ts`
Expected: FAIL because Vitest and/or `canvas.utils` module are not configured yet.

**Step 3: Write minimal implementation**

- Add runtime deps: `zustand`, `@use-gesture/react`, `@dnd-kit/core`, `react-router-dom`, `zod`.
- Add dev deps: `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`.
- Add scripts:
  - `test`: `vitest run`
  - `test:watch`: `vitest`
- Add `vitest.config.ts` and `src/test/setup.ts` with `@testing-library/jest-dom` import.

**Step 4: Run test to verify harness works**

Run: `pnpm test -- src/lib/utils/canvas.utils.test.ts`
Expected: FAIL now for missing `@/lib/utils/canvas.utils` only (harness is active).

**Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts src/test/setup.ts src/lib/utils/canvas.utils.test.ts
git commit -m "chore(canvas): add canvas dependencies and test harness"
```

### Task 2: Add app routing and preserve landing page

**Files:**
- Create: `src/app/router.tsx`
- Create: `src/pages/LandingPage.tsx`
- Create: `src/pages/CanvasPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`
- Create: `src/app/router.test.tsx`

**Step 1: Write the failing test**

Create route test verifying:
- `/` renders landing heading text.
- `/app` renders canvas page shell heading.

```tsx
it("renders canvas page on /app", async () => {
  window.history.pushState({}, "", "/app")
  render(<AppRouter />)
  expect(await screen.findByText(/workspace canvas/i)).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/app/router.test.tsx`
Expected: FAIL because router and pages do not exist yet.

**Step 3: Write minimal implementation**

- Move current landing JSX into `LandingPage`.
- Build `AppRouter` with routes for `/` and `/app`.
- Add `CanvasPage` placeholder shell (`Workspace Canvas`).
- Render router from `main.tsx`.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/app/router.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/app/router.tsx src/pages/LandingPage.tsx src/pages/CanvasPage.tsx src/App.tsx src/main.tsx src/app/router.test.tsx
git commit -m "feat(app): add routes for landing and canvas workspace"
```

### Task 3: Define canvas and block types plus utility math

**Files:**
- Create: `src/types/canvas.types.ts`
- Create: `src/types/block.types.ts`
- Create: `src/lib/utils/canvas.utils.ts`
- Modify: `src/lib/utils/canvas.utils.test.ts`

**Step 1: Write the failing test**

Add tests for:
- `toCanvas`
- `toScreen`
- `getBlocksBoundingBox`
- `getFitTransform`

```ts
expect(getFitTransform(bbox, 1280, 720, 80)).toEqual({ zoom: 0.8, offsetX: 160, offsetY: 100 })
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/lib/utils/canvas.utils.test.ts`
Expected: FAIL because functions/types are missing.

**Step 3: Write minimal implementation**

- Add discriminated union block types (`tasks`, `notes`, `focus`).
- Implement pure typed utility functions for conversion and bbox math.
- Clamp fit zoom to `[0.2, 1.0]`.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/lib/utils/canvas.utils.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/types/canvas.types.ts src/types/block.types.ts src/lib/utils/canvas.utils.ts src/lib/utils/canvas.utils.test.ts
git commit -m "feat(canvas): add typed coordinate and fit math utilities"
```

### Task 4: Implement canvas store with exact zoomAround behavior

**Files:**
- Create: `src/store/canvas.store.ts`
- Create: `src/store/canvas.store.test.ts`

**Step 1: Write the failing test**

Test cases:
- `setOffset` and `setZoom` mutate state.
- `zoomAround` keeps cursor anchor stable and clamps zoom.
- Selection helpers and tool setters work.

```ts
it("zooms around screen point without drift", () => {
  const store = useCanvasStore.getState()
  store.setOffset(100, 60)
  store.setZoom(1)
  store.zoomAround(1.5, 400, 300)
  expect(useCanvasStore.getState().offsetX).toBeCloseTo(-50)
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/store/canvas.store.test.ts`
Expected: FAIL because store file does not exist.

**Step 3: Write minimal implementation**

- Implement `CanvasStore` shape from design.
- Include `activeCursor` field.
- Implement `zoomAround` using the exact approved formula.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/store/canvas.store.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/store/canvas.store.ts src/store/canvas.store.test.ts
git commit -m "feat(canvas): add viewport store with cursor-anchored zoom"
```

### Task 5: Implement blocks store, z-order, and undo snapshots

**Files:**
- Create: `src/store/blocks.store.ts`
- Create: `src/store/blocks.store.test.ts`

**Step 1: Write the failing test**

Test cases:
- Add/update/remove/move/resize block actions.
- `bringToFront` increments `nextZ`.
- Undo restores previous snapshot.
- Stack caps at 50.

```ts
it("caps undo history at 50 snapshots", () => {
  // push 60 snapshots
  expect(useBlocksStore.getState().history.length).toBe(50)
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/store/blocks.store.test.ts`
Expected: FAIL because store is missing.

**Step 3: Write minimal implementation**

- Add block entity map + id list + `nextZ`.
- Add history stack storing `{ blocks, description }` snapshots.
- Add undo action for `Cmd/Ctrl+Z` target.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/store/blocks.store.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/store/blocks.store.ts src/store/blocks.store.test.ts
git commit -m "feat(blocks): add block entity store with undo snapshots"
```

### Task 6: Build canvas shell components and transform layer

**Files:**
- Create: `src/components/canvas/Canvas.tsx`
- Create: `src/components/canvas/TransformLayer.tsx`
- Create: `src/components/canvas/SelectionRect.tsx`
- Create: `src/components/canvas/ZoomControls.tsx`
- Create: `src/components/canvas/Minimap.tsx`
- Modify: `src/pages/CanvasPage.tsx`
- Modify: `src/index.css`

**Step 1: Write the failing test**

Create component test asserting:
- transform layer uses `translate(...) scale(...)` style.
- root layer has dot-grid style variables.

```tsx
expect(screen.getByTestId("transform-layer")).toHaveStyle({ transformOrigin: "0 0" })
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/components/canvas/Canvas.test.tsx`
Expected: FAIL because canvas components are missing.

**Step 3: Write minimal implementation**

- Build the two-layer structure.
- Keep root fixed full-screen and transform layer as single transformed div.
- Add permanent `will-change: transform` to transform layer only.
- Render placeholders for overlays (selection, zoom, minimap).

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/components/canvas/Canvas.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/canvas/Canvas.tsx src/components/canvas/TransformLayer.tsx src/components/canvas/SelectionRect.tsx src/components/canvas/ZoomControls.tsx src/components/canvas/Minimap.tsx src/pages/CanvasPage.tsx src/index.css src/components/canvas/Canvas.test.tsx
git commit -m "feat(canvas): scaffold layered canvas workspace UI"
```

### Task 7: Implement gesture handling hook

**Files:**
- Create: `src/hooks/useCanvasGestures.ts`
- Modify: `src/components/canvas/Canvas.tsx`
- Create: `src/hooks/useCanvasGestures.test.ts`

**Step 1: Write the failing test**

Test behavior-level handlers:
- Wheel + modifier calls `zoomAround`.
- Wheel without modifier pans.
- Pinch uses start memo value.
- Background drag pans only in pan mode or while space-held.

```ts
expect(zoomAroundMock).toHaveBeenCalledWith(expect.any(Number), 400, 300)
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/hooks/useCanvasGestures.test.ts`
Expected: FAIL because hook does not exist.

**Step 3: Write minimal implementation**

- Bind `useGesture` on root layer element.
- Prevent default for wheel events.
- Implement exact wheel/pinch/drag equations from design.
- Use refs for temporary space-pan state.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/hooks/useCanvasGestures.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/hooks/useCanvasGestures.ts src/components/canvas/Canvas.tsx src/hooks/useCanvasGestures.test.ts
git commit -m "feat(canvas): add wheel pinch and pan gesture handling"
```

### Task 8: Render blocks and implement drag + z-order

**Files:**
- Create: `src/hooks/useBlockDrag.ts`
- Create: `src/components/blocks/TasksBlock/TasksBlock.tsx`
- Create: `src/components/blocks/TasksBlock/useTasksBlock.ts`
- Create: `src/components/blocks/NotesBlock/NotesBlock.tsx`
- Create: `src/components/blocks/NotesBlock/useNotesBlock.ts`
- Create: `src/components/blocks/FocusBlock/FocusBlock.tsx`
- Create: `src/components/blocks/FocusBlock/useFocusBlock.ts`
- Modify: `src/components/canvas/TransformLayer.tsx`
- Create: `src/components/canvas/TransformLayer.test.tsx`

**Step 1: Write the failing test**

Test that dragging applies `delta / zoom` conversion and `bringToFront` is called.

```ts
expect(moveBlockMock).toHaveBeenCalledWith("b1", 140, 90)
expect(bringToFrontMock).toHaveBeenCalledWith("b1")
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/components/canvas/TransformLayer.test.tsx`
Expected: FAIL because block rendering and drag logic are missing.

**Step 3: Write minimal implementation**

- Render blocks with explicit type switch.
- Add header-only drag handle.
- Use `@dnd-kit/core` drag lifecycle.
- During active drag: block shadow + zIndex boost + transform layer `pointer-events: none`.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/components/canvas/TransformLayer.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/hooks/useBlockDrag.ts src/components/blocks src/components/canvas/TransformLayer.tsx src/components/canvas/TransformLayer.test.tsx
git commit -m "feat(blocks): render draggable blocks with z-order behavior"
```

### Task 9: Implement resize interactions and block enter/exit animation

**Files:**
- Create: `src/hooks/useBlockResize.ts`
- Modify: `src/components/blocks/TasksBlock/TasksBlock.tsx`
- Modify: `src/components/blocks/NotesBlock/NotesBlock.tsx`
- Modify: `src/components/blocks/FocusBlock/FocusBlock.tsx`
- Modify: `src/index.css`
- Create: `src/hooks/useBlockResize.test.ts`

**Step 1: Write the failing test**

Test resize calculations:
- Width min 160.
- Focus block height remains fixed.
- Commit only on pointer up.

```ts
expect(next.width).toBe(160)
expect(next.height).toBe(start.height)
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/hooks/useBlockResize.test.ts`
Expected: FAIL because resize hook is missing.

**Step 3: Write minimal implementation**

- Add 16x16 invisible resize handles.
- Use pointer capture lifecycle.
- Add enter and exit CSS transitions per approved durations/curves.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/hooks/useBlockResize.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/hooks/useBlockResize.ts src/components/blocks src/index.css src/hooks/useBlockResize.test.ts
git commit -m "feat(blocks): add resize behavior and mount/unmount motion"
```

### Task 10: Add multi-select rectangle and group movement

**Files:**
- Modify: `src/components/canvas/Canvas.tsx`
- Modify: `src/components/canvas/SelectionRect.tsx`
- Modify: `src/hooks/useBlockDrag.ts`
- Modify: `src/lib/utils/canvas.utils.ts`
- Modify: `src/lib/utils/canvas.utils.test.ts`

**Step 1: Write the failing test**

Add intersection tests for partial overlap and corner conversion.

```ts
expect(intersectsSelection(blockA, selection)).toBe(true)
expect(intersectsSelection(blockB, selection)).toBe(false)
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/lib/utils/canvas.utils.test.ts`
Expected: FAIL because selection intersection helper is missing.

**Step 3: Write minimal implementation**

- Draw selection rect on root layer.
- Convert selection corners to canvas space.
- Populate `selectedIds` on pointer up.
- Apply group movement when selected block is dragged.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/lib/utils/canvas.utils.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/canvas/Canvas.tsx src/components/canvas/SelectionRect.tsx src/hooks/useBlockDrag.ts src/lib/utils/canvas.utils.ts src/lib/utils/canvas.utils.test.ts
git commit -m "feat(canvas): add multi-select rectangle and group drag"
```

### Task 11: Add zoom controls, fit-all, and interactive minimap

**Files:**
- Modify: `src/components/canvas/ZoomControls.tsx`
- Modify: `src/components/canvas/Minimap.tsx`
- Modify: `src/hooks/useKeyboardShortcuts.ts`
- Modify: `src/components/canvas/Canvas.tsx`
- Create: `src/components/canvas/ZoomControls.test.tsx`

**Step 1: Write the failing test**

Test:
- `+/-` applies `1.25x` step.
- `%` resets to 100.
- fit-all computes centered transform with 80px padding and zoom clamp.

```tsx
expect(screen.getByRole("button", { name: /reset zoom/i })).toBeInTheDocument()
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/components/canvas/ZoomControls.test.tsx`
Expected: FAIL because controls are placeholders.

**Step 3: Write minimal implementation**

- Implement controls + hover reveal behavior.
- Animate button zoom only (150ms ease-out).
- Implement fit-all transform animation (350ms cubic-bezier(0.4, 0, 0.2, 1)).
- Implement interactive minimap click and drag-to-pan viewport.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/components/canvas/ZoomControls.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/canvas/ZoomControls.tsx src/components/canvas/Minimap.tsx src/hooks/useKeyboardShortcuts.ts src/components/canvas/Canvas.tsx src/components/canvas/ZoomControls.test.tsx
git commit -m "feat(canvas): add zoom controls fit-all and interactive minimap"
```

### Task 12: Final keyboard map, cursor states, and acceptance checks

**Files:**
- Create: `src/hooks/useKeyboardShortcuts.ts`
- Modify: `src/store/canvas.store.ts`
- Modify: `src/components/canvas/Canvas.tsx`
- Modify: `src/index.css`
- Create: `docs/testing/canvas-manual-checklist.md`

**Step 1: Write the failing test**

Add store and hook tests for:
- Tool switch keys (`V`, `H`, `Space`).
- Delete selected.
- Undo on `Cmd/Ctrl+Z`.
- Escape clears selection.

```ts
expect(useCanvasStore.getState().tool).toBe("pan")
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/hooks/useKeyboardShortcuts.test.ts`
Expected: FAIL because hook coverage is incomplete.

**Step 3: Write minimal implementation**

- Implement full key map in a single document-level effect.
- Wire `activeCursor` transitions for all seven cursor states.
- Add manual QA checklist matching the approved definition of done.

**Step 4: Run tests and verification commands**

Run:
- `pnpm test`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`

Expected: PASS with zero type errors and successful build.

**Step 5: Commit**

```bash
git add src/hooks/useKeyboardShortcuts.ts src/store/canvas.store.ts src/components/canvas/Canvas.tsx src/index.css src/hooks/useKeyboardShortcuts.test.ts docs/testing/canvas-manual-checklist.md
git commit -m "feat(canvas): finalize keyboard controls cursors and acceptance checklist"
```

## Completion Criteria

Before implementation is marked complete, verify:
- `/` landing still works and `/app` canvas loads.
- Cursor-anchored zoom does not drift.
- Pan/drag interactions are smooth with ~20 blocks.
- Selection, group drag, resize, fit-all, undo, and shortcuts all work as designed.
- Dot grid remains anchored to canvas space.
- Only button zoom transitions are animated; wheel/pinch are immediate.
