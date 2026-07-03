/* ============================================================================
   PROJECT LaFORGE — APP v0.2: tap-through navigation + animation layer
   ----------------------------------------------------------------------------
   Screens:
   - MAIN  = Glance Grid (locked methodology): 6 live clusters, zero-tap glance.
   - GROUP = workspace subscreen (Option-2 pattern): two-frame okudagram,
     group's controls embedded full-size. HOME + group row = 1-tap anywhere.
   Animations follow UI_STANDARDS §8: every element has its OWN timeline
   (random duration + delay), code-driven randomness, no synchronized loops.
   Phase 2 will swap the mock DATA object for HA entity state — the render
   code is already shaped for that (one data source, dumb views).
   ============================================================================ */
'use strict';

const root = document.getElementById('screen');
const { GAP } = LCARS;
const UNITS_WIDE = 50;

/* ---- frame constants (single source — this is what makes pieces FIT) ---- */
const RAIL = 6, BARH = 1.0, RO = 2, RI = 1, EW = 7.5, EH = 3.5;
const DTH = 0.5, DEH = 2.75;   // subscreen divider arm thickness / elbow box height

/* ---- the six function groups (LAFORGE_DESIGN.md nav map) ---- */
/* local = screen-specific nav (hub-and-spoke model: subscreens navigate only
   back to MAIN; the top row belongs to THIS screen's own views instead) */
const GROUPS = [
  { id:'lights',   label:'LIGHTS',   color:'canary',  badge:'3/5 ON',   local:['ALL','INTERIOR','EXTERIOR','SCENES'] },
  { id:'security', label:'SECURITY', color:'salmon',  badge:'GREEN',    local:['CAMERAS','PERIMETER','ALERTS'] },
  { id:'climate',  label:'CLIMATE',  color:'lilac',   badge:'71°F',     local:['CURRENT','FORECAST','SURVEY'] },
  { id:'media',    label:'MEDIA',    color:'magenta', badge:'IDLE',     local:['PLAYERS','ANNOUNCE','VOLUME'] },
  { id:'home',     label:'HOME',     color:'peri',    badge:'2 EVENTS', local:['MSD','CALENDAR','ROUTINES'] },
  { id:'core',     label:'CORE',     color:'peach',   badge:'NOMINAL',  local:['FRED','NETWORK','UPDATES'] },
];

/* ---- mock live data (Phase 2: replaced by HA websocket state) ---- */
const DATA = {
  dimmers: [ ['LIVING',72], ['FOYER',45], ['KITCHEN',90], ['BACKYD',0] ],
  core:    { cpu:34, mem:61 },
};

let current = 'main';        // which screen is showing
let timers = [];             // per-screen intervals — cleared on nav (no leaks)
const later = (fn, ms) => timers.push(setInterval(fn, ms));

/* ============================ NAVIGATION ============================
   The wipe: fade the screen out 110ms, rebuild, fade in 160ms. Fast and
   matter-of-fact — TNG screens CUT, they don't cross-dissolve for drama. */
function navigate(to) {
  current = to;
  root.animate([{opacity:1},{opacity:0}], {duration:110, fill:'forwards'})
    .onfinish = () => {
      render();
      root.animate([{opacity:0},{opacity:1}], {duration:160, fill:'forwards'});
    };
}

function render() {
  timers.forEach(clearInterval); timers = [];
  root.innerHTML = '';
  const u = root.clientWidth / UNITS_WIDE;
  document.documentElement.style.setProperty('--u', u + 'px');
  const scr = LCARS.screen(root, { u });
  const W = UNITS_WIDE, H = Math.floor(scr.uh * 4) / 4;
  if (current === 'main') renderMain(scr, W, H);
  else if (current === 'systems') renderSystems(scr, W, H);
  else renderGroup(scr, W, H, GROUPS.find(g => g.id === current));
  /* live stardate/clock — every screen has one */
  const tick = () => { const d = new Date(), p = n => String(n).padStart(2,'0');
    const el = document.getElementById('clk');
    if (el) el.innerHTML = 'STARDATE ' + p(d.getMonth()+1) + p(d.getDate()) + d.getFullYear() + ':' + p(d.getHours()) + p(d.getMinutes()); };
  tick(); later(tick, 1000);
}

