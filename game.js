/* ============================================
   底辺テトリス - メインゲームロジック
   ============================================ */

// ============================================
// ゲーム設定
// ============================================
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 28; // ピクセル
const NEXT_BLOCK_SIZE = 8; // サイドパネルに収まるサイズ（小さめ）

// ゲーム状態
let canvas, ctx, nextCanvas, nextCtx, particleCanvas, particleCtx;
let gameBoard = [];
let currentBlock = null;
let nextBlock = null;
let gameInterval = null;
let gameRunning = false;
let gamePaused = false;

// スコア関連
let score = 0;
let level = 1;
let linesCleared = 0;
let totalLinesCleared = 0;
const MAX_LEVEL = 10;
const LINES_PER_LEVEL = 10;

// エネミー関連
let enemyHp = LINES_PER_LEVEL;
let enemyMaxHp = LINES_PER_LEVEL;

// 落下速度（レベルに応じて変化）
function getDropSpeed() {
    return Math.max(100, 800 - (level - 1) * 70);
}

// パーティクルシステム
let particles = [];

// ハードドロップエフェクト（速度ライン）
let hardDropEffect = null;

// マロ画像
const maroImage = new Image();
maroImage.src = 'resources/images/maro.png';

// ============================================
// 初期化
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initCanvas();
    initEventListeners();
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
});

function initCanvas() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    nextCanvas = document.getElementById('next-canvas');
    nextCtx = nextCanvas.getContext('2d');
    
    particleCanvas = document.getElementById('particle-canvas');
    particleCtx = particleCanvas.getContext('2d');
    
    canvas.width = COLS * BLOCK_SIZE;
    canvas.height = ROWS * BLOCK_SIZE;
    
    nextCanvas.width = 6 * NEXT_BLOCK_SIZE;
    nextCanvas.height = 6 * NEXT_BLOCK_SIZE;
}

function resizeCanvas() {
    // パーティクルキャンバスを画面サイズに合わせる
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
    
    // ゲーム画面が非表示の場合はキャンバスサイズ調整をスキップ
    const gameScreen = document.getElementById('game-screen');
    if (!gameScreen || gameScreen.classList.contains('hidden')) return;
    
    const topBar = document.querySelector('.game-top-bar');
    const touchHint = document.querySelector('.touch-hint');
    const boardWrapper = document.querySelector('.game-board-wrapper');
    if (!topBar || !boardWrapper) return;
    
    const screenH = gameScreen.clientHeight;
    const screenW = gameScreen.clientWidth;
    const topBarH = topBar.getBoundingClientRect().height || 70;
    const hintH = (touchHint && getComputedStyle(touchHint).display !== 'none')
        ? (touchHint.getBoundingClientRect().height || 20) : 0;
    const gap = 8; // padding + gap
    const maxHeight = screenH - topBarH - hintH - gap;
    const maxWidth = screenW - 8;
    
    const scaleH = maxHeight / (ROWS * BLOCK_SIZE);
    const scaleW = maxWidth / (COLS * BLOCK_SIZE);
    const scale = Math.min(scaleH, scaleW);
    
    canvas.style.width = `${COLS * BLOCK_SIZE * scale}px`;
    canvas.style.height = `${ROWS * BLOCK_SIZE * scale}px`;
}

// ============================================
// イベントリスナー
// ============================================
function initEventListeners() {
    // スタート画面
    document.getElementById('start-btn').addEventListener('click', () => {
        audioManager.init();
        audioManager.resume();
        audioManager.playUIClick();
        startGame();
    });
    
    document.getElementById('how-to-play-btn').addEventListener('click', () => {
        audioManager.init();
        audioManager.playUIClick();
        showScreen('how-to-screen');
    });
    
    document.getElementById('back-btn').addEventListener('click', () => {
        audioManager.playUIClick();
        showScreen('start-screen');
    });
    
    // ポーズ機能はキーボードショートカット（Escape または p キー）で利用可能
    
    // ポーズ画面
    document.getElementById('resume-btn').addEventListener('click', () => {
        audioManager.playUIClick();
        resumeGame();
    });
    
    document.getElementById('restart-btn').addEventListener('click', () => {
        audioManager.playUIClick();
        hideScreen('pause-screen');
        startGame();
    });
    
    document.getElementById('quit-btn').addEventListener('click', () => {
        audioManager.playUIClick();
        quitToTitle();
    });
    
    // ゲームオーバー画面
    document.getElementById('retry-btn').addEventListener('click', () => {
        audioManager.playUIClick();
        hideScreen('gameover-screen');
        startGame();
    });
    
    document.getElementById('title-btn').addEventListener('click', () => {
        audioManager.playUIClick();
        quitToTitle();
    });
    
    // クリア画面
    document.getElementById('clear-retry-btn').addEventListener('click', () => {
        audioManager.playUIClick();
        hideScreen('clear-screen');
        startGame();
    });
    
    document.getElementById('clear-title-btn').addEventListener('click', () => {
        audioManager.playUIClick();
        quitToTitle();
    });
    
    // キーボード操作（PC用）
    document.addEventListener('keydown', handleKeyDown);
    
    // スワイプ操作
    setupSwipeControls();
}

