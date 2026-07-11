---
broadcasts_applied_through: 2026-06-25
---

# PROJECT_MEMORY — LCARS-HA-Web · **Project LaForge**

> **⚠ MODEL HANDOFF IN EFFECT (2026-07-06): read `HANDOFF.md` FIRST.** It is the
> successor primer — current state, locked decisions, gotchas, protection rules.
> Milestone tag `v1.0-fable` = guaranteed-good state; revert = `git reset --hard v1.0-fable`.

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
- **RENDERER v0.1 BUILT + VERIFIED (same session):** `laforge/lcars.js` + `laforge/main.html`.
  - lcars.js: createRadiusPath ported VERBATIM from ha-lcars-panel SVGUtils.ts (rect shapes,
    convex `radX*` / concave `radXInner*` corners, caps) + the LOCKED §7 elbow path + a grid
    engine: `place()` snaps everything to 0.25u and is the ONLY positioning path; seams
    (0.18u, off-grid by design) are carved INSIDE snapped slots via `seam:{left,...}`.
  - Debug grid overlay on **G key** — visually verified: headers/panels/rail all on 1u lines,
    cluster gaps exactly 0.5u. Elbow junctions zoom-verified flush top + bottom.
  - Screen is ALWAYS exactly 50u wide (`u = clientWidth/50`, ha-lcars-panel convention) —
    resolution independence by definition. Height snaps to grid.
  - Glance Grid main renders the locked design: frame (elbow arm IS the top bar / rail),
    identity, flavor numbers, 6 mock clusters. Mock data — HA wiring is Phase 2.
- **GIT GOTCHAS (this repo):** it's a SPARSE CHECKOUT (72%) — new top-level dirs are NOT
  addable with plain `git add`; use `git add --sparse <files>` (plain add fails SILENTLY).
  Also: whole repo shows CRLF churn in `git status` (Drive/autocrlf) — commit only
  session files, never `git add -A`. Sandbox bash can't take git index.lock on the Drive
  mount — run git via Windows PowerShell on Zeke instead.
