# SUPER PROMPT — Redesign the front end of "KOHLER Facility Monitor"

> Paste everything below into Cursor / Claude Code / Codex, opened at the repo root. Screenshots or a screen recording of the current app should be attached to the same message.

---

## 1. Role & mission

You are a **senior front-end engineer with strong design taste** (think the Linear / Vercel / Stripe / Datadog design teams). Your mission is to redesign the visual layer and UX of **KOHLER Facility Monitor**, an airport restroom operations platform (Terminal 2, 17 smart fixtures, 4 zones), so it looks hand-crafted by a senior design team and not auto-generated.

The primary user is a facility manager or operations staff member, often on a tablet, scanning for **what needs action now**. Secondary users are sustainability and executive reviewers.

**Study first, then build.** Before writing any code:

1. Look at every attached screenshot and recording frame. Inventory each page and each state (loading, empty, expanded, modal, drawer, replay mode).
2. Read `frontend/AGENTS.md`. It says this Next.js version has breaking changes. Read the relevant guides in `frontend/node_modules/next/dist/docs/` before touching `next.config.ts`, fonts or layout files.
3. Read every file in `frontend/app/` and `frontend/components/`.
4. Run the app. In one terminal, from the repo root: `pip install -r requirements.txt` then `python -m uvicorn src.api:app --host 127.0.0.1 --port 8000`. In another terminal, from `frontend/`: `npm install && npm run dev`. `next.config.ts` proxies `/api/*` to `127.0.0.1:8000`. If the backend can't run, build against the types in `components/types.ts` with local fixtures and say so.
5. Take "before" screenshots (Section 10) **before you change anything**.

### Detected stack (respect it, do not migrate)

- Next.js 16.3.5 (App Router) and React 19.2.8.
- Tailwind CSS v4 via `@import "tailwindcss"` and `@theme` in `app/globals.css`. There is no `tailwind.config.js`.
- Recharts 3.x and `lucide-react`.
- Fonts via `next/font/google` (currently Geist and Geist Mono).
- The app is a single client page, `app/page.tsx`. It switches views with an `activeTab` state across 7 tabs: `dashboard | tickets | sustainability | health | hygiene | carbon | sensors`.
- Components live in `components/`: `Header`, `MetricCards`, `FlowRateChart`, `ReplayScrubber`, `OccupancyHeatmap`, `CarbonBreakdownCard`, `TicketsView`, `EvidencePanel`, `FixtureHealthView`, `HygieneView`, `CarbonView`, `SustainabilityPanel`, `SensorIntelligenceSection`, `AiCopilotDrawer`.

**Assumption:** the Sustainability tab exists in code but was not in my brief. Treat it as the "water savings" view and fold it into an "Impact" navigation group with Carbon (Sections 4 and 5).

### HARD RULES: do not change

- **Data and API:** all `fetch` calls, endpoints, query params, payload shapes (`/api/overview`, `/api/tickets`, `/api/tickets/:id/status` PATCH, `/api/fixture-health`, `/api/readings`, `/api/readings/zone-totals`, `/api/occupancy-heatmap`, `/api/hygiene/*`, `/api/carbon/summary`, `/api/sensors`, `/api/sustainability/summary`, `/api/digests`), `components/types.ts`, `next.config.ts` rewrites, and everything under `src/` and `facility.db`.
- **Business logic:** the optimistic ticket update and revert-on-error, Replay filtering (`replayCutoffDate`, `activeReadings`, `activeTickets`, `activeMetrics`), the date-range filter semantics, and the hygiene complete-event and clean-zone handlers and their payloads.
- **Feature set:** all 7 tab ids and views, the ticket workflow (open → dispatched → resolved with resolution note), evidence breakdown, replay with scrubber, heatmap, searchable sensors, the AI Copilot chat, and the hygiene audit log. Nothing is removed. Anything shown by default and demoted moves behind a visible disclosure, never deleted.
- **No new dependencies without a stated reason.** Allowed: `clsx`, `tailwind-merge`, `@radix-ui/react-*` primitives (Dialog, Popover, Tooltip, Tabs, Select, ToggleGroup), `class-variance-authority`. Not allowed: a component framework that brings its own theme (MUI, Chakra, Ant, etc.).
- Anything new that isn't a pure restyle (derived "Attention now" lists, suggested prompt chips) must use **only already-fetched state or the existing handlers**. Never invent data. If a field doesn't exist, the UI element doesn't render.
- Do not edit `README.md`, the PDFs or the `*.md` planning docs.

---

## 2. Design direction

**"Porcelain & brass": calm, precise, industrial-editorial.** The interface should feel like a well-set technical manual for a very good bathroom: warm porcelain neutrals, one disciplined brass accent, hairline rules instead of boxes, and numbers set large and quiet.

- **It is:** restrained and confident, generous whitespace, typographic hierarchy doing the work that borders do now, colour reserved for meaning, data presented like an editorial figure (direct labels, light gridlines, one clear focal mark).
- **It is NOT:** neon, glassmorphism, gradient-heavy, glowing, "AI dashboard" with sparkle gradients, or a wall of identical bordered rounded rectangles.
- **Default theme is light** (porcelain). Dark is a first-class, fully designed second theme. It uses warm graphite, **not** blue-black. Add a theme toggle in the app shell. Respect `prefers-color-scheme` on first load and persist the choice in `localStorage`. Guard against SSR flash with an inline script that sets `data-theme` before paint.
- **Hierarchy is created by tiers** (Section 4), not by uniform boxes. One hero element per screen, a few standard modules, and everything else flat on the canvas separated by hairlines and spacing.
- **Hue budget:** neutral + one accent (brass) + four status colours that mean only status. Charts get their own restrained categorical set, used only inside plot areas.
- **Tone of voice:** plain operational English. Short, specific and human ("Fixture T2-WC-03 is leaking about 2.4 L/min").

---

## 3. Design tokens (paste-ready)

Implement as CSS variables in `app/globals.css` and expose them to Tailwind v4 through `@theme inline`. Theme switching is via `:root[data-theme="dark"]`. **Delete** the current `.bg-page`, `.bg-\[\#080808\]` and similar `!important` override hacks, the `.glow-brass` and `.glow-steel` classes, and every hard-coded hex colour class (`bg-[#101010]`, `text-[#8B949E]`, `border-white/[0.08]`, etc.) across all components. After the migration, **no component may contain a raw hex value or `rgba()` colour**. Only semantic tokens.

### 3.1 Colour

**Neutral scale (10 steps, warm stone)**

| Token | Hex | Token | Hex |
|---|---|---|---|
| `--n-50` | `#F7F6F3` | `--n-500` | `#8C887E` |
| `--n-100` | `#EFEDE8` | `--n-600` | `#6B675E` |
| `--n-200` | `#E1DED7` | `--n-700` | `#4A4740` |
| `--n-300` | `#CBC7BE` | `--n-800` | `#2A2926` |
| `--n-400` | `#9A968C` | `--n-900` | `#1A1917` |

Dark-only extra neutrals: `--n-950: #121211` (canvas), `--n-875: #24231F` (raised), `--n-825: #34322D` (border).

