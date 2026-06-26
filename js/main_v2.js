/* ============================================================
   main_v2.js — 新版入口（4 Tab + 侧滑抽屉 + 首页卡片）
   独立于旧版 main.js，互不干扰
   ============================================================ */

(function() {
  'use strict';

  // -------- 等待 DOM 加载 --------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {

    // ========== 1. 开屏页 ==========
    initSplash();

    // ========== 2. Tab 切换 ==========
    initTabs();

    // ========== 3. 侧滑抽屉 ==========
    initSidebars();

    // ========== 4. 首页卡片 ==========
    updateMemorialDay();
    updateQuote();
    updateDiaryPreview();

    // ========== 5. 主题色恢复 ==========
    restoreThemeColor();

    // ========== 6. 头像上传（复用旧版逻辑） ==========
    if (typeof setupAvatarUpload === 'function') {
      setupAvatarUpload('bear');
      setupAvatarUpload('bunny');
    }

    // ========== 7. 壁纸（复用旧版逻辑） ==========
    initWallpaperUI();

    // ========== 8. 日记展开 ==========
    initDiaryOverlay();

    // ========== 9. 纪念日修改 ==========
    initAnniversaryPicker();

    // ========== 10. Service Worker ==========
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(function() {});
    }

    console.log('🌸 绒语 v2 已启动');
  }

  // ============================================================
  //  1. 开屏页
  // ============================================================
