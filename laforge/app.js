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
  /* ENVIRONMENTAL absorbed LIGHTS (2026-07-10): starships have Environmental
     Control, not a "lights station." SCIENCE observes; ENVIRONMENTAL controls. */
  { id:'environ',  label:'ENVIRONMENTAL', color:'canary', badge:'3/5 ON',
    local:['LIGHTING','ATMOSPHERE','SHUTTERS','SCENES'] },
  { id:'security', label:'SECURITY', color:'salmon',  badge:'GREEN',    local:['CAMERAS','PERIMETER','ALERTS'] },
  { id:'science',  label:'SCIENCE',  color:'lilac',   badge:'71°F',     local:['ATMOS','SURVEY','ORBITAL','GEO'] },
  { id:'media',    label:'MEDIA',    color:'magenta', badge:'IDLE',     local:['PLAYERS','ANNOUNCE','VOLUME'] },
  { id:'home',     label:'HOME',     color:'peri',    badge:'2 EVENTS', local:['MSD','CALENDAR','ROUTINES'] },
  { id:'core',     label:'CORE',     color:'peach',   badge:'NOMINAL',  local:['FRED','NETWORK','UPDATES'] },
];

/* ---- shared data object. Boots with mock values; ha.js sync() overwrites
   them with live HA state when config.local.js provides a token. ---- */
const DATA = {
  cams: [ ['FRONT DOOR', null, '—'], ['BACKYARD', null, '—'], ['DOWNSTAIRS', null, '—'] ],
  dimmers: [ ['LIVING',72], ['FOYER',45], ['KITCHEN',90], ['BACKYD',0] ],
  core:    { cpu:34, mem:61, alarms:'1' },
  climate: { temp:71, condition:'CLEAR', humidity:44, wind:4, sunset:'20:31', sunrise:'05:48' },
  alert:   'green_alert',
  floodOn: false,
  media:   [ ['DOWNSTAIRS','idle',6], ['EVERYWHERE','standby',5], ['BEDROOM · P','standby',4], ['IZZY’S ROOM','standby',3] ],
};
const alertLabel = () => (DATA.alert || 'green').split('_')[0].toUpperCase();

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

let needsBoot = true;   // boot choreography plays exactly once, on first load
let lastScr = null;     // kept for dev tools (B = replay boot, for testing/filming)
addEventListener('keydown', e => {
  if (e.key.toLowerCase() === 'b' && lastScr) playBoot(lastScr);
});

function render() {
  timers.forEach(clearInterval); timers = [];
  /* teardown: destroy the Cesium viewer BEFORE wiping its DOM — otherwise
     each re-render leaks a WebGL context (fatal on the HD 520 kiosk) */
  if (geoViewer) { try { geoViewer.destroy(); } catch {} geoViewer = null; }
  root.innerHTML = '';
  const u = root.clientWidth / UNITS_WIDE;
  document.documentElement.style.setProperty('--u', u + 'px');
  const scr = LCARS.screen(root, { u });
  const W = UNITS_WIDE, H = Math.floor(scr.uh * 4) / 4;
  if (current === 'main') renderMain(scr, W, H);
  else if (current === 'systems') renderSystems(scr, W, H);
  else renderGroup(scr, W, H, GROUPS.find(g => g.id === current));
  lastScr = scr;
  if (needsBoot) { needsBoot = false; playBoot(scr); }
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
  const status = HA.connected
    ? '<b style="color:#fff">· ONLINE</b>'
    : (window.LAFORGE_CONFIG ? '<b style="color:var(--c-salmon)">· OFFLINE</b>' : '<b style="color:var(--c-lilac)">· SIMULATED</b>');
  scr.text(W - txtW - capW, 0, txtW - 0.5, BARH,
    'U.S.S. JARVIS · ALL SYSTEMS ' + status,
    { fs:'sub', color:'orange', align:'right', weight:600 }).id = 'ha-status';
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

  /* badges compute from DATA so live values show without code changes */
  const badges = {
    environ: (DATA.floodOn ? '4/5' : '3/5') + ' ON', security: alertLabel(),
    science: DATA.climate.temp + '°F', media: 'IDLE',
    home: '2 EVENTS', core: DATA.core.alarms === '0' ? 'NOMINAL' : 'ALARM',
  };
  GROUPS.forEach((g, i) => {
    const x = cx0 + (i % 3) * (cw + GAP), y = gy0 + Math.floor(i / 3) * (ch + GAP);
    g.badge = badges[g.id] ?? g.badge;
    const hdr = scr.shape(x, y, cw, HDR, { capRight:true, color:g.color });
    scr.onTap(hdr, () => navigate(g.id));
    const t1 = scr.text(x + 0.5, y, cw - 2, HDR, g.label, { fs:'sub', color:'black', weight:600 });
    const t2 = scr.text(x, y, cw - 1, HDR, g.badge, { fs:'data', color:'black', align:'right', weight:600 });
    t1.style.pointerEvents = t2.style.pointerEvents = 'none';
    const body = scr.panel(x, y + HDR + 0.25, cw, ch - HDR - 0.25);
    body.innerHTML = `<div class="clb">${clusterBody(g.id)}</div>`;
  });

  /* --- live camera thumbnails on the SECURITY cluster (10s cadence) --- */
  const thumbs = async () => {
    for (let i = 0; i < DATA.cams.length; i++) {
      const [, entity] = DATA.cams[i], img = document.getElementById('camthumb-' + i);
      if (!entity || !img) continue;
      const u = await HA.cameraUrl(entity);
      if (u && img.isConnected) img.src = u;
    }
  };
  thumbs(); later(thumbs, 10000);

  /* --- CORE gauge drift: mock-mode only — real Fred data needs no acting --- */
  later(() => {
    if (HA.connected) return;
    DATA.core.cpu = Math.max(8, Math.min(96, DATA.core.cpu + (Math.random()*8 - 4)));
    DATA.core.mem = Math.max(30, Math.min(92, DATA.core.mem + (Math.random()*4 - 2)));
    const c = document.getElementById('cpu-i'), m = document.getElementById('mem-i');
    if (c) { c.style.width = DATA.core.cpu + '%'; document.getElementById('cpu-n').textContent = Math.round(DATA.core.cpu); }
    if (m) { m.style.width = DATA.core.mem + '%'; document.getElementById('mem-n').textContent = Math.round(DATA.core.mem); }
  }, 1400);
}

