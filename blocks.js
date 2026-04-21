/* ============================================
   底辺テトリス - ブロック定義
   名言・形・色は簡単に追加可能
   ============================================ */

// ブロックの定義
// shape: 2次元配列でブロックの形を定義
// chars: ブロック内に表示する文字（形に合わせて）
// quote: このブロックの名言（画面下部に表示）
// color: ブロックの色（グラデーション対応）
// shadowColor: 影の色

const BLOCK_DEFINITIONS = [
    // ============================================
    // O型ブロック（2x2正方形）
    // ============================================
    {
        id: 'O1',
        shape: [
            [1, 1],
            [1, 1]
        ],
        chars: [
            ['趣', 'な'],
            ['い', 'な']
        ],
        quote: '「趣がないな」',
        color: '#feca57',
        shadowColor: '#f9a826',
        gradient: ['#feca57', '#f8e71c']
    },
    {
        id: 'O2',
        shape: [
            [1, 1],
            [1, 1]
        ],
        chars: [
            ['仲', '良'],
            ['く', '？']
        ],
        quote: '「仲良くしよ？ お願い」',
        color: '#ff9ff3',
        shadowColor: '#f368e0',
        gradient: ['#ff9ff3', '#f368e0']
    },
    
    // ============================================
    // I型ブロック（縦長）
    // ============================================
    {
        id: 'I1',
        shape: [
            [1],
            [1],
            [1],
            [1]
        ],
        chars: [
            ['て'],
            ['め'],
            ['ぇ'],
            ['ー']
        ],
        quote: '「てめぇー！」',
        color: '#48dbfb',
        shadowColor: '#0abde3',
        gradient: ['#48dbfb', '#0abde3']
    },
    {
        id: 'I2',
        shape: [
            [1],
            [1],
            [1],
            [1]
        ],
        chars: [
            ['お'],
            ['め'],
            ['ぇ'],
            ['ー']
        ],
        quote: '「おめぇー！」',
        color: '#ff6b6b',
        shadowColor: '#ee5a5a',
        gradient: ['#ff6b6b', '#ee5a5a']
    },
    {
        id: 'I3',
        shape: [
            [1],
            [1]
        ],
        chars: [
            ['手'],
            ['前']
        ],
        quote: '「手前ぇ！」',
        color: '#ff9f43',
        shadowColor: '#ee8a35',
        gradient: ['#ff9f43', '#f7b731']
    },

    // ============================================
    // T型ブロック
    // ============================================
    {
        id: 'T1',
        shape: [
            [1, 1, 1],
            [0, 1, 0]
        ],
        chars: [
            ['敵', 'か', '？'],
            ['', '味', '']
        ],
        quote: '「敵か？ 味方か？」',
        color: '#a29bfe',
        shadowColor: '#6c5ce7',
        gradient: ['#a29bfe', '#6c5ce7']
    },
    {
        id: 'T2',
        shape: [
            [1, 1, 1],
            [0, 1, 0]
        ],
        chars: [
            ['答', 'え', 'ろ'],
            ['', '！', '']
        ],
        quote: '「その前に答えろ」',
        color: '#fd79a8',
        shadowColor: '#e84393',
        gradient: ['#fd79a8', '#e84393']
    },

    // ============================================
    // 小L型ブロック（3ブロックL字）
    // ============================================
    {
        id: 'SL1',
        shape: [
            [1, 0],
            [1, 1]
        ],
        chars: [
            ['大', ''],
            ['親', '友']
        ],
        quote: '「大親友」',
        color: '#e056fd',
        shadowColor: '#be2edd',
        gradient: ['#e056fd', '#be2edd']
    },

    // ============================================
    // L型ブロック
    // ============================================
    {
        id: 'L1',
        shape: [
            [1, 0],
            [1, 0],
            [1, 1]
        ],
        chars: [
            ['い', ''],
            ['ち', ''],
            ['か', 'っ']
        ],
        quote: '「一か八かだ！」',
        color: '#f39c12',
        shadowColor: '#d68910',
        gradient: ['#f39c12', '#f1c40f']
    },
    {
        id: 'L2',
        shape: [
            [1, 0],
            [1, 0],
            [1, 1]
        ],
        chars: [
            ['義', ''],
            ['の', ''],
            ['人', 'だ']
        ],
        quote: '「義の人だ！」',
        color: '#00cec9',
        shadowColor: '#00b894',
        gradient: ['#00cec9', '#00b894']
    },

    // ============================================
    // I6型ブロック（横棒6文字）
    // ============================================
    {
        id: 'I61',
        shape: [
            [1, 1, 1, 1, 1, 1]
        ],
        chars: [
            ['年', '収', '5', '3', '0', '万']
        ],
        quote: '「年収530万」',
        color: '#badc58',
        shadowColor: '#6ab04c',
        gradient: ['#badc58', '#6ab04c']
    },

    // ============================================
    // J型ブロック
    // ============================================
    {
        id: 'J1',
        shape: [
            [0, 1],
            [0, 1],
            [1, 1]
        ],
        chars: [
            ['', 'ゴ'],
            ['', 'ル'],
            ['ウ', 'ィ']
        ],
        quote: '「ゴルウィ」',
        color: '#74b9ff',
        shadowColor: '#0984e3',
        gradient: ['#74b9ff', '#0984e3']
    },
    {
        id: 'J2',
        shape: [
            [0, 1],
            [0, 1],
            [1, 1]
        ],
        chars: [
            ['', '来'],
            ['', 'い'],
            ['よ', '！']
        ],
        quote: '「来いよ！」',
        color: '#55efc4',
        shadowColor: '#00b894',
        gradient: ['#55efc4', '#00b894']
    },

    // ============================================
    // S型ブロック
    // ============================================
    {
        id: 'S1',
        shape: [
            [0, 1, 1],
            [1, 1, 0]
        ],
        chars: [
            ['', '逃', 'げ'],
            ['る', 'な', '']
        ],
        quote: '「逃げるな！」',
        color: '#81ecec',
        shadowColor: '#00cec9',
        gradient: ['#81ecec', '#00cec9']
    },
    {
        id: 'S2',
        shape: [
            [0, 1, 1],
            [1, 1, 0]
        ],
        chars: [
            ['', '前', 'へ'],
            ['進', 'め', '']
        ],
        quote: '「前へ進め！」',
        color: '#dfe6e9',
        shadowColor: '#b2bec3',
        gradient: ['#dfe6e9', '#b2bec3']
    },

    // ============================================
    // Z型ブロック
    // ============================================
    {
        id: 'Z1',
        shape: [
            [1, 1, 0],
            [0, 1, 1]
        ],
        chars: [
            ['構', '成', ''],
            ['', '員', '！']
        ],
        quote: '「構成員」',
        color: '#e17055',
        shadowColor: '#d63031',
        gradient: ['#e17055', '#d63031']
    },
    {
        id: 'Z2',
        shape: [
            [1, 1, 0],
            [0, 1, 1]
        ],
        chars: [
            ['負', 'け', ''],
            ['', 'な', 'い']
        ],
        quote: '「負けない！」',
        color: '#fab1a0',
        shadowColor: '#e17055',
        gradient: ['#fab1a0', '#e17055']
    },

    // ============================================
    // 浅い（2ブロック横）
    // ============================================
    {
        id: 'ASAI1',
        shape: [
            [1, 1]
        ],
        chars: [
            ['浅', 'い']
        ],
        quote: '「浅い」',
        color: '#54a0ff',
        shadowColor: '#2e86de',
        gradient: ['#54a0ff', '#2e86de']
    },

    // ============================================
    // 次期専務（2x2正方形）
    // ============================================
    {
        id: 'JIMU1',
        shape: [
            [1, 1],
            [1, 1]
        ],
        chars: [
            ['次', '期'],
            ['専', '務']
        ],
        quote: '「次期専務」',
        color: '#5f27cd',
        shadowColor: '#341f97',
        gradient: ['#5f27cd', '#341f97']
    },

    // ============================================
    // マロブロック（1x1 爆弾）
    // ============================================
    {
        id: 'MARO',
        shape: [
            [1]
        ],
        chars: [
            ['マ']
        ],
        quote: '「マロ参上！」',
        color: '#ffffff',
        shadowColor: '#aaaaaa',
        gradient: ['#ffffff', '#dddddd'],
        isMaro: true
    },

    // ============================================
    // 十字ブロック（5x5クロス）
    // ============================================
    {
        id: 'CROSS1',
        shape: [
            [1, 1, 1],
            [1, 0, 0],
            [1, 0, 0]
        ],
        chars: [
            ['趣', 'が', 'な'],
            ['い', '', ''],
            ['な', '', '']
        ],
        quote: '「趣がないな」',
        color: '#ff6b81',
        shadowColor: '#ee5a68',
        gradient: ['#ff6b81', '#ee5a68']
    }
];