// タッチ開始位置からのスライド量に応じてブロックを横移動
function moveTouchPosition(touchStartX, touchCurrentX, blockStartX) {
    if (!currentBlock || !gameRunning || gamePaused) return;

    const canvasRect = canvas.getBoundingClientRect();
    const blockWidth = currentBlock.shape[0].length;

    // 1セル分のピクセル幅を求め、スライド量をカラム数に変換（1マス分以上ずれたら1マス移動）
    const cellWidth = canvasRect.width / COLS;
    const rawDelta = touchCurrentX - touchStartX;
    const deltaCols = Math.sign(rawDelta) * Math.floor(Math.abs(rawDelta) / cellWidth);
    const targetX = Math.max(0, Math.min(COLS - blockWidth, blockStartX + deltaCols));

    if (targetX === currentBlock.x) return;

    // 直接移動を試みる
    if (isValidPosition(currentBlock, targetX, currentBlock.y)) {
        currentBlock.x = targetX;
        audioManager.playMove();
        draw();
    } else {
        // 直接移動できない場合は1歩ずつ近づく
        const direction = targetX > currentBlock.x ? 1 : -1;
        moveBlock(direction, 0);
    }
}

// スワイプ＆タップコントロール（ゲーム画面全体）
function setupSwipeControls() {
    const gameScreen = document.getElementById('game-screen');
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let touchMoved = false;
    let isDownSwipe = false;
    let blockStartX = 0;

    gameScreen.addEventListener('touchstart', (e) => {
        // ボタン類への伝播は無視
        if (e.target.closest('.game-top-bar')) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
        touchMoved = false;
        isDownSwipe = false;
        blockStartX = currentBlock ? currentBlock.x : 0;
    }, { passive: true });

    gameScreen.addEventListener('touchmove', (e) => {
        if (!gameRunning || gamePaused) return;
        if (e.target.closest('.game-top-bar')) return;

        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        const deltaY = touchY - touchStartY;
        const deltaX = touchX - touchStartX;

        // 下スライドを検知したらフラグを立てて落下速度を上げる
        if (deltaY > 40 && Math.abs(deltaY) > Math.abs(deltaX)) {
            if (!isDownSwipe) {
                isDownSwipe = true;
                clearInterval(gameInterval);
                gameInterval = setInterval(gameLoop, 50);
            }
            return;
        }
        if (isDownSwipe) return;

        touchMoved = true;
        moveTouchPosition(touchStartX, touchX, blockStartX);
    }, { passive: true });

    gameScreen.addEventListener('touchend', (e) => {
        if (!gameRunning || gamePaused) return;
        if (e.target.closest('.game-top-bar')) return;

        // 下スライド終了 → 通常速度に戻す
        if (isDownSwipe) {
            startGameLoop();
            return;
        }

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const touchDuration = Date.now() - touchStartTime;

        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // 短いタップ（移動なし）→ 回転
        if (!touchMoved && touchDuration < 200 && Math.abs(deltaX) < 15 && Math.abs(deltaY) < 15) {
            rotateBlock();
            return;
        }
    }, { passive: true });
}

// キーボード操作
function handleKeyDown(e) {
    if (!gameRunning || gamePaused) return;
    
    switch (e.key) {
        case 'ArrowLeft':
            moveBlock(-1, 0);
            e.preventDefault();
            break;
        case 'ArrowRight':
            moveBlock(1, 0);
            e.preventDefault();
            break;
        case 'ArrowDown':
            moveBlock(0, 1);
            e.preventDefault();
            break;
        case 'ArrowUp':
        case ' ':
            rotateBlock();
            e.preventDefault();
            break;
        case 'Enter':
            hardDrop();
            e.preventDefault();
            break;
        case 'Escape':
        case 'p':
            pauseGame();
            e.preventDefault();
            break;
    }
}

