# DELIVERATOR Design System

Visual language for a workflow orchestration mission control surface.

This document defines the design tokens, typography, color system, component guidelines, and interaction patterns used across the DELIVERATOR UI. All implementation uses **shadcn/ui** with **Tailwind CSS**. CSS custom properties use HSL format without the `hsl()` wrapper, per shadcn convention.

---

## Design Direction

**Industrial mission control.** Sharp edges, dense information, precision typography.

DELIVERATOR is a power-user operations tool — a control surface for orchestrating AI CLI agents through deterministic workflow stages. The aesthetic draws from cyberpunk-era industrial tech: high-contrast surfaces, monospace data readouts, electric accent colors against cool gray foundations.

### Core Principles

1. **No rounded corners** — `border-radius: 0` throughout, including all shadcn component overrides
2. **Borders over shadows** — sharp 1px borders define surfaces; minimal `box-shadow` usage
3. **Density first** — compact spacing optimized for log viewers, artifact renderers, kanban cards
4. **Data legibility** — typography and contrast tuned for scanning operational state at a glance
5. **Minimal motion** — state transitions and streaming indicators only; no decorative animation

---

## Typography

Three font families serve distinct roles:

| Role | Family | Fallback | Usage |
| --- | --- | --- | --- |
| Display / Headings | **Chakra Petch** | `system-ui, sans-serif` | Page titles, section headings, stage labels |
| Body | **Outfit** | `system-ui, sans-serif` | Prose, descriptions, UI labels, navigation |
| Code / Data | **JetBrains Mono** | `ui-monospace, monospace` | Logs, artifact content, status values, IDs |

### Type Scale

Base size: `0.875rem` (14px) — compact for data-dense interfaces.

| Token | Size | Line Height | Weight | Usage |
| --- | --- | --- | --- | --- |
| `text-xs` | 0.75rem (12px) | 1.33 | 400 | Timestamps, metadata, tertiary labels |
| `text-sm` | 0.8125rem (13px) | 1.38 | 400 | Secondary labels, table cells, badges |
| `text-base` | 0.875rem (14px) | 1.5 | 400 | Body text, descriptions, form labels |
| `text-md` | 1rem (16px) | 1.5 | 500 | Card titles, nav items, prominent labels |
| `text-lg` | 1.125rem (18px) | 1.44 | 600 | Section headings, dialog titles |
| `text-xl` | 1.25rem (20px) | 1.4 | 600 | Page section headers |
| `text-2xl` | 1.5rem (24px) | 1.33 | 700 | Page titles |
| `text-3xl` | 1.875rem (30px) | 1.27 | 700 | Primary page heading |
| `text-4xl` | 2.25rem (36px) | 1.22 | 700 | Hero / dashboard title (rare) |

### Font Loading

```css
/* Chakra Petch: 400, 500, 600, 700 */
/* Outfit: 400, 500, 600 */
/* JetBrains Mono: 400, 500, 700 */
```

Headings use Chakra Petch with `letter-spacing: -0.01em` at `text-lg` and above, and `letter-spacing: 0.04em; text-transform: uppercase` for eyebrow/label treatments.

Body text uses Outfit. Code and data values use JetBrains Mono.

---

## Color System

All values are HSL triplets without the `hsl()` wrapper. Apply via `hsl(var(--token))` in Tailwind/shadcn.

### Foundations — Light Mode

```css
:root {
  --background:          220 14% 96%;    /* #f1f3f7 — cool blue-gray wash */
  --foreground:          222 20% 10%;    /* #141925 — near-black ink */

  --card:                220 14% 99%;    /* #fcfcfd — surface white, cool tint */
  --card-foreground:     222 20% 10%;

  --popover:             220 14% 99%;
  --popover-foreground:  222 20% 10%;

  --muted:               220 14% 92%;    /* #e6e9ee — subtle bg for inactive areas */
  --muted-foreground:    220 10% 40%;    /* #5c6370 — secondary text */

  --accent:              220 14% 90%;    /* #e0e4ea — hover/selected backgrounds */
  --accent-foreground:   222 20% 10%;

  --border:              220 14% 85%;    /* #d3d8e0 — structural borders */
  --input:               220 14% 85%;
  --ring:                192 90% 45%;    /* focus ring = primary cyan */

  --primary:             192 90% 42%;    /* #0ba5c4 — electric cyan */
  --primary-foreground:  0 0% 100%;      /* white on cyan */

  --secondary:           38 90% 50%;     /* #f2a60d — amber */
  --secondary-foreground: 38 95% 12%;   /* dark amber for contrast */

  --destructive:         0 72% 50%;      /* #db3434 — error/danger red */
  --destructive-foreground: 0 0% 100%;

  --success:             152 60% 36%;    /* #25925e — confirmation green */
  --success-foreground:  0 0% 100%;

  --warning:             38 90% 50%;     /* amber — shared with secondary */
  --warning-foreground:  38 95% 12%;

  --chart-1:             192 90% 42%;
  --chart-2:             38 90% 50%;
  --chart-3:             152 60% 36%;
  --chart-4:             262 60% 50%;
  --chart-5:             0 72% 50%;

  --radius:              0rem;           /* NO rounded corners */
  --sidebar-width:       16rem;
}
```

