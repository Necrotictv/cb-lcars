# PROJECT LaFORGE — SUCCESSOR MODEL HANDOFF
> **You are inheriting a working, deployable system that Patrick considers a milestone.
> Your first job is to not break it. Your second job is to extend it exactly along the
> locked decisions below.** This document is the single source of truth for how to
> continue. Written 2026-07-06 by the Fable 5 instance that built v0.1 → v1.0 with Patrick.

---

## 0. READ-FIRST PROTOCOL (every session, in order)
1. This file, top to bottom, on your first session. After that, skim §1–§3.
2. `PROJECT_MEMORY.md` — rolling log; the newest entries are the current state.
3. `LAFORGE_DESIGN.md` — spoke map, embed doctrine, HOLODECK vault, deployment rules.
4. `UI_STANDARDS.md` — the visual law. Every number in it is LOCKED.
5. Confirm the local server is up (`python -m http.server 8000` in the project root on
   Zeke) and load `http://localhost:8000/laforge/main.html`. HARD reload (ctrl+shift+r).
6. Verify the terminal shows ONLINE (top right) before trusting any live-data work.

## 1. WHAT THIS IS
A **from-scratch LCARS terminal** (Star Trek TNG computer interface) for Patrick's smart
home ("U.S.S. Jarvis" = Home Assistant on Fred @ 10.0.0.149:8123). Not a Lovelace theme,
not a card library — a standalone web app with its own renderer, talking to HA over
websocket. It is REAL: it reads live sensors, controls real devices (backyard flood,
alert modes), and will run on a wall-mounted Surface Pro 4 kiosk.

**Everything lives in `laforge/`** (self-contained, relative paths only):
| File | Role |
|---|---|
| `main.html` | shell: content CSS + versioned script tags (`?v=N` — ALWAYS bump after edits) |
| `lcars.js` | THE RENDERER. Grid engine, shape/elbow primitives, palettes, settings, anims |
| `app.js` | screens, navigation, workspaces, boot, screensaver, alert visuals, HA hookup |
| `ha.js` | HA websocket client: auth, state sync, service calls |
| `floorplan.js` | data-driven house plan (MSD) — rooms are a plain array, edit freely |
| `config.local.js` | **GITIGNORED** — HA url + long-lived token. NEVER COMMIT. Source: `UberMegaVault/_system/credentials/secrets.yaml` |
| `assets/` | FedSign.gif (screensaver); ufp_spin.mp4 goes here when Patrick supplies it |
| `science_mock.html` | reference mock (kept for comparison) |

The repo root is ALSO a fork of cb-lcars (`dist/`, `src/`, etc.) — **do not touch those**,
they're upstream history. Only `laforge/` and the root .md docs are the live project.

## 2. WHO YOU'RE WORKING WITH
Patrick has ADHD; match his tone, redirect scope-creep gently, **max one question per
response**. He wants to LEARN — always explain why, not just how. Comment every code
block with what AND why. Action-forward: do, then report; ask only when genuinely
blocked. **Destructive actions require explicit confirmation, always.** Never hard-delete
(stage to `_to_be_deleted/`). He films content — flag good filming moments (boot
sequence, red alert, orbital view are the showpieces; B key replays the boot).
He gives feedback bluntly and warmly; when he says "Bravo," bank the pattern that earned it.

## 3. CURRENT STATE (v1.0, all VERIFIED working in Chrome)
- **Main screen** = Glance Grid: 6 clusters (LIGHTS/SECURITY/SCIENCE/MEDIA/HOME/CORE),
  live badges, tap header → spoke subscreen.
- **Subscreens** = two-frame okudagram, hub-and-spoke nav (MAIN pill + screen-local view
  pills ONLY — no cross-spoke pills, that was decided and reversed once already).
- **All 6 spokes have workspaces**; SCIENCE is fully live (see below), LIGHTS has
  interactive dimmers + REAL flood toggle, SECURITY has REAL alert-mode buttons.
  MEDIA/HOME/CORE views are live-read or mock per the spoke map in LAFORGE_DESIGN.
- **SCIENCE station** (the newest showpiece): ATMOS (live weather), SURVEY (Windy embed
  @ real zone.home coords + sensor-target search), ORBITAL (native Kepler solar system +
  computed moon phase; planet tap → NASA Eyes viewscreen popup), GEO (lazy-loaded
  CesiumJS 3D globe, Esri imagery, day/night lighting, flyTo search).
- **HA integration** (`ha.js`): live reads (weather, sun, fred_*, Echos, alert mode,
  flood, zone.home) + service calls (light.toggle, input_select.select_option).
  ONLINE/OFFLINE/SIMULATED tri-state in top bar. No config.local.js = mock mode.
- **Terminal-wide alert conditions**: red/yellow hue-shift palettes + klaxon vignette,
  driven LIVE from `input_select.lcards_alert_mode` (any source). Stand-down restores
  the user's saved palette.