// ============================================
// 画面管理
// ============================================
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        if (!screen.classList.contains('overlay')) {
            screen.classList.add('hidden');
        }
    });
    document.getElementById(screenId).classList.remove('hidden');
}

function hideScreen(screenId) {
    document.getElementById(screenId).classList.add('hidden');
}

function quitToTitle() {
    stopGame();
    hideScreen('pause-screen');
    hideScreen('gameover-screen');
    hideScreen('clear-screen');
    showScreen('start-screen');
}

// ============================================
// ゲーム制御
// ============================================
function startGame() {
    // 状態リセット
    score = 0;
    level = 1;
    linesCleared = 0;
    totalLinesCleared = 0;
    gameBoard = createEmptyBoard();
    particles = [];
    enemyHp = LINES_PER_LEVEL;
    enemyMaxHp = LINES_PER_LEVEL;
    
    // UI更新
    updateUI();
    showScreen('game-screen');
    resizeCanvas();
    
    // 最初のブロック
    currentBlock = createNewBlock();
    nextBlock = createNewBlock();
    // ゲーム開始
    gameRunning = true;
    gamePaused = false;
    
    // BGM開始
    audioManager.startBGM(level);
    
    // メインループ開始
    startGameLoop();
    
    // 描画
    draw();
    drawNextPiece();
}

function stopGame() {
    gameRunning = false;
    gamePaused = false;
    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
    }
    audioManager.stopBGM();
}

function pauseGame() {
    if (!gameRunning) return;
    gamePaused = true;
    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
    }
    audioManager.stopBGM();
    document.getElementById('pause-screen').classList.remove('hidden');
}

function resumeGame() {
    if (!gameRunning) return;
    gamePaused = false;
    hideScreen('pause-screen');
    audioManager.startBGM(level);
    startGameLoop();
}

function startGameLoop() {
    if (gameInterval) {
        clearInterval(gameInterval);
    }
    gameInterval = setInterval(gameLoop, getDropSpeed());
}

function gameLoop() {
    if (!gameRunning || gamePaused) return;
    
    if (!moveBlock(0, 1)) {
        // ブロック着地
        audioManager.playLand();
        if (currentBlock.isMaro) {
            maroExplosion();
        } else {
            placeBlock();
        }
        
        const clearedLines = checkLines();
        if (clearedLines > 0) {
            handleLineClear(clearedLines);
        }
        
        // 次のブロック
        currentBlock = nextBlock;
        nextBlock = createNewBlock();
        drawNextPiece();
        
        // ゲームオーバー判定
        if (!isValidPosition(currentBlock, currentBlock.x, currentBlock.y)) {
            gameOver();
            return;
        }
    }
    
    draw();
}

// ============================================
// ブロック操作
// ============================================
function createEmptyBoard() {
    const board = [];
    for (let y = 0; y < ROWS; y++) {
        board[y] = [];
        for (let x = 0; x < COLS; x++) {
            board[y][x] = null;
        }
    }
    return board;
}

function createNewBlock() {
    const blockDef = getRandomBlock();
    const block = {
        ...blockDef,
        x: Math.floor((COLS - blockDef.shape[0].length) / 2),
        y: -blockDef.shape.length + 1
    };
    return block;
}

function moveBlock(dx, dy) {
    if (!currentBlock || !gameRunning || gamePaused) return false;
    
    const newX = currentBlock.x + dx;
    const newY = currentBlock.y + dy;
    
    if (isValidPosition(currentBlock, newX, newY)) {
        currentBlock.x = newX;
        currentBlock.y = newY;
        if (dx !== 0) audioManager.playMove();
        draw();
        return true;
    }
    return false;
}

