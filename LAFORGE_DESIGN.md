# Project LaForge — Design Doc (nav map · feature scope · layout methodology)

> Created 2026-07-03. Governs the custom-build main screen. Companion to UI_STANDARDS.md
> (the visual specs) and CUSTOM_BUILD_PLAN.md (the build order).
> Status: DRAFT — Patrick to amend scope + grouping, then we lock.

## Design goals (Patrick, 2026-07-03)
1. Most **authentic TNG-era** look/feel achievable while keeping HA functionality + addons.
2. **Single main screen** from which ANY system in HA is reachable. Subscreens, popups,
   embedded content all permissible.
3. UI specs locked first (invisible grid — see UI_STANDARDS §4), then layout methodology,
   then feature scope.
4. **Navigation rethought entirely:** NOT by starship station. Group functions by what makes
   sense for the home. Nav map designed for a **touch interface** (big targets, shallow depth).

## Function-based nav map (DRAFT v1)
Six function groups, each = one category color (UI_STANDARDS §3), each reachable in ONE tap
from the main screen. Max depth anywhere = 2 taps (group → detail popup).

| Group | Color | Contains (today's real entities) | Later |
|---|---|---|---|
| **LIGHTS** | canary | backyard flood (toggle) | living-room dimmers (TP-Link/Tuya), scenes |
| **SECURITY** | indian-red | 3 cameras, motion toggles, 2 sirens, alert mode | locks, door/window sensors |
| **CLIMATE** | lilac | weather.forecast_home, sun, UV/humidity | thermostat/AC control |
| **MEDIA** | magenta | 4 Echo players, volumes, DnD, TTS announce | VLC on Fred, viewscreen |
| **HOME** | chetwode-blue | floor plan (MSD), presence, calendar, reminders, Alexa routines, cats/litter | room-by-room drill-down via floor plan |
| **CORE** | orange-peel | Fred CPU/RAM/net/disk, network WAN/speeds, HA updates, ntopng | Proxmox VMs, self-healing status |

Global (always visible, not a group): clock/stardate, alert-mode indicator, master audio.

## Touch rules
- Minimum touch target **1.8u** high (≈36px at u=20; scale --u so this is ≥44px on the wall display).
- One-tap group access from main. Detail = popup/subscreen with a persistent HOME cap-button.
- No hover-dependent anything; press states = color highlight (tangerine).

## Feature scope (DRAFT v1 — amend me)
- IN v1: lighting control, cameras, alert modes, weather, calendar, Echo media + TTS,
  Fred/network status, floor plan view, clock/stardate, sounds.
- LATER: thermostat, locks, ntopng per-host data, Proxmox control, voice — **Majel
  Roddenberry ship's-computer voice** (TTS model already in hand; needs infrastructure built
  + hookup, ties into TTS Voice Lab), NotebookLM.
- OUT (explicitly): nothing yet.

## Layout methodology — candidates for the MAIN screen
Three authentic-TNG candidates built as sketches (laforge_main_1/2/3.html):
1. **MSD HUB** — floor plan as a Master Systems Display center-stage (the ship-cutaway
   metaphor applied to the house); function groups as capped buttons around the frame.
2. **ONE-TAP TWO-FRAME** — Patrick's favorite okudagram silhouette; upper frame = identity +
   ONE row of function-group lozenges (no station level = nav de-clunked); lower frame =
   selected group's controls embedded; popups for detail.
3. **GLANCE GRID** — everything visible at once as dense clusters inside one two-frame
   okudagram (weather strip, camera thumbs, light sliders, Fred bars, calendar); tap a
   cluster → full subscreen. Zero-tap glanceability, one-tap control.

## DECISION — LOCKED 2026-07-03 (Patrick)
**Main screen = 3 (GLANCE GRID).** All six function groups visible as live clusters at zero
taps — right fit for a wall touch panel you pass constantly.
**Subscreen architecture:**
- Tap a cluster header → that group's SUBSCREEN, patterned on Option 2's lower-frame workspace
  (full-size controls embedded in the okudagram frame; detail = popups).
- **HOME subscreen = the MSD floor plan** (Option 1) — rooms as tap targets → room popups.
  Awaiting Patrick's Sweet Home 3D → SVG floor plan.
- WHY this combo: glance at zero taps, operate at one tap, spatial nav where spatial makes
  sense — each methodology used where it's strongest.
Sketches: `laforge_main_3.html` (main), `laforge_main_2.html` (subscreen pattern),
`laforge_main_1.html` (HOME/MSD pattern).
