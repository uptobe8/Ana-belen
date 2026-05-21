(() => {
  const STORAGE_KEY = 'memoria_familiar_musica_relajante_v2';
  const LEGACY_KEY = 'memoria_familiar_musica_relajante_v1';
  const TRACK_KEY = 'memoria_familiar_pista_relajante_v1';

  let audioCtx = null;
  let masterGain = null;
  let compressor = null;
  let delay = null;
  let delayGain = null;
  let filter = null;
  let lfo = null;
  let lfoGain = null;
  let nodes = [];
  let sequenceTimer = null;
  let autoRetryBound = false;
  let started = false;
  let enabled = true;
  let currentTrack = 0;
  let chordStep = 0;

  const TRACKS = [
    {
      name: 'Jazz suave',
      tempo: 7200,
      filter: 1850,
      volume: 0.17,
      chords: [
        [261.63, 329.63, 392.00, 493.88, 659.25],
        [220.00, 277.18, 329.63, 440.00, 554.37],
        [196.00, 246.94, 329.63, 392.00, 493.88],
        [233.08, 293.66, 349.23, 440.00, 587.33]
      ]
    },
    {
      name: 'Bossa tranquila',
      tempo: 6800,
      filter: 2050,
      volume: 0.16,
      chords: [
        [246.94, 311.13, 369.99, 493.88, 622.25],
        [207.65, 261.63, 329.63, 415.30, 523.25],
        [220.00, 277.18, 349.23, 440.00, 554.37],
        [196.00, 246.94, 293.66, 392.00, 493.88]
      ]
    },
    {
      name: 'Piano cálido',
      tempo: 8000,
      filter: 1600,
      volume: 0.18,
      chords: [
        [174.61, 220.00, 261.63, 329.63, 440.00],
        [196.00, 246.94, 293.66, 369.99, 493.88],
        [164.81, 207.65, 261.63, 329.63, 415.30],
        [146.83, 196.00, 246.94, 293.66, 392.00]
      ]
    },
    {
      name: 'Blue lento',
      tempo: 7600,
      filter: 1750,
      volume: 0.17,
      chords: [
        [196.00, 246.94, 311.13, 392.00, 466.16],
        [261.63, 329.63, 392.00, 466.16, 587.33],
        [174.61, 220.00, 293.66, 349.23, 440.00],
        [220.00, 277.18, 349.23, 415.30, 523.25]
      ]
    },
    {
      name: 'Atardecer lounge',
      tempo: 8400,
      filter: 1500,
      volume: 0.18,
      chords: [
        [220.00, 261.63, 329.63, 392.00, 523.25],
        [185.00, 233.08, 293.66, 369.99, 466.16],
        [207.65, 261.63, 311.13, 415.30, 523.25],
        [174.61, 220.00, 277.18, 349.23, 440.00]
      ]
    }
  ];

  function readPreference() {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      if (value === 'off') return false;
      if (value === 'on') return true;
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy === 'off') return false;
      return true;
    } catch { return true; }
  }

  function savePreference(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value ? 'on' : 'off');
      localStorage.removeItem(LEGACY_KEY);
    } catch {}
  }

  function readTrack() {
    try {
      const value = Number(localStorage.getItem(TRACK_KEY));
      return Number.isFinite(value) ? Math.max(0, Math.min(TRACKS.length - 1, value)) : 0;
    } catch { return 0; }
  }

  function saveTrack(value) {
    try { localStorage.setItem(TRACK_KEY, String(value)); }
    catch {}
  }

  function createControls() {
    const style = document.createElement('style');
    style.textContent = `
      .music-panel {
        position: fixed;
        left: max(16px, env(safe-area-inset-left));
        bottom: max(16px, env(safe-area-inset-bottom));
        z-index: 35;
        display: flex;
        align-items: stretch;
        gap: 8px;
        padding: 8px;
        border: 2px solid rgba(228,216,200,.95);
        border-radius: 999px;
        background: rgba(255,255,255,.94);
        box-shadow: 0 14px 36px rgba(46,36,24,.16);
        backdrop-filter: blur(12px);
      }
      .music-toggle, .music-next {
        min-height: 56px;
        border: 0;
        border-radius: 999px;
        padding: 12px 16px;
        background: transparent;
        color: #172033;
        font: 900 1rem Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 9px;
        touch-action: manipulation;
      }
      .music-toggle[aria-pressed="true"] {
        background: #ecfbf7;
        color: #075d51;
      }
      .music-toggle[aria-pressed="false"] {
        background: #fff4df;
        color: #5b3200;
      }
      .music-next {
        min-width: 58px;
        background: #eef4ff;
        color: #0f285d;
      }
      .music-toggle:focus-visible, .music-next:focus-visible {
        outline: 5px solid rgba(36,107,254,.35);
        outline-offset: 4px;
      }
      .music-dot {
        width: 11px;
        height: 11px;
        border-radius: 999px;
        background: #b65c00;
        box-shadow: 0 0 0 6px rgba(182,92,0,.12);
        flex: 0 0 auto;
      }
      .music-toggle[aria-pressed="true"] .music-dot {
        background: #00a38c;
        box-shadow: 0 0 0 6px rgba(0,163,140,.16);
      }
      .music-track-name {
        max-width: 190px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      @media (max-width: 580px) {
        .music-panel {
          left: 12px;
          right: 12px;
          bottom: max(12px, env(safe-area-inset-bottom));
          border-radius: 26px;
        }
        .music-toggle { flex: 1; }
        .music-track-name { max-width: none; }
        body { padding-bottom: 92px; }
      }
    `;
    document.head.appendChild(style);

    const panel = document.createElement('div');
    panel.className = 'music-panel';
    panel.innerHTML = `
      <button id="musicToggleBtn" class="music-toggle" type="button" aria-label="Activar o desactivar música de fondo"></button>
      <button id="musicNextBtn" class="music-next" type="button" aria-label="Cambiar canción">›</button>
    `;
    document.body.appendChild(panel);

    document.getElementById('musicToggleBtn').addEventListener('click', toggleMusic);
    document.getElementById('musicNextBtn').addEventListener('click', nextTrack);
  }

  function updateControls() {
    const button = document.getElementById('musicToggleBtn');
    if (!button) return;
    button.setAttribute('aria-pressed', String(enabled));
    button.innerHTML = `<span class="music-dot" aria-hidden="true"></span><span class="music-track-name">${enabled ? TRACKS[currentTrack].name : 'Música apagada'}</span>`;
  }

  function ensureAudio() {
    if (audioCtx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;

    audioCtx = new Ctx();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.0001;

    compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 18;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.06;
    compressor.release.value = 0.45;

    filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = TRACKS[currentTrack].filter;
    filter.Q.value = 0.75;

    delay = audioCtx.createDelay(6);
    delay.delayTime.value = 0.42;
    delayGain = audioCtx.createGain();
    delayGain.gain.value = 0.16;

    lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.032;
    lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 150;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    filter.connect(compressor);
    compressor.connect(masterGain);
    filter.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(masterGain);
    masterGain.connect(audioCtx.destination);
  }

  function makeTone(freq, start, duration, gainValue, type = 'sine', panValue = 0) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const pan = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    osc.detune.setValueAtTime((Math.random() - 0.5) * 7, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.9);
    gain.gain.setValueAtTime(gainValue, start + Math.max(1.4, duration - 1.7));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    if (pan) {
      pan.pan.setValueAtTime(panValue, start);
      gain.connect(pan);
      pan.connect(filter);
      nodes.push(pan);
    } else {
      gain.connect(filter);
    }
    osc.start(start);
    osc.stop(start + duration + 0.2);
    nodes.push(osc, gain);
    osc.onended = () => {
      nodes = nodes.filter(n => n !== osc && n !== gain && n !== pan);
      try { gain.disconnect(); } catch {}
      if (pan) { try { pan.disconnect(); } catch {} }
    };
  }

  function playBass(freq, now, duration) {
    makeTone(freq / 2, now, duration, 0.055, 'sine', -0.18);
    makeTone(freq, now + 0.08, duration * 0.72, 0.014, 'triangle', -0.10);
  }

  function playSoftPercussion(now, tempo) {
    const hits = [0.35, 1.8, 3.25, 5.15];
    hits.forEach((offset, index) => {
      makeTone(index % 2 ? 880 : 660, now + offset, 0.16, 0.006, 'triangle', index % 2 ? 0.28 : -0.28);
    });
    if (tempo < 7300) makeTone(523.25, now + 4.2, 0.12, 0.0045, 'sine', 0.18);
  }

  function playChord() {
    if (!audioCtx || !enabled) return;
    const track = TRACKS[currentTrack];
    const now = audioCtx.currentTime;
    const chord = track.chords[chordStep % track.chords.length];
    filter.frequency.cancelScheduledValues(now);
    filter.frequency.setTargetAtTime(track.filter, now, 0.9);

    playBass(chord[0], now, 6.4);
    chord.forEach((freq, i) => {
      const start = now + i * 0.095;
      const gain = i === 0 ? 0.026 : i < 3 ? 0.018 : 0.010;
      const type = i < 2 ? 'triangle' : 'sine';
      makeTone(freq, start, 6.7, gain, type, (i - 2) * 0.10);
      if (i > 1) makeTone(freq * 2, now + 1.15 + i * 0.12, 3.2, 0.0055, 'sine', (2 - i) * 0.09);
    });
    makeTone(chord[3] * 2, now + 2.9, 2.5, 0.006, 'sine', 0.24);
    playSoftPercussion(now, track.tempo);
    chordStep++;
    sequenceTimer = setTimeout(playChord, track.tempo);
  }

  async function startMusic({ automatic = false } = {}) {
    ensureAudio();
    if (!audioCtx || !enabled) return;
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume().catch(() => {});
    }
    if (audioCtx.state === 'suspended') {
      if (automatic) bindAutoRetry();
      return;
    }
    if (started) return;
    started = true;
    const now = audioCtx.currentTime;
    const targetVolume = TRACKS[currentTrack].volume;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(Math.max(masterGain.gain.value, 0.0001), now);
    masterGain.gain.exponentialRampToValueAtTime(targetVolume, now + 1.0);
    playChord();
  }

  function stopMusic() {
    if (!audioCtx) return;
    if (sequenceTimer) clearTimeout(sequenceTimer);
    sequenceTimer = null;
    started = false;
    const now = audioCtx.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(Math.max(masterGain.gain.value, 0.0001), now);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    setTimeout(() => {
      nodes.forEach(node => { try { node.stop && node.stop(); } catch {} try { node.disconnect && node.disconnect(); } catch {} });
      nodes = [];
    }, 850);
  }

  async function toggleMusic() {
    enabled = !enabled;
    savePreference(enabled);
    updateControls();
    if (enabled) await startMusic();
    else stopMusic();
  }

  async function nextTrack() {
    currentTrack = (currentTrack + 1) % TRACKS.length;
    chordStep = 0;
    saveTrack(currentTrack);
    updateControls();
    if (started) {
      stopMusic();
      setTimeout(() => startMusic(), 780);
    } else if (enabled) {
      await startMusic();
    }
  }

  function bindAutoRetry() {
    if (autoRetryBound) return;
    autoRetryBound = true;
    const retry = () => {
      if (!enabled || started) return;
      startMusic();
    };
    ['pointerdown', 'touchstart', 'click', 'keydown'].forEach(eventName => {
      window.addEventListener(eventName, retry, { passive: true });
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (!audioCtx || !enabled) return;
    if (document.hidden) {
      try { audioCtx.suspend(); } catch {}
    } else {
      try { audioCtx.resume(); } catch {}
    }
  });

  window.addEventListener('pagehide', stopMusic);

  function init() {
    currentTrack = readTrack();
    enabled = readPreference();
    createControls();
    updateControls();
    if (enabled) {
      setTimeout(() => startMusic({ automatic: true }), 350);
      bindAutoRetry();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
