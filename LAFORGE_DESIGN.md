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

## v0.3 BACKLOG — Patrick's feedback on v0.2 (2026-07-03, session end)
**Confirmed working/loved:** nav flow, content wipe, flavor-digit streams, overall detail
level. Direction is correct — keep going exactly like this.

1. **SYSTEMS button (left rail) = UI CONFIGURATION panel.** Everything that configures the
   INTERFACE itself: color palette selection (**TNG / DS9 / VOY**), ambient sounds on/off,
   computer voice interface settings, other UI-specific options.
2. **MODE button (left rail) = MIC MUTE for the voice interface.** Not a power-off: ignore
   all audio + stop caching it. When muted: button switches to the palette's INACTIVE color
   and starts the breathing animation (the visual language for "present but not listening").
3. **ALL settings persistent through restarts.** Prototype: localStorage. Phase 2: mirror to
   HA helpers so any terminal/browser shares the same config.
4. **Nav model change — hub-and-spoke (implement next session):** Main → subscreen and
   subscreen → Main ONLY. Remove the group-to-group pill row from subscreens. Frees the
   subscreen top section for flavor + screen-specific functional nav (e.g. LIGHTS gets
   room/scene selectors up top instead of six global pills).
5. **Screensaver:** dim out → spinning Federation logo. Asset candidate already catalogued:
   `FedSign.gif` (lcars.org.uk CDN, "large spinning Federation logo") — or find a cleaner
   gif/mp4. Any tap wakes.

## SPOKE MAP v1 (2026-07-03) — every feature has an address
Hub-and-spoke: MAIN glances everything; each spoke = one group subscreen with
LOCAL VIEWS (its top pill row). Format: **VIEW — features (entities today → later)**.

### LIGHTS (canary)
- **ALL** — every fixture: dimmer columns + switch pills (light.backyard_light → TP-Link/Tuya dimmers)
- **INTERIOR** — living/foyer/kitchen/bedroom fixtures (Alexa-only today → HA dimmers)
- **EXTERIOR** — backyard flood + future porch/landscape
- **SCENES** — EVENING / MOVIE / ALL OFF / GOODNIGHT (build as HA scenes in Phase 2)

### SECURITY (salmon)
- **CAMERAS** — 3 live feeds large + last-activity timestamps (camera.*, sensor.*_last_activity)
- **PERIMETER** — motion-detect toggles, sirens, flood-as-deterrent (switch.*_motion_detection, siren.*)
- **ALERTS** — alert-mode control (manual RED ALERT / STAND DOWN), siren automation status, event log

### CLIMATE (lilac)
- **CURRENT** — temp/condition/humidity/UV, sunrise/sunset (weather.forecast_home, sun.*)
- **FORECAST** — hourly + 5-day columns
- **SURVEY** — "planetary survey": Windy embed, radar · stretch: sea levels, moon phase

### MEDIA (magenta)
- **PLAYERS** — 4 Echoes: now playing, play/pause, per-device volume (media_player.*)
- **ANNOUNCE** — ship-wide + per-room TTS announcements (→ Majel voice when TTS lab lands)
- **VOLUME** — master audio + all device sliders in one place (number.*_volume)