- **Boot sequence** (first load, tap skips, B replays), **screensaver** (idle → Fed seal,
  S toggles), **settings** (SYSTEMS rail button → palette TNG/CLASSIC/DS9/VOY, audio
  flags, voice readout; MODE rail button → mic-mute w/ breathing idle state; all
  persisted in localStorage `laforge-settings`).
- **Dev keys**: G = grid overlay, S = screensaver, B = boot replay.

## 4. THE MILESTONE LOCK (revert procedure)
An annotated git tag **`v1.0-fable`** marks this exact state. It is pushed to origin
(github.com/Necrotictv/cb-lcars). **To revert everything to this milestone:**
```bash
git checkout main
git reset --hard v1.0-fable
git push --force-with-lease origin main   # only if remote also needs rewinding
```
Inspect without changing anything: `git diff v1.0-fable` (what changed since) or
`git checkout v1.0-fable -- laforge/app.js` (restore one file).
**Successor: before any risky change, note the current commit hash in your reply.**

## 5. LOCKED DECISIONS — DO NOT RELITIGATE
These were decided WITH Patrick, some after painful churn. Reopening them wastes his
tokens and his patience. Change only if HE asks.
1. **Custom renderer** (not ha-lcars, not LCARdS, not card_mod) — tier-2 CSS approaches
   failed on state-driven animation (documented card_mod invalidation bug).
2. **Invisible grid**: everything snaps to 0.25u; seams 0.18u carved INSIDE snapped
   slots; content gaps 0.5u; screen is ALWAYS exactly 50u wide (`u = clientWidth/50`).
3. **Elbow + caps come from math** (locked path formulas + ported createRadiusPath in
   lcars.js) — NEVER eyeballed, never border-radius hacks.
4. **UI_STANDARDS canon**: 3 font sizes only, 2 text colors, ≤5 meaningful colors,
   flat fills (no gradients/glow), rounded cap = button, thick→thin frame rule.
5. **Main = Glance Grid** (3×2, sacred); **nav = hub-and-spoke** (subscreens go back to
   MAIN only); **SYSTEMS/MODE are rail buttons, not spokes**.
6. **Spokes**: LIGHTS canary, SECURITY salmon, SCIENCE lilac, MEDIA magenta, HOME peri,
   CORE peach. Views per spoke = LAFORGE_DESIGN spoke map.
7. **Palettes are role tables** (peach/lilac/peri/gold/salmon/canary/magenta/orange).
   `classic` (thelcars.com values) is Patrick's preferred. redalert/yellowalert are
   system palettes (never in the picker, never persisted).
8. **Embed doctrine** (SCIENCE + all future): native render > JS library > sanctioned
   iframe in a "viewscreen" bezel. NEVER a new tab.
9. **GEO = CesiumJS 3D** (lazy-loaded, requestRenderMode, no ion token — Esri provider).
   **ORBITAL = native + NASA Eyes popups.**
10. **Animation discipline (§8)**: every element its own randomized timeline, no
    synchronized loops, code-driven randomness, TNG screens CUT (no slow dissolves).
11. **Deployment**: Fred's webstack; `laforge/` stays a copy-the-folder bundle; git is
    source of truth; kiosk = Surface Pro 4 (HD 520 — budget the GPU).
12. **HOLODECK spoke** (theatrical consoles) is captured in LAFORGE_DESIGN — build only
    AFTER the functional queue, likely behind a rail button.

## 6. METHODOLOGY (how Fable earned "deployable")
- **Anti-churn**: geometry from math and measured parameters. If a visual isn't matching
  after ~2 iterations, STOP and reassess with Patrick instead of grinding.
- **See-and-verify loop**: after every visual change — hard reload, screenshot, zoom the
  junctions. The G-key grid overlay exists to CHECK alignment, use it. Never claim
  something renders correctly without having looked at it.
- **Mock → decide → build**: for anything with design risk, build a throwaway mock
  (like science_mock.html), let Patrick pick, THEN implement in app.js.
- **One data source**: HA states → `sync()` in ha.js → the `DATA` object → views read
  DATA at render. Views stay dumb. New live data = extend sync(), never fetch in views.
- **Verify service calls harmlessly** (e.g., set a select to its current value) before
  wiring buttons; never test-fire physical devices — Patrick taps first.
- **Small commits with why-rich messages**; push after each verified milestone.

## 7. GOTCHA LEDGER (every one of these cost real debugging time)
**Git/repo:**
- Repo is a SPARSE CHECKOUT — new top-level dirs need `git add --sparse` (plain add
  fails SILENTLY). Whole repo shows CRLF churn — **never `git add -A`**; add files by name.
