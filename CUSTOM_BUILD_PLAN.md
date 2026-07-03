# Project LaForge — LCARS Custom Build Plan (anti-churn)

Goal: a fully custom LCARS renderer that emulates LCARS as accurately as possible, with
unlimited room for animation, interaction, and future features. Standalone prototype now →
Lit Home Assistant card later. This plan exists to prevent the elbow-churn of last session.

## Why it churned last time (and the fix)
- Churn cause #1: I re-created the elbow *by eye* with `border-radius`, guessing proportions.
- Churn cause #2: I couldn't reliably *see* my own output, so I iterated blind.
- Fix #1: generate frames from the SAME algorithm ha-lcars-panel uses — math, not eyeballing.
- Fix #2: keep a live render+screenshot loop (local server) and verify against the live build
  before building anything on top.

## The rendering primitive (the key idea)
LCARS is just rectangles whose corners are independently rounded — some convex (outer), some
concave (inner). ha-lcars-panel draws all of them with one function, `createRadiusPath`
(src/SVGUtils.ts), which emits an SVG path. We port that verbatim into our renderer.

From that one primitive we get the whole LCARS vocabulary:
- elbow = one convex outer corner + one concave inner corner
- pill / cap = fully rounded end(s)
- bar / block / divider segment = square (no radii)

Because it's the identical algorithm, the elbow is correct by construction — no iteration.

## Parameters (already extracted from the live lcars-v4 build)
- Everything scales off one unit var `--u`.
- Left frame width: 5u   |  divider half thickness: 0.64u  |  seam ~0.23u
- Elbow: outer radius 2u, inner (concave) radius 1u  |  elbow element = 6u x 1.65u
- Palette (named LCARS colors): tangerine (active), lilac (inactive nav), canary,
  chetwode-blue, indian-red, magenta, orange-peel, slate-blue, ebony-clay (panel bg), black.
- Font: Antonio (condensed), uppercase.
- Design rule (locked): square corners everywhere; rounding ONLY on elbows/caps.

## Tech
- Phase 1 (now): standalone `index.html` + JS + inline SVG. Fast iteration, no HA reload cycle.
- Phase 2 (later): wrap the same renderer in a Lit custom card; wire HA entities/services.
- The SVG renderer module is identical in both phases — porting is lift-and-drop, no rewrite.

## Build order — each step verified against the live build before the next
1. **Frame/elbow renderer** (the risky bit — do it FIRST).
   - Port `createRadiusPath`; render the two converging elbows + frame.
   - VERIFY: screenshot mine vs the live lcars-v4 elbow; they must match. Do not proceed until they do.
2. **Static Command screen**: left frame to bottom, vertical nav, identity + clock, divider, 4 panels.
3. **Interactions/animations**: breathing (done), collapse to horizontal system bar, plus room for future ones.
4. **Other station screens** (security / science / engineering).
5. **Port to Lit card + wire live HA data** (entities, tap actions).

## Anti-churn rules (hold me to these)
- The elbow is NEVER eyeballed — it comes from the ported algorithm + measured parameters.
- The local server (`python -m http.server 8000`) stays running so I can see + screenshot every change.
- Verify the frame against the live build before building anything on top of it.
- Time-box: if any single piece isn't matching after ~2 iterations, stop and reassess together
  rather than grinding tokens.

## What I need from you
- Keep the local server running during our sessions (my see-and-verify loop).
- Approve this plan (or adjust the build order / scope).