function rotateBlock() {
    if (!currentBlock || !gameRunning || gamePaused) return;
    
    // O型ブロックは回転しない
    if (currentBlock.id.startsWith('O')) return;
    
    const rotated = rotateBlockShape(currentBlock.shape, currentBlock.chars);
    const oldShape = currentBlock.shape;
    const oldChars = currentBlock.chars;
    
    currentBlock.shape = rotated.shape;
    currentBlock.chars = rotated.chars;
    
    // 壁蹴り判定
    let kicked = false;
    const kicks = [0, -1, 1, -2, 2];
    
    for (const kick of kicks) {
        if (isValidPosition(currentBlock, currentBlock.x + kick, currentBlock.y)) {
            currentBlock.x += kick;
            kicked = true;
            break;
        }
    }
    
    if (!kicked) {
        // 回転できない場合は元に戻す
        currentBlock.shape = oldShape;
        currentBlock.chars = oldChars;
        return;
    }
    
    audioManager.playRotate();
    draw();
}

function hardDrop() {
    if (!currentBlock || !gameRunning || gamePaused) return;
    
    // エフェクト用に落下前の情報を保存
    const effectInfo = {
        shape: currentBlock.shape.map(row => row.slice()),
        color: currentBlock.color,
        x: currentBlock.x,
        fromY: currentBlock.y
    };

    let dropDistance = 0;
    while (isValidPosition(currentBlock, currentBlock.x, currentBlock.y + 1)) {
        currentBlock.y++;
        dropDistance++;
    }
    
    if (dropDistance > 0) {
        score += dropDistance * 2;
        updateUI();
        audioManager.playHardDrop();

        // 速度ライントレイルエフェクト
        hardDropEffect = {
            shape: effectInfo.shape,
            color: effectInfo.color,
            x: effectInfo.x,
            fromY: effectInfo.fromY,
            toY: currentBlock.y,
            alpha: 0.9
        };

        // 着地インパクトパーティクル
        createHardDropImpact(currentBlock);
    }
    
    // 即座に設置
    if (currentBlock.isMaro) {
        maroExplosion();
    } else {
        placeBlock();
    }
    
    const clearedLines = checkLines();
    if (clearedLines > 0) {
        handleLineClear(clearedLines);
    }
    
    // 次のブロック
    currentBlock = nextBlock;
    nextBlock = createNewBlock();
    drawNextPiece();
    
    // ゲームオーバー判定
    if (!isValidPosition(currentBlock, currentBlock.x, currentBlock.y)) {
        gameOver();
        return;
    }
    
    draw();
    
    // 落下タイマーリセット
    startGameLoop();
}

function isValidPosition(block, x, y) {
    for (let row = 0; row < block.shape.length; row++) {
        for (let col = 0; col < block.shape[row].length; col++) {
            if (block.shape[row][col]) {
                const newX = x + col;
                const newY = y + row;
                
                // 境界チェック
                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return false;
                }
                
                // 他のブロックとの衝突チェック
                if (newY >= 0 && gameBoard[newY][newX]) {
                    return false;
                }
            }
        }
    }
    return true;
}

function placeBlock() {
    for (let row = 0; row < currentBlock.shape.length; row++) {
        for (let col = 0; col < currentBlock.shape[row].length; col++) {
            if (currentBlock.shape[row][col]) {
                const boardY = currentBlock.y + row;
                const boardX = currentBlock.x + col;
                
                if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
                    gameBoard[boardY][boardX] = {
                        color: currentBlock.color,
                        gradient: currentBlock.gradient,
                        shadowColor: currentBlock.shadowColor,
                        char: currentBlock.chars[row][col] || ''
                    };
                }
            }
        }
    }
}

// ============================================
// マロ爆発処理（自分含む周囲8ブロックを破壊）
// ============================================
function maroExplosion() {
    const cx = currentBlock.x;
    const cy = currentBlock.y;
    const canvasRect = canvas.getBoundingClientRect();

    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
                if (gameBoard[ny][nx]) {
                    createExplosionParticles(nx, ny, gameBoard[ny][nx].color, canvasRect);
                }
                gameBoard[ny][nx] = null;
            }
        }
    }
}

function createExplosionParticles(bx, by, color, canvasRect) {
    const scaleX = canvasRect.width / canvas.width;
    const scaleY = canvasRect.height / canvas.height;
    const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#1dd1a1', '#a29bfe'];
    const particleColor = color || colors[Math.floor(Math.random() * colors.length)];

    for (let i = 0; i < 6; i++) {
        particles.push({
            x: canvasRect.left + (bx * BLOCK_SIZE * scaleX) + Math.random() * (BLOCK_SIZE * scaleX),
            y: canvasRect.top + (by * BLOCK_SIZE * scaleY) + Math.random() * (BLOCK_SIZE * scaleY),
            vx: (Math.random() - 0.5) * 14,
            vy: (Math.random() - 0.5) * 14 - 6,
            size: Math.random() * 10 + 5,
            color: particleColor,
            life: 1,
            decay: 0.025 + Math.random() * 0.025
        });
    }
}

