# Lumen Countdown Module

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Lumen API](https://img.shields.io/badge/Lumen_API-%5E0.1.0-blue.svg)](https://lumen.media)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-9.x-orange.svg)](https://pnpm.io/)

**Module ID:** `com.example.countdown-module` &nbsp;|&nbsp; **Version:** 1.3.1 &nbsp;|&nbsp; **Lumen API:** ^0.1.0 &nbsp;|&nbsp; **License:** MIT

Countdown timer module for Lumen with presenter/overlay output, live styling preview, time triggers, bundled & library audio, queue integration, corner/fullscreen modes, timer presets, and Commander quick controls. Supports English and Portuguese (pt-BR).

## Overview

The **Lumen Countdown Module** is a full-featured timer solution designed for live productions, worship services, events, and broadcast workflows. It integrates deeply with the Lumen platform to provide:

### Core Capabilities

- **Precision Timer Engine** — Built on `animejs` with drift-corrected animation, supporting countdown, count-up, and negative overrun modes
- **Dual Output** — Render to the presenter (fullscreen or corner overlay over media/lyrics) and/or a dedicated overlay window simultaneously
- **Live Styling Preview** — Real-time preview in the configuration dialog showing exactly how the timer will look on output
- **Time Triggers** — Configure actions at specific timestamps: change text, play sounds, advance queue, trigger slides, send webhooks
- **Audio System** — Bundled completion/warning sounds plus integration with Lumen's media library for custom audio
- **Queue Integration** — Register as a `countdown.wait` trigger provider for automated show flow control
- **Commander Quick Controls** — Launch presets and control the timer directly from Lumen's Commander palette
- **Persistence** — Auto-saves configuration and user presets between sessions via Lumen's data store
- **Internationalization** — English and Portuguese (pt-BR) with locale detection

### Use Cases

| Scenario | Features Used |
|---|---|
| Worship service transitions | Countdown, corner mode over lyrics, auto-advance queue, completion sound |
| Live event segment timing | Count-up mode, time triggers for warnings, overlay window for stage display |
| Broadcast commercial breaks | Negative overrun tracking, webhook integration, presenter fullscreen |
| Conference session management | Timer presets, quick hotkeys, header status pill, queue triggers |

## What it does

- Opens from the Tools menu or Commander
- Renders a configurable countdown on `presenter.content`
- Supports presenter output or a dedicated overlay window
- Exposes a compact running-status control in the app header
- Saves module config and timer presets between sessions
- Supports English and Portuguese (`pt-BR`)

## Screenshots

<!-- TODO: add actual screenshots -->
| Configure tab | Appearance tab | Actions tab |
|---|---|---|
| <img width="321" height="789" alt="image" src="https://github.com/user-attachments/assets/992215b0-7c74-4860-8353-d763f41185c7" /> | <img width="316" height="787" alt="image" src="https://github.com/user-attachments/assets/d34d4e8f-46a9-4307-a6c9-b37e3e7a3c45" /> | <img width="317" height="789" alt="image" src="https://github.com/user-attachments/assets/dca5a985-df1f-4f27-b958-bb0059b577de" /> |

<img width="1322" height="830" alt="image" src="https://github.com/user-attachments/assets/322ce122-56bc-4d37-a535-d94cb8a34dc2" />

## Feature set

### Configure
- Minutes and seconds inputs
- Quick adjustments: `+10s`, `-10s`, `Reset`
- Quick duration presets: `5`, `10`, `15`, `30` minutes
- Pre text and post text (translated defaults per locale)
- Timer presets: save, load, delete named configurations
- Hotkey recording for start, pause, reset, +10s, -10s
- Background presets:
  - `Default` (profile background)
  - `Dark Minimal`
  - `Light Clean`
  - `Custom`

### Appearance
- Local/system font selection
- Font weight and size
- Timer and pre/post text colors
- Pre/post opacity
- Background layer editing for:
  - `Solid`
  - `Gradient`
- Glow intensity
- Digit animation:
  - `None`
  - `Flip` (CSS flip-clock style)
  - `Blur`
- Optional pulse effect (last 60s)
- Optional progress bar + color picker
- Display mode:
  - `Fullscreen`
  - `Corner` (overlays existing media/lyrics)
  - Corner position: top/bottom + left/right

### Actions & behavior
- Auto-advance toggle with configurable end action
- Time triggers with enable/disable, reorder, duplicate, and delete
- Trigger types:
  - `Change Text`
  - `Play Sound` (bundled or library audio)
  - `Next in Queue`
  - `Previous in Queue`
  - `Next Slide`
  - `Play Specific Media`
- End action types:
  - `queue.next`
  - `queue.previous`
  - `player.next-slide`
  - `player.play`
  - `change-scene`
  - `open-overlay`
  - `send-webhook` (with optional custom payload)
- Completion sound from bundled audio
- Optional library audio for sound triggers
- Hide on completion (auto-disabled when allow negative is on)
- Allow negative time (overrun, mutually exclusive with count up and hide on completion)
- Count up mode (mutually exclusive with allow negative)
- Webhook URL for timer events

### Runtime / output
- Timer engine runs in a dedicated class (`TimerEngine`) separated from the Zustand store
- Presenter display is synced through Tauri events with ErrorBoundary protection
- Overlay window can be opened independently from the presenter output
- Header slot shows a compact running timer status when the countdown is active
- Queue trigger provider is registered as `countdown.wait`

## Project structure

```
src/
├── main.ts                          # Module registration, host wiring, persistence
├── store.ts                         # Zustand state, config, API wiring
├── types.ts                         # Shared type definitions
├── i18n.ts                          # Translation helper
├── i18n/
│   ├── en.ts                        # English translations
│   └── pt-BR.ts                     # Portuguese translations
├── lib/
│   ├── timer-engine.ts              # Timer engine (animation, sounds, events)
│   ├── format-time.ts               # Time formatting utility
│   ├── display-mode.ts              # Corner/fullscreen mode helpers
│   ├── adaptive-text.ts             # Adaptive text colors and shadows
│   ├── sounds.ts                    # Audio playback, bundled sound management
│   └── utils.ts                     # cn() utility (clsx + tailwind-merge)
├── hooks/
│   ├── useLocalFonts.ts             # System font enumeration
│   └── useContrastColor.ts          # Readable color contrast
└── components/
    ├── CountdownDialog.tsx           # Main dialog shell
    ├── CountdownHeaderStatus.tsx     # Compact header timer indicator
    ├── CountdownCommanderApp.tsx     # Commander quick controls
    ├── DigitDisplay.tsx              # Animated digit transitions
    ├── FlipClockDigit.tsx            # CSS flip-clock digit component
    ├── CircularProgress.tsx          # SVG progress ring
    ├── TextCarousel.tsx              # Rotating text carousel
    ├── QueueTriggerConfig.tsx        # Queue wait trigger config
    ├── presenter/
    │   ├── CountdownDisplay.tsx      # Presenter/overlay countdown renderer
    │   └── ErrorBoundary.tsx         # Presenter crash protection
    ├── right/
    │   ├── RightPanel.tsx            # Preview stage panel
    │   └── CountdownPreview.tsx      # Live preview of the countdown
    └── left/
        ├── PanelFooter.tsx           # Dialog footer (controls, projection)
        ├── TimerSettings.tsx         # Presets, hotkeys, webhook settings
        └── tabs/
            ├── ConfigureTab.tsx      # Duration, text, background presets
            ├── AppearanceTab.tsx     # Font, colors, animations, display mode
            └── ActionsTab.tsx        # End actions, time triggers, behavior
```

## Develop

```bash
pnpm install
pnpm build
pnpm pack
pnpm validate
```

## Notes

- The module relies on host capabilities exposed by Lumen for presenter output, overlay control, library lookups, queue actions, and background picking.
- The presenter window has no Tailwind CSS available, so `CountdownDisplay.tsx` and `FlipClockDigit.tsx` use inline styles exclusively.
- Timer engine logic (`start`, `pause`, `reset`, animation, sounds, events) lives in `lib/timer-engine.ts`, separate from the Zustand store.

## Quick Start

```bash
# Install dependencies
pnpm install

# Development (watch mode)
pnpm dev

# Build for production
pnpm build

# Create .lumenpack for distribution
pnpm pack

# Validate manifest & package
pnpm validate
```

## Install in Lumen

1. Run `pnpm pack` to produce `com.example.countdown-module-X.Y.Z.lumenpack`
2. In Lumen: **Settings → Modules → Install Module** → select the `.lumenpack` file
3. Enable the module and open via **Tools → Countdown Timer** or Commander (`Ctrl+Shift+P` → "Countdown: Controls")

## License

MIT
