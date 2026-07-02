# Countdown Timer — Plan & Architecture

---

## 1. Overview

A countdown module for Lumen for time management in live events, services, productions, and countdown-driven transitions.

**Module name:** Countdown Timer

This document keeps both:
- the broader design and architecture context
- notes about what is actually implemented today

---

## 2. UI — Main Dialog

The module opens via Tools / Commander as a large dialog with a left configurator and a right live preview stage.

Current implementation includes:
- Configure tab
- Appearance tab
- Actions tab
- fixed runtime footer
- current output / next action cards

Historical design ideas that are still useful context:
- richer preset systems
- broader background editing flows
- more advanced end actions and run-of-show driven workflows

---

## 3. Architectural Principles

- SDK UI components are the base UI surface
- Zustand owns module state
- Tauri events are used for presenter synchronization
- queue, player, library, overlay, and theme background hooks come from the host
- docs should distinguish between implemented behavior and WIP behavior instead of collapsing them together

---

## 4. Current Architecture Snapshot

### Core pieces
- [`src/main.ts`](../src/main.ts)
  - host registration
  - persistence wiring
  - overlay/presenter hookups
  - queue trigger registration
- [`src/store.ts`](../src/store.ts)
  - timer engine
  - trigger execution
  - presenter and overlay projection
  - timer presets
- [`src/components/CountdownDialog.tsx`](../src/components/CountdownDialog.tsx)
  - main dialog shell
- [`src/components/left/tabs`](../src/components/left/tabs)
  - configurator UI
- [`src/components/right`](../src/components/right)
  - preview stage
- [`src/components/presenter`](../src/components/presenter)
  - live output rendering

### Host integrations used today
- `host.panels`
- `host.commands`
- `host.menus`
- `host.presentation`
- `host.queue`
- `host.player`
- `host.ui.openDialog`
- `host.ui.openBackgroundPicker`
- `host.data.json`
- `host.app.locale`
- optional host extensions for overlay, library, scene switching, theme background updates, and overlay openers

---

## 5. Configurator Summary

### Configure
Implemented today:
- duration inputs
- quick duration controls
- quick preset duration buttons
- pre/post text editing
- background preset selection
- completion shortcut selector

### Appearance
Implemented today:
- typography controls
- text color controls
- solid and gradient background editing
- glow slider
- digit animation controls
- pulse toggle
- progress bar toggle + color
- fullscreen/corner mode with corner selection

### Actions
Implemented today:
- end action selector
- time triggers
- bundled + library-backed sound selection for triggers
- completion sound
- hide on completion
- allow negative
- count up
- webhook URL

---

## 6. Presenter / Overlay Behavior Notes

- Presenter and overlay rendering share the same countdown display component.
- Tick state is synchronized through Tauri events.
- The module rebroadcasts state when the presenter display announces readiness.
- Corner mode is conditioned by the presence of external backdrop content.
- Overlay is treated as a first-class output path, not just a cosmetic preview.

---

## 7. Useful Historical Context

Earlier planning and spec work covered ideas that still matter conceptually even if the exact UI has changed:
- richer preset taxonomy
- fully exposed image/video background editing in the Appearance tab
- automatic text contrast selection
- more expansive completion action routing
- run-of-show and queue-driven duration sync

These ideas should not be thrown away; they should simply be marked clearly when they are not fully implemented yet.

---

## 8. Documentation Policy

The docs in this repo should do two things at once:
- preserve the richer architectural and product context
- clearly label what is implemented now vs what remains planned or parked

That means future updates should prefer:
- **complementing** older docs
- adding implementation notes
- marking WIP explicitly

instead of replacing the richer history with a flattened snapshot.

---

## 9. WIP Ideas

### Run of Show / Queue Duration Sync

Status: WIP / parked for later exploration.

Idea:
- Allow the countdown to pull duration from the current queue or run-of-show item instead of requiring manual timer input every time.
- Optionally reuse the queue item title as countdown text.

Possible directions:
- Manual action: `Use current queue item duration`
- Toggle: sync countdown duration with current queue item
- Advanced mode: react automatically when the active queue item changes

Why it could be valuable:
- Reduces operator error
- Keeps countdown aligned with the event plan
- Speeds up live workflows for services, shows, and run-of-show driven events

Open questions:
- Where duration metadata should come from in Lumen
- Whether sync should be one-shot or live
- How this should interact with auto-advance and existing time triggers

---

### Absolute Date/Time Countdown

Status: WIP / parked for later exploration.

Idea:
- Allow setting a target date/time (e.g. "20:30" or "2026-12-25 18:00") instead of only MM:SS
- Timer automatically calculates remaining time until the target
- Useful for event start countdowns, service times, or deadline reminders

Possible directions:
- Simple mode: pick a time-of-day (HH:MM) for today
- Advanced mode: full date+time picker with timezone support
- Show absolute time alongside countdown on presenter

---

### Multiple Simultaneous Timers

Status: WIP / parked for later exploration.

Idea:
- Run multiple countdowns at the same time, each in its own tab
- Each timer has independent duration, appearance, triggers, and state
- Useful for multi-segment events, A/B switches, or parallel timing

Possible directions:
- Tabbed interface in the dialog
- Each timer can be individually projected to presenter/overlay
- Visual indicator showing which timer is "live" on screen
- Shared or independent trigger/end-action execution

---

### Rehearsal Mode

Status: WIP / parked for later exploration.

Idea:
- Run the timer without executing real actions (no webhook, no scene change, no queue advance)
- Visual indicator that rehearsal is active (e.g. watermark "REHEARSAL")
- Timer still ticks and displays normally, but side effects are suppressed

Possible directions:
- Toggle in the Actions tab or footer
- Suppressed during rehearsal: auto-advance, time triggers (except warning-chime), webhook, hide-on-completion
- Option to log what *would* have fired for post-rehearsal review

---

### Remote Control (WebSocket / HTTP)

Status: WIP / parked for later exploration.

Idea:
- Expose control endpoints so external devices (Stream Deck, phone, tablet) can start/pause/reset the timer
- Allow reading current state (remaining, status) remotely

Possible directions:
- Lightweight HTTP server embedded in the module (or piggyback on Lumen's network layer)
- WebSocket for real-time state sync
- Simple REST API: `GET /state`, `POST /start`, `POST /pause`, `POST /reset`
- Optional CORS config for network access
- Companion mobile web UI as an optional panel
