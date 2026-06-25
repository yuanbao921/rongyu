/* ============================================================
   focus.js — 专注页：番茄钟 + Jamendo 音乐 + AI 陪伴
   ============================================================ */

/* ---------- Jamendo 配置 ---------- */
// 免费公开 client_id，Jamendo 官方示例 Key
const JAMENDO_ID  = '00000000';  // 替换为你自己在 devs.jamendo.com 申请的免费 Key（30秒注册）
const JAMENDO_URL = 'https://api.jamendo.com/v3.0';

/* ---------- 频道预设 ---------- */
const CHANNELS = [
  { label: '🌿 lofi',     tags: 'lofi+chillout' },
  { label: '🎹 钢琴',     tags: 'piano+relaxing' },
  { label: '🌊 ambient',  tags: 'ambient+atmospheric' },
  { label: '🌸 acoustic', tags: 'acoustic+soft' },
  { label: '☕ jazz',     tags: 'jazz+cafe' },
];

/* ---------- 状态 ---------- */
const WORK_SEC  = 25 * 60;
const REST_SEC  = 5  * 60;

let timer       = null;
let remaining   = WORK_SEC;
let isRunning   = false;
let isRest      = false;
let sessions    = Store.getJSON('focusSessions', 0);
let playlist    = [];
let trackIdx    = 0;
let musicPlaying = false;

const audio = new Audio();
audio.volume = 0.7;

/* ---------- DOM ---------- */
const timeDisplay  = () => document.getElementById('focus-time-display');
const phaseLabel   = () => document.getElementById('focus-phase-label');
const ringProgress = () => document.getElementById('focus-ring-progress');
const sessionCount = () => document.getElementById('focus-session-count');
const aiComment    = () => document.getElementById('ai-comment');
const startBtn     = () => document.getElementById('focus-start-btn');
const trackName    = () => document.getElementById('track-name');
const trackArtist  = () => document.getElementById('track-artist');
const trackArt     = () => document.getElementById('track-art');
const playBtn      = () => document.getElementById('music-play-btn');
const channelRow   = () => document.getElementById('channel-row');

/* ---------- 圆环参数 ---------- */
const CIRCUMFERENCE = 2 * Math.PI * 44; // r=44 → 276.46

function updateRing(secondsLeft, total) {
  const pct    = secondsLeft / total;
  const offset = CIRCUMFERENCE * (1 - pct);
  const el = ringProgress();
  if (el) {
    el.style.strokeDasharray  = CIRCUMFERENCE;
    el.style.strokeDashoffset = offset;
    el.style.stroke = isRest ? 'var(--rose-light)' : 'var(--rose)';
  }
}

/* ---------- 时间格式化 ---------- */
function fmt(s) {
  return Math.floor(s / 60).toString().padStart(2, '0') + ':' +
         (s % 60).toString().padStart(2, '0');
}

/* ---------- 渲染时间 ---------- */
function renderTime() {
  if (timeDisplay()) timeDisplay().textContent = fmt(remaining);
  updateRing(remaining, isRest ? REST_SEC : WORK_SEC);
}

/* ---------- AI 陪伴语 ---------- */
async function askAI(prompt) {
  const s = loadSettings();
  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer sk-aa1485e2789f4b438a83290146907fa8', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: `你是${s.aiName || '陆沉'}，在陪伴${s.userName || '兔子小姐'}专注学习。说话简短温柔，不超过40字，像在她耳边低声说话。` },
          { role: 'user',   content: prompt }
        ],
        max_tokens: 120,
      })
    });
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    if (aiComment() && text) aiComment().textContent = text;
  } catch { /* 静默失败 */ }
}

/* ---------- 番茄钟核心 ---------- */
function startTimer() {
  if (isRunning) return;
  isRunning = true;
  isRest    = false;
  remaining = WORK_SEC;

  startBtn().textContent = '专注中…';
  startBtn().classList.add('running');
  if (phaseLabel()) phaseLabel().textContent = '专注进行中';

  // 开始时 AI 说一句
  const track = playlist[trackIdx];
  const song  = track ? `正在听《${track.name}》` : '';
  askAI(`我刚开始了一个25分钟的专注。${song}说一句陪伴我的话。`);

  // 播放音乐
  if (!musicPlaying && playlist.length) playTrack(trackIdx);

  timer = setInterval(() => {
    remaining--;
    renderTime();
    if (remaining <= 0) {
      clearInterval(timer);
      onWorkEnd();
    }
  }, 1000);
}

function onWorkEnd() {
  sessions++;
  Store.setJSON('focusSessions', sessions);
  if (sessionCount()) sessionCount().textContent = `今日完成 ${sessions} 个 🍅`;
  tap([80, 50, 80]);

  // 切换到休息
  isRest    = true;
  remaining = REST_SEC;
  if (phaseLabel()) phaseLabel().textContent = '休息一下 ☕';
  startBtn().textContent = '休息中…';

  // AI 问感受
  const track = playlist[trackIdx];
  const song  = track ? `刚才听了《${track.name}》` : '';
  askAI(`我刚完成了一个番茄钟。${song}问问我这25分钟感觉怎么样，鼓励一下我。`);

  timer = setInterval(() => {
    remaining--;
    renderTime();
    if (remaining <= 0) {
      clearInterval(timer);
      onRestEnd();
    }
  }, 1000);
}