function clusterBody(id) {
  switch (id) {
    case 'environ': return DATA.dimmers.slice(0, 3).map(([k,v]) => `
      <div class="mb"><div class="k">${k}</div><div class="t"><i style="width:${v}%"></i></div><div class="n">${v||'OFF'}</div></div>`).join('') +
      `COLD STORAGE <span class="v">${Math.round(HA.num('sensor.refrigerator_fridge_temperature', 37))}° / ${Math.round(HA.num('sensor.refrigerator_freezer_temperature', 0))}°F</span>`;
    case 'security': return `
      <div class="cams">` + DATA.cams.map(([n], i) =>
        `<div class="cam" data-n="${n}"><img class="camimg" id="camthumb-${i}" alt=""><i class="scan"></i></div>`).join('') + `</div>
      MOTION <span class="v">ARMED</span> · SIRENS <span class="v">STANDBY</span>`;
    case 'science': return `CONDITION <span class="v">${DATA.climate.condition}</span><br>HUMIDITY <span class="v">${DATA.climate.humidity}%</span><br>SUNSET <span class="v">${DATA.climate.sunset}</span> · LUNA <span class="v">${moonPhase().illum}%</span>`;
    case 'media': return DATA.media.slice(0, 3).map(([n, s, v]) =>
      `${n} <span class="v">${s === 'playing' ? 'VOL ' + v : s.toUpperCase()}</span>`).join('<br>');
    case 'home': return `14:00 <span class="v">STANDUP</span><br>18:30 <span class="v">FILM SESSION</span><br>LITTER ROBOT <span class="v">CYCLED 12:40</span>`;
    case 'core': { const cpu = Math.round(DATA.core.cpu), mem = Math.round(DATA.core.mem);
      const memShow = DATA.core.memLabel ?? mem;
      const alarms = DATA.core.alarms === '0'
        ? '<span class="v">CLEAR</span>' : `<span class="w">${DATA.core.alarms}</span>`;
      return `
      <div class="mb"><div class="k">CPU</div><div class="t"><i id="cpu-i" style="width:${cpu}%;background:var(--c-peach);transition:width 1.2s"></i></div><div class="n" id="cpu-n">${cpu}</div></div>
      <div class="mb"><div class="k">MEM</div><div class="t"><i id="mem-i" style="width:${mem}%;background:var(--c-peach);transition:width 1.2s"></i></div><div class="n" id="mem-n" style="width:calc(var(--u)*2.6)">${memShow}</div></div>
      WAN <span class="v">ONLINE</span> · ALARMS ${alarms}`; }
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
  const activeView = localView[g.id] ?? 0;
  (g.local ?? []).forEach((label, i) => {
    const active = i === activeView;
    const b = scr.button(cx0 + 4.5 + i * 6, BARH + 0.5, 5.5, label,
      { color: active ? g.color : 'lilac', on: active, ends:'pill' });
    if (!active) {
      scr.breathe(b, { soft:true });
      scr.onTap(b, () => { localView[g.id] = i; render(); });   // instant mode switch (TNG screens cut)
    }
  });
  scr.digits(scr.place(cx0, BARH + 2.75, 18, 1.5,
    `font-size:${scr.U(0.4)}px;color:#ff9c00;letter-spacing:.14em;line-height:1.6;opacity:.85;`), 2, 4);
  scr.text(cx1 - 18, BARH + 2, 18, 0.5, 'RESIDENCE', { fs:'data', color:'orange', align:'right', ls:'.2em' });
  scr.text(cx1 - 18, BARH + 2.5, 18, 2.5, g.label, { fs:'title', color:'orange', align:'right', weight:700 });
  scr.text(cx1 - 18, BARH + 5, 18, 0.5, '', { fs:'data', color:'gold', align:'right' }).id = 'clk';

  /* ---- lower content: the active local view's workspace ---- */
  const wy0 = dy2 + DTH + GAP, wy1 = H - BARH - GAP;
  renderWorkspace(scr, g, activeView, cx0, wy0, cx1, wy1);
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
  [['tng','TNG · GALAXY'], ['classic','TNG · CLASSIC'],
   ['ds9','DS9 · CARDASSIAN'], ['voy','VOY · INTREPID']].forEach(([id, label], i) => {
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

/* ============================ WORKSPACES ============================
   One builder per (group × local view) — the SPOKE MAP (LAFORGE_DESIGN.md)
   made executable. All mock data; Phase 2 swaps DATA for HA state. */
let localView = {};   // groupId → active view index (session-scoped; kiosk boots to defaults)

/* equal-width titled panel columns — the standard workspace skeleton */
function wsCols(scr, x0, y0, x1, y1, defs) {
  const n = defs.length, w = Math.floor(((x1 - x0) - (n - 1) * GAP) / n * 4) / 4;
  return defs.map(([color, title], i) => {
    const x = x0 + i * (w + GAP);
    scr.shape(x, y0, w, 1.1, { capRight:true, color });
    scr.text(x + 0.5, y0, w - 1, 1.1, title, { fs:'sub', color:'black', weight:600 });
    return scr.panel(x, y0 + 1.35, w, y1 - y0 - 1.35);
  });
}

/* interactive transporter dimmers for a subset of DATA.dimmers (by index).
   Phase 2: the set() handler is where light.turn_on{brightness} goes. */
function buildDimmers(panel, idxs) {
  panel.innerHTML = `<div class="slrow">` + idxs.map(i => { const [k, v] = DATA.dimmers[i]; return `
    <div class="vsl" data-i="${i}"><div class="vtrack"><div class="vfill" style="height:${v}%"></div>
    <div class="vhandle" style="bottom:${v}%"></div></div><div class="vval">${v||'OFF'}</div><div class="vlab">${k}</div></div>`; }).join('') + `</div>`;
  panel.querySelectorAll('.vsl').forEach(sl => {
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
}

const btns = (scr, panel, items) => {   // items: [color, text, action?] — action fires a real service call
  panel.innerHTML = `<div class="btncol">` + items.map(([c, t]) =>
    `<div class="wbtn" style="background:var(--c-${c})">${t}</div>`).join('') + `</div>`;
  panel.querySelectorAll('.wbtn').forEach((b, i) => scr.onTap(b, items[i][2] ?? (() => {})));
};

/* ============================ SCIENCE ENGINE ============================
   Tier-1 native instruments (LAFORGE_DESIGN embed doctrine). */

/* Planet positions: JPL approximate Keplerian elements (J2000 + rates/century).
   Kepler's equation solved by fixed-point iteration — display-accurate. */
const PLANETS = [
  ['MERCURY', 0.387, 0.2056, 252.25, 149472.674,  77.457,  0.160, 'peri',   1.4],
  ['VENUS',   0.723, 0.0068, 181.98,  58517.816, 131.53,   0.048, 'gold',   2.2],
  ['EARTH',   1.000, 0.0167, 100.46,  35999.372, 102.94,   0.323, 'peri',   2.3],
  ['MARS',    1.524, 0.0934,  -4.55,  19140.303, -23.94,   0.444, 'salmon', 1.8],
  ['JUPITER', 5.203, 0.0484,  34.40,   3034.746,  14.73,   0.213, 'peach',  4.5],
  ['SATURN',  9.537, 0.0539,  49.95,   1222.494,  92.60,  -0.420, 'canary', 4.0],
];
function planetAngles() {
  const T = (Date.now() / 86400000 + 2440587.5 - 2451545.0) / 36525;
  return PLANETS.map(([name, a, e, L0, Ld, p0, pd, color, r]) => {
    const L = (L0 + Ld * T) % 360, peri = p0 + pd * T;
    let M = (((L - peri) % 360) + 360) % 360 * Math.PI / 180;
    let E = M; for (let i = 0; i < 5; i++) E = M + e * Math.sin(E);
    const v = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
    return { name, lon: v + peri * Math.PI / 180, dist: a * (1 - e * Math.cos(E)), color, r };
  });
}
/* Moon: synodic epoch math (new moon 2000-01-06 18:14 UTC) */
function moonPhase() {
  const syn = 29.53058867;
  const days = (Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 86400000;
  const f = ((days % syn) + syn) % syn / syn;
  const names = ['NEW', 'WAXING CRESCENT', 'FIRST QUARTER', 'WAXING GIBBOUS', 'FULL',
                 'WANING GIBBOUS', 'LAST QUARTER', 'WANING CRESCENT'];
  return { f, illum: Math.round((1 - Math.cos(2 * Math.PI * f)) / 2 * 100),
    name: names[Math.floor(f * 8 + 0.5) % 8],
    toFull: ((0.5 - f + 1) % 1) * syn, toNew: ((1 - f) % 1) * syn };
}

let geoViewer = null;   // live Cesium viewer ref (search flyTo without re-render)

/* lazy CDN loader — Cesium (~10MB) must not load until GEO opens (HD 520 kiosk) */
const loaded = {};
function loadScript(src, cssHref) {
  if (loaded[src]) return loaded[src];
  if (cssHref) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = cssHref; document.head.appendChild(l); }
  loaded[src] = new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
  return loaded[src];
}

/* viewscreen popup: LCARS bezel + title + CLOSE — reusable (NASA Eyes now,
   camera feeds later). One at a time; ESC or CLOSE dismisses. */
/* TRUE LCARS mini-frame popup (UI_STANDARDS §9, ref: Stellar Cartography).
   Own rail + title bar + bottom bar + corner sweeps; palette-role colors so
   alert conditions recolor popups too. color = context (salmon for security…). */
function viewscreen(title, contentHTML, onClose, color = 'lilac') {
  document.getElementById('vpop')?.remove();
  const segs = ['peri', 'lilac', 'peach'].map(c =>
    `<div class="vs-seg" style="background:var(--c-${c})">${100 + Math.floor(Math.random() * 900)}</div>`).join('');
  const v = document.createElement('div');
  v.id = 'vpop';
  v.innerHTML = `<div class="vs-frame">
    <div class="vs-ctl"  style="background:var(--c-${color})"></div>
    <div class="vs-top"  style="background:var(--c-${color})"><span>${title}</span>
      <div class="vs-close">✕ CLOSE</div></div>
    <div class="vs-rail">${segs}<div class="vs-fill" style="background:var(--c-${color})"></div></div>
    <div class="vs-body">
      <svg class="vs-in vs-in-t" viewBox="0 0 20 20" preserveAspectRatio="none">
        <path d="M0 0 L20 0 A20 20 0 0 0 0 20 Z" fill="var(--c-${color})"/></svg>
      <svg class="vs-in vs-in-b" viewBox="0 0 20 20" preserveAspectRatio="none">
        <path d="M0 20 L20 20 A20 20 0 0 1 0 0 Z" fill="var(--c-${color})"/></svg>
      ${contentHTML}</div>
    <div class="vs-cbl"  style="background:var(--c-${color})"></div>
    <div class="vs-bot"  style="background:var(--c-${color})"></div>
  </div>`;
  document.body.appendChild(v);
  v.animate([{opacity:0},{opacity:1}], {duration:180, fill:'forwards'});
  const close = () => { onClose?.(); v.remove(); };
  v.querySelector('.vs-close').addEventListener('pointerup', close);
  v.addEventListener('pointerup', e => { if (e.target === v) close(); });
  return v;
}

/* live camera viewscreen: signed-URL stills on a fast refresh. Own interval,
   cleared on close (popup outlives render() so timers[] can't own it). */
function camPopup(name, entity) {
  const v = viewscreen('VIEWSCREEN · ' + name + ' · LIVE FEED',
    `<img class="campop" alt="ACQUIRING SIGNAL…">`,
    () => clearInterval(t), 'salmon');            // security context = salmon frame
  const img = v.querySelector('img');
  const refresh = async () => {
    const u = await HA.cameraUrl(entity);
    if (u && img.isConnected) img.src = u;
  };
  refresh();
  const t = setInterval(refresh, 2000);
}

const homeGeo = () => DATA.geo ?? { lat: 39.1, lon: -84.5 };   // zone.home via ha.js

/* ============================ ROOM POPUPS (MSD) ============================
   Tap a room on the floor plan → viewscreen with that room's entities,
   resolved LIVE against HA states. Per-domain treatment:
   light/switch/siren → state + TOGGLE · camera → OPEN FEED · media_player →
   state/volume · sensors/numbers → value. Wildcards (sensor.foo_*) expand. */
function findRoom(id) {
  for (const d of FLOORPLAN.decks) { const r = d.rooms.find(r => r.id === id); if (r) return r; }
  return FLOORPLAN.exterior.find(r => r.id === id);
}
function roomPopup(roomId) {
  const room = findRoom(roomId);
  if (!room) return;
  /* expand entity list: wildcards from live states, notes passed through */
  const ents = [];
  for (const e of (room.entities ?? [])) {
    if (e.startsWith('(')) ents.push({ note: e.toUpperCase() });
    else if (e.endsWith('*')) Object.keys(HA.states)
      .filter(k => k.startsWith(e.slice(0, -1))).slice(0, 6).forEach(k => ents.push({ id: k }));
    else ents.push({ id: e });
  }
  const rows = ents.map(en => {
    if (en.note) return `<div class="rp-row"><span style="opacity:.55">${en.note}</span></div>`;
    const s = HA.st(en.id);
    const name = (s?.attributes?.friendly_name ?? en.id.split('.')[1].replace(/_/g, ' ')).toUpperCase();
    const domain = en.id.split('.')[0];
    const state = s ? String(s.state).toUpperCase() : 'NO DATA';
    let ctl = '';
    if (['light', 'switch', 'siren'].includes(domain))
      ctl = `<div class="rp-btn" data-toggle="${en.id}">TOGGLE</div>`;
    else if (domain === 'camera')
      ctl = `<div class="rp-btn" data-cam="${en.id}" data-name="${name}">OPEN FEED</div>`;
    else if (domain === 'media_player' && s?.attributes?.volume_level !== undefined)
      ctl = `<span class="v">VOL ${Math.round(s.attributes.volume_level * 100)}%</span>`;
    return `<div class="rp-row"><span>${name}</span>
      <span class="v">${state}${s?.attributes?.unit_of_measurement ? ' ' + s.attributes.unit_of_measurement : ''}</span>${ctl}</div>`;
  }).join('');
  const v = viewscreen('ROOM SYSTEMS · ' + room.label,
    `<div class="clb rp">${rows || '<div class="rp-row">NO SYSTEMS REGISTERED</div>'}</div>`,
    null, 'peri');                                 // HOME context = peri frame
  /* wire controls — sirens are REAL and LOUD: confirm before toggling one */
  v.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('pointerup', () => {
    const id = b.dataset.toggle;
    if (id.startsWith('siren.') && !b.dataset.armed) {
      b.dataset.armed = '1'; b.textContent = 'CONFIRM?'; b.style.background = 'var(--c-salmon)';
      setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = 'TOGGLE'; b.style.background = ''; } }, 4000);
      return;
    }
    HA.call('homeassistant', 'toggle', { entity_id: id });
    b.textContent = 'SENT';
    setTimeout(() => { if (b.isConnected) b.textContent = 'TOGGLE'; }, 1200);
  }));
  v.querySelectorAll('[data-cam]').forEach(b => b.addEventListener('pointerup', () =>
    camPopup(b.dataset.name, b.dataset.cam)));
}

/* geocoding: Nominatim (OpenStreetMap) — free, no key, fair-use rate.
   Returns {lat, lon, name} or null. Kiosk note: touch keyboard pops on focus. */
async function geocode(q) {
  try {
    const r = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(q));
    const j = await r.json();
    if (!j[0]) return null;
    return { lat: +j[0].lat, lon: +j[0].lon, name: j[0].display_name.split(',')[0].toUpperCase() };
  } catch { return null; }
}
/* LCARS sensor-target input: appends to host, calls onGo(query) on Enter/SCAN */
function searchBox(host, placeholder, onGo) {
  const d = document.createElement('div');
  d.className = 'lsearch';
  d.innerHTML = `<input placeholder="${placeholder}" spellcheck="false"><div class="go">SCAN</div>`;
  host.appendChild(d);
  const input = d.querySelector('input');
  const fire = () => { const q = input.value.trim(); if (q) onGo(q); };
  input.addEventListener('keydown', e => { if (e.key === 'Enter') fire(); });
  d.querySelector('.go').addEventListener('pointerup', fire);
  return d;
}

function renderWorkspace(scr, g, view, x0, y0, x1, y1) {
  const key = g.id + ':' + ((g.local ?? [])[view] ?? '');
  const cols = defs => wsCols(scr, x0, y0, x1, y1, defs);
  switch (key) {

    /* ---------------- ENVIRONMENTAL (absorbed LIGHTS 2026-07-10) ---------------- */
    case 'environ:LIGHTING': {
      const [dim, sw, st] = cols([['canary','DIMMERS'], ['peach','SWITCHES'], ['lilac','STATUS']]);
      buildDimmers(dim, [0, 1, 2, 3]);
      /* BACKYARD FLOOD = the first REAL control: light.toggle on a physical device */
      btns(scr, sw, [
        ['canary', 'BACKYARD FLOOD · ' + (DATA.floodOn ? 'ON' : 'OFF'),
          () => HA.call('light', 'toggle', { entity_id:'light.backyard_light' })],
        ['peri','ALL OFF'], ['lilac','SCENE · EVENING']]);
      st.innerHTML = `<div class="clb">BACKYARD FLOOD <span class="v">${DATA.floodOn ? 'ON' : 'OFF'}</span><br>
        POWER DRAW <span class="v">142 W</span><br>LAST EVENT <span class="v">KITCHEN 90%</span></div>`;
      break; }
    case 'environ:ATMOSPHERE': {
      const [cc, cs] = cols([['canary','CLIMATE CONTROL'], ['peri','COLD STORAGE']]);
      /* AC/thermostat: standby until climate entities exist in HA */
      cc.innerHTML = `<div class="clb" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%">
        <div class="standby">■ STANDBY</div>
        <div style="opacity:.6;margin-top:.6em">AWAITING CLIMATE ENTITIES · AC / THERMOSTAT INTEGRATION</div></div>`;
      /* cold storage = life support flavor on REAL refrigerator sensors */
      const rf = id => Math.round(HA.num('sensor.refrigerator_' + id, 0) * 10) / 10;
      cs.innerHTML = `<div class="clb">
        FRIDGE <span class="v">${rf('fridge_temperature') || 37}°F</span><br>
        FREEZER <span class="v">${rf('freezer_temperature') || 0}°F</span><br>
        POWER DRAW <span class="v">${rf('power') || '—'} W</span><br>
        ENERGY Δ <span class="v">${rf('energy_difference') || '—'} KWH</span></div>`;
      break; }
    case 'environ:SHUTTERS': {
      workspaceStandby(scr, x0, y0, x1, y1, g, 'SHUTTER CONTROL · AWAITING COVER ENTITIES (BLINDS)');
      break; }
    case 'environ:SCENES': {
      const [sc, inf] = cols([['canary','SCENE SELECT'], ['lilac','SCENE DETAIL']]);
      btns(scr, sc, [['lilac','EVENING'], ['magenta','MOVIE'], ['gold','GOODNIGHT'], ['peri','ALL OFF']]);
      inf.innerHTML = `<div class="clb">EVENING <span class="v">LIVING 40 · FOYER 25</span><br>
        MOVIE <span class="v">LIVING 12 · KITCHEN 0</span><br>GOODNIGHT <span class="v">ALL OFF · FLOOD AUTO</span><br>
        <span class="w">SCENES BUILD IN PHASE 2 (HA)</span></div>`;
      break; }

    /* ---------------- SECURITY ---------------- */
    case 'security:CAMERAS': {
      const panels = cols(DATA.cams.map(([n]) => ['salmon', n]));
      panels.forEach((p, i) => {
        const [name, entity, act] = DATA.cams[i];
        p.innerHTML =
          `<div class="cam" style="height:78%;margin:4%"><img class="camimg" alt=""><i class="scan"></i></div>
           <div class="clb" style="height:auto">LAST ACTIVITY <span class="v">${act}</span>${entity ? '' : ' · <span class="w">SIM</span>'}</div>`;
        if (!entity) return;                       // mock mode: scan line only
        const img = p.querySelector('.camimg');
        const refresh = async () => {              // signed still every 5s = live feed
          const u = await HA.cameraUrl(entity);
          if (u && img.isConnected) img.src = u;
        };
        refresh(); later(refresh, 5000);
        scr.onTap(p.querySelector('.cam'), () => camPopup(name, entity));
      });
      break; }
    case 'security:PERIMETER': {
      const [mo, si] = cols([['salmon','MOTION DETECTION'], ['peach','SIRENS · DETERRENT']]);
      btns(scr, mo, [['salmon','FRONT DOOR · ARMED'], ['salmon','BACKYARD · ARMED'], ['salmon','DOWNSTAIRS · ARMED']]);
      btns(scr, si, [['salmon','SIREN · DOWNSTAIRS'], ['salmon','SIREN · BACKYARD'], ['canary','FLOOD · DETERRENT']]);
      break; }
    case 'security:ALERTS': {
      const [al, log] = cols([['salmon','ALERT CONDITION · ' + alertLabel()], ['lilac','EVENT LOG']]);
      /* real: sets input_select.lcards_alert_mode → recolors the LCARdS UI too */
      const setAlert = opt => () => HA.call('input_select', 'select_option',
        { entity_id:'input_select.lcards_alert_mode', option: opt });
      btns(scr, al, [['salmon','◤ RED ALERT', setAlert('red_alert')],
        ['gold','YELLOW ALERT', setAlert('yellow_alert')],
        ['peri','STAND DOWN', setAlert('green_alert')]]);
      log.innerHTML = `<div class="clb">19:42 <span class="v">MOTION · BACKYARD</span><br>
        18:22 <span class="v">MOTION · FRONT DOOR</span><br>12:05 <span class="v">MOTION · DOWNSTAIRS</span><br>
        07:14 <span class="v">CONDITION GREEN · AUTO</span></div>`;
      break; }

    /* ---------------- SCIENCE ---------------- */
    case 'science:ATMOS': {
      const [now, fc] = cols([['lilac','ATMOSPHERIC · CURRENT'], ['peri','5-DAY FORECAST']]);
      const c = DATA.climate;
      now.innerHTML = `<div class="clb"><span class="bigval">${c.temp}°F</span><br><br>
        CONDITION <span class="v">${c.condition}</span> · HUMIDITY <span class="v">${c.humidity}%</span><br>
        WIND <span class="v">${c.wind} MPH</span><br><br>
        SUNRISE <span class="v">${c.sunrise}</span> · SUNSET <span class="v">${c.sunset}</span></div>`;
      /* forecast strip: LIVE via weather.get_forecasts (ha.js); mock fallback */
      const days = DATA.forecast ?? [
        { day:'SAT', cond:'CLEAR', hi:88, lo:66 }, { day:'SUN', cond:'P/CLOUDY', hi:84, lo:64 },
        { day:'MON', cond:'STORMS', hi:79, lo:63 }, { day:'TUE', cond:'CLEAR', hi:82, lo:61 },
        { day:'WED', cond:'CLEAR', hi:85, lo:63 }];
      fc.innerHTML = `<div class="clb" style="display:flex;gap:2%;align-items:stretch">` +
        days.map(d => `<div style="flex:1;text-align:center;border:1px solid #39415e;border-radius:4px;padding:4% 0">
          <span class="v">${d.day}</span><br><br>${d.cond}<br><br>
          <span class="bigval" style="font-size:calc(var(--u)*1.1)">${d.hi}°</span><br>${d.lo}°</div>`).join('') +
        `</div>` + (DATA.forecast ? '' : '<div class="clb" style="height:auto"><span class="w">SIMULATED</span></div>');
      break; }

    case 'science:SURVEY': {
      const geo = homeGeo();
      const wMap = Math.floor((x1 - x0) * 0.75 * 4) / 4;
      const [mapP] = wsCols(scr, x0, y0, x0 + wMap, y1, [['lilac','PLANETARY SURVEY · WINDY UPLINK']]);
      mapP.innerHTML = `<div class="feed"><iframe src="https://embed.windy.com/embed2.html?lat=${geo.lat}&lon=${geo.lon}&detailLat=${geo.lat}&detailLon=${geo.lon}&zoom=8&level=surface&overlay=radar&product=radar&menu=&message=&marker=&calendar=now&type=map&location=coordinates&metricWind=mph&metricTemp=%C2%B0F&radarRange=-1" loading="lazy"></iframe></div>`;
      const dx = x0 + wMap + GAP;
      const [ro] = wsCols(scr, dx, y0, x1, y1, [['peri','READOUT']]);
      ro.innerHTML = `<div class="clb">TARGET <span class="v" id="survey-target">RESIDENCE</span><br>
        OVERLAY <span class="v">RADAR</span><br>
        HUMIDITY <span class="v">${DATA.climate.humidity}%</span><br>WIND <span class="v">${DATA.climate.wind} MPH</span><br>
        CONDITION <span class="v">${DATA.climate.condition}</span>
        <span id="survey-status" class="w"></span></div>`;
      /* sensor retarget: geocode → rebuild the Windy iframe at the new coords */
      searchBox(ro.querySelector('.clb'), 'SENSOR TARGET…', async q => {
        document.getElementById('survey-status').textContent = ' SCANNING…';
        const g = await geocode(q);
        document.getElementById('survey-status').textContent = g ? '' : ' NO CONTACT';
        if (!g) return;
        document.getElementById('survey-target').textContent = g.name;
        mapP.querySelector('iframe').src =
          `https://embed.windy.com/embed2.html?lat=${g.lat}&lon=${g.lon}&detailLat=${g.lat}&detailLon=${g.lon}&zoom=8&level=surface&overlay=radar&product=radar&menu=&message=&marker=&calendar=now&type=map&location=coordinates&metricWind=mph&metricTemp=%C2%B0F&radarRange=-1`;
      });
      break; }

    case 'science:ORBITAL': {
      const wMap = Math.floor((x1 - x0) * 0.62 * 4) / 4;
      const [orb] = wsCols(scr, x0, y0, x0 + wMap, y1, [['lilac','ORBITAL PLOT · SOL SYSTEM · REAL-TIME']]);
      const C = k => getComputedStyle(document.documentElement).getPropertyValue('--c-' + k).trim();
      const R = d => 28 + 62 * Math.log10(1 + d * 3) / Math.log10(1 + 9.6 * 3);
      let svg = `<circle cx="150" cy="105" r="6" fill="${C('gold')}"><animate attributeName="opacity" values="1;.6;1" dur="4s" repeatCount="indefinite"/></circle>`;
      planetAngles().forEach(pl => {
        const r = R(pl.dist), px = 150 + r * Math.cos(-pl.lon), py = 105 + r * Math.sin(-pl.lon);
        svg += `<circle cx="150" cy="105" r="${r}" fill="none" stroke="${C('peri')}" stroke-width="0.4" opacity="0.5"/>
          <g data-planet="${pl.name}" style="cursor:pointer">
          <circle cx="${px}" cy="${py}" r="${pl.r + 4}" fill="transparent"/>
          <circle cx="${px}" cy="${py}" r="${pl.r}" fill="${C(pl.color)}"/>
          <text x="${px + 5}" y="${py + 2}" font-size="5.5" fill="${C('lilac')}" font-family="Antonio" letter-spacing="1">${pl.name}</text></g>`;
      });
      orb.innerHTML = `<div class="feed" style="border-color:transparent"><svg viewBox="0 0 300 210" style="width:100%;height:100%">${svg}</svg></div>`;
      /* planet tap → NASA Eyes viewscreen popup (the locked design) */
      orb.querySelectorAll('[data-planet]').forEach(el =>
        el.addEventListener('pointerup', () => {
          const n = el.dataset.planet.toLowerCase();
          viewscreen('VIEWSCREEN · ' + el.dataset.planet + ' · JPL EYES UPLINK',
            `<iframe src="https://eyes.nasa.gov/apps/solar-system/#/${n}?embed=true&logo=false" loading="lazy" allow="fullscreen"></iframe>`);
        }));
      const dx = x0 + wMap + GAP, m = moonPhase();
      const [luna] = wsCols(scr, dx, y0, x1, y1, [['peri','LUNA']]);
      const ew = Math.abs(Math.cos(2 * Math.PI * m.f)) * 40, waxing = m.f < 0.5;
      luna.innerHTML = `<div class="clb" style="text-align:center">
        <svg viewBox="0 0 100 100" style="width:52%;margin-top:3%">
          <circle cx="50" cy="50" r="40" fill="#1a1d28"/>
          <path d="M50 10 A40 40 0 0 ${waxing ? 1 : 0} 50 90 Z" fill="#e8e4d8"/>
          <ellipse cx="50" cy="50" rx="${ew}" ry="40" fill="${(m.f > 0.25 && m.f < 0.75) ? '#e8e4d8' : '#1a1d28'}"/>
        </svg><br><span class="v" style="font-size:calc(var(--u)*0.55)">${m.name}</span><br><br>
        ILLUMINATION <span class="v">${m.illum}%</span><br>
        FULL MOON <span class="v">${m.toFull.toFixed(1)} DAYS</span><br>
        NEW MOON <span class="v">${m.toNew.toFixed(1)} DAYS</span></div>`;
      break; }

    case 'science:GEO': {
      const geo = homeGeo();
      const wMap = Math.floor((x1 - x0) * 0.78 * 4) / 4;
      const [mapP] = wsCols(scr, x0, y0, x0 + wMap, y1, [['lilac','GEOSPATIAL · 3D GLOBE']]);
      mapP.innerHTML = `<div class="feed"><div id="cesium-host" style="position:absolute;inset:0">
        <div class="clb" style="text-align:center;padding-top:20%">■ INITIALIZING GLOBE…</div></div></div>`;
      /* Cesium lazy-load: ~10MB, only when GEO opens. HD 520 kiosk budget:
         requestRenderMode (render on demand), no ion token (Esri imagery). */
      loadScript('https://cesium.com/downloads/cesiumjs/releases/1.119/Build/Cesium/Cesium.js',
                 'https://cesium.com/downloads/cesiumjs/releases/1.119/Build/Cesium/Widgets/widgets.css')
        .then(async () => {
          const host = document.getElementById('cesium-host');
          if (!host) return;                      // user navigated away mid-load
          host.innerHTML = '';
          const imagery = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
            'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer');
          const viewer = geoViewer = new Cesium.Viewer(host, {
            baseLayer: new Cesium.ImageryLayer(imagery),
            baseLayerPicker:false, geocoder:false, timeline:false, animation:false,
            homeButton:false, sceneModePicker:false, navigationHelpButton:false,
            fullscreenButton:false, infoBox:false, selectionIndicator:false,
            requestRenderMode:true, maximumRenderTimeChange:Infinity,
          });
          viewer.scene.globe.enableLighting = true;     // day/night terminator — very MSD
          /* requestRenderMode gotcha: async imagery tiles do NOT trigger renders —
             hook tile progress so the globe paints as tiles land, then stays idle */
          viewer.scene.globe.tileLoadProgressEvent.addEventListener(() => viewer.scene.requestRender());
          viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(geo.lon, geo.lat, 15000000) });
        }).catch(() => {
          const host = document.getElementById('cesium-host');
          if (host) host.innerHTML = '<div class="clb" style="text-align:center;padding-top:20%">GLOBE UPLINK FAILED · CDN UNREACHABLE</div>';
        });
      const dx = x0 + wMap + GAP;
      const [tg] = wsCols(scr, dx, y0, x1, y1, [['peri','TARGETING']]);
      tg.innerHTML = `<div class="clb">TARGET <span class="v" id="geo-target">RESIDENCE</span><br>
        LAT <span class="v" id="geo-lat">${geo.lat.toFixed(3)}</span><br>
        LON <span class="v" id="geo-lon">${geo.lon.toFixed(3)}</span><br>
        LIGHTING <span class="v">DAY/NIGHT LIVE</span>
        <span id="geo-status" class="w"></span></div>`;
      /* sensor retarget: geocode → fly the globe there in place (no re-render,
         the Cesium viewer survives; flyTo triggers renders in requestRenderMode) */
      searchBox(tg.querySelector('.clb'), 'SENSOR TARGET…', async q => {
        document.getElementById('geo-status').textContent = ' SCANNING…';
        const g = await geocode(q);
        document.getElementById('geo-status').textContent = g ? '' : ' NO CONTACT';
        if (!g || !geoViewer) return;
        document.getElementById('geo-target').textContent = g.name;
        document.getElementById('geo-lat').textContent = g.lat.toFixed(3);
        document.getElementById('geo-lon').textContent = g.lon.toFixed(3);
        geoViewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(g.lon, g.lat, 400000) });
      });
      break; }

    /* ---------------- MEDIA ---------------- */
    case 'media:PLAYERS': {
      const [pl] = cols([['magenta','AUDIO PLAYERS']]);
      pl.innerHTML = `<div class="clb">` + DATA.media
        .map(([n, s, v]) => `<div class="mb"><div class="k" style="width:calc(var(--u)*6)">${n}</div>
          <div class="t"><i style="width:${v * 9}%"></i></div><div class="n">${v}</div>
          <div style="width:calc(var(--u)*4);text-align:right;color:var(--c-orange)">${s.toUpperCase()}</div></div>`).join('') + `</div>`;
      break; }
    case 'media:ANNOUNCE': {
      const [an, st] = cols([['magenta','SHIP-WIDE ANNOUNCE'], ['lilac','VOICE']]);
      btns(scr, an, [['magenta','ALL DECKS'], ['magenta','DECK 01 · MAIN'], ['magenta','DECK 02 · UPPER']]);
      st.innerHTML = `<div class="clb">VOICE <span class="v">MAJEL</span><br>TTS <span class="w">AWAITING VOICE LAB</span><br>
        MIC <span class="v">${LCARS.settings.get('micMute', false) ? 'MUTED' : 'LIVE'}</span></div>`;
      break; }
    case 'media:VOLUME': {
      const [vol] = cols([['magenta','VOLUME · ALL DEVICES']]);
      vol.innerHTML = `<div class="clb">` + [['MASTER AUDIO',50], ['DOWNSTAIRS',55], ['EVERYWHERE',45], ['BEDROOM · P',36], ['IZZY’S ROOM',27]]
        .map(([n, v]) => `<div class="mb"><div class="k" style="width:calc(var(--u)*6)">${n}</div>
          <div class="t"><i style="width:${v}%;background:var(--c-magenta)"></i></div><div class="n">${v}</div></div>`).join('') + `</div>`;
      break; }

    /* ---------------- HOME ---------------- */
    case 'home:MSD': {
      scr.shape(x0, y0, x1 - x0, 1.1, { capRight:true, color:g.color });
      scr.text(x0 + 0.5, y0, 24, 1.1, 'RESIDENCE · MASTER SYSTEMS DISPLAY', { fs:'sub', color:'black', weight:600 });
      const p = scr.panel(x0, y0 + 1.35, x1 - x0, y1 - y0 - 1.35);
      p.style.padding = scr.U(0.5) + 'px';
      renderMSD(p, k => getComputedStyle(document.documentElement).getPropertyValue(k).trim());
      p.querySelectorAll('[data-room]').forEach(el => el.addEventListener('pointerup', () => {
        el.animate([{opacity:1},{opacity:.3},{opacity:1}], {duration:220});
        roomPopup(el.dataset.room);              // live entity panel for the room
      }));
      break; }
    case 'home:CALENDAR': {
      const [today, next] = cols([['peri','TODAY'], ['lilac','UPCOMING']]);
      today.innerHTML = `<div class="clb">14:00 <span class="v">STANDUP</span><br>18:30 <span class="v">FILM SESSION</span></div>`;
      next.innerHTML = `<div class="clb">SAT 10:00 <span class="v">3D PRINT · BRACKET BATCH</span><br>
        SUN 13:00 <span class="v">HOME LAB · OPNSENSE PREP</span><br>MON 09:00 <span class="v">STANDUP</span></div>`;
      break; }
    case 'home:ROUTINES': {
      const [rt, cats] = cols([['peri','ALEXA ROUTINES'], ['lilac','FELINE SYSTEMS']]);
      btns(scr, rt, [['peri','GOOD NIGHT'], ['peri','I’M HOME'], ['peri','KICK OFF MY DAY'], ['peri','SLEEPY TIME']]);
      /* feline systems: live litter-robot + cat sensors (mock values as fallbacks).
         Round numeric states — sensors report floats like 72.6027397260274 */
      const cat = (id, d) => { const v = HA.st(id)?.state ?? d;
        const n = parseFloat(v); return isNaN(n) ? v : Math.round(n * 10) / 10; };
      cats.innerHTML = `<div class="clb">
        MELIA <span class="v">${cat('sensor.melia_visits_today','3')} VISITS · ${cat('sensor.melia_weight','9.2')} LB</span><br>
        PEACHY <span class="v">${cat('sensor.peachy_visits_today','5')} VISITS · ${cat('sensor.peachy_weight','11.4')} LB</span><br>
        LITTER <span class="v">${cat('sensor.litter_robot_4_litter_level','62')}%</span> ·
        DRAWER <span class="v">${cat('sensor.litter_robot_4_waste_drawer','41')}%</span><br>
        STATUS <span class="v">${(HA.st('vacuum.litter_robot_4_litter_box')?.state ?? 'READY').toUpperCase()}</span></div>`;
      break; }

    /* ---------------- CORE ---------------- */
    case 'core:FRED': {
      const [g1, al] = cols([['peach','FRED · WARP CORE'], ['salmon','ALARMS']]);
      g1.innerHTML = `<div class="clb">` + [['CPU',34], ['MEMORY',61], ['LOAD',28], ['DISK I/O',12]]
        .map(([n, v]) => `<div class="mb"><div class="k" style="width:calc(var(--u)*4.5)">${n}</div>
          <div class="t"><i style="width:${v}%;background:var(--c-peach)"></i></div><div class="n">${v}</div></div>`).join('') + `</div>`;
      al.innerHTML = `<div class="clb"><span class="w">1 ACTIVE</span> · SMART WARN · SDB<br><br>
        BACKUP <span class="v">OK · 03:00</span><br>UPTIME <span class="v">21 DAYS</span></div>`;
      break; }
    case 'core:NETWORK': {
      const [wan, lan] = cols([['peach','WAN · SUBSPACE LINK'], ['peri','LAN']]);
      wan.innerHTML = `<div class="clb">STATUS <span class="v">ONLINE</span><br>IP <span class="v">73.—.—.—</span><br>
        DOWN <span class="v">842 MBPS</span> · UP <span class="v">38 MBPS</span></div>`;
      lan.innerHTML = `<div class="clb">GATEWAY <span class="v">XFINITY (OPNSENSE PENDING)</span><br>
        HAOS <span class="v">10.0.0.149</span> · PORTAINER <span class="v">10.0.0.77</span><br>
        NTOPNG <span class="w">PHASE 2</span></div>`;
      break; }
    case 'core:UPDATES': {
      const [up] = cols([['peach','SOFTWARE UPDATES']]);
      /* live: enumerate update.* entities — state 'on' means an update waits */
      const updates = Object.entries(HA.states)
        .filter(([k]) => k.startsWith('update.')).slice(0, 10)
        .map(([k, s]) => {
          const name = (s.attributes?.friendly_name ?? k.split('.')[1].replace(/_/g, ' '))
            .replace(/ update$/i, '').toUpperCase();
          return `${name} ${s.state === 'on'
            ? `<span class="w">UPDATE AVAILABLE${s.attributes?.latest_version ? ' · ' + s.attributes.latest_version : ''}</span>`
            : '<span class="v">UP TO DATE</span>'}`;
        });
      up.innerHTML = `<div class="clb">${updates.length
        ? updates.join('<br>') : 'NO UPDATE ENTITIES · <span class="w">SIMULATED</span>'}</div>`;
      break; }

    default: workspaceStandby(scr, x0, y0, x1, y1, g);
  }
}

