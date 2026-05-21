(() => {
  const STORAGE_KEY = 'memoria_familiar_musica_relajante_v1';
  const isReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
  let started = false;
  let enabled = false;

  const CHORDS = [
    [261.63, 329.63, 392.00, 523.25],
    [220.00, 261.63, 329.63, 440.00],
    [196.00, 246.94, 329.63, 392.00],
    [174.61, 220.00, 261.63, 349.23]
  ];

  function readPreference() {
    try { return localStorage.getItem(STORAGE_KEY) === 'on'; }
    catch { return false; }
  }

  function savePreference(value) {
    try { localStorage.setItem(STORAGE_KEY, value ? 'on' : 'off'); }
    catch {}
  }

  function createButton() {
    const style = document.createElement('style');
    style.textContent = `
      .music-toggle {
        position: fixed;
        left: max(16px, env(safe-area-inset-left));
        bottom: max(16px, env(safe-area-inset-bottom));
        z-index: 35;
        min-height: 60px;
        border: 2px solid rgba(228,216,200,.95);
        border-radius: 999px;
        padding: 14px 20px;
        background: rgba(255,255,255,.94);
        color: #172033;
        box-shadow: 0 14px 36px rgba(46,36,24,.16);
        backdrop-filter: blur(12px);
        font: 900 1rem Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        touch-action: manipulation;
      }
      .music-toggle[aria-pressed="true"] {
        background: #ecfbf7;
        border-color: rgba(0,163,140,.45);
        color: #075d51;
      }
      .music-toggle:focus-visible {
        outline: 5px solid rgba(36,107,254,.35);
        outline-offset: 4px;
      }
      .music-toggle .music-dot {
        width: 11px;
        height: 11px;
        border-radius: 999px;
        background: #b65c00;
        box-shadow: 0 0 0 6px rgba(182,92,0,.12);
      }
      .music-toggle[aria-pressed="true"] .music-dot {
        background: #00a38c;
        box-shadow: 0 0 0 6px rgba(0,163,140,.16);
      }
      @media (max-width: 580px) {
        .music-toggle {
          left: 12px;
          right: 12px;
          justify-content: center;
          bottom: max(12px, env(safe-area-inset-bottom));
        }
        body { padding-bottom: 84px; }
      }
    `;
    document.head.appendChild(style);

    const button = document.createElement('button');
    button.id = 'musicToggleBtn';
    button.className = 'music-toggle';
    button.type = 'button';
    button.setAttribute('aria-label', 'Activar o desactivar música relajante de fondo');
    document.body.appendChild(button);
    button.addEventListener('click', toggleMusic);
    return button;
  }

  function updateButton() {
    const button = document.getElementById('musicToggleBtn');
    if (!button) return;
    button.setAttribute('aria-pressed', String(enabled));
    button.innerHTML = `<span class="music-dot" aria-hidden="true"></span><span>${enabled ? 'Música relajante' : 'Activar música'}</span>`;
  }

  function ensureAudio() {
    if (audioCtx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;

    audioCtx = new Ctx();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.0001;

    compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.value = -32;
    compressor.knee.value = 18;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.08;
    compressor.release.value = 0.45;

    filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1450;
    filter.Q.value = 0.7;

    delay = audioCtx.createDelay(6);
    delay.delayTime.value = 0.48;
    delayGain = audioCtx.createGain();
    delayGain.gain.value = 0.10;

    lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.035;
    lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 180;
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

  function makeTone(freq, start, duration, gainValue, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    osc.detune.setValueAtTime((Math.random() - 0.5) * 5, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 1.8);
    gain.gain.setValueAtTime(gainValue, start + Math.max(2, duration - 2.5));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(filter);
    osc.start(start);
    osc.stop(start + duration + 0.2);
    nodes.push(osc, gain);
    osc.onended = () => {
      nodes = nodes.filter(n => n !== osc && n !== gain);
      try { gain.disconnect(); } catch {}
    };
  }

  function playChord(chordIndex = 0) {
    if (!audioCtx || !enabled) return;
    const now = audioCtx.currentTime;
    const chord = CHORDS[chordIndex % CHORDS.length];
    chord.forEach((freq, i) => {
      makeTone(freq, now + i * 0.12, 7.8, i === 0 ? 0.022 : 0.012, i === 0 ? 'sine' : 'triangle');
      makeTone(freq * 2, now + 1.2 + i * 0.18, 4.4, 0.0045, 'sine');
    });
    const bell = chord[2] * 2;
    makeTone(bell, now + 3.2, 2.8, 0.0038, 'sine');
    sequenceTimer = setTimeout(() => playChord((chordIndex + 1) % CHORDS.length), 7800);
  }

  async function startMusic() {
    ensureAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume().catch(() => {});
    }
    if (started) return;
    started = true;
    masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
    masterGain.gain.setValueAtTime(Math.max(masterGain.gain.value, 0.0001), audioCtx.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(0.075, audioCtx.currentTime + 1.5);
    playChord(0);
  }

  function stopMusic() {
    if (!audioCtx) return;
    if (sequenceTimer) clearTimeout(sequenceTimer);
    sequenceTimer = null;
    started = false;
    const now = audioCtx.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(Math.max(masterGain.gain.value, 0.0001), now);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    setTimeout(() => {
      nodes.forEach(node => { try { node.stop && node.stop(); } catch {} try { node.disconnect && node.disconnect(); } catch {} });
      nodes = [];
    }, 950);
  }

  async function toggleMusic() {
    enabled = !enabled;
    savePreference(enabled);
    updateButton();
    if (enabled) await startMusic();
    else stopMusic();
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
    createButton();
    enabled = readPreference() && !isReducedMotion;
    updateButton();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