function onRestEnd() {
  isRunning = false;
  isRest    = false;
  remaining = WORK_SEC;
  renderTime();
  startBtn().textContent = '再来一个';
  startBtn().classList.remove('running');
  if (phaseLabel()) phaseLabel().textContent = '准备好了吗';
  tap([30, 20, 30, 20, 50]);
  askAI('休息结束了，问我要不要再来一个番茄钟，给我一点动力。');
}

function resetTimer() {
  clearInterval(timer);
  isRunning = false;
  isRest    = false;
  remaining = WORK_SEC;
  renderTime();
  startBtn().textContent = '开始专注';
  startBtn().classList.remove('running');
  if (phaseLabel()) phaseLabel().textContent = '准备好了吗';
  audio.pause();
  musicPlaying = false;
  playBtn().textContent = '▶';
  trackArt().classList.remove('spinning');
}

/* ---------- Jamendo 搜索 ---------- */
async function fetchJamendo(tags) {
  aiComment().textContent = '正在寻找音乐…';
  try {
    const url = `${JAMENDO_URL}/tracks/?client_id=${JAMENDO_ID}` +
                `&format=json&limit=20&tags=${tags}&include=musicinfo` +
                `&audioformat=mp32&boost=popularity_total&order=popularity_total`;
    const res  = await fetch(url);
    const data = await res.json();
    playlist  = (data.results || []).filter(t => t.audio);
    trackIdx  = 0;
    if (playlist.length) {
      renderTrack(playlist[0]);
      aiComment().textContent = `找到 ${playlist.length} 首，要开始了吗？`;
    } else {
      aiComment().textContent = '这个标签没找到歌，换一个试试？';
    }
  } catch {
    aiComment().textContent = '网络不太好，稍后再试。';
  }
}

/* ---------- 播放控制 ---------- */
function renderTrack(track) {
  if (!track) return;
  trackName().textContent   = track.name   || '未知歌曲';
  trackArtist().textContent = track.artist_name || 'Jamendo';
}

function playTrack(idx) {
  if (!playlist.length) return;
  idx = (idx + playlist.length) % playlist.length;
  trackIdx = idx;
  const track = playlist[idx];
  renderTrack(track);
  audio.src = track.audio;
  audio.play().then(() => {
    musicPlaying = true;
    playBtn().textContent = '⏸';
    trackArt().classList.add('spinning');
    // AI 说说这首歌的感受
    setTimeout(() => {
      askAI(`我们现在在听《${track.name}》by ${track.artist_name}。用一两句话说说这首歌给你什么感觉。`);
    }, 3000);
  }).catch(() => {
    // 播放失败跳下一首
    playTrack(idx + 1);
  });
}

function toggleMusic() {
  if (!playlist.length) {
    aiComment().textContent = '先选一个音乐频道吧 🎵';
    return;
  }
  if (musicPlaying) {
    audio.pause();
    musicPlaying = false;
    playBtn().textContent = '▶';
    trackArt().classList.remove('spinning');
  } else {
    if (audio.src) {
      audio.play();
      musicPlaying = true;
      playBtn().textContent = '⏸';
      trackArt().classList.add('spinning');
    } else {
      playTrack(trackIdx);
    }
  }
}

// 自动播放下一首
audio.addEventListener('ended', () => playTrack(trackIdx + 1));

// 进度条
audio.addEventListener('timeupdate', () => {
  const bar = document.querySelector('.music-progress-bar');
  if (bar && audio.duration) {
    bar.style.width = (audio.currentTime / audio.duration * 100) + '%';
  }
});

/* ---------- 渲染频道按钮 ---------- */
function renderChannels() {
  const row = channelRow();
  if (!row) return;
  row.innerHTML = '';
  CHANNELS.forEach((ch, i) => {
    const btn = el('button', 'channel-chip', ch.label);
    btn.addEventListener('click', () => {
      tap();
      document.querySelectorAll('.channel-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      fetchJamendo(ch.tags);
    });
    row.appendChild(btn);
  });
}

/* ---------- 绑定事件 ---------- */
function initFocus() {
  renderChannels();
  renderTime();
  if (sessionCount()) sessionCount().textContent = `今日完成 ${sessions} 个 🍅`;

  startBtn()?.addEventListener('click', () => {
    tap();
    if (!isRunning) startTimer();
  });

  document.getElementById('music-play-btn')?.addEventListener('click', () => {
    tap();
    toggleMusic();
  });

  document.getElementById('music-prev-btn')?.addEventListener('click', () => {
    tap();
    playTrack(trackIdx - 1);
  });

  document.getElementById('music-next-btn')?.addEventListener('click', () => {
    tap();
    playTrack(trackIdx + 1);
  });

  // 进度条容器初始化
  const playerCard = document.querySelector('.music-player-card');
  if (playerCard && !playerCard.querySelector('.music-progress-wrap')) {
    const wrap = el('div', 'music-progress-wrap');
    const bar  = el('div', 'music-progress-bar');
    wrap.appendChild(bar);
    // 插在 music-now-row 之后
    const nowRow = playerCard.querySelector('.music-now-row');
    if (nowRow) nowRow.insertAdjacentElement('afterend', wrap);
  }
}