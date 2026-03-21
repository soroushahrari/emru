# Countdown Block Design

Date: 2026-03-22
Status: Approved
Owner: Codex + user

## Problem and Outcome

Add a Countdown block to the Emru canvas that feels calm, typographic, and native to the existing block system.

Target experience:
- The block reads as a quiet deadline or milestone object, not a loud timer.
- The header matches other blocks, with a fixed `Countdown` title and standard drag/action chrome.
- The body centers a large countdown number with a separate editable hero label.
- Editing happens inline for both label and date, with no modal and no explicit save button.
- The block works across Minimal, Frosted, and Neo-Brutal themes by inheriting existing shell tokens.
- Persistence stays inside the existing localStorage-backed canvas block store.

## User-Approved Decisions

- Header title stays fixed as `Countdown`.
- The hero label in the body is a separate editable field.
- `createdAt` remains the original block creation timestamp even if `targetDate` changes.
- Dot progress always measures from original creation toward the current target date.
- No notifications, recurring dates, time-of-day settings, or color customization in V1.

## Approaches Considered

### A) Dedicated `countdown` block with its own hook and inline edit states (recommended)

Add a new block type, sanitizer branch, create path, and `useCountdownBlock` hook. The hook owns date math, refresh behavior, and update handlers; the component renders the typographic hero UI and inline edits.

Pros:
- Fits the current Emru `Store -> Hook -> Component` pattern.
- Keeps countdown-specific logic isolated and testable.
- Makes resize and theme behavior easier to reason about.

Cons:
- Requires touching all block integration points.

### B) Generic hero-metric block abstraction

Create a reusable metric-style block pattern first, then implement countdown on top of it.

Pros:
- Could help future metric-style blocks reuse the same centered layout.

Cons:
- The codebase does not have this abstraction today.
- Adds extra design and architecture work for a single current use case.

### C) Component-only implementation with minimal hook logic

Put most of the countdown behavior directly inside the block component.

Pros:
- Fastest to prototype.

Cons:
- Breaks the current separation used by Focus, Notes, and Tasks.
- Makes timer refresh, date math, and edit behavior harder to test and maintain.

Decision: choose A.

## Architecture

The Countdown block becomes a first-class block type with the same layering used elsewhere:

Store -> Hook -> Component

- `block.types.ts`: add the `countdown` block type, data interface, and union member.
- `block-sanitizers.ts`: validate and normalize countdown data, clamp size bounds, and provide defaults.
- `Canvas.tsx`: create new countdown blocks with default data and default dimensions.
- `useCountdownBlock.ts`: own derived countdown state, minute-based refresh, and update actions.
- `CountdownBlock.tsx`: render the shell, centered hero layout, and inline edit modes.

There is no generic shell extraction in this feature. The block should reuse the existing header/chrome conventions and theme-aware block classes already used by the current block components.

## Data Model

```ts
interface CountdownBlockData {
  label: string
  targetDate: string | null
  createdAt: string
}
```

Defaults for a new block:

```ts
label: "Countdown"
targetDate: null
createdAt: new Date().toISOString()
```

Validation rules:
- `label` is trimmed, bounded to a safe title-length-style limit, and falls back to `Countdown`.
- `targetDate` is either `null` or a normalized date-only string in `YYYY-MM-DD` form.
- `createdAt` must be a valid ISO timestamp; invalid persisted values fall back to creation-time default.
- `createdAt` never changes after block creation.

## Interaction Model

The block has four display states driven only by date-only comparison between `targetDate` and local `today`.

### Empty state

When `targetDate` is `null`:
- Show centered muted copy: `set a date`.
- Keep a native `<input type="date">` visible immediately.
- Once a date is chosen, save immediately and transition into display mode.

### Future state

When the target date is in the future:
- Show the editable hero label.
- Show the large hero number.
- Show a unit label of `days`, `weeks`, or `months`.
- Show the five-dot progress indicator row.

### Today state

When the target date is the current local date:
- Hide the number and unit.
- Replace the hero readout with `today`.
- Use the dawn/amber accent and a gentle pulse animation.

### Past state

When the target date is earlier than today:
- Show the hero label.
- Show muted `X days ago` copy.
- Do not render progress dots.

### Inline editing

Label editing:
- Clicking the hero label swaps it to a plain input or contenteditable field.
- The field auto-focuses.
- Save on `Enter` or blur.