**Semantic surface and text tokens**

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg-canvas` | `#F7F6F3` | `#121211` | page background |
| `--bg-surface` | `#FFFFFF` | `#1A1917` | hero and standard cards, tables, drawers |
| `--bg-raised` | `#FFFFFF` | `#24231F` | popovers, menus, modals (plus elevation) |
| `--bg-subtle` | `#EFEDE8` | `#24231F` | row hover, segmented-control track, skeleton base |
| `--border-hairline` | `#E1DED7` | `#34322D` | dividers, card edges (decorative) |
| `--border-strong` | `#8C887E` | `#6B675E` | input borders and interactive-control edges (≥3:1) |
| `--text-1` | `#1A1917` | `#F2F0EB` | headings, metric values, primary text |
| `--text-2` | `#4A4740` | `#BDB9AF` | body, table cells |
| `--text-3` | `#6B675E` | `#9A968C` | labels, captions, placeholder (never below this) |
| `--on-ink` | `#FFFFFF` | `#121211` | text on primary (ink) buttons |
| `--ink` | `#1A1917` | `#F2F0EB` | primary button fill |

**Brand accent (one only): brass.** Used for: the active-nav indicator, links, focus rings, selected segmented-control underline, and the brand mark. **Never** for status, **never** as a data fill, **never** in gradients, and **never** as a button fill. Primary buttons are ink-filled.

| Token | Light | Dark |
|---|---|---|
| `--accent-text` | `#7A5A1E` | `#D9AE68` |
| `--accent-ring` | `#A8761F` | `#D9AE68` |
| `--accent-tint` | `#F6EEDC` | `#2E2616` |

**Semantic status colours, used only for status** (each has `fg` text/icon, `tint` background, and `solid` for dots and bars):

| Status | Meaning | Light fg / tint / solid | Dark fg / tint / solid |
|---|---|---|---|
| `critical` | act now, active loss or failure | `#B42318` / `#FEF0EE` / `#D92D20` | `#FF8F85` / `#3A1E1B` / `#F97066` |
| `warning` | degrading, schedule soon | `#9A4A06` / `#FFF3E0` / `#DC6803` | `#F5B04A` / `#33260F` / `#F79009` |
| `healthy` | within normal range | `#067647` / `#E8F6EE` / `#12B76A` | `#4CC38A` / `#142A1F` / `#32D583` |
| `info` | in-progress or neutral information (e.g. "Dispatched") | `#175CD3` / `#EAF2FE` / `#2E90FA` | `#8AB8FF` / `#16243B` / `#53B1FD` |

Measured contrast (WCAG 2.x):

| Pair | Ratio |
|---|---|
| Light `text-1` on `bg-surface` | 17.6:1 |
| Light `text-2` on `bg-surface` | 9.3:1 |
| Light `text-3` on `bg-surface` | 5.6:1 |
| Dark `text-1` on `bg-surface` | 15.4:1 |
| Dark `text-2` on `bg-surface` | 9.0:1 |
| Dark `text-3` on `bg-surface` | 6.0:1 |
| Light `fg` on its `tint` | 5.1:1 to 5.9:1 |
| Dark `fg` on its `tint` | 6.9:1 to 7.9:1 |
| Light accent ring on canvas | 3.7:1 |
| Dark accent ring on canvas | 9.1:1 |
| Strong border on surface (light / dark) | 3.5:1 / 3.1:1 |

Targets: body and label text **≥ 4.5:1**, large text (≥ 24px, or ≥ 18.66px bold) **≥ 3:1**, UI component edges, icons and chart marks **≥ 3:1**. Verify with a script (`wcag-contrast` or similar) in the Definition of Done. If a pair you add fails, darken or lighten it. Never ship a failing pair.

**Colour usage rules**

1. A status colour appears **only** where something has a status. Never as decoration, never for a category, never for a chart series.
2. Status is **never carried by colour alone**. Always pair with an icon shape (critical: octagon-alert, warning: triangle-alert, healthy: circle-check, info: info or clock) **and** a text label.
3. Severity mapping for tickets is fixed: Critical → `critical`, High → `critical` with a lighter treatment (icon + text only, no tint), Medium → `warning`, Low → neutral (`text-3`, no colour). Do not use orange, purple or indigo for severity.
4. Brass is chrome, not data. Red is rare by design: if more than ~10% of the viewport is red, something is wrong.
5. Large areas are always neutral. Status tints only on small elements (badge, 3px row rail, alert band background at `tint`).

**Categorical chart palette** (zones only, **only inside chart plot areas and their legends**; Okabe-Ito subset, colour-blind safe):

| Zone | Light | Dark | Line style (secondary encoding) |
|---|---|---|---|
| Restroom A (Departure) | `#0072B2` | `#56A8E0` | solid |
| Restroom B (Arrival) | `#B5558C` | `#E59BC4` | long dash |
| Family room | `#B87800` | `#F0B84A` | dot |
| Staff WC | `#3A9AD0` | `#9AD3F2` | dash-dot |

Replace `--zone-restroom-a/b`, `--zone-family-room`, `--zone-staff-wc` and the hex map in `FlowRateChart.tsx`. Zone chips outside charts use **no colour**. They are neutral text with a small hollow marker. Delete the "Anomaly Metadata Category Tags" navy tokens (`--tag-*`).

**Sequential scale for the occupancy heatmap** (single hue, monotonic lightness, colour-blind safe; 8 stops, low → high):

- Light theme: `#EEF3F6, #CFE1EA, #A6C9DA, #77AECB, #4A8FB8, #2B6E9A, #174E78, #0C3556`
- Dark theme (lightness rises with value): `#1B2430, #20405A, #25607F, #2F82A5, #4FA5C7, #86C7DD, #C4E6F0, #F0FAFD`

Interpolate in OKLab between stops. Empty or no-data cells use a diagonal hatch in `--border-hairline`, never a colour.

### 3.2 Typography

- **UI typeface: IBM Plex Sans** (weights 400, 500, 600) via `next/font/google` as `--font-sans`. Fallbacks: `"IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`.
- **Data/mono face: IBM Plex Mono** (400, 500) as `--font-mono`. Fallbacks: `"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`.
- **Mono is only for:** IDs, fixture codes, timestamps in tables, and code-like values. **Not** for headings, labels, buttons, prose, or big KPI numbers.
- **All metrics and table numerals** use `font-variant-numeric: tabular-nums` (utility class `.num`). Apply `font-feature-settings: "tnum" 1, "zero" 0` to Plex Sans for numbers.
- Remove the `Geist` and `Geist_Mono` imports from `app/layout.tsx`.

| Token | Size / line-height | Weight | Tracking | Use |
|---|---|---|---|---|
| `metric-hero` | 48px / 52px (3rem / 3.25rem) | 500 | -0.02em | the one hero number per screen |
| `metric-lg` | 32px / 36px | 500 | -0.015em | secondary KPI values |
| `h1` | 28px / 36px | 600 | -0.01em | page title |
| `h2` | 20px / 28px | 600 | -0.005em | section title |
| `h3` | 16px / 24px | 600 | 0 | card title |
| `body` | 14px / 22px | 400 | 0 | default text, table cells |
| `body-lg` | 16px / 24px | 400 | 0 | drawer and modal prose, Copilot messages |
| `label` | 12px / 16px | 500 | 0.01em | field labels, column headers, KPI captions (sentence case) |
| `caption` | 12px / 16px | 400 | 0.01em | helper text, chart axis ticks, timestamps |
| `eyebrow` | 12px / 16px | 600 | 0.08em, uppercase | **max one per page** (e.g. "Terminal 2"). Nowhere else. |

