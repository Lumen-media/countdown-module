# Countdown Timer — Feature Specification

---

## 1. Module Entry Points

The module registers multiple entry points related to configuration, output, and runtime access:

| Entry point | Location |
|---|---|
| Menu item "Countdown Timer" | Tools menu |
| Command "Open Countdown Timer" | Commander |
| Header status pill | App header trailing slot while timer is active |
| Presenter panel | `presenter.content` |
| Queue trigger provider | `countdown.wait` |

---

## 2. Main Dialog

- Opens as a `dialog` slot
- Occupies ~90% of the viewport width and height
- Internal content respects a **16/10 aspect ratio**
- Layout: **left panel** (3 tabs, fixed width) + **right panel** (Live Preview Stage)

The left panel content scrolls independently and the footer remains visible.

---

## 3. Left Panel — Tabs

The left panel has three tabs: **Configure · Appearance · Actions**

---

### 3.1 Configure Tab

#### DURATION

Two large number inputs side by side:
- `MM` — minutes (0–99)
- `SS` — seconds (0–59)

Below the inputs:
- `+ 10s`
- `− 10s`
- `Reset`

Current implementation notes:
- Inputs and quick adjustment controls are disabled while the timer is running.
- There are also **quick duration presets** for `5`, `10`, `15`, and `30` minutes.

#### DISPLAY TEXT

Two text input fields:

**Pre text**
- Single-line text field
- Displayed above the timer number on the presenter

**Post text**
- Multi-line text content displayed below the timer
- Each line is treated as an independent message
- When there is more than one line, lines rotate through the animated text carousel

Current implementation notes:
- Post text is currently edited through the shared text editor component.

#### ON COMPLETION

Single dropdown shortcut for the primary completion action.

Originally intended as:
- summary of the main completion action
- example options such as "Auto-switch to next Scene" or "None"

Current implementation notes:
- The selector currently toggles the simple `None` / `Auto-switch to next Scene` path by updating `autoAdvance.enabled`.
- Full end-action configuration lives in the Actions tab.

#### BACKGROUND PRESET

Preset grid with thumbnail previews.

Current presets:
- `Default`
- `Dark Minimal`
- `Light Clean`
- `Custom`

Behavior:
- `Default` uses the active profile background
- `Dark Minimal` applies dark solid defaults
- `Light Clean` applies light solid defaults
- `Custom` stores an image or video selected through `host.ui.openBackgroundPicker`

Historical design note:
- Earlier planning docs referenced richer preset naming such as vibrant/custom-video concepts. The current shipped preset set is the four items above.

---

### 3.2 Appearance Tab

#### TYPOGRAPHY

| Control | Type | Description |
|---|---|---|
| Font family | Combobox with search | Populated from local/system fonts |
| Font weight | Dropdown | Thin → Black |
| Font size | Number input (px) | Controls timer digit size |

#### COLORS

| Control | Type | Description |
|---|---|---|
| Timer Text | Color picker | Manual timer color |
| Pre / Post Text | Color picker | Manual pre/post text color |
| Pre / Post Opacity | Slider | Opacity for pre/post text |

Important note:
- Older docs described automatic text color selection via `polished`. That is **not** the current behavior anymore.
- Current implementation uses **manual text color selection**.
- Glow/shadow is still adaptive in spirit, but text color is user-controlled.

#### BACKGROUND LAYER

Originally planned background editing modes:
- Solid
- Gradient
- Image
- Video

Current implementation notes:
- The runtime still supports `profile`, `solid`, `gradient`, `image`, and `video` backgrounds.
- The current Appearance tab directly exposes editing controls for:
  - `Solid`
  - `Gradient`
- Image/video selection currently enters mainly through Configure → Background Preset → `Custom`.

#### VISUAL EFFECTS

| Control | Type | Description |
|---|---|---|
| Glow Intensity | Slider 0–100% | Controls shadow/glow intensity behind text |

#### ANIMATIONS

Current implementation includes:
- Digit animation:
  - `none`
  - `flip`
  - `blur`
