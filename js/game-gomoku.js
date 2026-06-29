/* ============================================================
   game-gomoku.js — 五子棋
   玩家执黑，AI执白，陆沉偶尔点评
   ============================================================ */

const GSIZE = 13; // 13×13棋盘
let gBoard = [], gTurn = 'black', gomokuRunning = false;
let gCanvas, gCtx, gCellSize;

const AI_COMMENTS_GOOD = ['这步不错。','嗯，有想法。','看来你认真了。'];
const AI_COMMENTS_WARN = ['小心了。','这里有点危险。','我不会让你赢的。'];
const AI_COMMENTS_WIN  = ['我赢了，下次再来。','这局我胜了。','棋差一招。'];
const AI_COMMENTS_LOSE = ['你赢了，厉害。','认输，你比我聪明。','下次我要认真了。'];

function initGomoku() {
  gBoard = Array.from({length:GSIZE}, ()=>Array(GSIZE).fill(null));
  gTurn  = 'black';
  gomokuRunning = true;
  document.getElementById('game-score').textContent = '执黑先行';

  gCanvas = document.getElementById('game-canvas');
  const maxW = Math.min(gCanvas.parentElement.clientWidth - 24, 340);
  gCellSize = Math.floor(maxW / (GSIZE + 1));
  const boardPx = gCellSize * (GSIZE + 1);
  gCanvas.width  = boardPx;
  gCanvas.height = boardPx;

  drawGomokuBoard();
  gCanvas.onclick = onGomokuClick;
  showGameAI('你执黑，先行，加油。');
}

function drawGomokuBoard() {
  gCtx = gCanvas.getContext('2d');
  const cs = getComputedStyle(document.documentElement);
  const rose = cs.getPropertyValue('--rose').trim() || '#C2827A';

  gCtx.clearRect(0,0,gCanvas.width,gCanvas.height);

  // 棋盘背景
  gCtx.fillStyle = 'rgba(245,220,180,0.6)';
  gCtx.fillRect(0,0,gCanvas.width,gCanvas.height);

  // 网格线
  gCtx.strokeStyle = 'rgba(100,70,40,0.4)';
  gCtx.lineWidth = 0.8;
  for (let i=0; i<GSIZE; i++) {
    const x = gCellSize + i * gCellSize;
    const y = gCellSize + i * gCellSize;
    gCtx.beginPath(); gCtx.moveTo(x, gCellSize); gCtx.lineTo(x, gCellSize*(GSIZE)); gCtx.stroke();
    gCtx.beginPath(); gCtx.moveTo(gCellSize, y); gCtx.lineTo(gCellSize*GSIZE, y); gCtx.stroke();
  }

  // 星位（天元+四星）
  const stars = GSIZE===13 ? [[3,3],[3,9],[6,6],[9,3],[9,9]] : [[3,3],[3,11],[7,7],[11,3],[11,11]];
  gCtx.fillStyle = 'rgba(100,70,40,0.5)';
  stars.forEach(([r,c]) => {
    gCtx.beginPath();
    gCtx.arc(gCellSize*(c+1), gCellSize*(r+1), 3, 0, Math.PI*2);
    gCtx.fill();
  });

  // 棋子
  for (let r=0; r<GSIZE; r++) {
    for (let c=0; c<GSIZE; c++) {
      if (!gBoard[r][c]) continue;
      const x = gCellSize*(c+1), y = gCellSize*(r+1);
      const isBlack = gBoard[r][c]==='black';
      const grad = gCtx.createRadialGradient(x-2,y-2,1,x,y,gCellSize/2-2);
      if (isBlack) {
        grad.addColorStop(0,'#666'); grad.addColorStop(1,'#111');
      } else {
        grad.addColorStop(0,'#fff'); grad.addColorStop(1,'#ccc');
      }
      gCtx.fillStyle = grad;
      gCtx.shadowColor = 'rgba(0,0,0,0.3)';
      gCtx.shadowBlur  = 4;
      gCtx.beginPath();
      gCtx.arc(x, y, gCellSize/2-2, 0, Math.PI*2);
      gCtx.fill();
      gCtx.shadowBlur = 0;
    }
  }
}

