/* ============================================================
   animation.js — 动画工具
   提供命令式的动画触发函数，供其他模块调用
   ============================================================ */

/**
 * 对元素播放一次性 CSS 动画
 * @param {HTMLElement} element
 * @param {string} animClass - animations.css 中定义的动画 class
 * @param {number} [duration=400] - 动画持续时间（毫秒），结束后自动移除 class
 */
function playAnim(element, animClass, duration = 400) {
  if (!element) return;
  element.classList.remove(animClass);
  void element.offsetWidth; // 强制回流以重置动画
  element.classList.add(animClass);
  setTimeout(() => element.classList.remove(animClass), duration);
}

/**
 * 便签新建时触发滑入动画
 * @param {HTMLElement} noteEl
 */
function animateNewNote(noteEl) {
  playAnim(noteEl, 'new', 350);
}

/**
 * 推送项进入动画（由 renderPushes 在插入 DOM 后调用）
 * push-item 已在 animations.css 中定义自动动画，此处为扩展预留
 */
function animatePushItem(pushEl) {
  // push-item 的动画由 CSS 自动触发，这里可以扩展更多逻辑
  void pushEl;
}

/**
 * 页面切换时的轻微震动 + 视觉过渡
 * 已由 CSS @keyframes pageIn 处理，这里预留给额外逻辑
 */
function animatePageSwitch() {
  // 预留扩展
}