/* ---- shared chrome: top bar + console bar (identical on every screen,
       so the terminal reads as ONE device whose work area changes) ---- */
function chrome(scr, W, H, consoleLabel, elbowTop, elbowBottom) {
  const capW = 1.5, txtW = 16;
  scr.elbow(0, 0, { corner:'tl', tv:RAIL, th:BARH, ro:RO, ri:RI, w:EW, h:EH, color:elbowTop });
  scr.bar(EW, 0, 2, BARH, 'gold', { left:true });
  scr.bar(EW + 2, 0, W - EW - 2 - txtW - capW, BARH, 'lilac', { left:true });
  scr.text(W - txtW - capW, 0, txtW - 0.5, BARH,
    'U.S.S. JARVIS · ALL SYSTEMS <b style="color:#fff">· ONLINE</b>',
    { fs:'sub', color:'orange', align:'right', weight:600 });
  scr.shape(W - capW, 0, capW, BARH, { capRight:true, color:'peri' });
  scr.elbow(0, H - EH, { corner:'bl', tv:RAIL, th:BARH, ro:RO, ri:RI, w:EW, h:EH, color:elbowBottom });
  scr.text(EW + 0.25, H - BARH, 8, BARH, consoleLabel, { fs:'sub', color:'orange', weight:600 });
  scr.bar(EW + 8.5, H - BARH, W - EW - 8.5 - capW, BARH, 'lilac', { left:true });
  scr.shape(W - capW, H - BARH, capW, BARH, { capRight:true, color:'peri' });
}

/* ---- rail control blocks (v0.3): SYSTEMS = UI config, MODE = mic mute ----
   MODE spec (Patrick): mute is IGNORE-not-off — while muted the block wears the
   palette's IDLE color (lilac) and breathes: "present but not listening". */
function railSystems(scr, y, bh) {
  const b = scr.bar(0, y, RAIL, bh, 'peri', { top:true });
  scr.onTap(b, () => navigate('systems'));
  scr.text(0, y + bh - 0.75, RAIL - 0.25, 0.75, 'SYSTEMS',
    { fs:'data', color:'black', align:'right', weight:600 }).style.pointerEvents = 'none';
}
function railMode(scr, y, bh) {
  const muted = LCARS.settings.get('micMute', false);
  const b = scr.bar(0, y, RAIL, bh, muted ? 'lilac' : 'gold', { top:true });
  scr.onTap(b, () => { LCARS.settings.set('micMute', !muted); render(); });
  if (muted) scr.breathe(b);
  scr.text(0, y + bh - 0.75, RAIL - 0.25, 0.75, muted ? 'MIC MUTED' : 'MODE SELECT',
    { fs:'data', color:'black', align:'right', weight:600 }).style.pointerEvents = 'none';
}