### Foundations — Dark Mode

```css
.dark {
  --background:          222 20% 7%;     /* #0e1118 — deep blue-black */
  --foreground:          220 14% 90%;    /* #e0e4ea — cool off-white */

  --card:                222 18% 10%;    /* #141820 — elevated surface */
  --card-foreground:     220 14% 90%;

  --popover:             222 18% 10%;
  --popover-foreground:  220 14% 90%;

  --muted:               222 16% 16%;    /* #222836 — recessed areas */
  --muted-foreground:    220 10% 55%;    /* #808994 — secondary text */

  --accent:              222 16% 18%;    /* #272d3c — hover/selected */
  --accent-foreground:   220 14% 90%;

  --border:              222 14% 20%;    /* #2c3040 — structural borders */
  --input:               222 14% 20%;
  --ring:                192 90% 50%;

  --primary:             192 90% 50%;    /* #0dbfe6 — brighter cyan for dark bg */
  --primary-foreground:  222 20% 7%;     /* dark text on cyan */

  --secondary:           38 85% 55%;     /* #f0b429 — warmer amber for dark bg */
  --secondary-foreground: 38 95% 10%;

  --destructive:         0 72% 55%;      /* #df4444 — brighter red for dark bg */
  --destructive-foreground: 0 0% 100%;

  --success:             152 60% 42%;    /* #2da86b — brighter green for dark bg */
  --success-foreground:  0 0% 100%;

  --warning:             38 85% 55%;
  --warning-foreground:  38 95% 10%;

  --chart-1:             192 90% 50%;
  --chart-2:             38 85% 55%;
  --chart-3:             152 60% 42%;
  --chart-4:             262 60% 58%;
  --chart-5:             0 72% 55%;

  --radius:              0rem;
}
```

### shadcn Radius Override

Every shadcn component must render with sharp corners. In `tailwind.config.ts`:

```ts
theme: {
  extend: {
    borderRadius: {
      lg: "0",
      md: "0",
      sm: "0",
    },
  },
}
```

And in the shadcn `components.json`:

```json
{
  "style": "default",
  "tailwind": {
    "cssVariables": true
  },
  "aliases": {},
  "rsc": false
}
```

---

## Spacing

4px base unit. Compact density is the default — use the tighter end of the scale for cards, tables, and data views.

| Token | Value | Usage |
| --- | --- | --- |
| `space-0.5` | 2px | Inline icon gaps, hairline padding |
| `space-1` | 4px | Badge padding, tight inline spacing |
| `space-1.5` | 6px | Small button padding-y, compact list item gap |
| `space-2` | 8px | Card internal padding (compact), table cell padding |
| `space-3` | 12px | Card internal padding (standard), form field gap |
| `space-4` | 16px | Section gap within a card, sidebar item height |
| `space-5` | 20px | Card-to-card gap, column gap |
| `space-6` | 24px | Section separator, panel padding |
| `space-8` | 32px | Major section gap |
| `space-10` | 40px | Page-level vertical rhythm |
| `space-12` | 48px | Top-level layout padding |
| `space-16` | 64px | Max panel/column gap |

### Density Contexts

- **Board view**: `space-2` card padding, `space-1.5` between card elements, `space-3` column gap
- **Detail view**: `space-3` to `space-4` section padding, `space-2` between fields
- **Log viewer**: `space-1` line padding, `space-0.5` inline gaps
- **Tables**: `space-2` cell padding, `space-1` header padding-y

---

## Borders

Borders are the primary surface-definition mechanism. No glassmorphism. Minimal shadows.

| Token | Value | Usage |
| --- | --- | --- |
| `border-default` | `1px solid hsl(var(--border))` | Card edges, panel dividers, input borders |
| `border-strong` | `1px solid hsl(var(--foreground) / 0.2)` | Active/focused elements, selected cards |
| `border-accent` | `1px solid hsl(var(--primary))` | Primary action borders, active tab indicator |

