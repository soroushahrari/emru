# Notes Block Design

Date: 2026-03-21
Status: Approved
Owner: OpenCode + user

## Problem and Outcome

Revamp the Notes block so it feels aligned with the new Tasks and Focus blocks while becoming a stronger writing surface.

Target experience:
- The block reads as a calm, editorial note card similar to the provided reference.
- The note is preview-first by default and renders Markdown when not actively being edited.
- Clicking into the note body enters writing mode without a separate edit button.
- Editing is powered by a minimal Tiptap base so future upgrades can build on the same editor foundation.
- Users can expand the note into a modal for focus mode without leaving the canvas.
- Footer metadata communicates save state on the left and word/character counts on the right.

## Scope

In scope:
- New Notes block chrome aligned with the current block system.
- Preview mode with rendered Markdown.
- Edit mode with a minimal Tiptap editor that appears only when the user engages the note body.
- Markdown as the persisted note format.
- Expand-to-modal flow for focus mode.
- Save-state indicator and word/character counts.
- Resize-safe layout behavior across min/max block sizes.
- Moderate motion and reduced-motion support.

Out of scope (V1):
- Visible formatting toolbar.
- Slash commands.
- Rich embeds, media, tables, checklists, mentions, or collaboration.
- Multi-note navigation inside the modal.
- Route-level note editor.

## Approaches Considered

### A) Preview-first block with inline edit state and modal expansion (recommended)

Pros:
- Best fit for Emru's calm, block-first model.
- Keeps the resting state quiet and readable.
- Supports both quick edits and deeper writing without mode clutter.
- Modal feels like an expansion of the same object, not a second product.

Cons:
- Requires careful focus handling to avoid accidental preview/edit flicker.
- Requires Markdown import/export boundaries around Tiptap.

### B) Always-editable hybrid Markdown surface

Pros:
- Faster to implement conceptually.
- Keeps a single surface alive.

Cons:
- Raw Markdown syntax makes the block visually noisy at rest.
- Harder to make the small block feel calm and readable.

### C) Preview-only block with editing only in modal

Pros:
- Cleanest block appearance.
- Simplifies inline state.

Cons:
- Adds friction for short edits.
- Makes the modal mandatory too early.

Decision: choose A.

## Interaction Model

The Notes block has two body states:
- Preview state: rendered Markdown, reading-first.
- Edit state: raw Markdown editing with Tiptap.

Behavior:
- Clicking the note body enters edit mode.
- While editing, the body becomes a writing surface that exposes raw Markdown.
- Blurring the editor returns to preview mode when focus fully leaves the note editor context.
- The header does not contain an edit toggle.
- Opening focus mode preserves the same mental model:
  - preview at rest
  - edit on engagement

This keeps the object understandable:
- read by default
- write directly
- expand when needed

## Visual Structure

### Header

- Match current normalized block chrome:
  - grip on the left
  - `Notes` title
  - expand/focus icon on the right
- Keep the surface quiet and aligned with Tasks and Focus.
- Typography may carry slightly more editorial softness than Tasks, but still use the system font tokens and spacing grammar.

### Body

- Large inset reading surface.
- Preview mode:
  - rendered Markdown
  - generous line-height
  - clean paragraph spacing
  - quiet list rhythm
  - restrained heading hierarchy
- Edit mode:
  - minimal editor appearance
  - no toolbar
  - raw Markdown visible
  - keyboard-first writing behavior
- Body scrolls internally if content exceeds available height.

### Footer

- Thin divider above footer.
- Bottom left:
  - quiet save state (`Autosaved`, `Saving...`, or similar)
- Bottom right:
  - word count and character count
  - format: `142 words · 876 chars`

Footer behavior:
- Always visible in normal sizes.
- In tight sizes, counts may compress or truncate, but layout must remain stable.

## Focus Mode Modal

Focus mode is a modal expansion of the same note.

Why modal:
- Preserves canvas context.
- Feels like enlarging a block, not navigating away.
- Supports deeper writing while keeping the main workspace spatial.

Modal behavior:
- Opens from the header expand icon.
- Uses the same note object and store data as the block.
- Same preview/edit interaction model as the block.
- Larger writing area with stronger reading comfort.
- Escape closes the modal.
- Closing the modal never discards content because saves remain continuous.

Modal layout:
- minimal header with title and close action
- large central note surface
- same footer metadata pattern as the block

## Editor and Data Model

### Canonical content format

Markdown remains the persisted source of truth.

Store shape remains centered on note text:
- `text`: raw Markdown

### Editor base

Tiptap is the editing engine for edit mode.

Rationale:
- Future-proofs the Notes block for richer editing improvements.
- Preserves the requested raw-Markdown-centered experience.
- Keeps V1 minimal while establishing the right extension architecture.

### Tiptap scope for V1

Only include the features needed now:
- paragraphs
- headings
- bullet lists
- ordered lists
- bold
- italic
- inline code
- code block
- blockquote
- links
- hard breaks

No visible formatting chrome in V1.

### Conversion model

- On load: Markdown -> Tiptap content
- On edit changes: Tiptap content -> Markdown
- On rest state: render stored Markdown preview

This keeps:
- storage simple
- preview honest
- future editor expansion possible

## Save State and Counts

Save state should feel reassuring, not system-heavy.

Behavior:
- Editing updates the store continuously.
- UI may briefly show `Saving...` while the editor sync cycle is active.
- Then settles to `Autosaved`.
- Avoid noisy timestamps unless needed for clarity.

Counts:
- Derived from raw Markdown text.
- Character count counts the stored Markdown characters.
- Word count should use a stable trimmed tokenization rule.

## Accessibility

- Keyboard users can tab to:
  - expand button
  - editor surface
  - modal close action
- Focus-visible styling must match the rest of the app.
- Modal needs focus containment and escape-to-close.
- Preview/edit transitions must not trap focus or cause screen reader confusion.
- Reduced motion must remove nonessential transitions.
- Markdown preview colors and typography must preserve WCAG AA contrast.

## Responsive and Resize Behavior

The Notes block must behave intentionally across its size range.

Small sizes:
- header stays readable
- body scrolls internally
- footer stays attached to bottom edge
- counts/save state compress gracefully

Large sizes:
- reading surface gets more breathing room
- preview typography scales modestly, not dramatically
- modal still provides a meaningfully larger focus surface than the block

## Motion

Motion should be subtle and explanatory:
- soft transition between preview and edit
- restrained modal entrance
- no decorative writing animations
- no gamified save feedback

Use existing easing tokens and honor reduced motion.

## File Impact

Likely touched areas:
- `src/components/blocks/NotesBlock/NotesBlock.tsx`
- `src/components/blocks/NotesBlock/useNotesBlock.ts`
- `src/types/block.types.ts`
- `src/lib/utils/block-sanitizers.ts`
- `src/store/blocks.store.ts`
- `src/index.css`
- new shared note/editor utility files
- new modal/dialog component(s)

## Success Criteria

- Notes block feels visually aligned with Tasks and Focus.
- Preview-first experience is calm and readable.
- Clicking into content directly enters writing mode.
- Tiptap powers editing, but the UI remains minimal.
- Modal focus mode feels like an expansion of the same block.
- Save state and counts are visible, quiet, and useful.
- Small block sizes remain stable and usable.
