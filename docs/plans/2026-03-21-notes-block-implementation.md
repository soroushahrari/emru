# Notes Block Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship a preview-first Notes block with a minimal Tiptap editing base, Markdown persistence, focus-mode modal expansion, and footer metadata for save state and counts.

**Architecture:** Keep Markdown as the persisted source of truth in the blocks store, use Tiptap only as the edit-mode engine, and render Markdown preview for the resting state. Extend the current Store -> Hook -> Component flow by adding note editor utilities, a focus-mode modal surface, and small metadata state in the note hook.

**Tech Stack:** React 19, TypeScript, Vite, Zustand, Tailwind v4, Base UI, Tiptap, Markdown rendering/parsing utilities, Vitest.

---

References: @writing-plans

### Task 1: Add note-editor dependencies and define the v1 editor contract

**Files:**
- Modify: `package.json`
- Modify: lockfile for the active package manager (`pnpm-lock.yaml` or equivalent)
- Create: `src/lib/notes/notes-editor.types.ts`
- Create: `src/lib/notes/notes-editor.types.test.ts`

**Step 1: Write the failing test**

Create `src/lib/notes/notes-editor.types.test.ts` with a small contract test that imports the new types/helpers and asserts the supported formatting surface is defined.

```ts
import { describe, expect, it } from "vitest"
import { SUPPORTED_NOTES_MARKDOWN_FEATURES } from "@/lib/notes/notes-editor.types"

describe("notes editor contract", () => {
  it("defines the supported markdown features for v1", () => {
    expect(SUPPORTED_NOTES_MARKDOWN_FEATURES).toContain("heading")
    expect(SUPPORTED_NOTES_MARKDOWN_FEATURES).toContain("bullet-list")
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/lib/notes/notes-editor.types.test.ts`
Expected: FAIL because the module and/or dependencies do not exist yet.

**Step 3: Write minimal implementation**

- Add Tiptap packages needed for a minimal editor base:
  - `@tiptap/react`
  - `@tiptap/pm`
  - `@tiptap/starter-kit`
  - `@tiptap/extension-link`
- Add a preview/rendering package and Markdown conversion utility chosen for implementation.
- Create `src/lib/notes/notes-editor.types.ts` exporting:
  - supported feature list
  - save-state union type
  - helper types for preview/edit state

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/lib/notes/notes-editor.types.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml src/lib/notes/notes-editor.types.ts src/lib/notes/notes-editor.types.test.ts
git commit -m "chore(notes): add editor dependencies and notes editor contract"
```

### Task 2: Add Markdown conversion and preview utilities

**Files:**
- Create: `src/lib/notes/markdown.ts`
- Create: `src/lib/notes/markdown.test.ts`

**Step 1: Write the failing test**

Create tests for:
- Markdown preview sanitization/normalization helper
- word count helper
- character count helper
- Markdown roundtrip guard for a basic note

```ts
expect(getNoteCounts("# Hello\\n\\nOne two")).toEqual({ words: 3, characters: 16 })
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/lib/notes/markdown.test.ts`
Expected: FAIL because the note helpers do not exist yet.

**Step 3: Write minimal implementation**

- Add `src/lib/notes/markdown.ts` with:
  - `getNoteCounts(markdown: string)`
  - `normalizeMarkdown(markdown: string)`
  - `markdownToTiptapContent(markdown: string)`
  - `tiptapContentToMarkdown(content: JSONContent | string)` or the chosen equivalent
- Keep logic scoped to the supported v1 Markdown features only.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/lib/notes/markdown.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/notes/markdown.ts src/lib/notes/markdown.test.ts
git commit -m "feat(notes): add markdown conversion and count helpers"
```

### Task 3: Extend note data model for focus mode and lightweight save metadata

**Files:**
- Modify: `src/types/block.types.ts`
- Modify: `src/lib/utils/block-sanitizers.ts`
- Modify: `src/lib/utils/block-sanitizers.test.ts`

**Step 1: Write the failing test**

Add sanitizer tests covering the new Notes block defaults and backward compatibility.

Cases:
- old notes payload with only `title` and `text` still sanitizes
- new fields get safe defaults
- invalid values collapse to defaults

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/lib/utils/block-sanitizers.test.ts`
Expected: FAIL because the updated Notes shape/defaults are not implemented yet.

**Step 3: Write minimal implementation**

- Extend `NotesBlockData` with only the persisted fields that are truly needed for v1.
- Keep edit-mode, modal-open, and transient save-state as local UI state, not persisted.
- Update sanitizer defaults and tests accordingly.
- Preserve backward compatibility with existing saved notes.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/lib/utils/block-sanitizers.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/types/block.types.ts src/lib/utils/block-sanitizers.ts src/lib/utils/block-sanitizers.test.ts
git commit -m "refactor(notes): prepare notes block data model for editor upgrade"
```

