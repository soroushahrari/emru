# Spatial Arrangement Overdrive Design

Date: 2026-03-21
Status: Approved
Owner: Codex + user

## Problem and Outcome

Emru's canvas already supports freeform block placement, but block arrangement still feels mechanically correct rather than spatially composed.

Target experience:
- Dragging a block should reveal nearby alignment opportunities without forcing rigid grid behavior.
- Placement should feel calm and precise, with subtle magnetic pull in the last few pixels.
- Releasing a block should resolve with a short settle that makes the arrangement feel finished.
- The minimap should acknowledge the active arrangement moment without becoming visually noisy.
- Reduced-motion users should keep the clarity of guides without extra movement.

## Scope

In scope:
- Drag-time alignment detection for edge, center, and preferred spacing relationships.
- Soft magnetic positioning for the actively dragged block or drag group.
- Canvas overlay guides for active alignment hints.
- Refined landing polish after drop.
- Subtle minimap awareness of active arrangement references.
- Reduced-motion fallback behavior.

Out of scope:
- Persistent grid systems.
- Auto-layout or reflow of surrounding blocks.
- Hard snapping everywhere.
- Physics that move non-dragged blocks.
- Changes to persistence, history semantics, or saved layout data.

## Approaches Considered

### A) Soft magnetic guides with calm settle (recommended)

Pros:
- Preserves Emru's freeform canvas model.
- Improves arrangement quality without feeling like a design tool.
- Keeps interaction confidence high for general users.

Cons:
- Requires careful threshold tuning to avoid either invisibility or over-snapping.
- Needs good visual restraint so cues stay secondary.

### B) Strong elastic snap layout

Pros:
- Faster to understand.
- Creates more obviously structured layouts.

Cons:
- Too opinionated for Emru's flexible, today-first canvas.
- Easier to make the experience feel cramped or rigid.

### C) Cluster physics

Pros:
- High novelty and obvious technical ambition.

Cons:
- Too risky for a calm productivity product.
- Can reduce user trust if nearby blocks move unexpectedly.

Decision: choose A.

## Interaction Model

Dragging stays freeform until the moving block nears a meaningful spatial relationship.

Candidate relationships:
- left, center, right alignment
- top, middle, bottom alignment
- preferred horizontal spacing
- preferred vertical spacing

Behavior:
- Alignment only activates within short proximity thresholds.
- Magnetic pull increases as the block approaches the target relationship.
- Exact snap is reserved for the final few pixels only.
- Multi-select drag keeps relative offsets intact and uses the active block as the magnetic reference.
- On drop, the moved blocks get a brief composed settle animation.
- Reduced motion disables settle animation and keeps only static guide feedback.

## Visual Language

Guide treatment:
- Hairline-thin
- Warm-tinted
- Slightly translucent
- Short fade in/out
- Quieter than the selection outline

Arrangement language:
- Suggestive, not assertive
- No permanent grid
- No loud labels or measurement badges
- No bouncing or playful easing

Minimap treatment:
- Active block gets stronger emphasis during drag.
- Related reference blocks receive a restrained highlight.
- No separate logic or controls inside the minimap.

## Technical Approach

The drag hook remains the orchestration point.

Architecture:
- Compute candidate relationships during drag from current block bounds and the drag group's lead block.
- Convert the strongest candidate on each axis into a softened position adjustment.
- Apply the adjusted delta back across the whole drag group.
- Return transient guide data and related block ids to the canvas for rendering.
- Keep the blocks store as the only persisted source of truth.

This keeps:
- undo semantics unchanged
- persistence unchanged
- layout logic scoped to active interaction only

## Accessibility and Performance

Accessibility:
- Reduced motion removes settle animation.
- Pointer behavior remains fully usable without relying on animation.
- Visual cues preserve contrast against both light and dark surfaces.

Performance:
- Candidate search stays bounded to current blocks and excludes the drag group.
- Guide rendering stays in one overlay layer.
- No background simulation or per-frame updates outside active drag.

## Verification

- Verify single-block drag alignment on both axes.
- Verify multi-select drag keeps relative spacing while the lead block aligns.
- Verify spacing cues appear for near-neighbor placements.
- Verify drop polish is visible but restrained.
- Verify minimap highlights track active arrangement moments.
- Verify reduced motion removes settle animation.
- Verify undo/history still records only the final drop position.
