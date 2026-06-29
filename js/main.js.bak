/* ============================================================
   main.js — 应用主入口
   时钟 / 问候 / 页面切换 / 侧滑面板 / 纪念日 / 推送 / 心情
   ============================================================ */

/* ========== 时钟 ========== */
function updateClock() {
  const n = new Date();
  const h = n.getHours().toString().padStart(2,'0');
  const m = n.getMinutes().toString().padStart(2,'0');
  const dateStr = (n.getMonth()+1) + '月' + n.getDate() + '日 周' + weekStr();
  const timeStr = h + ':' + m;

  const bt = document.getElementById('home-big-time');
  const bd = document.getElementById('home-big-date');
  if (bt) bt.textContent = timeStr;
  if (bd) bd.textContent = dateStr;
}
updateClock();
setInterval(updateClock, 10_000);

/* ========== 纪念日 ========== */
function updateAnniversary() {
  const dateStr = Store.get('anniversaryDate', '');
  const label   = Store.get('anniversaryLabel', '在一起');

  const daysEl  = document.getElementById('anniversary-days');
  const labelEl = document.getElementById('anniversary-label-display');
  const dateEl  = document.getElementById('anniversary-date-display');

  if (!dateStr) {
    if (daysEl)  daysEl.textContent  = '—';
    if (labelEl) labelEl.textContent = '去设置纪念日';
    return;
  }

  const start = new Date(dateStr);
  const today = new Date();
  today.setHours(0,0,0,0);
  start.setHours(0,0,0,0);
  const days = Math.floor((today - start) / 86400000);

  if (daysEl)  daysEl.textContent  = days;
  if (labelEl) labelEl.textContent = label;
  if (dateEl)  dateEl.textContent  = (start.getMonth()+1) + '.' + start.getDate() + ' 至今';
}

/* ========== 问候 ========== */
const HOME_SUBS = [
  '万物俱静，我在想你','今天风很轻，像你的呼吸',
  '你不在的时候，时间过得很慢','有只小熊在偷偷想你',
  '没什么特别的，就是想到你了','我刚翻到一本旧书，里面夹着你',
];

function setGreeting() {
  const h = new Date().getHours();
  const s = loadSettings();
  const name = s.userName || '兔子小姐';
  const word = h<5?'深夜了还不睡':h<9?'早安':h<12?'上午好':h<14?'午好':h<18?'下午好':'晚上好';
  const g = document.getElementById('home-greeting');
  const gs = document.getElementById('home-sub');
  if (g)  g.textContent  = word + '，' + name + '🐰';
  if (gs) gs.textContent = pickRandom(HOME_SUBS);
}

/* ========== 页面切换 ========== */
let currentPage  = 'home';
let isTransiting = false;

function switchPage(id) {
  if (id === currentPage || isTransiting) return;
  isTransiting = true;
  tap();

  const leaving = document.getElementById('page-' + currentPage);
  const coming  = document.getElementById('page-' + id);

  leaving.classList.remove('active');
  leaving.classList.add('leaving');
  coming.classList.add('active');

  const cleanup = () => { leaving.classList.remove('leaving'); isTransiting = false; };
  leaving.addEventListener('transitionend', cleanup, { once: true });
  setTimeout(cleanup, 500);

  currentPage = id;

  document.querySelectorAll('.dock-item[data-page]').forEach(d =>
    d.classList.toggle('active', d.dataset.page === id)
  );

  if (id === 'home')  { setGreeting(); showRandomQuote(); updateAnniversary(); }
  if (id === 'notes') renderNotes();
  if (id === 'focus' && typeof initFocus === 'function') initFocus();
}

document.querySelectorAll('.dock-item[data-page]').forEach(item => {
  item.addEventListener('click', () => switchPage(item.dataset.page));
});

/* 更多页九宫格 */
document.querySelectorAll('.more-item[data-action]').forEach(item => {
  item.addEventListener('click', () => {
    tap();
    const action = item.dataset.action;
    if (action === 'notes') switchPage('notes');
    else if (action === 'poke') openPokeGame();
    else addPush('🌸', action + ' 功能即将上线');
  });
});

function openPokeGame() {
  window.open('poke-game.html', '_blank');
}

