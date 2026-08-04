/* ============================================================================
   PROJECT LaFORGE — HOME ASSISTANT WEBSOCKET CLIENT (Phase 2)
   ----------------------------------------------------------------------------
   Connects the terminal to Jarvis (HAOS on Fred) over the native HA websocket
   API with a long-lived token (from config.local.js, GITIGNORED). Design:
   - NO config → app silently runs on mock data (dev without the LAN).
   - One-way data flow: HA states → sync() → the shared DATA object → views
     read DATA at render. Full render once on bootstrap; after that, cheap
     targeted patches (onUpdate(false)) — full re-render only on navigation.
   - call(): fire service calls (light.toggle etc.). WHY thin: every workspace
     button becomes a one-liner, and mock/live behavior stays in one place.
   - Auto-reconnect with 5s backoff; status surfaces as ONLINE/OFFLINE in the
     top bar (authentic — the show's terminals announce exactly this).
   ============================================================================ */
'use strict';

const HA = (() => {
  let ws, msgId = 1, connected = false;
  const pending = {}, states = {};
  const cfg = window.LAFORGE_CONFIG ?? null;
  let hooks = {};

  /* app calls init(DATA, onUpdate(fullRender), onStatus(connected), onAlert(mode)) once */
  function init(data, onUpdate, onStatus, onAlert) {
    hooks = { data, onUpdate, onStatus, onAlert };
    if (cfg?.token) connect();
    else console.warn('[HA] no config.local.js — mock data mode');
  }
  let prevAlert = null;

  function connect() {
    ws = new WebSocket(cfg.haUrl.replace(/^http/, 'ws') + '/api/websocket');
    ws.onmessage = e => handle(JSON.parse(e.data));
    ws.onclose = () => { setStatus(false); setTimeout(connect, 5000); };  // backoff + retry forever
    ws.onerror = () => ws.close();
  }

  function send(m) {
    m.id = msgId++; ws.send(JSON.stringify(m));
    return new Promise((res, rej) => pending[m.id] = { res, rej });
  }

  function handle(m) {
    if (m.type === 'auth_required') ws.send(JSON.stringify({ type:'auth', access_token: cfg.token }));
    else if (m.type === 'auth_ok') { setStatus(true); bootstrap(); }
    else if (m.type === 'auth_invalid') console.error('[HA] AUTH INVALID — regenerate token');
    else if (m.type === 'result' && pending[m.id]) {
      /* surface HA errors instead of resolving undefined (found via camera/stream) */
      if (m.success === false) pending[m.id].rej?.(new Error(m.error?.message ?? 'HA error'));
      else pending[m.id].res ? pending[m.id].res(m.result) : pending[m.id](m.result);
      delete pending[m.id];
    }
    else if (m.type === 'event' && m.event?.event_type === 'state_changed') {
      const s = m.event.data.new_state;
      if (s) { states[s.entity_id] = s; sync(false); }
    }
  }

  async function bootstrap() {
    (await send({ type:'get_states' })).forEach(s => states[s.entity_id] = s);
    await send({ type:'subscribe_events', event_type:'state_changed' });
    sync(true);                                   // one full render with real data
    fetchForecast();                              // forecasts are a SERVICE now, not attributes
    setInterval(fetchForecast, 30 * 60000);       // refresh every 30 min
    fetchTodo();                                  // shopping list is also response-only
    setInterval(fetchTodo, 5 * 60000);
  }

  /* ---- shopping list: todo.get_items is a response service, same pattern as
     the forecast — the items are NOT exposed as attributes, only the count. */
  async function fetchTodo() {
    if (!connected) return;
    const ent = Object.keys(states).find(k => k.startsWith('todo.'));
    if (!ent) return;
    try {
      const r = await send({ type:'call_service', domain:'todo', service:'get_items',
        target:{ entity_id: ent }, return_response:true });
      const items = r?.response?.[ent]?.items ?? [];
      hooks.data.todo = {
        entity: ent,
        name: (st(ent)?.attributes?.friendly_name ?? 'LIST').toUpperCase(),
        open: items.filter(i => i.status !== 'completed').map(i => i.summary),
        done: items.filter(i => i.status === 'completed').length,
      };
      hooks.onUpdate?.(false);
    } catch (e) { console.warn('[HA] todo fetch failed', e); }
  }

  /* ---- daily forecast: modern HA requires weather.get_forecasts with
     return_response (forecast attributes were removed in 2024) ---- */
  const COND = { 'sunny':'CLEAR', 'clear-night':'CLEAR', 'partlycloudy':'P/CLOUDY',
    'cloudy':'OVERCAST', 'rainy':'RAIN', 'pouring':'HEAVY RAIN', 'fog':'FOG',
    'lightning':'STORMS', 'lightning-rainy':'STORMS', 'snowy':'SNOW',
    'snowy-rainy':'SLEET', 'windy':'WINDY', 'windy-variant':'WINDY', 'hail':'HAIL' };
  async function fetchForecast() {
    if (!connected) return;
    try {
      const r = await send({ type:'call_service', domain:'weather', service:'get_forecasts',
        service_data:{ type:'daily' }, target:{ entity_id:'weather.forecast_home' },
        return_response:true });
      const list = r?.response?.['weather.forecast_home']?.forecast ?? [];
      hooks.data.forecast = list.slice(0, 5).map(f => ({
        day: new Date(f.datetime).toLocaleDateString('en-US', { weekday:'short' }).toUpperCase(),
        cond: COND[f.condition] ?? (f.condition ?? '?').toUpperCase(),
        hi: Math.round(f.temperature), lo: Math.round(f.templow ?? f.temperature) }));
      hooks.onUpdate?.(false);
    } catch (e) { console.warn('[HA] forecast fetch failed', e); }
  }

  function setStatus(on) { connected = on; hooks.onStatus?.(on); }

  const st  = id => states[id];
  const num = (id, dflt = 0) => { const v = parseFloat(st(id)?.state); return isNaN(v) ? dflt : v; };

  /* ---- entity → DATA mapping (single source; views stay dumb) ----
     Entity ids from PROJECT_MEMORY inventory (2026-06-17) — verify against
     live get_states and correct here if HA renamed anything. */
  /* ISO timestamp (UTC) → local HH:MM — sun sensors report UTC */
  const localHM = id => { const s = st(id)?.state; if (!s) return '—';
    const d = new Date(s); return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0'); };

  const FRED_RAM_TOTAL_MIB = 32768;   // ASSUMED 32 GiB — Patrick: correct if Fred differs

  function sync(full) {
    const D = hooks.data; if (!D) return;
    D.core.cpu = num('sensor.fred_cpu_usage', D.core.cpu);
    const ramMiB = num('sensor.fred_ram_used', 0);            // sensor reports MiB, not %
    D.core.mem = Math.min(100, ramMiB / FRED_RAM_TOTAL_MIB * 100);
    D.core.memLabel = (ramMiB / 1024).toFixed(1) + ' GB';
    const alarms = st('sensor.fred_alarms')?.state ?? 'ok';
    D.core.alarms = (alarms === 'ok' || alarms === '0') ? '0' : alarms;

    const w = st('weather.forecast_home');
    if (w) D.climate = {
      temp: Math.round(w.attributes.temperature),
      condition: (w.state ?? '').toUpperCase(),
      humidity: w.attributes.humidity,
      wind: Math.round(w.attributes.wind_speed ?? 0),
      sunset: localHM('sensor.sun_next_setting'),
      sunrise: localHM('sensor.sun_next_rising'),
    };

    const flood = st('light.backyard_light');
    if (flood) { D.dimmers[3][1] = flood.state === 'on' ? 100 : 0; D.floodOn = flood.state === 'on'; }

    D.alert = st('input_select.lcards_alert_mode')?.state ?? D.alert;
    if (D.alert !== prevAlert) { prevAlert = D.alert; hooks.onAlert?.(D.alert); }

    /* home coordinates for SCIENCE maps (SURVEY/GEO) — never hardcode */
    const home = st('zone.home');
    if (home) D.geo = { lat: home.attributes.latitude, lon: home.attributes.longitude };

    /* cameras: entity + live last-activity stamp (UTC ISO → local HH:MM) */
    D.cams = [
      ['FRONT DOOR', 'camera.front_door_live_view', localHM('sensor.front_door_last_activity')],
      ['BACKYARD',   'camera.backyard_live_view',   localHM('sensor.backyard_last_activity')],
      ['DOWNSTAIRS', 'camera.downstairs_live_view', localHM('sensor.downstairs_last_activity')],
    ];

    /* ---- MEDIA rows ----
       Each row is now a SELF-DESCRIBING object: it knows its entity, the domain
       service that moves it, and its native scale. WHY: the VOLUME view drives
       three different kinds of device (Echo, SmartThings TV, Ring camera
       speaker) and one code path should handle all of them — the row carries
       the knowledge, the slider stays dumb.

       ⚠️ BUG FIX 2026-07-31: the DOWNSTAIRS row used to read
       `number.downstairs_volume`. That is NOT the Echo — it is the Ring
       *camera's* speaker volume (0–11), a different physical device that merely
       shares a room name. The row displayed camera volume while labelled as the
       speaker. Echos now read their own volume_level, like every other player.

       Scale note: media_player.volume_set takes 0..1; number.set_value takes the
       entity's own range. `pct` is always 0..100 for the UI; toNative converts.

       TWO FLAGS, NOT ONE (learned the hard way on the 85" TV):
         live — the entity EXISTS in HA. Drives the ·SIM honesty tag.
         ctl  — the entity can accept a volume change RIGHT NOW.
       A powered-off TV is live but not ctl: it reports state 'off' and carries
       no volume_level at all, so a draggable bar there would be a lie that
       silently swallows every touch. Read-only until it wakes up. */
    const player = (label, id) => {
      const s = st(id), vl = s?.attributes?.volume_level;
      return { label, id, domain:'media_player', service:'volume_set', field:'volume_level',
        state: (s?.state ?? 'unavailable').toUpperCase(),
        live: !!s,
        ctl:  vl !== undefined,                       // no volume_level = nothing to set
        pct:  Math.round((vl ?? 0) * 100),
        toNative: p => p / 100 };
    };
    const numVol = (label, id) => {
      const s = st(id), max = s?.attributes?.max ?? 11;
      return { label, id, domain:'number', service:'set_value', field:'value',
        state: s ? 'READY' : 'OFFLINE', live: !!s, ctl: !!s,
        pct: Math.round(num(id, 0) / max * 100),
        toNative: p => Math.round(p / 100 * max) };
    };
    D.media = [
      player('MAIN VIEWSCREEN · 85″', 'media_player.living_room_85_crystal_uhd'),
      player('DOWNSTAIRS',            'media_player.downstairs'),
      player('EVERYWHERE',            'media_player.everywhere'),
      player('BEDROOM · P',           'media_player.patrick_s_bedroom'),
      player('IZZY’S ROOM',           'media_player.izzy_s_room'),
    ];
    /* Ring camera speakers — same room names, different hardware. Kept in a
       separate list so nobody confuses them with the Echos ever again. */
    D.camAudio = [
      numVol('CAM · FRONT DOOR', 'number.front_door_volume'),
      numVol('CAM · BACKYARD',   'number.backyard_volume'),
      numVol('CAM · DOWNSTAIRS', 'number.downstairs_volume'),
    ];
    /* LCARdS beep volume (0..1) — the terminal's own UI sound level, kept in HA
       so an automation or another dashboard can duck it. */
    D.uiVolume = {
      label:'LCARS INTERFACE', id:'input_number.lcards_sound_volume',
      domain:'input_number', service:'set_value', field:'value',
      state:'ACTIVE',
      live: !!st('input_number.lcards_sound_volume'),
      ctl:  !!st('input_number.lcards_sound_volume'),   // hand-built row: set BOTH flags
      pct: Math.round(num('input_number.lcards_sound_volume', 0.8) * 100),
      toNative: p => Math.round(p) / 100 };

    /* ---- HVAC: climate.living_room_sensi ----
       Appeared in HA sometime before 2026-07-31 (found during the pre-deploy
       entity sweep) — ATMOSPHERE had been showing "AWAITING CLIMATE ENTITIES"
       against a thermostat that was already live. supported_features 395 =
       target temp + target range + fan mode + turn on/off.
       Sensi reports 'heat' TWICE in hvac_modes; dedupe or the UI draws two
       identical buttons. */
    const hv = st('climate.living_room_sensi');
    D.hvac = hv ? {
      id: 'climate.living_room_sensi',
      mode:    hv.state,                                        // off/heat/cool/heat_cool
      action:  hv.attributes.hvac_action ?? 'idle',             // idle/cooling/heating
      cur:     Math.round(hv.attributes.current_temperature ?? 0),
      target:  Math.round(hv.attributes.temperature ?? 0),
      hum:     hv.attributes.current_humidity ?? null,
      fan:     hv.attributes.fan_mode ?? '—',
      fanModes:hv.attributes.fan_modes ?? [],
      modes:   [...new Set(hv.attributes.hvac_modes ?? [])],
      min:     hv.attributes.min_temp ?? 45,
      max:     hv.attributes.max_temp ?? 95,
    } : null;

    /* ---- SECURITY posture (was hardcoded "MOTION ARMED · SIRENS STANDBY") ----
       The main-screen cluster claimed a state it never checked. Now derived. */
    const motionSw = Object.keys(states).filter(k => /^switch\..*_motion_detection$/.test(k));
    const sirenIds = Object.keys(states).filter(k => k.startsWith('siren.'));
    D.security = {
      motionOn:  motionSw.filter(k => st(k)?.state === 'on').length,
      motionAll: motionSw.length,
      sirenOn:   sirenIds.some(k => st(k)?.state === 'on'),
      sirens:    sirenIds.map(k => [ (st(k).attributes.friendly_name ?? k).toUpperCase(), k, st(k).state === 'on' ]),
      motion:    motionSw.map(k => [ (st(k).attributes.friendly_name ?? k).replace(/ Motion Detection$/i,'').toUpperCase(),
                                     k, st(k).state === 'on' ]),
    };

    /* ---- ANNOUNCE targets ----
       Alexa exposes TWO notify entities per device: *_announce (the broadcast
       chime + "message") and *_speak (plain TTS out of that one device). We
       enumerate rather than hardcode so new Echos appear by themselves.
       `everywhere` is Alexa's own all-device group — the ship-wide PA. */
    const notifyIds = Object.keys(states).filter(k => k.startsWith('notify.'));
    const pretty = k => (st(k)?.attributes?.friendly_name ?? k.split('.')[1])
      .replace(/ (Announce|Speak)$/i, '').toUpperCase();
    D.announce = {
      all:    notifyIds.find(k => /everywhere_announce$/.test(k)) ?? null,
      rooms:  notifyIds.filter(k => /_announce$/.test(k) && !/everywhere/.test(k))
                       .map(k => [pretty(k), k]),
      speak:  notifyIds.filter(k => /_speak$/.test(k)).map(k => [pretty(k), k]),
      /* Cloud TTS engine — works TODAY. The local Majel voice (XTTS/Piper) is
         gated on Fred's GPU passthrough, so it is reported separately and
         honestly rather than being folded in here. */
      ttsEngine: Object.keys(states).find(k => k.startsWith('tts.')) ?? null,
      ttsTargets: D.media.filter(m => m.live && m.id.startsWith('media_player.')).map(m => [m.label, m.id]),
    };

    /* ---- ALEXA ROUTINES (26 of them, and the UI was firing NONE) ----
       Every Alexa routine is exposed as a `button.<account>_<routine name>`.
       The ROUTINES panel had four hardcoded labels wired to nothing, and SCENES
       was marked "PHASE 2".

       KEY INSIGHT: several routines are LIGHT scenes (sunset lights, living
       room + foyer off, tree lights, red light...). HA itself still only owns
       `light.backyard_light`, so native scenes are impossible — but firing the
       Alexa routine achieves the same thing TODAY. That is what unblocks the
       SCENES panel without waiting on the Tuya/MOES switches.

       Split by name so lighting lands in SCENES and the rest in ROUTINES.
       Enumerated, never hardcoded — new routines appear on their own. */
    const LIGHTY = /light|lamp|xmas|tree|sunset|celebration|falcor/i;
    const routineBtns = Object.keys(states)
      .filter(k => k.startsWith('button.') && /_gmail_com_/.test(k))
      .map(k => {
        let n = (st(k)?.attributes?.friendly_name ?? k)
          .replace(/^.*gmail\.com\s*/i, '')      // strip the account prefix
          .replace(/^Alexa,\s*/i, '')
          .trim();
        return { id: k, label: n.toUpperCase(), light: LIGHTY.test(n) };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
    D.routines = {
      lights:  routineBtns.filter(r => r.light),
      general: routineBtns.filter(r => !r.light),
    };

    /* presence — reported honestly; the person entity is often 'unknown'
       because no device_tracker feeds it yet. */
    const pp = st('person.patrick_byrne');
    D.presence = pp ? { name:'PATRICK', state:(pp.state ?? 'unknown').toUpperCase(),
                        known: pp.state === 'home' || pp.state === 'not_home' } : null;

    /* ---- WAN status (Arris gateway) ----
       ⚠️ Both speed sensors have reported 0.0 KiB/s since at least 7/14. Rather
       than draw a confident 0, the UI shows NO DATA — an honest readout beats a
       plausible-looking lie on a wall panel. */
    D.net = {
      up:   st('binary_sensor.arris_tg4482a_wan_status')?.state === 'on',
      ip:   st('sensor.arris_tg4482a_external_ip')?.state ?? '—',
      down: num('sensor.arris_tg4482a_download_speed', 0),
      upl:  num('sensor.arris_tg4482a_upload_speed', 0),
    };

    /* SmartThings appliances (probed 2026-07-11): TV live, fridge extras live,
       Bespoke washer/dryer NOT in HA yet → UI shows AWAITING UPLINK placeholder */
    D.appliances = {
      tvState: st('media_player.living_room_85_crystal_uhd')?.state ?? 'unknown',
      tvChan:  st('sensor.living_room_85_crystal_uhd_tv_channel_name')?.state ?? '—',
      fridgeDoor:  st('binary_sensor.refrigerator_fridge_door')?.state === 'on',
      freezerDoor: st('binary_sensor.refrigerator_freezer_door')?.state === 'on',
      filterPct:   num('sensor.refrigerator_water_filter_usage', 0),
      /* Bespoke washer — went live in HA between 7/11 and 7/14 (found during
         shakedown): machine_state (stop/run/pause), job_state (wash/rinse/
         spin/none), live power draw, and a completion timestamp. */
      washer: st('sensor.laundry_room_washer_machine_state') ? {
        state: (st('sensor.laundry_room_washer_machine_state')?.state ?? 'unknown').toUpperCase(),
        job:   (st('sensor.laundry_room_washer_job_state')?.state ?? 'none').replace(/_/g, ' ').toUpperCase(),
        power: num('sensor.laundry_room_washer_power', 0),
        /* completion_time arrives as "MM/DD/YYYY HH:MM:SS" — show HH:MM */
        done:  (st('sensor.laundry_room_washer_completion_time')?.state ?? '').split(' ')[1]?.slice(0, 5) ?? null,
      } : null,
    };

    hooks.onUpdate?.(full);
  }

  function call(domain, service, data) {
    if (!connected) { console.warn('[HA] offline — call dropped:', domain, service); return; }
    return send({ type:'call_service', domain, service, service_data: data });
  }

  /* ---- signed camera URLs ----
     WHY: <img> can't send Bearer headers, so HA signs a short-lived path we
     can use as a plain src. Re-sign on every refresh (they expire fast). */
  async function signPath(path, expires = 60) {
    if (!connected) return null;
    try { const r = await send({ type:'auth/sign_path', path, expires });
      return cfg.haUrl + r.path; } catch { return null; }
  }
  const cameraUrl = entityId => signPath('/api/camera_proxy/' + entityId);

  /* true live video: HA transmuxes the camera to HLS and returns a signed
     playlist URL. Some cameras (cloud/Ring) take seconds to spin up. */
  async function cameraStream(entityId) {
    if (!connected) return null;
    try { const r = await send({ type:'camera/stream', entity_id: entityId });
      return cfg.haUrl + r.url; } catch (e) {
      console.warn('[HA] stream unavailable for', entityId, e); return null; }
  }

  return { init, call, st, num, signPath, cameraUrl, cameraStream,
    get connected() { return connected; }, get states() { return states; } };
})();
