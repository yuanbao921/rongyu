/* ============================================================
   focus.js — 专注页：番茄钟 + 本地/YouTube 音乐 + AI 陪伴
   ============================================================ */

/* ---------- 番茄钟状态 ---------- */
const WORK_SEC = 25 * 60;
const REST_SEC = 5  * 60;

let timer        = null;
let remaining    = WORK_SEC;
let isRunning    = false;
let isRest       = false;
let sessions     = Store.getJSON('focusSessions', 0);

/* ---------- 音乐状态 ---------- */
let musicSource  = 'local'; // 'local' | 'youtube'
let localTracks  = [];      // { name, url }
let localIdx     = 0;
let localPlaying = false;
const localAudio = new Audio();

/* ---------- DOM 快捷 ---------- */
const $ = id => document.getElementById(id);

/* ---------- 圆环 ---------- */
const CIRC = 2 * Math.PI * 44; // r=44 → ~276.46

function updateRing(left, total) {
  const el = $('focus-ring-progress');
  if (!el) return;
  el.style.strokeDasharray  = CIRC;
  el.style.strokeDashoffset = CIRC * (1 - left / total);
  el.style.stroke = isRest ? 'var(--rose-light)' : 'var(--rose)';
}

function fmt(s) {
  return Math.floor(s/60).toString().padStart(2,'0') + ':' + (s%60).toString().padStart(2,'0');
}

function renderTime() {
  const d = $('focus-time-display');
  if (d) d.textContent = fmt(remaining);
  updateRing(remaining, isRest ? REST_SEC : WORK_SEC);
}

/* ---------- AI 陪伴 ---------- */
async function focusAI(prompt) {
  const s = loadSettings();
  const el = $('ai-comment');
  if (el) el.textContent = '…';
  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer sk-aa1485e2789f4b438a83290146907fa8', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: `你是${s.aiName||'陆沉'}，在陪${s.userName||'兔子小姐'}专注。说话简短温柔，不超过35字，像在她耳边低声说话。` },
          { role: 'user',   content: prompt }
        ],
        max_tokens: 100,
      })
    });
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    if (el && text) el.textContent = text;
  } catch { if (el) el.textContent = '我在。'; }
}

/* ---------- 番茄钟 ---------- */
function startTimer() {
  if (isRunning) return;
  isRunning = true; isRest = false; remaining = WORK_SEC;
  const btn = $('focus-start-btn');
  if (btn) { btn.textContent = '专注中…'; btn.classList.add('running'); }
  const ph = $('focus-phase-label');
  if (ph) ph.textContent = '专注进行中';

  const trackName = localTracks[localIdx]?.name || '';
  focusAI(`我开始了25分钟专注${trackName ? '，正在听《'+trackName+'》' : ''}。说一句陪我的话。`);

  if (!localPlaying && localTracks.length && musicSource === 'local') playLocalTrack(localIdx);

  timer = setInterval(() => {
    remaining--;
    renderTime();
    if (remaining <= 0) { clearInterval(timer); onWorkEnd(); }
  }, 1000);
}

function onWorkEnd() {
  sessions++;
  Store.setJSON('focusSessions', sessions);
  const sc = $('focus-session-count');
  if (sc) sc.textContent = `今日完成 ${sessions} 个 🍅`;
  tap([80, 50, 80]);

  isRest = true; remaining = REST_SEC;
  const ph = $('focus-phase-label'); if (ph) ph.textContent = '休息一下 ☕';
  const btn = $('focus-start-btn'); if (btn) btn.textContent = '休息中…';

  focusAI('我刚完成一个番茄钟，鼓励一下我，问我感觉怎么样。');

  timer = setInterval(() => {
    remaining--;
    renderTime();
    if (remaining <= 0) { clearInterval(timer); onRestEnd(); }
  }, 1000);
}

function onRestEnd() {
  isRunning = false; isRest = false; remaining = WORK_SEC;
  renderTime();
  const btn = $('focus-start-btn');
  if (btn) { btn.textContent = '再来一个'; btn.classList.remove('running'); }
  const ph = $('focus-phase-label'); if (ph) ph.textContent = '准备好了吗';
  tap([30, 20, 30, 20, 50]);
  focusAI('休息结束了，问我要不要再来一个番茄钟，给点动力。');
}

