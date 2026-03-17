# Emru Canvas Design

Date: 2026-03-17
Status: Approved
Owner: OpenCode + user

## Problem and Outcome

Build the core Emru workspace canvas as a dedicated application route while preserving the existing landing page.

Target experience:
- Landing remains at `/`.
- Workspace opens at `/app`.
- Canvas interaction feels smooth and precise for pan, zoom, drag, resize, multi-select, and fit-all.
- Architecture stays strict: Store -> Hook -> Component.

## Scope

In scope:
- Two-layer canvas architecture with CSS transform pan/zoom.
- Zustand canvas and blocks stores.
- Gesture system with `@use-gesture/react` for wheel, pinch, and background drag.
- Block drag with `@dnd-kit/core` using header-only handles.
- Block resize handles with pointer capture.
- Multi-select rectangle and group drag.
- Z-order management, zoom controls, fit-all shortcut, and cursor state model.
- Undo stack for add/delete/move/resize commits.
- Interactive minimap.
- Route split: `/` landing, `/app` workspace.

Out of scope (V1):
- Redo stack.
- Plugin/registry block systems.
- Canvas rendering libraries.

## Approaches Considered

### A) Domain stores + feature hooks + thin components (recommended)

Pros:
- Best alignment with separation rules and readability goals.
- Clear ownership boundaries by domain.
- Easy to extend with more block types.

Cons:
- More files up front.

### B) Single canvas engine hook

Pros:
- Faster to start.

Cons:
- Turns into a god-hook quickly.
- Harder to maintain and test.

### C) Command pipeline architecture

Pros:
- Strong action tracing and undo metadata.

Cons:
- Over-abstracted for V1.
- Slower iteration and higher complexity.

Decision: choose A.

## Route and Page Architecture

- `/` -> `LandingPage` (existing landing content preserved).
- `/app` -> `CanvasPage` (workspace shell).

Canvas page component layout:
- `Canvas.tsx` (fixed root layer, gestures, cursor ownership, root background updates).
- `TransformLayer.tsx` (single transformed layer rendering blocks).
- `SelectionRect.tsx` (root overlay for drag select).
- `ZoomControls.tsx` (bottom-left, outside transform layer).
- `Minimap.tsx` (bottom-right, interactive).

Block rendering:
- Explicit `switch (block.type)` renderer.
- No plugin or registry abstraction.

## State Model

### Canvas store (`canvas.store.ts`)

```ts
interface CanvasStore {
  offsetX: number
  offsetY: number
  zoom: number
  tool: 'select' | 'pan'
  selectedIds: string[]
  activeCursor: 'default' | 'grab' | 'grabbing' | 'se-resize'
  setOffset: (x: number, y: number) => void
  setZoom: (zoom: number) => void
  zoomAround: (newZoom: number, screenX: number, screenY: number) => void
  setTool: (tool: 'select' | 'pan') => void
  select: (ids: string[]) => void
  clearSelection: () => void
}
```

`zoomAround` must use this exact implementation:

```ts
zoomAround: (newZoom, screenX, screenY) => {
  const { offsetX, offsetY, zoom } = get()
  const clampedZoom = Math.min(2.0, Math.max(0.1, newZoom))
  const newOffsetX = screenX - (screenX - offsetX) * (clampedZoom / zoom)
  const newOffsetY = screenY - (screenY - offsetY) * (clampedZoom / zoom)
  set({ zoom: clampedZoom, offsetX: newOffsetX, offsetY: newOffsetY })
}
```

### Blocks store (`blocks.store.ts`)

Responsibilities:
- Block entity state (`id`, `type`, `x`, `y`, `width`, `height`, `zIndex`, `data`).
- `nextZ` counter initialized at `10`.
- Undo snapshot stack with max length `50`.

Undoable actions:
- Add block.
- Delete block.
- Move block (commit on drag end).
- Resize block (commit on resize end).

Not undoable:
- Pan/zoom/tool/cursor changes.

## Coordinate and Transform Rules

