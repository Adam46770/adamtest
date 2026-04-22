# CLAUDE.md

Guidelines for AI agents working on this repository. Read this before making changes.

---

## Project Context

This repo contains the **Meeting Cost App** — a mobile-first, frontend-only web app that calculates the live cost of a meeting based on role counts and hourly rates. Full spec: [`README.md`](./README.md).

**Non-negotiable characteristics:**
- Runs **entirely in the browser** (no backend, no server, no API calls).
- Hosted on **GitHub Pages** (static only).
- Persists state via **`localStorage`** only.
- **No user authentication**, no accounts, no sync.

---

## Technology Constraints

| Area         | Required                          | Forbidden                                   |
|--------------|-----------------------------------|---------------------------------------------|
| Markup       | HTML                              | JSX, templating engines                     |
| Styling      | Plain CSS (mobile-first)          | Tailwind, Bootstrap, SASS build steps       |
| Logic        | Vanilla JavaScript (ES modules OK)| React, Vue, Svelte, Angular, jQuery         |
| Build        | None (serve files as-is)          | Webpack, Vite, Parcel, Rollup, bundlers     |
| Dependencies | Zero runtime dependencies         | npm packages loaded at runtime              |
| Persistence  | `localStorage`                    | Backend APIs, IndexedDB unless justified    |

If you feel the urge to add a framework or a build step — stop. This project's value is its simplicity and zero-config deploy.

---

## Core Design Principles

Keep these in mind on every change:

1. **Speed** — fast to load, fast to interact. No heavy animations, no oversized assets.
2. **Simplicity** — no names of participants, no individual entries. Only counts per role.
3. **Mobile UX first** — design for Safari on iPhone, desktop is secondary.

---

## Data Model (do not drift from this)

```js
roles = [
  { name: "Manager", rate: 120, count: 2 },
  { name: "Senior",  rate: 100, count: 3 },
  { name: "Mid",     rate:  70, count: 5 },
  { name: "Junior",  rate:  50, count: 1 }
]
```

- `totalParticipants = sum(count)`
- `totalHourlyRate = sum(rate * count)`
- `meetingCost = totalHourlyRate * elapsedHours`

**Do not** introduce per-person records, names, or individual rates. Roles + counts is the whole model.

---

## Timer Rules

- Always compute elapsed time from **timestamps** (`Date.now()`), never from incremental counters.
- State: `startTime`, `pausedAt`, `totalPausedMs`, `isRunning`.
- Render loop: update UI every **250–500 ms**. Do not use `requestAnimationFrame` for this — it wastes battery.
- Pause must accumulate into `totalPausedMs`; resume must clear `pausedAt`.

---

## Storage Rules

- Use these keys exactly:
  - `meetingCost:roles`
  - `meetingCost:settings`
- Store only: role definitions (name + rate), last used counts, selected currency.
- Never store PII. There is none to store anyway — keep it that way.
- Wrap reads in try/catch; fall back to defaults if JSON is malformed.

---

## Currency Rules

- Format all money with `Intl.NumberFormat`.
- Supported currencies: **PLN, EUR, USD**. Do not add more without discussion.
- Currency is part of settings; persist it.

---

## UI & Mobile Rules

- Single-column layout. No multi-column grids.
- Tap targets at least **44×44 px**.
- Minimum font size **16px** on inputs (prevents iOS auto-zoom).
- Sticky **Start** button at the bottom of the main view.
- No hover-only interactions — everything must work on touch.
- High contrast; prefer system fonts.

---

## MVP Scope (what belongs in the main app)

Only these features belong in MVP:

- Role-based counting (no individuals)
- Hourly rate per role
- Start / Pause / Reset
- Live cost calculation
- `localStorage` persistence
- Mobile-friendly UI

Everything else (presets, dark mode, PWA, threshold alerts, cost-per-minute view) is a **future extension**. Don't add them unless explicitly requested.

---

## What NOT to Do

- Do not add a backend, API routes, or server-side rendering.
- Do not add a build step, bundler, or transpiler.
- Do not add runtime dependencies from npm/CDN unless explicitly approved.
- Do not introduce per-person participant records.
- Do not use incremental counters for the timer.
- Do not write features beyond MVP unless asked.
- Do not add tracking, analytics, or external calls.
- Do not over-engineer: no abstractions, classes, or patterns "for future flexibility".
- Do not write long comments explaining obvious code.

---

## Code Conventions

- Prefer small, flat modules over deep class hierarchies.
- Use `const` / `let`, never `var`.
- Keep functions short and pure where possible; isolate DOM mutations.
- Use semantic HTML (`<button>`, `<main>`, `<section>`) — not `<div>` soup.
- CSS: mobile-first media queries (`min-width`, not `max-width`).
- Ship files that can be opened directly with `file://` or served by any static host.

---

## Verification Before Reporting Done

When you finish a change:

1. Open `index.html` in a browser (or mention it can't be tested here).
2. Verify the **golden path**: set counts → Start → see live cost → Pause → Resume → Reset.
3. Check that state survives a page reload (`localStorage`).
4. Check layout at iPhone-sized viewport (~375px wide).
5. If you cannot test the UI in your environment, say so explicitly — do not claim success.

---

## Git Workflow

- Work on the branch specified in the task description. Create it if missing.
- Write clear, descriptive commit messages focused on **why**, not what.
- Do **not** push to `main` without explicit permission.
- Do **not** open a pull request unless the user asks for one.

---

## Summary

Keep it **fast, simple, and mobile-first**. When in doubt, choose the smaller, plainer solution. This project's strength is what it refuses to add.