// ============================================================
//  1. 开屏页（更稳健）
// ============================================================
function initSplash() {
  var splash = document.getElementById('splash');
  if (!splash) {
    console.warn('开屏页元素不存在');
    return;
  }

  // 恢复头像（如果函数存在的话）
  if (typeof restoreAvatars === 'function') {
    try {
      restoreAvatars();
    } catch (e) {
      console.warn('restoreAvatars 执行失败:', e);
    }
  }

  // 点击跳过
  splash.addEventListener('click', function() {
    splash.classList.add('hidden');
  });

  // 3秒后自动消失
  setTimeout(function() {
    splash.classList.add('hidden');
  }, 3000);

  console.log('开屏页已初始化');
}

  // ============================================================
  //  2. Tab 切换（4 个）
  // ============================================================
  function initTabs() {
    var tabs = ['home', 'focus', 'chat', 'more'];
    var navItems = document.querySelectorAll('.nav-item');
    var pages = {
      home: document.getElementById('page-home'),
      focus: document.getElementById('page-focus'),
      chat: document.getElementById('page-chat'),
      more: document.getElementById('page-more')
    };
    var headerTitle = document.getElementById('header-title');
    var headerEn = document.getElementById('header-en');

    function switchTab(tabId) {
      // 隐藏所有页面
      for (var key in pages) {
        if (pages[key]) pages[key].classList.remove('active');
      }
      // 显示目标页面
      if (pages[tabId]) pages[tabId].classList.add('active');
      // 更新导航
      navItems.forEach(function(item) {
        item.classList.toggle('active', item.dataset.tab === tabId);
      });
      // 更新标题
      var titles = {
        home: '绒语',
        focus: '专注',
        chat: '聊天',
        more: '更多'
      };
      if (headerTitle) headerTitle.textContent = titles[tabId] || '绒语';
      if (headerEn) headerEn.textContent = tabId === 'home' ? 'Rong Yu' : '';

      // 页面副作用
      if (tabId === 'home') {
        updateMemorialDay();
        updateQuote();
        updateDiaryPreview();
      }
      if (tabId === 'focus' && typeof initFocus === 'function') {
        initFocus();
      }
      if (tabId === 'chat' && typeof renderChat === 'function') {
        renderChat();
      }
    }

    navItems.forEach(function(item) {
      item.addEventListener('click', function() {
        switchTab(this.dataset.tab);
      });
    });

    // 暴露切换函数给其他模块
    window.switchTab = switchTab;
  }

  // ============================================================
  //  3. 侧滑抽屉
  // ============================================================
  function initSidebars() {
    var leftBtn = document.getElementById('sidebar-left-btn');
    var rightBtn = document.getElementById('sidebar-right-btn');
    var leftClose = document.getElementById('sidebar-left-close');
    var rightClose = document.getElementById('sidebar-right-close');
    var left = document.getElementById('sidebar-left');
    var right = document.getElementById('sidebar-right');

    function toggleSidebar(el) {
      var isOpen = el.classList.contains('open');
      // 关闭所有
      document.querySelectorAll('.sidebar').forEach(function(s) {
        s.classList.remove('open');
      });
      if (!isOpen) {
        el.classList.add('open');
      }
    }

    if (leftBtn && left) {
      leftBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleSidebar(left);
      });
    }
    if (rightBtn && right) {
      rightBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleSidebar(right);
      });
    }
    if (leftClose && left) {
      leftClose.addEventListener('click', function() {
        left.classList.remove('open');
      });
    }
    if (rightClose && right) {
      rightClose.addEventListener('click', function() {
        right.classList.remove('open');
      });
    }

    // 点击背景关闭
    document.addEventListener('click', function(e) {
      var allOpen = document.querySelectorAll('.sidebar.open');
      allOpen.forEach(function(s) {
        var btn = s.id === 'sidebar-left' ? leftBtn : rightBtn;
        if (!s.contains(e.target) && btn && !btn.contains(e.target)) {
          s.classList.remove('open');
        }
      });
    });
  }

  // ============================================================
  //  4. 纪念日
  // ============================================================
  function updateMemorialDay() {
    var dateInput = document.getElementById('anniversary-date');
    var daysEl = document.getElementById('memorial-days');
    var dateEl = document.getElementById('memorial-date');

    if (!dateInput || !daysEl || !dateEl) return;

    var saved = Store.get('anniversaryDate');
    if (saved) {
      dateInput.value = saved;
    }

    var start = new Date(dateInput.value + 'T00:00:00');
    if (isNaN(start.getTime())) {
      start = new Date('2024-06-01T00:00:00');
      dateInput.value = '2024-06-01';
    }

    var now = new Date();
    var diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    var days = diff >= 0 ? diff : 0;

    daysEl.textContent = '第 ' + (days + 1) + ' 天';
    dateEl.textContent = formatDate(start);
  }

  function formatDate(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '年' + m + '月' + d + '日';
  }

  function initAnniversaryPicker() {
    var dateInput = document.getElementById('anniversary-date');
    if (!dateInput) return;

    dateInput.addEventListener('change', function() {
      Store.set('anniversaryDate', this.value);
      updateMemorialDay();
    });
  }

  // ============================================================
  //  5. 心语
  // ============================================================
  var QUOTES_KEY = 'user_quotes';

  function getQuotes() {
    var saved = Store.get(QUOTES_KEY);
    var list = [];
    if (saved) {
      list = saved.split('\n').filter(function(s) { return s.trim().length > 0; });
    }
    if (list.length === 0) {
      list = [
        '「你是我在长夜尽头看见的第一缕光。」',
        '「我在万物寂静处，听见你的名字。」',
        '「风止于秋水，我止于你。」',
        '「所有的温柔都与你有关。」'
      ];
    }
    return list;
  }

  function updateQuote() {
    var el = document.getElementById('quote-text');
    var src = document.getElementById('quote-source');
    if (!el) return;

    var quotes = getQuotes();
    var q = quotes[Math.floor(Math.random() * quotes.length)] || '「你是我在长夜尽头看见的第一缕光。」';
    el.textContent = q;
    if (src) src.textContent = '— 小熊';
  }

  // ============================================================
  //  6. 日记预览
  // ============================================================
  function updateDiaryPreview() {
    var previewEl = document.getElementById('diary-preview');
    var dateEl = document.getElementById('diary-date');
    if (!previewEl) return;

    var diary = Store.getJSON('diary_entries', []);
    if (diary.length > 0) {
      var latest = diary[diary.length - 1];
      previewEl.textContent = latest.content || '今天还没有日记…';
      if (dateEl) {
        var d = new Date(latest.date);
        dateEl.textContent = d.getFullYear() + '年' + (d.getMonth()+1) + '月' + d.getDate() + '日';
      }
    } else {
      previewEl.textContent = '今天还没有日记…';
      if (dateEl) dateEl.textContent = '';
    }
  }

  // ============================================================
  //  7. 日记展开弹窗
  // ============================================================
  function initDiaryOverlay() {
    var card = document.getElementById('diary-card');
    var overlay = document.getElementById('diary-overlay');
    var close = document.getElementById('diary-close');
    var body = document.getElementById('diary-body');
    var dateEl = document.getElementById('diary-full-date');
    var prevBtn = document.getElementById('diary-prev');
    var nextBtn = document.getElementById('diary-next');

    if (!card || !overlay) return;

    var currentIndex = 0;
    var entries = [];

    function loadDiaryEntries() {
      entries = Store.getJSON('diary_entries', []);
      if (entries.length === 0) {
        entries.push({
          date: new Date().toISOString().slice(0,10),
          content: '今天还没有日记… 小熊还在等你说话呢。'
        });
      }
      currentIndex = entries.length - 1;
    }

    function renderDiary() {
      var entry = entries[currentIndex];
      if (!entry) return;
      var d = new Date(entry.date);
      dateEl.textContent = d.getFullYear() + '年' + (d.getMonth()+1) + '月' + d.getDate() + '日';
      body.innerHTML = '<p>' + entry.content.replace(/\n/g, '</p><p>') + '</p>';
      if (prevBtn) prevBtn.disabled = currentIndex <= 0;
      if (nextBtn) nextBtn.disabled = currentIndex >= entries.length - 1;
    }

    card.addEventListener('click', function() {
      loadDiaryEntries();
      renderDiary();
      overlay.style.display = 'flex';
    });

    if (close) {
      close.addEventListener('click', function() {
        overlay.style.display = 'none';
      });
    }

    overlay.addEventListener('click', function(e) {
      if (e.target === this) this.style.display = 'none';
    });

    if (prevBtn) {
      prevBtn.addEventListener('click', function() {
        if (currentIndex > 0) { currentIndex--; renderDiary(); }
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function() {
        if (currentIndex < entries.length - 1) { currentIndex++; renderDiary(); }
      });
    }

    // 暴露添加日记函数
    window.addDiaryEntry = function(content) {
      var diary = Store.getJSON('diary_entries', []);
      diary.push({
        date: new Date().toISOString().slice(0,10),
        content: content
      });
      Store.setJSON('diary_entries', diary);
      updateDiaryPreview();
    };
  }

  // ============================================================
  //  8. 主题色恢复
  // ============================================================
  function restoreThemeColor() {
    var saved = Store.get('themeColor');
    if (saved) {
      document.documentElement.style.setProperty('--bg-primary', saved);
      document.documentElement.style.setProperty('--splash-bg', saved);
      // 高亮对应的色块
      document.querySelectorAll('.color-dot').forEach(function(dot) {
        dot.classList.toggle('active', dot.dataset.color === saved);
      });
    }
  }

  // ============================================================
  //  9. 壁纸 UI（复用旧版逻辑）
  // ============================================================
  function initWallpaperUI() {
    var pickBtn = document.getElementById('wp-pick');
    var clearBtn = document.getElementById('wp-clear');
    var preview = document.getElementById('wp-preview');
    var hint = document.getElementById('wp-hint');

    if (pickBtn && typeof pickWallpaper === 'function') {
      pickBtn.addEventListener('click', function() {
        if (typeof tap === 'function') tap();
        pickWallpaper();
      });
    }

    if (clearBtn && typeof clearWallpaper === 'function') {
      clearBtn.addEventListener('click', function() {
        if (typeof tap === 'function') tap();
        clearWallpaper();
        if (preview) preview.style.backgroundImage = '';
        if (hint) hint.textContent = '未设置壁纸';
      });
    }

    // 恢复壁纸预览
    var saved = Store.get('wallpaper');
    if (saved && preview) {
      preview.style.backgroundImage = 'url(' + saved + ')';
      if (hint) hint.textContent = '已设置壁纸';
    }
  }

  // ============================================================
  //  10. 标签管理（UI）
  // ============================================================
  // 这部分留给后续扩展，目前仅占位

})();