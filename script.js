/**
 * RGB MATCH - Core Gameplay Logic Controller Engine
 * Engineered with pure native ECMAScript standard syntax configurations
 */

(function () {
    'use strict';

    // Game Core State Storage Structures
    const gameState = {
        currentScreen: 'startScreen',
        difficulty: 'easy', // 'easy' | 'medium' | 'hard'
        isDailyChallenge: false,
        score: 0,
        round: 0,
        lives: 3,
        combo: 0,
        maxComboReached: 0,
        timerInterval: null,
        timeLeft: 20,
        isPaused: false,
        memoryActive: false,
        memoryTimeout: null,
        
        // Anti-Repetition Color History Buffer Memory
        recentColors: [],
        maxHistoryBuffer: 12,

        // Match Target Variables
        targetColor: { r: 0, g: 0, b: 0 },
        playerColor: { r: 128, g: 128, b: 128 },

        // Permanent Statistics Configuration Array
        stats: {
            bestScore: 0,
            gamesPlayed: 0,
            highestCombo: 0
        }
    };

    // DOM Nodes Tree References Cache Map
    const DOM = {
        particleCanvas: document.getElementById('particleCanvas'),
        confettiCanvas: document.getElementById('confettiCanvas'),
        gameContainer: document.getElementById('gameContainer'),
        darkModeToggle: document.getElementById('darkModeToggle'),
        fullscreenToggle: document.getElementById('fullscreenToggle'),
        pauseToggle: document.getElementById('pauseToggle'),
        
        // Screen Wrappers Nodes
        startScreen: document.getElementById('startScreen'),
        gameplayScreen: document.getElementById('gameplayScreen'),
        gameOverScreen: document.getElementById('gameOverScreen'),
        
        // Menu Elements
        diffButtons: document.querySelectorAll('.diff-btn'),
        classicModeBtn: document.getElementById('classicModeBtn'),
        dailyChallengeBtn: document.getElementById('dailyChallengeBtn'),
        
        // Dashboard Values Local Nodes
        localBestScore: document.getElementById('localBestScore'),
        localMaxCombo: document.getElementById('localMaxCombo'),
        localGamesPlayed: document.getElementById('localGamesPlayed'),

        // Gameplay Active elements HUD pointers
        roundDisplay: document.getElementById('roundDisplay'),
        scoreDisplay: document.getElementById('scoreDisplay'),
        comboDisplay: document.getElementById('comboDisplay'),
        timerDisplay: document.getElementById('timerDisplay'),
        livesContainer: document.getElementById('livesContainer'),
        
        // Color Matrix View elements
        targetColorBox: document.getElementById('targetColorBox'),
        playerColorBox: document.getElementById('playerColorBox'),
        memoryModeMaskText: document.getElementById('memoryModeMaskText'),
        hintTicker: document.getElementById('hintTicker'),
        
        // Input Controls Nodes
        sliderR: document.getElementById('sliderR'),
        sliderG: document.getElementById('sliderG'),
        sliderB: document.getElementById('sliderB'),
        valR: document.getElementById('valR'),
        valG: document.getElementById('valG'),
        valB: document.getElementById('valB'),
        
        // Interaction Actions Elements
        submitBtn: document.getElementById('submitBtn'),
        nextBtn: document.getElementById('nextBtn'),

        // Modals Structure Nodes
        pauseOverlay: document.getElementById('pauseOverlay'),
        resumeBtn: document.getElementById('resumeBtn'),
        roundFeedbackOverlay: document.getElementById('roundFeedbackOverlay'),
        feedbackGrade: document.getElementById('feedbackGrade'),
        feedbackStars: document.getElementById('feedbackStars'),
        feedbackAccuracy: document.getElementById('feedbackAccuracy'),
        feedbackPointsAwarded: document.getElementById('feedbackPointsAwarded'),
        funFactBox: document.getElementById('funFactBox'),
        feedbackCloseBtn: document.getElementById('feedbackCloseBtn'),
        
        // Game Over Node fields
        summaryFinalScore: document.getElementById('summaryFinalScore'),
        summaryRounds: document.getElementById('summaryRounds'),
        summaryMaxCombo: document.getElementById('summaryMaxCombo'),
        summaryBestScore: document.getElementById('summaryBestScore'),
        rematchBtn: document.getElementById('rematchBtn'),
        homeBtn: document.getElementById('homeBtn'),
        floatingNotificationLayer: document.getElementById('floatingNotificationLayer')
    };

    const FUN_FACTS = [
        "RGB stands for Red, Green, and Blue. It is based on the trichromatic color vision theory.",
        "Monitors blend additive light emissions to forge arrays of variations. Combining all 3 at 255 outputs solid clean White.",
        "In hexadecimal conversion systems, pure Red is mapped as #FF0000.",
        "Pure digital Green at value 255 looks explicitly brighter to human vision profiles than default deep Blue.",
        "The complete standard 24-bit color spectrum structure yields precisely 16,777,216 visual permutation options.",
        "Setting all color sliders to identical matched numbers produces perfectly balanced neutral Grayscale scales.",
        "Dark mode interfaces minimize blue spectrum strain parameters to provide long term reading comfort."
    ];

    // Simulated Audio Synthetics Interface
    const AudioEngine = {
        ctx: null,
        soundFiles: {
            click: 'sounds/click.mp3',
            success: 'sounds/success.mp3',
            fail: 'sounds/fail.mp3',
            gameover: 'sounds/gameover.mp3',
            bg: 'sounds/bg.mp3'
        },

        init() {
            if (!this.ctx) {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            }
        },

        playSynthFallback(type) {
            this.init();
            if (!this.ctx) return;
            
            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);

                const now = this.ctx.currentTime;

                if (type === 'click') {
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(600, now);
                    osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
                    gain.gain.setValueAtTime(0.12, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                    osc.start(now); osc.stop(now + 0.08);
                } else if (type === 'success') {
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(440, now);
                    osc.frequency.setValueAtTime(554.37, now + 0.07);
                    osc.frequency.setValueAtTime(659.25, now + 0.14);
                    gain.gain.setValueAtTime(0.15, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                    osc.start(now); osc.stop(now + 0.35);
                } else if (type === 'fail') {
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(180, now);
                    osc.frequency.linearRampToValueAtTime(70, now + 0.25);
                    gain.gain.setValueAtTime(0.2, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                    osc.start(now); osc.stop(now + 0.25);
                } else if (type === 'gameover') {
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(280, now);
                    osc.frequency.linearRampToValueAtTime(50, now + 0.6);
                    gain.gain.setValueAtTime(0.25, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
                    osc.start(now); osc.stop(now + 0.6);
                }
            } catch (e) {}
        },

        trigger(soundKey) {
            this.playSynthFallback(soundKey);
            console.log(`[Audio Trigger]: ${this.soundFiles[soundKey]}`);
        }
    };

    /* ==========================================
     * BACKGROUND INTERACTIVE PARTICLES SUBSYSTEM
     * ========================================== */
    const ParticlesEngine = {
        ctx: null,
        pool: [],
        maxParticles: 35,

        init() {
            this.ctx = DOM.particleCanvas.getContext('2d');
            this.resize();
            window.addEventListener('resize', () => this.resize());
            
            this.pool = [];
            for (let i = 0; i < this.maxParticles; i++) {
                this.pool.push(this.createParticle(true));
            }
            this.loop();
        },

        resize() {
            DOM.particleCanvas.width = window.innerWidth;
            DOM.particleCanvas.height = window.innerHeight;
        },

        createParticle(randomY = false) {
            return {
                x: Math.random() * DOM.particleCanvas.width,
                y: randomY ? Math.random() * DOM.particleCanvas.height : DOM.particleCanvas.height + 20,
                radius: Math.random() * 2.5 + 1,
                speedX: (Math.random() - 0.5) * 0.4,
                speedY: -(Math.random() * 0.5 + 0.15),
                alpha: Math.random() * 0.4 + 0.1,
                color: Math.random() > 0.5 ? '255,255,255' : '99,102,241'
            };
        },

        loop() {
            requestAnimationFrame(() => this.loop());
            const ctx = this.ctx;
            if (!ctx) return;
            
            ctx.clearRect(0, 0, DOM.particleCanvas.width, DOM.particleCanvas.height);
            
            for (let i = 0; i < this.pool.length; i++) {
                let p = this.pool[i];
                p.x += p.speedX;
                p.y += p.speedY;
                
                if (p.y < -10 || p.x < -10 || p.x > DOM.particleCanvas.width + 10) {
                    this.pool[i] = this.createParticle(false);
                    p = this.pool[i];
                }
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
                ctx.fill();
            }
        }
    };

    /* ==========================================
     * CONFETTI FX GENERATION ENGINE LAYER 
     * ========================================== */
    const ConfettiEngine = {
        ctx: null,
        pieces: [],
        active: false,
        duration: 2200,
        stopTime: 0,

        init() {
            this.ctx = DOM.confettiCanvas.getContext('2d');
            window.addEventListener('resize', () => this.resize());
            this.resize();
        },

        resize() {
            DOM.confettiCanvas.width = window.innerWidth;
            DOM.confettiCanvas.height = window.innerHeight;
        },

        fire() {
            this.resize();
            this.active = true;
            this.stopTime = Date.now() + this.duration;
            this.pieces = [];
            
            const hues = [0, 120, 220, 45, 290, 330];
            for (let i = 0; i < 100; i++) {
                this.pieces.push({
                    x: Math.random() * DOM.confettiCanvas.width,
                    y: Math.random() * -DOM.confettiCanvas.height - 20,
                    size: Math.random() * 5 + 5,
                    color: `hsl(${hues[Math.floor(Math.random() * hues.length)]}, 90%, 60%)`,
                    speedY: Math.random() * 4 + 2.5,
                    speedX: (Math.random() - 0.5) * 3,
                    rotation: Math.random() * Math.PI,
                    rotationSpeed: (Math.random() - 0.5) * 0.1
                });
            }
            this.loop();
        },

        loop() {
            if (!this.active) return;
            
            const ctx = this.ctx;
            ctx.clearRect(0, 0, DOM.confettiCanvas.width, DOM.confettiCanvas.height);
            
            let alive = false;
            const timeDiff = this.stopTime - Date.now();
            
            for (let i = 0; i < this.pieces.length; i++) {
                let p = this.pieces[i];
                
                if (p.y < DOM.confettiCanvas.height) {
                    alive = true;
                } else if (timeDiff > 0) {
                    p.y = -20;
                    p.x = Math.random() * DOM.confettiCanvas.width;
                } else {
                    continue;
                }
                
                p.y += p.speedY;
                p.x += p.speedX;
                p.rotation += p.rotationSpeed;
                
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            }
            
            if (alive && (timeDiff > -1000)) {
                requestAnimationFrame(() => this.loop());
            } else {
                this.active = false;
                ctx.clearRect(0, 0, DOM.confettiCanvas.width, DOM.confettiCanvas.height);
            }
        }
    };

    /* ==========================================
     * LOCAL STORAGE MANAGEMENT MODULE
     * ========================================== */
    const StorageController = {
        key: 'RGB_MATCH_PLAYER_PROFILES_V2',

        load() {
            try {
                const data = localStorage.getItem(this.key);
                if (data) {
                    const parsed = JSON.parse(data);
                    gameState.stats.bestScore = parsed.bestScore || 0;
                    gameState.stats.highestCombo = parsed.highestCombo || 0;
                    gameState.stats.gamesPlayed = parsed.gamesPlayed || 0;
                }
            } catch (e) {
                console.error(e);
            }
            this.syncDashboardDOM();
        },

        save() {
            try {
                localStorage.setItem(this.key, JSON.stringify(gameState.stats));
            } catch (e) {
                console.error(e);
            }
            this.syncDashboardDOM();
        },

        syncDashboardDOM() {
            DOM.localBestScore.textContent = gameState.stats.bestScore;
            DOM.localMaxCombo.textContent = `x${gameState.stats.highestCombo}`;
            DOM.localGamesPlayed.textContent = gameState.stats.gamesPlayed;
        }
    };

    /* ==========================================
     * GAME CONTEXT ENGINE MAIN FRAMEWORK
     * ========================================== */
    
    function initApp() {
        StorageController.load();
        ParticlesEngine.init();
        ConfettiEngine.init();
        attachEventListeners();
        setupInputSynchronization();
    }

    function attachEventListeners() {
        DOM.darkModeToggle.addEventListener('click', () => {
            AudioEngine.trigger('click');
            const theme = document.documentElement.getAttribute('data-theme');
            document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'light' : 'dark');
        });

        DOM.fullscreenToggle.addEventListener('click', () => {
            AudioEngine.trigger('click');
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            } else {
                document.exitFullscreen();
            }
        });

        DOM.pauseToggle.addEventListener('click', () => {
            AudioEngine.trigger('click');
            togglePauseState();
        });

        DOM.resumeBtn.addEventListener('click', () => {
            AudioEngine.trigger('click');
            togglePauseState();
        });

        DOM.diffButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                AudioEngine.trigger('click');
                DOM.diffButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                gameState.difficulty = this.getAttribute('data-diff');
            });
        });

        DOM.classicModeBtn.addEventListener('click', () => {
            AudioEngine.trigger('click');
            launchGameSession(false);
        });

        DOM.dailyChallengeBtn.addEventListener('click', () => {
            AudioEngine.trigger('click');
            launchGameSession(true);
        });

        DOM.submitBtn.addEventListener('click', () => {
            if (DOM.submitBtn.classList.contains('hidden')) return;
            AudioEngine.trigger('click');
            evaluateCurrentMatchMatch();
        });

        DOM.nextBtn.addEventListener('click', () => {
            AudioEngine.trigger('click');
            advanceToNextRound();
        });

        DOM.feedbackCloseBtn.addEventListener('click', () => {
            AudioEngine.trigger('click');
            DOM.roundFeedbackOverlay.classList.add('hidden');
            advanceToNextRound();
        });

        // FIXED CRITICAL RESTART LOOP CONNECTIONS HERE
        DOM.rematchBtn.addEventListener('click', () => {
            AudioEngine.trigger('click');
            launchGameSession(gameState.isDailyChallenge);
        });

        DOM.homeBtn.addEventListener('click', () => {
            AudioEngine.trigger('click');
            switchScreen('startScreen');
        });

        window.addEventListener('keydown', handleKeyboardShortcuts);
    }

    function handleKeyboardShortcuts(e) {
        if (gameState.currentScreen !== 'gameplayScreen') return;
        
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
            e.preventDefault();
            togglePauseState();
        }
        
        if (e.key === 'Enter') {
            e.preventDefault();
            if (!DOM.submitBtn.classList.contains('hidden')) {
                evaluateCurrentMatchMatch();
            } else if (!DOM.roundFeedbackOverlay.classList.contains('hidden')) {
                DOM.roundFeedbackOverlay.classList.add('hidden');
                advanceToNextRound();
            }
        }
    }

    function switchScreen(screenKey) {
        gameState.currentScreen = screenKey;
        
        DOM.startScreen.classList.remove('active');
        DOM.gameplayScreen.classList.remove('active');
        DOM.gameOverScreen.classList.remove('active');
        
        DOM[screenKey].classList.add('active');
        
        if (screenKey === 'gameplayScreen') {
            DOM.pauseToggle.classList.remove('hidden');
        } else {
            DOM.pauseToggle.classList.add('hidden');
            stopSessionCountdownTimer();
        }
    }

    function togglePauseState() {
        if (gameState.currentScreen !== 'gameplayScreen') return;
        
        gameState.isPaused = !gameState.isPaused;
        if (gameState.isPaused) {
            DOM.pauseOverlay.classList.remove('hidden');
            stopSessionCountdownTimer();
        } else {
            DOM.pauseOverlay.classList.add('hidden');
            startSessionCountdownTimer();
        }
    }

    function setupInputSynchronization() {
        const handleInputChange = () => {
            gameState.playerColor.r = parseInt(DOM.sliderR.value, 10);
            gameState.playerColor.g = parseInt(DOM.sliderG.value, 10);
            gameState.playerColor.b = parseInt(DOM.sliderB.value, 10);
            
            DOM.valR.textContent = gameState.playerColor.r;
            DOM.valG.textContent = gameState.playerColor.g;
            DOM.valB.textContent = gameState.playerColor.b;
            
            DOM.playerColorBox.style.backgroundColor = `rgb(${gameState.playerColor.r}, ${gameState.playerColor.g}, ${gameState.playerColor.b})`;
            
            generateLiveHintUpdates();
        };

        DOM.sliderR.addEventListener('input', handleInputChange);
        DOM.sliderG.addEventListener('input', handleInputChange);
        DOM.sliderB.addEventListener('input', handleInputChange);
    }

    /* ==========================================
     * GAME PLAY RUNTIME INSTANCE METHODS
     * ========================================== */
    
    function launchGameSession(isDaily = false) {
        gameState.isDailyChallenge = isDaily;
        gameState.score = 0;
        gameState.round = 1;
        gameState.lives = 3;
        gameState.combo = 0;
        gameState.maxComboReached = 0;
        gameState.isPaused = false;
        gameState.recentColors = []; // Flush tracking buffer history safely

        DOM.scoreDisplay.textContent = '0';
        DOM.roundDisplay.textContent = '1';
        DOM.comboDisplay.textContent = 'x1';
        updateLivesUIVisualizations();
        
        resetSlidersToDefault();
        generateRoundTargetColor();
        switchScreen('gameplayScreen');
    }

    function resetSlidersToDefault() {
        gameState.playerColor = { r: 128, g: 128, b: 128 };
        DOM.sliderR.value = 128; DOM.sliderG.value = 128; DOM.sliderB.value = 128;
        DOM.valR.textContent = 128; DOM.valG.textContent = 128; DOM.valB.textContent = 128;
        DOM.playerColorBox.style.backgroundColor = 'rgb(128,128,128)';
    }

    // ADVANCED ANTI-REPETITION COLOR CHANNELS ENGINE
    function generateRoundTargetColor() {
        if (gameState.memoryTimeout) { clearTimeout(gameState.memoryTimeout); }
        gameState.memoryActive = false;
        DOM.memoryModeMaskText.classList.add('hidden');

        let r, g, b;
        let attempts = 0;
        const getRandom = () => gameState.dailyRandomGenerator ? gameState.dailyRandomGenerator() : Math.random();

        while (attempts < 50) {
            if (gameState.difficulty === 'easy') {
                r = Math.floor(getRandom() * 115) + 140;
                g = Math.floor(getRandom() * 115) + 140;
                b = Math.floor(getRandom() * 115) + 140;
                const bias = Math.floor(getRandom() * 3);
                if (bias === 0) r = Math.floor(getRandom() * 40);
                if (bias === 1) g = Math.floor(getRandom() * 40);
                if (bias === 2) b = Math.floor(getRandom() * 40);
            } else {
                r = Math.floor(getRandom() * 256);
                g = Math.floor(getRandom() * 256);
                b = Math.floor(getRandom() * 256);
            }

            // Confirm calculated spatial distance doesn't collide with recently logged round buffers
            let colorIsTooSimilar = false;
            for (let i = 0; i < gameState.recentColors.length; i++) {
                const past = gameState.recentColors[i];
                const distance = Math.sqrt(
                    Math.pow(r - past.r, 2) + 
                    Math.pow(g - past.g, 2) + 
                    Math.pow(b - past.b, 2)
                );
                // Require a significant spatial distance shift configuration threshold to keep gameplay diverse
                if (distance < 75) {
                    colorIsTooSimilar = true;
                    break;
                }
            }

            if (!colorIsTooSimilar) break;
            attempts++;
        }

        // Push new target directly into history queue tracking list
        gameState.recentColors.push({ r, g, b });
        if (gameState.recentColors.length > gameState.maxHistoryBuffer) {
            gameState.recentColors.shift();
        }

        gameState.targetColor = { r, g, b };
        DOM.targetColorBox.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;

        if (gameState.difficulty === 'hard') {
            gameState.memoryActive = true;
            DOM.memoryModeMaskText.classList.add('hidden');
            
            let secondsLeft = 5;
            DOM.hintTicker.textContent = `Memorize target! Hiding in ${secondsLeft}s...`;
            
            gameState.memoryTimeout = setInterval(() => {
                secondsLeft--;
                if (secondsLeft <= 0) {
                    clearInterval(gameState.memoryTimeout);
                    if (gameState.currentScreen === 'gameplayScreen' && !gameState.isPaused) {
                        DOM.targetColorBox.style.backgroundColor = 'rgba(0,0,0,0.92)';
                        DOM.memoryModeMaskText.classList.remove('hidden');
                        DOM.hintTicker.textContent = "Memory active! Match the hidden target.";
                    }
                } else {
                    DOM.hintTicker.textContent = `Memorize target! Hiding in ${secondsLeft}s...`;
                }
            }, 1000);
        } else {
            DOM.hintTicker.textContent = "Adjust sliders to achieve a perfect match configuration profile.";
        }

        DOM.submitBtn.classList.remove('hidden');
        DOM.nextBtn.classList.add('hidden');
        
        gameState.timeLeft = 20;
        DOM.timerDisplay.textContent = gameState.timeLeft;
        DOM.timerDisplay.classList.remove('warning-trigger');
        startSessionCountdownTimer();
    }

    function startSessionCountdownTimer() {
        stopSessionCountdownTimer();
        gameState.timerInterval = setInterval(() => {
            if (gameState.isPaused) return;
            
            gameState.timeLeft--;
            DOM.timerDisplay.textContent = gameState.timeLeft;
            
            if (gameState.timeLeft <= 5) {
                DOM.timerDisplay.classList.add('warning-trigger');
            }
            
            if (gameState.timeLeft <= 0) {
                stopSessionCountdownTimer();
                handleRoundExpirationTimeout();
            }
        }, 1000);
    }

    function stopSessionCountdownTimer() {
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
            gameState.timerInterval = null;
        }
    }

    function generateLiveHintUpdates() {
        if (gameState.difficulty === 'hard' && gameState.memoryActive && !DOM.memoryModeMaskText.classList.contains('hidden')) {
            DOM.hintTicker.textContent = "Trust your visual memory storage metrics!";
            return;
        }
        
        const deltaR = gameState.targetColor.r - gameState.playerColor.r;
        const deltaG = gameState.targetColor.g - gameState.playerColor.g;
        const deltaB = gameState.targetColor.b - gameState.playerColor.b;
        
        const absoluteToleranceThreshold = 25;
        let hintDirectives = [];
        
        if (deltaR > absoluteToleranceThreshold) hintDirectives.push("Need More Red 🔴");
        else if (deltaR < -absoluteToleranceThreshold) hintDirectives.push("Less Red 🔴");
        
        if (deltaG > absoluteToleranceThreshold) hintDirectives.push("Need More Green 🟢");
        else if (deltaG < -absoluteToleranceThreshold) hintDirectives.push("Less Green 🟢");
        
        if (deltaB > absoluteToleranceThreshold) hintDirectives.push("Need More Blue 🔵");
        else if (deltaB < -absoluteToleranceThreshold) hintDirectives.push("Less Blue 🔵");
        
        if (hintDirectives.length === 0) {
            DOM.hintTicker.textContent = "Incredibly close! Lock it down and submit.";
        } else {
            DOM.hintTicker.textContent = hintDirectives.join(" | ");
        }
    }

    function updateLivesUIVisualizations() {
        const hearts = DOM.livesContainer.querySelectorAll('.heart');
        for (let i = 0; i < hearts.length; i++) {
            if (i < gameState.lives) {
                hearts[i].classList.add('active');
            } else {
                hearts[i].classList.remove('active');
            }
        }
    }

    function spawnFloatingTextNotification(text) {
        const el = document.createElement('div');
        el.className = 'floating-num';
        el.textContent = text;
        
        const containerMetrics = DOM.gameContainer.getBoundingClientRect();
        el.style.left = `${containerMetrics.left + (containerMetrics.width / 2) - 40 + (Math.random() * 40)}px`;
        el.style.top = `${containerMetrics.top + 140}px`;
        
        DOM.floatingNotificationLayer.appendChild(el);
        setTimeout(() => { el.remove(); }, 1000);
    }

    function evaluateCurrentMatchMatch() {
        stopSessionCountdownTimer();
        if (gameState.memoryTimeout) { clearInterval(gameState.memoryTimeout); }
        
        DOM.targetColorBox.style.backgroundColor = `rgb(${gameState.targetColor.r}, ${gameState.targetColor.g}, ${gameState.targetColor.b})`;
        DOM.memoryModeMaskText.classList.add('hidden');

        const diffR = gameState.targetColor.r - gameState.playerColor.r;
        const diffG = gameState.targetColor.g - gameState.playerColor.g;
        const diffB = gameState.targetColor.b - gameState.playerColor.b;
        
        const euclideanDistance = Math.sqrt(diffR*diffR + diffG*diffG + diffB*diffB);
        const maxPossibleDistance = 441.67295593;
        
        let accuracyPercentage = (1 - (euclideanDistance / maxPossibleDistance)) * 100;
        accuracyPercentage = Math.max(0, Math.min(100, accuracyPercentage));
        
        const finalizedScorePercentage = Math.round(accuracyPercentage);
        
        let pointsAwarded = 0;
        let isPerfectMatchExcellent = false;
        let passedRoundMatchCriteria = true;
        let gradeText = "";
        let starSymbols = "";

        if (finalizedScorePercentage >= 99) {
            pointsAwarded = 100; isPerfectMatchExcellent = true; gradeText = "Perfect! ✨"; starSymbols = "⭐⭐⭐";
        } else if (finalizedScorePercentage >= 95) {
            pointsAwarded = 90; isPerfectMatchExcellent = true; gradeText = "Excellent!"; starSymbols = "⭐⭐⭐";
        } else if (finalizedScorePercentage >= 90) {
            pointsAwarded = 80; gradeText = "Good Job"; starSymbols = "⭐⭐";
        } else if (finalizedScorePercentage >= 80) {
            pointsAwarded = 60; gradeText = "Good"; starSymbols = "⭐⭐";
        } else if (finalizedScorePercentage >= 70) {
            pointsAwarded = 40; gradeText = "Okay"; starSymbols = "⭐";
        } else {
            passedRoundMatchCriteria = false; gradeText = "Miss"; starSymbols = "😅";
        }

        if (isPerfectMatchExcellent) {
            gameState.combo++;
            if (gameState.combo > gameState.maxComboReached) { gameState.maxComboReached = gameState.combo; }
            
            let multiplier = 1;
            if (gameState.combo >= 10) { multiplier = 5; spawnFloatingTextNotification("COMBO x5 MEGA 🔥"); }
            else if (gameState.combo >= 5) { multiplier = 3; spawnFloatingTextNotification("COMBO x3 UNSTOPPABLE ⚡"); }
            else if (gameState.combo >= 3) { multiplier = 2; spawnFloatingTextNotification("COMBO x2 STREAK 🚀"); }
            
            pointsAwarded = pointsAwarded * multiplier;
            gameState.score += pointsAwarded;
            AudioEngine.trigger('success');
            
            if (finalizedScorePercentage >= 95) { ConfettiEngine.fire(); }
        } else {
            gameState.combo = 0;
            if (!passedRoundMatchCriteria) {
                gameState.lives--;
                AudioEngine.trigger('fail');
                updateLivesUIVisualizations();
            } else {
                gameState.score += pointsAwarded;
                AudioEngine.trigger('success');
            }
        }

        DOM.scoreDisplay.textContent = gameState.score;
        DOM.comboDisplay.textContent = `x${gameState.combo > 0 ? gameState.combo : 1}`;
        DOM.submitBtn.classList.add('hidden');
        
        DOM.feedbackGrade.textContent = gradeText;
        DOM.feedbackStars.textContent = starSymbols;
        DOM.feedbackAccuracy.textContent = `${finalizedScorePercentage}%`;
        DOM.feedbackPointsAwarded.textContent = passedRoundMatchCriteria ? `+${pointsAwarded} Points` : "Lost 1 Life Core Capsule";
        DOM.feedbackPointsAwarded.style.color = passedRoundMatchCriteria ? 'var(--green-channel)' : 'var(--red-channel)';
        
        const factIndex = Math.floor(Math.random() * FUN_FACTS.length);
        DOM.funFactBox.textContent = FUN_FACTS[factIndex];
        
        DOM.roundFeedbackOverlay.classList.remove('hidden');
    }

    function handleRoundExpirationTimeout() {
        if (gameState.memoryTimeout) { clearInterval(gameState.memoryTimeout); }
        
        gameState.combo = 0;
        gameState.lives--;
        AudioEngine.trigger('fail');
        updateLivesUIVisualizations();
        
        DOM.targetColorBox.style.backgroundColor = `rgb(${gameState.targetColor.r}, ${gameState.targetColor.g}, ${gameState.targetColor.b})`;
        DOM.memoryModeMaskText.classList.add('hidden');
        DOM.submitBtn.classList.add('hidden');

        DOM.feedbackGrade.textContent = "Time Expired!";
        DOM.feedbackStars.textContent = "😅";
        DOM.feedbackAccuracy.textContent = "0%";
        DOM.feedbackPointsAwarded.textContent = "Lost 1 Life Core Capsule (Timeout)";
        DOM.feedbackPointsAwarded.style.color = 'var(--red-channel)';
        DOM.funFactBox.textContent = "Speed processing is highly vital within proper real-time color balancing spectrum configurations.";
        
        DOM.roundFeedbackOverlay.classList.remove('hidden');
    }

    function advanceToNextRound() {
        if (gameState.lives <= 0) {
            executeGameOverSequence();
            return;
        }
        
        gameState.round++;
        DOM.roundDisplay.textContent = gameState.round;
        resetSlidersToDefault();
        generateRoundTargetColor();
    }

    function executeGameOverSequence() {
        AudioEngine.trigger('gameover');
        
        if (!gameState.isDailyChallenge) {
            gameState.stats.gamesPlayed++;
            if (gameState.score > gameState.stats.bestScore) { gameState.stats.bestScore = gameState.score; }
            if (gameState.maxComboReached > gameState.stats.highestCombo) { gameState.stats.highestCombo = gameState.maxComboReached; }
            StorageController.save();
        }

        DOM.summaryFinalScore.textContent = gameState.score;
        DOM.summaryRounds.textContent = gameState.round;
        DOM.summaryMaxCombo.textContent = `x${gameState.maxComboReached}`;
        DOM.summaryBestScore.textContent = gameState.isDailyChallenge ? "N/A" : gameState.stats.bestScore;
        
        if (gameState.isDailyChallenge) {
            DOM.gameOverMessage.textContent = "Daily Challenge complete! Match sequences data processed uniformly.";
        } else {
            DOM.gameOverMessage.textContent = gameState.score >= gameState.stats.bestScore && gameState.score > 0 ? 
                "Incredible! You have set a new all-time local high record score!" : "Spectacular attempt! Can you beat your record?";
        }

        switchScreen('gameOverScreen');
    }

    document.addEventListener('DOMContentLoaded', initApp);

})();