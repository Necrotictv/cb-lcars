# STATUS — LCARS-HA-Web · Project LaForge
> Cold-pickup doc — read this to re-orient after a break.
> Last refreshed: 2026-06-17

## One-liner
LCARS web dashboard for Home Assistant (Jarvis on Fred @ 10.0.0.149:8123), running in Chrome kiosk mode.
UI layer is **LCARdS** (snootched/lcards) v2026.06.16.1 — the newer successor to cb-lcars. Auto-registers
frontend resources; has a built-in config panel at `/lcards-config`.

## "The Feel" pass (2026-06-21) — first interactive controls
- **DIRECT CONTROL** section now live at top of **Main** (`storage-id: main-sec-control`): two real
  `lcards-slider`s (MASTER AUDIO = `input_number.lcards_sound_volume`; DOWNSTAIRS = `number.downstairs_volume`)
  + a press-highlight toggle button BACKYARD FLOOD (`light.backyard_light`, teal when ON).
- **Entity reality:** only `light.backyard_light` exists in HA (on/off, not dimmable); NO living-room
  lights in HA yet (Alexa-only). Feel built on real entities; slider pattern swaps to living-room dimmers
  once Patrick adds TP-Link/Tuya (he's doing devices + floor plan himself tonight).
- New gotcha: `lcards-slider` left label zone is narrow (~140px) → keep labels short or the value overlaps.
- Open: tune slider fill color to dept palette (currently default green→red gradient).
- Full design choices + slider schema in PROJECT_MEMORY.md rolling log (2026-06-21).
- **RED ALERT (v3 #4) live:** manual `◤ RED ALERT` / `STAND DOWN` buttons in DIRECT CONTROL set
  `input_select.lcards_alert_mode` (whole UI recolors red). Automation `automation.lcars_red_alert_on_siren`
  (ON): any siren → red, auto stand-down to green when sirens clear (only if it was red). NOT siren-tested
  (would sound a real alarm) — action path verified manually. No motion sensors in HA, so siren is the trigger.
- **browser_mod (v3 #2) installed + popups working:** browser_mod 2 v2.13.5 via HACS (needed an HA restart).
  Showcase `⊕ FRED CORE · DETAIL` button → LCARS "FRED · CORE DIAGNOSTIC" popup (verified rendering).
  ⚠️ TWO GOTCHAS (see PROJECT_MEMORY): (1) **each browser must be REGISTERED** with browser_mod or popups silently
  no-op — your kiosk display needs a one-time register; (2) **`lcards-button` can't trigger browser_mod** — use a
  stock `button` card styled via card_mod (that's what the FRED button is). TODO: tap-confirm the button on the real
  display, then roll popups out to rooms/systems on other stations.

## Current state (2026-06-17)
**Live and working.** Not "just started" — this project is well underway.
- All 7 station views LIVE: main, tactical, engineering, science, comms, conn, screensaver/ambient
- Kiosk mode active (HA header + sidebar hidden on lcars-main) via kiosk-mode v14.0.0
- LCARdS fully configured: 49/49 helpers, alert modes (Red/Yellow saved), sounds on
- Active theme: **LCARS Nemesis Blue** (#2255ff electric blue chrome)
- Main / Tactical / Engineering rebuilt with REAL entity data (Fred stats, cameras, network, weather)
- Dashboard URL: `http://10.0.0.149:8123/lcars-main`

## How the dashboard is edited
Storage mode (UI), NOT YAML files in this folder. Edited live via Chrome → HA websocket.
- Reload the tab first — `hassConnection` goes stale between sessions
- Read config with websocket command `lovelace/config` (NOT `lovelace/config/get`)

## LAYOUT OVERHAUL — COMPLETE (2026-06-17)
Rebuilt all 7 views on `custom:lcards-layout-view` (LCARdS native grid view).
- **A. DONE** — nav is now a built-in left rail of `lcards-button` (preset bullet) inside the frame
- **B. DONE** — content area has `view_layout.overflow: auto` → independent scroll, frame stays fixed
- **C. DONE** — Engineering corners now match (all stations share the uniform frame)
- Frame = `lcards-elbow` header-left (top) + footer-left (bottom), color #2a6bff (Nemesis Blue)
- Grid: cols `150px 1fr`, rows `52px 1fr 34px`, areas header/nav/content/footer
- Backup of pre-overhaul config: hidden dashboard `lcars-bak-0617` (restore by copying its config to lcars-main)

### Decorative layer — DONE on Main + Tactical (2026-06-17)
- 3-col grid: added 64px right rail with `lcards-data-grid` decorative cascade (niagara, themed colors)
- Station banner bar (lcards-button capped) at top of content
- Color-varied LCARS section header bars: each content section's title is nulled and replaced with a
  vivid `lcards-button` capped bar, colors cycling [salmon, violet, gold, blue, teal, red]
- Main = blue cascade / palette from idx 0; Tactical = amber cascade / palette from idx 2 (visual variety)
- Helper logic lives in the decorate() builder (re-run idempotent: strips prior lcards-button cards first)

### Expandable sections — DONE on Main + Tactical (2026-06-17)
- Installed `expander-card` v7.1.6 (MelleD fork) via HACS → /hacsfiles/lovelace-expander-card/expander-card.js
- Each content section wrapped in `custom:expander-card`: `title-card` = the LCARS color header bar,
  `title-card-clickable: true`, `title-card-button-overlay: true` (chevron on the bar), `clear: true`,
  `expanded: true`, `storage-id: <path>-sec-N` (persists collapse state in browser localStorage)
- Click any colored header bar to collapse/expand its panel — verified working
- arrow-color = #0b0f1c (dark chevron reads on bright bars)

### Department colors + full rollout — DONE (2026-06-17)
- ALL 7 views now have dept-colored chrome (header/footer elbows, banner, active nav button, lower-left rail filler):
  Main+Conn=RED command (#e0563f), Tactical+Engineering=GOLD ops (#f4b13c), Science+Comms=BLUE sciences (#4d8bff), Ambient=TEAL (#3fb6c9)
- Cascade rail tinted per dept. Inactive nav buttons = dark #11224e; active = dept color.
- LOWER-LEFT FRAME FIX: added a tall `navFiller` (barrel button, height 600, dept color) as last nav child +
  `overflow:hidden` on nav area → rail is now continuous from header elbow down to footer elbow.
- Decorative + expander layer rolled out to all 5 remaining stations (banner + color-cycled expander headers + cascade).
- ANIMATION PLACEHOLDERS added: Conn=starfield, Engineering=grid, Science=nebula+starfield — each an expander
  ("…FEED") wrapping a barrel button with `background_animation` + "[STANDBY · PLACEHOLDER]" tag. storage-id `<path>-anim`.
  NOTE: starfield reads dark/subtle on black — TUNE brightness/count or panel bg if more pop wanted.

### Polish DONE (2026-06-17)
- LIVE CLOCK back on all 7 header elbows. GOTCHA: Jinja `{{ }}` does NOT render in lcards elbow text here;
  the basic token `{entity.state}` DOES. Set `entity: sensor.time` on the elbow + clock text content `{entity.state}`.
  BUT binding entity recolours the elbow → must force `elbow.segment.color` as a full state-map
  (default/active/inactive/unavailable all = dept colour). Clock at center-right, station center-left, ship label dropped (redundant w/ banner).
- Animation placeholders retuned brighter (starfield count 420 + twinkle, grid bolder, nebula brightness up).

### Still TODO (features)
- Floor plan MSD card (Sweet Home 3D → SVG → /config/www → lcards-msd-card on Tactical) — see tasks, awaiting SVG
- Rebuild Science/Comms/Conn placeholder content with real entities (they have nice frames but mock data)
- Chrome autoplay permission for startup sound (manual, on the kiosk display device)
- mini-graph-card (HACS) sparklines on Engineering
- Tactical cascade reads more blue than amber — tune `style.color` vs animation colors
- Live clock back onto the header bar (currently static ship label; needs template text field)
- card_mod nth-of-type child styling on stacks did NOT render — used header bars instead (note for future)
- Header elbow leaves small gap above SYSTEMS label; tune bar_height/row size

## Next after overhaul
- Rebuild Science (weather map, cats/litter, solar), Comms (ntopng + Echo media), Conn (presence, calendar)
- Chrome autoplay permission (MANUAL): Chrome → Settings → Sound → Allow http://10.0.0.149:8123
- mini-graph-card sparklines for Engineering

## See also
- `PROJECT_MEMORY.md` — full master memory, entity inventory, rolling log
- Auto-memory `project_lcars_ha_web.md` — detailed cross-session state