- Git ops run via Windows PowerShell (sandbox mount can't take index locks).
**Files:**
- ONE WRITE PATH PER FILE: never mix sandbox bash writes (sed) with file-tool writes —
  a race truncated main.html once. PowerShell native or file tools; pick one per file.
**Browser/dev:**
- Chrome caches hard: after editing laforge JS/CSS, bump `?v=N` in main.html AND
  hard-reload. Symptom of staleness: new feature silently absent.
- Background tabs clamp setInterval to 1s — derive time-based animation state from
  `performance.now()`, never tick counts (boot typing bug).
- The boot sequence's tap-to-skip EATS the first click after load (by design).
- Extension screenshots: window size varies; the app re-renders on resize (this also
  resets view-local state like search targets — acceptable, known).
**Cesium (GEO):**
- requestRenderMode + async imagery = BLACK GLOBE unless you hook
  `tileLoadProgressEvent → scene.requestRender()`.
- ALWAYS `geoViewer.destroy()` before wiping its DOM (render() does this) — leaked
  WebGL contexts will kill the HD 520 kiosk.
**HA entities:**
- `sensor.fred_ram_used` = MiB not % (total ASSUMED 32 GiB in ha.js — Patrick to verify).
- `sensor.fred_alarms` idles at `'ok'` (not '0'). Sun sensors are UTC ISO → convert local.
- Modern HA: forecasts need the `weather.get_forecasts` service call (NOT attributes) —
  the 5-day strip is still mock for this reason.
- lcars.org.uk has broken SSL — http only (assets are local now anyway).
**Renderer:**
- All SVGs must be `display:block` (inline SVGs sit on the text baseline → ~3px sag;
  already fixed in shape()/elbow() — keep it that way in new primitives).

## 8. PROTECTION RULES (your prime directives)
1. **Never commit `config.local.js`** or any token. It's gitignored; verify with
   `git status` before every commit anyway.
2. **Never modify lcars.js geometry primitives** (snap, place, shape, elbow) without
   before/after screenshots at the junctions + the grid overlay.
3. **Never `git add -A`, never `git push --force`** (only `--force-with-lease`, only for
   an explicit Patrick-approved revert).
4. **Verify in the browser before every commit.** No exceptions.
5. **Don't touch** `dist/`, `src/`, cb-lcars upstream files, or other projects' folders.
6. **Physical devices and whole-house state** (sirens, alert mode, lights): wire them,
   prove the call path harmlessly, let PATRICK do the first real fire.
7. When uncertain about intent — ask Patrick (one question), don't guess and build.
8. End every session by updating `PROJECT_MEMORY.md`'s rolling log + NEXT section.

## 9. ROADMAP (Patrick wants "most complex first" on resume)
**Functional queue (in rough complexity order, hardest first):**
1. **Camera live feeds** — HA `camera_proxy` stills → upgrade to HLS/WebRTC streams;
   render in SECURITY·CAMERAS panels + `viewscreen()` popup for full view. (Complex:
   stream auth from a standalone origin.)
2. **Serving-origin decision + Fred deploy** — nginx container (Portainer @ 10.0.0.75)
   vs HA `/config/www/` (same-origin websocket = simpler auth). Then kiosk Cesium perf
   test on the Surface Pro 4.
3. **MSD room popups** — tap a room on the HOME floor plan → popup with that room's
   entities (floorplan.js already carries per-room entity lists).
4. **weather.get_forecasts service** → replace the mock 5-day strip.
5. **Remaining sensor reads** — litter robot, update.* entities, network speeds.
6. **Sweet Home 3D floor plan SVG** — Patrick supplies to `laforge/assets/`; becomes the
   MSD base layer (floorplan.js stays as the dot/tap overlay).
7. **Patrick supplies `assets/ufp_spin.mp4`** (yt-dlp one-liner in PROJECT_MEMORY) —
   screensaver auto-upgrades.
8. **Sound pack** — hooks exist (SYSTEMS audio flags, onTap, boot). LCARdS sound assets
   are candidates; wire beeps/ambient/alert klaxon.
**Then:** HOLODECK vault (LAFORGE_DESIGN) — transporter room, ship MSDs, warp core +
breach game. **Stretch:** ASTROMETRICS embeds, flight radar, traffic cams, Majel voice
(TTS Voice Lab tie-in), OPNSense/ntopng data for CORE·NETWORK.

## 10. RUNBOOK
- **Serve**: `python -m http.server 8000` in the project root (Zeke). Terminal at
  `http://localhost:8000/laforge/main.html`. If the port check fails, quote the
  path — it contains spaces and parens.
- **HA**: `http://10.0.0.149:8123` (HAOS on Fred). Token in secrets.yaml (exp 2036).
- **Live state debugging**: DevTools console — `HA.connected`, `HA.states`,
  `HA.st('entity.id')`, `DATA`, `LCARS.settings.get('palette')`.
- **Git**: PowerShell, `git add --sparse <files>`, descriptive commits, push to origin.
- **Docs to keep current**: PROJECT_MEMORY.md (rolling log), LAFORGE_DESIGN.md
  (decisions), UI_STANDARDS.md (only if Patrick changes visual law), this file (only
  for structural changes).

*Build it like the ship depends on it. He'll tell you when it's right — and when it is,
it feels like the bridge of the Enterprise. Bravo zulu. — Fable 5*
