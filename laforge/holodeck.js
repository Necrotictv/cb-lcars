/* ============================================================================
   PROJECT LaFORGE — HOLODECK (theatrical consoles; see HOLODECK_BUILD_LOG.md)
   ----------------------------------------------------------------------------
   Everything here is SIMULATION: no real devices, no house alert entity.
   Room-effect hooks call HA scripts (script.laforge_*_fx) IF they exist;
   otherwise the console shows "FX: LOCAL ONLY". Rail-button access (not a
   7th cluster — the 3×2 stays sacred).
   ============================================================================ */
'use strict';

const HOLOGROUP = { id:'holodeck', label:'HOLODECK', color:'gold',
  local:['TRANSPORTER','WARP CORE','MSD','TACTICAL'] };

/* ============================ TRANSPORTER ============================
   Rebuilt 2026-07-12 to Patrick's reference gif: the THREE-TRACK touch-slider
   sweep IS the console. Drag all three tracks up past 85% → energize.
   Multitouch: each track captures its own pointer (three fingers works).
   Room effects fire through the assignable hook `holo.energize` (SYSTEMS →
   ROUTINE ASSIGNMENTS) — Patrick's IoT handles the physical transporter. */
function holoTransporter(scr, x0, y0, x1, y1) {
  /* proportional split: chamber 42% / console 58% — the three-track console
     is the star of the reference gif and must never be starved by window size */
  const mid = y0 + Math.floor((y1 - y0) * 0.42 * 4) / 4;

  /* upper: transport chamber (pads) */
  const [pad] = wsCols(scr, x0, y0, x1, mid - 0.25, [['gold','TRANSPORT CHAMBER']]);
  pad.innerHTML = `<div class="tr-room" style="padding-bottom:calc(var(--u)*1.6)">
    ${[0,1,2].map(i => `<div class="tr-pad" data-i="${i}"><div class="tr-disc"></div><div class="tr-col"></div></div>`).join('')}
    <div class="tr-status" id="tr-status">STANDING BY</div></div>`;

  /* lower: operations console — elbow-framed deck, three touch tracks center */
  const cy = mid + 0.25;
  scr.elbow(x0, cy, { corner:'tl', tv:1, th:0.75, ro:0.75, ri:0.4, w:2.5, h:2.5, color:'gold' });
  scr.bar(x0 + 2.5, cy, (x1 - x0) - 4.25, 0.75, 'gold', { left:true });
  scr.shape(x1 - 1.5, cy, 1.5, 0.75, { capRight:true, color:'peach' });
  scr.text(x0 + 2.75, cy, 14, 0.75, 'OPERATIONS · MOLECULAR IMAGING', { fs:'data', color:'black', weight:700 });
  scr.bar(x0, cy + 2.5, 1, (y1 - cy) - 2.5, 'gold', { top:true });   // elbow rail continues
  const deck = scr.panel(x0 + 1.25, cy + 1, x1 - x0 - 1.25, y1 - cy - 1);
  deck.innerHTML = `
    <div class="tc-deck">
      <div class="tc-cluster">
        <div class="tc-blk" data-fn="scan" style="background:var(--c-peri)">SCAN</div>
        <div class="tc-blk" data-fn="buffer" style="background:var(--c-lilac)">BUFFER</div>
        <div class="tc-blk tc-blink" style="background:var(--c-salmon)">784</div>
        <div class="tc-blk tc-blink2" style="background:var(--c-peach)">211</div>
      </div>
      <div class="tc-tracks">
        ${[0,1,2].map(i => `<div class="tc-track" data-t="${i}"><div class="tc-fill"></div><div class="tc-grip"></div></div>`).join('')}
      </div>
      <div class="tc-cluster">
        <div class="tc-blk tc-blink2" style="background:var(--c-canary)">SYNC</div>
        <div class="tc-blk tc-blink" style="background:var(--c-peri)">043</div>
        <div class="tc-readout" id="tc-read">TRACKS 0%·0%·0%</div>
      </div>
    </div>`;

  const vals = [0, 0, 0]; let locked = false;
  const tracks = [...deck.querySelectorAll('.tc-track')];
  const readout = deck.querySelector('#tc-read');
  const paint = i => {
    const t = tracks[i], pct = Math.round(vals[i] * 100);
    t.querySelector('.tc-fill').style.height = pct + '%';
    t.querySelector('.tc-grip').style.bottom = pct + '%';
    readout.textContent = 'TRACKS ' + vals.map(v => Math.round(v * 100) + '%').join('·');
  };
  function energize() {
    locked = true;
    SFX.play('energize'); setTimeout(() => SFX.play('shimmer'), 500);
    fireHook('holo.energize');                              // Patrick's IoT routine
    const st = document.getElementById('tr-status');
    st.textContent = 'ENERGIZING…';
    tracks.forEach(t => t.classList.add('tc-lock'));
    pad.querySelectorAll('.tr-pad').forEach((p, i) => setTimeout(() => p.classList.add('tr-active'), 300 + i * 180));
    setTimeout(() => st.textContent = 'PATTERN DEMATERIALIZED', 2800);
    setTimeout(() => {
      pad.querySelectorAll('.tr-pad').forEach(p => p.classList.remove('tr-active'));
      st.textContent = 'TRANSPORT COMPLETE'; SFX.play('chirp');
      tracks.forEach(t => t.classList.remove('tc-lock'));
      vals.fill(0); [0,1,2].forEach(paint);
      setTimeout(() => { st.textContent = 'STANDING BY'; locked = false; }, 1800);
    }, 5200);
  }
  tracks.forEach((t, i) => {
    const set = e => {
      if (locked) return;
      const r = t.getBoundingClientRect();
      vals[i] = Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height));
      paint(i);
      if (vals.every(v => v >= 0.85)) energize();
    };
    t.addEventListener('pointerdown', e => { t.setPointerCapture(e.pointerId); set(e); t.onpointermove = set; });
    const drop = () => { t.onpointermove = null;
      if (!locked && vals[i] < 0.85) {                       // decay if not committed
        const decay = setInterval(() => { vals[i] = Math.max(0, vals[i] - 0.06); paint(i);
          if (vals[i] <= 0) clearInterval(decay); }, 40); } };
    t.addEventListener('pointerup', drop); t.addEventListener('pointercancel', drop);
  });
  deck.querySelectorAll('[data-fn]').forEach(b => scr.onTap(b, () => {
    SFX.play('beep');
    const st = document.getElementById('tr-status');
    st.textContent = b.dataset.fn === 'scan' ? 'TARGETING SCANNERS SWEEPING' : 'PATTERN BUFFER CYCLED';
    setTimeout(() => { if (!locked) st.textContent = 'STANDING BY'; }, 2200);
  }));
}

