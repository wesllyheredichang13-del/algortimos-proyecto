// ===== Utilidades =====
    const removeDiacritics = (s) => s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-ZñÑáéíóúÁÉÍÓÚüÜ]/g, char => char); // preserva ñ/Ñ

    const ABC_ROWS = [
      [...'qwertyuiop'],
      [...'asdfghjkl' , 'ñ'],
      ['←', ...'zxcvbnm', '⏎']
    ];

    // Palabras (puedes ampliar la lista)
    let WORDS = [
      'computadora','javascript','teclado','programación','algoritmo','ahorcado','guatemala',
      'telefono','universidad','internet','navegador','pantalla','palomitas','biblioteca',
      'mariposa','murciélago','pingüino','carácter','fútbol','canción','sofá','camión',
      'ratón','avión','jardín','corazón','mañana','año','señal','piñata','espátula','búho'
    ];

    // ===== Estado del Juego =====
    const MAX_ERRORS = 6;
    let secretOriginal = '';
    let secretPlain = '';
    let guessed = new Set();
    let errors = 0;

    // ===== Selectores =====
    const $lives = document.getElementById('lives');
    const $mistakes = document.getElementById('mistakes');
    const $hint = document.getElementById('hint');
    const $word = document.getElementById('word');
    const $result = document.getElementById('result');
    const $new = document.getElementById('newGame');
    const $reveal = document.getElementById('reveal');
    const $custom = document.getElementById('customWord');
    const $addWord = document.getElementById('addWord');

    const parts = [
      'part-head','part-body','part-armL','part-armR','part-legL','part-legR'
    ].map(id => document.getElementById(id));

    // ===== Inicializar teclado =====
    const makeKey = (ch) => {
      const btn = document.createElement('button');
      btn.className = 'key';
      btn.type = 'button';
      btn.setAttribute('aria-pressed','false');
      btn.textContent = ch;
      btn.addEventListener('click', () => handleKey(ch));
      return btn;
    };

    const row1 = document.getElementById('row1');
    const row2 = document.getElementById('row2');
    const row3 = document.getElementById('row3');
    ABC_ROWS[0].forEach(c => row1.appendChild(makeKey(c)));
    ABC_ROWS[1].forEach(c => row2.appendChild(makeKey(c)));
    ABC_ROWS[2].forEach(c => row3.appendChild(makeKey(c)));

    // ===== Lógica principal =====

    const urlParams = new URLSearchParams(window.location.search);
    const nivel = urlParams.get('nivel');  // 'facil', 'intermedio', o 'dificil'

    // Mostrar el nivel seleccionado en el HTML (solo si el elemento existe)
    const $nivelSeleccionado = document.getElementById('nivelSeleccionado');
    if ($nivelSeleccionado) {
      $nivelSeleccionado.textContent = `Nivel seleccionado: ${nivel}`;
    }

    let palabrasDisponibles = [];

    // Filtrar palabras según la dificultad seleccionada usando el array WORDS
    if (nivel === 'facil') {
      palabrasDisponibles = WORDS.filter(w => {
        const len = w.trim().length;
        return len >= 3 && len <= 4;
      });
    } else if (nivel === 'intermedio') {
      palabrasDisponibles = WORDS.filter(w => {
        const len = w.trim().length;
        return len >= 5 && len <= 6;
      });
    } else if (nivel === 'dificil') {
      palabrasDisponibles = WORDS.filter(w => w.trim().length >= 7);
    }

    function pickWord(){
      // usar el pool filtrado si existe, sino usar WORDS completo
      const pool = (palabrasDisponibles && palabrasDisponibles.length) ? palabrasDisponibles : WORDS;
      const choice = pool[Math.floor(Math.random()*pool.length)];
      secretOriginal = choice.trim();
      secretPlain = removeDiacritics(choice.toLowerCase());
      guessed = new Set();
      errors = 0;
      updateUI(true);
    }

    function updateUI(resetKeys = false) {
  // vidas / errores / pista
  $lives.textContent = String(MAX_ERRORS - errors);
  $mistakes.textContent = String(errors);
  $hint.textContent = `${secretOriginal.length} letras`;

  // palabra
  $word.innerHTML = '';
  [...secretOriginal].forEach((char, idx) => {
    const div = document.createElement('div');
    div.className = 'letter' + (isRevealed(idx) ? ' revealed' : '');
    div.textContent = isSpaceOrDash(char) ? char : (isRevealed(idx) ? char.toUpperCase() : '');
    $word.appendChild(div);
  });

  // resultado
  $result.className = 'result';
  if (isWin()) {
    $result.textContent = '¡Ganaste! 🎉';
    $result.classList.add('show', 'win');
    disableAllKeys(true);
    
    // Mostrar el botón de "Volver a Jugar"
    document.getElementById('restartGame').style.display = 'block';
  } else if (isLose()) {
    $result.textContent = `Perdiste 😵 La palabra era: "${secretOriginal.toUpperCase()}"`;
    $result.classList.add('show', 'lose');
    disableAllKeys(true);
  }

  // partes del ahorcado
  parts.forEach((g, i) => g.style.display = (i < errors) ? 'block' : 'none');

  if (resetKeys) {
    document.querySelectorAll('.key').forEach(k => k.disabled = false);
  }
}
    function isSpaceOrDash(c){ return /[\s-]/.test(c) }

    function isRevealed(index){
      const orig = secretOriginal[index];
      if(isSpaceOrDash(orig)) return true;
      const plain = removeDiacritics(orig.toLowerCase());
      return guessed.has(plain);
    }

    function isWin(){
      for(let i=0;i<secretOriginal.length;i++){
        if(isSpaceOrDash(secretOriginal[i])) continue;
        const plain = removeDiacritics(secretOriginal[i].toLowerCase());
        if(!guessed.has(plain)) return false;
      }
      return errors <= MAX_ERRORS;
    }

    function isLose(){ return errors >= MAX_ERRORS }

    function handleKey(ch){
      if(isWin() || isLose()) return;

      if(ch === '⏎') { pickWord(); return; }
      if(ch === '←') { // backspace: deshacer última letra elegida (opcional)
        // no se implementa deshacer en ahorcado clásico; aquí solo ignoramos
        return;
      }

      const plain = removeDiacritics(ch.toLowerCase());
      if(!/[a-zñ]/.test(plain)) return;

      // deshabilitar botón
      const matchButton = [...document.querySelectorAll('.key')].find(b => b.textContent === ch);
      if(matchButton) matchButton.disabled = true;

      if(guessed.has(plain)) return; // ya jugada
      guessed.add(plain);

      if(secretPlain.includes(plain)){
        // acierto
      } else {
        errors++;
      }
      updateUI();
    }

    function disableAllKeys(d=true){
      document.querySelectorAll('.key').forEach(k => k.disabled = d);
    }

    // Soporte de teclado físico (opcional)
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if(key === 'enter'){ pickWord(); return; }
      if(key.length === 1){
        const display = key === 'ñ' ? 'ñ' : key;
        const exists = [...document.querySelectorAll('.key')].find(b => b.textContent === display);
        if(exists && !exists.disabled) handleKey(display);
      }
    });

    // Funcionalidad para el botón de "Volver a Jugar"
    document.getElementById('restartGame').addEventListener('click', function() {
     // Reiniciar el juego
      pickWord(); // Selecciona una nueva palabra
      updateUI(true); // Actualiza la UI
    // Ocultar el botón de "Volver a Jugar"
    document.getElementById('restartGame').style.display = 'none';
});


    // Botones
    $new.addEventListener('click', pickWord);
    $reveal.addEventListener('click', () => { errors = MAX_ERRORS; updateUI(); });

    $addWord.addEventListener('click', () => {
      const raw = $custom.value.trim();
      if(!raw) return;
      // Permitir letras, espacios y guiones
      const cleaned = raw.replace(/[^a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s-]/g,'');
      if(cleaned.length < 3){
        alert('La palabra/frase debe tener al menos 3 caracteres.');
        return;
      }
      WORDS.push(cleaned);
      $custom.value = '';
      pickWord();
    });

pickWord();