function onGomokuClick(e) {
  if (!gomokuRunning || gTurn !== 'black') return;
  const rect = gCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const c = Math.round(x/gCellSize) - 1;
  const r = Math.round(y/gCellSize) - 1;

  if (r<0||r>=GSIZE||c<0||c>=GSIZE||gBoard[r][c]) return;
  tap(8);

  gBoard[r][c] = 'black';
  drawGomokuBoard();

  if (checkWin(r,c,'black')) {
    gomokuRunning = false;
    gCanvas.onclick = null;
    showGameAI(pickRandom(AI_COMMENTS_LOSE));
    document.getElementById('game-score').textContent = '你赢了！🎉';
    tap([30,20,30,20,50]);
    return;
  }

  gTurn = 'white';
  document.getElementById('game-score').textContent = 'AI思考中…';
  setTimeout(aiMove, 400);
}

function aiMove() {
  if (!gomokuRunning) return;
  const move = getBestMove();
  if (!move) return;
  gBoard[move.r][move.c] = 'white';
  drawGomokuBoard();
  tap(6);

  if (checkWin(move.r,move.c,'white')) {
    gomokuRunning = false;
    gCanvas.onclick = null;
    showGameAI(pickRandom(AI_COMMENTS_WIN));
    document.getElementById('game-score').textContent = 'AI赢了';
    return;
  }

  // AI偶尔点评
  if (Math.random() < 0.3) {
    showGameAI(pickRandom(Math.random()<0.5 ? AI_COMMENTS_GOOD : AI_COMMENTS_WARN));
  }

  gTurn = 'black';
  document.getElementById('game-score').textContent = '执黑先行';
}

/* 简单AI：评分选最优落点 */
function getBestMove() {
  let best = null, bestScore = -1;

  for (let r=0; r<GSIZE; r++) {
    for (let c=0; c<GSIZE; c++) {
      if (gBoard[r][c]) continue;
      // 进攻分
      gBoard[r][c] = 'white';
      const attackScore = scorePos(r,c,'white');
      gBoard[r][c] = null;
      // 防守分
      gBoard[r][c] = 'black';
      const defendScore = scorePos(r,c,'black');
      gBoard[r][c] = null;
      // 优先进攻，其次防守
      const score = Math.max(attackScore * 1.1, defendScore);
      if (score > bestScore) { bestScore = score; best = {r,c}; }
    }
  }
  return best;
}

function scorePos(r, c, color) {
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  let total = 0;
  dirs.forEach(([dr,dc]) => {
    let count = 1, open = 0;
    for (let d=1; d<=4; d++) {
      const nr=r+dr*d, nc=c+dc*d;
      if (nr<0||nr>=GSIZE||nc<0||nc>=GSIZE) break;
      if (gBoard[nr][nc]===color) count++;
      else { if (!gBoard[nr][nc]) open++; break; }
    }
    for (let d=1; d<=4; d++) {
      const nr=r-dr*d, nc=c-dc*d;
      if (nr<0||nr>=GSIZE||nc<0||nc>=GSIZE) break;
      if (gBoard[nr][nc]===color) count++;
      else { if (!gBoard[nr][nc]) open++; break; }
    }
    const scores = {2:10,3:100,4:1000,5:100000};
    total += (scores[count]||0) * (open>0?1.5:1);
  });
  return total;
}

function checkWin(r, c, color) {
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  return dirs.some(([dr,dc]) => {
    let count = 1;
    for (let d=1; d<=4; d++) {
      const nr=r+dr*d, nc=c+dc*d;
      if (nr<0||nr>=GSIZE||nc<0||nc>=GSIZE||gBoard[nr][nc]!==color) break;
      count++;
    }
    for (let d=1; d<=4; d++) {
      const nr=r-dr*d, nc=c-dc*d;
      if (nr<0||nr>=GSIZE||nc<0||nc>=GSIZE||gBoard[nr][nc]!==color) break;
      count++;
    }
    return count >= 5;
  });
}

function stopGomoku() {
  gomokuRunning = false;
  if (gCanvas) gCanvas.onclick = null;
}
