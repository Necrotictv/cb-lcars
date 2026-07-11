# HOLODECK BUILD LOG — autonomous session 2026-07-11
> Patrick's directive: SmartThings states + build out HOLODECK as far as possible.
> No direction questions today; pick the visually-accurate option; canon is king.
> Every decision I make without asking is recorded HERE for later review.
> Backup: tag `v1.1-pre-holodeck` (revert = `git reset --hard v1.1-pre-holodeck`).

## Standing assumptions (stated to Patrick up front)
1. All SFX synthesized via WebAudio (no downloads/copyright). Files dropped in
   `laforge/assets/sfx/` later will auto-override (loader checks first).
2. Room effects = calls to `script.laforge_transporter_fx` / `script.laforge_breach_fx`
   (do not exist yet → UI shows "FX: LOCAL ONLY"). I create NOTHING in HA.
3. No physical devices fired in testing.
4. Staged commits, pushed as I go.

## Decision record (running)
| # | Decision | Why |
|---|---|---|
| 1 | SmartThings findings: TV = `media_player.living_room_85_crystal_uhd` + channel sensors + connectivity (LIVE); fridge extras = doors/filter/energy (LIVE, filter at 100% usage!); washer/dryer = ABSENT → placeholder | Probed live HA states |
| 2 | Appliances live in ENVIRONMENTAL·ATMOSPHERE (3rd column) + TV row joins MEDIA·PLAYERS as "MAIN VIEWSCREEN" | Actuation/state = ENVIRONMENTAL doctrine; TV is also a media player |
| 3 | HOLODECK is a RAIL BUTTON (below SYSTEMS/MODE), NOT a 7th cluster | Keeps 3×2 sacred; holodeck is recreation, not home ops — matches SYSTEMS precedent |
| 4 | HOLODECK color = gold (`--c-gold`) | Distinct from all six spoke colors; reads "special mode" |
| 5 | Consoles v1: TRANSPORTER, WARP CORE (+ breach game), MSD, TACTICAL. CONN deferred | Highest theatrical value per effort; CONN needs nav-plotting design |
| 6 | MSD v1 ships: Enterprise-D + Defiant drawn as original SVG side elevations; Excelsior/DS9/Voyager = selectable "AWAITING SCHEMATIC" | Hand-drawing 5 accurate cutaways exceeds today's budget; 2 recognizable ones beat 5 bad ones. Canon-is-king favors fewer-but-right |
| 7 | Breach game: 4 incident types, 20s countdown, one correct action each, klaxon +
    red wash local to the screen (NOT the house alert entity) | House alert stays real; sim stays sim |
| 8 | EJECT CORE uses the 2-tap CONFIRM pattern (from sirens) even in sim | Teaches the muscle memory; also funnier |
| 9 | Sound gating: sfx respect SYSTEMS→INTERACTION BEEPS setting + require first user gesture (Chrome autoplay policy) | Existing settings contract |
| 10 | Transporter pads: 3 columns (canon TNG pad = 6 positions but 3 reads better at panel scale); shimmer = CSS particle columns + synth sparkle sweep | Visual accuracy at actual size > literal count |

## Work log (running)
- [x] Backup tag v1.1-pre-holodeck pushed
- [x] SmartThings probe (findings in #1)
- [ ] Appliances wiring (ha.js sync + ATMOSPHERE 3-col + MEDIA row)
- [ ] sfx.js (WebAudio synth: beep, chirp, klaxon, shimmer, phaser, torpedo, eject)
- [ ] holodeck.js (HOLOGROUP + 4 consoles + breach game)
- [ ] app.js wiring (rail button, navigate case) + CSS
- [ ] Verify each console (screenshots) · commits per stage · docs updated
