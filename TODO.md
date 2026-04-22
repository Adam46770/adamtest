# TODO — Meeting Cost App

Task list for building the MVP described in [`README.md`](./README.md), following the rules in [`CLAUDE.md`](./CLAUDE.md).

Order suggests dependencies: finish a phase before moving to the next.

---

## Phase 1 — Project Setup

- [ ] Create `index.html` at repo root (entry point for GitHub Pages)
- [ ] Create `styles.css` (single stylesheet, mobile-first)
- [ ] Create `app.js` (main logic, loaded as `<script type="module">`)
- [ ] Add `<meta name="viewport" content="width=device-width, initial-scale=1">` to `index.html`
- [ ] Add app title, favicon, and theme-color meta
- [ ] Verify the page opens via `file://` with no console errors
- [ ] Enable GitHub Pages for the repo (branch + root)

---

## Phase 2 — Data Layer

- [ ] Define default `roles` array: Manager (120), Senior (100), Mid (70), Junior (50)
- [ ] Define default `settings` (currency: `PLN`)
- [ ] Implement `loadRoles()` / `saveRoles()` using key `meetingCost:roles`
- [ ] Implement `loadSettings()` / `saveSettings()` using key `meetingCost:settings`
- [ ] Wrap all `JSON.parse` in try/catch; fall back to defaults on malformed data
- [ ] Implement helpers: `totalParticipants(roles)`, `totalHourlyRate(roles)`

---

## Phase 3 — Main View (role selection)

- [ ] Render role tiles from the `roles` array
- [ ] Each tile: role name, current count, `-` and `+` buttons
- [ ] `+` increments count; `-` decrements count (clamped at 0)
- [ ] Persist count changes to `localStorage` on every update
- [ ] Display running total hourly rate above the Start button
- [ ] Sticky **Start** button at the bottom, disabled when `totalParticipants === 0`
- [ ] Ensure tap targets are at least 44×44 px
- [ ] Ensure input font size is ≥ 16px (no iOS auto-zoom)

---

## Phase 4 — Timer Logic

- [ ] Implement state: `startTime`, `pausedAt`, `totalPausedMs`, `isRunning`
- [ ] `start()` — set `startTime = Date.now()`, flip `isRunning`
- [ ] `pause()` — store `pausedAt = Date.now()`
- [ ] `resume()` — add `Date.now() - pausedAt` to `totalPausedMs`, clear `pausedAt`
- [ ] `reset()` — clear all timer state and return to main view
- [ ] Elapsed calculation: `(Date.now() - startTime - totalPausedMs)` (subtract current pause if active)
- [ ] Render loop: `setInterval` at 250–500 ms, recomputing from timestamps
- [ ] Stop the interval on pause/reset to save battery

---

## Phase 5 — Active Meeting View

- [ ] Large cost display as the primary focus
- [ ] Secondary timer display (HH:MM:SS)
- [ ] Small stats row: participants count, total hourly rate
- [ ] **Pause / Resume** button (toggles label based on `isRunning`)
- [ ] **Reset** button with a confirm step to avoid accidental taps
- [ ] Smooth transition between main view and active view (no jarring reload)

---

## Phase 6 — Currency & Formatting

- [ ] Format cost with `Intl.NumberFormat(locale, { style: 'currency', currency })`
- [ ] Map currency → locale (e.g. PLN→`pl-PL`, EUR→`de-DE`, USD→`en-US`)
- [ ] Format timer as `HH:MM:SS` (or `MM:SS` under one hour)
- [ ] Round displayed cost sensibly (2 decimals, or whole units for long meetings)

---

## Phase 7 — Settings View (optional, but in spec)

- [ ] Simple screen / modal to edit role names and rates
- [ ] Currency selector: PLN, EUR, USD
- [ ] Save to `meetingCost:settings` and `meetingCost:roles`
- [ ] "Restore defaults" button
- [ ] Input validation: rate must be a non-negative number

---

## Phase 8 — Styling & Mobile Polish

- [ ] Mobile-first CSS with `min-width` media queries for desktop
- [ ] Single-column layout throughout
- [ ] High-contrast colour palette
- [ ] Large, thumb-friendly buttons
- [ ] No hover-only interactions
- [ ] System font stack
- [ ] Safe-area insets for iPhone notch (`env(safe-area-inset-*)`)

---

## Phase 9 — QA & Verification

- [ ] Test golden path: set counts → Start → watch cost → Pause → Resume → Reset
- [ ] Verify state survives a page reload
- [ ] Verify timer remains accurate after backgrounding the tab for 1+ minute
- [ ] Test at iPhone viewport (~375 px) in Safari / responsive mode
- [ ] Test at desktop viewport (no layout breakage)
- [ ] Confirm no console errors or warnings
- [ ] Confirm zero runtime network requests (fully offline-capable)

---

## Phase 10 — Deploy

- [ ] Push final MVP to the working branch
- [ ] Merge to `main` (only with explicit user approval)
- [ ] Confirm GitHub Pages serves the live URL
- [ ] Smoke-test the live URL on a real iPhone

---

## Out of Scope for MVP (do not start without approval)

- Presets (e.g. "Weekly Meeting")
- Cost per minute / per person view
- Dark mode
- PWA (manifest + service worker + "Add to Home Screen")
- Threshold alerts (e.g. > 100)
- Any backend, sync, analytics, or tracking