/* ============================ BOOT SEQUENCE ============================
   First-load choreography (intro2 vibe): the frame draws itself in — top bar
   sweeps left→right, rail runs top→bottom, console closes the loop — while
   "LCARS COMPUTER ACCESS" types out; then the work area populates in reading
   order. ~2.8s total. ANY TAP SKIPS to the finished state (kiosk-friendly).
   Geometry-driven delays: every placed element carries data-ux/uy from the
   grid engine, so choreography needs no per-element tagging. */
let bootUntil = 0;   // HA's first full render waits for the boot to finish
function playBoot(scr) {
  bootUntil = performance.now() + 3400;
  const anims = [];
  const uh = scr.uh;
  const delayFor = el => {
    const x = +el.dataset.ux, y = +el.dataset.uy;
    if (y < 1.05)        return 150 + x * 8;          // top bar: sweep L→R
    if (x < 0.05)        return 500 + y * 22;         // rail + elbows: top→bottom
    if (y > uh - 4.6)    return 1050 + x * 6;         // console bar: close the frame
    return 1550 + y * 26 + x * 8;                     // content: reading order
  };
  [...root.children].filter(el => el.dataset.ux !== undefined).forEach(el =>
    anims.push(el.animate([{ opacity: 0 }, { opacity: 1 }],
      { delay: delayFor(el), duration: 170, fill: 'backwards', easing: 'ease-out' })));

  /* typed announcement, top-right over the black work area */
  const ov = document.createElement('div');
  ov.className = 'boot-ov';
  ov.innerHTML = '<div id="boot-l1"></div><div id="boot-l2"></div>';
  root.appendChild(ov);
  /* WALL-CLOCK typing: chars derive from elapsed time, not tick count.
     WHY: background tabs clamp setInterval to 1s ticks; WAAPI keeps real
     time. Deriving from performance.now() keeps text and frame in sync no
     matter how the timers are throttled. */
  let typers = [];
  const typeAt = (el, html, t0, done) => {     // t0 = when typing starts (may be future)
    const plain = html.replace(/<[^>]*>/g, '');
    const t = setInterval(() => {
      const n = Math.floor((performance.now() - t0) / 26);
      if (n <= 0) return;
      if (n >= plain.length) { clearInterval(t); el.innerHTML = html; done?.(); }
      else el.textContent = plain.slice(0, n) + '▌';
    }, 26);
    typers.push(t);
  };
  typeAt(document.getElementById('boot-l1'), 'LCARS COMPUTER ACCESS 47-2210',
    performance.now() + 250, () =>
      typeAt(document.getElementById('boot-l2'),
        'COMMAND INTERFACE READY <b style="color:#fff">· ONLINE</b>',
        performance.now() + 350, () => setTimeout(finish, 900)));

  let finished = false;
  function finish() {                          // also the skip target
    if (finished) return; finished = true;
    bootUntil = performance.now();             // unblock any waiting live render
    typers.forEach(clearInterval);
    anims.forEach(a => a.finish());
    ov.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, fill: 'forwards' })
      .onfinish = () => ov.remove();
    removeEventListener('pointerdown', finish, true);
  }
  addEventListener('pointerdown', finish, true);   // tap = skip
  /* sound hook: boot chirp goes here when the sound pack lands (settings.beeps) */
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
    /* Media ladder (best available wins, saver never shows a broken icon):
       1. assets/ufp_spin.mp4 — Patrick's 3D-render clip (he supplies via
          yt-dlp; see PROJECT_MEMORY). 2. assets/FedSign.gif (local, approved
          download). 3. text fallback. Muted autoplay is allowed by Chrome. */
    d.innerHTML = `
      <div id="saver-fallback" style="display:none" class="saver-fb">UNITED FEDERATION OF PLANETS</div>
      <div class="saver-clk" id="saver-clk"></div>`;
    /* preflight with HEAD requests — <video> error events are unreliable on
       404s (python http.server leaves it stuck in NETWORK_LOADING forever) */
    (async () => {
      const exists = async url => {
        try { return (await fetch(url, { method:'HEAD' })).ok; } catch { return false; }
      };
      if (await exists('assets/ufp_spin.mp4')) {
        const vid = document.createElement('video');
        Object.assign(vid, { src:'assets/ufp_spin.mp4', autoplay:true, muted:true, loop:true, playsInline:true });
        d.prepend(vid);
      } else if (await exists('assets/FedSign.gif')) {
        const img = new Image(); img.src = 'assets/FedSign.gif'; d.prepend(img);
      } else {
        document.getElementById('saver-fallback').style.display = 'block';
      }
    })();
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