/* ============================ WARP CORE + BREACH GAME ============================ */
const INCIDENTS = [   // [alarm text, correct action id, flavor on success]
  ['COOLANT LEAK — EPS MANIFOLD 4',        'vent',    'PLASMA VENTED · PRESSURE NOMINAL'],
  ['CASCADE OVERLOAD — DILITHIUM MATRIX',  'realign', 'MATRIX REALIGNED · RESONANCE STABLE'],
  ['ANTIMATTER INJECTOR FLARE',            'flow',    'FLOW REBALANCED · REACTION STABLE'],
  ['CORE BREACH IMMINENT',                 'eject',   'CORE EJECTED · SHIP SAFE'],
];
let game = null;   // { correct, deadline, timer }

function holoWarpCore(scr, x0, y0, x1, y1) {
  const wCore = Math.floor((x1 - x0) * 0.3 * 4) / 4;
  const [core] = wsCols(scr, x0, y0, x0 + wCore, y1, [['gold','WARP CORE']]);
  /* Patrick's warp core animation (assets/warpcore.gif); CSS shaft = fallback */
  core.innerHTML = `<div class="wc">
    <div class="wc-shaft"><img class="wc-gif" src="assets/warpcore.gif" alt=""
      onerror="this.remove();this.parentElement.innerHTML=Array.from({length:9},(_,i)=>'<div class=wc-seg style=animation-delay:'+(i*0.14)+'s></div>').join('')">
    </div><div class="wc-label" id="wc-label">MATTER / ANTIMATTER REACTION STABLE</div></div>`;

  const cx = x0 + wCore + GAP, wCtl = Math.floor((x1 - cx) * 0.55 * 4) / 4;
  const [flows] = wsCols(scr, cx, y0, cx + wCtl, y1, [['peach','FLOW REGULATION']]);
  flows.innerHTML = `<div class="clb">
    <div class="mb"><div class="k" style="width:calc(var(--u)*5)">MATTER</div>
      <div class="t"><i id="wc-m" style="width:64%;background:var(--c-peri)"></i></div><div class="n">64</div></div>
    <div class="mb"><div class="k" style="width:calc(var(--u)*5)">ANTIMATTER</div>
      <div class="t"><i id="wc-am" style="width:64%;background:var(--c-salmon)"></i></div><div class="n">64</div></div>
    <div class="mb"><div class="k" style="width:calc(var(--u)*5)">DILITHIUM</div>
      <div class="t"><i id="wc-d" style="width:91%;background:var(--c-lilac)"></i></div><div class="n">91</div></div>
    <div id="wc-alarm" class="wc-alarm"></div></div>`;

  const bx = cx + wCtl + GAP;
  const [ops] = wsCols(scr, bx, y0, x1, y1, [['salmon','CORE OPERATIONS']]);
  ops.innerHTML = `<div class="btncol">
    <div class="wbtn" data-act="flow"    style="background:var(--c-peri)">REBALANCE FLOWS</div>
    <div class="wbtn" data-act="realign" style="background:var(--c-lilac)">REALIGN DILITHIUM</div>
    <div class="wbtn" data-act="vent"    style="background:var(--c-canary)">VENT WARP PLASMA</div>
    <div class="wbtn" data-act="eject"   style="background:var(--c-salmon)">⚠ EJECT CORE</div>
    <div class="wbtn" data-act="recover" style="background:var(--c-peach)">RECOVER CORE</div>
    <div class="wbtn" id="wc-sim" style="background:var(--c-gold)">▶ SIMULATION · BEGIN</div></div>`;

  const shaft = core.querySelector('.wc-shaft'), label = document.getElementById('wc-label');
  const alarmEl = document.getElementById('wc-alarm');
  let ejected = false, armed = false;

  function endGame(win, msg) {
    clearInterval(game?.timer); game = null;
    document.getElementById('holo-red')?.remove();
    alarmEl.innerHTML = '';
    if (win) { SFX.play('chirp'); fireHook('holo.breach.win'); label.textContent = msg; }
    else {   /* the ship is lost — say it with theatre */
      SFX.play('torpedo'); fireHook('holo.breach.fail');
      const d = document.createElement('div');
      d.className = 'wc-lost'; d.innerHTML = '<div>SHIP LOST</div><div class="wc-lost-sub">SIMULATION FAILED · ' + msg + '</div>';
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 4200);
      label.textContent = 'SIMULATION RESET';
    }
    setTimeout(() => { if (!game) label.textContent = 'MATTER / ANTIMATTER REACTION STABLE'; }, 4200);
  }

  function act(a) {
    SFX.play('beep');
    if (a === 'eject' && !armed && !game) {   // 2-tap confirm outside the game (in-game: seconds count, fire straight)
      armed = true; const b = ops.querySelector('[data-act="eject"]');
      b.textContent = 'CONFIRM EJECT?'; SFX.play('alarm');
      setTimeout(() => { armed = false; b.textContent = '⚠ EJECT CORE'; }, 4000);
      return;
    }
    if (game) {                                // GAME: was that the right call?
      if (a === game.correct) endGame(true, game.success);
      else { SFX.play('deny'); alarmEl.innerHTML += '<br><span class="w">WRONG ACTION — CRISIS WORSENS</span>';
             game.deadline -= 5000; }          // punish: 5s off the clock
      return;
    }
    if (a === 'eject')  { ejected = true; armed = false; SFX.play('eject'); shaft.classList.add('wc-dark');
                          label.textContent = 'CORE EJECTED — AUXILIARY POWER'; }
    if (a === 'recover'){ if (!ejected) return SFX.play('deny');
                          ejected = false; SFX.play('powerup'); shaft.classList.remove('wc-dark');
                          label.textContent = 'CORE RECOVERED — REACTION RESTARTED'; }
    if (a === 'vent')   { label.textContent = 'VENTING WARP PLASMA…'; noiseFlash(); }
    if (a === 'realign'){ label.textContent = 'DILITHIUM MATRIX REALIGNED'; }
    if (a === 'flow')   { label.textContent = 'FLOWS REBALANCED 64/64'; }
  }
  const noiseFlash = () => { const s = document.getElementById('wc-d'); if (s) s.style.width = '96%'; };

  ops.querySelectorAll('[data-act]').forEach(b => scr.onTap(b, () => act(b.dataset.act)));

  scr.onTap(ops.querySelector('#wc-sim'), () => {
    if (game) return;
    const inc = INCIDENTS[Math.floor(Math.random() * INCIDENTS.length)];
    game = { correct: inc[1], success: inc[2], deadline: Date.now() + 20000 };
    SFX.play('klaxon');
    fireHook('holo.breach.start');             // assignable room drama (SYSTEMS → ROUTINES)
    const red = document.createElement('div'); // LOCAL red wash — NOT the house alert entity
    red.id = 'holo-red'; document.body.appendChild(red);
    label.textContent = '⚠ ' + inc[0];
    game.timer = setInterval(() => {           // wall-clock countdown (background-tab safe)
      const left = Math.max(0, Math.ceil((game.deadline - Date.now()) / 1000));
      alarmEl.innerHTML = `<span class="w">⚠ ${inc[0]}</span><br>TIME TO BREACH <span class="w">${left}S</span>` +
        (alarmEl.innerHTML.includes('WRONG') ? '<br><span class="w">WRONG ACTION — CRISIS WORSENS</span>' : '');
      if (left <= 5) SFX.play('alarm');
      if (left <= 0) endGame(false, inc[0]);
    }, 500);
  });
}

