/**
 * Cyber RPS - Interactive Rock Paper Scissors Game
 * Features:
 * - Synthesized Web Audio API for immersive sound without external audio files
 * - Canvas Confetti celebratory particle engine
 * - Game modes (Endless, Best of 3, Best of 5)
 * - Animated fist bump / countdown battle arena
 * - Win streak multiplier and performance analytics
 * - Keyboard shortcuts (R, P, S, 1, 2, 3, M)
 */

(function () {
  'use strict';

  // --- Sound Effects Synthesizer (Web Audio API) ---
  class SoundManager {
    constructor() {
      this.enabled = true;
      this.audioCtx = null;
    }

    init() {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.audioCtx = new AudioContext();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      return this.enabled;
    }

    playTick() {
      if (!this.enabled) return;
      this.init();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.audioCtx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.08);
    }

    playClash() {
      if (!this.enabled) return;
      this.init();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.audioCtx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.2);
    }

    playWin() {
      if (!this.enabled) return;
      this.init();
      if (!this.audioCtx) return;

      // Arpeggiated cheerful chime
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + idx * 0.07);

        const startTime = this.audioCtx.currentTime + idx * 0.07;
        const duration = 0.25;

        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    }

    playLose() {
      if (!this.enabled) return;
      this.init();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, this.audioCtx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.35);
    }

    playDraw() {
      if (!this.enabled) return;
      this.init();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(490, this.audioCtx.currentTime + 0.1);
      osc.frequency.linearRampToValueAtTime(440, this.audioCtx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.22);
    }
  }

  // --- Weapon Config & Rules ---
  const WEAPONS = {
    rock: {
      name: 'Rock',
      emoji: '🪨',
      beats: 'scissors',
      verb: 'crushes'
    },
    paper: {
      name: 'Paper',
      emoji: '📄',
      beats: 'rock',
      verb: 'covers'
    },
    scissors: {
      name: 'Scissors',
      emoji: '✂️',
      beats: 'paper',
      verb: 'cuts'
    }
  };

  const WEAPON_KEYS = Object.keys(WEAPONS);

  // --- Game State ---
  const state = {
    userScore: 0,
    aiScore: 0,
    draws: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalBattles: 0,
    mode: 'endless', // 'endless' | 'best3' | 'best5'
    targetWins: 0,
    isPlaying: false,
    history: []
  };

  const sounds = new SoundManager();

  // --- DOM Elements ---
  const userScoreEl = document.getElementById('userScore');
  const aiScoreEl = document.getElementById('aiScore');
  const streakBadgeEl = document.getElementById('streakBadge');
  const streakCountEl = document.getElementById('streakCount');
  const targetBadgeEl = document.getElementById('targetBadge');

  const userFighterDisplay = document.getElementById('userFighterDisplay');
  const aiFighterDisplay = document.getElementById('aiFighterDisplay');
  const userHandEl = document.getElementById('userHand');
  const aiHandEl = document.getElementById('aiHand');
  const userChoiceNameEl = document.getElementById('userChoiceName');
  const aiChoiceNameEl = document.getElementById('aiChoiceName');

  const vsIndicator = document.getElementById('vsIndicator');
  const countdownDisplay = document.getElementById('countdownDisplay');
  const verdictTag = document.getElementById('verdictTag');
  const verdictDetail = document.getElementById('verdictDetail');

  const weaponBtns = document.querySelectorAll('.weapon-card');
  const modeBtns = document.querySelectorAll('.mode-btn');
  const soundToggleBtn = document.getElementById('soundToggle');
  const soundIconEl = document.getElementById('soundIcon');
  const resetBtn = document.getElementById('resetBtn');

  const historyListEl = document.getElementById('historyList');
  const emptyHistoryMsg = document.getElementById('emptyHistoryMsg');
  const roundCountEl = document.getElementById('roundCount');

  const winRateValEl = document.getElementById('winRateVal');
  const bestStreakValEl = document.getElementById('bestStreakVal');
  const drawCountValEl = document.getElementById('drawCountVal');
  const totalBattlesValEl = document.getElementById('totalBattlesVal');

  const matchModal = document.getElementById('matchModal');
  const modalBanner = document.getElementById('modalBanner');
  const modalIcon = document.getElementById('modalIcon');
  const modalHeading = document.getElementById('modalHeading');
  const modalSubtext = document.getElementById('modalSubtext');
  const modalPlayAgainBtn = document.getElementById('modalPlayAgainBtn');

  // --- AI Strategy Engine ---
  // A dynamic AI that uses a mix of random and adaptive play (countering player's most frequent move)
  function getAiChoice() {
    // 25% chance to counter player's favorite move if enough rounds have passed
    if (state.history.length >= 3 && Math.random() < 0.3) {
      const playerMoves = state.history.map(h => h.userChoice);
      const moveCounts = { rock: 0, paper: 0, scissors: 0 };
      playerMoves.forEach(m => moveCounts[m] = (moveCounts[m] || 0) + 1);

      // Find the player's most chosen weapon
      let favorite = 'rock';
      if (moveCounts.paper > moveCounts[favorite]) favorite = 'paper';
      if (moveCounts.scissors > moveCounts[favorite]) favorite = 'scissors';

      // Pick the weapon that beats the favorite
      for (const [weapon, data] of Object.entries(WEAPONS)) {
        if (data.beats === favorite) {
          return weapon;
        }
      }
    }

    // Default: purely random selection
    const randomIndex = Math.floor(Math.random() * WEAPON_KEYS.length);
    return WEAPON_KEYS[randomIndex];
  }

  // --- Confetti Celebrations ---
  function fireConfetti(burstType = 'standard') {
    if (typeof confetti !== 'function') return;

    if (burstType === 'championship') {
      const duration = 2.5 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#00f2fe', '#4facfe', '#10b981', '#f59e0b', '#ff2a85']
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#00f2fe', '#4facfe', '#10b981', '#f59e0b', '#ff2a85']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    } else {
      // Standard round victory
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#00f2fe', '#10b981', '#38ef7d']
      });
    }
  }

  // --- Battle Play Flow ---
  async function playRound(userChoice) {
    if (state.isPlaying) return;
    state.isPlaying = true;
    toggleWeaponButtons(false);

    // Initial fist pose for the count
    userHandEl.textContent = '✊';
    aiHandEl.textContent = '✊';
    userChoiceNameEl.textContent = 'Ready...';
    aiChoiceNameEl.textContent = 'Analyzing...';

    // Clear previous outcome classes
    userFighterDisplay.className = 'fighter-display';
    aiFighterDisplay.className = 'fighter-display';

    // Start shake animation
    userFighterDisplay.classList.add('shaking-player');
    aiFighterDisplay.classList.add('shaking-cpu');

    // Switch center view from VS to Countdown
    vsIndicator.classList.add('hidden');
    countdownDisplay.classList.remove('hidden');

    verdictTag.className = 'verdict-tag';
    verdictTag.textContent = 'READY...';
    verdictDetail.textContent = 'Clashing weapons!';

    // 3, 2, 1 Countdown steps
    const countdownSteps = ['3', '2', '1'];
    for (const step of countdownSteps) {
      countdownDisplay.textContent = step;
      sounds.playTick();
      await sleep(450);
    }

    // "SHOOT!"
    countdownDisplay.textContent = 'SHOOT!';
    sounds.playClash();
    await sleep(250);

    // Stop shaking
    userFighterDisplay.classList.remove('shaking-player');
    aiFighterDisplay.classList.remove('shaking-cpu');
    countdownDisplay.classList.add('hidden');
    vsIndicator.classList.remove('hidden');

    // Reveal choices
    const aiChoice = getAiChoice();
    userHandEl.textContent = WEAPONS[userChoice].emoji;
    aiHandEl.textContent = WEAPONS[aiChoice].emoji;
    userChoiceNameEl.textContent = WEAPONS[userChoice].name;
    aiChoiceNameEl.textContent = WEAPONS[aiChoice].name;

    // Evaluate result
    evaluateRound(userChoice, aiChoice);

    // Check match limits (Best of 3 / 5)
    checkSeriesProgress();

    state.isPlaying = false;
    toggleWeaponButtons(true);
  }

  function evaluateRound(userChoice, aiChoice) {
    state.totalBattles++;
    let result = ''; // 'win', 'loss', 'draw'
    let detailText = '';

    if (userChoice === aiChoice) {
      result = 'draw';
      state.draws++;
      sounds.playDraw();
      userFighterDisplay.classList.add('draw');
      aiFighterDisplay.classList.add('draw');
      verdictTag.className = 'verdict-tag draw';
      verdictTag.textContent = "IT'S A DRAW!";
      detailText = `Both picked ${WEAPONS[userChoice].name}. Standstill!`;
    } else if (WEAPONS[userChoice].beats === aiChoice) {
      result = 'win';
      state.userScore++;
      state.currentStreak++;
      if (state.currentStreak > state.bestStreak) {
        state.bestStreak = state.currentStreak;
      }
      sounds.playWin();
      fireConfetti('standard');
      userFighterDisplay.classList.add('winner');
      aiFighterDisplay.classList.add('loser');
      verdictTag.className = 'verdict-tag win';
      verdictTag.textContent = 'YOU WIN ROUND!';
      detailText = `${WEAPONS[userChoice].name} ${WEAPONS[userChoice].verb} ${WEAPONS[aiChoice].name}!`;
    } else {
      result = 'loss';
      state.aiScore++;
      state.currentStreak = 0;
      sounds.playLose();
      userFighterDisplay.classList.add('loser');
      aiFighterDisplay.classList.add('winner');
      verdictTag.className = 'verdict-tag loss';
      verdictTag.textContent = 'COMPUTER WINS!';
      detailText = `${WEAPONS[aiChoice].name} ${WEAPONS[aiChoice].verb} ${WEAPONS[userChoice].name}!`;
    }

    verdictDetail.textContent = detailText;

    // Record into history
    state.history.unshift({
      round: state.totalBattles,
      userChoice,
      aiChoice,
      result,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });

    updateUI();
  }

  function checkSeriesProgress() {
    if (state.mode === 'endless') return;

    if (state.userScore >= state.targetWins || state.aiScore >= state.targetWins) {
      setTimeout(() => {
        const userWon = state.userScore >= state.targetWins;
        if (userWon) {
          modalBanner.textContent = 'CHAMPIONSHIP VICTORY';
          modalBanner.style.color = '#34d399';
          modalIcon.textContent = '🏆';
          modalHeading.textContent = 'You Conquered the Series!';
          modalSubtext.textContent = `Magnificent! You beat CPU ${state.userScore} to ${state.aiScore} in this tournament.`;
          sounds.playWin();
          fireConfetti('championship');
        } else {
          modalBanner.textContent = 'SERIES DEFEAT';
          modalBanner.style.color = '#f87171';
          modalIcon.textContent = '💀';
          modalHeading.textContent = 'Nexus AI Claimed Victory';
          modalSubtext.textContent = `The computer outsmarted you ${state.aiScore} to ${state.userScore}. Ready for redemption?`;
          sounds.playLose();
        }
        matchModal.classList.remove('hidden');
      }, 400);
    }
  }

  // --- UI Update Helpers ---
  function updateUI() {
    userScoreEl.textContent = state.userScore;
    aiScoreEl.textContent = state.aiScore;
    streakCountEl.textContent = state.currentStreak;

    // Streak flame intensity
    if (state.currentStreak >= 3) {
      streakBadgeEl.classList.add('hot');
    } else {
      streakBadgeEl.classList.remove('hot');
    }

    // Metrics panel
    const winRate = state.totalBattles > 0
      ? Math.round((state.userScore / state.totalBattles) * 100)
      : 0;

    winRateValEl.textContent = `${winRate}%`;
    bestStreakValEl.textContent = state.bestStreak;
    drawCountValEl.textContent = state.draws;
    totalBattlesValEl.textContent = state.totalBattles;
    roundCountEl.textContent = `${state.totalBattles} ${state.totalBattles === 1 ? 'Round' : 'Rounds'}`;

    // Render history log
    renderHistory();
  }

  function renderHistory() {
    if (state.history.length === 0) {
      emptyHistoryMsg.style.display = 'block';
      historyListEl.innerHTML = '';
      historyListEl.appendChild(emptyHistoryMsg);
      return;
    }

    emptyHistoryMsg.style.display = 'none';
    historyListEl.innerHTML = '';

    // Show last 10 rounds
    state.history.slice(0, 10).forEach(item => {
      const div = document.createElement('div');
      div.className = 'history-item';

      const badgeLabel = item.result === 'win' ? 'WIN' : item.result === 'loss' ? 'LOSS' : 'DRAW';

      div.innerHTML = `
        <div class="history-clash">
          <span>#${item.round}</span>
          <span>${WEAPONS[item.userChoice].emoji} vs ${WEAPONS[item.aiChoice].emoji}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.6rem;">
          <span style="font-size: 0.72rem; color: var(--text-muted);">${item.timestamp}</span>
          <span class="history-badge ${item.result}">${badgeLabel}</span>
        </div>
      `;
      historyListEl.appendChild(div);
    });
  }

  function toggleWeaponButtons(enabled) {
    weaponBtns.forEach(btn => {
      btn.disabled = !enabled;
    });
  }

  function setMode(newMode) {
    state.mode = newMode;
    modeBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === newMode);
    });

    if (newMode === 'endless') {
      state.targetWins = 0;
      targetBadgeEl.textContent = 'ENDLESS RUN';
    } else if (newMode === 'best3') {
      state.targetWins = 2; // First to 2 wins
      targetBadgeEl.textContent = 'FIRST TO 2 WINS';
    } else if (newMode === 'best5') {
      state.targetWins = 3; // First to 3 wins
      targetBadgeEl.textContent = 'FIRST TO 3 WINS';
    }

    resetMatch(false);
  }

  function resetMatch(clearAll = false) {
    state.userScore = 0;
    state.aiScore = 0;
    state.currentStreak = 0;

    if (clearAll) {
      state.draws = 0;
      state.bestStreak = 0;
      state.totalBattles = 0;
      state.history = [];
    }

    userHandEl.textContent = '✊';
    aiHandEl.textContent = '✊';
    userChoiceNameEl.textContent = 'Ready';
    aiChoiceNameEl.textContent = 'Ready';

    userFighterDisplay.className = 'fighter-display';
    aiFighterDisplay.className = 'fighter-display';

    verdictTag.className = 'verdict-tag';
    verdictTag.textContent = 'PICK YOUR WEAPON';
    verdictDetail.textContent = 'First to throw takes the lead!';

    matchModal.classList.add('hidden');
    updateUI();
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // --- Event Listeners ---
  function setupEventListeners() {
    // Weapon Card Click
    weaponBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const choice = btn.dataset.choice;
        if (choice && !state.isPlaying) {
          playRound(choice);
        }
      });
    });

    // Keyboard Shortcuts (R, P, S, 1, 2, 3, M)
    window.addEventListener('keydown', (e) => {
      if (state.isPlaying) return;

      const key = e.key.toLowerCase();
      if (key === 'r' || key === '1') {
        playRound('rock');
      } else if (key === 'p' || key === '2') {
        playRound('paper');
      } else if (key === 's' || key === '3') {
        playRound('scissors');
      } else if (key === 'm') {
        const isSoundOn = sounds.toggle();
        soundIconEl.textContent = isSoundOn ? '🔊' : '🔇';
      } else if (key === 'escape' && !matchModal.classList.contains('hidden')) {
        matchModal.classList.add('hidden');
      }
    });

    // Game Mode selection
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!state.isPlaying) {
          setMode(btn.dataset.mode);
        }
      });
    });

    // Sound toggle
    soundToggleBtn.addEventListener('click', () => {
      const isSoundOn = sounds.toggle();
      soundIconEl.textContent = isSoundOn ? '🔊' : '🔇';
    });

    // Reset button
    resetBtn.addEventListener('click', () => {
      if (!state.isPlaying) {
        resetMatch(true);
      }
    });

    // Modal play again button
    modalPlayAgainBtn.addEventListener('click', () => {
      matchModal.classList.add('hidden');
      resetMatch(false);
    });
  }

  // Initial startup
  setMode('endless');
  setupEventListeners();
  updateUI();

})();