/* placeholder workspace — still animated, still LCARS */
function workspaceStandby(scr, x0, y0, x1, y1, g, msg) {
  scr.shape(x0, y0, x1 - x0, 1.1, { capRight:true, color:g.color });
  scr.text(x0 + 0.5, y0, 20, 1.1, g.label + ' · SYSTEMS', { fs:'sub', color:'black', weight:600 });
  const p = scr.panel(x0, y0 + 1.35, x1 - x0, y1 - y0 - 1.35);
  p.innerHTML = `<div class="clb" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%">
    <div class="standby">■ STANDBY</div>
    <div style="opacity:.6;margin-top:.6em">${msg ?? 'WORKSPACE PENDING · CONTENT BUILD SCHEDULED'}</div></div>`;
  scr.breathe(p.querySelector('.standby'), { soft:true });
}

/* ---- cheap live patches (no re-render): always-visible ids only.
   Everything else refreshes naturally — navigation re-renders constantly. */
function patchLive() {
  const c = document.getElementById('cpu-i'), m = document.getElementById('mem-i');
  if (c) { c.style.width = DATA.core.cpu + '%'; document.getElementById('cpu-n').textContent = Math.round(DATA.core.cpu); }
  if (m) { m.style.width = DATA.core.mem + '%'; document.getElementById('mem-n').textContent = DATA.core.memLabel ?? Math.round(DATA.core.mem); }
}

