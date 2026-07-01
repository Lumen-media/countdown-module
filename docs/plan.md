# Countdown Timer — Plan & Architecture

---

## 1. Overview

A countdown module for Lumen that allows creating and controlling a countdown timer with display on the presenter (output screen). Primary use case: time management in church services and live events (e.g. "5 minutes before the service starts").

**Module name:** Countdown Timer

---

## 2. UI — Main Dialog

The module opens via the **Tools menu** or **Commander** as a dialog occupying ~90% of the viewport with a 16/10 internal aspect ratio (free space on the borders is acceptable). Inside: a 3-tab panel on the left + Live Preview Stage on the right.

**Live Preview Stage (right side)**
- Contained preview area showing the countdown with current appearance settings
- "Fullscreen" button to expand the preview
- Below the preview, two info cards:
  - **Current Output** — active output screen and resolution (e.g. "Main Hall Screen • 1920x1080")
  - **Next Action** — what will happen when the timer reaches zero (e.g. `Auto-switch to "Welcome Video"`)

### Configure Tab

**DURATION**
- Two large inputs: `MM` (minutes) and `SS` (seconds)
- Quick adjustment buttons: `+ 10s` / `- 10s` / `Reset`
- Toggle: **Allow negative time** — OFF = stops at 00:00 / ON = continues at -0:01, -0:02...

**DISPLAY TEXT**
- *Pre text* — simple field, displayed above the number on the presenter
- *Post text* — auto-expanding textarea (grows with content)
  - Always visible on the presenter if it has content
  - Each line = an independent message
  - If more than one line, loops automatically rotating every 10s (animated carousel)

**ON COMPLETION**
- Single dropdown shortcut — quick selection of the main completion action (e.g. "Auto-switch to next Scene")
- Summary of what's configured in the Actions tab; full multi-action editing lives there

**BACKGROUND PRESET**
- Grid of 4 preset cards, each with a thumbnail preview of how the countdown will look:
  - Dark Minimal
  - Light Clean
  - Vibrant Blur
  - Custom Video
- Selecting a preset applies a full appearance configuration (colors, background, typography defaults)
- "Custom Video" preset opens the video file picker

**Fixed footer (always visible)**
- Status indicator: colored dot + label (e.g. "Ready to start") + current time (e.g. `05:00`)
- Large primary button: **Start / Pause** (toggle — Start becomes Pause, resumes from where it stopped)
- Two buttons: **Preview** | **Overlay**
  - Preview → sends to the media-screen without starting the timer
  - Overlay → opens a pinned floating window (new feature to be exposed by the Lumen SDK)

---

### Appearance Tab

**TYPOGRAPHY**
- **Font**: combobox with name search — uses `host.fonts.list()` from the SDK (e.g. "Inter (System Default)")
- **Font weight**: dropdown (e.g. Extra Bold)
- **Font size**: numeric input in px (e.g. 140px)

