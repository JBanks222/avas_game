const mathProblemDisplay = document.querySelector('[data-problem]');
const mathStreakDisplay = document.querySelector('[data-streak]');
const mathCaptionDisplay = document.querySelector('[data-caption]');
const answerInput = document.getElementById('answerInput');
const submitBtn = document.getElementById('submitBtn');
const mathCard = document.querySelector('.math-card');

const visualCard = document.querySelector('.visual-card');
const visualPromptDisplay = document.querySelector('[data-visual-prompt]');
const visualStreakDisplay = document.querySelector('[data-visual-streak]');
const visualCaptionDisplay = document.querySelector('[data-visual-caption]');
const visualGrid = document.querySelector('[data-visual-grid]');
const countOptionsContainer = document.querySelector('[data-count-options]');

const feed = document.querySelector('.feed');
const shockOverlay = document.querySelector('.shock-overlay');

const hypeCaptions = [
  'Can you keep the streak alive?',
  'Next level brain rot unlocked.',
  'Math dopamine speedrun incoming.',
  'Don’t blink. Numbers are watching.',
  'Stay unbothered, stay calculating.',
  'Scrolling and solving simultaneously.',
  'Streaks are the new GPA.'
];

const successCaptions = [
  'Certified math menace.',
  'They said you couldn’t. You did.',
  'Numbers fear you now.',
  'Brain ping: mega combo.',
  'Another W for the timeline.'
];

const failCaptions = [
  'Instant L. Keep scrolling.',
  'Brain rot intensifies.',
  'That one’s getting clipped.',
  'Mathed and failed on main.',
  'Recalculate your life choices.'
];

const visualHypeCaptions = [
  'How fast can you count the clones?',
  'Eyes up, dopamine rush incoming.',
  'Blink and the army multiplies.',
  'Find the squad before they despawn.',
  'Gridlocked and overloaded.'
];

const visualSuccessCaptions = [
  'You spotted every single clone.',
  'Retina reflexes on another level.',
  'Certified brain rot accountant.',
  'Numbers and neurons in sync.',
  'That count belongs on the main feed.'
];

const visualFailCaptions = [
  'Missed the clone drop.',
  'They multiplied behind your back.',
  'Scroll of shame unlocked.',
  'You got ratio’d by arithmetic.',
  'Try again before the timeline laughs.'
];

const brainRotCharacters = [
  {
    label: 'Ballerina Cappuchina',
    src: 'assets/brain_rot/Ballerina_Cappuchina.jpg'
  },
  {
    label: 'Bombardiro Crocodilo',
    src: 'assets/brain_rot/Bombardiro_Crocodilo.jpg'
  },
  {
    label: 'BrrBrr Patapim',
    src: 'assets/brain_rot/BrrBrrPatapim.jpg'
  },
  {
    label: 'Tung Tung Tung Sahur',
    src: 'assets/brain_rot/TungTungTungSahur.jpg'
  }
];

let currentMathProblem = null;
let mathStreak = 0;
let mathLocked = false;

let currentVisualRound = null;
let visualStreak = 0;
let visualLocked = false;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateMathProblem() {
  const max = 20;
  const min = 0;
  let left = randInt(min, max);
  let right = randInt(min, max);
  const op = Math.random() > 0.5 ? '+' : '-';
  let answer;

  if (op === '+') {
    answer = left + right;
  } else {
    if (left < right) {
      [left, right] = [right, left];
    }
    answer = left - right;
  }

  return { left, right, op, answer };
}

function generateVisualRound() {
  const character = pickRandom(brainRotCharacters);
  const count = randInt(2, 12);

  const options = new Set([count]);
  while (options.size < 4) {
    const variance = randInt(1, 6);
    const candidate = Math.max(1, count + (Math.random() > 0.5 ? variance : -variance));
    options.add(candidate);
  }

  return {
    character,
    count,
    options: shuffle([...options])
  };
}

function renderMathProblem(problem) {
  mathProblemDisplay.textContent = `${problem.left} ${problem.op} ${problem.right}`;
  mathCaptionDisplay.textContent = pickRandom(hypeCaptions);
  answerInput.value = '';
  answerInput.focus({ preventScroll: true });
  mathLocked = false;
}