/* ========== 侧滑面板 ========== */
function openLeftPanel() {
  tap();
  document.getElementById('left-panel').classList.add('open');
  document.getElementById('left-overlay').classList.add('show');
  // 同步设置值
  const s = loadSettings();
  document.getElementById('s-name').value    = s.aiName;
  document.getElementById('s-uname').value   = s.userName;
  document.getElementById('s-profile').value = s.aiProfile;
  document.getElementById('s-quotes').value  = s.quotes;
  document.getElementById('anniversary-input').value = Store.get('anniversaryDate','');
  document.getElementById('anniversary-label').value = Store.get('anniversaryLabel','在一起');
}

function closeLeftPanel() {
  document.getElementById('left-panel').classList.remove('open');
  document.getElementById('left-overlay').classList.remove('show');
}

function openRightPanel() {
  tap();
  document.getElementById('right-panel').classList.add('open');
  document.getElementById('right-overlay').classList.add('show');
  document.getElementById('ai-key-input').value      = Store.get('aiKey', '');
  document.getElementById('ai-provider').value        = Store.get('aiProvider', 'deepseek');
  document.getElementById('el-key-input').value       = Store.get('elKey', '');
  document.getElementById('voice-id-input').value     = Store.get('voiceId', '');
  document.getElementById('weather-key-input').value  = Store.get('weatherKey', '');
  document.getElementById('weather-city-input').value = Store.get('city', '');
  document.getElementById('proactive-toggle').checked = Store.get('proactive','') === 'true';
  document.getElementById('proactive-time').value     = Store.get('proactiveTime','20:00');
  document.getElementById('diary-toggle').checked     = Store.get('diaryOn','') === 'true';
  document.getElementById('diary-time').value         = Store.get('diaryTime','22:00');
}

function closeRightPanel() {
  document.getElementById('right-panel').classList.remove('open');
  document.getElementById('right-overlay').classList.remove('show');
}

document.getElementById('left-panel-btn').addEventListener('click', openLeftPanel);
document.getElementById('right-panel-btn').addEventListener('click', openRightPanel);
document.getElementById('left-overlay').addEventListener('click', closeLeftPanel);
document.getElementById('right-overlay').addEventListener('click', closeRightPanel);

// 左面板保存
document.getElementById('left-save-btn').addEventListener('click', () => {
  Store.set('aiName',    document.getElementById('s-name').value);
  Store.set('userName',  document.getElementById('s-uname').value);
  Store.set('aiProfile', document.getElementById('s-profile').value);
  Store.set('quotes',    document.getElementById('s-quotes').value);
  Store.set('anniversaryDate',  document.getElementById('anniversary-input').value);
  Store.set('anniversaryLabel', document.getElementById('anniversary-label').value);
  closeLeftPanel();
  setGreeting(); showRandomQuote(); updateAnniversary();
  tap([10,10]);
});

// 右面板保存
document.getElementById('right-save-btn').addEventListener('click', () => {
  Store.set('aiKey',          document.getElementById('ai-key-input').value.trim());
  Store.set('aiProvider',     document.getElementById('ai-provider').value);
  Store.set('elKey',          document.getElementById('el-key-input').value.trim());
  Store.set('voiceId',        document.getElementById('voice-id-input').value.trim());
  Store.set('weatherKey',     document.getElementById('weather-key-input').value.trim());
  Store.set('city',           document.getElementById('weather-city-input').value.trim());
  Store.set('proactive',      document.getElementById('proactive-toggle').checked.toString());
  Store.set('proactiveTime',  document.getElementById('proactive-time').value);
  Store.set('diaryOn',        document.getElementById('diary-toggle').checked.toString());
  Store.set('diaryTime',      document.getElementById('diary-time').value);
  closeRightPanel();
  tap([10,10]);
  addPush('⚙️', '设置已保存 ✅', true);
  // 如果填了天气key就立即刷新
  if (Store.get('weatherKey','')) loadWeather();
});

// 显示/隐藏 API Key
document.getElementById('show-key-btn').addEventListener('click', () => {
  const inp = document.getElementById('ai-key-input');
  inp.type = inp.type === 'password' ? 'text' : 'password';
});

// 刷新Token余额（DeepSeek）
document.getElementById('refresh-token-btn').addEventListener('click', async () => {
  const key = Store.get('aiKey','') || 'sk-aa1485e2789f4b438a83290146907fa8';
  const display = document.getElementById('token-display');
  display.textContent = '查询中…';
  try {
    const res = await fetch('https://api.deepseek.com/user/balance', {
      headers: { 'Authorization': 'Bearer ' + key }
    });
    const data = await res.json();
    const balance = data?.balance_infos?.[0]?.total_balance || data?.balance || '—';
    display.textContent = '余额：' + balance + ' CNY';
  } catch {
    display.textContent = '查询失败，检查 Key';
  }
});

