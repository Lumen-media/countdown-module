# Countdown Timer — Feature Specification

---

## 1. Module Entry Points

The module registers two entry points that open the main dialog:

| Entry point | Location |
|---|---|
| Menu item "Countdown Timer" | Tools menu |
| Command "Open Countdown Timer" | Commander (command palette) |

---

## 2. Main Dialog

- Opens as a `dialog` slot
- Occupies ~90% of the viewport width and height
- Internal content respects a **16/10 aspect ratio** — free space on the borders is acceptable
- Layout: **left panel** (3-tab panel, fixed width) + **right panel** (Live Preview Stage)

---

## 3. Left Panel — Tabs

The left panel has three tabs: **Configure · Appearance · Actions**

The tab bar is always visible. Below the tabs, the content area scrolls independently. The footer (status + controls) is always visible below the content.

---

### 3.1 Configure Tab

#### DURATION

Two large number inputs side by side:
- `MM` — minutes (0–99)
- `SS` — seconds (0–59)

Below the inputs, three adjustment buttons:
- `+ 10s` — adds 10 seconds to the current duration
- `− 10s` — subtracts 10 seconds (minimum 0)
- `Reset` — restores the duration to the last saved value

Toggle below the duration controls:
- **Allow negative time** — OFF by default
  - OFF: timer stops at 00:00
  - ON: timer continues into negative values (-0:01, -0:02, ...)

---

#### DISPLAY TEXT

Two text input fields:

**Pre text** — single-line text field
- Displayed above the timer number on the presenter

**Post text** — auto-expanding textarea (height grows with content, no fixed max)
- Displayed below the timer number on the presenter
- Always visible on the presenter while there is content
- Each line is treated as an independent message
- If more than one line exists, messages rotate as an animated carousel, one at a time, every ~10 seconds
- Transition between lines is animated (fade or slide via Anime.js)

---

#### ON COMPLETION

Single dropdown — shortcut for the primary completion action.
- Acts as a summary of what is configured in the Actions tab
- Example options: "Auto-switch to next Scene", "None"

---

#### BACKGROUND PRESET

A 2×2 grid of preset cards. Each card shows a small thumbnail preview of how the countdown will look with that preset applied.

| Preset | Description |
|---|---|
| Dark Minimal | Dark solid background, white text |
| Light Clean | White/light background, dark text |
| Vibrant Blur | Colorful gradient background |
| Custom Video | Placeholder for a user-selected video file |

- Selecting a preset applies a complete appearance configuration (background, colors, typography defaults)
- The active preset has a visible selected state (border highlight)
- "Custom Video" opens a video file picker

---

### 3.2 Appearance Tab

#### TYPOGRAPHY

| Control | Type | Description |
|---|---|---|
| Font family | Combobox with search | Populated via `host.fonts.list()`. Default: "Inter (System Default)" |
| Font weight | Dropdown | Options: Thin, Light, Regular, Medium, Semi Bold, Bold, Extra Bold, Black |
| Font size | Number input (px) | Controls the size of the timer digits. Default: 140px |

---

#### COLORS

| Control | Type | Description |
|---|---|---|
| Timer Text | Color picker | Color of the countdown digits. Default: suggested by auto-contrast via `polished.readableColor` |
| Pre / Post Text | Color picker + opacity slider | Color and opacity of the pre/post text. Default: #FFFFFF at 80% |

> Auto-contrast behavior: when no color has been manually set, the default color value is calculated by sampling the background pixels in the text region and using `polished.readableColor` to return the highest-contrast option (black or white).

---

#### BACKGROUND LAYER

Four tabs that switch the background type:

**Solid**
- Color picker — fills the background with a solid color

**Gradient**
- Gradient editor — defines a CSS gradient as background

**Image**
- "Change Background Image" button — opens `host.ui.openBackgroundPicker`
- **Opacity Overlay** — slider 0–100% — darkens or lightens the image over the content