// ゲームオーバー時の名言
const GAMEOVER_QUOTES = [
    '「バカジャネーノ」',
    '「あんぽ」',
    '「逃げたな」',
    '「頭痛くなってきた」'
];

// ライン消し時の名言
const LINE_CLEAR_QUOTES = [
    '「やったぜ！」',
    '「いいね！」',
    '「その調子！」',
    '「素晴らしい！」',
    '「最高だ！」',
    '「天才か？」'
];

// レベルアップ時の名言
const LEVELUP_QUOTES = [
    '「レベルアップ！」',
    '「成長してる！」',
    '「強くなってる！」',
    '「次のステージへ！」',
    '「まだまだ行ける！」'
];

// ブロックタイプの基本形（回転計算用）
const BASE_SHAPES = {
    O: [[1, 1], [1, 1]],
    I: [[1], [1], [1], [1]],
    I2: [[1], [1]],
    I6: [[1, 1, 1, 1, 1, 1]],
    ASAI: [[1, 1]],
    T: [[1, 1, 1], [0, 1, 0]],
    SL: [[1, 0], [1, 1]],
    L: [[1, 0], [1, 0], [1, 1]],
    J: [[0, 1], [0, 1], [1, 1]],
    S: [[0, 1, 1], [1, 1, 0]],
    Z: [[1, 1, 0], [0, 1, 1]],
    CROSS: [
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [1, 1, 1, 1, 1],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0]
    ]
};

