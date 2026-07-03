# Countdown Module

Countdown timer module for Lumen with presenter output, overlay support, live styling preview, time triggers, bundled/library audio, and queue integration.

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
| ![](./screenshots/configure-tab.png) | ![](./screenshots/appearance-tab.png) | ![](./screenshots/actions-tab.png) |

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

## License

MIT