**Video**
- Video file picker — selects a looping video file
- **Opacity Overlay** — slider 0–100%

---

#### VISUAL EFFECTS

| Control | Type | Description |
|---|---|---|
| Text Shadow / Glow | Slider 0–100% | Controls the intensity of the shadow/glow effect behind all text on the presenter |

---

### 3.3 Actions Tab

#### END ACTION

**Auto-Advance**
- Toggle ON/OFF
- Label: "Automatically transition to the next item in the playlist when timer reaches zero."
- When ON: shows a dropdown to select the destination — e.g. "Go to Next Item"
- When OFF: no action is taken on completion

---

#### TIME TRIGGERS

A list of trigger cards. Each card represents one timed action with its own enable/disable toggle.

Available trigger types:

**Warning Chime**
- Time field — "when X time is remaining" (e.g. `01:00`)
- Sound picker — icon button (music note) to select the chime sound

**Change Pre/Post Text**
- Time field — "when X time is remaining"
- Text fields to define the new pre and/or post text that will be applied at that moment

Adding triggers:
- `+ Add Time Trigger` button at the bottom of the list — opens a selector to choose the trigger type

Each card has:
- Toggle ON/OFF (enable/disable without deleting)
- Delete button

---

#### BEHAVIOR

| Toggle | Default | Description |
|---|---|---|
| Hide on completion | ON | When ON, removes the countdown from the presenter output when the timer finishes |

---

### 3.4 Fixed Footer

Visible on all three tabs, always at the bottom of the left panel.

**Status bar**
- Colored dot indicator:
  - Yellow: "Ready to start"
  - Green: "Running"
  - Gray: "Paused"
  - Red: "Finished"
- Current time display (e.g. `05:00`) — shows remaining time

**Primary button**
- **Start Countdown** — when idle or paused
- **Pause** — when running
- Toggles between Start and Pause; resumes from where it stopped

**Secondary buttons**
- **Preview** — sends the current countdown layout to the media-screen without starting the timer (allows checking the visual before going live)
- **Overlay** — opens a pinned floating window of the app showing the countdown (new feature to be exposed by the Lumen SDK)

---

## 4. Right Panel — Live Preview Stage

- Displays a live preview of the countdown with the current configuration applied
- The preview area is contained with padding — does not fill the full panel width
- "Fullscreen" button (top-right) — expands the preview to fill the entire right panel
- The preview updates in real time as settings change

**Info cards below the preview** (two cards side by side):

| Card | Icon | Content |
|---|---|---|
| Current Output | Monitor icon | Active output screen and resolution — e.g. "Main Hall Screen • 1920x1080" |
| Next Action | Lightning icon | What will happen when the timer reaches zero — e.g. `Auto-switch to "Welcome Video"` |

---

## 5. Presenter Display

Registered via `presenter.content` slot. Renders differently based on `overlayMode`.

### 5.1 Fullscreen Mode

Covers the entire presenter output. Layout (all elements centered):

```
┌──────────────────────────────┐
│                              │
│      Pre text                │  ← font: configured, color: timerColor or auto-contrast
│                              │
│         05:00                │  ← large digits, bold, configured size
│                              │
│      Post text               │  ← font: configured, color: prePostColor at prePostOpacity
│                              │
└──────────────────────────────┘
```

- Background: configured via BACKGROUND LAYER (solid / gradient / image / video)
- Text shadow/glow applied to all text elements per `textShadowGlow` value
- Post text: if multiple lines, rotates as animated carousel every 10s

### 5.2 Corner Mode

Floating text overlay in one of 4 corners of the presenter while the underlying media continues to play.

- No own background — text floats directly over the media
- Corners: `top-left` · `top-right` · `bottom-left` · `bottom-right`
- Content: timer digits only (no pre/post text in corner mode — TBD)
- Text color: same as configured in Appearance

---

## 6. Timer Engine

### 6.1 Precision