// ブロックをランダムに取得する関数
function getRandomBlock() {
    const index = Math.floor(Math.random() * BLOCK_DEFINITIONS.length);
    return JSON.parse(JSON.stringify(BLOCK_DEFINITIONS[index]));
}

// ランダムなゲームオーバー名言を取得
function getRandomGameoverQuote() {
    return GAMEOVER_QUOTES[Math.floor(Math.random() * GAMEOVER_QUOTES.length)];
}

// ランダムなライン消し名言を取得
function getRandomLineClearQuote() {
    return LINE_CLEAR_QUOTES[Math.floor(Math.random() * LINE_CLEAR_QUOTES.length)];
}

// ランダムなレベルアップ名言を取得
function getRandomLevelupQuote() {
    return LEVELUP_QUOTES[Math.floor(Math.random() * LEVELUP_QUOTES.length)];
}

// ブロックの形を回転させる（時計回り）
function rotateBlockShape(shape, chars) {
    const rows = shape.length;
    const cols = shape[0].length;
    
    const newShape = [];
    const newChars = [];
    
    for (let j = 0; j < cols; j++) {
        newShape[j] = [];
        newChars[j] = [];
        for (let i = rows - 1; i >= 0; i--) {
            newShape[j][rows - 1 - i] = shape[i][j];
            newChars[j][rows - 1 - i] = chars[i][j] || '';
        }
    }
    
    return { shape: newShape, chars: newChars };
}

// ブロック定義をエクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BLOCK_DEFINITIONS,
        GAMEOVER_QUOTES,
        LINE_CLEAR_QUOTES,
        LEVELUP_QUOTES,
        getRandomBlock,
        getRandomGameoverQuote,
        getRandomLineClearQuote,
        getRandomLevelupQuote,
        rotateBlockShape
    };
}
