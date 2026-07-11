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

/* room-effect hook: fire the HA script if Patrick has built it; report honestly */
function holoFx(script) {
  if (HA.st('script.' + script)) { HA.call('script', 'turn_on', { entity_id: 'script.' + script }); return true; }
  return false;
}

/* ============================ TRANSPORTER ============================ */
function holoTransporter(scr, x0, y0, x1, y1) {
  const wPad = Math.floor((x1 - x0) * 0.62 * 4) / 4;
  const [pad] = wsCols(scr, x0, y0, x0 + wPad, y1, [['gold','TRANSPORTER · PAD 3']]);
  pad.innerHTML = `<div class="tr-room">
    ${[0,1,2].map(i => `<div class="tr-pad" data-i="${i}"><div class="tr-disc"></div><div class="tr-col"></div></div>`).join('')}
    <div class="tr-status" id="tr-status">STANDING BY</div></div>`;
  const dx = x0 + wPad + GAP;
  const [ct] = wsCols(scr, dx, y0, x1, y1, [['peach','CONTROL']]);
  ct.innerHTML = `<div class="btncol">
    <div class="wbtn" id="tr-energize" style="background:var(--c-gold)">◉ ENERGIZE</div>
    <div class="wbtn" style="background:var(--c-peri)">TARGETING SCANNERS</div>
    <div class="wbtn" style="background:var(--c-lilac)">PATTERN BUFFER</div></div>
    <div class="clb" style="height:auto">FX ${HA.st('script.laforge_transporter_fx')
      ? '<span class="v">ROOM + LOCAL</span>' : '<span class="w">LOCAL ONLY</span>'}<br>
    <span style="opacity:.55">ROOM FX HOOKUP: script.laforge_transporter_fx</span></div>`;
  let busy = false;
  scr.onTap(ct.querySelector('#tr-energize'), () => {
    if (busy) return; busy = true;
    SFX.play('shimmer');
    holoFx('laforge_transporter_fx');                       // dims room + color routine (when built)
    const st = document.getElementById('tr-status');
    st.textContent = 'ENERGIZING…';
    pad.querySelectorAll('.tr-pad').forEach((p, i) =>
      setTimeout(() => p.classList.add('tr-active'), i * 180));
    setTimeout(() => { st.textContent = 'PATTERN DEMATERIALIZED'; }, 2400);
    setTimeout(() => {
      pad.querySelectorAll('.tr-pad').forEach(p => p.classList.remove('tr-active'));
      st.textContent = 'TRANSPORT COMPLETE'; SFX.play('chirp');
      setTimeout(() => { st.textContent = 'STANDING BY'; busy = false; }, 2000);
    }, 4200);
  });
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
  core.innerHTML = `<div class="wc"><div class="wc-shaft">` +
    Array.from({ length: 9 }, (_, i) => `<div class="wc-seg" style="animation-delay:${i * 0.14}s"></div>`).join('') +
    `</div><div class="wc-label" id="wc-label">MATTER / ANTIMATTER REACTION STABLE</div></div>`;

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
    if (win) { SFX.play('chirp'); label.textContent = msg; }
    else {   /* the ship is lost — say it with theatre */
      SFX.play('torpedo');
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
    holoFx('laforge_breach_fx');               // room lighting drama (when Patrick builds it)
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

/* ============================ MSD (ship schematics) ============================ */
const SHIPS = {
  'ENTERPRISE-D': { built: true, draw: drawEntD },
  'DEFIANT':      { built: true, draw: drawDefiant },
  'EXCELSIOR':    { built: false }, 'DEEP SPACE 9': { built: false }, 'VOYAGER': { built: false },
};
let msdShip = 'ENTERPRISE-D';

/* Original vector side elevations — recognizable silhouettes, okudagram lines.
   (Decision log #6: two RIGHT ships beat five wrong ones.) */
function drawEntD(C) {
  return `<svg viewBox="0 0 400 150" style="width:100%;height:100%">
    <g stroke="${C('lilac')}" stroke-width="1" fill="none">
      <ellipse cx="150" cy="45" rx="120" ry="16"/>
      <ellipse cx="150" cy="45" rx="34" ry="7"/>
      <path d="M210 55 Q235 60 245 84 L285 96 Q260 104 240 100 L205 62"/>
      <path d="M245 84 Q255 92 300 94"/>
      <rect x="235" y="96" width="14" height="10" rx="4"/>
      <path d="M262 100 L330 108"/><path d="M262 108 L330 118"/>
      <rect x="325" y="103" width="70" height="9" rx="4.5"/>
      <rect x="325" y="114" width="70" height="9" rx="4.5"/>
      <path d="M150 29 L150 12" stroke-dasharray="2 3"/>
    </g>
    <g data-sys="bridge"    style="cursor:pointer"><circle cx="150" cy="26" r="5" fill="${C('gold')}"/><text x="158" y="16" font-size="7" fill="${C('lilac')}" font-family="Antonio">BRIDGE</text></g>
    <g data-sys="core"      style="cursor:pointer"><circle cx="242" cy="90" r="5" fill="${C('salmon')}"><animate attributeName="opacity" values="1;.4;1" dur="2.2s" repeatCount="indefinite"/></circle><text x="205" y="128" font-size="7" fill="${C('lilac')}" font-family="Antonio">WARP CORE</text></g>
    <g data-sys="deflector" style="cursor:pointer"><circle cx="300" cy="94" r="5" fill="${C('peri')}"/><text x="290" y="82" font-size="7" fill="${C('lilac')}" font-family="Antonio">DEFLECTOR</text></g>
    <g data-sys="nacelles"  style="cursor:pointer"><circle cx="360" cy="108" r="5" fill="${C('peach')}"/><text x="340" y="98" font-size="7" fill="${C('lilac')}" font-family="Antonio">NACELLES</text></g>
  </svg>`;
}
function drawDefiant(C) {
  return `<svg viewBox="0 0 400 150" style="width:100%;height:100%">
    <g stroke="${C('lilac')}" stroke-width="1" fill="none">
      <path d="M60 75 Q90 40 200 38 Q330 40 350 66 Q355 75 350 84 Q330 110 200 112 Q90 110 60 75 Z"/>
      <path d="M60 75 L120 70 L120 80 Z" fill="${C('peri')}" opacity="0.5"/>
      <ellipse cx="200" cy="75" rx="40" ry="18"/>
      <rect x="150" y="46" width="110" height="8" rx="4"/>
      <rect x="150" y="96" width="110" height="8" rx="4"/>
    </g>
    <g data-sys="bridge"    style="cursor:pointer"><circle cx="200" cy="58" r="5" fill="${C('gold')}"/><text x="208" y="52" font-size="7" fill="${C('lilac')}" font-family="Antonio">BRIDGE</text></g>
    <g data-sys="core"      style="cursor:pointer"><circle cx="200" cy="82" r="5" fill="${C('salmon')}"><animate attributeName="opacity" values="1;.4;1" dur="2.2s" repeatCount="indefinite"/></circle><text x="170" y="130" font-size="7" fill="${C('lilac')}" font-family="Antonio">WARP CORE</text></g>
    <g data-sys="deflector" style="cursor:pointer"><circle cx="85" cy="75" r="5" fill="${C('peri')}"/><text x="66" y="60" font-size="7" fill="${C('lilac')}" font-family="Antonio">DEFLECTOR</text></g>
    <g data-sys="nacelles"  style="cursor:pointer"><circle cx="205" cy="100" r="5" fill="${C('peach')}"/><text x="240" y="120" font-size="7" fill="${C('lilac')}" font-family="Antonio">NACELLES</text></g>
  </svg>`;
}
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
  const C = k => getComputedStyle(document.documentElement).getPropertyValue('--c-' + k).trim();
  if (!ship.built) {
    p.innerHTML = `<div class="clb" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%">
      <div class="standby">■ ${msdShip}</div><div style="opacity:.6;margin-top:.6em">AWAITING SCHEMATIC · DRAFTING QUEUE</div></div>`;
    return;
  }
  p.innerHTML = `<div class="feed" style="border-color:transparent">${ship.draw(C)}</div>`;
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
    SFX.play('phaser');
    const beam = document.createElement('div'); beam.className = 'tac-beam';
    tac.appendChild(beam); setTimeout(() => beam.remove(), 700);
    document.getElementById('tac-status').textContent = 'PHASERS FIRING — DIRECT HIT';
    setTimeout(() => { const s = document.getElementById('tac-status'); if (s) s.textContent = 'TARGET LOCK · SIMULATED CONTACT'; }, 1800);
  });
  scr.onTap(wp.querySelector('#tac-tp'), () => {
    SFX.play('torpedo');
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
