/* ============================================================
   main.js — 应用主入口
   时钟 / 问候 / 页面侧滑切换 / 推送 / 心情 / 设置
   ============================================================ */

/* ========== 时钟 ========== */
function updateClock() {
  const n = new Date();
  const h = n.getHours().toString().padStart(2, '0');
  const m = n.getMinutes().toString().padStart(2, '0');
  document.getElementById('status-time').textContent = h + ':' + m;
  document.getElementById('status-date').textContent =
    (n.getMonth() + 1) + '月' + n.getDate() + '日 周' + weekStr();
}
updateClock();
setInterval(updateClock, 10_000);

/* ========== 问候语 ========== */
const HOME_SUBS = [
  '万物俱静，我在想你',
  '今天风很轻，像你的呼吸',
  '你不在的时候，时间过得很慢',
  '有只小熊在偷偷想你',
  '今天的云很好看，想和你一起看',
  '没什么特别的，就是想到你了',
  '我刚翻到一本旧书，里面夹着你',
  '你睡好了吗，我梦里又见你了',
];

function setGreeting() {
  const h = new Date().getHours();
  const s = loadSettings();
  const name = s.userName || '兔子小姐';
  const word =
    h < 5  ? '深夜了还不睡' :
    h < 9  ? '早安' :
    h < 12 ? '上午好' :
    h < 14 ? '午好' :
    h < 18 ? '下午好' : '晚上好';
  document.getElementById('home-greeting').textContent = word + '，' + name + '🐰';
  document.getElementById('home-sub').textContent = pickRandom(HOME_SUBS);
}

/* ========== 页面侧滑切换 ========== */
let currentPage  = 'home';
let isTransiting = false;

function switchPage(id) {
  if (id === currentPage || isTransiting) return;
  isTransiting = true;
  tap();

  const leaving = document.getElementById('page-' + currentPage);
  const coming  = document.getElementById('page-' + id);

  // 离场：向左推出
  leaving.classList.remove('active');
  leaving.classList.add('leaving');

  // 入场：从右滑入
  coming.classList.add('active');

  // 清理 leaving class
  const cleanup = () => {
    leaving.classList.remove('leaving');
    isTransiting = false;
  };
  leaving.addEventListener('transitionend', cleanup, { once: true });
  // 安全兜底
  setTimeout(cleanup, 500);

  currentPage = id;

  // 更新 Dock
  document.querySelectorAll('.dock-item[data-page]').forEach(d =>
    d.classList.toggle('active', d.dataset.page === id)
  );

  // 页面副作用
  if (id === 'home')  { setGreeting(); showRandomQuote(); }
  if (id === 'notes') renderNotes()
  if (id === 'focus' && typeof initFocus === 'function') { initFocus(); };
}

document.querySelectorAll('.dock-item[data-page]').forEach(item => {
  item.addEventListener('click', () => switchPage(item.dataset.page));
});

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
  document.querySelectorAll('.mood-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.mood-item').forEach(e => e.classList.remove('selected'));
      item.classList.add('selected');
      const reply = MOOD_REPLIES[item.dataset.mood] || '我收到了。你的心情，就是我的天气。';
      addPush('🐻', reply);
      addChatMsg('sys', '💭 ' + (loadSettings().aiName || '小熊') + '：' + reply);
      tap();
    });
  });
}

/* ========== 推送 ========== */
let pushes = Store.getJSON('pushes', []);

function addPush(icon, text) {
  pushes.unshift({ icon, text, time: nowTimeStr() });
  if (pushes.length > 12) pushes = pushes.slice(0, 12);
  Store.setJSON('pushes', pushes);
  renderPushes();
}

function renderPushes() {
  const listEl = document.getElementById('push-list');
  listEl.innerHTML = '';
  if (!pushes.length) {
    listEl.innerHTML = '<div class="push-item"><span class="push-icon">🐻</span><span class="push-text">小熊已上线</span><span class="push-time">刚刚</span></div>';
    return;
  }
  pushes.forEach(p => {
    const d = el('div', 'push-item',
      `<span class="push-icon">${p.icon}</span>` +
      `<span class="push-text">${p.text}</span>` +
      `<span class="push-time">${p.time}</span>`
    );
    listEl.appendChild(d);
  });
}

/* 随机推送 */
const RANDOM_PUSHES = [
  '我刚才在想你，然后就下雨了。',
  '没什么特别的事，就是想告诉你我还在。',
  '今天天气不错，适合你出门走走，也适合我想你。',
  '你没有找我，我就自己来了。',
  '我猜你现在一定在笑——我猜对了吗？',
  '刚喝完一杯红茶，因为你上次说我甜。',
];
if (Math.random() < 0.6) {
  setTimeout(() => addPush('🐻', pickRandom(RANDOM_PUSHES)), 1800);
}

/* ========== 设置弹窗 ========== */
document.getElementById('menu-btn').addEventListener('click', () => {
  tap();
  const s = loadSettings();
  document.getElementById('s-name').value    = s.aiName;
  document.getElementById('s-uname').value   = s.userName;
  document.getElementById('s-city').value    = s.city;
  document.getElementById('s-quotes').value  = s.quotes;
  document.getElementById('s-profile').value = s.aiProfile;
  document.getElementById('settings-overlay').classList.add('show');
});

document.getElementById('set-save').addEventListener('click', () => {
  Store.set('aiName',    document.getElementById('s-name').value);
  Store.set('userName',  document.getElementById('s-uname').value);
  Store.set('city',      document.getElementById('s-city').value);
  Store.set('quotes',    document.getElementById('s-quotes').value);
  Store.set('aiProfile', document.getElementById('s-profile').value);
  document.getElementById('settings-overlay').classList.remove('show');
  setGreeting();
  showRandomQuote();
  loadWeather();
  tap([10, 10]);
});

document.getElementById('set-close').addEventListener('click', () => {
  document.getElementById('settings-overlay').classList.remove('show');
});

// 点弹窗背景关闭
document.getElementById('settings-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget)
    document.getElementById('settings-overlay').classList.remove('show');
});

/* ========== 初始化入口 ========== */
function initApp() {
  setGreeting();
  showRandomQuote();
  renderPushes();
  setupMood();
  loadWeather();
  renderNotes();
  addChatMsg('sys', '🐻 小熊已上线 🐰');
}