/* ============================ MAIN SCREEN ============================ */
function renderMain(scr, W, H) {
  chrome(scr, W, H, 'CONSOLE · OVERVIEW', 'lilac', 'peach');

  /* rail blocks between the elbows — SYSTEMS + MODE are live controls */
  scr.bar(0, EH, RAIL, 2.5, 'lilac', { top:true });
  scr.text(0, EH + 1.75, RAIL - 0.25, 0.75, 'LCARS 47-2210', { fs:'data', color:'black', align:'right', weight:600 });
  railSystems(scr, EH + 2.5, 2.5);
  railMode(scr, EH + 5, 2.5);
  const ry = EH + 7.5;
  scr.bar(0, ry, RAIL, (H - EH) - ry, 'peach', { top:true, bottom:true });
  scr.text(0, H - EH - 1, RAIL - 0.25, 0.75, '490-0504', { fs:'data', color:'black', align:'right', weight:600 });

  const cx0 = RAIL + GAP, cx1 = W - GAP, cy0 = BARH + GAP, cy1 = H - BARH - GAP;

  /* identity + LIVE flavor digits (each row mutates on its own tempo) */
  scr.text(cx1 - 20, cy0,       20, 0.5, 'RESIDENCE', { fs:'data', color:'orange', align:'right', ls:'.2em' });
  scr.text(cx1 - 20, cy0 + 0.5, 20, 2.5, 'OVERVIEW',  { fs:'title', color:'orange', align:'right', weight:700 });
  scr.text(cx1 - 20, cy0 + 3,   20, 0.5, '', { fs:'data', color:'gold', align:'right' }).id = 'clk';
  scr.digits(scr.place(cx0, cy0, 16, 2,
    `font-size:${scr.U(0.4)}px;color:#ff9c00;letter-spacing:.14em;line-height:1.6;opacity:.85;`), 2, 4);

  /* the glance grid — headers are the tap targets into each group */
  const gy0 = cy0 + 4, cols = 3, HDR = 1.25;
  const cw = Math.floor(((cx1 - cx0) - (cols - 1) * GAP) / cols * 4) / 4;
  const ch = Math.floor(((cy1 - gy0) - GAP) / 2 * 4) / 4;

  GROUPS.forEach((g, i) => {
    const x = cx0 + (i % 3) * (cw + GAP), y = gy0 + Math.floor(i / 3) * (ch + GAP);
    const hdr = scr.shape(x, y, cw, HDR, { capRight:true, color:g.color });
    scr.onTap(hdr, () => navigate(g.id));
    const t1 = scr.text(x + 0.5, y, cw - 2, HDR, g.label, { fs:'sub', color:'black', weight:600 });
    const t2 = scr.text(x, y, cw - 1, HDR, g.badge, { fs:'data', color:'black', align:'right', weight:600 });
    t1.style.pointerEvents = t2.style.pointerEvents = 'none';
    const body = scr.panel(x, y + HDR + 0.25, cw, ch - HDR - 0.25);
    body.innerHTML = `<div class="clb">${clusterBody(g.id)}</div>`;
  });

  /* --- superfluous-but-in-place: CORE bars drift like a live gauge --- */
  later(() => {
    DATA.core.cpu = Math.max(8, Math.min(96, DATA.core.cpu + (Math.random()*8 - 4)));
    DATA.core.mem = Math.max(30, Math.min(92, DATA.core.mem + (Math.random()*4 - 2)));
    const c = document.getElementById('cpu-i'), m = document.getElementById('mem-i');
    if (c) { c.style.width = DATA.core.cpu + '%'; document.getElementById('cpu-n').textContent = Math.round(DATA.core.cpu); }
    if (m) { m.style.width = DATA.core.mem + '%'; document.getElementById('mem-n').textContent = Math.round(DATA.core.mem); }
  }, 1400);
}

function clusterBody(id) {
  switch (id) {
    case 'lights': return DATA.dimmers.map(([k,v]) => `
      <div class="mb"><div class="k">${k}</div><div class="t"><i style="width:${v}%"></i></div><div class="n">${v||'OFF'}</div></div>`).join('');
    case 'security': return `
      <div class="cams"><div class="cam" data-n="FRONT DOOR"><i class="scan"></i></div>
      <div class="cam" data-n="BACKYARD"><i class="scan"></i></div>
      <div class="cam" data-n="DOWNSTAIRS"><i class="scan"></i></div></div>
      MOTION <span class="v">ARMED</span> · SIRENS <span class="v">STANDBY</span>`;
    case 'climate': return `CONDITION <span class="v">CLEAR</span><br>HUMIDITY <span class="v">44%</span><br>SUNSET <span class="v">20:31</span> · UV <span class="v">3</span>`;
    case 'media': return `DOWNSTAIRS <span class="v">VOL 6</span><br>EVERYWHERE <span class="v">STANDBY</span><br>ANNOUNCE <span class="v">READY</span>`;
    case 'home': return `14:00 <span class="v">STANDUP</span><br>18:30 <span class="v">FILM SESSION</span><br>LITTER ROBOT <span class="v">CYCLED 12:40</span>`;
    case 'core': { const cpu = Math.round(DATA.core.cpu), mem = Math.round(DATA.core.mem);
      return `
      <div class="mb"><div class="k">CPU</div><div class="t"><i id="cpu-i" style="width:${cpu}%;background:#ff9966;transition:width 1.2s"></i></div><div class="n" id="cpu-n">${cpu}</div></div>
      <div class="mb"><div class="k">MEM</div><div class="t"><i id="mem-i" style="width:${mem}%;background:#ff9966;transition:width 1.2s"></i></div><div class="n" id="mem-n">${mem}</div></div>
      WAN <span class="v">ONLINE</span> · ALARMS <span class="w">1</span>`; }
  }
}

