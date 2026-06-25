/* ============================================================
   utils.js — 通用工具函数
   被其他所有模块引用，最先加载
   ============================================================ */

/* ---------- 震动反馈 ---------- */
/**
 * 触发设备震动
 * @param {number|number[]} pattern - 毫秒数或模式数组，如 [50,30,50]
 */
function tap(pattern = 8) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch (e) { /* 静默失败 */ }
}

/* ---------- localStorage 封装 ---------- */
const Store = {
  get(key, fallback = null) {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? val : fallback;
    } catch { return fallback; }
  },
  getJSON(key, fallback = null) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch { /* 存储满了 */ }
  },
  setJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { }
  },
};

/* ---------- 加载全局设置 ---------- */
function loadSettings() {
  return {
    aiName:   Store.get('aiName',    '陆沉'),
    userName: Store.get('userName',  '兔子小姐'),
    city:     Store.get('city',      '上海'),
    quotes:   Store.get('quotes',    ''),   // 空字符串 → 使用默认库
    aiProfile: Store.get('aiProfile', ''),
  };
}

/* ---------- 时间工具 ---------- */
/**
 * 返回当前时间字符串，如 "14:05"
 */
function nowTimeStr() {
  const n = new Date();
  return n.getHours().toString().padStart(2, '0') + ':' +
         n.getMinutes().toString().padStart(2, '0');
}

/**
 * 返回便签用时间标记，如 "6月23日 14:05"
 */
function nowLabelStr() {
  const n = new Date();
  return (n.getMonth() + 1) + '月' + n.getDate() + '日 ' + nowTimeStr();
}

/**
 * 返回当前星期汉字
 */
function weekStr() {
  return ['日','一','二','三','四','五','六'][new Date().getDay()];
}

/* ---------- 随机取数组元素 ---------- */
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ---------- 创建 DOM 元素的快捷函数 ---------- */
/**
 * @param {string} tag
 * @param {string} className
 * @param {string} [html]
 * @returns {HTMLElement}
 */
function el(tag, className, html = '') {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (html) e.innerHTML = html;
  return e;
}