### Shadow Usage

Shadows are used sparingly and only for elevation cues (popovers, dropdowns, command palette):

```css
--shadow-popover: 0 4px 12px hsl(var(--foreground) / 0.08);
--shadow-dropdown: 0 2px 8px hsl(var(--foreground) / 0.06);
```

No card shadows. No decorative shadows.

---

## Attention States

Every task card displays an attention state badge indicating what the task needs from the operator. These 7 states are the primary human-actionability signals.

| State | Color Token | Light Value | Dark Value | Badge Label | Visual Treatment |
| --- | --- | --- | --- | --- | --- |
| `actively_working` | `--state-working` | `152 60% 36%` | `152 60% 42%` | WORKING | Green badge, subtle pulse animation on border-left (2px solid) |
| `awaiting_human_input` | `--state-input` | `38 90% 50%` | `38 85% 55%` | NEEDS INPUT | Amber badge, amber left-border accent |
| `awaiting_human_approval` | `--state-approval` | `45 85% 45%` | `45 80% 52%` | NEEDS APPROVAL | Gold badge, gold left-border accent |
| `blocked` | `--state-blocked` | `0 72% 50%` | `0 72% 55%` | BLOCKED | Red badge, red left-border accent, elevated visual weight |
| `ready_for_feedback` | `--state-feedback` | `192 70% 38%` | `192 70% 45%` | READY FOR REVIEW | Teal badge, teal left-border accent |
| `ready_to_archive` | `--state-archive` | `220 10% 55%` | `220 10% 50%` | ARCHIVE | Muted gray badge, dimmed card opacity (0.75) |
| `paused_for_human` | `--state-paused` | `220 10% 42%` | `220 10% 48%` | PAUSED | Dark gray badge, muted card styling, no border accent |

### Attention State CSS Variables

```css
:root {
  --state-working:   152 60% 36%;
  --state-input:     38 90% 50%;
  --state-approval:  45 85% 45%;
  --state-blocked:   0 72% 50%;
  --state-feedback:  192 70% 38%;
  --state-archive:   220 10% 55%;
  --state-paused:    220 10% 42%;
}

.dark {
  --state-working:   152 60% 42%;
  --state-input:     38 85% 55%;
  --state-approval:  45 80% 52%;
  --state-blocked:   0 72% 55%;
  --state-feedback:  192 70% 45%;
  --state-archive:   220 10% 50%;
  --state-paused:    220 10% 48%;
}
```

### Card Attention Treatment

Each task card uses a **2px left border** colored by attention state. The badge appears in the card header using `text-xs` uppercase Chakra Petch with the state color as background and white/dark foreground.

```
┌─────────────────────────────┐
│▌ NEEDS INPUT  Task Title    │  ← 2px amber left border, amber badge
│  Stage: Research            │
│  Last update: 2m ago        │
│  ● 3 open items             │
└─────────────────────────────┘
```

For `blocked`: additionally apply a faint red background tint (`hsl(var(--state-blocked) / 0.06)` light, `/ 0.1` dark) to the entire card.

For `actively_working`: the left border pulses with a subtle opacity animation (0.4 → 1.0, 2s ease-in-out, infinite).

---

## Workflow Stages

The 7 workflow stages are the kanban columns. Each gets a distinct hue for column headers and stage badges displayed on task cards.

| Stage | Token | Light Value | Dark Value | Column Header Treatment |
| --- | --- | --- | --- | --- |
| `inbox` | `--stage-inbox` | `220 10% 50%` | `220 10% 55%` | Neutral gray — unprocessed |
| `discovery` | `--stage-discovery` | `215 70% 50%` | `215 70% 58%` | Blue — exploration |
| `research` | `--stage-research` | `262 55% 52%` | `262 55% 60%` | Violet — planning and design |
| `build_test` | `--stage-build` | `192 90% 42%` | `192 90% 50%` | Cyan (primary) — active development |
| `feedback` | `--stage-feedback` | `38 90% 50%` | `38 85% 55%` | Amber (secondary) — human review |
| `deploy` | `--stage-deploy` | `152 60% 36%` | `152 60% 42%` | Green — shipping |
| `done` | `--stage-done` | `220 10% 65%` | `220 10% 40%` | Muted gray — terminal |

### Stage CSS Variables