// ============================================
// ライン消し処理
// ============================================
function checkLines() {
    const linesToClear = [];
    
    for (let y = ROWS - 1; y >= 0; y--) {
        let complete = true;
        for (let x = 0; x < COLS; x++) {
            if (!gameBoard[y][x]) {
                complete = false;
                break;
            }
        }
        if (complete) {
            linesToClear.push(y);
        }
    }
    
    if (linesToClear.length > 0) {
        // パーティクルエフェクト生成
        linesToClear.forEach(y => {
            createLineParticles(y);
        });
        
        // ラインを削除（完成した行をフィルタで除外し、上に空行を追加）
        const clearedSet = new Set(linesToClear);
        const newBoard = gameBoard.filter((row, idx) => !clearedSet.has(idx));
        while (newBoard.length < ROWS) {
            newBoard.unshift(new Array(COLS).fill(null));
        }
        gameBoard = newBoard;
    }
    
    return linesToClear.length;
}

function handleLineClear(lines) {
    // スコア計算
    const lineScores = [0, 100, 300, 500, 800];
    score += lineScores[Math.min(lines, 4)] * level;
    
    linesCleared += lines;
    totalLinesCleared += lines;
    
    // エネミーにダメージ
    enemyHp -= lines;
    damageEnemy();
    
    // 効果音
    audioManager.playLineClear(lines);
    
    // レベルアップチェック
    if (linesCleared >= LINES_PER_LEVEL) {
        linesCleared -= LINES_PER_LEVEL;
        level++;
        enemyHp = LINES_PER_LEVEL;
        enemyMaxHp = LINES_PER_LEVEL;
        
        if (level > MAX_LEVEL) {
            // ゲームクリア
            gameClear();
            return;
        }
        
        audioManager.playLevelUp();
        audioManager.stopBGM();
        setTimeout(() => {
            if (gameRunning && !gamePaused) {
                audioManager.startBGM(level);
            }
        }, 500);
        
        // 落下速度更新
        startGameLoop();
    }
    
    updateUI();
}

// ============================================
// ゲーム終了処理
// ============================================
function getRandomGameoverQuote() {
    const quotes = {
        1: 'あんぽ',
        2: 'バカジャネーノ',
        3: 'じつは還暦なんだ',
        4: 'まだまだ浅い',
        5: '黙れよほんとに',
        6: 'いい加減にしろ',
        7: 'そこらへんにしとけ',
        8: 'もうやめて',
        9: '目眩がする',
        10: '頭痛くなってきた'
    };
    return quotes[level] || 'あんぽ';
}

function gameOver() {
    stopGame();
    
    audioManager.playGameOver();
    
    document.getElementById('final-level').textContent = level;
    document.getElementById('final-score').textContent = score;
    document.getElementById('final-lines').textContent = totalLinesCleared;
    document.getElementById('final-quote').textContent = getRandomGameoverQuote();
    
    document.getElementById('gameover-screen').classList.remove('hidden');
}

function gameClear() {
    stopGame();
    
    audioManager.playGameClear();
    
    // 画面フラッシュ演出
    flashScreen();
    
    // 花火パーティクルを複数波で発射
    createClearParticles();
    setTimeout(() => createFireworksParticles(window.innerWidth * 0.25, window.innerHeight * 0.4), 400);
    setTimeout(() => createFireworksParticles(window.innerWidth * 0.75, window.innerHeight * 0.35), 700);
    setTimeout(() => createFireworksParticles(window.innerWidth * 0.5, window.innerHeight * 0.25), 1000);
    setTimeout(() => createClearParticles(), 1300);
    setTimeout(() => createFireworksParticles(window.innerWidth * 0.15, window.innerHeight * 0.5), 1600);
    setTimeout(() => createFireworksParticles(window.innerWidth * 0.85, window.innerHeight * 0.5), 1900);
    setTimeout(() => createClearParticles(), 2500);
    
    document.getElementById('clear-score').textContent = score;
    document.getElementById('clear-lines').textContent = totalLinesCleared;
    
    // 少し遅らせてクリア画面を表示
    setTimeout(() => {
        document.getElementById('clear-screen').classList.remove('hidden');
    }, 600);
}