/* ============================ GROUP SUBSCREEN ============================
   Option-2 workspace: two frames meet at the segmented divider. Upper frame
   (group color) = nav + identity; lower frame = the group's full controls. */
function renderGroup(scr, W, H, g) {
  chrome(scr, W, H, 'CONSOLE · ' + g.label, g.color, 'peach');

  /* upper frame rail: block + BL elbow whose arm is the divider's TOP half */
  scr.bar(0, EH, RAIL, 4.25 - (EH - BARH), 'lilac', { top:true });   // filler under top elbow
  scr.text(0, EH + 0.25, RAIL - 0.25, 0.75, 'LCARS 43-5489', { fs:'data', color:'black', align:'right', weight:600 });
  const dy = 4.25 + BARH;                                            // divider top-half arm y
  scr.elbow(0, dy, { corner:'bl', tv:RAIL, th:DTH, ro:RO, ri:RI, w:EW, h:DEH, color:g.color });
  /* lower frame: TL elbow whose arm is the divider's BOTTOM half */
  const dy2 = dy + DEH + 0.25;
  scr.elbow(0, dy2, { corner:'tl', tv:RAIL, th:DTH, ro:RO, ri:RI, w:EW, h:DEH, color:'peach' });
  /* rail blocks joining lower elbow down to the bottom elbow — live controls */
  railSystems(scr, dy2 + DEH, 2.5);
  railMode(scr, dy2 + DEH + 2.5, 2.5);
  const ry = dy2 + DEH + 5;
  scr.bar(0, ry, RAIL, (H - EH) - ry, 'peach', { top:true, bottom:true });

  /* segmented divider tube (both halves share widths/colors — V4 technique),
     group color leads the pattern so the divider "belongs" to this screen */
  const segs = [[g.color,2],['lilac',12],['gold',3],['salmon',14],['peri',null]];
  for (const [row, yy] of [[0, dy + DEH - DTH], [1, dy2]]) {
    let sx = EW;
    for (const [c, w] of segs) {
      const sw = w ?? (W - GAP - sx);
      if (sw <= 0) break;
      const isLast = w === null;
      if (isLast) scr.shape(sx, yy, sw, DTH, { capRight:true, color:c });
      else scr.bar(sx, yy, sw, DTH, c, { left:true });
      sx += sw;
    }
  }

  /* ---- upper content: HOME + group row (1 tap to anywhere) + identity ---- */
  const cx0 = RAIL + GAP, cx1 = W - GAP;
  /* HUB-AND-SPOKE (v0.3): the ONLY global nav on a subscreen is MAIN.
     Structural white — terminal chrome, not a category color. The rest of the
     row belongs to THIS screen's local views (canon §3: inactive = idle lilac). */
  const home = scr.button(cx0, BARH + 0.5, 4, 'MAIN', { color:'#d8c7ec', on:true, ends:'pill' });
  scr.onTap(home, () => navigate('main'));
  (g.local ?? []).forEach((label, i) => {
    const active = i === 0;                       // first local view active (mock until workspaces get views)
    const b = scr.button(cx0 + 4.5 + i * 6, BARH + 0.5, 5.5, label,
      { color: active ? g.color : 'lilac', on: active, ends:'pill' });
    if (!active) scr.breathe(b, { soft:true });
    scr.onTap(b, () => {});                       // local view switching lands with each workspace build
  });
  scr.digits(scr.place(cx0, BARH + 2.75, 18, 1.5,
    `font-size:${scr.U(0.4)}px;color:#ff9c00;letter-spacing:.14em;line-height:1.6;opacity:.85;`), 2, 4);
  scr.text(cx1 - 18, BARH + 2, 18, 0.5, 'RESIDENCE', { fs:'data', color:'orange', align:'right', ls:'.2em' });
  scr.text(cx1 - 18, BARH + 2.5, 18, 2.5, g.label, { fs:'title', color:'orange', align:'right', weight:700 });
  scr.text(cx1 - 18, BARH + 5, 18, 0.5, '', { fs:'data', color:'gold', align:'right' }).id = 'clk';

  /* ---- lower content: the group's workspace ---- */
  const wy0 = dy2 + DTH + GAP, wy1 = H - BARH - GAP;
  if (g.id === 'lights') workspaceLights(scr, cx0, wy0, cx1, wy1);
  else if (g.id === 'home') workspaceHome(scr, cx0, wy0, cx1, wy1, g);
  else workspaceStandby(scr, cx0, wy0, cx1, wy1, g);
}

