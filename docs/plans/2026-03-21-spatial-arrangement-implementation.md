# Spatial Arrangement Overdrive Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add soft magnetic arrangement guides, refined drop polish, and arrangement-aware minimap feedback to Emru's canvas without changing persistence or undo semantics.

**Architecture:** Keep arrangement logic transient and drag-scoped. Compute alignment candidates inside the drag flow, emit guide metadata to a canvas overlay, and reuse the existing block store for the final dropped positions only. Extend the minimap and landing treatment with lightweight awareness of the drag state rather than introducing a second layout system.

**Tech Stack:** React 19, TypeScript, Zustand, dnd-kit, Tailwind v4, Vitest.

---

References: @writing-plans

### Task 1: Add arrangement utility coverage

**Files:**
- Create: `src/lib/utils/arrangement.utils.ts`
- Create: `src/lib/utils/arrangement.utils.test.ts`

**Step 1: Write the failing test**

Add utility tests for:
- edge alignment candidates
- center alignment candidates
- preferred spacing candidates
- softened magnetic pull vs exact snap near threshold
- multi-select delta propagation from the lead block

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/lib/utils/arrangement.utils.test.ts`
Expected: FAIL because the utility module does not exist yet.

**Step 3: Write minimal implementation**

- Add arrangement types for guides and drag feedback.
- Add helper logic that:
  - inspects nearby non-dragged blocks
  - chooses the strongest x/y candidates
  - computes softened target positions
  - returns guide metadata plus related block ids

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/lib/utils/arrangement.utils.test.ts`
Expected: PASS.

### Task 2: Integrate arrangement state into drag flow

**Files:**
- Modify: `src/hooks/useBlockDrag.ts`

**Step 1: Write the failing test**

Add or extend tests around drag updates if the hook already has coverage. Otherwise validate via the utility tests plus manual verification during this pass.

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/lib/utils/arrangement.utils.test.ts`
Expected: PASS for utility coverage while hook integration still needs implementation.

**Step 3: Write minimal implementation**

- Track transient arrangement state during active drag.
- Use the active drag id as the lead block.
- Apply adjusted deltas to the moving group.
- Clear guides/highlights cleanly on drag end/cancel.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/lib/utils/arrangement.utils.test.ts`
Expected: PASS and manual drag behavior matches the approved spec.

### Task 3: Render the arrangement overlay

**Files:**
- Create: `src/components/canvas/ArrangementGuides.tsx`
- Modify: `src/components/canvas/Canvas.tsx`

**Step 1: Write the failing test**

Validate visually during this pass, since the overlay is presentation-only and depends on live drag geometry.

**Step 2: Run test to verify it fails**

No dedicated failing test required for the first pass.

**Step 3: Write minimal implementation**

- Render guide rails and spacing segments in a pointer-events-none overlay.
- Convert canvas coordinates to screen coordinates through the current viewport transform.
- Keep the visual treatment restrained and consistent with the current canvas chrome.

**Step 4: Run test to verify it passes**

Manual verification in the running app:
- guides appear only near meaningful alignment
- guides disappear immediately when drag ends
- reduced-motion remains readable without extra motion

### Task 4: Add arrangement-aware minimap and landing polish

**Files:**
- Modify: `src/components/canvas/Minimap.tsx`
- Modify: `src/components/canvas/TransformLayer.tsx`
- Modify: `src/index.css`

**Step 1: Write the failing test**

Validate visually during this pass.

**Step 2: Run test to verify it fails**

No dedicated failing test required for the first pass.

**Step 3: Write minimal implementation**

- Pass active drag feedback into the minimap.
- Highlight the active block and related reference blocks subtly.
- Refine the landing animation to feel denser and more intentional than the current scale blip.
- Ensure reduced motion disables the landing animation.

**Step 4: Run test to verify it passes**

Manual verification in the running app:
- minimap acknowledges active arrangement relationships
- drop polish is present but restrained
- no visual noise remains when idle

### Task 5: Verify, typecheck, and build

**Files:**
- Modify: none unless fixes are required

**Step 1: Run targeted tests**

Run: `pnpm test -- src/lib/utils/arrangement.utils.test.ts`
Expected: PASS.

**Step 2: Run broader validation**

Run: `pnpm test`
Expected: PASS.

Run: `pnpm build`
Expected: PASS.

**Step 3: Manual verification**

Check:
- single-block drag
- multi-select drag
- reduced motion
- light and dark themes
- minimap during arrangement

**Step 4: Commit**

```bash
git add src/hooks/useBlockDrag.ts src/components/canvas/ArrangementGuides.tsx src/components/canvas/Canvas.tsx src/components/canvas/Minimap.tsx src/components/canvas/TransformLayer.tsx src/lib/utils/arrangement.utils.ts src/lib/utils/arrangement.utils.test.ts src/index.css docs/plans/2026-03-21-spatial-arrangement-design.md docs/plans/2026-03-21-spatial-arrangement-implementation.md
git commit -m "feat(canvas): add magnetic arrangement guides"
```