The timer uses `Date.now()` as an absolute anchor (`startedAt`) — never accumulates drift from `setInterval`.

```ts
getRemainingSeconds() = totalSeconds - (Date.now() - startedAt) / 1000
```

When `allowNegative` is OFF, clamps at 0. When ON, returns negative values.

### 6.2 Resync by Acceleration

On each tick, the engine compares the last rendered value against the calculated value from the anchor:

- **Drift ≤ 3s** → normal tick interval (1000ms)
- **Drift > 3s** → fast tick interval (100ms) until the display catches up, then returns to 1000ms

This prevents jarring jumps on the display — the number catches up smoothly.

### 6.3 State Machine

```
idle ──[start]──► running ──[pause]──► paused
                     │                    │
                  [reset]              [start]
                     │                    │
                   idle ◄────────────────┘
                     ▲
running ──[zero reached]──► finished ──[reset]──► idle
```

### 6.4 Main ↔ Presenter Communication

The timer runs in the main window. On each tick it emits via the event bus:

```ts
host.bus.emit("countdown:tick", {
  remaining: number,
  status: "idle" | "running" | "paused" | "finished",
  config: CountdownConfig
})
```

`CountdownDisplay` and `CountdownCorner` on the presenter window listen to `countdown:tick` and re-render.

---

## 7. Background Preset System

Each preset defines a full `appearance` snapshot applied atomically when selected:

| Preset | theme | background | timerColor | fontWeight |
|---|---|---|---|---|
| Dark Minimal | dark | solid #000000 | #FFFFFF | Extra Bold |
| Light Clean | light | solid #FFFFFF | #000000 | Extra Bold |
| Vibrant Blur | dark | gradient (purple/blue) | #FFFFFF | Extra Bold |
| Custom Video | dark | video (user-selected) | auto-contrast | Extra Bold |

Selecting a preset overwrites the current appearance settings. Individual fields can be further customized in the Appearance tab afterwards.

---

## 8. Data Persistence

```ts
// Stored in host.data.json
type PersistedData = {
  config: CountdownConfig
}
```

Runtime state (`status`, `startedAt`, `pausedAt`) is **not** persisted — resets when the app restarts.

Config is saved automatically on every change (debounced).

---

## 9. Data Types

```ts
type TimeTrigger =
  | { enabled: boolean; atSeconds: number; type: "warning-chime"; sound: string }
  | { enabled: boolean; atSeconds: number; type: "change-text"; preText: string; postText: string }

type CountdownConfig = {
  totalSeconds: number
  allowNegative: boolean
  preText: string
  postText: string              // lines separated by \n → 10s carousel each
  appearance: {
    font: string
    fontWeight: string
    fontSize: number            // px
    timerColor: string          // hex — defaults to auto-contrast
    prePostColor: string        // hex
    prePostOpacity: number      // 0–1
    textShadowGlow: number      // 0–1
    overlayMode: "fullscreen" | "corner"
    cornerPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right"
    background:
      | { type: "solid"; color: string }
      | { type: "gradient"; value: string }
      | { type: "image"; value: string; opacity: number }
      | { type: "video"; value: string; opacity: number }
  }
  actions: {
    autoAdvance: { enabled: boolean; target: string }
    timeTriggers: TimeTrigger[]
  }
  behavior: {
    hideOnCompletion: boolean
  }
}

type CountdownState = {
  status: "idle" | "running" | "paused" | "finished"
  remainingSeconds: number
  startedAt: number | null      // Date.now() anchor
  pausedAt: number | null
}
```

---

## 10. Dependencies

| Package | Use |
|---|---|
| `@lumen-media/module-sdk` | UI components, host API, hooks |
| `zustand` | Global state (config + runtime state) |
| `usehooks-ts` | React hooks (useInterval, useDebounce, etc.) |
| `lucide-react` | Icons |
| `animejs` | Text carousel transitions, zero-hit animation |
| `polished` | Auto-contrast color detection (`readableColor`) |
