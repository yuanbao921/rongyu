/* ============================================================
   wallpaper.js — 壁纸 & 时段主题
   功能：本地图片壁纸 / 时段自动配色 / 壁纸压缩存储
   ============================================================ */

/* ---------- 时段主题 ---------- */
const TIME_THEMES = [
  { hours: [0,  5],  bg: '#EDE6E1', rose: '#B87878' }, // 深夜
  { hours: [5,  9],  bg: '#F5EEE8', rose: '#C89080' }, // 清晨
  { hours: [9,  18], bg: '#F5EDE4', rose: '#C2827A' }, // 白天
  { hours: [18, 22], bg: '#EFE7E2', rose: '#C07070' }, // 傍晚
  { hours: [22, 24], bg: '#E8E0DC', rose: '#A87070' }, // 夜晚
];

function applyTimeTheme() {
  const h     = new Date().getHours();
  const theme = TIME_THEMES.find(t => h >= t.hours[0] && h < t.hours[1]) || TIME_THEMES[2];
  const root  = document.documentElement;
  // 有壁纸时不覆盖背景色（壁纸优先）
  if (!Store.get('wallpaper')) {
    root.style.setProperty('--bg', theme.bg);
  }
  root.style.setProperty('--rose', theme.rose);
}

/* ---------- 壁纸：压缩图片为 base64 ---------- */
/**
 * 将 File 对象压缩后转为 base64 字符串
 * 最大输出尺寸 1200px，质量 0.82，保证 localStorage 存得下
 */
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const MAX   = 1200;
        let   w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
          else       { w = Math.round(w * MAX / h); h = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width  = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ---------- 应用壁纸到 body ---------- */
function applyWallpaper(base64) {
  if (base64) {
    document.body.style.backgroundImage = `url(${base64})`;
    document.body.style.backgroundSize  = 'cover';
    document.body.style.backgroundPosition = 'center';
  } else {
    document.body.style.backgroundImage = '';
  }
}

/* ---------- 从 localStorage 恢复壁纸 ---------- */
function restoreWallpaper() {
  const saved = Store.get('wallpaper');
  if (saved) applyWallpaper(saved);
}

/* ---------- 选择本地壁纸（供外部调用）---------- */
function pickWallpaper() {
  // 复用隐藏的 file input
  let input = document.getElementById('wallpaper-input');
  if (!input) {
    input = document.createElement('input');
    input.type   = 'file';
    input.accept = 'image/*';
    input.id     = 'wallpaper-input';
    input.style.display = 'none';
    document.body.appendChild(input);
  }
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    try {
      const b64 = await compressImage(file);
      Store.set('wallpaper', b64);
      applyWallpaper(b64);
      tap([10, 20, 10]);
      addPush('🖼', '壁纸已更换');
    } catch (e) {
      addPush('⚠️', '图片太大或格式不支持，请换一张');
    }
    // 重置 input 以便下次选同一张也能触发
    input.value = '';
  };
  input.click();
}

/* ---------- 清除壁纸 ---------- */
function clearWallpaper() {
  Store.set('wallpaper', '');
  applyWallpaper(null);
  applyTimeTheme();
  tap();
  addPush('🌸', '已恢复默认背景');
}

/* ---------- 初始化 ---------- */
restoreWallpaper();
applyTimeTheme();
setInterval(applyTimeTheme, 60_000);