// 画面フラッシュ演出
function flashScreen() {
    const existing = document.getElementById('screen-flash');
    if (existing) existing.remove();
    const flash = document.createElement('div');
    flash.id = 'screen-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 800);
}

// 花火パーティクル（指定座標から放射状に爆発）
function createFireworksParticles(centerX, centerY) {
    const colors = ['#feca57', '#ff6b6b', '#48dbfb', '#ff9ff3', '#1dd1a1', '#a29bfe', '#ffffff'];
    const count = 45;
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const speed = 4 + Math.random() * 10;
        particles.push({
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 3,
            size: Math.random() * 10 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 1,
            decay: 0.01 + Math.random() * 0.015
        });
    }
}

// ============================================
// UI更新
// ============================================
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lines').textContent = `${linesCleared}/${LINES_PER_LEVEL}`;
    updateEnemyHpBar();
}

function updateEnemyHpBar() {
    const bar = document.getElementById('enemy-hp-bar');
    if (!bar) return;
    const pct = Math.max(0, Math.min(100, (enemyHp / enemyMaxHp) * 100));
    bar.style.width = `${pct}%`;
    // HP残量で色変化
    if (pct > 50) {
        bar.style.background = 'linear-gradient(90deg, #ff4444, #ff9933)';
    } else if (pct > 25) {
        bar.style.background = 'linear-gradient(90deg, #ff2200, #ff6600)';
    } else {
        bar.style.background = 'linear-gradient(90deg, #cc0000, #ff2200)';
    }
}

const DAMAGE_FLASH_DURATION = 150; // ms — matches CSS transition (0.15s)

function damageEnemy() {
    const img = document.getElementById('enemy-image');
    if (!img) return;
    img.classList.remove('damage-flash');
    void img.offsetWidth; // reflow to restart CSS animation
    img.classList.add('damage-flash');
    setTimeout(() => img.classList.remove('damage-flash'), DAMAGE_FLASH_DURATION);
    updateEnemyHpBar();
}


// ============================================
// 描画
// ============================================
function draw() {
    // キャンバスクリア
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // グリッド線
    ctx.strokeStyle = 'rgba(100, 100, 150, 0.2)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOCK_SIZE, 0);
        ctx.lineTo(x * BLOCK_SIZE, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOCK_SIZE);
        ctx.lineTo(canvas.width, y * BLOCK_SIZE);
        ctx.stroke();
    }
    
    // ゴースト（落下位置プレビュー）
    if (currentBlock) {
        let ghostY = currentBlock.y;
        while (isValidPosition(currentBlock, currentBlock.x, ghostY + 1)) {
            ghostY++;
        }
        if (ghostY > currentBlock.y) {
            drawBlock(currentBlock, currentBlock.x, ghostY, true);
        }
    }
    
    // ハードドロップ速度ライントレイル
    if (hardDropEffect) {
        drawHardDropTrail(hardDropEffect);
        hardDropEffect.alpha -= 0.12;
        if (hardDropEffect.alpha <= 0) {
            hardDropEffect = null;
        }
    }
    
    // 配置済みブロック
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (gameBoard[y][x]) {
                drawCell(x, y, gameBoard[y][x]);
            }
        }
    }
    
    // 現在のブロック
    if (currentBlock) {
        drawBlock(currentBlock, currentBlock.x, currentBlock.y);
    }
    
    // パーティクル更新・描画
    updateParticles();
}

function drawBlock(block, posX, posY, isGhost = false) {
    for (let row = 0; row < block.shape.length; row++) {
        for (let col = 0; col < block.shape[row].length; col++) {
            if (block.shape[row][col]) {
                const x = posX + col;
                const y = posY + row;
                
                if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
                    if (isGhost) {
                        drawGhostCell(x, y, block.color);
                    } else {
                        drawCell(x, y, {
                            color: block.color,
                            gradient: block.gradient,
                            shadowColor: block.shadowColor,
                            char: block.chars[row][col] || '',
                            isMaro: block.isMaro || false
                        });
                    }
                }
            }
        }
    }
}