```css
:root {
  --stage-inbox:     220 10% 50%;
  --stage-discovery: 215 70% 50%;
  --stage-research:  262 55% 52%;
  --stage-build:     192 90% 42%;
  --stage-feedback:  38 90% 50%;
  --stage-deploy:    152 60% 36%;
  --stage-done:      220 10% 65%;
}

.dark {
  --stage-inbox:     220 10% 55%;
  --stage-discovery: 215 70% 58%;
  --stage-research:  262 55% 60%;
  --stage-build:     192 90% 50%;
  --stage-feedback:  38 85% 55%;
  --stage-deploy:    152 60% 42%;
  --stage-done:      220 10% 40%;
}
```

### Column Header

Each kanban column header displays the stage name in Chakra Petch `text-sm` uppercase with `letter-spacing: 0.04em`. A 2px bottom border in the stage color separates the header from the card stack. The header also shows a task count badge.

```
 DISCOVERY (3)
─────────────────  ← 2px bottom border in stage blue
 [card]
 [card]
 [card]
```

### Dual-State Display

Every task card shows **both** its workflow stage (where it is) and its attention state (what it needs). Stage appears as a small colored dot + label. Attention state is the prominent badge with left-border treatment.

---

## Component Guidelines

All components use shadcn/ui primitives with the token overrides defined above.

### Surfaces

- **Cards**: `1px` border, `--card` background, no shadow, no border-radius. Padding: `space-2` (compact) or `space-3` (standard).
- **Panels/Sidebars**: `1px` right or left border as divider, `--background` fill.
- **Popovers/Dropdowns**: `1px` border, `--popover` background, `--shadow-popover` shadow. These are the only elements that use shadow.
- **Dialogs**: `1px` border, centered, `--card` background, `--shadow-popover` shadow. Overlay is `hsl(var(--foreground) / 0.5)`.

### Buttons

| Variant | Background | Border | Text | Hover |
| --- | --- | --- | --- | --- |
| Primary | `--primary` | none | `--primary-foreground` | Lighten 5% |
| Secondary | transparent | `1px --border` | `--foreground` | `--accent` bg |
| Destructive | `--destructive` | none | `--destructive-foreground` | Lighten 5% |
| Ghost | transparent | none | `--muted-foreground` | `--accent` bg |
| Outline | transparent | `1px --border` | `--foreground` | `--accent` bg |

All buttons: `text-sm` Outfit, `font-weight: 500`, padding `space-1.5 space-3`, no border-radius.

### Badges / Status Labels

- Attention state badges: `text-xs` Chakra Petch uppercase, `letter-spacing: 0.04em`, padding `space-0.5 space-1.5`, state color background, contrasting foreground.
- Stage badges: small colored dot (6px) + `text-xs` Outfit label in `--muted-foreground`.
- Count badges: `text-xs` JetBrains Mono, `--muted` background, `--muted-foreground` text.

### Tables

- Header: `text-xs` Outfit uppercase, `letter-spacing: 0.04em`, `--muted` background, `--muted-foreground` text.
- Cells: `text-sm`, `space-2` padding, `1px` bottom border.
- Hover row: `--accent` background.
- Monospace cells (IDs, hashes, timestamps): JetBrains Mono `text-xs`.

### Tabs

- Tab bar: `1px` bottom border in `--border`.
- Active tab: `--foreground` text, `2px` bottom border in `--primary`, no background change.
- Inactive tab: `--muted-foreground` text, no border.
- Hover: `--foreground` text.

### Inputs

- Border: `1px --input`, `--card` background, `text-base` Outfit.
- Focus: `--ring` outline (2px), `--primary` border.
- Padding: `space-1.5 space-2`.
- No border-radius.

### Log Viewer

- Background: `--background` (or slightly darker in light mode).
- Font: JetBrains Mono `text-xs`, line-height `1.5`.
- Line numbers: `--muted-foreground`, right-aligned, `space-3` right-margin.
- Alternating line backgrounds: transparent / `hsl(var(--muted) / 0.3)`.
- Error lines: faint red left-border (2px `--destructive`).
- Streaming indicator: blinking cursor or `...` at the end of the last line.

### Artifact Preview

- Container: `1px` border, `--card` background, `space-2` padding.
- Header bar: filename/type label in `text-xs` JetBrains Mono, `--muted` background strip.
- Collapsible: chevron toggle, collapsed by default for non-primary artifacts.
- Format-specific rendering: Markdown (rendered), JSON (syntax-highlighted, collapsible nodes), diffs (unified format with red/green line highlighting), images (inline with max-height constraint), plain logs (log viewer style).

---

## Motion

Motion is functional only. No decorative transitions.