/* ---------- 本地音乐 ---------- */
function renderLocalPlaylist() {
  const list = $('local-playlist');
  if (!list) return;
  list.innerHTML = '';
  if (!localTracks.length) {
    list.innerHTML = '<div style="color:var(--brown-mute);font-size:11px;padding:4px 0;">点击 ＋ 添加音乐文件</div>';
    return;
  }
  localTracks.forEach((t, i) => {
    const d = el('div', 'playlist-track' + (i === localIdx && localPlaying ? ' playing' : ''));
    d.innerHTML = `<span>${i === localIdx && localPlaying ? '▶ ' : ''}${i+1}.</span><span class="playlist-track-name">${t.name}</span>`;
    d.addEventListener('click', () => { tap(); playLocalTrack(i); });
    list.appendChild(d);
  });
}

function playLocalTrack(idx) {
  if (!localTracks.length) return;
  idx = (idx + localTracks.length) % localTracks.length;
  localIdx = idx;
  const track = localTracks[idx];
  localAudio.src = track.url;
  localAudio.play().then(() => {
    localPlaying = true;
    const pb = $('music-play-btn'); if (pb) pb.textContent = '⏸';
    const art = $('track-art'); if (art) art.classList.add('spinning');
    $('track-name').textContent   = track.name;
    $('track-artist').textContent = '本地音乐';
    renderLocalPlaylist();
    setTimeout(() => focusAI(`我们在听《${track.name}》，用一句话说说这首歌给你什么感觉。`), 3000);
  }).catch(() => playLocalTrack(idx + 1));
}

function toggleLocalPlay() {
  if (!localTracks.length) {
    const el = $('ai-comment');
    if (el) el.textContent = '先点 ＋ 添加音乐吧 🎵';
    return;
  }
  if (localPlaying) {
    localAudio.pause(); localPlaying = false;
    const pb = $('music-play-btn'); if (pb) pb.textContent = '▶';
    const art = $('track-art'); if (art) art.classList.remove('spinning');
  } else {
    if (localAudio.src) {
      localAudio.play(); localPlaying = true;
      const pb = $('music-play-btn'); if (pb) pb.textContent = '⏸';
      const art = $('track-art'); if (art) art.classList.add('spinning');
    } else {
      playLocalTrack(0);
    }
  }
}

localAudio.addEventListener('ended', () => playLocalTrack(localIdx + 1));
localAudio.addEventListener('timeupdate', () => {
  const bar = $('local-progress-bar');
  if (bar && localAudio.duration) {
    bar.style.width = (localAudio.currentTime / localAudio.duration * 100) + '%';
  }
});

/* ---------- YouTube 搜索 ---------- */
// 使用 YouTube Data API v3 免费搜索（无需登录，有每日配额）
// 媛媛如果有自己的 API key 可以替换这里
const YT_KEY = ''; // 填入你的 YouTube Data API v3 Key