### HOME (peri)
- **MSD** — the floor plan (floorplan.js). Rooms tap → room popup w/ that room's entities. THE flagship view.
- **CALENDAR** — next events, day strip (Google Calendar via HA)
- **ROUTINES** — Alexa routine buttons (good night / I'm home / kick off my day) + cats & litter status

### CORE (peach)
- **FRED** — CPU/RAM/load/disk/alarms gauges (sensor.fred_*)
- **NETWORK** — WAN status/IP/speeds (arris sensors) → ntopng top-talkers later
- **UPDATES** — HA core/addon/HACS update entities + backup status

### SCIENCE PAGE DESIGN (2026-07-04 — Patrick: "embedded is the focus")
PROPOSAL: CLIMATE spoke grows into **SCIENCE** (lilac). Weather becomes one view.
Hard rule: everything renders IN the UI — no new tabs, ever.

**Embed strategy, three tiers (prefer lower number):**
1. **NATIVE** (our renderer, perfect LCARS): ORBITAL solar-system map — planet
   positions computed locally (JPL approximate Keplerian elements, arcminute-class),
   drawn top-down in palette colors (the intro2 "orbital scan" made real).
   MOON phase — computed (synodic epoch math) + SVG terminator shading,
   illumination %, next full/new.
2. **JS LIBRARY** (integrated, chromeless, stylable): GEO earth view — Leaflet +
   Esri World Imagery (free, dark, light on kiosk). Upgrade path: CesiumJS 3D globe
   (true Google-Earth feel, WebGL-heavy — decide after kiosk perf test).
3. **SANCTIONED IFRAME** (dark-themed + LCARS bezel): SURVEY — Windy official embed
   (embed.windy.com, radar/wind/temp overlays). Alt/extra: NASA Eyes on the Solar
   System iframe as a live ORBITAL alternative.
   Iframes get the "viewscreen" treatment: LCARS header bar + thin inset bezel —
   framed like a sensor feed, not a webpage.

**Views (4 pills):**
- **ATMOS** — current conditions + 5-day (live HA weather) — existing CURRENT+FORECAST merged
- **SURVEY** — Windy embed full-panel + HA readout column (humidity/wind/pressure)
- **ORBITAL** — native solar system map (left ⅔) + moon phase panel + planet readout (right ⅓)
- **GEO** — satellite earth full-panel + data column (lat/lon target, ISS position via
  wheretheiss.at open API — stretch)
Mock: `laforge/science_mock.html` (real embeds inside the real frame — all three
tiers verified live 2026-07-04).

**DECISIONS LOCKED (Patrick, 2026-07-04):**
1. **CLIMATE → SCIENCE.** One lilac science station; weather = ATMOS view.
2. **GEO = CesiumJS 3D globe from the start.** Full spinning-earth feel. Use CDN
   CesiumJS + Esri ArcGIS imagery provider (NO ion token needed). Perf-validate on
   the kiosk; Leaflet 2D remains the documented fallback if the wall panel chokes.
3. **ORBITAL = native LCARS render as the main view + NASA Eyes iframe as the
   DETAIL POPUP** — tap a planet on our map → "viewscreen" popup with JPL's
   photoreal 3D locked to that body. Best of both: authentic chrome, real science
   on demand.
4. Coordinates come from HA `zone.home` (mock used guessed Cincinnati coords).

### ENVIRONMENTAL SPOKE (Patrick 2026-07-09 — **BUILT 2026-07-10, green-lit**)
**The plan:** LIGHTS is absorbed into a new **ENVIRONMENTAL** spoke (canary, same
cluster slot — the sacred 3×2 survives). Thematic split: **SCIENCE observes the
environment, ENVIRONMENTAL controls it.** Canon rationale: starships have
Environmental Control; they don't have a "lights station."

**Views (4 pills):**
- **LIGHTING** — the current LIGHTS·ALL workspace (dimmers, switches, flood)
- **ATMOSPHERE** — AC/heat/thermostat control (STANDBY until climate entities exist)
  + COLD STORAGE live (refrigerator fridge/freezer temps — real sensors, life-support
  flavor)
- **SHUTTERS** — blinds/covers (STANDBY until cover.* entities exist)
- **SCENES** — lighting/environment scenes (needs HA scenes — Patrick side)

**Functionality migration:** LIGHTS spoke retires (all content → LIGHTING view);
future thermostat that would have gone to SCIENCE·ATMOS goes HERE instead (ATMOS
stays weather-observation only); fridge temps leave CORE flavor for ATMOSPHERE.
Badge: lights-on count (later: inside temp once a thermostat exists).
Implementation note: ~30-minute change (GROUPS entry, badge key, clusterBody case,
4 workspace cases) — a first pass was built and cleanly reverted 2026-07-09
(Patrick: log only for now); this section is the spec for when he green-lights it.

### HOLODECK SPOKE (proposed name — Patrick's "prop spoke", captured 2026-07-04)
**Status: BLUE SKY — build AFTER functional pieces. This section is the idea vault.**
Authentic LCARS consoles + displays that are interactive **for fun** — theatric, not
functional. May trigger REAL room effects (HA lighting routines, audio, IoT props)
but control nothing that matters. The room becomes the set.

**Console concepts (Patrick's list):**
- **TRANSPORTER ROOM** — pad console; energize dims the room lights, runs a
  transporter color routine on the RGB fixtures, plays the shimmer audio.
- **SHIP MSDs** — interactive cutaway diagrams: Enterprise-D, Defiant, Excelsior,
  DS9, Voyager. Tap systems for status readouts/flavor.
- **MAIN ENGINEERING / WARP CORE** — the crown jewel. Interactive core with:
  eject core / recover core, matter–antimatter flow adjustment, dilithium matrix
  realignment, warp plasma venting.
  **CORE BREACH GAME:** button press → random situation + countdown timer → perform
  the CORRECT action sequence or "lose the ship." Full room lights + sound design.
  IoT props for physical effects — e.g., a vapor blast = coolant leak.
- **CONN / FLIGHT CONTROLS** — helm console, course plotting theater.
- **TACTICAL / WEAPONS** — phaser/torpedo console, lock + fire theater.

**Architecture notes (so future-us starts smart):**
- Each console = a workspace under the HOLODECK spoke; room effects = HA scenes +
  scripts triggered via the existing HA.call() path (lights/audio already wired).
- The breach game = state machine + countdown (boot-sequence timing patterns reuse).
- Audio: sound-pack hooks already stubbed (SYSTEMS → beeps/ambient flags).
- MSD ship diagrams: SVG cutaways, same okudagram language as the house MSD.
- 7th cluster on main = the grid decision (or HOLODECK lives behind a rail button
  like SYSTEMS, keeping the 3×2 sacred — probably THE answer: it's not home ops).

### Future spokes (post-v1, layout decision needed — 7th cluster changes the 3×2 grid)
- **ASTROMETRICS** (chetwode?) — star maps / solar system embeds, flight radar, traffic cams
- SYSTEMS is NOT a spoke — it's terminal chrome (rail button), config only.

## DEPLOYMENT TARGET (Patrick, 2026-07-04): Fred's webstack
The terminal ultimately ships to Fred (Proxmox host, 10.0.0.x). Organizational rules:

1. **`laforge/` stays a self-contained static bundle** — relative paths only (already
   true: main.html + lcars.js + floorplan.js + app.js + assets/). Deploy = copy the folder.
2. **Serving options** (decide at deploy time):
   - nginx/caddy container via Portainer (10.0.0.77) — clean, versioned, independent of HA
   - HA `/config/www/` → served at `http://10.0.0.149:8123/local/laforge/` — zero new infra,
     same-origin with the HA websocket (simplifies Phase-2 auth/CORS)
3. **Cache-bust before deploy:** version the script tags (`lcars.js?v=N`) — the stale-cache
   gotcha will bite kiosks hard otherwise.
4. **Phase-2 auth note:** if served OUTSIDE HA (nginx), the websocket to 10.0.0.149:8123
   needs the long-lived token (secrets.yaml) + CORS config; if served from HA /local/,
   auth can piggyback on the HA session. Weigh at wiring time.
5. Git repo stays the source of truth; Fred gets deploy copies, never edits.

## STRETCH GOALS (recorded 2026-07-03 — thematically appropriate embeds)
- Live **star maps / solar system state** from real astronomy databases — interactive and
  embedded preferred (candidates to research: NASA Eyes on the Solar System embed,
  Stellarium Web, Aladin Lite sky atlas).
- **Windy embed** as "planetary survey data" (Science/CLIMATE screen).
- **Sea levels, moon phases** (NOAA tides API; moon phase = easy compute or API).
- **Airplane maps** (flight radar — ADS-B; candidates: FlightRadar24 embed, adsb.fi,
  or a local ADS-B receiver on Fred someday).
- **Traffic cameras** (state DOT public cams).
- Standing rule: anything else that is cool, embeddable, and thematically appropriate —
  collect candidates as found.