function drawCell(x, y, cell) {
    const px = x * BLOCK_SIZE;
    const py = y * BLOCK_SIZE;
    const size = BLOCK_SIZE - 2;

    // マロブロックは画像で描画
    if (cell.isMaro) {
        if (maroImage.complete && maroImage.naturalWidth > 0) {
            ctx.drawImage(maroImage, px + 1, py + 1, size, size);
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(px + 1, py + 1, size, size);
        }
        return;
    }
    
    // グラデーション
    const gradient = ctx.createLinearGradient(px, py, px + size, py + size);
    if (cell.gradient) {
        gradient.addColorStop(0, cell.gradient[0]);
        gradient.addColorStop(1, cell.gradient[1]);
    } else {
        gradient.addColorStop(0, cell.color);
        gradient.addColorStop(1, cell.shadowColor || cell.color);
    }
    
    // 外枠の影
    ctx.fillStyle = cell.shadowColor || 'rgba(0,0,0,0.5)';
    ctx.fillRect(px + 3, py + 3, size, size);
    
    // メインブロック
    ctx.fillStyle = gradient;
    ctx.fillRect(px + 1, py + 1, size, size);
    
    // ハイライト
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(px + 1, py + 1, size, 3);
    ctx.fillRect(px + 1, py + 1, 3, size);
    
    // 文字
    if (cell.char) {
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${BLOCK_SIZE * 0.6}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 3;
        ctx.fillText(cell.char, px + BLOCK_SIZE / 2, py + BLOCK_SIZE / 2 + 1);
        ctx.shadowBlur = 0;
    }
}

function drawGhostCell(x, y, color) {
    const px = x * BLOCK_SIZE;
    const py = y * BLOCK_SIZE;
    const size = BLOCK_SIZE - 2;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(px + 2, py + 2, size - 2, size - 2);
    ctx.setLineDash([]);
}

function drawNextPiece() {
    // キャンバスクリア
    nextCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    if (!nextBlock) return;
    
    const blockWidth = nextBlock.shape[0].length;
    const blockHeight = nextBlock.shape.length;
    const offsetX = (6 - blockWidth) / 2;
    const offsetY = (6 - blockHeight) / 2;
    
    for (let row = 0; row < nextBlock.shape.length; row++) {
        for (let col = 0; col < nextBlock.shape[row].length; col++) {
            if (nextBlock.shape[row][col]) {
                const px = (offsetX + col) * NEXT_BLOCK_SIZE;
                const py = (offsetY + row) * NEXT_BLOCK_SIZE;
                const size = NEXT_BLOCK_SIZE - 2;
                
                // グラデーション
                const gradient = nextCtx.createLinearGradient(px, py, px + size, py + size);
                if (nextBlock.gradient) {
                    gradient.addColorStop(0, nextBlock.gradient[0]);
                    gradient.addColorStop(1, nextBlock.gradient[1]);
                } else {
                    gradient.addColorStop(0, nextBlock.color);
                    gradient.addColorStop(1, nextBlock.shadowColor || nextBlock.color);
                }
                
                nextCtx.fillStyle = gradient;
                nextCtx.fillRect(px + 1, py + 1, size, size);
                
                // 文字（小さめ）
                const char = nextBlock.chars[row][col];
                if (char) {
                    nextCtx.fillStyle = '#fff';
                    nextCtx.font = `bold ${NEXT_BLOCK_SIZE * 0.5}px sans-serif`;
                    nextCtx.textAlign = 'center';
                    nextCtx.textBaseline = 'middle';
                    nextCtx.fillText(char, px + NEXT_BLOCK_SIZE / 2, py + NEXT_BLOCK_SIZE / 2);
                }
            }
        }
    }
}

// ============================================
// パーティクルシステム
// ============================================

// ハードドロップ: 速度ライントレイルを描画
function drawHardDropTrail(effect) {
    for (let row = 0; row < effect.shape.length; row++) {
        for (let col = 0; col < effect.shape[row].length; col++) {
            if (effect.shape[row][col]) {
                const cellX = (effect.x + col) * BLOCK_SIZE;
                const trailTop = (effect.fromY + row) * BLOCK_SIZE;
                const trailBottom = (effect.toY + row) * BLOCK_SIZE + BLOCK_SIZE;
                const trailHeight = trailBottom - trailTop;
                if (trailHeight <= 0) continue;

                ctx.save();
                ctx.globalAlpha = effect.alpha;
                const grad = ctx.createLinearGradient(0, trailTop, 0, trailBottom);
                grad.addColorStop(0, 'transparent');
                grad.addColorStop(0.4, effect.color);
                grad.addColorStop(1, effect.color);
                ctx.fillStyle = grad;
                ctx.fillRect(cellX + 3, trailTop, BLOCK_SIZE - 6, trailHeight);

                // 中央に細い光芯（残像感を強調）
                ctx.globalAlpha = effect.alpha * 0.6;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(cellX + Math.floor(BLOCK_SIZE / 2) - 1, trailTop, 2, trailHeight);
                ctx.restore();
            }
        }
    }
}

