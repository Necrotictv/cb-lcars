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
    return new Promise(res => pending[m.id] = res);
  }

  function handle(m) {
    if (m.type === 'auth_required') ws.send(JSON.stringify({ type:'auth', access_token: cfg.token }));
    else if (m.type === 'auth_ok') { setStatus(true); bootstrap(); }
    else if (m.type === 'auth_invalid') console.error('[HA] AUTH INVALID — regenerate token');
    else if (m.type === 'result' && pending[m.id]) { pending[m.id](m.result); delete pending[m.id]; }
    else if (m.type === 'event' && m.event?.event_type === 'state_changed') {
      const s = m.event.data.new_state;
      if (s) { states[s.entity_id] = s; sync(false); }
    }
  }

  async function bootstrap() {
    (await send({ type:'get_states' })).forEach(s => states[s.entity_id] = s);
    await send({ type:'subscribe_events', event_type:'state_changed' });
    sync(true);                                   // one full render with real data
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

    D.media = [
      ['DOWNSTAIRS',  st('media_player.downstairs')?.state ?? 'unknown',        num('number.downstairs_volume', 6)],
      ['EVERYWHERE',  st('media_player.everywhere')?.state ?? 'unknown',        5],
      ['BEDROOM · P', st('media_player.patrick_s_bedroom')?.state ?? 'unknown', 4],
      ['IZZY’S ROOM', st('media_player.izzy_s_room')?.state ?? 'unknown',       3],
    ];

    hooks.onUpdate?.(full);
  }

  function call(domain, service, data) {
    if (!connected) { console.warn('[HA] offline — call dropped:', domain, service); return; }
    return send({ type:'call_service', domain, service, service_data: data });
  }

  return { init, call, st, num, get connected() { return connected; }, get states() { return states; } };
})();