/* ============================ SYSTEMS SCREEN ============================
   UI configuration — everything about the INTERFACE itself (v0.3 spec):
   era palette, ambient sound, voice interface. All persisted. */
function renderSystems(scr, W, H) {
  chrome(scr, W, H, 'CONSOLE · SYSTEMS', 'peri', 'peach');
  scr.bar(0, EH, RAIL, 2.5, 'lilac', { top:true });
  scr.text(0, EH + 1.75, RAIL - 0.25, 0.75, 'LCARS 47-2210', { fs:'data', color:'black', align:'right', weight:600 });
  scr.bar(0, EH + 2.5, RAIL, 2.5, 'peri', { top:true });          // SYSTEMS block: you are here
  scr.text(0, EH + 3.75, RAIL - 0.25, 0.75, '▶ SYSTEMS', { fs:'data', color:'black', align:'right', weight:700 });
  railMode(scr, EH + 5, 2.5);                                     // mute reachable from config too
  const ry = EH + 7.5;
  scr.bar(0, ry, RAIL, (H - EH) - ry, 'peach', { top:true, bottom:true });

  const cx0 = RAIL + GAP, cx1 = W - GAP;
  const home = scr.button(cx0, BARH + 0.5, 4, 'MAIN', { color:'#d8c7ec', on:true, ends:'pill' });
  scr.onTap(home, () => navigate('main'));
  scr.text(cx1 - 18, BARH + 2, 18, 0.5, 'TERMINAL CONFIGURATION', { fs:'data', color:'orange', align:'right', ls:'.2em' });
  scr.text(cx1 - 18, BARH + 2.5, 18, 2.5, 'SYSTEMS', { fs:'title', color:'orange', align:'right', weight:700 });
  scr.text(cx1 - 18, BARH + 5, 18, 0.5, '', { fs:'data', color:'gold', align:'right' }).id = 'clk';

  /* three config panels */
  const y0 = BARH + 6.5, y1 = H - BARH - GAP;
  const w3 = Math.floor(((cx1 - cx0) - 2 * GAP) / 3 * 4) / 4;
  const panel = (i, color, title) => {
    const x = cx0 + i * (w3 + GAP);
    scr.shape(x, y0, w3, 1.1, { capRight:true, color });
    scr.text(x + 0.5, y0, w3 - 1, 1.1, title, { fs:'sub', color:'black', weight:600 });
    return x;
  };

  /* PALETTE — era skins; active selection highlighted, applies instantly */
  const px0 = panel(0, 'peach', 'COLOR PALETTE');
  scr.panel(px0, y0 + 1.35, w3, y1 - y0 - 1.35);
  const activePal = LCARS.settings.get('palette', 'tng');
  [['tng','TNG · GALAXY'], ['ds9','DS9 · CARDASSIAN'], ['voy','VOY · INTREPID']].forEach(([id, label], i) => {
    const b = scr.button(px0 + 1, y0 + 2.25 + i * 2.5, w3 - 2, label,
      { color: id === activePal ? 'peach' : 'lilac', on: id === activePal, ends:'pill' });
    scr.onTap(b, () => { LCARS.settings.set('palette', id); LCARS.setPalette(id); render(); });
  });

  /* AUDIO — ambient + interaction sound flags (hooks for the sound pack) */
  const ax0 = panel(1, 'gold', 'AUDIO');
  scr.panel(ax0, y0 + 1.35, w3, y1 - y0 - 1.35);
  [['ambient','AMBIENT SOUNDS'], ['beeps','INTERACTION BEEPS']].forEach(([key, label], i) => {
    const on = LCARS.settings.get(key, true);
    const b = scr.button(ax0 + 1, y0 + 2.25 + i * 2.5, w3 - 2, `${label} · ${on ? 'ON' : 'OFF'}`,
      { color: on ? 'gold' : 'lilac', on, ends:'pill' });
    scr.onTap(b, () => { LCARS.settings.set(key, !on); render(); });
  });

  /* VOICE INTERFACE — readouts now; wiring comes with the TTS/voice build */
  const vx0 = panel(2, 'lilac', 'VOICE INTERFACE');
  const vp = scr.panel(vx0, y0 + 1.35, w3, y1 - y0 - 1.35);
  const muted = LCARS.settings.get('micMute', false);
  vp.innerHTML = `<div class="clb">WAKE WORD <span class="v">COMPUTER</span><br>
    VOICE <span class="v">MAJEL</span><br>
    MIC STATUS ${muted ? '<span class="w">MUTED</span>' : '<span class="v">LIVE</span>'}</div>`;
  const mb = scr.button(vx0 + 1, y1 - 2.5, w3 - 2, muted ? 'UNMUTE MIC' : 'MUTE MIC',
    { color: muted ? 'lilac' : 'salmon', on: true, ends:'pill' });
  scr.onTap(mb, () => { LCARS.settings.set('micMute', !muted); render(); });
}

