---
broadcasts_applied_through: 2026-06-25
---

# PROJECT_MEMORY — LCARS-HA-Web · **Project LaForge**

> **Codename applied 2026-07-03:** the custom-renderer build (tier-3 custom card path) is named
> **Project_LaForge**. Folder/repo names unchanged (still `LCARS-HA-Web`) — rename is a separate
> decision if Patrick wants it.

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

### 2026-06-13 — Vault path correction (SITREP session)
- Project files were in wrong vault path (`My Drive\MyVaultObsidian` — no email suffix, not synced by Google Drive or opened by Obsidian)
- Correct vault path: `C:\Users\Patri\My Drive (patrick.patrickbyrne@gmail.com)\MyVaultObsidian\UberMegaVault`
- All files copied to correct vault; STATUS.md and PROJECT_MEMORY.md git commands corrected
- Previous LCARS-HA-Web Cowork session has stale path context — do not resume it; start fresh and connect correct vault folder
- CLAUDE.md updated with canonical path rule to prevent recurrence

### 2026-06-17 — LCARS frame overhaul (migrated to LCARdS native cards)
- Migrated ALL 7 views from ha-lcars CSS-class layout → `custom:lcards-layout-view` grid view
- Frame: `lcards-elbow` header-left + footer-left chrome (#2a6bff); built-in left nav rail of
  `lcards-button` (preset bullet, 6 stations + orange AMBIENT accent)
- Content area gets `view_layout.overflow: auto` → independent scroll inside fixed frame
- Grid: cols `150px 1fr`, rows `52px 1fr 34px`, areas header/nav/content/footer, gap 6px, height 100vh
- Existing station content (FRED stats, cameras, GIFs, etc.) preserved — extracted from old body and
  dropped into the content grid-area
- KEY GOTCHA: button preset fields `label`/`name`/`state` default to `show: false` — MUST set
  `show: true` on the label or no text renders. Also set `show_icon: false` to reclaim the 60px icon strip.
- Engineering squared-corner issue resolved (all stations now share the uniform frame)
- Full pre-overhaul backup saved as hidden dashboard `lcars-bak-0617` (restore = copy its config to lcars-main)
- Edited live via Chrome websocket `lovelace/config/save`; reload tab to refresh hassConnection first
- LCARdS docs: https://lcards.unimatrix01.ca (layout-view, elbow, button, text-fields pages)
- TODO next: decorative LCARS flavor on Main/Tactical, live clock back on header bar, Science/Comms/Conn content rebuilds

### 2026-06-21 — "The Feel" pass: first interactive controls (DIRECT CONTROL showcase)
**Goal of this session:** nail the portfolio-grade *feel* (crisp/snappy, clean lines, pressed-button
highlight, real working sliders, beeps) on existing entities BEFORE adding more devices. Patrick is
adding real devices (TP-Link/Tuya) + the floor plan himself later tonight.

- **REALITY CHECK (entities):** HA currently has only ONE `light.` entity — `light.backyard_light`,
  and it is **on/off only (not dimmable)**. There are **zero living-room light entities in HA** — those
  bulbs live only in Alexa (surface as `button.*_living_room_and_foyer_lights_off`). So the envisioned
  "living room dimmable slider" has no real entity yet. **Decision (Patrick-approved):** nail the feel on
  real entities we DO have; the slider pattern transfers 1:1 to the living-room bulbs once they're in HA.
  → Bringing those in = TP-Link/Kasa or Tuya/Smart Life integration (deferred to Patrick tonight).

- **NEW SECTION — `DIRECT CONTROL`** added to top of Main content (`storage-id: main-sec-control`,
  inserted at content index 1, right under the banner). Teal header bar `#3fb6c9`, same expander pattern
  as existing sections. Idempotent: rebuild filters any prior `main-sec-control` before splicing.
  Contains:
  - `lcards-slider` → `input_number.lcards_sound_volume`, label "MASTER AUDIO" (real LCARdS beep/ambient
    master volume — adjusting it literally changes interaction-sound loudness; ties feel + sound together)
  - `lcards-slider` → `number.downstairs_volume`, label "DOWNSTAIRS" (real Echo announce volume, 0–11)
  - `lcards-button` (preset lozenge, `interactive:true`, `tap_action:{action:toggle}`) →
    `light.backyard_light`, label "BACKYARD FLOOD". Press-highlight via state color map
    `style.card.color.background = {default:'#11224e', active:'#3fb6c9'}` (turns teal when ON).

- **NEW GOTCHA — `lcards-slider` schema (first use in this project; none existed before):**
  `{type:'custom:lcards-slider', entity:<...>, preset:'pills-left-border', text:{label:{show:true,
  content, position:'center-left', ...}, state:{show:true, position:'center-right', ...}}}`.
  Supports light/cover/fan/number/input_number. The preset's LEFT label zone is NARROW (~140px) — long
  labels collide with the `state` value (saw "DOWNSTAIRS ANNOUNCE" overprinted by "11.0"). **Keep slider
  labels short.** Validated every card by isolated test-render (`createElement` + `setConfig` + `hass`,
  read shadowRoot) BEFORE saving live — worth doing given ~18–20s first-render cost per reload.

- **OPEN ITEM:** slider fill is the default green→red segmented gradient (reads slightly alert-ish for a
  volume). A dept-palette color override (`style.slider.color`?) was NOT verified — tune later.

- **Rollback safety this session:** original config held in-tab as `window.__lcarsCfg` (session-only,
  instant re-save to restore); on-disk backups remain `lcars-bak-0617` + `dashboard_versions/lcars-v2.json`.
  Did NOT physically toggle the backyard floodlight (real outdoor device) — highlight state is wired and
  will show on first tap.

- **NEXT:** (1) tune slider color to dept palette; (2) roll DIRECT-CONTROL pattern + press-highlight to
  other stations; (3) browser_mod pop-in detail panels (v3 #2); (4) red-alert automation (v3 #4);
  (5) once Patrick adds living-room dimmers, swap a slider's `entity` to a real `light.*` brightness.

### 2026-06-21 (cont.) — Red Alert (v3 #4): manual controls + siren automation
- **Alert mode entity:** `input_select.lcards_alert_mode`, options `green_alert / red_alert / yellow_alert /
  blue_alert / gray_alert / black_alert`. Setting it recolors the WHOLE LCARdS UI (palette hue-shifts to the
  alert color — verified: navy panels → maroon, slider gauges → red). Red/Yellow tuning lives in LCARdS Alert Lab.
- **Manual controls:** added a `◤ RED ALERT` (red) + `STAND DOWN` (navy) `lcards-button` horizontal-stack as the
  FIRST card inside the DIRECT CONTROL section (Main). Each uses
  `tap_action:{action:'call-service', service:'input_select.select_option',
  target:{entity_id:'input_select.lcards_alert_mode'}, data:{option:'red_alert'|'green_alert'}}`. Idempotent
  rebuild drops any prior horizontal-stack containing `lcards_alert_mode` before unshifting.
- **Automation:** `automation.lcars_red_alert_on_siren` (created via REST `config/automation/config/<id>`, id
  `lcars_red_alert_on_siren`, state ON). Trigger = state change of `siren.downstairs_siren` /
  `siren.backyard_siren`. choose: if EITHER siren on → `red_alert`; default → stand down to `green_alert` ONLY if
  currently `red_alert` (preserves a manual yellow/blue). Modern HA syntax (`triggers`/`actions`/`trigger:'state'`).
- **NOT live-tested via the physical siren** (would blast a real alarm in the house) — red-alert ACTION path
  proven manually; trigger path is logically sound. Patrick can test by toggling a siren when convenient.
- **No motion binary_sensors exist** in HA (cameras only expose `switch.*_motion_detection` enable toggles),
  so siren is the trigger source (matches inbox brief's fallback). If motion sensors get added later, add them
  as extra triggers to the same automation.
- To remove: delete `automation.lcars_red_alert_on_siren` (Settings → Automations) and the alert-row from the
  DIRECT CONTROL section.

### 2026-07-03 — Project LaForge named; layout methodology LOCKED (design reevaluation session)
- **Codename Project_LaForge** applied to the custom-renderer build (folder/repo names unchanged).
- **Invisible grid LOCKED** into UI_STANDARDS §4: 0.25u snap for all element x/y/w/h; two gap
  constants only (frame seam 0.18u, content gap 0.5u); 0.5u row rhythm; renderer will only
  expose grid-snapped placement (alignment correct by construction).
- **Navigation rethought — stations are DEAD.** Six function groups, category-colored,
  touch-first (≥1.8u targets, max 2-tap depth): LIGHTS canary / SECURITY indian-red /
  CLIMATE lilac / MEDIA magenta / HOME chetwode / CORE peach. See LAFORGE_DESIGN.md.
- **Main-screen methodology LOCKED: GLANCE GRID** (all groups visible as live clusters,
  zero-tap glance). Group subscreens = Option-2 workspace pattern (controls embedded in
  two-frame okudagram). HOME subscreen = MSD floor plan (rooms as tap targets).
- Sketches in project root: `laforge_main_1/2/3.html` (main options),
  `laforge_sketch_A/B/C.html` (dialect exploration: A=okudagram, B=lcarsladlondon-dense, C=hybrid).
  Insight that ended the churn: the two reference sources disagree — intro2 video = chunky TNG,
  images/inspiration/ = thin dense Voyager. Named dialect: chunky TNG frame, authentic per Patrick.
- New docs: `LAFORGE_DESIGN.md` (nav map, feature scope DRAFT — Patrick to amend, decision log).
- **NEXT:** amend/lock feature scope → build the real Glance Grid main on the grid-snapped
  renderer (port createRadiusPath per CUSTOM_BUILD_PLAN step 1) → LIGHTS subscreen first
  (proves the Option-2 pattern) → MSD when floor plan SVG arrives.

### 2026-06-21 (cont.) — browser_mod installed + tap-to-popup detail panels (v3 #2)
- **Installed browser_mod 2 v2.13.5** (thomasloven, HACS Default) via HACS → `/config/custom_components/browser_mod`.
  Required an **HA restart** (Patrick approved) because it ships a backend integration, not just a frontend card.
  After restart, created the config entry via REST `config/config_entries/flow` {handler:'browser_mod'} (single-step,
  no input). Services now available: popup, close_popup, more_info, set_popup_style, navigate, etc.
- **⚠️ CRITICAL GOTCHA #1 — per-browser REGISTRATION required.** browser_mod will NOT display popups on a browser
  until that browser is REGISTERED. A fresh browser has a `browserID` and connects, but `registered:false` → popups
  silently no-op (popupState stays null, no DOM element, no error). Register via ws command
  `hass.connection.sendMessage({type:'browser_mod/register', browserID:<id>})` (key is camelCase `browserID`),
  or via the browser_mod settings UI ("Register this browser" toggle). **Patrick's kiosk display browser must be
  registered once** or popups won't show there either. Verified: once registered, popups render perfectly.
- **⚠️ CRITICAL GOTCHA #2 — `lcards-button` does NOT bridge tap_action to browser_mod.** Tried `fire-dom-event`
  (browser_mod key) AND `perform-action` on `lcards-button` → no popup, no console error (it silently swallows).
  **Use a STOCK `button` card** (or another core card) for browser_mod popup triggers, styled to match LCARS via
  `card_mod` (gold pill: `ha-card{background:#f4b13c;color:#0b0f1c;border-radius:21px;...}`).
- **SHOWCASE built — `⊕ FRED CORE · DETAIL`** stock button in DIRECT CONTROL, opens a `browser_mod.popup` titled
  "FRED · CORE DIAGNOSTIC" with LCARS content: `lcards-elbow` header "WARP CORE · FRED" + an `entities` card of the
  8 Fred sensors (CPU/Memory/Load/Net in-out/Disk read-write/Alarms). **Popup VERIFIED rendering** (fired the exact
  button payload via service → full LCARS diagnostic displayed correctly). Tap_action: `{action:'perform-action',
  perform_action:'browser_mod.popup', data:{title, size:'wide', dismissable:true, content:{...}}}`.
- **UNVERIFIED this session:** the literal button TAP firing the popup — automated synthetic clicks on the LCARS/kiosk
  dashboard didn't register an action (likely a headless-click artifact, not the config; the payload itself works via
  service). **Patrick: tap the gold FRED CORE · DETAIL button on the real display to confirm; if it doesn't fire,
  the fallback is `tap_action:{action:'fire-dom-event', browser_mod:{service:'browser_mod.popup', data:{...}}}`.**
- **NEXT (popup rollout):** once tap confirmed, replicate the pattern — tap rooms/systems (cameras, network, climate)
  → browser_mod.popup detail views across stations. Reuse the stock-button + card_mod + perform-action recipe.