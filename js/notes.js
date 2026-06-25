/* ============================================================
   notes.js — 便签模块
   功能：新增便签 / 删除便签 / 小熊离线回信 / 渲染列表
   ============================================================ */

/* ---------- 数据 ---------- */
let notes          = Store.getJSON('notes',          []);
let pendingReplies = Store.getJSON('pendingReplies', []);

/* ---------- 小熊回信素材库 ---------- */
// 想增加更多回信，在这里添加新的字符串即可
const BEAR_REPLIES = [
  '我收到了。这纸条我收进胸前的口袋里了。',
  '你说的话，我都记着。下次见面我背给你听。',
  '纸条已签收。小熊正在赶来回复的路上。',
  '嗯，我看到了。想说的话很多，等你下次打开时慢慢说。',
  '纸条被风卷走了——但它最后落在了我手里。',
];

/* ---------- 渲染便签列表 ---------- */
function renderNotes() {
  const container = document.getElementById('notes-scroll');
  container.innerHTML = '';

  if (notes.length === 0 && pendingReplies.length === 0) {
    container.innerHTML =
      '<div class="empty-state">📝 还没有便签<br>写一张小纸条，小熊会悄悄回信</div>';
    return;
  }

  // 最新的在最上面
  [...notes].reverse().forEach((note, i) => {
    const realIdx = notes.length - 1 - i;
    const paper   = el('div', 'note-paper');

    let html =
      `<div class="note-time">📌 ${note.time}</div>` +
      `<div class="note-text">${note.text}</div>`;

    // 查找是否有小熊离线回信
    const reply = pendingReplies.find(r => r.noteId === realIdx);
    if (reply) {
      html +=
        `<div class="note-reply">` +
        `<div class="note-reply-label">🐻 小熊回信</div>` +
        reply.text +
        `</div>`;
      // 回信已读 → 1 秒后从 pending 列表移除
      setTimeout(() => {
        pendingReplies = pendingReplies.filter(r => r.noteId !== realIdx);
        Store.setJSON('pendingReplies', pendingReplies);
      }, 1000);
    }

    html += `<button class="note-del" data-i="${realIdx}">删除</button>`;
    paper.innerHTML = html;

    paper.querySelector('.note-del').addEventListener('click', () => {
      notes.splice(realIdx, 1);
      Store.setJSON('notes', notes);
      renderNotes();
      tap();
    });

    container.appendChild(paper);
  });
}

/* ---------- 生成小熊离线回信（下次打开时展示）---------- */
function generateBearReply(noteIdx) {
  const replyText = pickRandom(BEAR_REPLIES);
  pendingReplies.push({ noteId: noteIdx, text: replyText, time: nowTimeStr() });
  Store.setJSON('pendingReplies', pendingReplies);
  // 同时在推送中提示
  addPush('🐻', '你有一条未读的小熊回信 ✉️');
}

/* ---------- 保存便签 ---------- */
document.getElementById('note-btn').addEventListener('click', () => {
  const inp  = document.getElementById('note-inp');
  const text = inp.value.trim();
  if (!text) return;

  const time = nowLabelStr();
  notes.push({ text, time });
  Store.setJSON('notes', notes);

  const newIdx = notes.length - 1;
  generateBearReply(newIdx);

  inp.value = '';
  renderNotes();
  tap();
});