### Task 4: Build a reusable Notes editor hook around Markdown persistence

**Files:**
- Modify: `src/components/blocks/NotesBlock/useNotesBlock.ts`
- Create: `src/components/blocks/NotesBlock/useNotesEditor.ts`
- Create: `src/components/blocks/NotesBlock/useNotesEditor.test.ts`

**Step 1: Write the failing test**

Create hook tests for:
- entering edit mode
- leaving edit mode
- updating markdown text
- reporting save state transitions
- deriving word and character counts

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/components/blocks/NotesBlock/useNotesEditor.test.ts`
Expected: FAIL because the new editor hook does not exist yet.

**Step 3: Write minimal implementation**

- Keep `useNotesBlock` responsible for store access and `setText`.
- Add `useNotesEditor` to manage:
  - `isEditing`
  - `isModalOpen`
  - derived `saveState`
  - derived counts
  - focus/blur state transitions
- Ensure save-state behavior remains calm and optimistic:
  - `Saving...` briefly during active updates
  - `Autosaved` as steady state

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/components/blocks/NotesBlock/useNotesEditor.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/blocks/NotesBlock/useNotesBlock.ts src/components/blocks/NotesBlock/useNotesEditor.ts src/components/blocks/NotesBlock/useNotesEditor.test.ts
git commit -m "feat(notes): add notes editor state hook"
```

### Task 5: Create the minimal Tiptap editor surface

**Files:**
- Create: `src/components/blocks/NotesBlock/NotesEditor.tsx`
- Create: `src/components/blocks/NotesBlock/NotesEditor.test.tsx`

**Step 1: Write the failing test**

Create component tests that verify:
- the editor mounts with note markdown
- supported content renders into the Tiptap surface
- editing invokes markdown save callbacks
- blur can hand control back to preview mode

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/components/blocks/NotesBlock/NotesEditor.test.tsx`
Expected: FAIL because the editor component does not exist yet.

**Step 3: Write minimal implementation**

- Build `NotesEditor.tsx` around `useEditor` and `EditorContent`.
- Keep extension list minimal and aligned with the approved scope.
- Wire Tiptap content import/export through `src/lib/notes/markdown.ts`.
- Do not add visible formatting controls.
- Ensure the editor surface remains raw-Markdown-centered from the user’s perspective.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/components/blocks/NotesBlock/NotesEditor.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/blocks/NotesBlock/NotesEditor.tsx src/components/blocks/NotesBlock/NotesEditor.test.tsx
git commit -m "feat(notes): add minimal tiptap notes editor"
```

### Task 6: Create the Markdown preview surface

**Files:**
- Create: `src/components/blocks/NotesBlock/NotesPreview.tsx`
- Create: `src/components/blocks/NotesBlock/NotesPreview.test.tsx`
- Modify: `src/index.css`

**Step 1: Write the failing test**

Create tests verifying:
- headings, lists, code, blockquotes, and links render
- empty note state renders helpful placeholder copy
- preview surface remains non-editing until engaged

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/components/blocks/NotesBlock/NotesPreview.test.tsx`
Expected: FAIL because the preview component does not exist yet.

**Step 3: Write minimal implementation**

- Add `NotesPreview.tsx` using the chosen Markdown renderer.
- Add scoped CSS for:
  - paragraphs
  - headings
  - lists
  - blockquotes
  - inline code/code block
  - links
- Keep the preview visually aligned with the warm card system and the reference image.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/components/blocks/NotesBlock/NotesPreview.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/blocks/NotesBlock/NotesPreview.tsx src/components/blocks/NotesBlock/NotesPreview.test.tsx src/index.css
git commit -m "feat(notes): add markdown preview surface"
```

### Task 7: Add a reusable app dialog for focus mode

**Files:**
- Create: `src/components/ui/dialog.tsx`
- Create: `src/components/ui/dialog.test.tsx`

**Step 1: Write the failing test**

Create dialog tests that verify:
- open/close rendering
- escape closes the dialog
- focus is trapped while open
- clicking close button dismisses it

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/components/ui/dialog.test.tsx`
Expected: FAIL because the dialog component does not exist yet.

**Step 3: Write minimal implementation**

- Build a small app dialog component using the project’s UI primitives or Base UI primitives already present.
- Support:
  - overlay
  - content
  - title
  - close button
  - focus containment
  - escape dismissal
- Keep styles aligned with existing block surfaces.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/components/ui/dialog.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/ui/dialog.tsx src/components/ui/dialog.test.tsx
git commit -m "feat(ui): add app dialog for focus mode surfaces"
```

