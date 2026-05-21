(() => {
  const STORAGE_KEY = 'memoria_familiar_youtube_music_v1';
  const VIDEO_ID = 'PRAGLqfNK1o';
  const YOUTUBE_SRC = `https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&loop=1&playlist=${VIDEO_ID}&controls=0&playsinline=1&rel=0&modestbranding=1`;
  let enabled = true;

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
      .music-panel { position: fixed; left: max(16px, env(safe-area-inset-left)); bottom: max(16px, env(safe-area-inset-bottom)); z-index: 35; display: flex; align-items: center; gap: 10px; padding: 8px; border: 2px solid rgba(228,216,200,.95); border-radius: 999px; background: rgba(255,255,255,.96); box-shadow: 0 14px 36px rgba(46,36,24,.16); backdrop-filter: blur(12px); }
      .music-toggle { min-height: 58px; border: 0; border-radius: 999px; padding: 12px 18px; background: #ecfbf7; color: #075d51; font: 900 1rem Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; display: inline-flex; align-items: center; justify-content: center; gap: 9px; touch-action: manipulation; }
      .music-toggle[aria-pressed="false"] { background: #fff4df; color: #5b3200; }
      .music-toggle:focus-visible { outline: 5px solid rgba(36,107,254,.35); outline-offset: 4px; }
      .music-dot { width: 11px; height: 11px; border-radius: 999px; background: #00a38c; box-shadow: 0 0 0 6px rgba(0,163,140,.16); flex: 0 0 auto; }
      .music-toggle[aria-pressed="false"] .music-dot { background: #b65c00; box-shadow: 0 0 0 6px rgba(182,92,0,.12); }
      .music-frame-wrap { width: 110px; height: 58px; border-radius: 18px; overflow: hidden; background: #eef4ff; border: 1px solid rgba(36,107,254,.18); }
      .music-frame-wrap iframe { width: 180px; height: 110px; border: 0; transform: scale(.62); transform-origin: 0 0; }
      @media (max-width: 580px) { .music-panel { left: 12px; right: 12px; bottom: max(12px, env(safe-area-inset-bottom)); border-radius: 26px; } .music-toggle { flex: 1; } .music-frame-wrap { width: 92px; } body { padding-bottom: 92px; } }
    `;
    document.head.appendChild(style);

    const panel = document.createElement('div');
    panel.className = 'music-panel';
    panel.innerHTML = `
      <button id="musicToggleBtn" class="music-toggle" type="button" aria-label="Apagar o activar música de fondo"></button>
      <div class="music-frame-wrap" aria-hidden="true"><iframe id="musicFrame" title="Música de fondo" allow="autoplay; encrypted-media" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>
    `;
    document.body.appendChild(panel);
    document.getElementById('musicToggleBtn').addEventListener('click', toggleMusic);
    updateUi();
    if (enabled) startMusic();
  }

  function updateUi() {
    const button = document.getElementById('musicToggleBtn');
    if (!button) return;
    button.setAttribute('aria-pressed', String(enabled));
    button.innerHTML = `<span class="music-dot" aria-hidden="true"></span><span>${enabled ? 'Apagar música' : 'Música apagada'}</span>`;
  }

  function startMusic() {
    const frame = document.getElementById('musicFrame');
    if (!frame) return;
    if (!frame.src) frame.src = YOUTUBE_SRC;
  }

  function stopMusic() {
    const frame = document.getElementById('musicFrame');
    if (!frame) return;
    frame.src = '';
  }

  function toggleMusic() {
    enabled = !enabled;
    savePreference(enabled);
    updateUi();
    if (enabled) startMusic();
    else stopMusic();
  }

  function init() {
    enabled = readPreference();
    createUi();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