Date editing:
- Clicking the number/date region opens a native `<input type="date">` inline under the hero content.
- Save on change.
- No save button, no modal, and no secondary confirmation flow.

## Date and Unit Logic

All calculations use date-only values with no time-of-day sensitivity.

Diff rule:

```ts
Math.ceil((targetDate - today) / 86400000)
```

Display logic:
- `>= 90` days remaining: show rounded months, unit `months`
- `14` to `89` days remaining: show rounded weeks, unit `weeks`
- `1` to `13` days remaining: show exact days, unit `days`
- `0`: show `today`
- `< 0`: show `X days ago`

Refresh behavior:
- Recompute on mount.
- Recompute every minute with a single interval inside the hook.
- The hook owns cleanup and should respect reduced motion only at the view layer, not in data logic.

## Progress Dots

The dot row contains five centered circles.

Rules:
- Only render for the future state.
- Total duration is measured from `createdAt`'s calendar day to `targetDate`.
- Fill dots left to right in equal fifths of the total duration.
- Active dots use the ember accent.
- Inactive dots use a muted low-opacity tone.

When the target date changes:
- Recompute progress against the unchanged original `createdAt`.
- Do not reset `createdAt`.

Edge handling:
- If `targetDate` is the same day as the creation day or otherwise yields a zero/negative total duration, avoid divide-by-zero and fall back to a stable zero-progress presentation.

## Visual Design

The block follows the existing Emru shell and theme surface tokens instead of hardcoding theme-specific chrome.

### Header

- Standard drag handle on the left.
- Fixed `Countdown` title.
- Actions revealed on hover, consistent with other blocks.

### Body

- Centered layout at rest and while resized.
- Hero label:
  - `Instrument Serif`
  - italic
  - `13px`
  - muted warm foreground
- Hero number:
  - `72px`
  - weight `700`
  - letter spacing `-3px`
  - line height `1`
  - `font-family: inherit` so Neo-Brutal can naturally use `Space Mono`
- Unit label:
  - `10px`
  - weight `600`
  - uppercase
  - letter spacing `0.18em`
  - very muted tone
- Dot indicators:
  - five `6px` circles
  - centered beneath the unit label

### Resize behavior

- Default footprint is roughly `200x220`.
- Wider resizing increases side breathing room only; the composition remains centered.
- Taller resizing adds vertical padding rather than scaling the number aggressively.
- The number remains the hero element at all supported sizes.

## Motion and Accessibility

Motion stays moderate and polished.

- Entrance animation:
  - `scale(0.92) translateY(12px)` to rest
  - `200ms`
  - `cubic-bezier(0.34,1.56,0.64,1)`
- `today` pulse:
  - `3s` loop
  - opacity `1 -> 0.5 -> 1`
- Label/date edit transitions:
  - `120ms` fade

Accessibility requirements:
- Respect `prefers-reduced-motion` by disabling or simplifying pulse and entrance motion.
- Maintain WCAG AA contrast within the existing theme token system.
- Keep native date input keyboard-accessible.
- Ensure label editing and date editing are reachable and completable via keyboard.

## Error Handling and Resilience

- Persisted malformed countdown blocks are sanitized to safe defaults.
- Invalid or absent `targetDate` values fall back to the empty state.
- Invalid `createdAt` values fall back to a valid ISO timestamp.
- Past dates never render dots.
- Date math avoids time-zone drift by normalizing to local date-only values before comparison.
- Deleting the block leaves no orphaned interval because refresh logic lives in the hook with cleanup.

## Testing Strategy

Unit tests:
- Date-only diff and normalization.
- Unit selection for months, weeks, and days.
- Today and past-state derivation.
- Progress-dot fill calculation across fifths.
- Progress behavior when `targetDate` changes but `createdAt` stays fixed.

Sanitizer tests:
- New countdown block data defaults.
- Invalid persisted `targetDate` normalization to `null`.
- Invalid `createdAt` fallback.
- Size bound enforcement for countdown blocks.

Component or hook tests:
- Empty state shows immediate date input.
- Label edit saves on blur and `Enter`.
- Date edit saves on change.
- Today state hides number and shows `today`.
- Past state shows `X days ago` with no dots.

## Scope Boundaries

Explicitly out of scope for V1:
- Notifications
- Recurring countdowns
- Time-of-day handling
- Color customization
- Multi-date milestones
- Relative-time alarms or reminders
