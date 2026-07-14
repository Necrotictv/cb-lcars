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

  /* ---- palettes: UI_STANDARDS §3. Same named ROLES, three era skins ----
     WHY roles not hexes everywhere: swapping palette = reassigning the role
     table; every element already drawn by role follows automatically. */
  const PALETTES = {
    tng: { peach:'#ff9966', lilac:'#cc99cc', peri:'#9999cc', gold:'#ffcc66',
           salmon:'#cc6666', canary:'#f3f08b', magenta:'#cc6699', orange:'#ff9c00' },
    /* "classic" = thelcars.com canonical values (authenticity reference,
       2026-07-04). Punchier violets than our video-sampled tng — their colors
       come from screen-accurate curation, ours from compressed frames. */
    classic: { peach:'#f86', lilac:'#c9f', peri:'#89f', gold:'#fc9',
               salmon:'#cf4f4f', canary:'#fc3', magenta:'#cf5e9e', orange:'#f90' },
    /* ds9/voy RETUNED 2026-07-14 against lcars.org.uk templates (images/adge/):
       DS9 = sand/tan rails + hot gold; VOY = the true magenta/pink identity
       with warm rails + pale blue info. Vetting notes in LAFORGE_DESIGN. */
    ds9: { peach:'#ffb066', lilac:'#d4b183', peri:'#8899bb', gold:'#ffbb33',
           salmon:'#bb5544', canary:'#e8cc88', magenta:'#b07a88', orange:'#ff9900' },
    voy: { peach:'#f2a25c', lilac:'#cc99cc', peri:'#9bb2e8', gold:'#e6c97a',
           salmon:'#d4707a', canary:'#eed488', magenta:'#ff88cc', orange:'#ffaa33' },
    /* SYSTEM palettes — alert conditions hue-shift the whole terminal
       (the LCARdS trick, done natively). Not shown in the SYSTEMS picker;
       applied temporarily, never saved to settings. */
    redalert:    { peach:'#ff5533', lilac:'#cc6666', peri:'#aa4444', gold:'#ff8855',
                   salmon:'#f22200', canary:'#ff8866', magenta:'#cc4455', orange:'#ff6644' },
    yellowalert: { peach:'#ffbb55', lilac:'#ddaa66', peri:'#bb9944', gold:'#ffcc33',
                   salmon:'#dd8844', canary:'#ffdd55', magenta:'#cc9955', orange:'#ffaa22' },
  };
  const COLORS = {
    ...PALETTES.tng,
    ebony:'#20232c', text:'#d8c7ec', black:'#000000',
  };
  function setPalette(name) {
    Object.assign(COLORS, PALETTES[name] ?? PALETTES.tng);
    /* mirror to CSS vars so panel-content styles follow the palette too */
    for (const [k, v] of Object.entries(COLORS))
      document.documentElement.style.setProperty('--c-' + k, v);
  }

  /* ---- persistent settings (v0.3): localStorage now, HA helpers in Phase 2
     so every terminal shares config. Survives restarts by requirement. ---- */
  const settings = {
    _KEY: 'laforge-settings',
    _data: null,
    _load() { if (!this._data) { try { this._data = JSON.parse(localStorage.getItem(this._KEY)) ?? {}; } catch { this._data = {}; } } return this._data; },
    get(k, dflt) { const d = this._load(); return k in d ? d[k] : dflt; },
    set(k, v) { const d = this._load(); d[k] = v; localStorage.setItem(this._KEY, JSON.stringify(d)); },
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
      /* display:block — inline SVG sits on the text baseline and renders a few
         px LOW (caught on the divider end cap). Block = exact slot fit. */
      d.innerHTML = `<svg width="${Wpx}" height="${Hpx}" viewBox="0 0 ${Wpx} ${Hpx}" preserveAspectRatio="none" style="display:block"><path d="${p.join(' ')}" fill="${fill}"/></svg>`;
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
      /* tr/br = horizontal mirrors of tl/bl (needed for scanWindow's
         double-bracket — the mirrored-elbow signature, UI_STANDARDS ref) */
      const base = (corner === 'tl' || corner === 'tr')
        ? `M0 ${P(h)} L${P(tv)} ${P(h)} L${P(tv)} ${P(th+ri)} Q${P(tv)} ${P(th)} ${P(tv+ri)} ${P(th)} L${P(w)} ${P(th)} L${P(w)} 0 L${P(ro)} 0 Q0 0 0 ${P(ro)} Z`
        : `M0 0 L${P(tv)} 0 L${P(tv)} ${P(h-th-ri)} Q${P(tv)} ${P(h-th)} ${P(tv+ri)} ${P(h-th)} L${P(w)} ${P(h-th)} L${P(w)} ${P(h)} L${P(ro)} ${P(h)} Q0 ${P(h)} 0 ${P(h-ro)} Z`;
      const mirror = (corner === 'tr' || corner === 'br')
        ? ` transform="translate(${U(w)},0) scale(-1,1)"` : '';
      const d = scr.place(x, y, w, h);
      d.innerHTML = `<svg width="${U(w)}" height="${U(h)}" viewBox="0 0 ${U(w)} ${U(h)}" style="display:block"><path d="${base}"${mirror} fill="${COLORS[color] ?? color}"/></svg>`;
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

    /* ---- onTap(): touch-first press feedback ----
       Brightness flash on pointerdown (the LCARS "acknowledge"), handler on
       release. WHY pointer events: works for touch AND mouse, no 300ms delay. */
    scr.onTap = (el, fn) => {
      el.style.cursor = 'pointer';
      el.addEventListener('pointerdown', () => {
        el.style.transition = 'filter 60ms';
        el.style.filter = 'brightness(1.7)';
      });
      const release = () => { el.style.transition = 'filter 180ms'; el.style.filter = ''; };
      el.addEventListener('pointerup', e => { release(); fn?.(e); });
      el.addEventListener('pointercancel', release);
      el.addEventListener('pointerleave', release);
      return el;
    };

    /* ---- breathe(): §8 breathing pulse ----
       Each element gets its OWN randomized duration + delay so pulses never
       sync up (the "no obvious loops" rule). soft=true keeps labels legible. */
    scr.breathe = (el, { soft = false } = {}) => {
      const dur = 3000 + Math.random() * 1500;          // 3–4.5s, unique per element
      el.animate(
        [{ opacity: 1 }, { opacity: soft ? 0.5 : 0.18 }, { opacity: 1 }],
        { duration: dur, delay: Math.random() * dur, iterations: Infinity, easing: 'ease-in-out' });
      return el;
    };

    /* ---- digits(): live flavor-number stream ----
       Code-driven randomness (§8): each line mutates on its own randomized
       interval — the classic "computer is thinking" okudagram texture. */
    scr.digits = (el, lines = 2, groups = 5) => {
      const rnd = n => String(Math.floor(Math.random() * 10 ** n)).padStart(n, '0');
      const line = () => Array.from({ length: groups },
        () => rnd([3,5,6,8,11][Math.floor(Math.random() * 5)])).join('&nbsp;&nbsp;');
      const rows = Array.from({ length: lines }, () => line());
      const paint = () => { el.innerHTML = rows.join('<br>'); };
      paint();
      rows.forEach((_, i) => {
        const tickRow = () => {
          rows[i] = line(); paint();
          setTimeout(tickRow, 900 + Math.random() * 2200);   // own tempo per row
        };
        setTimeout(tickRow, Math.random() * 2000);
      });
      return el;
    };

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

  /* ---- lcarsGraph: the VOY energy-flow display as a reusable component ----
     (spec: LAFORGE_DESIGN / images/adge/voy_energy_flow) black field, magenta
     mesh, neon traces w/ value labels RIDING the lines, auto-scale header.
     Pure canvas draw — caller re-invokes on each new sample. */
  function drawGraph(canvas, series, { window: win = 90, unit = '', title = '' } = {}) {
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight;
    const W = canvas.width, H = canvas.height;
    const mx = Math.max(10, ...series.flatMap(s => s.data));
    ctx.strokeStyle = COLORS.magenta; ctx.globalAlpha = 0.22; ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += W / 12) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += H / 6)  { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.globalAlpha = 1;
    for (const s of series) {
      const col = COLORS[s.color] ?? s.color;
      ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.shadowColor = col; ctx.shadowBlur = 5;
      ctx.beginPath();
      s.data.forEach((v, i) => { const x = i / (win - 1) * W, y = H - (v / mx) * (H - 12) - 4;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke(); ctx.shadowBlur = 0;
      const lv = s.data[s.data.length - 1] ?? 0;
      ctx.fillStyle = col; ctx.font = '600 10px Antonio';
      ctx.fillText(`${s.label} ${Math.round(lv)}${unit}`,
        Math.min((s.data.length - 1) / (win - 1) * W, W - 64),
        Math.max(10, H - (lv / mx) * (H - 12) - 8));
    }
    ctx.fillStyle = COLORS.lilac; ctx.font = '600 9px Antonio';
    ctx.fillText(`${title ? title + ' · ' : ''}SCALE ${Math.round(mx)}${unit}`, 6, 11);
  }

  /* boot with the persisted palette (default TNG) */
  setPalette(settings.get('palette', 'tng'));

  return { screen, COLORS, PALETTES, setPalette, settings, drawGraph, SEAM, GAP };
})();
