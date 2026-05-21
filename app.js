
const app = document.getElementById('app');
const topbar = document.getElementById('topbar');
const backBtn = document.getElementById('backBtn');
const soundBtn = document.getElementById('soundBtn');
const screenTitle = document.getElementById('screenTitle');

const STORAGE_KEY = 'memoria_familiar_v5_limpia_2026';
const AUDIO_EXTENSIONS = ['mp3', 'm4a', 'wav', 'ogg'];
const VOICE = {
  intro: 'assets/audio/guia/intro.mp3',
  lookCalm: 'assets/audio/guia/look_calm.mp3',
  tapOption: 'assets/audio/guia/tap_option.mp3',
  tapPhotoCorrect: 'assets/audio/guia/tap_photo_correct.mp3',
  tapNameCorrect: 'assets/audio/guia/tap_name_correct.mp3',
  tapSamePhoto: 'assets/audio/guia/tap_same_photo.mp3',
  samePhoto: 'assets/audio/guia/same_photo.mp3',
  whoPerson: 'assets/audio/guia/who_person.mp3',
  rememberPerson: 'assets/audio/guia/remember_person.mp3',
  whoInPhoto: 'assets/audio/guia/who_in_photo.mp3',
  wherePhoto: 'assets/audio/guia/where_photo.mp3',
  rememberMoment: 'assets/audio/guia/remember_moment.mp3',
  listenVoice: 'assets/audio/guia/listen_voice.mp3',
  tapItsPhoto: 'assets/audio/guia/tap_its_photo.mp3',
  pressListenAgain: 'assets/audio/guia/press_listen_again.mp3',
  pressRepeat: 'assets/audio/guia/press_repeat.mp3',
  veryGood: 'assets/audio/guia/very_good.mp3',
  doneWell: 'assets/audio/guia/done_well.mp3',
  thatsIt: 'assets/audio/guia/thats_it.mp3',
  perfect: 'assets/audio/guia/perfect.mp3',
  slow: 'assets/audio/guia/slow.mp3',
  noProblem: 'assets/audio/guia/no_problem.mp3',
  tryAgain: 'assets/audio/guia/try_again.mp3',
  stepByStep: 'assets/audio/guia/step_by_step.mp3',
  rest: 'assets/audio/guia/rest.mp3',
  finished: 'assets/audio/guia/finished.mp3',
  thanks: 'assets/audio/guia/thanks.mp3'
};
const REMINISCENCE_QUESTIONS = [
  { text: '¿Recuerdas a esta persona?', voice: ['rememberPerson'] },
  { text: '¿Quién aparece en la foto?', voice: ['whoInPhoto'] },
  { text: '¿Dónde fue esta foto?', voice: ['wherePhoto'] },
  { text: '¿Recuerdas este momento?', voice: ['rememberMoment'] }
];

let state = loadState();
let personas = buildPersonas();
let currentAudio = null;
let voiceToken = 0;

function loadState() {
  const defaults = { voz: true, dificultadParejas: 2, opciones: 2, nombres: {}, relaciones: {} };
  try { return { ...defaults, ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) }; }
  catch { return defaults; }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function buildPersonas() {
  return window.PERSONAS_BASE.map(p => ({ ...p, nombre: state.nombres[p.id] || p.nombre, relacion: state.relaciones[p.id] || p.relacion || 'Familiar' }));
}
function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function sampleOptions(target, count) {
  const total = Math.max(2, Math.min(count || state.opciones || 2, personas.length));
  return shuffle([target, ...shuffle(personas.filter(p => p.id !== target.id)).slice(0, total - 1)]);
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch]));
}
function imageTag(p, alt) {
  return `<img src="${p.foto}" alt="${escapeHtml(alt || p.nombre)}" style="object-position:${p.posicion}">`;
}
function feedbackClass(text) {
  if (!text) return '';
  return /correcto|muy bien|perfecto/i.test(text) ? 'ok' : 'calm';
}
function setScreen(title, showTop = true) {
  topbar.hidden = !showTop;
  screenTitle.textContent = title;
  soundBtn.textContent = state.voz ? '🔊 Voz' : '🔇 Voz';
  soundBtn.setAttribute('aria-pressed', String(state.voz));
}
function stopGuideVoice() {
  voiceToken++;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}