/* ============================ MSD (ship schematics) ============================
   Patrick-supplied cutaway images (Tim Davies MSDs, assets/msd_*.jpg).
   spots = tappable systems as image-percentage coordinates — NUDGE THESE
   by editing x/y if a dot sits off its system. */
const SHIPS = {
  'ENTERPRISE-D': { img:'assets/msd_galaxy.jpg', spots:[
    { sys:'bridge', x:66, y:21 }, { sys:'core', x:34, y:53 },
    { sys:'deflector', x:44, y:56 }, { sys:'nacelles', x:14, y:44 } ] },
  'VOYAGER':      { img:'assets/msd_voyager.jpg', spots:[
    { sys:'bridge', x:55, y:25 }, { sys:'core', x:48, y:55 },
    { sys:'deflector', x:30, y:60 }, { sys:'nacelles', x:75, y:55 } ] },
  'DEFIANT':      { img:'assets/msd_defiant.jpg', spots:[
    { sys:'bridge', x:48, y:28 }, { sys:'core', x:52, y:55 },
    { sys:'deflector', x:18, y:50 }, { sys:'nacelles', x:70, y:60 } ] },
  'EXCELSIOR':    {}, 'DEEP SPACE 9': {},
};
let msdShip = 'ENTERPRISE-D';

