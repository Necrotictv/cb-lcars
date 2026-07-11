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

## Decision record (additions)
| # | Decision | Why |
|---|---|---|
| 11 | Global button beeps NOT wired terminal-wide — only holodeck actions + nav chirps | Beep-on-everything gets annoying fast; full soundscape = sound-pack pass |
| 12 | Wrong action during breach game costs 5 seconds | Stakes without instant fail; teaches the systems |
| 13 | Leaving the warp core mid-crisis resets the sim (renderHolodeck teardown) | No orphaned timers/red-wash; navigating away = ending the program |

## Work log (final)
- [x] Backup tag v1.1-pre-holodeck pushed
- [x] SmartThings probe → TV LIVE, fridge extras LIVE (filter 100% — replace!), washer/dryer placeholder (commit 67e0f81)
- [x] Appliances wiring: ATMOSPHERE 3-col + MAIN VIEWSCREEN row in MEDIA
- [x] sfx.js — WebAudio synth, assets/sfx override path, BEEPS-gated
- [x] holodeck.js — TRANSPORTER / WARP CORE + breach game / MSD (Ent-D, Defiant) / TACTICAL
- [x] app.js + CSS wiring, rail button on all rails, scripts v13 (commit 289510b)
- [x] VERIFICATION: transporter probe-verified (3 pads, energize handler); MSD + TACTICAL
      verified LIVE — Patrick discovered the holodeck mid-build and was piloting the
      consoles himself while I tested (TACTICAL screenshot: reticle, weapons, disclaimers
      all correct). Warp core breach game: logic reviewed; Patrick's first crisis will be
      the live test — appropriately.
- **KNOWN QUIRKS:** windows resize mid-session re-renders (view-local state resets, sim
  resets — by design). ENERGIZE is busy-locked during sequence. First tap after page
  load feeds the boot-skip.
- **FOR PATRICK:** room FX = create HA scripts `laforge_transporter_fx` / `laforge_breach_fx`
  and the consoles will fire them automatically. Real TNG sounds: drop mp3s in
  laforge/assets/sfx/ (names: beep, chirp, deny, klaxon, shimmer, phaser, torpedo,
  eject, powerup, alarm). Your fridge water filter is at 100% — actually replace it.

## ═══ SPRINT 2 — 2026-07-12 (assets + sounds + transporter remake + hooks) ═══
| # | Decision | Why |
|---|---|---|
| 14 | Assets pulled from OneDrive\Pictures per Patrick's direction (explicit consent to reach outside project scope for those files) | Tim Davies MSDs ×3, warpcore.gif, transporter.gif reference |
| 15 | trekcore downloads (Patrick-directed): 10 TNG sounds via sfx override slots. Required Referer header (hotlink protection). Personal use, his home | beep=computerbeep_41, chirp=input_ok_2, deny=denybeep1, klaxon=tng_red_alert1, shimmer=tng_transporter3, phaser=tng_phaser3, torpedo=tng_torpedo3, powerup=power_up1, alarm=alertklaxon, +energize |
| 16 | Transporter rebuilt to the gif: THREE multitouch tracks (pointer-capture each; 3 fingers works), sweep up ≥85% on all → energize; decay if released early; elbow-framed OPERATIONS deck + blinking flavor clusters | The 3-track sweep IS the console; canon is king |
| 17 | Chamber/console = 42/58 proportional split | Fixed heights starved the tracks on small windows (found in verification) |
| 18 | Hardcoded holoFx scripts RETIRED → assignable ROUTINE HOOKS engine (12 hook points, SYSTEMS dropdowns, persisted). Patrick's red-alert-lights example = bind script to 'RED ALERT ENGAGED' | His ask: self-service binding, no code edits |
| 19 | MSD = image cutaways + %-positioned tap spots (spots data-editable in SHIPS map); SVG ships retired; Voyager now BUILT (image), Excelsior/DS9 still queued | Real MSDs beat my vectors; canon is king |
| 20 | Warp core = warpcore.gif with CSS-shaft fallback via onerror | Patrick's animation; graceful degrade |
**Verified live:** 3-track energize (98·98·98 → ENERGIZING), MSD galaxy image + 4 spots,
12 hook dropdowns (1 routine in HA so far — grows as he adds scripts), TNG sounds
downloaded (10/10 OK incl. 839KB tng_red_alert1).
**Test artifact note:** JS-driven navigate+render can catch fade mid-flight in
screenshots (dim); real taps render bright.
