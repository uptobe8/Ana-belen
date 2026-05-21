(() => {
  const STORAGE_KEY = 'memoria_familiar_youtube_music_v4';
  const TRACK_KEY = 'memoria_familiar_youtube_track_v2';
  const OLD_KEYS = [
    'memoria_familiar_musica_relajante_v1',
    'memoria_familiar_musica_relajante_v2',
    'memoria_familiar_youtube_music_v1',
    'memoria_familiar_youtube_music_v2',
    'memoria_familiar_youtube_music_v3'
  ];
  const TRACKS = [
    { id: 'PRAGLqfNK1o', name: 'Jazz Radio' },
    { id: 'NJuSStkIZBg', name: 'Jazz tranquilo' },
    { id: 'WAclZ03EH6s', name: 'Jazz suave' },
    { id: 'BhafPvwQqAs', name: 'Jazz relajante' },
    { id: 'i8W-LdXKT6s', name: 'Jazz ambiente' }
  ];

  let enabled = true;
  let current = 0;
  let frame = null;
  let retryTimer = null;

  function cleanOldState() {
    try { OLD_KEYS.forEach(key => localStorage.removeItem(key)); } catch {}
  }

  function readEnabled() {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return value !== 'off';
    } catch { return true; }
  }

  function saveEnabled(value) {
    try { localStorage.setItem(STORAGE_KEY, value ? 'on' : 'off'); } catch {}
  }

  function readTrack() {
    try {
      const value = Number(localStorage.getItem(TRACK_KEY));
      return Number.isFinite(value) ? Math.max(0, Math.min(TRACKS.length - 1, value)) : 0;
    } catch { return 0; }
  }

  function saveTrack(value) {
    try { localStorage.setItem(TRACK_KEY, String(value)); } catch {}
  }

  function youtubeSrc(track) {
    const id = track.id;
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&loop=1&playlist=${id}&controls=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;
  }

  function createUi() {
    const style = document.createElement('style');
    style.textContent = `
      .music-panel{position:fixed;left:max(16px,env(safe-area-inset-left));bottom:max(16px,env(safe-area-inset-bottom));z-index:35;display:grid;grid-template-columns:150px 210px;gap:10px;padding:10px;border:2px solid rgba(228,216,200,.95);border-radius:24px;background:rgba(255,255,255,.97);box-shadow:0 14px 36px rgba(46,36,24,.18);backdrop-filter:blur(12px)}
      .music-video{width:150px;height:84px;border-radius:18px;overflow:hidden;background:#eef4ff;border:1px solid rgba(36,107,254,.18)}
      .music-video iframe{width:100%;height:100%;border:0;display:block}
      .music-controls{display:grid;gap:8px;align-content:center}
      .music-toggle,.music-select{min-height:42px;border-radius:16px;padding:9px 12px;font:900 .95rem Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}
      .music-toggle{border:0;background:#ecfbf7;color:#075d51;display:inline-flex;align-items:center;justify-content:center;gap:9px;touch-action:manipulation}
      .music-toggle[aria-pressed="false"]{background:#fff4df;color:#5b3200}
      .music-select{background:#eef4ff;color:#0f285d;border:2px solid rgba(36,107,254,.16)}
      .music-dot{width:11px;height:11px;border-radius:999px;background:#00a38c;box-shadow:0 0 0 6px rgba(0,163,140,.16);flex:0 0 auto}
      .music-toggle[aria-pressed="false"] .music-dot{background:#b65c00;box-shadow:0 0 0 6px rgba(182,92,0,.12)}
      @media(max-width:720px){.music-panel{left:12px;right:12px;bottom:max(12px,env(safe-area-inset-bottom));grid-template-columns:130px 1fr;border-radius:22px}.music-video{width:130px;height:74px}.music-toggle,.music-select{min-height:42px;font-size:.9rem}body{padding-bottom:112px}}
    `;
    document.head.appendChild(style);

    const panel = document.createElement('div');
    panel.className = 'music-panel';
    panel.innerHTML = `
      <div class="music-video"><iframe id="ytBackgroundMusic" title="Música relajante" allow="autoplay; encrypted-media" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>
      <div class="music-controls">
        <button id="musicToggleBtn" class="music-toggle" type="button" aria-label="Apagar o activar música de fondo"></button>
        <select id="musicSelect" class="music-select" aria-label="Elegir música">${TRACKS.map((track, index) => `<option value="${index}">${track.name}</option>`).join('')}</select>
      </div>`;
    document.body.appendChild(panel);

    frame = document.getElementById('ytBackgroundMusic');
    document.getElementById('musicToggleBtn').addEventListener('click', event => {
      event.stopPropagation();
      toggleMusic();
    });
    document.getElementById('musicSelect').addEventListener('change', event => {
      current = Number(event.target.value);
      saveTrack(current);
      if (enabled) startMusic(true);
    });
    updateUi();
  }

  function updateUi() {
    const button = document.getElementById('musicToggleBtn');
    const select = document.getElementById('musicSelect');
    if (select) select.value = String(current);
    if (!button) return;
    button.setAttribute('aria-pressed', String(enabled));
    button.innerHTML = `<span class="music-dot" aria-hidden="true"></span><span>${enabled ? 'Apagar música' : 'Activar música'}</span>`;
  }

  function startMusic(force = false) {
    if (!enabled || !frame) return;
    const nextSrc = youtubeSrc(TRACKS[current]);
    if (force || frame.src !== nextSrc) frame.src = nextSrc;
    scheduleRetry();
  }

  function scheduleRetry() {
    clearTimeout(retryTimer);
    retryTimer = setTimeout(() => {
      if (enabled && frame && !frame.src) startMusic(true);
    }, 1200);
  }

  function stopMusic() {
    clearTimeout(retryTimer);
    if (frame) frame.src = '';
  }

  function toggleMusic() {
    enabled = !enabled;
    saveEnabled(enabled);
    updateUi();
    if (enabled) startMusic(true);
    else stopMusic();
  }

  function bindHomeAutostart() {
    const start = () => { if (enabled) startMusic(false); };
    ['pointerdown','touchstart','click','keydown','scroll','mousemove'].forEach(type => {
      window.addEventListener(type, start, { passive: true, capture: true });
    });
  }

  function init() {
    cleanOldState();
    current = readTrack();
    enabled = readEnabled();
    createUi();
    bindHomeAutostart();
    if (enabled) {
      startMusic(true);
      setTimeout(() => startMusic(false), 500);
      setTimeout(() => startMusic(false), 1500);
      setTimeout(() => startMusic(false), 3000);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