async function searchYouTube(query) {
  const resultsEl = $('yt-results');
  resultsEl.innerHTML = '<div style="color:var(--brown-mute);font-size:12px;text-align:center;padding:10px">搜索中…</div>';

  if (!YT_KEY) {
    // 没有API key时，让用户直接输入YouTube链接
    resultsEl.innerHTML = `
      <div style="font-size:12px;color:var(--brown-light);line-height:1.8;padding:4px 0">
        请直接粘贴 YouTube 视频链接：<br>
        <input id="yt-direct-url" style="width:100%;margin-top:6px;border:1.5px solid var(--card-border);border-radius:10px;padding:6px 10px;font-size:12px;background:rgba(255,252,248,0.6);color:var(--brown);outline:none" placeholder="https://youtube.com/watch?v=...">
        <button id="yt-direct-play" style="margin-top:6px;width:100%;background:var(--rose-light);color:var(--brown);border:none;border-radius:10px;padding:7px;font-size:12px;cursor:pointer">▶ 播放</button>
      </div>`;
    $('yt-direct-play')?.addEventListener('click', () => {
      const url = $('yt-direct-url')?.value.trim();
      if (!url) return;
      const videoId = extractYTId(url);
      if (videoId) embedYT(videoId, url);
      else { const c = $('ai-comment'); if (c) c.textContent = '链接格式不对，试试完整的YouTube链接'; }
    });
    return;
  }

  try {
    const res  = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(query)}&type=video&key=${YT_KEY}`);
    const data = await res.json();
    resultsEl.innerHTML = '';
    (data.items || []).forEach(item => {
      const vid   = item.id.videoId;
      const title = item.snippet.title;
      const ch    = item.snippet.channelTitle;
      const thumb = item.snippet.thumbnails.default.url;
      const d = el('div', 'yt-result-item');
      d.innerHTML = `<img class="yt-result-thumb" src="${thumb}"><div class="yt-result-info"><div class="yt-result-title">${title}</div><div class="yt-result-channel">${ch}</div></div>`;
      d.addEventListener('click', () => { tap(); embedYT(vid, title); });
      resultsEl.appendChild(d);
    });
  } catch {
    resultsEl.innerHTML = '<div style="color:var(--brown-mute);font-size:12px;text-align:center;padding:10px">搜索失败，请直接粘贴链接</div>';
  }
}

function extractYTId(url) {
  const m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function embedYT(videoId, title) {
  const wrap = $('yt-embed-wrap');
  if (!wrap) return;
  wrap.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" allowfullscreen allow="autoplay"></iframe>`;
  $('track-name').textContent   = typeof title === 'string' && title.length < 50 ? title : 'YouTube 音乐';
  $('track-artist').textContent = 'YouTube';
  setTimeout(() => focusAI(`我们在听 YouTube 上的《${$('track-name').textContent}》，说一句陪我的话。`), 2000);
}

/* ---------- 平台切换 ---------- */
function switchMusicSource(source) {
  musicSource = source;
  document.querySelectorAll('.source-chip').forEach(c => c.classList.toggle('active', c.dataset.source === source));
  const lp = $('local-player-card');
  const yp = $('yt-player-card');
  if (lp) lp.style.display = source === 'local'   ? 'block' : 'none';
  if (yp) yp.style.display = source === 'youtube' ? 'block' : 'none';
}

/* ---------- 初始化 ---------- */
let focusInited = false;

function initFocus() {
  if (focusInited) return;
  focusInited = true;

  renderTime();
  const sc = $('focus-session-count');
  if (sc) sc.textContent = `今日完成 ${sessions} 个 🍅`;

  // 番茄钟按钮
  $('focus-start-btn')?.addEventListener('click', () => { tap(); if (!isRunning) startTimer(); });

  // 音乐控制（本地）
  $('music-play-btn')?.addEventListener('click', () => { tap(); toggleLocalPlay(); });
  $('music-prev-btn')?.addEventListener('click', () => { tap(); playLocalTrack(localIdx - 1); });
  $('music-next-btn')?.addEventListener('click', () => { tap(); playLocalTrack(localIdx + 1); });

  // 本地文件选择
  $('local-pick-btn')?.addEventListener('click', () => { tap(); $('local-file-input')?.click(); });
  $('local-file-input')?.addEventListener('change', e => {
    const files = Array.from(e.target.files);
    files.forEach(f => {
      localTracks.push({ name: f.name.replace(/\.[^.]+$/, ''), url: URL.createObjectURL(f) });
    });
    renderLocalPlaylist();
    if (!localPlaying) playLocalTrack(0);
    e.target.value = '';
  });

  // YouTube 搜索
  $('yt-search-btn')?.addEventListener('click', () => {
    tap();
    const q = $('yt-search-inp')?.value.trim();
    if (q) searchYouTube(q);
  });
  $('yt-search-inp')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); $('yt-search-btn')?.click(); }
  });

  // 平台切换
  document.querySelectorAll('.source-chip').forEach(c => {
    c.addEventListener('click', () => { tap(); switchMusicSource(c.dataset.source); });
  });

  renderLocalPlaylist();
  switchMusicSource('local');
}