| Element | Animation | Duration | Easing |
| --- | --- | --- | --- |
| `actively_working` border pulse | opacity 0.4 → 1.0 | 2s | ease-in-out, infinite |
| SSE streaming indicator | opacity blink | 1s | steps(2), infinite |
| Card entering column (drag) | opacity 0 → 1, translateY 4px → 0 | 150ms | ease-out |
| Popover/dropdown open | opacity 0 → 1, translateY -2px → 0 | 100ms | ease-out |
| Dialog open | opacity 0 → 1, scale 0.98 → 1 | 150ms | ease-out |
| Collapsible expand | height 0 → auto | 150ms | ease-out |
| Tab switch content | none (instant) | — | — |

No hover transitions on cards. No parallax. No spring physics.

---

## Layout

### Board View (Primary)

```
┌──────────────────────────────────────────────────────────────────┐
│  DELIVERATOR              [filters] [search] [view] [settings]  │  ← sticky header
├──────┬──────┬──────┬──────┬──────┬──────┬──────────────────────┤
│INBOX │DISC. │RES.  │BUILD │FEED. │DEPL. │DONE                  │  ← stage columns
│ (2)  │ (3)  │ (1)  │ (4)  │ (2)  │ (0)  │ (12)                │
│──────│──────│──────│──────│──────│──────│──────                 │
│[card]│[card]│[card]│[card]│[card]│      │[card]                │
│[card]│[card]│      │[card]│[card]│      │[card]                │
│      │[card]│      │[card]│      │      │...                   │
│      │      │      │[card]│      │      │                      │
└──────┴──────┴──────┴──────┴──────┴──────┴──────────────────────┘
```

- Columns: CSS Grid or flexbox with `min-width: 200px`, horizontal scroll if needed.
- Column width: flexible, minimum `200px`, equal distribution.
- `done` column: collapsible or condensed by default.
- Sticky column headers.
- Drag-and-drop for manual transitions (constrained to allowed transitions).

### Task Detail View

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Back to Board    TASK-042: Implement auth middleware         │
│  Stage: BuildTest   State: WORKING                              │
├──────────────────────────────────────────────────────────────────┤
│  [Overview] [Plan] [Artifacts] [Runs] [Comments]                │  ← tabs
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Tab content area                                                │
│                                                                  │
│  Allowed next moves: [→ Feedback] [→ Research]                  │  ← action bar
└──────────────────────────────────────────────────────────────────┘
```

- 2 clicks max from board to any detail (ExecPlan, OpenSpec, build report).
- "Allowed next moves" always visible below content.
- Comments trigger visible reaction/rerun scheduling indicators.

---

## Accessibility

- Minimum contrast ratio: 4.5:1 for body text, 3:1 for large text and UI components.
- All attention state colors verified against both light and dark backgrounds.
- State badges include text labels — color is never the sole differentiator.
- Focus indicators: 2px `--ring` outline on all interactive elements.
- Keyboard navigation: tab through cards, arrow keys within columns, Enter to open detail.
- Reduced motion: respect `prefers-reduced-motion` — disable the `actively_working` pulse and all `translateY` transitions.

---

## Z-Index Scale

| Layer | Value | Usage |
| --- | --- | --- |
| Base content | `0` | Cards, panels, page content |
| Sticky headers | `10` | Board header, column headers |
| Dropdowns | `20` | Context menus, select popovers |
| Dialogs | `30` | Modal dialogs, approval prompts |
| Overlay | `25` | Dialog backdrop |
| Toast / Notifications | `40` | Ephemeral alerts |
| Command palette | `50` | Global command palette |

---

## Breakpoints

| Name | Min Width | Board Behavior |
| --- | --- | --- |
| `sm` | 640px | Single column, swipeable stages |
| `md` | 768px | 3 visible columns, horizontal scroll |
| `lg` | 1024px | 5 visible columns |
| `xl` | 1280px | All 7 columns visible |
| `2xl` | 1536px | All 7 columns with expanded widths |

The board is the primary view. On `sm`, collapse to a single-column list grouped by stage with collapsible sections.

---

## Dark / Light Mode

- Default: respect `prefers-color-scheme` system setting.
- Manual toggle available in the header.
- Implementation: `.dark` class on `<html>` element, toggled via JS.
- All color tokens have both light and dark values defined above.
- Do not mix opacity-based theming with mode switching — every surface has an explicit token for each mode.

---

## File Reference

When implementation begins, tokens and overrides live in:

| File | Contents |
| --- | --- |
| `apps/server/web/app.css` | CSS custom properties (all tokens defined in this document) |
| `tailwind.config.ts` | Theme extension, font families, radius overrides |
| `components.json` | shadcn configuration |
| `apps/server/web/index.html` | Google Fonts link tags (Chakra Petch, Outfit, JetBrains Mono) |
