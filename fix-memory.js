function renderMemoryIntro() {
  setScreen('Empareja caras iguales');
  const currentPairs = Number(state.dificultadParejas) || 2;
  app.innerHTML = `<section class="screen-card panel">
    <div><h2>Empareja caras iguales</h2><p class="lead">Primero se ven las fotos unos segundos. Después se tapan y hay que encontrar las dos cartas iguales.</p></div>
    <div class="controls" role="group" aria-label="Elegir dificultad">${[2,3,4].filter(n => n <= personas.length).map(n => `<button class="pill ${currentPairs === n ? 'active' : ''}" data-pairs="${n}" type="button">${n * 2} cartas</button>`).join('')}</div>
    <button class="activity-card blue" id="startMemoryBtn" type="button"><span>Empezar</span><small>Sin cronómetro, sin fallos negativos.</small></button>
  </section>`;
  app.querySelectorAll('[data-pairs]').forEach(btn => btn.addEventListener('click', () => {
    state.dificultadParejas = Number(btn.dataset.pairs);
    saveState();
    renderMemoryIntro();
  }));
  document.getElementById('startMemoryBtn').addEventListener('click', () => startMemoryGame(Number(state.dificultadParejas) || 2));
  playGuide(['tapOption']);
}

function startMemoryGame(pairCount) {
  setScreen('Empareja caras iguales');
  const safePairCount = Math.max(2, Math.min(Number(pairCount) || 2, personas.length));
  const selected = shuffle(personas).slice(0, safePairCount);
  const deck = shuffle(selected.flatMap(p => [
    { ...p, cardId: `${p.id}-a` },
    { ...p, cardId: `${p.id}-b` }
  ]));

  let openCards = [];
  let matched = new Set();
  let lock = false;
  let preview = false;
  let previewTimer = null;

  app.innerHTML = `<section class="screen-card panel" id="memoryRoot">
    <div class="toolbar">
      <div class="status-pill" id="memoryStatus">Parejas: 0 / ${safePairCount}</div>
      <div class="controls">
        <button class="pill help" id="peekBtn" type="button">Ver fotos</button>
        <button class="pill" id="restartBtn" type="button">Repetir</button>
      </div>
    </div>
    <div class="instruction" id="memoryInstruction">Toca una carta. Después busca su pareja igual.</div>
    <div class="feedback" id="memoryFeedback"></div>
    <div class="memory-grid" id="memoryGrid"></div>
  </section>`;

  const root = document.getElementById('memoryRoot');
  const grid = document.getElementById('memoryGrid');
  const status = document.getElementById('memoryStatus');
  const feedback = document.getElementById('memoryFeedback');
  const instruction = document.getElementById('memoryInstruction');
  const peekBtn = document.getElementById('peekBtn');
  const restartBtn = document.getElementById('restartBtn');

  function stillHere() {
    return root && root.isConnected && document.getElementById('memoryGrid') === grid;
  }

  function setFeedback(text, className = '') {
    if (!stillHere()) return;
    feedback.textContent = text;
    feedback.className = `feedback ${className}`.trim();
  }

  function draw() {
    if (!stillHere()) return;
    grid.innerHTML = deck.map(card => {
      const isOpen = preview || openCards.some(c => c.cardId === card.cardId) || matched.has(card.id);
      const isMatched = matched.has(card.id);
      return `<button class="memory-card ${isOpen ? 'open' : ''} ${isMatched ? 'matched' : ''}" data-card="${card.cardId}" type="button" aria-label="Carta ${isOpen ? escapeHtml(card.nombre) : 'tapada'}" ${isMatched ? 'disabled' : ''}>
        <div class="back" aria-hidden="true">?</div>
        <div class="face">${imageTag(card, card.nombre)}<div class="card-name">${escapeHtml(card.nombre)}</div></div>
      </button>`;
    }).join('');
    status.textContent = `Parejas: ${matched.size} / ${safePairCount}`;
    peekBtn.textContent = preview ? 'Ocultando...' : 'Ver fotos';
  }

  function stopPreview() {
    if (previewTimer) clearTimeout(previewTimer);
    previewTimer = null;
    preview = false;
    lock = false;
    openCards = [];
    if (stillHere()) {
      instruction.textContent = 'Toca una carta. Después busca su pareja igual.';
      setFeedback('Ahora busca las parejas iguales.');
      draw();
    }
  }

  function showPreview(duration = 4200) {
    if (previewTimer) clearTimeout(previewTimer);
    preview = true;
    lock = true;
    openCards = [];
    instruction.textContent = 'Mira las fotos con calma. Luego se taparán.';
    setFeedback('Observa dónde está cada cara.');
    draw();
    playGuide('lookCalm');
    previewTimer = setTimeout(stopPreview, duration);
  }

  function flip(cardId) {
    if (lock || preview || !stillHere()) return;
    const card = deck.find(c => c.cardId === cardId);
    if (!card || matched.has(card.id) || openCards.some(c => c.cardId === cardId)) return;

    openCards.push(card);
    if (openCards.length === 1) {
      setFeedback('Busca la otra carta igual.');
      draw();
      playGuide('samePhoto');
      return;
    }

    if (openCards.length === 2) {
      draw();
      const [first, second] = openCards;
      if (first.id === second.id) {
        matched.add(first.id);
        openCards = [];
        setFeedback('Correcto. Son iguales.', 'ok');
        draw();
        playGuide('veryGood');
        if (matched.size === safePairCount) {
          lock = true;
          setTimeout(() => { if (stillHere()) finishGame(() => startMemoryGame(safePairCount)); }, 750);
        }
      } else {
        lock = true;
        setFeedback('No pasa nada. Se tapan y lo intentamos otra vez.', 'calm');
        playGuide(['noProblem', 'tryAgain']);
        setTimeout(() => {
          openCards = [];
          lock = false;
          setFeedback('Toca otra carta.');
          draw();
        }, 1300);
      }
    }
  }

  grid.addEventListener('click', event => {
    const cardButton = event.target.closest('.memory-card');
    if (!cardButton || !grid.contains(cardButton)) return;
    flip(cardButton.dataset.card);
  });

  peekBtn.addEventListener('click', () => showPreview(4200));
  restartBtn.addEventListener('click', () => {
    if (previewTimer) clearTimeout(previewTimer);
    startMemoryGame(safePairCount);
  });

  draw();
  showPreview(3600);
}