- Pulse effect toggle
- Progress bar toggle
- Progress bar color picker

#### DISPLAY MODE

Display modes:
- `Fullscreen`
- `Corner`

Corner positions:
- `top-left`
- `top-right`
- `bottom-left`
- `bottom-right`

Current implementation note:
- Corner mode is conditioned by whether there is external backdrop content active in the host.
- If no competing backdrop is active, the module may stay centered even with corner mode selected.

---

### 3.3 Actions Tab

#### END ACTION

Auto-Advance can be enabled and configured with one of these actions:
- `queue.next`
- `queue.previous`
- `player.next-slide`
- `player.play`
- `change-scene`
- `open-overlay`
- `send-webhook`

#### TIME TRIGGERS

A list of trigger cards. Each card supports:
- enable / disable
- reordering
- duplication
- deletion
- `MM:SS` time editing

Current trigger types:
- `change-text`
- `warning-chime`
- `queue.next`
- `queue.previous`
- `player.next-slide`
- `player.play`
- `send-webhook`

Trigger defaults:
- new triggers are created at **half of the configured timer duration**
- warning chime defaults to a bundled sound selection

#### AUDIO

Completion sound:
- bundled module audio only

Warning-chime trigger sound:
- bundled audio
- or audio from the Lumen media library

#### BEHAVIOR

Current toggles / fields:
- Hide on completion
- Allow negative time
- Count up mode
- Webhook URL

---

### 3.4 Fixed Footer

Visible across the configurator.

Contains:
- status indicator + current time
- Start / Pause primary action
- Preview button
- Overlay button (or close overlay when active)

Current implementation notes:
- Preview sends the countdown to the presenter/media output path
- Overlay opens the dedicated overlay window path
- When overlay mode is active, presenter projection prefers overlay behavior instead of the media screen path

---

## 4. Right Panel — Live Preview Stage

- Displays a live styling preview of the countdown
- Shows current output card
- Shows next action card

Important implementation note:
- The preview is intended to communicate style and layout
- It is not a full substitute for presenter / overlay runtime behavior
- Preview behavior may intentionally differ from the live timer in some runtime-specific areas

---

## 5. Presenter Display

Registered via `presenter.content`.

### 5.1 Fullscreen Mode

Centered timer layout with background rendering from the configured appearance.

Supported runtime backgrounds:
- profile background
- solid
- gradient
- image
- video

### 5.2 Corner Mode

Floating text overlay in one of four corners while respecting host backdrop content.

Current implementation notes:
- The timer can remain centered when there is no competing background media.
- When host backdrop content is active, corner mode moves into the selected corner.

---

## 6. Timer Engine

### 6.1 Precision

The timer uses `Date.now()` as an anchor and does not depend on naive accumulated interval timing.

### 6.2 Resync by Acceleration

When drift grows too large, the store increases tick frequency temporarily to catch up.

### 6.3 State Machine

```text
idle -> running -> paused -> running
  \-> finished -> idle
```

### 6.4 Main ↔ Presenter Communication

Timer state is emitted through Tauri events.

Important current behavior:
- main window emits `countdown:tick`
- presenter/overlay listens for `countdown:tick`
- presenter display emits `countdown:display-ready` on mount
- main window rebroadcasts current state when display becomes ready

---

## 7. Persistence

Persisted data currently includes:
- `config`
- `timerPresets`

Runtime state is not persisted as an always-running timer session.

---

## 8. Queue Trigger Integration

The module registers a queue trigger provider:

```ts
countdown.wait
```

Purpose:
- allow a queue item to start a countdown with a configured duration

This is already implemented at the integration level, and broader queue/run-of-show sync ideas remain parked as WIP in `docs/plan.md`.

---

## 9. Notes on Historical vs Current Behavior

This spec keeps the richer original design intent while marking where implementation evolved.

Use this reading model:
- sections written as concrete controls or runtime capabilities are current unless noted otherwise
- sections marked as historical / older / planned reflect earlier design context that may not fully match the current shipped UI