// ハードドロップ: 着地インパクトパーティクル
function createHardDropImpact(block) {
    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvasRect.width / canvas.width;
    const scaleY = canvasRect.height / canvas.height;

    for (let row = 0; row < block.shape.length; row++) {
        for (let col = 0; col < block.shape[row].length; col++) {
            if (block.shape[row][col]) {
                const bx = block.x + col;
                const by = block.y + row;
                const cx = canvasRect.left + (bx * BLOCK_SIZE + BLOCK_SIZE / 2) * scaleX;
                const cy = canvasRect.top + ((by + 1) * BLOCK_SIZE) * scaleY;

                for (let i = 0; i < 5; i++) {
                    particles.push({
                        x: cx + (Math.random() - 0.5) * BLOCK_SIZE * scaleX * 1.5,
                        y: cy,
                        vx: (Math.random() - 0.5) * 14,
                        vy: -(Math.random() * 9 + 3),
                        size: Math.random() * 6 + 2,
                        color: block.color,
                        life: 1,
                        decay: 0.04 + Math.random() * 0.04
                    });
                }
            }
        }
    }
}

// ハードドロップ: キャンバスシェイク
function shakeCanvas() {
    canvas.classList.remove('hard-drop-shake');
    // CSS アニメーションを再トリガーするためにリフローを強制する
    void canvas.offsetWidth;
    canvas.classList.add('hard-drop-shake');
    setTimeout(() => canvas.classList.remove('hard-drop-shake'), 300);
}

function createLineParticles(lineY) {
    const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#1dd1a1', '#a29bfe'];
    
    // getBoundingClientRect()を使用して正確なキャンバス位置を取得
    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvasRect.width / canvas.width;
    const scaleY = canvasRect.height / canvas.height;
    
    for (let x = 0; x < COLS; x++) {
        const cell = gameBoard[lineY][x];
        if (cell) {
            for (let i = 0; i < 5; i++) {
                particles.push({
                    x: canvasRect.left + (x * BLOCK_SIZE * scaleX) + Math.random() * (BLOCK_SIZE * scaleX),
                    y: canvasRect.top + (lineY * BLOCK_SIZE * scaleY) + Math.random() * (BLOCK_SIZE * scaleY),
                    vx: (Math.random() - 0.5) * 10,
                    vy: (Math.random() - 0.5) * 10 - 5,
                    size: Math.random() * 8 + 4,
                    color: cell.color || colors[Math.floor(Math.random() * colors.length)],
                    life: 1,
                    decay: 0.02 + Math.random() * 0.02
                });
            }
        }
    }
}

function createClearParticles() {
    const colors = ['#feca57', '#ff6b6b', '#48dbfb', '#ff9ff3', '#1dd1a1'];
    
    for (let i = 0; i < 100; i++) {
        particles.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            size: Math.random() * 15 + 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 1,
            decay: 0.005 + Math.random() * 0.01
        });
    }
}

function updateParticles() {
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3; // 重力
        p.life -= p.decay;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }
        
        particleCtx.globalAlpha = p.life;
        particleCtx.fillStyle = p.color;
        particleCtx.beginPath();
        particleCtx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        particleCtx.fill();
    }
    
    particleCtx.globalAlpha = 1;
    
    // パーティクルがある場合は継続的に更新
    if (particles.length > 0 && !gameRunning) {
        requestAnimationFrame(updateParticles);
    }
}

// ゲーム起動時のアニメーションループ
function animationLoop() {
    if (particles.length > 0) {
        updateParticles();
    }
    // ハードドロップトレイルのフェードアウトを滑らかにする
    if (hardDropEffect && gameRunning && !gamePaused) {
        draw();
    }
    requestAnimationFrame(animationLoop);
}

// アニメーションループ開始
requestAnimationFrame(animationLoop);