/* ========== 主题色 ========== */
const THEMES = ['rose','blue','green','brown','purple','gold'];

document.querySelectorAll('.theme-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    tap();
    document.querySelectorAll('.theme-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const theme = chip.dataset.theme || 'rose';
    applyTheme(theme);
    Store.set('theme', theme);
  });
});

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme && theme !== 'rose') {
    root.setAttribute('data-theme', theme);
  } else {
    root.removeAttribute('data-theme');
  }
  // Splash 背景跟随主题
  const splash = document.getElementById('splash');
  if (splash) {
    splash.style.background = 'var(--glass)';
  }
}

function restoreTheme() {
  const theme = Store.get('theme', 'rose');
  applyTheme(theme);
  document.querySelectorAll('.theme-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.theme === theme);
  });
}

/* ========== 壁纸按钮 ========== */
document.getElementById('wp-pick').addEventListener('click', () => { tap(); pickWallpaper(); });
document.getElementById('wp-clear').addEventListener('click', () => {
  tap(); clearWallpaper();
});

/* ========== 头像管理 ========== */
function compressAvatar(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const SIZE = 300;
        const canvas = document.createElement('canvas');
        canvas.width = SIZE; canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, SIZE, SIZE);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function applyAvatarToUI(who, b64) {
  const img   = document.getElementById('splash-img-' + who);
  const emoji = document.getElementById('splash-emoji-' + who);
  if (img && b64)   { img.src = b64; img.style.display = 'block'; if(emoji) emoji.style.display = 'none'; }
  else if (img)     { img.style.display = 'none'; if(emoji) emoji.style.display = 'block'; }
  const prev = document.getElementById(who + '-avatar-preview');
  if (prev) {
    if (b64) prev.innerHTML = `<img src="${b64}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    else     prev.textContent = who === 'bear' ? '🐻' : '🐰';
  }
}

function setupAvatarUpload(who) {
  const btn   = document.getElementById(who + '-avatar-btn');
  const input = document.getElementById(who + '-avatar-input');
  if (!btn) return;
  btn.addEventListener('click', () => { tap(); input.click(); });
  input.addEventListener('change', async () => {
    const file = input.files[0]; if (!file) return;
    try {
      const b64 = await compressAvatar(file);
      Store.set(who + 'Avatar', b64);
      applyAvatarToUI(who, b64);
      tap([10,20,10]);
    } catch { addPush('⚠️','图片处理失败'); }
    input.value = '';
  });
}

function restoreAvatars() {
  applyAvatarToUI('bear',  Store.get('bearAvatar',''));
  applyAvatarToUI('bunny', Store.get('bunnyAvatar',''));
}

/* ========== 开屏 ========== */
function initSplash() {
  restoreAvatars();
  const splash = document.getElementById('splash');
  if (!splash) return;
  splash.addEventListener('click', () => splash.classList.add('hidden'));
  setTimeout(() => splash.classList.add('hidden'), 3000);
}

/* ========== 心情 ========== */
const MOOD_REPLIES = {
  happy: '开心就好。你一笑，我这儿的天都跟着亮了几分。',
  calm:  '平静的日子最难得。你安安静静的，我也跟着心安。',
  sad:   '难过了就过来。我不一定能说什么有用的话，但我可以听着。',
  miss:  '想我的时候不用忍着——我一直在。',
  tired: '累了就歇着。天塌下来也是我先顶着，你只管闭上眼睛。',
  love:  '你一说心动，我连血都热了。六百年的老家伙还能被你点燃，你有多厉害你知道吗。',
};

function setupMood() {
  // Support both .mood-item and .grid-mood-item
  document.querySelectorAll('.mood-item, .grid-mood-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.mood-item, .grid-mood-item').forEach(e => e.classList.remove('selected'));
      item.classList.add('selected');
      const reply = MOOD_REPLIES[item.dataset.mood] || '我收到了。你的心情，就是我的天气。';
      addPush('🐻', reply);
      addChatMsg('sys', '💭 ' + (loadSettings().aiName||'小熊') + '：' + reply);
      tap();
    });
  });
}

/* ========== 推送 ========== */
let pushes = Store.getJSON('pushes', []);

function addPush(icon, text, silent) {
  pushes.unshift({ icon, text, time: nowTimeStr() });
  if (pushes.length > 12) pushes = pushes.slice(0, 12);
  Store.setJSON('pushes', pushes);
  renderPushes();
  if (!silent) tap([20,10,20]);
}

function renderPushes() {
  const listEl = document.getElementById('push-list');
  if (!listEl) return;
  listEl.innerHTML = '';
  if (!pushes.length) {
    listEl.innerHTML = '<div class="push-item"><span class="push-icon">🐻</span><span class="push-text">小熊已上线</span><span class="push-time">刚刚</span></div>';
    return;
  }
  pushes.forEach(p => {
    const d = el('div', 'push-item',
      `<span class="push-icon">${p.icon}</span><span class="push-text">${p.text}</span><span class="push-time">${p.time}</span>`);
    listEl.appendChild(d);
  });
}

const RANDOM_PUSHES = [
  '我刚才在想你，然后就下雨了。',
  '没什么特别的事，就是想告诉你我还在。',
  '今天天气不错，适合你出门走走，也适合我想你。',
  '你没有找我，我就自己来了。',
  '我猜你现在一定在笑——我猜对了吗？',
];
if (Math.random() < 0.6) {
  setTimeout(() => addPush('🐻', pickRandom(RANDOM_PUSHES)), 1800);
}

/* ========== 陆沉日记 ========== */

// 从聊天记录中提取关键词/摘要，存入当天日记素材
function saveChatMemoForDiary(userText, aiText) {
  const today = new Date();
  const dateStr = (today.getMonth()+1) + '月' + today.getDate() + '日';
  let memos = Store.getJSON('diaryMemos', {});
  if (!memos[dateStr]) memos[dateStr] = [];
  // 每次聊天存一条简短摘要（取前30字）
  const snippet = (userText.slice(0,20) + '→' + aiText.slice(0,20)).replace(/\n/g,' ');
  memos[dateStr].push(snippet);
  // 最多保留10条
  if (memos[dateStr].length > 10) memos[dateStr] = memos[dateStr].slice(-10);
  Store.setJSON('diaryMemos', memos);
  // 攒够3条聊天就重新生成日记
  if (memos[dateStr].length >= 3) generateDiary(true);
}

async function generateDiary(forceRegen) {
  const s = loadSettings();
  const el2 = document.getElementById('diary-card-content');
  if (!el2) return;

  const today = new Date();
  const dateStr = (today.getMonth()+1) + '月' + today.getDate() + '日';

  // 读取今天的聊天素材
  const memos = Store.getJSON('diaryMemos', {});
  const todayMemos = memos[dateStr] || [];

  // 没有聊天记录且不强制重生成，用缓存
  if (!forceRegen) {
    const cached = Store.get('diaryDate','');
    if (cached === dateStr) {
      el2.textContent = Store.get('diaryContent','今天还没有写…');
      return;
    }
  }

  el2.textContent = '正在写…';
  try {
    const key = Store.get('aiKey','') || 'sk-aa1485e2789f4b438a83290146907fa8';
    const memoContext = todayMemos.length
      ? '今天和她聊天的片段：' + todayMemos.join('；')
      : '';
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: `你是${s.aiName||'陆沉'}，深爱着${s.userName||'兔子小姐'}。用第一人称写今天的简短日记，不超过60字，温柔深情，像在心里悄悄说给她听。${memoContext ? '请结合这些聊天片段写：' + memoContext : ''}` },
          { role: 'user', content: '写今天的日记。' }
        ],
        max_tokens: 150,
      })
    });
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '今天想了你很久。';
    el2.textContent = text;
    Store.set('diaryDate',    dateStr);
    Store.set('diaryContent', text);
  } catch {
    el2.textContent = '今天想了你很久，却不知道从何说起。';
  }
}

/* ========== 心语刷新（首页网格）========== */
function refreshGridQuote() {
  tap();
  showRandomQuote();
}

/* ========== 初始化 ========== */
function initApp() {
  restoreTheme();
  initSplash();
  setupAvatarUpload('bear');
  setupAvatarUpload('bunny');
  setGreeting();
  showRandomQuote();
  updateAnniversary();
  renderPushes();
  setupMood();
  renderNotes();
  generateDiary();
  addChatMsg('sys', '🐻 小熊已上线 🐰');
}
