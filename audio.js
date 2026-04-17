/* ============================================
   底辺テトリス - オーディオシステム
   Web Audio API を使用
   ============================================ */

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.isMuted = false;
        this.isInitialized = false;
        this.bgmOscillators = [];
        this.bgmGain = null;
        this.currentBgmInterval = null;
        // BGMビート管理用
        this.bgmBeatIndex = 0;
        this.bgmSubBeat = 0;
    }

    // オーディオコンテキストを初期化（ユーザーインタラクション後に呼ぶ）
    init() {
        if (this.isInitialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.5;
            
            this.bgmGain = this.audioContext.createGain();
            this.bgmGain.connect(this.masterGain);
            this.bgmGain.gain.value = 0.3;
            
            this.isInitialized = true;
            console.log('Audio initialized');
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    // 音声を再開（iOS対応）
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // ミュート切り替え
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : 0.5;
        }
        return this.isMuted;
    }

    // 単純な音を生成
    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.isInitialized || this.isMuted) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // 移動音
    playMove() {
        this.playTone(200, 0.05, 'square', 0.1);
    }

    // 回転音
    playRotate() {
        this.playTone(400, 0.1, 'sine', 0.2);
        setTimeout(() => this.playTone(500, 0.1, 'sine', 0.15), 50);
    }

    // ブロック着地音
    playLand() {
        this.playTone(150, 0.15, 'triangle', 0.3);
    }

    // ライン消し音（行数に応じて変化）
    playLineClear(lines) {
        const baseFreq = 400;
        const duration = 0.3;
        
        for (let i = 0; i < lines; i++) {
            setTimeout(() => {
                this.playTone(baseFreq + (i * 100), duration, 'square', 0.3);
                this.playTone((baseFreq + (i * 100)) * 1.5, duration, 'sine', 0.2);
            }, i * 80);
        }
        
        // 4ライン同時消しの場合、特別なサウンド
        if (lines >= 4) {
            setTimeout(() => {
                this.playTone(800, 0.5, 'sawtooth', 0.3);
                this.playTone(1000, 0.4, 'sine', 0.25);
                this.playTone(1200, 0.3, 'sine', 0.2);
            }, lines * 80);
        }
    }

    // レベルアップ音
    playLevelUp() {
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 0.2, 'sine', 0.3);
                this.playTone(freq * 0.5, 0.2, 'triangle', 0.2);
            }, i * 100);
        });
    }

    // ゲームオーバー音
    playGameOver() {
        const notes = [400, 350, 300, 250, 200];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 0.3, 'sawtooth', 0.25);
            }, i * 150);
        });
    }

    // ゲームクリア音
    playGameClear() {
        const melody = [
            { freq: 523, dur: 0.15 },  // C5
            { freq: 587, dur: 0.15 },  // D5
            { freq: 659, dur: 0.15 },  // E5
            { freq: 698, dur: 0.15 },  // F5
            { freq: 784, dur: 0.3 },   // G5
            { freq: 784, dur: 0.15 },  // G5
            { freq: 880, dur: 0.15 },  // A5
            { freq: 988, dur: 0.15 },  // B5
            { freq: 1047, dur: 0.5 }   // C6
        ];
        
        let time = 0;
        melody.forEach((note) => {
            setTimeout(() => {
                this.playTone(note.freq, note.dur + 0.1, 'sine', 0.35);
                this.playTone(note.freq * 0.5, note.dur + 0.1, 'triangle', 0.2);
            }, time * 1000);
            time += note.dur;
        });
    }

    // ハードドロップ音
    playHardDrop() {
        this.playTone(100, 0.2, 'square', 0.4);
        setTimeout(() => this.playTone(80, 0.15, 'triangle', 0.3), 50);
    }

    // BGM開始
    // オシレーター作成を減らすため、ビート間隔を長くし、より長い音を使用
    startBGM(level = 1) {
        if (!this.isInitialized) return;
        
        this.stopBGM();
        
        // テンポはレベルに応じて速くなる
        // 最小間隔を150msに設定してオシレーター作成頻度を抑える
        const baseTempo = 600 - (level * 30);
        const tempo = Math.max(baseTempo, 300);
        
        // 簡単なベースラインパターン（0は休符）
        const bassPattern = [
            130.81, 146.83, 164.81, 146.83,  // C3, D3, E3, D3
            174.61, 196.00, 220.00, 196.00   // F3, G3, A3, G3
        ];
        
        // メロディパターン
        const melodyPattern = [
            523.25, 587.33, 659.25, 698.46,  // C5, D5, E5, F5
            783.99, 659.25, 587.33, 523.25   // G5, E5, D5, C5
        ];
        
        // インデックスをリセット
        this.bgmBeatIndex = 0;
        this.bgmSubBeat = 0;
        
        this.currentBgmInterval = setInterval(() => {
            if (this.isMuted) return;
            
            const beat = this.bgmBeatIndex;
            
            // ベース（2ビートごと）
            if (beat % 2 === 0) {
                const bassFreq = bassPattern[Math.floor(beat / 2) % bassPattern.length];
                if (bassFreq > 0) {
                    this.playBgmNote(bassFreq, 0.25, 'triangle', 0.15);
                }
            }
            
            // メロディ（4ビートごと）
            if (beat % 4 === 0) {
                const melodyFreq = melodyPattern[Math.floor(beat / 4) % melodyPattern.length];
                if (melodyFreq > 0) {
                    this.playBgmNote(melodyFreq, 0.2, 'sine', 0.1);
                }
            }
            
            // ドラム風（8ビートごと）
            if (beat % 8 === 0) {
                this.playBgmNote(60, 0.15, 'square', 0.2);
            }
            if (beat % 4 === 2) {
                this.playBgmNote(200, 0.08, 'square', 0.1);
            }
            
            this.bgmBeatIndex++;
        }, tempo);
    }

    // BGM用ノート
    playBgmNote(frequency, duration, type, volume) {
        if (!this.isInitialized || !this.bgmGain) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.bgmGain);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // BGM停止
    stopBGM() {
        if (this.currentBgmInterval) {
            clearInterval(this.currentBgmInterval);
            this.currentBgmInterval = null;
        }
    }

    // UIクリック音
    playUIClick() {
        this.playTone(600, 0.05, 'sine', 0.2);
    }

    // 全ての音を停止
    stopAll() {
        this.stopBGM();
    }
}

// グローバルインスタンス
const audioManager = new AudioManager();