/* ---- ALERT CONDITION visuals: the whole terminal answers the klaxon ----
   Red/yellow = temporary SYSTEM palette (never saved) + pulsing vignette.
   Stand-down restores the user's chosen palette. Driven LIVE from
   input_select.lcards_alert_mode — any dashboard, automation, or siren
   that changes it changes THIS terminal too. */
let shownAlert = 'green_alert';
function applyAlert(mode) {
  if (mode === shownAlert) return;
  shownAlert = mode;
  document.getElementById('alert-overlay')?.remove();
  if (mode === 'red_alert' || mode === 'yellow_alert') {
    LCARS.setPalette(mode === 'red_alert' ? 'redalert' : 'yellowalert');
    const o = document.createElement('div');
    o.id = 'alert-overlay';
    o.className = mode === 'red_alert' ? 'alert-red' : 'alert-yellow';
    document.body.appendChild(o);
  } else {
    LCARS.setPalette(LCARS.settings.get('palette', 'tng'));   // stand down → user's palette
  }
  setTimeout(render, Math.max(0, bootUntil - performance.now()));
}

/* ---- HA hookup: full render once live data lands (after boot finishes),
   targeted patches for every state_changed after that ---- */
HA.init(DATA,
  full => {
    if (full) setTimeout(render, Math.max(0, bootUntil - performance.now()));
    else patchLive();
  },
  () => {                                       // connection status flip → re-render chrome
    if (performance.now() > bootUntil) render();
  },
  applyAlert);

render();
addEventListener('resize', () => render());
