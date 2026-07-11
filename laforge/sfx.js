/* ============================================================================
   PROJECT LaFORGE — SFX ENGINE (WebAudio synthesis, zero assets)
   ----------------------------------------------------------------------------
   WHY synthesis: no downloads, no copyright exposure, ships self-contained.
   OVERRIDE PATH: drop real files in laforge/assets/sfx/<name>.mp3 — play()
   checks for a loaded file first, falls back to synth. Patrick supplies files
   whenever; nothing else changes.
   GATING: respects SYSTEMS → INTERACTION BEEPS setting; AudioContext resumes
   on first user gesture (Chrome autoplay policy).
   ============================================================================ */
'use strict';

const SFX = (() => {
  let ctx = null;
  const files = {};   // name → AudioBuffer (assets/sfx overrides, lazy-probed)

  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  const on = () => LCARS.settings.get('beeps', true);

  /* try to load an override file once; cache result (null = synth fallback) */
  async function probe(name) {
    if (name in files) return files[name];
    try {
      const r = await fetch(`assets/sfx/${name}.mp3`, { method: 'HEAD' });
      if (!r.ok) return files[name] = null;
      const buf = await (await fetch(`assets/sfx/${name}.mp3`)).arrayBuffer();
      return files[name] = await ac().decodeAudioData(buf);
    } catch { return files[name] = null; }
  }

  /* ---- synth building blocks ---- */
  function tone(freq, dur, { type = 'sine', gain = 0.15, at = 0, sweep = null } = {}) {
    const c = ac(), o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, c.currentTime + at);
    if (sweep) o.frequency.exponentialRampToValueAtTime(sweep, c.currentTime + at + dur);
    g.gain.setValueAtTime(0, c.currentTime + at);
    g.gain.linearRampToValueAtTime(gain, c.currentTime + at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + at + dur);
    o.connect(g).connect(c.destination);
    o.start(c.currentTime + at); o.stop(c.currentTime + at + dur + 0.05);
  }
  function noise(dur, { gain = 0.1, at = 0, freq = 2000, q = 1, sweep = null } = {}) {
    const c = ac(), len = c.sampleRate * dur, buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass';
    f.frequency.setValueAtTime(freq, c.currentTime + at); f.Q.value = q;
    if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, c.currentTime + at + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(gain, c.currentTime + at);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + at + dur);
    src.connect(f).connect(g).connect(c.destination);
    src.start(c.currentTime + at);
  }

  /* ---- the palette (each: try override file, else synth) ---- */
  const SYNTH = {
    beep()    { tone(880, 0.07, { type:'square', gain:0.06 }); },                       // button ack
    chirp()   { tone(1200, 0.05, { gain:0.06 }); tone(1600, 0.06, { at:0.06, gain:0.05 }); }, // nav
    deny()    { tone(220, 0.15, { type:'square', gain:0.08 }); },                       // invalid
    klaxon()  { for (let i = 0; i < 3; i++) {                                           // red alert x3
                  tone(650, 0.35, { type:'sawtooth', gain:0.10, at: i * 0.55, sweep: 440 }); } },
    shimmer() { for (let i = 0; i < 14; i++)                                            // transporter
                  tone(2000 + Math.random() * 2500, 0.35, { gain:0.025, at: i * 0.12 });
                noise(2.2, { gain:0.05, freq:3800, q:0.6, sweep:6000 }); },
    phaser()  { tone(1400, 0.6, { type:'sawtooth', gain:0.07, sweep:900 });
                noise(0.6, { gain:0.04, freq:2400, q:2 }); },
    torpedo() { noise(0.9, { gain:0.12, freq:400, q:1.4, sweep:90 });
                tone(300, 0.5, { type:'triangle', gain:0.08, sweep:70 }); },
    eject()   { tone(500, 0.2, { type:'square', gain:0.08 });                           // clamps + drop
                tone(350, 0.2, { type:'square', gain:0.08, at:0.25 });
                noise(1.4, { gain:0.09, at:0.5, freq:800, q:0.8, sweep:150 }); },
    powerup() { tone(180, 1.1, { type:'triangle', gain:0.09, sweep:720 }); },           // core restart
    alarm()   { tone(950, 0.12, { type:'square', gain:0.07 });                          // console warning
                tone(950, 0.12, { type:'square', gain:0.07, at:0.2 }); },
  };

  async function play(name) {
    if (!on()) return;
    const buf = await probe(name);
    if (buf) { const c = ac(), s = c.createBufferSource(); s.buffer = buf; s.connect(c.destination); s.start(); }
    else SYNTH[name]?.();
  }

  /* wire the global tap beep once (capture; cheap) */
  addEventListener('pointerdown', () => { if (on()) ac(); }, { once: true });

  return { play };
})();