- Root layer is fixed and never translated.
- Transform layer is the only moving/scaling element.
- Transform string is always:

```css
transform: translate(${offsetX}px, ${offsetY}px) scale(${zoom});
transform-origin: 0 0;
```

- Never use `top/left` for pan.
- Transform layer keeps `will-change: transform` permanently.

Screen to canvas conversion utility:

```ts
const toCanvas = (screenX: number, screenY: number) => ({
  x: (screenX - offsetX) / zoom,
  y: (screenY - offsetY) / zoom,
})
```

## Input and Interaction Design

### Gestures (`useCanvasGestures.ts`)

- Wheel:
  - With `ctrlKey` or `metaKey`: zoom via
    `zoomAround(zoom * (1 - delta[1] * 0.0008), clientX, clientY)`.
  - Without modifier: pan via
    `setOffset(offsetX - delta[0], offsetY - delta[1])`.
  - Always prevent default wheel behavior.
- Pinch:
  - Capture start zoom in memo on pinch start.
  - On pinch: `zoomAround(memo * scale, origin[0], origin[1])`.
- Background drag:
  - Active only when tool is `pan` or space is held.
  - `setOffset(offsetX + delta[0], offsetY + delta[1])`.
  - Use `filterTaps: true`, `threshold: 4`.

### Space temporary pan

- Document-level key handling with refs (not React state):
  - `spaceHeldRef`
  - `previousToolRef`
- On keydown Space: switch to pan and cursor grabbing.
- On keyup Space: restore prior tool.

### Keyboard shortcuts (`useKeyboardShortcuts.ts`)

Single document effect handling:
- `T`, `N`, `F` add block at viewport center.
- `V`, `H`, `Space` tool mode controls.
- `Delete`/`Backspace` remove selected.
- `Cmd/Ctrl+Z` undo.
- `Cmd/Ctrl+K` toggle AI panel.
- `Cmd/Ctrl+0` reset zoom.
- `Cmd/Ctrl+Shift+H` fit all.
- `Cmd/Ctrl+A` select all.
- `Escape` clear selection / close menus.

### Dot grid anchoring

Applied on root layer only:

```ts
backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.052) 1px, transparent 1px)'
backgroundSize: `${24 * zoom}px ${24 * zoom}px`
backgroundPosition: `${offsetX % (24 * zoom)}px ${offsetY % (24 * zoom)}px`
```

Dark mode swaps dot color to `rgba(255,255,255,0.042)`.

Update strategy:
- Update root style in `requestAnimationFrame` via store subscription.
- Avoid React render-driven background updates.

## Block Behaviors

### Drag

- `@dnd-kit/core`, each block is draggable.
- Drag handle is header only.
- Drag delta conversion: `newX = startX + delta.x / zoom`, `newY = startY + delta.y / zoom`.
- On end: commit position without positional animation.
- Drag visual state:
  - `box-shadow: 0 0 0 0.5px rgba(0,0,0,0.14), 0 8px 32px rgba(0,0,0,0.14)`
  - `z-index: 200`
  - `will-change: transform` active only during drag.
- Landing feedback animation class on end:
  - `scale(1.005) -> scale(1)`
  - `200ms cubic-bezier(0.34, 1.56, 0.64, 1)`.
- During active drag, transform layer gets `pointer-events: none`.

### Resize

- Bottom-right resize handle with invisible `16x16` hit area.
- On pointer down: `setPointerCapture`.
- Width: `startWidth + deltaX`, clamp min `160`.
- Height:
  - Tasks/notes: grow with min per block definition.
  - Focus: fixed height.
- No animation while resizing.
- Commit on pointer up and release capture.

### Multi-select

- Background drag in select mode draws selection rect on root layer.
- Rect style:
  - `border: 1px solid rgba(212, 105, 42, 0.5)`
  - `background: rgba(212, 105, 42, 0.06)`
  - `border-radius: 3px`
- Selection math:
  - Convert rect corners to canvas space.
  - Intersect with each block canvas bbox.
  - Partial overlap counts as selected.