const SYS_FLAVOR = {
  bridge:    ['MAIN BRIDGE', 'COMMAND FUNCTIONS NOMINAL<br>DECK 1 · ALPHA SHIFT ON DUTY'],
  core:      ['MAIN ENGINEERING', 'REACTION STABLE · OUTPUT 92%<br>SEE HOLODECK · WARP CORE FOR OPERATIONS'],
  deflector: ['NAVIGATIONAL DEFLECTOR', 'PARTICLE DENSITY LOW<br>FIELD HARMONICS NOMINAL'],
  nacelles:  ['WARP NACELLES', 'PLASMA INJECTORS BALANCED<br>COIL TEMPERATURE NOMINAL'],
};

function holoMSD(scr, x0, y0, x1, y1) {
  const ship = SHIPS[msdShip];
  /* ship selector row */
  let sx = x0;
  Object.keys(SHIPS).forEach(name => {
    const w = 5.75;
    const b = scr.button(sx, y0, w, name.length > 9 ? name.slice(0, 9) : name,
      { color: name === msdShip ? 'gold' : (SHIPS[name].built ? 'lilac' : 'peri'), on: name === msdShip, ends:'pill' });
    scr.onTap(b, () => { msdShip = name; SFX.play('chirp'); render(); });
    sx += w + 0.5;
  });
  const p = scr.panel(x0, y0 + 2.3, x1 - x0, y1 - y0 - 2.3);
  if (!ship.img) {
    p.innerHTML = `<div class="clb" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%">
      <div class="standby">■ ${msdShip}</div><div style="opacity:.6;margin-top:.6em">AWAITING SCHEMATIC · DRAFTING QUEUE</div></div>`;
    return;
  }
  /* real cutaway + percentage-positioned tap spots (pulse on their own tempos) */
  p.innerHTML = `<div class="feed" style="border-color:transparent">
    <div class="msd-wrap"><img class="msd-img" src="${ship.img}" alt="${msdShip}">
    ${ship.spots.map(s => `<div class="msd-spot" data-sys="${s.sys}"
      style="left:${s.x}%;top:${s.y}%;animation-duration:${(2 + Math.random() * 1.6).toFixed(1)}s"></div>`).join('')}
    </div></div>`;
  p.querySelectorAll('[data-sys]').forEach(el => el.addEventListener('pointerup', () => {
    SFX.play('beep');
    const [t, body] = SYS_FLAVOR[el.dataset.sys];
    viewscreen('MSD · ' + msdShip + ' · ' + t, `<div class="clb">${body}</div>`, null, 'gold');
  }));
}

