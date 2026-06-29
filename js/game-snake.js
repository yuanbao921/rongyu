/* ============================================================
   game-snake.js — 贪吃蛇
   玫瑰色小蛇 + 爱心食物 + 陆沉说话
   ============================================================ */

let snakeTimer = null;
let snake = [], dir = {x:1,y:0}, food = {}, snakeScore = 0;
let snakeRunning = false;
const CELL = 20;

const SNAKE_WORDS = [
  '吃到了，不错。',
  '你很棒，继续。',
  '再吃一个。',
  '小心别咬到自己。',
  '我在看着你。',
  '这个爱心是我的心意。',
];
const SNAKE_DEAD = [
  '没关系，再来一次。',
  '你已经很好了。',
  '下次我陪你打。',
  '咬到自己了？小笨蛋。',
];

function showGameAI(text) {
  const bubble = document.getElementById('game-ai-bubble');
  const txt    = document.getElementById('game-ai-text');
  if (!bubble || !txt) return;
  txt.textContent = text;
  bubble.style.display = 'flex';
  clearTimeout(bubble._timer);
  bubble._timer = setTimeout(() => bubble.style.display = 'none', 2500);
}

function initSnake() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;

  // 计算合适的格子数
  const W = Math.min(canvas.parentElement.clientWidth - 32, 340);
  const cols = Math.floor(W / CELL);
  const rows = Math.floor((canvas.parentElement.clientHeight - 160) / CELL);
  canvas.width  = cols * CELL;
  canvas.height = rows * CELL;

  snake = [{x: Math.floor(cols/2), y: Math.floor(rows/2)}];
  dir   = {x:1, y:0};
  snakeScore = 0;
  snakeRunning = true;

  placeFood(cols, rows);
  renderSnake(canvas, cols, rows);
  document.getElementById('game-score').textContent = '0';

  clearInterval(snakeTimer);
  snakeTimer = setInterval(() => tickSnake(canvas, cols, rows), 180);

  // 方向按钮
  const ctrl = document.getElementById('game-controls');
  ctrl.innerHTML = `
    <div class="snake-dpad">
      <button class="dpad-btn dpad-up"   data-dir="up">▲</button>
      <div class="dpad-row">
        <button class="dpad-btn dpad-left"  data-dir="left">◄</button>
        <div class="dpad-center">🐍</div>
        <button class="dpad-btn dpad-right" data-dir="right">►</button>
      </div>
      <button class="dpad-btn dpad-down"  data-dir="down">▼</button>
    </div>`;

  ctrl.querySelectorAll('.dpad-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      tap(6);
      const d = btn.dataset.dir;
      if (d==='up'    && dir.y===0) dir = {x:0,  y:-1};
      if (d==='down'  && dir.y===0) dir = {x:0,  y:1};
      if (d==='left'  && dir.x===0) dir = {x:-1, y:0};
      if (d==='right' && dir.x===0) dir = {x:1,  y:0};
    });
  });

  showGameAI('要开始了，别让蛇咬到自己。');
}

function placeFood(cols, rows) {
  do {
    food = {x: Math.floor(Math.random()*cols), y: Math.floor(Math.random()*rows)};
  } while (snake.some(s => s.x===food.x && s.y===food.y));
}

function tickSnake(canvas, cols, rows) {
  if (!snakeRunning) return;
  const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};

  // 撞墙
  if (head.x<0||head.x>=cols||head.y<0||head.y>=rows) { gameOver(); return; }
  // 撞自己
  if (snake.some(s=>s.x===head.x&&s.y===head.y)) { gameOver(); return; }

  snake.unshift(head);

  if (head.x===food.x && head.y===food.y) {
    snakeScore++;
    document.getElementById('game-score').textContent = snakeScore;
    placeFood(cols, rows);
    showGameAI(pickRandom(SNAKE_WORDS));
    tap([10,5,10]);
  } else {
    snake.pop();
  }
  renderSnake(canvas, cols, rows);
}

function renderSnake(canvas, cols, rows) {
  const ctx = canvas.getContext('2d');
  const cs  = getComputedStyle(document.documentElement);
  const rose = cs.getPropertyValue('--rose').trim() || '#C2827A';
  const bg   = cs.getPropertyValue('--bg').trim()   || '#F5EDE4';

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 网格
  ctx.strokeStyle = 'rgba(194,130,122,0.08)';
  ctx.lineWidth   = 0.5;
  for (let x=0;x<=cols;x++) { ctx.beginPath(); ctx.moveTo(x*CELL,0); ctx.lineTo(x*CELL,canvas.height); ctx.stroke(); }
  for (let y=0;y<=rows;y++) { ctx.beginPath(); ctx.moveTo(0,y*CELL); ctx.lineTo(canvas.width,y*CELL); ctx.stroke(); }

  // 食物（爱心）
  ctx.font = (CELL-2) + 'px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('💕', food.x*CELL+CELL/2, food.y*CELL+CELL/2);

  // 蛇身
  snake.forEach((seg, i) => {
    const alpha = 1 - i * 0.03;
    ctx.fillStyle = i === 0 ? rose : rose + Math.round(alpha*255).toString(16).padStart(2,'0');
    const r = i === 0 ? CELL/2-1 : CELL/2-2;
    ctx.beginPath();
    ctx.arc(seg.x*CELL+CELL/2, seg.y*CELL+CELL/2, r, 0, Math.PI*2);
    ctx.fill();
    // 蛇头加眼睛
    if (i === 0) {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(seg.x*CELL+CELL/2+3, seg.y*CELL+CELL/2-3, 2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#333';
      ctx.beginPath(); ctx.arc(seg.x*CELL+CELL/2+3, seg.y*CELL+CELL/2-3, 1, 0, Math.PI*2); ctx.fill();
    }
  });
}

function gameOver() {
  snakeRunning = false;
  clearInterval(snakeTimer);
  showGameAI(pickRandom(SNAKE_DEAD));
  tap([50,30,50]);

  // 游戏结束提示
  const canvas = document.getElementById('game-canvas');
  const ctx    = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(245,237,228,0.85)';
  ctx.fillRect(canvas.width/2-80, canvas.height/2-30, 160, 60);
  ctx.fillStyle = '#7A6258';
  ctx.font = '16px PingFang SC';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('游戏结束  得分 ' + snakeScore, canvas.width/2, canvas.height/2-8);
  ctx.font = '12px PingFang SC';
  ctx.fillStyle = '#C2827A';
  ctx.fillText('点击重新开始', canvas.width/2, canvas.height/2+14);

  canvas.onclick = () => { canvas.onclick = null; initSnake(); };
}

function stopSnake() {
  snakeRunning = false;
  clearInterval(snakeTimer);
  const canvas = document.getElementById('game-canvas');
  if (canvas) canvas.onclick = null;
}
