# PROJECT_MEMORY — LCARS-HA-Web

> **READ THIS AT THE START OF EVERY SESSION on this project.**
> Update the Rolling Log at the end of every session.

---

## What This Project Is

A **LCARS web dashboard for Home Assistant**, designed to run full-screen in Chrome (kiosk mode).
Built on the `cb-lcars` custom card library — a fork of `snootched/cb-lcars` — which provides
authentic TNG-era LCARS UI elements (elbows, buttons, sliders, gauges, animations) as HA Lovelace cards.

Goal: a fully operational LCARS interface for controlling Jarvis (Fred @ 10.0.0.149:8123) from
any browser on the network. Primary use: Chrome window in kiosk mode on a dedicated display.

**Relationship to LCARS-HA-Terminal:** The hardware terminal project is on indefinite hold.
This project delivers the software side — the dashboard that would have run on the Pi — without
needing any custom hardware. The two projects share design language and the cb-lcars card library.

**Relationship to Project Jarvis:** This IS the UI layer for Jarvis. HA runs on Fred; this
dashboard talks to it. GPU passthrough on Fred is not a blocker for the dashboard itself.

---

## Vault & Git

- **Vault path:** `UberMegaVault\30_Projects\LCARS-HA-Web\`
- **GitHub (fork):** `https://github.com/Necrotictv/cb-lcars` — fork of `snootched/cb-lcars`
- **Upstream:** `https://github.com/snootched/cb-lcars` — do not push upstream; PR if contributing back
- **Install in HA via HACS:** add `Necrotictv/cb-lcars` as a custom HACS repository

---

## Stack & Dependencies

| Layer | Component | Notes |
|---|---|---|
| Card library | `cb-lcars` (Necrotictv/cb-lcars) | Custom LCARS cards — source lives in this project |
| Theme | `ha-lcars` (th3jesta/ha-lcars) | Required base theme; install via HACS |
| Button engine | `custom-button-card` (snootched fork) | Bundled inside cb-lcars |
| Slider support | `my-slider-v2` (AnthonMS/my-cards) | Required for Multimeter card; install via HACS |
| Layout | `lovelace-card-mod` (thomasloven) | Required for symbiont/imprint feature; install via HACS |
| Layout (optional) | `lovelace-layout-card` (thomasloven) | Optional — useful for complex grid layouts |
| HA backend | HAOS on Fred @ 10.0.0.149:8123 | Device control, state machine |
| Voice (future) | Wyoming Piper / TTS Voice Lab | Wake word "Computer" — not a blocker for dashboard |
| Kiosk mode | Chrome `--kiosk` flag or lovelace-wallpanel | Fullscreen, no browser UI |

---

## HACS Install Order (do this in HA before building the dashboard)

1. `ha-lcars` theme — https://github.com/th3jesta/ha-lcars
2. `my-slider-v2` — https://github.com/AnthonMS/my-cards
3. `lovelace-card-mod` — https://github.com/thomasloven/lovelace-card-mod
4. `cb-lcars` (Necrotictv fork as custom HACS repo) — https://github.com/Necrotictv/cb-lcars

---

## cb-lcars Card Inventory

| Card | Use case |
|---|---|
| `cb-lcars-elbow-card` | Headers, footers, panel borders — LCARS elbow shapes |
| `cb-lcars-double-elbow-card` | Picard-style double elbows |
| `cb-lcars-button-card` | Lozenge, bullet, capped, Picard-style action buttons |
| `cb-lcars-multimeter-card` | Sliders + gauges — lights, media, sensors |
| `cb-lcars-label-card` | Text labels and data readouts |
| `cb-lcars-dpad-card` | D-pad directional control |
| `cb-lcars-animation-alert` | Red/Yellow Alert animation |
| `cb-lcars-animation-cascade` | Data cascade effect |
| `cb-lcars-animation-pulsewave` | Pulsewave animation |
| `cb-lcars-animation-bg-grid` | Grid / nebula background |
| `cb-lcars-animation-geo-array` | Geo array panel animation |

---

## Dashboard Architecture (planned)

```
LCARS Chrome Kiosk Window
├── Header bar (cb-lcars-elbow-card) — title, stardate, alert status
├── Left sidebar — room/section selector (input_select helper)
├── Main content area — conditional cards per room
│   ├── Lights (multimeter sliders)
│   ├── Climate
│   ├── Security / cameras
│   └── Media / entertainment
├── Footer bar (cb-lcars-elbow-card) — quick actions, status indicators
└── Alert overlay (cb-lcars-animation-alert) — triggered by HA automation
```

Reference example from repo: `examples/dashboard-tablet.yaml` — room selector + multimeter lights.

---

## Colour Scheme

Use `LCARS Picard [cb-lcars]` theme from `ha-lcars-theme/cb-lcars-lcars.yaml`.
Core palette: grays, blues, oranges.
Add to `lcars.yaml` in HA per ha-lcars theme instructions, then set as active theme.

Antonio font resource (supports weights 100-700 for Picard-thin text):
`https://fonts.googleapis.com/css2?family=Antonio:wght@100..700&display=swap`

---

## Kiosk Mode Setup (Chrome)

**A. Chrome shortcut / PowerShell:**
```powershell
Start-Process "chrome.exe" "--kiosk --app=http://10.0.0.149:8123/lovelace/lcars"
```

**B. lovelace-wallpanel HACS card:** hide sidebar, screensaver, kiosk features from within HA.
Install: `j-a-n/lovelace-wallpanel` from HACS.

---

## Next Steps

- [ ] Install HACS dependencies in HA (ha-lcars theme, my-slider-v2, card-mod)
- [ ] Add Necrotictv/cb-lcars as custom HACS repository → install
- [ ] Apply `LCARS Picard [cb-lcars]` theme profile
- [ ] Build first LCARS dashboard view — use `examples/dashboard-tablet.yaml` as reference
- [ ] Define room list for sidebar (input_select helper)
- [ ] Wire up lights section (multimeter cards for existing Tuya/Smart Life devices)
- [ ] Set up Red Alert / Yellow Alert automation → cb-lcars-animation-alert
- [ ] Configure Chrome kiosk mode shortcut on Zeke
- [ ] Test from browser at http://10.0.0.149:8123

---

## Git Rules

- Do not commit secrets or HA auth tokens
- `node_modules/` is gitignored (run `npm install` to restore)
- Keep `upstream` remote pointed at `snootched/cb-lcars` for pulling upstream changes
- Custom dashboard YAMLs live in `dashboard/` — our primary development area

---

## Rolling Log

### 2026-06-11 — Project created
- Split off from LCARS-HA-Terminal (hardware terminal on indefinite hold)
- cb-lcars fork (Necrotictv/cb-lcars) confirmed as UI foundation
- Project scaffold created; git setup commands in STATUS.md
- LCARS-HA-Terminal PROJECT_MEMORY updated to reflect split