/* ============================ TACTICAL ============================ */
function holoTactical(scr, x0, y0, x1, y1) {
  const wT = Math.floor((x1 - x0) * 0.68 * 4) / 4;
  const [tgt] = wsCols(scr, x0, y0, x0 + wT, y1, [['salmon','TACTICAL DISPLAY']]);
  tgt.innerHTML = `<div class="tac" id="tac">
    ${Array.from({ length: 40 }, () => `<i class="tac-star" style="left:${Math.random()*100}%;top:${Math.random()*100}%;opacity:${0.3+Math.random()*0.7}"></i>`).join('')}
    <div class="tac-ret"><div class="tac-ring"></div><div class="tac-cross"></div></div>
    <div class="tac-status" id="tac-status">TARGET LOCK · SIMULATED CONTACT</div></div>`;
  const dx = x0 + wT + GAP;
  const [wp] = wsCols(scr, dx, y0, x1, y1, [['salmon','WEAPONS']]);
  wp.innerHTML = `<div class="btncol">
    <div class="wbtn" id="tac-ph" style="background:var(--c-salmon)">FIRE PHASERS</div>
    <div class="wbtn" id="tac-tp" style="background:var(--c-peach)">FIRE TORPEDO</div>
    <div class="wbtn" style="background:var(--c-peri)">RAISE SHIELDS</div></div>
    <div class="clb" style="height:auto">PHASER BANKS <span class="v">CHARGED</span><br>
    TORPEDO BAY <span class="v">LOADED · 3</span><br><span class="w">SIMULATION — NO REAL SYSTEMS</span></div>`;
  const tac = tgt.querySelector('#tac');
  scr.onTap(wp.querySelector('#tac-ph'), () => {
    SFX.play('phaser'); fireHook('holo.phaser');
    const beam = document.createElement('div'); beam.className = 'tac-beam';
    tac.appendChild(beam); setTimeout(() => beam.remove(), 700);
    document.getElementById('tac-status').textContent = 'PHASERS FIRING — DIRECT HIT';
    setTimeout(() => { const s = document.getElementById('tac-status'); if (s) s.textContent = 'TARGET LOCK · SIMULATED CONTACT'; }, 1800);
  });
  scr.onTap(wp.querySelector('#tac-tp'), () => {
    SFX.play('torpedo'); fireHook('holo.torpedo');
    const t = document.createElement('div'); t.className = 'tac-torp';
    tac.appendChild(t); setTimeout(() => t.remove(), 1100);
    document.getElementById('tac-status').textContent = 'TORPEDO AWAY';
    setTimeout(() => { const s = document.getElementById('tac-status'); if (s) s.textContent = 'TARGET LOCK · SIMULATED CONTACT'; }, 1800);
  });
}

/* dispatch for renderWorkspace */
function renderHolodeck(scr, view, x0, y0, x1, y1) {
  clearInterval(game?.timer); game = null;                 // leaving mid-crisis resets the sim
  document.getElementById('holo-red')?.remove();
  [holoTransporter, holoWarpCore, holoMSD, holoTactical][view]?.(scr, x0, y0, x1, y1);
}