function playOneVoice(key, token) {
  return new Promise(resolve => {
    const src = VOICE[key];
    if (!state.voz || !src || token !== voiceToken) return resolve(false);
    const audio = new Audio(src);
    currentAudio = audio;
    let done = false;
    const finish = ok => {
      if (done) return;
      done = true;
      audio.onended = null;
      audio.onerror = null;
      if (currentAudio === audio) currentAudio = null;
      resolve(ok);
    };
    audio.preload = 'auto';
    audio.volume = 1;
    audio.onended = () => finish(true);
    audio.onerror = () => finish(false);
    audio.play().catch(() => finish(false));
    setTimeout(() => finish(false), 9000);
  });
}
async function playGuide(keys) {
  if (!state.voz) return;
  const list = Array.isArray(keys) ? keys : [keys];
  stopGuideVoice();
  const token = voiceToken;
  for (const key of list) {
    if (token !== voiceToken) return;
    await playOneVoice(key, token);
    await new Promise(r => setTimeout(r, 120));
  }
}
function playAudioCandidate(url) {
  return new Promise(resolve => {
    const audio = new Audio(url);
    currentAudio = audio;
    let done = false;
    const finish = ok => {
      if (done) return;
      done = true;
      audio.onended = null;
      audio.onerror = null;
      if (currentAudio === audio) currentAudio = null;
      resolve(ok);
    };
    audio.onended = () => finish(true);
    audio.onerror = () => finish(false);
    audio.play().catch(() => finish(false));
    setTimeout(() => finish(false), 8000);
  });
}
async function playKnownVoice(person) {
  if (!state.voz) return;
  stopGuideVoice();
  for (const ext of AUDIO_EXTENSIONS) {
    const ok = await playAudioCandidate(`assets/audio/${person.id}.${ext}`);
    if (ok) return;
  }
  await playGuide(['listenVoice', 'tapItsPhoto']);
}
function showModal(title, message, actions) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
    <h2>${escapeHtml(title)}</h2>
    <p>${escapeHtml(message)}</p>
    <div class="inline-actions" style="justify-content:center">
      ${actions.map((a, i) => `<button class="${i === 0 ? 'save-btn' : 'pill'}" data-modal-action="${i}" type="button">${escapeHtml(a.text)}</button>`).join('')}
    </div>
  </div>`;
  document.body.appendChild(backdrop);
  actions.forEach((a, i) => backdrop.querySelector(`[data-modal-action="${i}"]`).addEventListener('click', () => { backdrop.remove(); a.action(); }));
  const first = backdrop.querySelector('button');
  if (first) first.focus();
}
function finishGame(restartAction) {
  playGuide(['finished', 'veryGood']);
  showModal('Actividad terminada', 'Muy bien. Puedes repetirla o volver al inicio.', [
    { text: 'Repetir', action: restartAction },
    { text: 'Inicio', action: renderHome }
  ]);
}

backBtn.addEventListener('click', renderHome);
soundBtn.addEventListener('click', () => {
  state.voz = !state.voz;
  saveState();
  soundBtn.textContent = state.voz ? '🔊 Voz' : '🔇 Voz';
  soundBtn.setAttribute('aria-pressed', String(state.voz));
  if (state.voz) playGuide('intro');
  else stopGuideVoice();
});

function renderHome() {
  personas = buildPersonas();
  setScreen('Memoria Familiar', false);
  const tpl = document.getElementById('homeTemplate').content.cloneNode(true);
  app.innerHTML = '';
  app.appendChild(tpl);
  app.querySelectorAll('[data-action]').forEach(btn => btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    if (action === 'who') startWhoGame();
    if (action === 'same') startSamePhotoGame();
    if (action === 'name-photo') startNamePhotoGame();
    if (action === 'memory') renderMemoryIntro();
    if (action === 'album') startAlbumGame();
    if (action === 'voice') startVoiceGame();
    if (action === 'settings') renderSettings();
  }));
}

function renderNameChoiceGame({ title, instructionText, voice, mode }) {
  setScreen(title);
  const roundList = shuffle(personas).slice(0, Math.min(8, personas.length));
  let index = 0;
  function drawRound(feedback = '') {
    const target = roundList[index];
    const options = sampleOptions(target, state.opciones);
    const prompt = typeof instructionText === 'function' ? instructionText(target) : instructionText;
    const photoBlock = mode === 'photoToName'
      ? `<div class="big-photo-wrap"><div class="big-photo">${imageTag(target, 'Foto para reconocer')}</div><div class="relation-label">${escapeHtml(target.relacion)}</div></div>`
      : `<div class="big-photo-wrap"><div class="person-label" style="font-size:2rem;margin-bottom:12px">${escapeHtml(target.nombre)}</div><div class="relation-label" style="font-size:1.35rem">${escapeHtml(target.relacion)}</div></div>`;
    const choices = mode === 'photoToName'
      ? `<div class="name-options">${options.map(o => `<button class="name-option" data-id="${o.id}" type="button">${escapeHtml(o.nombre)}</button>`).join('')}</div>`
      : `<div class="choice-grid ${options.length > 2 ? 'three' : ''}">${options.map(o => `<button class="choice-card" data-id="${o.id}" type="button" aria-label="${escapeHtml(o.nombre)}">${imageTag(o, o.nombre)}<div class="card-name">${escapeHtml(o.nombre)}</div></button>`).join('')}</div>`;
    app.innerHTML = `<section class="screen-card panel">
      <div class="toolbar"><div class="status-pill">Pregunta ${index + 1} / ${roundList.length}</div><button class="pill" id="repeatInstructionBtn" type="button">Repetir instrucción</button></div>
      <div class="instruction">${escapeHtml(prompt)}</div>
      <div class="feedback ${feedbackClass(feedback)}" id="feedback">${escapeHtml(feedback)}</div>
      <div class="two-column">${photoBlock}<div>${choices}</div></div>
    </section>`;
    document.getElementById('repeatInstructionBtn').addEventListener('click', () => playGuide(voice));
    app.querySelectorAll('[data-id]').forEach(btn => btn.addEventListener('click', () => handleChoice(btn, target.id)));
    playGuide(voice);
  }
  function handleChoice(btn, targetId) {
    if (btn.dataset.id === targetId) {
      btn.classList.add('correct');
      playGuide('veryGood');
      setTimeout(() => {
        index++;
        if (index >= roundList.length) finishGame(() => renderNameChoiceGame({ title, instructionText, voice, mode }));
        else drawRound('Correcto. Muy bien.');
      }, 700);
    } else {
      btn.classList.add('soft-wrong');
      const feedback = document.getElementById('feedback');
      feedback.textContent = 'No pasa nada. Prueba otra opción.';
      feedback.className = 'feedback calm';
      playGuide(['noProblem', 'tryAgain']);
    }
  }
  drawRound();
}
function startWhoGame() {
  renderNameChoiceGame({ title: '¿Quién es esta persona?', instructionText: '¿Quién es esta persona? Toca el nombre correcto.', voice: ['whoPerson', 'tapNameCorrect'], mode: 'photoToName' });
}
function startNamePhotoGame() {
  renderNameChoiceGame({ title: 'Foto + nombre', instructionText: target => `Busca la foto de ${target.nombre}.`, voice: ['tapPhotoCorrect'], mode: 'nameToPhoto' });
}
function startSamePhotoGame() {
  setScreen('Encuentra la misma foto');
  const roundList = shuffle(personas).slice(0, Math.min(8, personas.length));
  let index = 0;
  function drawRound(feedback = '') {
    const target = roundList[index];
    const options = sampleOptions(target, state.opciones);
    app.innerHTML = `<section class="screen-card panel">
      <div class="toolbar"><div class="status-pill">Pregunta ${index + 1} / ${roundList.length}</div><button class="pill" id="repeatSameBtn" type="button">Repetir instrucción</button></div>
      <div class="instruction">Mira la foto grande. Busca la misma foto.</div>
      <div class="feedback ${feedbackClass(feedback)}" id="feedback">${escapeHtml(feedback)}</div>
      <div class="two-column">
        <div class="target-box"><h2>Foto a buscar</h2><div class="target-photo">${imageTag(target, 'Foto objetivo')}</div></div>
        <div><h2>Elige aquí</h2><div class="choice-grid ${options.length > 2 ? 'three' : ''}">${options.map(o => `<button class="choice-card" data-id="${o.id}" type="button" aria-label="${escapeHtml(o.nombre)}">${imageTag(o, o.nombre)}<div class="card-name">${escapeHtml(o.nombre)}</div></button>`).join('')}</div></div>
      </div>
    </section>`;
    document.getElementById('repeatSameBtn').addEventListener('click', () => playGuide(['lookCalm', 'samePhoto']));
    app.querySelectorAll('[data-id]').forEach(btn => btn.addEventListener('click', () => handleChoice(btn, target.id)));
    playGuide(['lookCalm', 'samePhoto']);
  }
  function handleChoice(btn, targetId) {
    if (btn.dataset.id === targetId) {
      btn.classList.add('correct');
      playGuide('veryGood');
      setTimeout(() => {
        index++;
        if (index >= roundList.length) finishGame(startSamePhotoGame);
        else drawRound('Correcto. Vamos con otra foto.');
      }, 700);
    } else {
      btn.classList.add('soft-wrong');
      const feedback = document.getElementById('feedback');
      feedback.textContent = 'No pasa nada. Mira otra vez la foto grande y prueba otra.';
      feedback.className = 'feedback calm';
      playGuide(['noProblem', 'tryAgain']);
    }
  }
  drawRound();
}
function renderMemoryIntro() {
  setScreen('Empareja caras iguales');
  app.innerHTML = `<section class="screen-card panel">
    <div><h2>Empareja caras iguales</h2><p class="lead">Primero se pueden ver las fotos. Después se tapan y se buscan las parejas. Empieza con pocas cartas.</p></div>
    <div class="controls" role="group" aria-label="Elegir dificultad">${[2,3,4].filter(n => n <= personas.length).map(n => `<button class="pill ${state.dificultadParejas === n ? 'active' : ''}" data-pairs="${n}" type="button">${n * 2} cartas</button>`).join('')}</div>
    <button class="activity-card blue" id="startMemoryBtn" type="button"><span>Empezar</span><small>Sin cronómetro, sin fallos negativos.</small></button>
  </section>`;
  app.querySelectorAll('[data-pairs]').forEach(btn => btn.addEventListener('click', () => { state.dificultadParejas = Number(btn.dataset.pairs); saveState(); renderMemoryIntro(); }));
  document.getElementById('startMemoryBtn').addEventListener('click', () => startMemoryGame(state.dificultadParejas));
  playGuide(['tapOption']);
}
function startMemoryGame(pairCount) {
  setScreen('Empareja caras iguales');
  const selected = shuffle(personas).slice(0, pairCount);
  const deck = shuffle(selected.flatMap(p => [{ ...p, cardId: `${p.id}-a` }, { ...p, cardId: `${p.id}-b` }]));
  let open = [];
  let matched = new Set();
  let lock = false;
  app.innerHTML = `<section class="screen-card panel">
    <div class="toolbar"><div class="status-pill" id="memoryStatus">Parejas: 0 / ${pairCount}</div><div class="controls"><button class="pill help" id="peekBtn" type="button">Ver fotos</button><button class="pill" id="restartBtn" type="button">Repetir</button></div></div>
    <div class="instruction">Toca una carta. Después busca su pareja igual.</div>
    <div class="feedback" id="memoryFeedback"></div>
    <div class="memory-grid" id="memoryGrid"></div>
  </section>`;
  const grid = document.getElementById('memoryGrid');
  const status = document.getElementById('memoryStatus');
  const feedback = document.getElementById('memoryFeedback');
  function draw() {
    grid.innerHTML = deck.map(card => {
      const isOpen = open.some(c => c.cardId === card.cardId) || matched.has(card.id);
      return `<button class="memory-card ${isOpen ? 'open' : ''} ${matched.has(card.id) ? 'matched' : ''}" data-card="${card.cardId}" type="button" aria-label="Tarjeta">
        <div class="back" aria-hidden="true">?</div><div class="face">${imageTag(card, card.nombre)}<div class="card-name">${escapeHtml(card.nombre)}</div></div>
      </button>`;
    }).join('');
    grid.querySelectorAll('.memory-card').forEach(btn => btn.addEventListener('click', () => flip(btn.dataset.card)));
    status.textContent = `Parejas: ${matched.size} / ${pairCount}`;
  }
  function flip(cardId) {
    if (lock) return;
    const card = deck.find(c => c.cardId === cardId);
    if (!card || matched.has(card.id) || open.some(c => c.cardId === cardId)) return;
    open.push(card);
    feedback.textContent = open.length === 1 ? 'Busca la foto igual.' : '';
    feedback.className = 'feedback';
    draw();
    if (open.length === 1) playGuide('samePhoto');
    if (open.length === 2) {
      const [a,b] = open;
      if (a.id === b.id) {
        matched.add(a.id);
        open = [];
        feedback.textContent = 'Correcto. Son iguales.';
        feedback.className = 'feedback ok';
        draw();
        playGuide(['veryGood']);
        if (matched.size === pairCount) setTimeout(() => finishGame(() => startMemoryGame(pairCount)), 750);
      } else {
        lock = true;
        feedback.textContent = 'No pasa nada. Lo intentamos otra vez.';
        feedback.className = 'feedback calm';
        playGuide(['noProblem', 'tryAgain']);
        setTimeout(() => { open = []; lock = false; draw(); }, 1500);
      }
    }
  }
  document.getElementById('peekBtn').addEventListener('click', () => {
    if (lock) return;
    lock = true;
    open = deck.filter(c => !matched.has(c.id));
    feedback.textContent = 'Mira las fotos con calma.';
    feedback.className = 'feedback';
    draw();
    playGuide('lookCalm');
    setTimeout(() => { open = []; lock = false; feedback.textContent = ''; draw(); }, 5200);
  });
  document.getElementById('restartBtn').addEventListener('click', () => startMemoryGame(pairCount));
  draw();
  setTimeout(() => document.getElementById('peekBtn').click(), 300);
}
function startAlbumGame() {
  setScreen('Álbum de recuerdos');
  const roundList = shuffle(personas);
  let index = 0;
  let questionIndex = 0;
  function draw() {
    const person = roundList[index];
    const question = REMINISCENCE_QUESTIONS[questionIndex % REMINISCENCE_QUESTIONS.length];
    app.innerHTML = `<section class="screen-card panel">
      <div class="toolbar"><div class="status-pill">Foto ${index + 1} / ${roundList.length}</div><button class="pill" id="readQuestionBtn" type="button">Leer pregunta</button></div>
      <div class="album-layout">
        <div class="album-photo-wrap"><div class="album-photo">${imageTag(person, person.nombre)}</div><div class="person-label">${escapeHtml(person.nombre)}</div><div class="relation-label">${escapeHtml(person.relacion)}</div></div>
        <div class="question-box"><p>${escapeHtml(question.text)}</p><div class="inline-actions"><button class="save-btn" id="nextQuestionBtn" type="button">Otra pregunta</button><button class="pill" id="nextPhotoBtn" type="button">Siguiente foto</button></div><div class="small-help">La respuesta puede ser oral. No hace falta escribir ni acertar.</div></div>
      </div>
    </section>`;
    document.getElementById('readQuestionBtn').addEventListener('click', () => playGuide(question.voice));
    document.getElementById('nextQuestionBtn').addEventListener('click', () => { questionIndex++; draw(); });
    document.getElementById('nextPhotoBtn').addEventListener('click', () => { index++; questionIndex = 0; if (index >= roundList.length) finishGame(startAlbumGame); else draw(); });
    playGuide(question.voice);
  }
  draw();
}
function startVoiceGame() {
  setScreen('Voz conocida + foto');
  const roundList = shuffle(personas).slice(0, Math.min(8, personas.length));
  let index = 0;
  function draw(feedback = '') {
    const target = roundList[index];
    const options = sampleOptions(target, state.opciones);
    app.innerHTML = `<section class="screen-card panel">
      <div class="toolbar"><div class="status-pill">Pregunta ${index + 1} / ${roundList.length}</div><button class="pill help" id="listenBtn" type="button">Escuchar voz</button></div>
      <div class="instruction">Escucha la voz y toca la foto correcta.</div>
      <div class="feedback ${feedbackClass(feedback)}" id="feedback">${escapeHtml(feedback)}</div>
      <div class="choice-grid ${options.length > 2 ? 'three' : ''}">${options.map(o => `<button class="choice-card" data-id="${o.id}" type="button" aria-label="${escapeHtml(o.nombre)}">${imageTag(o, o.nombre)}<div class="card-name">${escapeHtml(o.nombre)}</div></button>`).join('')}</div>
      <div class="small-help">Para este juego, añade audios familiares en assets/audio con nombres p1.mp3, p2.mp3, etc.</div>
    </section>`;
    document.getElementById('listenBtn').addEventListener('click', () => playKnownVoice(target));
    app.querySelectorAll('[data-id]').forEach(btn => btn.addEventListener('click', () => handleChoice(btn, target.id)));
  }
  function handleChoice(btn, targetId) {
    if (btn.dataset.id === targetId) {
      btn.classList.add('correct');
      playGuide('veryGood');
      setTimeout(() => { index++; if (index >= roundList.length) finishGame(startVoiceGame); else draw('Correcto. Vamos con otra voz.'); }, 700);
    } else {
      btn.classList.add('soft-wrong');
      const feedback = document.getElementById('feedback');
      feedback.textContent = 'No pasa nada. Escucha otra vez y prueba otra foto.';
      feedback.className = 'feedback calm';
      playGuide(['noProblem', 'tryAgain']);
    }
  }
  draw();
  playGuide(['listenVoice', 'tapPhotoCorrect']);
}
function renderSettings() {
  setScreen('Configuración');
  personas = buildPersonas();
  app.innerHTML = `<section class="screen-card panel">
    <div><h2>Configuración</h2><p class="lead">Cambia nombres genéricos por nombres familiares. También puedes añadir parentesco o relación.</p></div>
    <div class="controls"><button class="pill ${state.voz ? 'active' : ''}" id="voiceToggle" type="button">Voz ${state.voz ? 'activada' : 'desactivada'}</button><button class="pill" id="twoOptionsBtn" type="button">2 opciones</button><button class="pill" id="threeOptionsBtn" type="button">3 opciones</button></div>
    <div class="instruction">La voz guía usa audios humanos procesados. No utiliza voz robotizada del navegador.</div>
    <div class="settings-list">${personas.map((p,i) => `<div class="person-row">${imageTag(p,p.nombre)}<div><label>Foto ${i + 1}</label><div class="field-grid"><input data-name="${p.id}" value="${escapeHtml(p.nombre)}" autocomplete="off" aria-label="Nombre de foto ${i + 1}"><input data-relation="${p.id}" value="${escapeHtml(p.relacion)}" autocomplete="off" aria-label="Relación de foto ${i + 1}"></div><div class="small-help">Audio familiar opcional: assets/audio/${p.id}.mp3</div></div></div>`).join('')}</div>
    <div class="inline-actions"><button class="save-btn" id="saveNamesBtn" type="button">Guardar</button><button class="pill" id="resetNamesBtn" type="button">Restaurar</button></div>
  </section>`;
  document.getElementById('voiceToggle').addEventListener('click', () => { state.voz = !state.voz; saveState(); renderSettings(); if (state.voz) playGuide('intro'); else stopGuideVoice(); });
  document.getElementById('twoOptionsBtn').classList.toggle('active', state.opciones === 2);
  document.getElementById('threeOptionsBtn').classList.toggle('active', state.opciones === 3);
  document.getElementById('twoOptionsBtn').addEventListener('click', () => { state.opciones = 2; saveState(); renderSettings(); });
  document.getElementById('threeOptionsBtn').addEventListener('click', () => { state.opciones = 3; saveState(); renderSettings(); });
  document.getElementById('saveNamesBtn').addEventListener('click', () => {
    app.querySelectorAll('[data-name]').forEach(input => state.nombres[input.dataset.name] = input.value.trim() || input.dataset.name);
    app.querySelectorAll('[data-relation]').forEach(input => state.relaciones[input.dataset.relation] = input.value.trim() || 'Familiar');
    saveState();
    personas = buildPersonas();
    showModal('Guardado', 'Los datos se han guardado en este dispositivo.', [{ text: 'Aceptar', action: renderSettings }]);
  });
  document.getElementById('resetNamesBtn').addEventListener('click', () => { state.nombres = {}; state.relaciones = {}; saveState(); showModal('Restaurado', 'Se han restaurado los datos genéricos.', [{ text: 'Aceptar', action: renderSettings }]); });
}

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
renderHome();
