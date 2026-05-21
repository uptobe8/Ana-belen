(() => {
  const STORAGE_KEY = 'memoria_familiar_youtube_music_v2';
  const VIDEO_ID = 'PRAGLqfNK1o';
  const SRC = `https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&loop=1&playlist=${VIDEO_ID}&controls=0&playsinline=1&rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;

  let enabled = true;
  let started = false;
  let frame = null;

  function readPreference() {
    try { return localStorage.getItem(STORAGE_KEY) !== 'off'; }
    catch { return true; }
  }

  function savePreference(value) {
    try { localStorage.setItem(STORAGE_KEY, value ? 'on' : 'off'); }
    catch {}
  }

  function createUi() {
    const style = document.createElement('style');
    style.textContent = `
      .music-panel { position: fixed; left: max(16px, env(safe-area-inset-left)); bottom: max(16px, env(safe-area-inset-bottom)); z-index: 35; display: flex; align-items: center; padding: 8px; border: 2px solid rgba(228,216,200,.95); border-radius: 999px; background: rgba(255,255,255,.96); box-shadow: 0 14px 36px rgba(46,36,24,.16); backdrop-filter: blur(12px); }
      .music-toggle { min-height: 58px; border: 0; border-radius: 999px; padding: 12px 18px; background: #ecfbf7; color: #075d51; font: 900 1rem Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; display: inline-flex; align-items: center; justify-content: center; gap: 9px; touch-action: manipulation; }
      .music-toggle[aria-pressed="false"] { background: #fff4df; color: #5b3200; }
      .music-toggle:focus-visible { outline: 5px solid rgba(36,107,254,.35); outline-offset: 4px; }
      .music-dot { width: 11px; height: 11px; border-radius: 999px; background: #00a38c; box-shadow: 0 0 0 6px rgba(0,163,140,.16); flex: 0 0 auto; }
      .music-toggle[aria-pressed="false"] .music-dot { background: #b65c00; box-shadow: 0 0 0 6px rgba(182,92,0,.12); }
      #ytBackgroundMusic { position: fixed; width: 320px; height: 180px; left: -10000px; top: -10000px; opacity: 0.01; pointer-events: none; border: 0; }
      @media (max-width: 580px) { .music-panel { left: 12px; right: 12px; bottom: max(12px, env(safe-area-inset-bottom)); border-radius: 26px; } .music-toggle { flex: 1; } body { padding-bottom: 92px; } }
    `;
    document.head.appendChild(style);

    const panel = document.createElement('div');
    panel.className = 'music-panel';
    panel.innerHTML = `<button id="musicToggleBtn" class="music-toggle" type="button" aria-label="Apagar o activar música de fondo"></button>`;
    document.body.appendChild(panel);

    frame = document.createElement('iframe');
    frame.id = 'ytBackgroundMusic';
    frame.title = 'Música de fondo';
    frame.allow = 'autoplay; encrypted-media';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    document.body.appendChild(frame);

    document.getElementById('musicToggleBtn').addEventListener('click', event => {
      event.stopPropagation();
      toggleMusic();
    });
    updateUi();
  }

  function updateUi() {
    const button = document.getElementById('musicToggleBtn');
    if (!button) return;
    button.setAttribute('aria-pressed', String(enabled));
    button.innerHTML = `<span class="music-dot" aria-hidden="true"></span><span>${enabled ? 'Apagar música' : 'Música apagada'}</span>`;
  }

  function command(func) {
    try {
      if (!frame || !frame.contentWindow) return;
      frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');
    } catch {}
  }

  function startMusic() {
    if (!enabled || !frame) return;
    if (!frame.src) frame.src = SRC;
    started = true;
    setTimeout(() => { command('unMute'); command('playVideo'); command('setVolume'); }, 400);
    setTimeout(() => { command('unMute'); command('playVideo'); }, 1200);
    setTimeout(() => { command('unMute'); command('playVideo'); }, 3000);
  }

  function stopMusic() {
    started = false;
    command('pauseVideo');
    if (frame) frame.src = '';
  }

  function toggleMusic() {
    enabled = !enabled;
    savePreference(enabled);
    updateUi();
    if (enabled) startMusic();
    else stopMusic();
  }

  function bindFallbackStart() {
    const tryStart = () => {
      if (!enabled) return;
      if (!started || !frame.src) startMusic();
      else { command('unMute'); command('playVideo'); }
    };
    ['pointerdown', 'touchstart', 'click', 'keydown', 'scroll'].forEach(type => {
      window.addEventListener(type, tryStart, { passive: true, capture: true });
    });
  }

  function init() {
    enabled = readPreference();
    createUi();
    bindFallbackStart();
    if (enabled) {
      startMusic();
      setTimeout(startMusic, 900);
      setTimeout(startMusic, 2500);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
