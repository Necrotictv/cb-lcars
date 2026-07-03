/* ============================================================================
   PROJECT LaFORGE — LCARS RENDERER v0.1
   ----------------------------------------------------------------------------
   WHAT: the single source of geometry for every LCARS screen. Standalone now,
         wrapped in a Lit HA card in Phase 2 (same module, lift-and-drop).
   WHY THIS EXISTS:
   - UI_STANDARDS §4: LCARS conforms to an INVISIBLE GRID. This module only
     exposes grid-snapped placement, so misalignment is impossible by
     construction (same trick as the elbow: correctness comes from the math,
     not from care).
   - Two shape primitives, both math, never eyeballed:
     1. shape()  — ported VERBATIM (logic + corner naming) from ha-lcars-panel
        src/SVGUtils.ts createRadiusPath: a rect whose corners are individually
        convex (radX<Corner>) or concave (radXInner<...>). Gives pills, caps,
        blocks, notched panels.
     2. elbow()  — the LOCKED parametric sweep path from UI_STANDARDS §7
        (thick arm → concave inner curve → thin arm → convex outer corner).
   ============================================================================ */

const LCARS = (() => {
  'use strict';

  /* ---- palette: UI_STANDARDS §3, TNG okudagram dialect ---- */
  const COLORS = {
    peach:'#ff9966', lilac:'#cc99cc', peri:'#9999cc', gold:'#ffcc66',
    salmon:'#cc6666', canary:'#f3f08b', magenta:'#cc6699', orange:'#ff9c00',
    ebony:'#20232c', text:'#d8c7ec', black:'#000000',
  };

  /* ---- global spacing constants (UI_STANDARDS §4) — the ONLY two gaps ---- */
  const SEAM = 0.18;   // frame seam: black gaps inside chrome
  const GAP  = 0.5;    // content gap: between panels/clusters

  /* ---- grid snap: every coordinate/size is a multiple of 0.25u ----
     WHY warn instead of throw: during a build session a warning gives a
     fixable console trail without killing the whole render. */
  const SNAP = 0.25;
  function snap(v, label) {
    const s = Math.round(v / SNAP) * SNAP;
    if (Math.abs(s - v) > 1e-9) {
      console.warn(`[LCARS grid] ${label ?? 'value'} ${v}u is off-grid — snapped to ${s}u`);
    }
    return s;
  }

  /* ==========================================================================
     Screen — the positioned root. All children are placed in u-coordinates.
     ========================================================================== */
  function screen(rootEl, opts = {}) {
    const u = opts.u ?? 20;                       // px per LCARS unit
    const U = n => n * u;                          // unit → px
    rootEl.style.cssText +=
      `;position:relative;background:#000;overflow:hidden;` +
      `font-family:'Antonio','Oswald','Arial Narrow',sans-serif;letter-spacing:.06em;`;

    /* Screen width/height in (fractional) units — content layout math uses this. */
    const scr = {
      u, U, el: rootEl, COLORS, SEAM, GAP,
      get uw() { return rootEl.clientWidth  / u; },
      get uh() { return rootEl.clientHeight / u; },
    };

    /* ---- place(): THE ONLY WAY ANYTHING GETS POSITIONED ----
       x,y,w,h in u, snapped to the 0.25u grid. Returns the div.
       seam: {left,right,top,bottom} booleans — carves the 0.18u frame seam
       INSIDE the snapped slot (slot stays on-grid, visual shrinks). WHY: the
       seam constant (0.18u, LOCKED §7) is not a grid multiple; carving it
       inside the slot keeps the grid model pure AND the seam exact. */
    scr.place = (x, y, w, h, css = '', seam = null) => {
      x = snap(x,'x'); y = snap(y,'y'); w = snap(w,'w'); h = snap(h,'h');
      let L = U(x), T = U(y), Wp = U(w), Hp = U(h);
      if (seam) {
        if (seam.left)   { L += U(SEAM); Wp -= U(SEAM); }
        if (seam.right)  { Wp -= U(SEAM); }
        if (seam.top)    { T += U(SEAM); Hp -= U(SEAM); }
        if (seam.bottom) { Hp -= U(SEAM); }
      }
      const d = document.createElement('div');
      d.style.cssText =
        `position:absolute;left:${L}px;top:${T}px;width:${Wp}px;height:${Hp}px;` + css;
      d.dataset.ux = x; d.dataset.uy = y; d.dataset.uw = w; d.dataset.uh = h;
      rootEl.appendChild(d);
      return d;
    };

    /* ---- bar(): plain frame rectangle in a snapped slot, seam-aware ---- */
    scr.bar = (x, y, w, h, color = 'lilac', seam = null) =>
      scr.place(x, y, w, h, `background:${COLORS[color] ?? color};`, seam);

    /* ---- shape(): ported createRadiusPath (ha-lcars-panel SVGUtils.ts) ----
       corners: { radXTopLeft, radXTopRight, radXBottomRight, radXBottomLeft,
                  radXInnerTopLeft, radXInnerTopRight,
                  radXInnerBottomLeft, radXInnerBottomRight,
                  (+ optional radY* variants) } — all in u.
       cap: 'left' | 'right' | both via capLeft/capRight booleans (radius = h/2,
       same rule as upstream). WHY keep upstream naming: zero translation cost
       when we later diff against ha-lcars-panel behavior. */
    scr.shape = (x, y, w, h, cfg = {}) => {
      x = snap(x,'x'); y = snap(y,'y'); w = snap(w,'w'); h = snap(h,'h');
      const Wpx = U(w), Hpx = U(h);
      const c = { ...cfg };
      if (c.capLeft)  { c.radXTopLeft  = h/2; c.radXBottomLeft  = h/2; }
      if (c.capRight) { c.radXTopRight = h/2; c.radXBottomRight = h/2; }

      /* --- verbatim port of the corner-offset resolution --- */
      const sv = v => (v ?? 0) * u;   // scaleValue: u → px (upstream ×10 scaleFactor)
      const offsetTL = sv(c.radXTopLeft ?? c.radXInnerBottomRight);
      const offsetTR = sv(c.radXTopRight ?? c.radXInnerBottomLeft);
      const offsetRT = sv(c.radYTopRight ?? c.radXTopRight ?? c.radYInnerBottomLeft ?? c.radXInnerBottomLeft);
      const offsetRB = sv(c.radYBottomRight ?? c.radXBottomRight ?? c.radYInnerTopLeft ?? c.radXInnerTopLeft);
      const offsetBR = sv(c.radXBottomRight ?? c.radXInnerTopLeft);
      const offsetBL = sv(c.radXBottomLeft ?? c.radXInnerTopRight);
      const offsetLB = sv(c.radYBottomLeft ?? c.radXBottomLeft ?? c.radYInnerTopRight ?? c.radXInnerTopRight);
      const offsetLT = sv(c.radYTopLeft ?? c.radXTopLeft ?? c.radYInnerBottomRight ?? c.radXInnerBottomRight);

      const p = [`M 0 ${offsetLT}`];
      if (c.radXTopLeft)                 p.push(`q 0 ${-offsetLT} ${offsetTL} ${-offsetLT}`);
      else if (c.radXInnerBottomRight)   p.push(`q ${offsetTL} 0 ${offsetTL} ${-offsetLT}`);
      p.push(`L ${Wpx - offsetTR} 0`);
      if (c.radXTopRight)                p.push(`q ${offsetTR} 0 ${offsetTR} ${offsetRT}`);
      else if (c.radXInnerBottomLeft)    p.push(`q 0 ${offsetRT} ${offsetTR} ${offsetRT}`);
      p.push(`L ${Wpx} ${Hpx - offsetRB}`);
      if (c.radXBottomRight)             p.push(`q 0 ${offsetRB} ${-offsetBR} ${offsetRB}`);
      else if (c.radXInnerTopLeft)       p.push(`q ${-offsetBR} 0 ${-offsetBR} ${offsetRB}`);
      p.push(`L ${offsetBL} ${Hpx}`);
      if (c.radXBottomLeft)              p.push(`q ${-offsetBL} 0 ${-offsetBL} ${-offsetLB}`);
      else if (c.radXInnerTopRight)      p.push(`q 0 ${-offsetLB} ${-offsetBL} ${-offsetLB}`);
      p.push('Z');
      /* --- end port --- */

      const fill = COLORS[c.color] ?? c.color ?? COLORS.gold;
      const d = scr.place(x, y, w, h);
      d.innerHTML = `<svg width="${Wpx}" height="${Hpx}" viewBox="0 0 ${Wpx} ${Hpx}" preserveAspectRatio="none"><path d="${p.join(' ')}" fill="${fill}"/></svg>`;
      return d;
    };

    /* ---- elbow(): the LOCKED sweep (UI_STANDARDS §7) ----
       corner:'tl' → thick vertical arm on the LEFT, thin horizontal arm on TOP
       corner:'bl' → vertical mirror (thin arm on BOTTOM).
       tv = vertical arm (rail) width; th = horizontal arm (bar) thickness;
       ro/ri = outer/inner radius; w/h = the elbow piece's bounding box.
       FIT GUARANTEE: callers position rails/bars off THESE SAME numbers. */
    scr.elbow = (x, y, { corner='tl', tv=1.5, th=1.1, ro=2, ri=1, w=3.5, h=3.5, color='lilac' }) => {
      [tv,th,ro,ri,w,h] = [tv,th,ro,ri,w,h].map(v => snap(v,'elbow-param'));
      const P = n => U(n);
      const path = corner === 'tl'
        ? `M0 ${P(h)} L${P(tv)} ${P(h)} L${P(tv)} ${P(th+ri)} Q${P(tv)} ${P(th)} ${P(tv+ri)} ${P(th)} L${P(w)} ${P(th)} L${P(w)} 0 L${P(ro)} 0 Q0 0 0 ${P(ro)} Z`
        : `M0 0 L${P(tv)} 0 L${P(tv)} ${P(h-th-ri)} Q${P(tv)} ${P(h-th)} ${P(tv+ri)} ${P(h-th)} L${P(w)} ${P(h-th)} L${P(w)} ${P(h)} L${P(ro)} ${P(h)} Q0 ${P(h)} 0 ${P(h-ro)} Z`;
      const d = scr.place(x, y, w, h);
      d.innerHTML = `<svg width="${U(w)}" height="${U(h)}" viewBox="0 0 ${U(w)} ${U(h)}"><path d="${path}" fill="${COLORS[color] ?? color}"/></svg>`;
      return d;
    };

    /* ---- text(): typography per UI_STANDARDS §1 — THREE sizes only ---- */
    const FS = { title: 2.4, sub: 0.55, data: 0.40 };
    scr.text = (x, y, w, h, str, { fs='data', color='text', align='left', weight=500, ls='.08em' } = {}) => {
      const d = scr.place(x, y, w, h,
        `display:flex;align-items:center;justify-content:${
          align==='right' ? 'flex-end' : align==='center' ? 'center' : 'flex-start'
        };font-size:${U(FS[fs])}px;color:${COLORS[color] ?? color};font-weight:${weight};` +
        `letter-spacing:${ls};text-transform:uppercase;white-space:nowrap;`);
      d.innerHTML = str;
      return d;
    };

    /* ---- button(): canon §6 — the rounded cap IS the button ----
       ends:'pill' (standalone) | 'right' (connected on left) | 'left'.
       Height 1.8u = the locked touch target. */
    scr.button = (x, y, w, str, { color='lilac', on=false, ends='pill', h=1.8 } = {}) => {
      const caps = ends==='pill' ? {capLeft:true,capRight:true}
                 : ends==='right'? {capRight:true} : {capLeft:true};
      const d = scr.shape(x, y, w, h, { ...caps, color });
      d.style.cursor = 'pointer';
      const t = scr.text(x, y, w, h, str, { fs:'sub', color:'black', align:'center', weight:on?600:500 });
      t.style.pointerEvents = 'none';
      if (!on) d.style.opacity = '.62';
      return d;
    };

    /* ---- panel(): ebony content surface ---- */
    scr.panel = (x, y, w, h) =>
      scr.place(x, y, w, h, `background:${COLORS.ebony};overflow:hidden;`);

    /* ---- debug grid overlay: SEE the invisible grid (toggle: press G) ----
       WHY: "elements must fit the grid" is only checkable if the grid is
       visible. Minor lines every 0.25u, major lines every 1u. */
    const grid = document.createElement('div');
    grid.style.cssText =
      `position:absolute;inset:0;pointer-events:none;display:none;z-index:9999;` +
      `background-image:` +
      `repeating-linear-gradient(to right, rgba(0,255,170,.25) 0 1px, transparent 1px ${U(1)}px),` +
      `repeating-linear-gradient(to bottom, rgba(0,255,170,.25) 0 1px, transparent 1px ${U(1)}px),` +
      `repeating-linear-gradient(to right, rgba(0,255,170,.10) 0 1px, transparent 1px ${U(SNAP)}px),` +
      `repeating-linear-gradient(to bottom, rgba(0,255,170,.10) 0 1px, transparent 1px ${U(SNAP)}px);`;
    rootEl.appendChild(grid);
    window.addEventListener('keydown', e => {
      if (e.key.toLowerCase() === 'g') grid.style.display = grid.style.display==='none' ? 'block' : 'none';
    });

    return scr;
  }

  return { screen, COLORS, SEAM, GAP };
})();