/* LIGHTS workspace — interactive transporter dimmers (drag them!) */
function workspaceLights(scr, x0, y0, x1, y1) {
  const w3 = Math.floor(((x1 - x0) - 2 * GAP) / 3 * 4) / 4;
  const col = (i, color, title) => {
    const x = x0 + i * (w3 + GAP);
    scr.shape(x, y0, w3, 1.1, { capRight:true, color });
    scr.text(x + 0.5, y0, w3 - 1, 1.1, title, { fs:'sub', color:'black', weight:600 });
    return scr.panel(x, y0 + 1.35, w3, y1 - y0 - 1.35);
  };
  const dim = col(0, 'canary', 'DIMMERS');
  dim.innerHTML = `<div class="slrow">` + DATA.dimmers.map(([k,v],i) =>
    `<div class="vsl" data-i="${i}"><div class="vtrack"><div class="vfill" style="height:${v}%"></div>
     <div class="vhandle" style="bottom:${v}%"></div></div><div class="vval">${v||'OFF'}</div><div class="vlab">${k}</div></div>`).join('') + `</div>`;
  /* drag behavior: pointer position → level. Phase 2: also call light.turn_on
     with brightness — the handler below is where that service call goes. */
  dim.querySelectorAll('.vsl').forEach(sl => {
    const track = sl.querySelector('.vtrack');
    const set = e => {
      const r = track.getBoundingClientRect();
      const v = Math.round(Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height)) * 100);
      DATA.dimmers[+sl.dataset.i][1] = v;
      sl.querySelector('.vfill').style.height = v + '%';
      sl.querySelector('.vhandle').style.bottom = v + '%';
      sl.querySelector('.vval').textContent = v || 'OFF';
    };
    track.addEventListener('pointerdown', e => { track.setPointerCapture(e.pointerId); set(e);
      track.onpointermove = set; });
    track.addEventListener('pointerup', () => track.onpointermove = null);
  });

  const sw = col(1, 'peach', 'SWITCHES');
  sw.innerHTML = `<div class="btncol">
    <div class="wbtn" style="background:#f3f08b">BACKYARD FLOOD</div>
    <div class="wbtn" style="background:#9999cc">ALL OFF</div>
    <div class="wbtn" style="background:#cc99cc">SCENE · EVENING</div></div>`;
  sw.querySelectorAll('.wbtn').forEach(b => scr.onTap(b, () => {}));

  const st = col(2, 'lilac', 'STATUS');
  st.innerHTML = `<div class="clb">ACTIVE FIXTURES <span class="v">3 / 5</span><br>
    POWER DRAW <span class="v">142 W</span><br>LAST EVENT <span class="v">KITCHEN 90%</span></div>`;
}

