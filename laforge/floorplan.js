/* ============================================================================
   PROJECT LaFORGE — FLOOR PLAN DATA (the house as a Master Systems Display)
   ----------------------------------------------------------------------------
   DATA-DRIVEN BY DESIGN: rooms are plain objects — rearrange/resize/rename by
   editing this file, no renderer changes needed. Coordinates are in a local
   plan grid (arbitrary units, the renderer scales to fit).
   DRAFT layout inferred from HA entities + Alexa devices — PATRICK: correct me!
   `deck` naming is deliberate ship-speak. `entities` lists what the room's
   tap-popup will control in Phase 2.
   ============================================================================ */
'use strict';

const FLOORPLAN = {
  /* status dot colors by kind (palette roles, resolved at render time) */
  dotColors: { light:'canary', cam:'salmon', media:'peri', climate:'lilac' },

  decks: [
    { id:'deck1', label:'DECK 01 · MAIN', rooms: [
      { id:'living',   label:'LIVING ROOM', x:0,    y:0,   w:16, h:10,
        dots:['light','media'],
        entities:['(alexa) living room & foyer lights', 'media_player.downstairs'] },
      { id:'foyer',    label:'FOYER',       x:16.5, y:0,   w:7,  h:10,
        dots:['light'], entities:['(alexa) living room & foyer lights'] },
      { id:'kitchen',  label:'KITCHEN',     x:24,   y:0,   w:12, h:10,
        dots:['climate'], entities:['sensor.refrigerator_*'] },
      { id:'down',     label:'DOWNSTAIRS',  x:0,    y:10.5,w:36, h:8,
        dots:['cam','media'],
        entities:['camera.downstairs_live_view','siren.downstairs_siren','media_player.downstairs','number.downstairs_volume'] },
    ]},
    { id:'deck2', label:'DECK 02 · UPPER', rooms: [
      { id:'bed_p',    label:'BEDROOM · P', x:0,    y:0,   w:17, h:9,
        dots:['media'], entities:['media_player.patrick_s_bedroom'] },
      { id:'bed_i',    label:'IZZY’S ROOM', x:17.5, y:0, w:12, h:9,
        dots:['media'], entities:['media_player.izzy_s_room'] },
      { id:'bath',     label:'BATH',        x:30,   y:0,   w:6,  h:9,
        dots:[], entities:[] },
    ]},
  ],

  /* exterior band — not rooms, but sensored zones drawn along the bottom */
  exterior: [
    { id:'front',   label:'FRONT DOOR', x:0,  y:0, w:17, h:4,
      dots:['cam'], entities:['camera.front_door_live_view','number.front_door_volume'] },
    { id:'backyard',label:'BACKYARD',   x:17.5, y:0, w:18.5, h:4,
      dots:['cam','light'],
      entities:['camera.backyard_live_view','light.backyard_light','siren.backyard_siren','sensor.backyard_last_activity'] },
  ],
};

/* ---- MSD renderer: draws the plan as an okudagram SVG into a host div ----
   Thin palette-lilac outlines, black interior, status dots pulse on their own
   timelines (§8). Rooms carry data-room for the Phase-2 tap popups. */
function renderMSD(host, C) {
  const PW = 36, DH1 = 18.5, DH2 = 9, EX = 4;      // plan-grid extents
  const totalH = DH1 + 1.5 + EX;                   // deck1 + gap + exterior
  const lilac = C('--c-lilac') || '#cc99cc', peri = C('--c-peri') || '#9999cc',
        orange = C('--c-orange') || '#ff9c00';
  const dotHex = k => C('--c-' + FLOORPLAN.dotColors[k]) || '#f3f08b';

  const roomRect = (r, ox, oy) => {
    const dots = (r.dots ?? []).map((k, i) =>
      `<circle cx="${ox + r.x + r.w - 1.2 - i * 2}" cy="${oy + r.y + r.h - 1.2}" r="0.55" fill="${dotHex(k)}">
         <animate attributeName="opacity" values="1;.25;1" dur="${(2.8 + Math.random() * 1.8).toFixed(1)}s"
           begin="${(Math.random() * 2).toFixed(1)}s" repeatCount="indefinite"/></circle>`).join('');
    return `<g data-room="${r.id}" style="cursor:pointer">
      <rect x="${ox + r.x}" y="${oy + r.y}" width="${r.w}" height="${r.h}" rx="0.8"
        fill="#0a0c12" stroke="${lilac}" stroke-width="0.22"/>
      <text x="${ox + r.x + 0.9}" y="${oy + r.y + 1.7}" font-size="1.1" fill="${peri}"
        font-family="Antonio" letter-spacing="0.12">${r.label}</text>${dots}</g>`;
  };

  let svg = '';
  /* deck 1 (left, large) + deck 2 (right of it, offset) side by side would
     crowd portrait screens — stack: deck1 top-left, deck2 right column */
  svg += `<text x="0" y="-1" font-size="1" fill="${orange}" font-family="Antonio" letter-spacing="0.2">${FLOORPLAN.decks[0].label}</text>`;
  FLOORPLAN.decks[0].rooms.forEach(r => svg += roomRect(r, 0, 0));
  const d2x = PW + 3;
  svg += `<text x="${d2x}" y="-1" font-size="1" fill="${orange}" font-family="Antonio" letter-spacing="0.2">${FLOORPLAN.decks[1].label}</text>`;
  FLOORPLAN.decks[1].rooms.forEach(r => svg += roomRect(r, d2x, 0));
  const exy = DH1 + 1.5;
  svg += `<text x="0" y="${exy - 0.5}" font-size="1" fill="${orange}" font-family="Antonio" letter-spacing="0.2">EXTERIOR · PERIMETER</text>`;
  FLOORPLAN.exterior.forEach(r => svg += roomRect(r, 0, exy));

  host.innerHTML = `<svg viewBox="-0.5 -2.5 ${PW + 3 + PW + 1} ${totalH + 3.5}"
    style="width:100%;height:100%" preserveAspectRatio="xMidYMid meet">${svg}</svg>`;
}