- Committed + pushed: 5330a0a (design lock + sketches), 6987afd (laforge/ renderer).
- **v0.2 SHIPPED same session (commit 83cd291, pushed): tap-through + animations.**
  - `laforge/app.js`: SPA — main (Glance Grid) ↔ 6 group workspaces (Option-2 pattern).
    Content-wipe nav (110ms out / 160ms in — TNG screens cut, they don't dissolve).
    ONE mock `DATA` object feeds all screens → state survives navigation (verified:
    dragged FOYER 45→80 in LIGHTS workspace, main cluster showed 80 on return).
    Phase 2 = swap DATA for HA websocket state; views are already dumb.
  - Subscreen nav row: white MAIN pill (structural chrome, NOT a category color —
    avoids double-HOME confusion) + 6 group pills, inactive ones breathe.
  - Animations (§8 discipline — every element own random duration+delay, no sync):
    breathe(), digits() live flavor-number streams, camera scan sweeps (per-cam tempo),
    CORE gauge drift (random walk), onTap brightness flash (60ms in / 180ms out).
  - LIGHTS workspace: DRAGGABLE vertical transporter dimmers (pointer capture,
    tap-to-set works too). Handler is where light.turn_on brightness call goes in Phase 2.
  - GOTCHA: template values must Math.round() — drifting floats leak into re-renders.
  - Verified by driving Chrome: main → LIGHTS → slider set → MAIN, all junctions clean.
- **SESSION-END FEEDBACK (Patrick, 2026-07-03) — v0.3 spec, see LAFORGE_DESIGN.md backlog:**
  Loved: nav flow, content wipe, flavor digits, detail level ("Bravo"). Adjustments:
  (1) SYSTEMS rail button → UI config panel (palette TNG/DS9/VOY, ambient sounds,
  voice-interface settings); (2) MODE rail button → voice-interface MIC MUTE (ignore +
  stop caching audio; button goes inactive-color + breathing while muted); (3) ALL
  settings persist through restarts (localStorage now, HA helpers Phase 2);
  (4) NAV CHANGE: hub-and-spoke — Main↔subscreen only, drop group-to-group pills;
  subscreen top section becomes flavor + screen-specific nav; (5) screensaver = dim +
  spinning Federation logo (FedSign.gif already catalogued, or find cleaner asset).
  Stretch goals recorded in LAFORGE_DESIGN.md: star maps/solar system embeds, Windy,
  sea levels/moon phases, flight radar, traffic cams — cool + embeddable + thematic.
- **v0.3a SHIPPED (commit 25a48aa, pushed):** hub-and-spoke nav (subscreens = MAIN +
  screen-local views only; `local:` arrays on GROUPS) · persistent settings store
  (`LCARS.settings`, localStorage key `laforge-settings`) · era palettes TNG/DS9/VOY
  (role tables in `LCARS.PALETTES`, applied via `setPalette()` + CSS vars `--c-*`;
  content CSS uses the vars so panels re-skin too) · SYSTEMS rail button → terminal
  config screen (palette picker applies instantly, ambient/beeps flags, voice readout:
  wake word COMPUTER, voice MAJEL) · MODE rail button → mic mute (idle lilac + breathe,
  label MIC MUTED; also toggleable from SYSTEMS screen). ALL VERIFIED incl. restart
  persistence (reload boots in VOY + muted). Chrome gotcha: if extension disconnected,
  Chrome may be fully closed — launch via PowerShell `Start-Process chrome.exe <url>`.
- **v0.3b SHIPPED (commits e6c700c + 9e7ffd9, pushed):** screensaver (idle `ssMinutes`
  setting default 5, dim → spinning Fed seal + clock, tap wakes, S = dev toggle;
  FedSign.gif downloaded LOCALLY to laforge/assets/ w/ Patrick approval — lcars.org.uk
  SSL is broken, https hotlink fails, http works; text fallback retained) ·
  **SPOKE MAP v1** in LAFORGE_DESIGN.md (every group's local views + entities; future
  ASTROMETRICS spoke noted) · **MSD floor plan** live in HOME workspace — data-driven
  `laforge/floorplan.js` (decks + exterior band, rooms w/ entity lists, pulsing category
  dots, tap targets ready for Phase-2 room popups).
- **SCREENSAVER MEDIA LADDER (commit 87a1cf2):** saver prefers `laforge/assets/ufp_spin.mp4`
  → falls back to local FedSign.gif → text. Patrick found a 3D UFP spin render he wants
  (YouTube xQPE5jLGdDI); HE downloads it himself (yt-dlp) into laforge/assets/ as
  ufp_spin.mp4 — Claude doesn't rip YouTube. Preflight HEAD checks, not media error
  events (video 404s hang forever on python http.server, error never fires).
- **FLOOR PLAN DECISION (Patrick):** Sweet Home 3D route — he draws the real plan,
  exports SVG, drops it in `laforge/assets/`; we integrate as the MSD base layer and
  keep floorplan.js as the overlay data (dots/tap zones). DRAFT layout in floorplan.js
  is guessed from entities (deck1: living/foyer/kitchen/downstairs; deck2: bedroom P /
  Izzy / bath; exterior: front door/backyard) — awaiting his SVG.
- **v0.3c BOOT SEQUENCE SHIPPED (commit 8168194):** first-load choreography — top bar
  sweeps L→R, rail top→bottom, console closes frame, typed "LCARS COMPUTER ACCESS
  47-2210" / "COMMAND INTERFACE READY · ONLINE", content populates in reading order
  (~2.8s). Delays derive from data-ux/uy grid coords (no tagging). ANY tap skips.
  **B key replays the boot** (dev/testing + FILMING the intro for YouTube).
  GOTCHA (cost a debug cycle): background tabs clamp setInterval to 1s — typing must
  derive char-count from performance.now(), never tick count, or it desyncs from
  WAAPI animations (which keep wall time). Foreground/kiosk tabs unaffected.
- **AUTHENTICITY RESOURCE (Patrick, 2026-07-04): thelcars.com** — pure HTML/CSS LCARS
  template. Harvested their 26 canonical named colors (table in UI_STANDARDS §3) →
  new **`classic` palette** (commit 3b955b0), 4th option in SYSTEMS picker. Their values
  are punchier than our video-sampled tng (compression mutes saturation) — Patrick
  eyeballed CLASSIC live and it reads notably more show-accurate. Trust classic values
  for future roles. Site also has responsive pure-CSS techniques worth revisiting for
  the Lit port. VALUES only — never copy their CSS.
- **CACHE GOTCHA:** Chrome caches lcars.js/app.js across sessions — after editing,
  hard-reload (ctrl+shift+r) or the page runs STALE code (symptom: new palette/feature
  silently missing, setPalette falls back to tng). Version the script tags before
  kiosk deployment.
- **PHASE 2 LIVE (commit 683f791): the terminal talks to Jarvis.** `laforge/ha.js` =
  websocket client (long-lived token via GITIGNORED `laforge/config.local.js` — token
  from _system/credentials/secrets.yaml, exp 2036). One-way flow: states → sync() →
  DATA → views. Full render deferred past boot sequence (`bootUntil`); state_changed →
  targeted patchLive. Auto-reconnect 5s. Top bar tri-state: ONLINE/OFFLINE/SIMULATED
  (no config = mock mode, dev off-LAN works).
  - LIVE READS: weather.forecast_home (real fog verified), sun times (UTC→local fix
    required), sensor.fred_* (cpu %, ram MiB→GB — **total ASSUMED 32GiB in ha.js,
    Patrick verify**), Echo media_player states + volumes, alert mode, flood state.
  - LIVE CONTROLS (wired, NOT test-fired — Patrick taps first): BACKYARD FLOOD →
    light.toggle; ALERTS view → input_select.lcards_alert_mode (red/yellow/green).
    Service path PROVEN via harmless no-op (set alert to current value → success).
  - Entity gotchas: fred_ram_used is MiB not %; fred_alarms state is 'ok' not '0';
    sun sensors are UTC ISO timestamps.
- **ALERT VISUALS (commit f446761) — the "anticlimactic red alert" fix:** Patrick's
  red-alert tap DID work (state changed in HA); the terminal just had no visualization.
  Now: `redalert`/`yellowalert` SYSTEM palettes (hue-shift everything, never persisted)
  + pulsing vignette (1.4s klaxon cadence). ha.js onAlert hook → ANY alert-mode change
  (button/automation/siren) recolors the terminal live. Full loop verified both ways
  (RED via state → visuals; STAND DOWN via UI button → green + palette restore).
  Flood light confirmed REALLY toggled by his tap (was ON: 4/5 lights, BACKYD 100).
  ⚠️ FILE-WRITE RULE (cost a rebuild): NEVER mix sandbox-mount bash writes (sed -i)
  with file-tool writes on the same file — main.html got truncated mid-line by the
  race. One write path per file, always. Scripts now ?v=3.
- **SCIENCE PAGE designed + mocked (commit c38f793) — DECISIONS LOCKED:** CLIMATE spoke
  becomes SCIENCE (lilac): ATMOS (weather, existing) / SURVEY (Windy official embed —
  verified live) / ORBITAL (NATIVE solar system — JPL Keplerian math real-time +
  computed moon phase w/ SVG terminator — verified, gorgeous) / GEO (**CesiumJS 3D
  globe from the start** — CDN + Esri imagery provider, NO ion token; Leaflet 2D is
  the perf fallback, mock proves it). ORBITAL detail: tap planet → **NASA Eyes iframe
  popup** (viewscreen treatment). Embed rule: 3 tiers, native > JS lib > sanctioned
  iframe w/ bezel; NO new tabs ever. Coords from HA zone.home (mock guessed Cincinnati).
  Mock: laforge/science_mock.html (4 views switchable).
- **CAMERA LIVE FEEDS (commit 49e2669, 2026-07-09) — hardest roadmap item DONE:**
  `HA.signPath()` (auth/sign_path ws command) mints short-lived signed camera_proxy
  URLs — the standard answer to "img tags can't send Bearer tokens." SECURITY·CAMERAS =
  3 live panels @5s + live activity stamps + tap→viewscreen popup @2s (interval cleaned
  by viewscreen's new onClose hook). Main SECURITY cluster thumbs @10s. VERIFIED all
  3 cameras at 1920×1080. Upgrade path noted: HLS via `camera/stream` ws command +
  hls.js if stills feel choppy on the kiosk (stills chosen first: robust, cheap).
  NOTE: dev server on port 8000 does NOT survive Zeke reboots — restart per HANDOFF
  runbook (symptom: page loads but title is 'localhost', no scripts defined).
- **UI FUNCTIONALITY SPRINT (2026-07-09, commits 29b2e8f + ab54194):**
  MSD ROOM POPUPS — floor-plan rooms are tap targets → live entity panel (per-domain:
  TOGGLE for light/switch, 2-tap CONFIRM for sirens, OPEN FEED chains to camera
  viewscreen, volume readouts; wildcards expand from HA.states). VERIFIED (DOWNSTAIRS).
  REAL 5-DAY FORECAST — ha.js fetchForecast() via weather.get_forecasts +
  return_response (attributes removed in modern HA), condition→LCARS label map,
  30-min refresh. LIVE cats/litter (HOME·ROUTINES, numeric states rounded) +
  update.* enumeration (CORE·UPDATES, 19 entities).
  ON_FEELING.md written at Patrick's request (re: HANDOFF's closing line).
  **DEPLOYMENT ORDER (Patrick):** UI functionality first → THEN Fred deploy.
  Post-deploy backlog: real floor-plan layout (Sweet Home 3D), Majel voice, HOLODECK.
  Remaining pre-deploy UI: interactive MEDIA volume sliders, LIGHTS scenes (needs HA
  scenes — Patrick side), general polish pass.
- **VIEWSCREEN POPUP RESKIN (commit f2578da) — UI_STANDARDS §9 LOCKED:** popups are
  TRUE LCARS mini-frames per Patrick's Stellar Cartography reference (1.25u segmented
  rail, 0.9u title bar, 0.5u bottom bar, 1u outer sweeps, 0.5u concave webs, open right
  side, salmon cap CLOSE). Context colors: salmon=security, peri=rooms, lilac=science.
  Palette-role based → alerts recolor open popups. VERIFIED on live night cam feed.
