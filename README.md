# Countdown Module

Countdown timer module for Lumen with presenter output, overlay support, live styling preview, time triggers, bundled/library audio, and queue integration.

## What it does

- Opens from the Tools menu or Commander
- Renders a configurable countdown on `presenter.content`
- Supports presenter output or a dedicated overlay window
- Exposes a small running-status control in the app header
- Saves module config and timer presets between sessions
- Supports English and Portuguese (`pt-BR`)

## Current feature set

### Configure
- Minutes and seconds inputs
- Quick adjustments: `+10s`, `-10s`, `Reset`
- Quick duration presets: `5`, `10`, `15`, `30` minutes
- Pre text and post text
- Simple completion shortcut (`None` / `Auto-switch to next Scene`)
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
  - `Flip`
  - `Blur`
- Optional pulse effect
- Optional progress bar + color picker
- Display mode:
  - `Fullscreen`
  - `Corner`
  - Corner position: top/bottom + left/right

### Actions & behavior
- Auto-advance toggle with configurable end action
- Time triggers with enable/disable, reorder, duplicate, and delete
- Trigger types:
  - `Change Text`
  - `Play Sound`
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
  - `send-webhook`
- Completion sound from bundled audio
- Optional library audio for sound triggers
- Hide on completion
- Allow negative time
- Count up mode
- Webhook URL

### Runtime / output
- Main timer logic lives in the module store
- Presenter display is synced through Tauri events
- Overlay window can be opened independently from the presenter output
- Header slot shows a compact running timer status when the countdown is active
- Queue trigger provider is registered as `countdown.wait`

## Project structure

- [`src/main.ts`](./src/main.ts): module registration, host wiring, persistence
- [`src/store.ts`](./src/store.ts): runtime state, timer engine, projection, trigger handling
- [`src/components/CountdownDialog.tsx`](./src/components/CountdownDialog.tsx): main dialog shell
- [`src/components/left/tabs`](./src/components/left/tabs): configurator tabs
- [`src/components/right`](./src/components/right): live preview stage
- [`src/components/presenter`](./src/components/presenter): presenter/overlay rendering
- [`docs/spec.md`](./docs/spec.md): current feature specification
- [`docs/plan.md`](./docs/plan.md): implementation notes and WIP ideas

## Develop

```bash
pnpm install
pnpm build
pnpm pack
pnpm validate
```

## Notes

- The module relies on host capabilities exposed by Lumen for presenter output, overlay control, library lookups, queue actions, and background picking.
- Some docs in older commits described planned behavior that no longer matches the current implementation. The files in `docs/` are intended to reflect the module as it exists now.

## License

MIT
