# Meeting Cost App

A minimal, mobile-first web application that calculates the real-time cost of a meeting. Runs entirely in the browser (no backend) and is designed to be hosted on GitHub Pages.

> **Core idea:** Open the app → select how many people are in each role → tap **Start** → watch the live meeting cost grow.

No names. No individual entries. No complexity.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Technology Stack](#2-technology-stack)
3. [Core UX Flow](#3-core-ux-flow)
4. [Data Model](#4-data-model)
5. [Cost Calculation](#5-cost-calculation)
6. [Timer Logic](#6-timer-logic)
7. [UI Structure](#7-ui-structure)
8. [Storage](#8-storage-localstorage)
9. [Currency Handling](#9-currency-handling)
10. [Mobile Design Principles](#10-mobile-design-principles)
11. [Performance](#11-performance)
12. [MVP Scope](#12-mvp-scope)
13. [Future Extensions](#13-future-extensions-optional)
14. [Summary](#14-summary)

---

## 1. Overview

The app calculates how much a meeting is costing **in real time**, based on the hourly rates of the roles present in the room. It is intentionally stripped down:

- No participant names
- No individual data entry
- No authentication
- No server

Everything happens client-side. State is persisted in `localStorage`.

---

## 2. Technology Stack

- **HTML** – structure
- **CSS** – mobile-first styling
- **Vanilla JavaScript** – logic
- **localStorage** – data persistence

**Hosting:** GitHub Pages (static hosting)

**Target platforms:**
- Safari on iPhone (primary)
- Desktop browsers (secondary)

---

## 3. Core UX Flow

### Step 1 – Open App
User lands directly on the main screen.

### Step 2 – Select Team Composition
User sees simple tiles (buttons) for roles, for example:

- Manager
- Senior
- Mid
- Junior

Each tile has:
- Role name
- `+` / `-` buttons (or tap-to-increment)
- Current count displayed

```
[ Manager   -  2  + ]
[ Senior    -  3  + ]
[ Mid       -  5  + ]
[ Junior    -  1  + ]
```

### Step 3 – Start Meeting
User taps **Start**.

### Step 4 – Live View
App shows:
- **BIG** live cost (main focus)
- Time elapsed
- Total hourly rate
- Number of participants

### Step 5 – Stop / Reset
User can:
- Pause
- Resume
- Reset

---

## 4. Data Model

Instead of tracking individual participants, the app tracks **counts per role**:

```js
roles = [
  { name: "Manager", rate: 120, count: 2 },
  { name: "Senior",  rate: 100, count: 3 },
  { name: "Mid",     rate:  70, count: 5 },
  { name: "Junior",  rate:  50, count: 1 }
]
```

**Derived values:**

- `totalParticipants = sum(count)`
- `totalHourlyRate   = sum(rate * count)`

---

## 5. Cost Calculation

```js
meetingCost = totalHourlyRate * elapsedTimeInHours

elapsedTimeInHours = (currentTime - startTime - pausedTime) / 3600000
```

> **Important:** Time must be based on timestamps (`Date.now()`), **not** on incremental counters. This keeps the clock accurate even if the tab is backgrounded.

---

## 6. Timer Logic

**State:**

- `startTime` – timestamp
- `pausedAt` – timestamp or `null`
- `totalPausedMs` – accumulated paused duration
- `isRunning` – boolean

**Behavior:**

| Action  | Effect                                         |
|---------|------------------------------------------------|
| Start   | set `startTime`                                |
| Pause   | store `pausedAt`                               |
| Resume  | add elapsed pause duration to `totalPausedMs`  |
| Reset   | clear everything                               |

**Render loop:** update every ~250–500 ms, recalculating cost from timestamps.

---

## 7. UI Structure

### View 1 – Main (Default)
- Role tiles (increment / decrement)
- Total hourly cost display
- Start button

### View 2 – Active Meeting
- Large cost display (primary focus)
- Timer (secondary)
- Small stats (participants, hourly rate)
- Control buttons (Pause / Reset)

### View 3 – Settings (Optional)
- Edit role names
- Edit hourly rates
- Select currency

---

## 8. Storage (localStorage)

**Keys:**

- `meetingCost:roles`
- `meetingCost:settings`

**Stored data:**
- Role definitions (name + rate)
- Last used counts
- Selected currency

No backend, no sync.

---

## 9. Currency Handling

Formatting uses `Intl.NumberFormat`:

```js
new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN'
})
```

**Supported currencies:**
- PLN
- EUR
- USD

---

## 10. Mobile Design Principles

- Large buttons (thumb-friendly)
- Single column layout
- No hover interactions
- Minimum font size **16px** (to avoid iOS auto-zoom on inputs)
- Sticky **Start** button at the bottom
- High-contrast UI

---

## 11. Performance

- No frameworks → fast load
- Minimal JS bundle
- UI updates ~4 times per second
- No heavy animations

---

## 12. MVP Scope

**Must have:**

- [x] Role-based counting (no individuals)
- [x] Hourly rate per role
- [x] Start / Pause / Reset
- [x] Live cost calculation
- [x] `localStorage` persistence
- [x] Mobile-friendly UI

---

## 13. Future Extensions (Optional)

- Presets (e.g. *"Weekly Meeting"*)
- Cost per minute view
- Dark mode
- PWA (Add to Home Screen)
- Threshold alerts (e.g. > $100)

---

## 14. Summary

This app is a lightweight, stateless frontend tool that:

- models a meeting as **counts of roles**,
- calculates cost **in real time**,
- runs **entirely in the browser**,
- requires **zero backend**.

**Focus:** SPEED + SIMPLICITY + MOBILE UX.