- **ENVIRONMENTAL SPOKE BUILT (2026-07-10, green-lit by Patrick re-requesting):**
  LIGHTS retired → ENVIRONMENTAL (canary, same slot, 3×2 intact). Views: LIGHTING
  (ex-LIGHTS·ALL, dimmers/switches/flood), ATMOSPHERE (climate standby + LIVE cold
  storage: fridge/freezer temps, power draw — refrigerator sensors), SHUTTERS (standby,
  awaiting cover.*), SCENES. INTERIOR/EXTERIOR mock views dropped (were filters).
  Main cluster: 3 dimmer bars + cold-storage line. VERIFIED live (fridge 37°F/0°F/151W).
  Old localView 'lights' keys orphaned harmlessly. HANDOFF locked-decision #6 updated.
- **SESSION PAUSE (2026-07-09, Patrick at limit).** RESUME AT: interactive MEDIA volume
  sliders (drag → media_player.volume_set / number.set_value, reuse dimmer drag code) →
  full shakedown pass (walk every screen/view hunting rough edges) → THEN declare
  deployable → Fred serving-origin decision + deploy + kiosk Cesium perf test.
  Post-deploy backlog: floor plan SVG, Majel voice, HOLODECK, sound pack.
- **AUTONOMOUS SESSION 2026-07-11 (Patrick-directed, no check-ins; full record in
  HOLODECK_BUILD_LOG.md):** backup tag `v1.1-pre-holodeck` → SmartThings states
  (TV 85" LIVE incl. MEDIA row + ATMOSPHERE panel; fridge doors/filter/energy LIVE —
  FILTER AT 100%, REPLACE; Bespoke washer/dryer placeholder, hookup =
  DATA.appliances.washer) → **HOLODECK v1 SHIPPED** (commits 67e0f81 + 289510b):
  gold rail button on all rails; TRANSPORTER (energize sequence + shimmer synth +
  script.laforge_transporter_fx hook); WARP CORE (pulsing shaft, eject/recover/vent/
  realign, BREACH GAME: 4 incidents / 20s / wrong = −5s / timeout = SHIP LOST, local
  red wash only); MSD (Ent-D + Defiant SVG elevations, tappable systems → gold
  popups; 3 ships in drafting queue); TACTICAL (starfield, phaser/torpedo anims);
  sfx.js WebAudio synthesis w/ assets/sfx/*.mp3 override path. Verified live —
  Patrick was flying the consoles himself before the build was even committed.
- **KIOSK HARDWARE (Patrick, 2026-07-04):** Surface Pro 4 — containerized/isolated
  Win10 OR compatible Linux distro. GPU = Intel HD 520 (Skylake iGPU): CesiumJS-capable
  at panel res, but budget it — `requestRenderMode:true` (render on demand), resolution
  scale ≤1, high maximumScreenSpaceError, lazy-load Cesium only when GEO view opens.
- **NEXT SESSION:** implement SCIENCE spoke for real (rename + 4 views + Cesium +
  planet-tap NASA Eyes popups) → remaining reads (cameras last-activity, litter robot,
  updates, network) → camera live feeds (camera_proxy/stream) → MSD room popups →
  serving-origin decision + Fred deploy → RED ALERT filming session for the channel →
  wire remaining reads (cameras last-activity, litter robot, updates, network sensors)
  → camera live feeds (camera_proxy/stream) → MSD room popups → serving-origin decision
  + Fred deploy. (Superseded: local-view pills — DONE v0.4.)
  CAMERAS/PERIMETER/ALERTS per spoke map) → remaining workspaces → Phase 2 HA wiring →
  floor plan SVG integration when Patrick's Sweet Home 3D export arrives → Lit port.
  Patrick still to supply: assets/ufp_spin.mp4 (yt-dlp one-liner given). Stretch queue:
  Windy embed (CLIMATE·SURVEY), ASTROMETRICS spoke (7th cluster = grid decision).

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