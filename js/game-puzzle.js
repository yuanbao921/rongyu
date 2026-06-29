/* ============================================================
   game-puzzle.js — 消消乐
   6种表情方块，三消，连消陆沉夸你
   ============================================================ */

const PUZZLE_GEMS = ['🌸','🍯','🐻','🐰','🌙','⭐'];
const COLS_P = 6, ROWS_P = 8;
let puzzleBoard = [], puzzleScore = 0, puzzleSelected = null, puzzleRunning = false;
let comboCount = 0;

const PUZZLE_PRAISE = [
  '不错！', '厉害！', '连消！真棒！',
  '你很聪明。', '我就知道你能。', '再来一次！',
];
const PUZZLE_COMBO = [
  '连消！我喜欢看你这样。', '太强了！', '双连消！你今天状态不错。',
  '三连！媛媛真厉害！', '连消达人！',
];

function initPuzzle() {
  puzzleScore   = 0;
  puzzleRunning = true;
  puzzleSelected = null;
  comboCount = 0;
  document.getElementById('game-score').textContent = '0';

  // 生成初始棋盘（确保没有初始三连）
  puzzleBoard = [];
  for (let r=0; r<ROWS_P; r++) {
    puzzleBoard[r] = [];
    for (let c=0; c<COLS_P; c++) {
      let gem;
      do {
        gem = PUZZLE_GEMS[Math.floor(Math.random() * PUZZLE_GEMS.length)];
      } while (
        (c>=2 && puzzleBoard[r][c-1]===gem && puzzleBoard[r][c-2]===gem) ||
        (r>=2 && puzzleBoard[r-1][c]===gem && puzzleBoard[r-2][c]===gem)
      );
      puzzleBoard[r][c] = gem;
    }
  }
  renderPuzzle();
  showGameAI('三个一样的就能消除，加油！');
}

function renderPuzzle() {
  const ctrl = document.getElementById('game-controls');
  const CELL_SIZE = Math.floor((Math.min(window.innerWidth - 32, 360)) / COLS_P);

  let html = `<div class="puzzle-board" style="grid-template-columns:repeat(${COLS_P},${CELL_SIZE}px);grid-template-rows:repeat(${ROWS_P},${CELL_SIZE}px)">`;
  for (let r=0; r<ROWS_P; r++) {
    for (let c=0; c<COLS_P; c++) {
      const sel = puzzleSelected && puzzleSelected.r===r && puzzleSelected.c===c;
      html += `<div class="puzzle-cell${sel?' selected':''}" data-r="${r}" data-c="${c}" style="width:${CELL_SIZE}px;height:${CELL_SIZE}px;font-size:${CELL_SIZE-6}px">${puzzleBoard[r][c]||''}</div>`;
    }
  }
  html += '</div>';
  ctrl.innerHTML = html;

  ctrl.querySelectorAll('.puzzle-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      if (!puzzleRunning) return;
      tap(6);
      const r = +cell.dataset.r, c = +cell.dataset.c;
      onPuzzleTap(r, c);
    });
  });
}

function onPuzzleTap(r, c) {
  if (!puzzleSelected) {
    puzzleSelected = {r, c};
    renderPuzzle();
    return;
  }
  const {r:pr, c:pc} = puzzleSelected;
  puzzleSelected = null;

  // 只允许相邻交换
  const isAdj = (Math.abs(r-pr)===1&&c===pc)||(Math.abs(c-pc)===1&&r===pr);
  if (!isAdj) {
    puzzleSelected = {r, c};
    renderPuzzle();
    return;
  }

  // 交换
  const tmp = puzzleBoard[r][c];
  puzzleBoard[r][c] = puzzleBoard[pr][pc];
  puzzleBoard[pr][pc] = tmp;

  // 检查是否有消除
  const matches = findMatches();
  if (matches.length === 0) {
    // 换回来
    puzzleBoard[pr][pc] = puzzleBoard[r][c];
    puzzleBoard[r][c] = tmp;
    renderPuzzle();
    return;
  }

  comboCount = 0;
  processMatches(matches);
}

function findMatches() {
  const matched = new Set();
  // 横向
  for (let r=0; r<ROWS_P; r++) {
    for (let c=0; c<COLS_P-2; c++) {
      if (puzzleBoard[r][c] && puzzleBoard[r][c]===puzzleBoard[r][c+1] && puzzleBoard[r][c]===puzzleBoard[r][c+2]) {
        let len = 3;
        while (c+len<COLS_P && puzzleBoard[r][c+len]===puzzleBoard[r][c]) len++;
        for (let i=0;i<len;i++) matched.add(r+','+( c+i));
      }
    }
  }
  // 纵向
  for (let c=0; c<COLS_P; c++) {
    for (let r=0; r<ROWS_P-2; r++) {
      if (puzzleBoard[r][c] && puzzleBoard[r][c]===puzzleBoard[r+1][c] && puzzleBoard[r][c]===puzzleBoard[r+2][c]) {
        let len = 3;
        while (r+len<ROWS_P && puzzleBoard[r+len][c]===puzzleBoard[r][c]) len++;
        for (let i=0;i<len;i++) matched.add((r+i)+','+c);
      }
    }
  }
  return [...matched].map(k => { const [r,c]=k.split(','); return {r:+r,c:+c}; });
}

function processMatches(matches) {
  puzzleRunning = false;
  comboCount++;
  const pts = matches.length * 10 * comboCount;
  puzzleScore += pts;
  document.getElementById('game-score').textContent = puzzleScore;

  // 清除
  matches.forEach(({r,c}) => puzzleBoard[r][c] = null);
  renderPuzzle();

  if (comboCount > 1) showGameAI(pickRandom(PUZZLE_COMBO));
  else showGameAI(pickRandom(PUZZLE_PRAISE));
  tap([10,5,10]);

  setTimeout(() => {
    dropDown();
    fillBoard();
    renderPuzzle();

    // 检查连锁
    setTimeout(() => {
      const next = findMatches();
      if (next.length > 0) processMatches(next);
      else puzzleRunning = true;
    }, 300);
  }, 300);
}

function dropDown() {
  for (let c=0; c<COLS_P; c++) {
    const col = [];
    for (let r=ROWS_P-1; r>=0; r--) {
      if (puzzleBoard[r][c]) col.push(puzzleBoard[r][c]);
    }
    for (let r=ROWS_P-1; r>=0; r--) {
      puzzleBoard[r][c] = col[ROWS_P-1-r] || null;
    }
  }
}

function fillBoard() {
  for (let r=0; r<ROWS_P; r++) {
    for (let c=0; c<COLS_P; c++) {
      if (!puzzleBoard[r][c]) {
        puzzleBoard[r][c] = PUZZLE_GEMS[Math.floor(Math.random()*PUZZLE_GEMS.length)];
      }
    }
  }
}

function stopPuzzle() {
  puzzleRunning = false;
}