**COLORS**
- **Timer Text**: color picker — manual color selection (e.g. #FFFFFF)
- **Pre / Post Text**: color picker with opacity (e.g. #FFFFFF at 80%)

> Note: the automatic contrast detection via `polished` will be used as the **default/suggested value** when no color is set, but the user can override manually.

**BACKGROUND LAYER**
- Four tabs: **Solid** | **Gradient** | **Image** | **Video**
  - Solid → color picker
  - Gradient → gradient editor
  - Image → "Change Background Image" button (via `host.ui.openBackgroundPicker`) + **Opacity Overlay** slider (0–100%)
  - Video → looping video file + **Opacity Overlay** slider

**VISUAL EFFECTS**
- **Text Shadow / Glow** — slider 0–100% controlling the shadow/glow intensity behind the text

**Text position**: always fixed to center — no configuration option

**Presenter display mode**:
- Toggle ON → **Fullscreen** — covers the entire presenter
- Toggle OFF → **Corner** — floating text over whatever is on the media-screen, no own background
  - Position select: `Top-left` / `Top-right` / `Bottom-left` / `Bottom-right`

---

### Actions Tab

**END ACTION**
- **Auto-Advance** — toggle ON/OFF with description "Automatically transition to the next item in the playlist when timer reaches zero"
- Dropdown to select destination: e.g. "Go to Next Item"

**TIME TRIGGERS**
- List of trigger cards — each card is one time + one action type, with individual enable/disable toggle
- Trigger types visible:
  - **Warning Chime** — time field (e.g. `01:00`) + sound picker (music note icon)
  - **Change Pre/Post Text** — changes the pre/post text at a specific time
- `+ Add Time Trigger` button to add new cards

**BEHAVIOR**
- **Hide on completion** — toggle ON/OFF — when ON, hides the countdown from the presenter when the timer finishes

---

## 3. Presenter Display

### Fullscreen Mode
```
┌─────────────────────────────┐
│                             │
│   The event is about to     │  ← topText
│          start              │
│                             │
│         05:00               │  ← large bold number
│                             │
│        We're live!          │  ← bottomText (carousel if multiple lines)
│                             │
└─────────────────────────────┘
```
- Background: cascade (media-screen → video → image → profile)
- Text colors: manual (set in Appearance), default suggested by auto-contrast via `polished`

### Corner Mode
- Timer as floating text in one of 4 corners
- No own background — respects whatever is on the media-screen
- Text colors: same as configured in Appearance

---

## 4. Architectural Principles

- **SDK as source of truth**: all UI components come from `@lumen-media/module-sdk/ui`. Custom CSS only for module-specific layout (16/10 dialog ratio, presenter positioning).
- **SDK/Lumen API extensions**: some actions (`next-queue-item`, etc.) and the pinned floating window may require new SDK methods. Will be done as needed — not a blocker.
- **Hooks**: always prefer `usehooks-ts`. Custom hooks only if no equivalent exists.
- **Global state**: Zustand (not React Context).
- **Icons**: Lucide (`lucide-react`)
- **Animations**: Anime.js (`animejs`) — text carousel, zero-hit animation, content transitions. Always via `useRef` + cleanup in `useEffect`.

---

## 5. Technical Architecture

### 5.1 Slots & Entry Points

| Slot / API | Use |
|---|---|
| `dialog` | Main window — 90% viewport, 16/10 ratio |
| `presenter.content` | Output display (fullscreen or floating corner) |
| `menus` — item in **Tools** | Opens the dialog |
| `commands` — **Commander** entry | Opens the dialog |

### 5.2 Data Types

```ts
type EndAction =
  | { type: "queue.next" }
  | { type: "queue.previous" }
  | { type: "player.next-slide" }
  | { type: "player.play"; itemId: string; itemTitle: string }

type TimeTrigger =
  | { enabled: boolean; atSeconds: number; type: "warning-chime"; sound: string }
  | { enabled: boolean; atSeconds: number; type: "change-text"; preText: string; postText: string }
  | { enabled: boolean; atSeconds: number; type: "queue.next" }
  | { enabled: boolean; atSeconds: number; type: "queue.previous" }
  | { enabled: boolean; atSeconds: number; type: "player.next-slide" }
  | { enabled: boolean; atSeconds: number; type: "player.play"; itemId: string; itemTitle: string }

type CountdownConfig = {
  totalSeconds: number
  allowNegative: boolean
  preText: string
  postText: string            // lines separated by \n → 10s carousel each
  appearance: {
    font: string
    fontWeight: string
    fontSize: number          // px
    timerColor: string        // hex
    prePostColor: string      // hex
    prePostOpacity: number    // 0–1
    textShadowGlow: number    // 0–1
    overlayMode: "fullscreen" | "corner"
    cornerPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right"
    background:
      | { type: "profile" }
      | { type: "solid"; color: string }
      | { type: "gradient"; value: string }
      | { type: "image"; value: string; opacity: number }
      | { type: "video"; value: string; opacity: number }
    preset: "dark-minimal" | "light-clean" | "default" | "custom" | null
  }
  actions: {
    autoAdvance: { enabled: boolean; action: EndAction }
    timeTriggers: TimeTrigger[]
  }
  behavior: {
    hideOnCompletion: boolean
  }
}

type CountdownState = {
  status: "idle" | "running" | "paused" | "finished"
  remainingSeconds: number
  startedAt: number | null    // Date.now() — precision anchor
  pausedAt: number | null
  firedTriggers: number[]     // atSeconds values already fired this run
}
```

### 5.3 Persistence

```
data.json
└── config: CountdownConfig   // persisted between sessions; runtime state is not
```

### 5.4 Main ↔ Presenter Communication

Timer runs in the main window. On each tick emits via **Tauri IPC** (not `host.bus`, which is a no-op in the presenter window):

```ts
emit("countdown:tick", { remaining, status, config })
```

`CountdownDisplay` on the presenter listens via `listen("countdown:tick")` and re-renders.

**Timing race fix**: `CountdownDisplay` emits `countdown:display-ready` on mount. The main window listens and calls `rebroadcast()` (re-emits current state). Solves the case where the tick arrives before the component mounts on first open.

### 5.5 Precision Timer & Resync

The timer loop lives at **module level** (outside React) via `scheduleTick` / `clearTick`. This means closing the config dialog does not stop the timer.

Uses `startedAt` as wall-clock anchor — never accumulates `setTimeout` drift.

```ts
elapsed = (Date.now() - startedAt) / 1000
remaining = totalSeconds - elapsed
drift = |remaining - timerState.remainingSeconds|

interval = drift > 3s ? 100ms : 1000ms
```

- Normal operation: 1 tick/s
- Catching up: 10 ticks/s until drift ≤ 3s, then back to 1000ms
- No jump cuts — drift is absorbed gradually

### 5.6 Actions system

**End Actions** — fire when timer reaches zero. Discriminated union stored in `config.actions.autoAdvance.action`:

| type | behavior |
|---|---|
| `queue.next` | `host.queue.next()` |
| `queue.previous` | `host.queue.previous()` |
| `player.next-slide` | `host.player.nextSlide()` |
| `player.play` | `host.player.play(itemId)` |

**Time Triggers** — fire when `remainingSeconds ≤ atSeconds`. Same action types plus `warning-chime` and `change-text`. Once fired, the `atSeconds` value is pushed to `firedTriggers[]` and will not fire again in the same run.

---

### 5.7 Automatic Text Color Detection

Samples a pixel zone of the background in the region where the text is rendered and uses `polished` (`readableColor`) to pick black or white with the highest contrast. The lib implements relative luminance per WCAG.

---

## 6. File Structure

```
countdown-module/
├── src/
│   ├── main.ts
│   ├── state.ts                        # CountdownState + timer engine + resync
│   ├── store.ts                        # Zustand store (config + runtime state)
│   ├── components/
│   │   ├── CountdownDialog.tsx         # 16/10 dialog wrapper
│   │   ├── tabs/
│   │   │   ├── ConfigureTab.tsx
│   │   │   ├── AppearanceTab.tsx
│   │   │   └── ActionsTab.tsx
│   │   ├── PanelFooter.tsx             # Status + Start/Pause + Reset + Preview/Overlay
│   │   ├── CountdownDisplay.tsx        # Presenter — fullscreen
│   │   ├── CountdownCorner.tsx         # Presenter — corner mode
│   │   └── TextCarousel.tsx            # Animated carousel (anime.js)
│   ├── hooks/
│   │   └── useContrastColor.ts         # Black/white via polished readableColor
│   ├── i18n/
│   │   ├── en.ts
│   │   └── pt-BR.ts
│   └── i18n.ts
├── docs/
│   └── plano.md
├── manifest.json
├── package.json
└── vite.config.ts
```

---

## 7. Dependencies to Install

```
usehooks-ts
zustand
lucide-react
animejs
polished
```

---

## 8. Queue Trigger integration

### Goal

Register the module as a queue trigger provider so users can attach a countdown to a queue item. When the item plays, the countdown starts automatically with the configured duration.

### User flow

1. Right-click a queue item in the Queue tab
2. Context menu → "Triggers" submenu (shown when modules have registered triggers)
3. Select "Countdown Timer" → popover opens with duration picker (`CountdownTriggerConfig`)
4. Confirm → trigger instance saved on that queue item
5. Queue item plays → Lumen calls `onFire({ totalSeconds })` → timer starts

### Module implementation (pending SDK support)

```ts
host.queue.registerTrigger<{ totalSeconds: number }>({
  id: 'countdown.timer',
  label: 'Countdown Timer',
  icon: Timer,
  ConfigComponent: CountdownTriggerConfig,
  defaultConfig: { totalSeconds: 300 },
  onFire({ totalSeconds }) {
    const store = useCountdownStore.getState()
    store.setTotalSeconds(totalSeconds)
    store.startTimer()
  },
})
```

`CountdownTriggerConfig` is a small component with just a duration input (minutes + seconds).

### SDK dependency

`host.queue.registerTrigger` requires a new SDK minor. Types needed:

```ts
interface QueueTriggerSpec<T = unknown> {
  id: string
  label: string
  icon?: ComponentType<{ size?: number; className?: string }>
  ConfigComponent: ComponentType<{ value: T; onChange: (value: T) => void }>
  defaultConfig: T
  onFire(config: T): void
}

// QueueHostAPI addition:
registerTrigger<T = unknown>(spec: QueueTriggerSpec<T>): Disposable
```

The Lumen-side implementation (module store, aside-panel context menu, trigger instance persistence) is tracked separately in the main Lumen repo.

---

## 9. Pending

- [ ] Queue trigger: wait for SDK + Lumen implementation, then add `CountdownTriggerConfig` and register in `main.ts`
- [ ] Warning chime: sound picker UI and audio playback
- [ ] Publish SDK to npm before integration testing

---

## 10. Implementation Order

1. Install dependencies
2. Create `store.ts` (Zustand — config + state)
3. Implement `state.ts` (timer engine + resync)
4. Implement `CountdownDisplay` + `CountdownCorner` (presenter)
5. Implement `TextCarousel` (anime.js)
6. Implement `useContrastColor` (polished)
7. Implement `ConfigureTab`
8. Implement `AppearanceTab`
9. Implement `ActionsTab`
10. Implement `PanelFooter`
11. Assemble `CountdownDialog`
12. Register slots, Tools menu and command in `main.ts`
13. Test main ↔ presenter communication via bus
14. SDK extensions as needed (pinned window, actions)
15. Publish `.lumenpack`

---

## WIP Ideas

### Run of Show / Queue Duration Sync

Status: WIP / parked for later exploration.

Idea:
- Allow the countdown to pull duration from the current queue or run-of-show item instead of requiring manual timer input every time.
- Optionally reuse the queue item title as countdown text.

Possible directions:
- Manual action: "Use current queue item duration"
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