- On pointer up, store intersecting IDs.
- Escape clears selection.
- Group drag moves all selected with shared delta.

### Z-order

- Any block click or drag start calls bring-to-front.
- `zIndex = nextZ++` so last touched is always on top.

## Overlay Controls

### Zoom controls

- Fixed bottom-left outside transform layer.
- Controls: `+`, `% text`, `-`.
- `%` click resets zoom to `1.0` while preserving viewport center.
- Hovering `%` fades +/- in.
- At `100%`, text opacity is `40%`; otherwise full opacity.
- Button zoom step: multiply/divide by `1.25`.
- Button-triggered zoom animates `150ms ease-out`.
- Wheel and pinch zoom do not animate.

### Fit all content

- Shortcut `Cmd/Ctrl+Shift+H`.
- Compute block bbox: `minX`, `minY`, `maxX + w`, `maxY + h`.
- Fit viewport with `80px` padding.
- Clamp fit zoom between `0.2` and `1.0`.
- Center bbox in viewport.
- Apply transform transition temporarily:
  - `350ms cubic-bezier(0.4, 0, 0.2, 1)`
  - add transition, set values, remove on `transitionend`.

### Interactive minimap

V1 includes interaction:
- Render all blocks and current viewport window.
- Click minimap position to center viewport there.
- Drag minimap viewport window to pan main canvas.
- Uses same canvas-coordinate conversion helpers.

## Animation Rules

- Block enter animation:
  - `opacity: 0`, `transform: scale(0.92) translateY(8px)`
  - to `opacity: 1`, `transform: none`
  - `200ms cubic-bezier(0.34, 1.56, 0.64, 1)`.
- Block exit animation:
  - `opacity: 0`, `transform: scale(0.94)`
  - `150ms transition`, then remove on `transitionend` with timeout fallback.

## Cursor State Model

Single source in `canvas.store.ts` as `activeCursor`:
- Root select: `default`.
- Root pan: `grab`.
- Active panning: `grabbing`.
- Block body: `default`.
- Block header: `grab`; dragging: `grabbing`.
- Resize handle: `se-resize`.

Root layer consumes the active cursor to avoid flicker from competing hover sources.

## Performance Requirements

- All block components wrapped in `React.memo`.
- Block subscriptions are per-block slice only.
- Pan/zoom updates must not re-render block components.
- `will-change` usage:
  - Always on transform layer.
  - Only on active dragged block while dragging.
  - Not on all resting blocks.
- Dot grid updates are root-style updates in RAF subscriber.

## Error Handling Strategy

- Clamp all zoom writes.
- Guard against invalid gesture payloads.
- Keep temporary pan mode in refs, not state.
- localStorage decode uses schema validation and fallback defaults.
- Invalid persisted slice logs warning and resets slice only.

## Testing and Validation Plan

Unit tests (pure utils):
- Coordinate conversions (`toCanvas`, `toScreen`).
- Bounding box and fit-all math.
- Selection intersection logic.
- Zoom clamping and anchor invariants.

Store tests:
- Canvas actions and `zoomAround` behavior.
- Blocks undo stack push/pop behavior and 50-entry cap.

E2E checks on `/app`:
- Pan, wheel zoom, pinch zoom anchor stability.
- Drag and group drag.
- Resize constraints and commit timing.
- Selection with partial overlap.
- Fit-all animation and padding.
- Zoom control animation behavior.
- Shortcut coverage.
- Cursor state correctness.

## Definition of Done Mapping

This design is complete when implementation demonstrates:
- Smooth pan/zoom at 60fps on modern laptop trackpad.
- Cursor-anchored zoom with no visible drift.
- Stable drag performance with ~20 blocks.
- Dot grid anchored to canvas space.
- Enter and exit block animations on every add/remove.
- Correct multi-select and group drag behavior.
- Smooth fit-all transition with required padding.
- All required shortcuts functioning.
- Undo works for add/delete/move/resize commits.
- Zoom controls animate only on button-driven zoom.
- All seven cursor states behave as specified.