**Floors:** body ≥ 14px, label and caption ≥ 12px. **There must be zero** `text-[9px]`, `text-[10px]` or `text-[11px]` in the codebase (currently ~137 occurrences). Chart axis ticks are 12px. Use `rem`, not `px`, in Tailwind theme values, and use `max-width: 68ch` for any running text. Sentence case everywhere. The current ~70 `uppercase tracking-wider` micro-labels become `label` style in sentence case.

### 3.3 Spacing, radius, border, elevation, grid

- **Spacing** (4px base): `0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80`. Card padding 20px (hero 24px). Gap between modules 24px. Between sections 40px. Table row height 48px (comfortable) or 40px (dense, toggled).
- **Radius:** `--r-sm: 4px` (badges, inputs' inner elements), `--r-md: 8px` (buttons, inputs, standard cards), `--r-lg: 12px` (hero cards, modals, drawers), `--r-full` only for dots and avatars. **Never** mix other values. Delete all `rounded-xl/2xl/3xl` and arbitrary radii.
- **Border:** 1px hairline (`--border-hairline`) for structure. Interactive controls use `--border-strong`. No 2px borders except focus rings. No coloured borders on cards.
- **Elevation:** light theme `--shadow-1: 0 1px 2px rgb(26 25 23 / 0.06)` (hero cards only), `--shadow-2: 0 4px 16px rgb(26 25 23 / 0.10)` (popovers), `--shadow-3: 0 16px 48px rgb(26 25 23 / 0.16)` (modal, drawer). Dark theme uses **surface lightness** for elevation (`bg-surface` → `bg-raised`) plus the same shadows at 0.4 opacity. No glows, no inner shadows.
- **Layout grid:** max content width **1440px**, 12 columns, gutter 24px (16px below 1024), side margins 32px (≥1280), 24px (768–1279), 16px (<768). Breakpoints: `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`. Replace `max-w-7xl` (1280) with the 1440 container.

### 3.4 Motion

- Durations: `--dur-fast: 120ms` (hover, press, focus), `--dur-base: 200ms` (menus, tabs, disclosure), `--dur-slow: 320ms` (drawer, modal).
- Easing: `--ease-out: cubic-bezier(0.2, 0, 0, 1)` for entering, `--ease-in: cubic-bezier(0.4, 0, 1, 1)` for leaving.
- **Allowed to animate:** `opacity`, `transform`, `background-color`, `border-color`, `box-shadow` (popovers), and chart first-draw (400ms, first mount only, **not** on data change or replay tick).
- **Not allowed:** layout properties (`width`, `height`, `top`), looping animations, pulsing badges, shimmer on anything except skeletons (1.2s linear, 2 stops), parallax.
- `@media (prefers-reduced-motion: reduce)`: all durations → 0.01ms, disable chart draw-in and skeleton shimmer (static `bg-subtle`).

---

## 4. Component specs

Build every component once under `components/ui/` and reuse. All support light and dark through tokens only. Every interactive component implements: **default / hover / focus-visible / active (pressed) / disabled / loading / empty / error** where applicable.

**Global focus style:** `outline: 2px solid var(--accent-ring); outline-offset: 2px;` on `:focus-visible`. Never remove the outline without replacement. Hover states are subtle (`bg-subtle`) and are never the only affordance.

### 4.1 App shell and navigation

**Anatomy:** a left rail (≥1280px: 232px wide; 768–1279px: 64px icon-only with tooltips; <768px: bottom tab bar with 4 primary items + "More") and a slim 56px top bar (page title, theme toggle, "Ask Copilot" button). The existing sticky top tab strip is removed.

- **Brand lockup:** "KOHLER" in 14px/600, tracking 0.12em; "Facility Monitor" in `text-3`, one line. Below it a `caption`: "Terminal 2 · 17 fixtures · 4 zones". No gradient, no icon chip.
- **Nav items:** 40px tall, 12px horizontal padding, icon 18px (lucide, 1.5 stroke) + `body` label. **Active** = `text-1`, weight 600, `bg-subtle`, plus a 2px brass bar on the left edge. **No** per-tab colour borders (currently blue / gold / green / cyan; delete). Inactive = `text-2`.
- **Order (grouped, with a hairline between groups):**
  - Operations: Overview (`dashboard`), Tickets, Fixture health (`health`), Hygiene, Sensors.
  - Impact: Water and carbon, which opens `sustainability` or `carbon`. Both views show the same segmented control at the top: "Water savings | Carbon". The `activeTab` ids are unchanged.
- **Count badges:** Tickets shows the open ticket count and Hygiene shows `hygieneAlertCount`. Style: 20px-high pill, `bg-subtle`, `text-1`, 12px/600 tabular. **Only Tickets turns `critical`** (tint + fg), and only when there is ≥1 critical open ticket. A hygiene count is `warning` only when it is a `critical_zones_count`. Never `99+` truncation below 100. Include an `aria-label` ("Tickets, 7 open").
- **AI Copilot entry:** top-bar button "Ask Copilot", ghost style (hairline border, `text-1`, sparkle icon in `accent-text`). **Delete** the gold/blue gradient button. On ≥1280px the Copilot panel docks to the right and the content area shrinks (no overlay). Below 1280px it overlays as a side drawer.
- **Footer:** delete the centred footer line. Move "Data as of {date}" into the page header where relevant.
- Hide the Next.js dev badge: set `devIndicators: false` in `next.config.ts` (verify the option name in the bundled docs first).

### 4.2 KPI / stat tile

- **Hero tile (one per screen):** label (`label`, `text-3`) on top, value `metric-hero`, unit in `body` `text-3` baseline-aligned (e.g. "/ 100", "L"), one-line context under it (`body`, `text-2`), optional delta. Nothing else. **No icon chip.**
- **Secondary tile:** same anatomy at `metric-lg`. Secondary tiles sit in one row **without individual card borders**, separated by 1px vertical hairlines (a "stat strip").
- **Delta:** `▲/▼` icon + value + comparison ("▼ 12% vs yesterday"), 12px tabular. Colour from semantic meaning, not direction (a falling water loss is `healthy`). Only render a delta when comparison data exists. Never fabricate.
- **Sparkline:** optional, 24px high × 96px wide, 1.5px stroke in `text-3` (or status colour only when it explains a status), no axes, no dots, last point marked with a 4px dot. Only on the hero tile and only if a series already exists in fetched data.
- **States:** loading = skeleton bar the size of the value (no "..." text), empty = "No data yet" in `text-3`, error = inline "Couldn't load" with a Retry link.

### 4.3 Cards: three tiers

| Tier | Use | Style |
|---|---|---|
| **Hero** | at most **1 per screen**: Attention-now band, primary chart | `bg-surface`, 1px hairline, `r-lg`, `shadow-1`, 24px padding |
| **Standard** | grouped modules: charts, zone cards, summary cards | `bg-surface`, 1px hairline, `r-md`, no shadow, 20px padding |
| **Flat / inline** | lists, tables, KPI strips, evidence, secondary sections | no background, no border; separated only by hairline `border-t` and 32–40px spacing |

Rules: never nest a bordered card inside a bordered card (use a flat subsection with a hairline). Never put a card around a table. The table is a flat region with a sticky header. Never exceed 3 standard cards in a visible row.

### 4.4 Status badge system

- **One filled badge per row/card, maximum.** Everything else is plain text.
- **Badge anatomy:** 24px high, `r-sm`, 8px padding, icon 14px + `label` text, `fg` on `tint`, no border. Used for: ticket **workflow state** (Open = `warning`, Dispatched = `info`, Resolved = `healthy`), fixture risk level, hygiene zone state, sensor online/offline.
- **Severity** is **not** a badge. It is a consistent pattern: a 3px left rail on the row/card in the status `solid` colour, plus an icon + word in the first column or header ("Critical", "High", "Medium", "Low"). Low has no rail colour.
- Issue type (Slow drip, Continuous flow…), zone and fixture are plain `text-2` / `text-3` text with a small neutral icon. They are **never** pills.
- Counts in parentheses beside severity, "High (51)", are removed. The score appears in the detail, not the row header.
- **Counter-example (don't):** `High (51)` + `Slow Drip` + zone + fixture + `Open` + `Mark Resolved` as six adjacent chips.

### 4.5 Tables and lists

For the ticket queue, hygiene audit log, zone table and sensor list.

- Real `<table>` semantics (`<th scope="col">`, `aria-sort` on sortable columns). Sticky header (`bg-surface`, 1px bottom hairline, `label` style). 48px rows (40px dense). Zebra none. Row hover `bg-subtle`. Row focus: the focus ring around the row, `tabindex=0` on expandable rows, Enter/Space toggles expansion.
- Numeric columns right-aligned, tabular, with units in the header (not repeated in every cell). Text columns left-aligned. Long text wraps to max 2 lines, then truncates with a title tooltip. Never truncate an identifier that the user must read in full (fixture names wrap).
- **Inline actions** appear at the row end: a primary text button for the next logical action (Open → "Dispatch", Dispatched → "Resolve") and an overflow menu for the rest. Actions are visible on hover and on focus-within, and **always visible on touch** (`@media (hover: none)`).
- Expansion pattern: chevron at the row start. Expanded content is a flat inset region (`bg-subtle` at 50% opacity, no border) containing details.
- States: loading = 6 skeleton rows, empty = icon + one sentence + the action that resolves it (e.g. "No open tickets. Everything flagged has been handled."), error = banner above the table with Retry.
- Pagination or virtualisation for >100 rows (the hygiene log fetches `limit=100`). A "Showing 100 most recent events" caption replaces "(100 events)".

### 4.6 Filters and segmented controls (one toolbar)

- One **toolbar row** per view: `[Search?] [Filter select(s)] ……… [view toggle] [secondary actions]`. 40px tall controls, 8px gaps, wraps cleanly under 1024px. Never stack more than one toolbar row.
- **Segmented control:** track `bg-subtle`, `r-md`, 2px inset; selected segment `bg-surface` + `text-1` + `shadow-1`. Radix ToggleGroup or Tabs. Roving tabindex with arrow keys. Max 4 segments. For more options use a Select.
- **Select / multi-select popover:** shows the current value and a count when multiple are selected ("Zones · 3 of 4"). Contains a "Clear" action.
- Active filters appear as removable plain-text chips only if the toolbar can't show the value. Prefer showing it in the control itself.
- "Filters:" uppercase label with funnel icon is deleted.

### 4.7 Modals and side drawers

- **Modal** (resolve ticket): 480px wide (full-screen sheet <640px), `r-lg`, `shadow-3`, `bg-raised`, scrim `rgb(18 18 17 / 0.5)`, 24px padding. Anatomy: title (`h2`), one-sentence description, the field(s), footer with right-aligned actions: Cancel (ghost) + Resolve ticket (ink primary). The primary is disabled until the required field is valid. Loading state keeps the button width and shows a spinner. Focus is trapped, initial focus on the first field, Esc closes, focus returns to the trigger. Use Radix Dialog.
- **Side drawer** (fixture health detail, Copilot on <1280px): 480px (full-width <640px), slides from the right in `dur-slow`, sticky header (title + close button 40×40 hit area) and sticky footer for actions, scrollable body. Never a nested scroll inside the drawer body.
- Both: close button has `aria-label="Close"`, background content gets `inert`.

### 4.8 Charts (Recharts, restyled; do not swap the library)

Global rules: 12px axis tick labels in `text-3`; gridlines horizontal only, 1px `--border-hairline` at 60% opacity, 4–5 ticks max; no chart borders, no vertical gridlines, no tick marks; plot margins consistent; chart title and unit in the card header (not inside the plot); number formats always use the shared formatters (Section 6); every chart container has `role="img"` and an `aria-label` summarising it, plus a visually-hidden data table fallback or "View as table" disclosure.

- **Flow telemetry (L/min):** replace the multi-series bars with **lines** (1.5px, `linear` interpolation, no dots, `connectNulls={false}`), category palette from 3.1 with the line-style secondary encoding. Default view = zone totals. Add a **focus + context brush** (Recharts `<Brush>`, 48px high, simplified overview line, `stroke` = `--border-strong`, travellers 12px wide with ≥44px touch hit area via padding). The brush replaces the 7 day-chips. Keep the existing date-range semantics but present them as one "Range" select (Full 7 days · Last 24 hours · then each day, with labels **derived from `metrics.sim_start`**, not hard-coded "Day 1 (Jan 15)").
- **Direct labels:** label the last point of each line with the zone name in the series colour at 12px/500, and drop the separate legend when ≤4 series. Keep a keyboard-focusable legend toggle only in "Per fixture" mode, which limits the default to the 6 highest-flow fixtures with a "Choose fixtures" popover.
- **Overplot control (presentation only):** when more than ~600 points are visible, bucket for display to hourly mean and show peak in the tooltip. **Do not mutate the source arrays.** Add a unit test proving the totals shown in tooltips match the source.
- **Tooltip:** one shared component. `bg-raised`, hairline, `shadow-2`, `r-md`, 12px padding. Header = formatted timestamp. Rows = swatch + zone name + value right-aligned tabular + unit. Cursor = 1px vertical `border-strong` line. Never orphaned outside the card. It must clamp to the viewport.
- **Replay mode:** the `ReplayScrubber` becomes a flat inline control directly under the chart (play/pause, speed if present, time readout, scrubber with 44px hit target). The chart shows a "now" vertical marker and dims the future region to `bg-subtle`.
- **Occupancy heatmap (17 fixtures × 24 h):** cell ≥ 28×24px with 2px gaps and `r-sm`, using the sequential ramp in 3.1. Row labels = fixture short names grouped by zone with a hairline separator and a zone label. Column labels every 3 hours at 12px. A gradient legend bar with min and max numbers and units. Tooltip on hover **and** focus (cells are focusable in a roving grid, arrow-key navigation). Highlight the busiest hour per row with a 2px `text-1` underline, not a colour.
- **Emissions (Carbon):** a single **stacked horizontal bar** for contributors with direct labels (name + kg CO₂e + %) above the segments, using **neutral ramp steps** (`n-800`, `n-600`, `n-400`) + one accent step only for "wasted/leaked" because that is the actionable segment. Never use zone colours here. The zone table gets inline data bars (4px, `n-400`).
- Loading = skeleton of the chart frame. Empty = "No readings in this range." with a "Reset range" action. Error = inline message + Retry.

### 4.9 Empty, loading and error states

- **Loading:** skeletons that match final geometry (no layout shift), 1.2s shimmer (disabled under reduced motion). Replace every "..." placeholder. Do not show spinners except inside buttons.
- **Empty:** 32px neutral line icon, `h3` title, one `body` sentence, one action. Never an emoji.
- **Error:** inline banner `critical` tint with icon, one human sentence, "Retry" (re-calls the existing fetch). Never expose stack traces or raw status codes (put them in a "Details" disclosure).
- Global top-level load error, if `/api/overview` fails: a full-width banner under the top bar. Content below stays usable with per-module errors.

### 4.10 AI Copilot panel

- Docked right panel (≥1280px, 400px) or drawer. Header: "Facility Copilot" `h3`, one-line `caption` ("Ask about water, leaks, tickets and fixtures"), close button. No gradient, no gold.
- **Messages:** user = right-aligned, `bg-subtle`, `r-lg` with a squared bottom-right corner, 14px. Assistant = left-aligned, **no bubble**, plain `body-lg` text on the canvas with a 2px brass hairline marker at its left (editorial style), 16px/24px. Keep the existing `**bold**` parsing, but style bold as weight 600 `text-1`. Timestamps are 12px `text-3`, shown on hover/focus or grouped per 5 minutes.
- **Suggested prompts:** when the conversation is empty, show 3 chips (e.g. "Which fixtures are leaking right now?", "How much water did we lose this week?", "What should housekeeping clean first?"). Clicking one submits through the **existing** send handler. No new endpoint.
- **Source / evidence chips:** render under an assistant message **only if** the response payload already contains references (ticket id, fixture id). Chips are neutral, 28px high, clicking navigates to that ticket or fixture using existing state setters. If the response has no references, render nothing.
- **Input:** auto-growing textarea, 14px+, `border-strong`, send button ink-filled, disabled when empty. Enter sends, Shift+Enter newline. Loading state: three-dot typing indicator (static under reduced motion) and a disabled send. Error: inline retry under the failed message.
- The placeholder "Ask about water waste, leaks, or tickets..." becomes "Ask the copilot…" (it's already described in the header).

---

## 5. Page-by-page redesign brief

### 5.1 Dashboard (`dashboard`)

**User question:** "What needs my attention right now, and is the facility OK overall?"

**Layout (top to bottom):**
1. **Page header:** `h1` "Overview", `caption` "Terminal 2 · data as of {sim end}", and on the right the Full dataset / Replay segmented control (moved from the chart header).
2. **"Attention now" band (hero card):** the only hero card on the screen. Left: a count headline ("3 things need action"). Then up to **3 rows**, ranked critical → warning, drawn from already-fetched state: top open tickets by severity and recency (from `tickets`/`activeTickets`), hygiene zones in critical or attention state (`hygieneSummary`), and fixtures at highest health risk (`fixtureHealth`). Each row: severity rail + icon, one-sentence description ("Fixture T2-WC-03 is leaking about 2.4 L/min, flagged 21 Jan 09:40"), location, and one inline action ("Review" → navigates to the item using existing `setActiveTab` plus an optional ticket focus, or "Dispatch" using the existing handler). Empty state: a calm `healthy` row "Nothing needs action. 17 of 17 fixtures operating normally."
3. **Stat strip (flat, no card borders):** hero = **Open tickets** (`metric-hero`, with "of N flagged"); then Facility health index (`/ 100`, "{x}/{17} optimal · {n} at risk"), Water lost (L, with ₹ cost impact beneath), and Carbon (kg CO₂e, linking to Impact). **Sensor readings** moves to a quiet `caption` at the bottom of the strip as "1,204,331 readings analysed" (system info, not a KPI).
4. **Flow telemetry** (standard card, full width): one toolbar row (Range select · Zones popover · Zone totals | Per fixture · Brush below). Replay scrubber appears flat under the chart when in Replay.
5. **Occupancy heatmap** (standard card, full width) with the gradient legend.
6. **Carbon:** delete the full `CarbonBreakdownCard` from the dashboard. The stat-strip Carbon tile already links to Impact. The detail lives only in the Impact view.

**Demote:** sensor reading count, carbon contributor breakdown, any "model" labels. **Delete:** "(17 fixtures monitored across 24 hours)", "7-Day Operational Model", and the duplicated carbon card.
**Components:** AttentionBand (hero), StatStrip, Toolbar, SegmentedControl, FlowChart, Heatmap, Skeleton.

### 5.2 Tickets (`tickets`)

**User question:** "Which incidents should I work first, and what do I do about each one?"

**Layout:**
1. Page header: `h1` "Tickets" + `caption` "{n} open · {m} dispatched · {k} resolved".
2. Compact status strip (flat): three numbers, Open / Dispatched / Resolved (these double as quick filters).
3. **One toolbar:** Status (segmented: Open · Dispatched · Resolved · All), Severity select, Issue type select, Zone select, Sort select (default: severity then newest).
4. **Queue table** (flat). Columns: Severity (rail + icon + word) · Issue (type + "Fixture T2-WC-03 · Restroom A (Departure)" on a second `caption` line) · Flagged (`21 Jan, 09:40`) · Water lost (L) · Cost (₹) · Status (the single badge) · Actions.
5. **Row expansion:** a one-sentence "What happened" built from existing fields ("Flow 2.4 L/min vs 0.3 expected for 6 h"), then the AI analysis text, then "Why was this flagged?" as an inline disclosure showing the `EvidencePanel`. In the evidence panel replace the "Evidence Weighting Formula" paragraph with a small info-icon popover titled "How evidence is weighted" (collapsed by default).
6. **Resolve modal** (4.7): ticket short ID + issue in the header, resolution-note textarea (required), Cancel / Resolve ticket.

**Promote:** severity and next action. **Demote:** ticket ID (short, copy-on-click, in the expanded view and tooltip), "If unresolved (24h)" projection (expanded only), "Counterfactual 24h Baseline Model" text (behind the info popover).
**Delete:** the Open | Dispatched | Resolved button group and a separate "Mark Resolved" button in each card (replaced by a single contextual action), repeated "AI Analysis" badge on every row.
**De-duplicate AI text:** if the same explanation string appears on ≥3 visible tickets, **do not render it in rows**. Show it once at the top of the queue as a flat note ("Most slow-drip tickets share this analysis: …") and, in the row, show only the specific per-ticket facts.

### 5.3 Fixture health (`health`)

**User question:** "Which fixtures are most likely to fail next, and why?"

**Layout:**
1. Header: `h1` "Fixture health", `caption` "{x} of 17 healthy · {n} at risk".
2. **Summary strip** (flat): facility health index (hero number) · healthy · watch · at risk counts.
3. **Toolbar:** Zone select · Risk level segmented (All · At risk · Watch · Healthy) · Sort (Risk high → low default).
4. **"Needs attention"** section: standard cards **only** for at-risk fixtures (fixture name, zone, risk score as `metric-lg`, top contributing factor in one sentence, a `warning`/`critical` badge, one "Review" action). Max 3 per row.
5. **"All fixtures"** as a dense flat table, sorted by risk: Fixture · Zone · Health score (with 4px inline bar in `n-400`) · Top factor · State. Rows open the drawer.
6. **Detail drawer:** header (fixture name, zone, state badge), health score as `metric-hero`, then **"Risk factors"**: six horizontal bars (neutral fill, label + value, sorted by contribution), then the single recommendation. Below it a flat disclosure "How the score is calculated" holds the weights and formula.

**Delete from the default view:** the "Section 1 Model" pill, "Transparent 6-Factor Health Formula (Section 1.3)", "Explainable Risk Components (Section 1.3)", the "Formula Weights" mono label. The existing "View Health Formula" toggle becomes the "How the score is calculated" disclosure and is closed by default.
**Recommendations:** the identical italic recommendation on every card is shown **only** for fixtures where it is actionable, and de-duplicated: group fixtures that share the same recommendation under one line ("Recommended for 4 fixtures: …").

### 5.4 Hygiene (`hygiene`)

**User question:** "Which zones need cleaning, and was cleaning actually done?"

**Layout:**
1. Header: `h1` "Hygiene", `caption` "Updated {time}" with a ghost "Refresh" button (existing `onRefresh`).
2. **Zone readiness:** 4 standard cards, one per zone (same order every time): zone name, readiness score `metric-lg`, state badge, one sentence ("Last cleaned 21 Jan, 06:15 · 118 visits since"), and a primary "Mark cleaned" action (existing `onCleanZone`). The state's colour appears only through the badge and a 3px top rail. No coloured card backgrounds.
3. **Cleaning audit log** (flat table, sticky header): Time · Zone · Type · Completed by · Score before → after · Action ("Complete" for pending events via the existing handler). Toolbar: Zone select · Status segmented (Pending · Completed · All).
4. "Decay Model" button and "Hygiene Score Mathematical Formulation" become a "How scores work" link opening a popover. Closed by default, plain-language text, no math notation in the default view.

### 5.5 Impact: Carbon and Sustainability (`carbon`, `sustainability`)

**User question:** "What is our environmental footprint and how much have we saved?"

**Layout (both views share the segmented control "Water savings | Carbon"):**
- **Carbon:** hero = total emissions (`metric-hero`, "kg CO₂e, 7 days"); secondary strip with the existing KPIs; the stacked contributor bar (4.8); then the zone table (flat, inline bars, sortable). No duplicate of the dashboard card.
- **Water savings:** hero = water saved/avoided (L), plus the existing counterfactual KPIs; zone breakdown as a flat table.
- Replace "Counterfactual Simulation Model (24h Baseline)" and "Conservation Methodology & Baseline Model" blocks with one "How we estimate this" disclosure (closed by default) containing the plain-language method and the formula underneath. "Avoided Volume Formula" lives inside it.

### 5.6 Sensors (`sensors`)

**User question:** "Is every sensor online, and which one do I check?"

**Layout:**
1. Header: `h1` "Sensors", `caption` "{n} online · {m} need attention".
2. Fleet summary strip (flat): online / degraded / offline counts.
3. **Toolbar:** search (keep the existing search behaviour) · Zone select · Status segmented · view toggle (List | Cards, **List default**).
4. **List (table):** Sensor · Fixture · Zone · Status (single badge) · Last seen · Signal. **Cards view** (standard tier) shows name, status badge, zone, and last seen only.
5. **Specs** (technology, brand/model, parameter measured) are moved to an expanded row / detail drawer. **Fix all truncation** (`truncate max-w-[170px]`): text wraps up to 2 lines, and the full text is in the drawer. No `...` on technical names such as "Dual-Beam Ultrasonic Occupancy".

### 5.7 AI Copilot

See 4.10. The entry point is the top-bar "Ask Copilot" button on every page. When opened from a ticket or fixture row, no pre-filled query is sent unless the user clicks a suggested prompt.

---

## 6. Copy & content rules

1. **Delete every developer- or spec-facing string** from default views: "Section 1 Model", "Section 1.3", "Formula Weights", "Evidence Weighting Formula" (default-visible), "Counterfactual … Model", "7-Day Operational Model", "Decay Model", "Mathematical Formulation", "(100 events)", "(17 fixtures monitored across 24 hours)". Method detail lives only in closed "How this works" disclosures.
2. **Sentence case** for all UI text (buttons, headings, labels, tabs). Proper nouns keep capitals (KOHLER, Terminal 2).
3. **One unit style:** flow = `L/min` (never `L/m`, `lpm`), volume = `L`, carbon = `kg CO₂e`, currency = `₹` via `Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })`, numbers via `Intl.NumberFormat("en-IN")`. Units appear in column headers / axis titles, not in every cell.
4. **One date/time style** from a single `lib/format.ts` (`formatDate`, `formatDateTime`, `formatRange`): lists and tables `21 Jan, 14:30` (24-hour); detail and tooltips `21 Jan 2024, 14:30`; ranges `21 Jan, 06:00 – 14:30`. Never ISO strings, never `01/15`, never `Jan 16, 2026`. The dataset is a simulated week (Jan 15–21, 2024), so **never compute "x hours ago" from the real clock**. Use absolute times, or relative to the dataset end timestamp.
5. **One zone/fixture naming source:** create `lib/names.ts` with a single `ZONE_LABELS` (`T2_Restroom_A` → "Restroom A (Departure)", `T2_Restroom_B` → "Restroom B (Arrival)", `T2_Family_Room` → "Family room", `T2_Staff_WC` → "Staff WC") plus short forms for tight spaces ("Restroom A"). Delete the six duplicate local maps (FlowRateChart, CarbonView, CarbonBreakdownCard, SensorIntelligenceSection, FixtureHealthView, HygieneView) and the inline `.replace("T2_", "")` hacks.
6. **IDs:** ticket IDs (`TKT-{fixture}-{timestamp}`) display as `TKT-…{last 6}` in monospace with a copy button (clipboard + "Copied" toast with `aria-live="polite"`), and the full ID in a tooltip and in the expanded view.
7. **De-duplicate repeated sentences:** the identical AI-analysis text on every ticket and the identical italic recommendation on every health card are collapsed per 5.2 and 5.3. Build per-item summaries from fields already in the data.
8. **Labels are short, human nouns**; actions are verbs ("Dispatch", "Resolve ticket", "Mark cleaned").
9. **No emoji** anywhere in UI copy.

### Before / after (real strings from the app)

| # | Where | Before | After |
|---|---|---|---|
| 1 | Header | `KOHLER Facility Monitor` (uppercase, tracked) + `Terminal 2 Airport Restroom · 17 Smart Fixtures` at 10px | "KOHLER · Facility Monitor" / "Terminal 2 · 17 fixtures · 4 zones" (12px) |
| 2 | Nav | `Dashboard` | "Overview" |
| 3 | MetricCards | `SENSOR READINGS` / `FLAGGED TICKETS` (uppercase) | "Open tickets" (hero) and "1.2M readings analysed" as a caption |
| 4 | MetricCards | `Estimated Water Loss` / `Utility Cost Impact: ₹…` | "Water lost" / "₹4,210 in utility cost" |
| 5 | Flow chart | `Flow Rate Telemetry (L/min)` with `Y-Peak: 4.2 L/m` | "Water flow" (unit in axis) / "Peak 4.2 L/min" |
| 6 | Flow chart | `Day 1 (Jan 15)` … `Day 7 (Jan 21)` chip row | Range select: "Full 7 days", "Last 24 hours", "15 Jan" … "21 Jan" |
| 7 | Flow chart | `Restroom A (Departure)` / `Departure Restroom A` / `Restroom A` | "Restroom A (Departure)" everywhere (short: "Restroom A") |
| 8 | Heatmap | `(17 fixtures monitored across 24 hours)` | "Busiest hours by fixture" |
| 9 | Tickets | `Filters:` (uppercase 11px) + 4 stacked rows | one toolbar: Status · Severity · Issue type · Zone · Sort |
| 10 | Tickets | `TKT-T2_RA_WC_03-20240121T0940…` (full) | `TKT-…0940Z` + copy |
| 11 | Tickets | `High (51)` `Slow Drip` `Restroom A` `T2_RA_WC_03` `Open` `Mark Resolved` | ▲ "High" rail · "Slow drip · WC 03, Restroom A" · [Open] · "Dispatch" |
| 12 | Tickets | `AI Analysis` badge + identical paragraph on every ticket | specific one-liner ("2.4 L/min vs 0.3 expected for 6 h"); shared analysis shown once |
| 13 | Tickets | `Observed 2.40 L/min vs expected 0.30 L/min baseline (+2.10 L/m above)` | "2.4 L/min observed vs 0.3 expected (+2.1 L/min)" |
| 14 | Evidence | `Evidence Weighting Formula:` paragraph | info popover "How evidence is weighted" (closed) |
| 15 | Health | `Section 1 Model` pill; `Explainable Risk Components (Section 1.3)` / `Formula Weights` | removed; "Risk factors" with "How the score is calculated" disclosure |
| 16 | Health | identical italic recommendation on every card | shown only on at-risk fixtures, grouped when identical |
| 17 | Hygiene | `Decay Model` button / `Hygiene Score Mathematical Formulation:` | "How scores work" popover in plain language |
| 18 | Hygiene | `Audit log (100 events)` | "Cleaning log" + caption "Showing the 100 most recent" |
| 19 | Sensors | `Dual-Beam Ultrasonic Occupanc…` (truncated) | wraps to 2 lines or full text in the detail drawer |
| 20 | Carbon | duplicate card on Dashboard and Carbon tab | detail only in Impact; Dashboard shows one tile |
| 21 | Shell | visible Next.js dev badge | hidden (`devIndicators: false`) |
| 22 | Dates | `01/15`, `2024-01-21`, `Jan 16, 2026` | "15 Jan", "21 Jan, 14:30", "21 Jan 2024, 14:30" |

---

## 7. Accessibility & responsiveness

**Keyboard and focus**
- Every interactive element is reachable and operable by keyboard in a logical order. Visible 2px brass focus ring everywhere (`:focus-visible`). Skip link "Skip to main content" as the first tab stop.
- Nav is a `<nav aria-label="Primary">` with `aria-current="page"` on the active item (they are `<button>`s today; convert to links or buttons that set the same state, but they must announce current state).
- Segmented controls: `role="radiogroup"` / Radix ToggleGroup, arrow keys, `aria-checked`.
- Tables: real semantics, `aria-sort`, expandable rows use `aria-expanded` + `aria-controls`.
- Modals and drawers: Radix Dialog (focus trap, Esc, focus return, `aria-modal`, `aria-labelledby`/`aria-describedby`). Copilot messages region is `role="log"` with `aria-live="polite"`.
- Toasts and "Copied" use `aria-live="polite"`. Critical errors `role="alert"`.

**Charts**
- Container `role="img"` with an `aria-label` that states the takeaway ("Water flow, 15–21 Jan: peak 4.2 L/min in Restroom A on 19 Jan"), plus a "View as table" disclosure with the same data. Heatmap cells are keyboard-navigable with `aria-label="Fixture WC 03, 14:00, 12 visits"`. Brush handles are focusable and arrow-key operable.

**Never colour alone:** status = colour + icon + word. Series = colour + line style + direct label. Heatmap values are available through tooltip, focus label and the table. Test every screen with a deuteranopia and a greyscale filter.

**Motion & preferences:** honour `prefers-reduced-motion` (3.4), `prefers-color-scheme`, and support browser zoom to 200% and text-only zoom to 200% without clipping or horizontal scroll. Use `rem` for text.

**Touch / tablet (primary secondary device, 768–1024px)**
- Minimum hit target **44×44px** (use padding to extend smaller visuals). 8px minimum spacing between adjacent targets.
- Nav = 64px icon rail with tooltips on focus and long-press. Toolbars wrap to two rows max, with filters collapsing into a single "Filters" popover under 768px.
- Tables: horizontal scroll inside the table region only (never the page) with the first column sticky. Under 640px, rows become stacked list items (severity rail, title, meta, action).
- Row actions always visible on touch. Hover-only affordances are forbidden.
- Drawers and modals are full-width sheets under 640px. Charts keep a 16:9 → 4:3 aspect shift under 768px and use a simplified 3-tick axis. The brush stays.
- Landscape and portrait must both work at 768×1024 and 1024×768 with no overlapping elements and no horizontal page scroll.

---

## 8. Anti-"vibe-coded" checklist (self-audit before finishing)

Search the codebase and screenshots for each tell and eliminate it. Report the result for every line in your final message.

1. Identical bordered rounded box around every section (no tiering).
2. Decorative icon chips in the corner of KPI cards.
3. Rainbow accents: per-tab coloured borders (blue / gold / green / cyan), purple and orange zone colours in UI chrome.
4. Text under 12px (`text-[9px]`, `[10px]`, `[11px]`). Grep must return zero.
5. ALL-CAPS tracking-wider micro-labels (other than the single eyebrow).
6. Monospace used for headings, labels, buttons or general numbers.
7. Gradients without function (the gold→blue→gold Copilot button) and gradient text.
8. Glows, neon box-shadows, `.glow-brass`, `.glow-steel`, blurred translucent panels (`backdrop-blur` on cards).
9. Inconsistent radii (mixed `rounded`, `rounded-md`, `rounded-lg`, `rounded-xl`) and inconsistent paddings.
10. Raw hex or rgba values in components, `!important` colour overrides, arbitrary Tailwind values like `py-0.2`.
11. Stacked badges: more than one filled badge per row or card.
12. Orphaned tooltips (floating outside their chart, clipped, or non-viewport-aware).
13. Emoji or unicode symbols used as icons. Icons are lucide only, one stroke width (1.5), one size scale (14 / 16 / 18 / 24).
14. Filler and lorem-style subtitles: "(100 events)", "(17 fixtures monitored across 24 hours)", "Section 1 Model", and anything that explains the implementation to the user.
15. Identical boilerplate repeated on every row (AI analysis, recommendation, "AI Analysis" badge).
16. Truncated text with ellipses on meaningful names ("Dual-Beam Ultrasonic Occupanc…").
17. Several stacked filter rows and chip rows instead of one toolbar.
18. Near-invisible chart elements: heatmap cells you can't see, gridlines at the same weight as data, 9–10px axis ticks.
19. Spiky overplotted multi-series bars for a continuous time series.
20. Loading states that are "..." text or a lone spinner, and layout shift on load.
21. Mixed units, mixed date formats, mixed casing, and the same zone with 3 different names.
22. Duplicate content on two tabs (carbon on Dashboard and Carbon).
23. Hover-only controls, `cursor: pointer` on non-interactive items, no focus ring.
24. Copy-pasted markup for the same pattern in more than one file (six zone-label maps, five severity badge implementations, per-tab nav button blocks).
25. Dev artefacts: Next.js dev badge, `console.log` noise, the default `next.svg` / `vercel.svg` assets left in `public/`, the default favicon.
26. A dark theme that is simply "everything blue-black" with unchanged contrast. Dark must be contrast-verified separately.
27. Centre-aligned paragraphs, uneven vertical rhythm, and cards with different heights in the same row for no reason.

---

## 9. Implementation plan

Work in phases. **After every phase:** run `npm run lint` and `npm run build`, run the app, take screenshots of every affected page at 1440px and 768px in light and dark, review them yourself against Sections 2, 3 and 8, fix what you find, then continue. Commit after each phase with a clear message. Do not proceed with a phase that leaves console errors.

**Phase 0: Tokens and theme**
- Rewrite `app/globals.css`: Tailwind v4 `@import`, `@theme inline` mapping to the CSS variables in Section 3, light and dark variable sets, base styles (body, focus ring, selection, scrollbar using tokens, reduced-motion), `.num` utility. Delete the `!important` overrides and glow classes.
- `app/layout.tsx`: IBM Plex Sans and Mono via `next/font/google`, `data-theme` pre-paint script, remove the hard-coded `dark` class and hex body classes, update metadata title to "KOHLER Facility Monitor" with a proper description.
- `next.config.ts`: add `devIndicators: false` (verify in bundled docs) and keep the `/api` rewrite untouched.
- Create `lib/format.ts` and `lib/names.ts` (Section 6).
- Add `lib/cn.ts` (clsx + tailwind-merge).

**Phase 1: Primitives (`components/ui/`)**
`Button`, `IconButton`, `Badge` (status), `SeverityMark`, `Card` (hero / standard / flat), `Stat`, `StatStrip`, `SegmentedControl`, `Select`, `MultiSelectPopover`, `Toolbar`, `Table` (+ `Row`, `ExpandableRow`), `Dialog`, `Drawer`, `Tooltip`, `Popover`, `Disclosure`, `Skeleton`, `EmptyState`, `ErrorState`, `CopyableId`, `ThemeToggle`, `ChartFrame`, `ChartTooltip`, `VisuallyHidden`. Add a dev-only `app/_styleguide/page.tsx` that renders every primitive in every state and both themes (remove or gate it before finishing). Screenshot it.

**Phase 2: App shell**
Left rail / icon rail / bottom bar, top bar, brand lockup, count badges, Copilot entry, theme toggle, skip link, the 1440px container. Rewire the same `activeTab` state and the "Impact" grouping. Remove the footer.

**Phase 3: Dashboard** (Attention band, stat strip, flow chart with brush, heatmap, replay scrubber)
**Phase 4: Tickets** (toolbar, table, expansion, evidence, resolve modal)
**Phase 5: Fixture health** (summary, attention cards, table, drawer)
**Phase 6: Hygiene**
**Phase 7: Impact: Carbon and Sustainability**
**Phase 8: Sensors**
**Phase 9: AI Copilot panel**
**Phase 10: Polish and audit.** Run the Section 8 checklist, the Section 10 verification, the tablet pass, the keyboard-only pass, and the colour-blind and greyscale pass.

**File structure to create (additive):**

```
frontend/
  app/
    globals.css            (rewritten)
    layout.tsx             (updated)
    page.tsx               (state/handlers unchanged; presentation rewired)
  components/
    ui/                    (primitives listed in Phase 1)
    shell/                 AppShell.tsx, SideNav.tsx, TopBar.tsx, MobileTabBar.tsx
    dashboard/             AttentionBand.tsx, StatStrip usage, FlowChart parts (Toolbar, Brush, Tooltip), HeatmapGrid.tsx
    tickets/               TicketTable.tsx, TicketRow.tsx, ResolveDialog.tsx, EvidenceDisclosure.tsx
    health/                AttentionCards.tsx, FixtureTable.tsx, FixtureDrawer.tsx
    hygiene/               ZoneReadinessCard.tsx, CleaningLog.tsx
    impact/                ImpactSwitcher.tsx, EmissionsBar.tsx, ZoneTable.tsx
    sensors/               SensorTable.tsx, SensorCard.tsx, SensorDrawer.tsx
    copilot/               CopilotPanel.tsx, Message.tsx, SuggestedPrompts.tsx
    (existing files stay in place as thin wrappers or are migrated and then removed once unreferenced)
  lib/
    format.ts  names.ts  cn.ts  attention.ts (pure selectors over already-fetched state)  a11y.ts
```

**Engineering rules:** reusable components over copy-pasted markup (any pattern used in 2+ places becomes a primitive). Props typed with the existing types in `components/types.ts`. No business logic inside presentational components. Selectors in `lib/attention.ts` are pure functions with unit tests. Keep `page.tsx` handlers and state as they are (the Replay memo chain and ticket handlers must stay byte-for-byte equivalent in behaviour). Prefer composition and `cva` variants to boolean-prop explosions.

---

## 10. Definition of done

All of the following must be true. Provide evidence for each in your final message (command output, numbers, or file paths).

**Visual and tokens**
- [ ] Zero raw hex/rgba colours and zero `!important` in `components/` and `app/` (except inside token definitions in `globals.css`). Grep output attached.
- [ ] Zero occurrences of `text-[9px]`, `text-[10px]`, `text-[11px]`. Computed body text ≥ 14px and label/caption/axis text ≥ 12px on every page (verify via a Playwright script that walks computed styles and fails on anything smaller).
- [ ] Only the defined radii (4 / 8 / 12) and spacing scale are used.
- [ ] No ALL-CAPS text other than the one eyebrow.

**Contrast and accessibility**
- [ ] A script reports every text/background token pair in both themes: text ≥ 4.5:1 (large ≥ 3:1), UI edges/icons/chart marks ≥ 3:1. Output attached with no failures.
- [ ] **Lighthouse Accessibility ≥ 95** on all 7 views, both themes, at desktop and tablet emulation. `axe-core` (via `@axe-core/playwright`) reports 0 serious/critical violations.
- [ ] Full keyboard walkthrough passes: nav, toolbar, table row expansion, resolve modal (trap and return), drawer, chart brush, heatmap grid, Copilot.
- [ ] Reduced-motion verified (no shimmer, no chart draw-in). Colour-blind (deuteranopia, protanopia) and greyscale screenshots show all statuses still distinguishable.

**Stability and performance**
- [ ] **No console errors or warnings** on load or while using every page and state (Playwright listener fails the run otherwise). No hydration warnings (theme script verified).
- [ ] **CLS < 0.02** on every page (skeletons match final geometry). Lighthouse performance ≥ 85 on Overview in production build.
- [ ] `npm run lint` and `npm run build` pass with no errors.

**Behaviour parity**
- [ ] A checklist proves unchanged behaviour: ticket status change (optimistic update, PATCH payload, revert on error), resolve with note, Replay scrub/play/reset and filtered metrics, date-range filtering, zone toggles, Per-fixture mode, hygiene complete-event and clean-zone calls and payloads, sensor search, Copilot send and response parsing, all 7 tabs reachable. Network log or Playwright assertions attached. Diff of `components/types.ts`, `next.config.ts` rewrites and `src/` shows **no** functional change.

**Content**
- [ ] No developer-facing strings from Section 6 item 1 in the default DOM (Playwright text search). One unit style, one date format, one zone naming source. No duplicated AI/recommendation sentence in the default view of Tickets or Health. Ticket IDs shortened with copy-on-click.

**Screenshots**
- [ ] `docs/redesign/before/` and `docs/redesign/after/` contain a screenshot of **every page** (Dashboard, Tickets, Health, Hygiene, Impact: Carbon, Impact: Water savings, Sensors, Copilot open) **and key states** (ticket expanded, resolve modal, health drawer, replay mode, empty and loading skeleton) at **1440px and 768px**, in **light and dark**. File names `{page}-{state}-{width}-{theme}.png`.
- [ ] A short `docs/redesign/AUDIT.md` lists each Section 8 item with "eliminated / n/a" and one line of evidence.

**Final message:** summarise what changed per phase, list any assumption you made (one line each), list anything you could not verify and why, and confirm that no data, API, route or business logic changed.