### Task 8: Build the expanded Notes modal surface

**Files:**
- Create: `src/components/blocks/NotesBlock/NotesModal.tsx`
- Create: `src/components/blocks/NotesBlock/NotesModal.test.tsx`
- Modify: `src/index.css`

**Step 1: Write the failing test**

Create tests verifying:
- modal opens from local state
- modal shows preview by default
- modal enters editing when content is engaged
- modal shows save state and counts

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/components/blocks/NotesBlock/NotesModal.test.tsx`
Expected: FAIL because the modal component does not exist yet.

**Step 3: Write minimal implementation**

- Add `NotesModal.tsx` composed from the new dialog.
- Reuse `NotesPreview` and `NotesEditor` instead of duplicating logic.
- Keep footer metadata identical in meaning to the block version.
- Ensure modal sizing is generous but still bounded on smaller viewports.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/components/blocks/NotesBlock/NotesModal.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/blocks/NotesBlock/NotesModal.tsx src/components/blocks/NotesBlock/NotesModal.test.tsx src/index.css
git commit -m "feat(notes): add focus mode notes modal"
```

### Task 9: Replace the current Notes block shell and body

**Files:**
- Modify: `src/components/blocks/NotesBlock/NotesBlock.tsx`
- Modify: `src/index.css`

**Step 1: Write the failing test**

Add or update component tests to verify:
- header renders title and expand action
- block shows preview by default
- body enters edit mode on click
- footer shows save state and counts
- layout remains stable at compact sizes

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/components/blocks/NotesBlock`
Expected: FAIL because the current block is still textarea-only.

**Step 3: Write minimal implementation**

- Replace the textarea-only body with:
  - preview surface
  - edit surface
  - footer metadata row
  - focus-mode expand action
- Keep block chrome aligned with Tasks and Focus.
- Preserve resize handle, selection outline, drag handle behavior, and min/max sizing.
- Ensure the block does not break when content is long or the card is small.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/components/blocks/NotesBlock`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/blocks/NotesBlock/NotesBlock.tsx src/index.css
git commit -m "feat(notes): revamp notes block for preview and focus editing"
```

### Task 10: Tune canvas integration, starter data, and snapshots

**Files:**
- Modify: `src/components/canvas/Canvas.tsx`
- Modify: `src/store/blocks.store.ts`
- Modify: any starter-data helper used to seed blocks

**Step 1: Write the failing test**

Add tests verifying:
- seeded notes still render correctly after sanitizer changes
- note content updates persist
- modal/edit interactions do not break block persistence

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/lib/utils/block-sanitizers.test.ts src/components/blocks/NotesBlock`
Expected: FAIL because the new flow is not fully integrated yet.

**Step 3: Write minimal implementation**

- Update any starter note content as needed for the new preview surface.
- Ensure store persistence still works with the revised Notes block data.
- Confirm no unwanted undo/history behavior is introduced by steady note editing.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/lib/utils/block-sanitizers.test.ts src/components/blocks/NotesBlock`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/canvas/Canvas.tsx src/store/blocks.store.ts src/lib/utils/block-sanitizers.test.ts
git commit -m "chore(notes): integrate notes editor with canvas persistence"
```

### Task 11: Final polish, accessibility pass, and regression coverage

**Files:**
- Modify: `src/index.css`
- Modify: any affected test files
- Modify: `src/components/blocks/NotesBlock/*` as needed for fixes

**Step 1: Write the failing test**

Add final regression coverage for:
- reduced motion
- focus-visible behavior
- modal close paths
- compact-size footer stability

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/components/blocks/NotesBlock src/components/ui/dialog.test.tsx`
Expected: FAIL until the final fixes are in.

**Step 3: Write minimal implementation**

- Polish spacing, transitions, and typography.
- Add reduced-motion handling for preview/edit/modal transitions.
- Make sure footer metadata does not collide in compact block sizes.
- Clean up any one-off note styles that drift from the design system.

**Step 4: Run test to verify it passes**

Run:
- `pnpm test -- src/components/blocks/NotesBlock src/components/ui/dialog.test.tsx`
- `pnpm typecheck`
- `pnpm build`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/index.css src/components/blocks/NotesBlock src/components/ui/dialog.tsx src/components/ui/dialog.test.tsx
git commit -m "fix(notes): polish notes editor interactions and accessibility"
```