function renderVisualRound(round) {
  visualPromptDisplay.textContent = `How many ${round.character.label}?`;
  visualCaptionDisplay.textContent = pickRandom(visualHypeCaptions);

  visualGrid.innerHTML = '';
  for (let i = 0; i < round.count; i++) {
    const img = document.createElement('img');
    img.src = round.character.src;
    img.alt = round.character.label;
    img.loading = 'lazy';
    visualGrid.appendChild(img);
  }

  countOptionsContainer.innerHTML = '';
  round.options.forEach((value) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'option-btn';
    button.textContent = value;
    button.dataset.value = value;
    button.addEventListener('click', () => handleVisualGuess(Number(value)));
    countOptionsContainer.appendChild(button);
  });

  visualLocked = false;
}

function updateMathStreakDisplay() {
  mathStreakDisplay.textContent = `Streak: ${mathStreak}`;
}

function updateVisualStreakDisplay() {
  visualStreakDisplay.textContent = `Streak: ${visualStreak}`;
}

function resetEffects(card) {
  card.classList.remove('correct', 'wrong');
  feed.classList.remove('shake');
}

function setVisualButtonsDisabled(state) {
  countOptionsContainer.querySelectorAll('button').forEach((btn) => {
    btn.disabled = state;
  });
}

function nextMathProblem() {
  currentMathProblem = generateMathProblem();
  renderMathProblem(currentMathProblem);
}

function nextVisualRound() {
  currentVisualRound = generateVisualRound();
  renderVisualRound(currentVisualRound);
}

function triggerMathCorrect() {
  mathStreak += 1;
  updateMathStreakDisplay();
  mathCaptionDisplay.textContent = pickRandom(successCaptions);
  mathCard.classList.add('correct');
  feed.classList.add('shake');

  setTimeout(() => {
    resetEffects(mathCard);
    nextMathProblem();
  }, 850);
}

function triggerMathWrong() {
  mathStreak = 0;
  updateMathStreakDisplay();
  mathCaptionDisplay.textContent = pickRandom(failCaptions);
  mathCard.classList.add('wrong');
  shockOverlay.classList.add('show');

  setTimeout(() => {
    shockOverlay.classList.remove('show');
  }, 420);

  setTimeout(() => {
    resetEffects(mathCard);
    nextMathProblem();
  }, 560);
}

function triggerVisualCorrect() {
  visualStreak += 1;
  updateVisualStreakDisplay();
  visualCaptionDisplay.textContent = pickRandom(visualSuccessCaptions);
  visualCard.classList.add('correct');
  feed.classList.add('shake');

  setTimeout(() => {
    resetEffects(visualCard);
    nextVisualRound();
    visualLocked = false;
  }, 850);
}

function triggerVisualWrong() {
  visualStreak = 0;
  updateVisualStreakDisplay();
  visualCaptionDisplay.textContent = pickRandom(visualFailCaptions);
  visualCard.classList.add('wrong');
  shockOverlay.classList.add('show');

  setTimeout(() => {
    shockOverlay.classList.remove('show');
  }, 420);

  setTimeout(() => {
    resetEffects(visualCard);
    nextVisualRound();
    visualLocked = false;
  }, 560);
}

function handleSubmit() {
  if (mathLocked) return;

  const raw = answerInput.value.trim();
  if (raw.length === 0) {
    answerInput.classList.add('invalid');
    setTimeout(() => answerInput.classList.remove('invalid'), 350);
    return;
  }

  const userAnswer = Number(raw);

  if (!Number.isFinite(userAnswer)) {
    answerInput.classList.add('invalid');
    setTimeout(() => answerInput.classList.remove('invalid'), 350);
    return;
  }

  mathLocked = true;

  if (userAnswer === currentMathProblem.answer) {
    triggerMathCorrect();
  } else {
    triggerMathWrong();
  }

  setTimeout(() => {
    mathLocked = false;
  }, 900);
}

function handleVisualGuess(value) {
  if (visualLocked) return;

  visualLocked = true;
  setVisualButtonsDisabled(true);

  if (value === currentVisualRound.count) {
    triggerVisualCorrect();
  } else {
    triggerVisualWrong();
  }

  setTimeout(() => {
    setVisualButtonsDisabled(true);
  }, 50);
}

submitBtn.addEventListener('click', handleSubmit);

answerInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    handleSubmit();
  }
});

window.addEventListener('load', () => {
  updateMathStreakDisplay();
  updateVisualStreakDisplay();
  nextMathProblem();
  nextVisualRound();
});
