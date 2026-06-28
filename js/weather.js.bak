/* ============================================================
   weather.js — 天气模块
   调用 OpenWeatherMap API，渲染天气卡片
   ============================================================ */

/* ---------- API Key ---------- */
// ⚠️  生产环境建议通过后端代理，避免 Key 暴露在前端
const WEATHER_KEY = 'E65268553c35484ca11a5605ed254c9d';

/* ---------- 天气码 → Emoji 映射 ---------- */
function weatherEmoji(id) {
  if (id >= 200 && id < 300) return '⛈';
  if (id >= 300 && id < 400) return '🌦';
  if (id >= 500 && id < 600) return '🌧';
  if (id >= 600 && id < 700) return '🌨';
  if (id >= 700 && id < 800) return '🌫';
  if (id === 800)             return '☀️';
  if (id === 801)             return '🌤';
  if (id === 802)             return '⛅';
  if (id >= 803)              return '☁️';
  return '🌙';
}

/* ---------- 主请求函数 ---------- */
async function loadWeather() {
  const city = loadSettings().city || '上海';
  document.getElementById('w-city').textContent = '📍 ' + city;
  document.getElementById('w-temp').textContent = '--°';
  document.getElementById('w-desc').textContent = '加载中…';

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather` +
                `?q=${encodeURIComponent(city)}&appid=${WEATHER_KEY}` +
                `&units=metric&lang=zh_cn`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const data  = await res.json();
    const temp  = Math.round(data.main.temp);
    const desc  = data.weather[0].description;
    const emoji = weatherEmoji(data.weather[0].id);

    document.getElementById('w-icon').textContent = emoji;
    document.getElementById('w-temp').textContent = temp + '°';
    document.getElementById('w-desc').textContent = desc;

  } catch (err) {
    document.getElementById('w-temp').textContent = '--°';
    document.getElementById('w-desc').textContent = '天气暂不可用';
    console.warn('[Weather] 请求失败:', err.message);
  }
}