/* HOME workspace — the house as a Master Systems Display (floorplan.js data).
   Rooms are tap targets; Phase 2 pops each room's entity controls. */
function workspaceHome(scr, x0, y0, x1, y1, g) {
  scr.shape(x0, y0, x1 - x0, 1.1, { capRight:true, color:g.color });
  scr.text(x0 + 0.5, y0, 24, 1.1, 'RESIDENCE · MASTER SYSTEMS DISPLAY', { fs:'sub', color:'black', weight:600 });
  const p = scr.panel(x0, y0 + 1.35, x1 - x0, y1 - y0 - 1.35);
  p.style.padding = scr.U(0.5) + 'px';
  const C = k => getComputedStyle(document.documentElement).getPropertyValue(k).trim();
  renderMSD(p, C);
  /* room taps: popups land with Phase-2 entity wiring — flash for now */
  p.querySelectorAll('[data-room]').forEach(el =>
    el.addEventListener('pointerdown', () => {
      el.animate([{opacity:1},{opacity:.3},{opacity:1}], {duration:220});
    }));
}

/* ============================ SCREENSAVER ============================
   v0.3 spec: after idle, dim out to a spinning Federation logo. Any tap
   wakes. Dev shortcut: press S to toggle instantly. Timeout is a setting. */
const SAVER = {
  timer: null, active: false,
  mins() { return LCARS.settings.get('ssMinutes', 5); },
  arm() { clearTimeout(this.timer);
    if (!this.active) this.timer = setTimeout(() => this.start(), this.mins() * 60000); },
  start() {
    if (this.active) return; this.active = true;
    const d = document.createElement('div');
    d.id = 'saver';
    /* FedSign.gif (lcars.org.uk, catalogued asset) with a text fallback if
       the CDN ever dies — the saver must never render a broken-image icon */
    d.innerHTML = `
      <img src="https://www.lcars.org.uk/ano%20gifs/FedSign.gif" alt=""
        onerror="this.remove();document.getElementById('saver-fallback').style.display='block'">
      <div id="saver-fallback" style="display:none" class="saver-fb">UNITED FEDERATION OF PLANETS</div>
      <div class="saver-clk" id="saver-clk"></div>`;
    document.body.appendChild(d);
    d.animate([{opacity:0},{opacity:1}], {duration:1500, fill:'forwards'});
    const t = () => { const dt = new Date(), p = n => String(n).padStart(2,'0');
      const el = document.getElementById('saver-clk');
      if (el) el.textContent = p(dt.getHours()) + ':' + p(dt.getMinutes()); };
    t(); this.clk = setInterval(t, 5000);
    d.addEventListener('pointerdown', e => { e.stopPropagation(); this.stop(); });
  },
  stop() {
    if (!this.active) return; this.active = false;
    clearInterval(this.clk);
    const d = document.getElementById('saver');
    if (d) d.animate([{opacity:1},{opacity:0}], {duration:300, fill:'forwards'})
      .onfinish = () => d.remove();
    this.arm();
  },
};
['pointerdown','pointermove','keydown'].forEach(ev =>
  addEventListener(ev, () => { if (!SAVER.active) SAVER.arm(); }, { capture:true }));
addEventListener('keydown', e => {
  if (e.key.toLowerCase() === 's') SAVER.active ? SAVER.stop() : SAVER.start();
});
SAVER.arm();

/* placeholder workspace for groups not built yet — still animated, still LCARS */
function workspaceStandby(scr, x0, y0, x1, y1, g) {
  scr.shape(x0, y0, x1 - x0, 1.1, { capRight:true, color:g.color });
  scr.text(x0 + 0.5, y0, 20, 1.1, g.label + ' · SYSTEMS', { fs:'sub', color:'black', weight:600 });
  const p = scr.panel(x0, y0 + 1.35, x1 - x0, y1 - y0 - 1.35);
  p.innerHTML = `<div class="clb" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%">
    <div class="standby">■ STANDBY</div><div style="opacity:.6;margin-top:.6em">WORKSPACE PENDING · CONTENT BUILD SCHEDULED</div></div>`;
  scr.breathe(p.querySelector('.standby'), { soft:true });
}

render();
addEventListener('resize', () => render());
