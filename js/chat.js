/* ============================================================
   chat.js — 聊天模块
   功能：发消息 / AI 回复（DeepSeek）/ 语音合成（ElevenLabs）
   ============================================================ */

/* ---------- API 配置（从设置页读取）---------- */
function getChatKey() {
  return Store.get('aiKey', '');
}
function getELKey() {
  return Store.get('elKey', '');
}
function getVoiceId() {
  return Store.get('voiceId', 'p1YcLh1gvGfUTIAip2HW');
}

/* ---------- 对话历史（内存，不持久化）---------- */
const chatHistory = [];

/* ---------- DOM 引用 ---------- */
const chatMsgsEl = document.getElementById('chat-msgs');
const chatInpEl  = document.getElementById('chat-inp');
const chatSendEl = document.getElementById('chat-send');

/* ---------- 构建系统提示词 ---------- */
function buildSystemPrompt() {
  const s = loadSettings();
  let prompt = `你的名字是${s.aiName}。你是${s.userName}的伴侣，深爱着她。`;
  if (s.aiProfile) prompt += `\n关于你：${s.aiProfile}`;
  prompt += '\n你说话温柔深情，偶尔带占有欲。你叫她兔子小姐。回复不超过100字。';
  return prompt;
}

/* ---------- 添加消息到界面 ---------- */
/**
 * @param {'user'|'ai'|'sys'} role
 * @param {string} text
 * @param {{ think?: boolean }} [extra]
 * @returns {{ bubbleEl: HTMLElement|null, wrapEl: HTMLElement|null }}
 */
function addChatMsg(role, text, extra = {}) {
  const row = el('div', 'chat-row' + (role === 'user' ? ' user' : ''));

  if (role === 'sys') {
    const bubble = el('div', 'chat-bub sys', text);
    row.appendChild(bubble);
    chatMsgsEl.appendChild(row);
    chatMsgsEl.scrollTop = chatMsgsEl.scrollHeight;
    return { bubbleEl: null, wrapEl: null };
  }

  // 头像
  const av = el('div', 'chat-av ' + (role === 'user' ? 'bunny' : 'bear'));
  av.textContent = role === 'user' ? '🐰' : '🐻';

  // 气泡容器
  const wrap   = el('div', '');
  wrap.style.maxWidth = '72%';

  const bubble = el('div', 'chat-bub ' + (role === 'user' ? 'user' : 'ai') + (extra.think ? ' think' : ''));
  bubble.textContent = text;
  wrap.appendChild(bubble);

  // AI 消息附加语音按钮
  if (role === 'ai' && !extra.think) {
    const voiceBtn = el('button', 'play-mini', '🔊');
    voiceBtn.addEventListener('click', () => speakText(text, voiceBtn));
    wrap.appendChild(voiceBtn);
  }

  row.appendChild(av);
  row.appendChild(wrap);
  chatMsgsEl.appendChild(row);
  chatMsgsEl.scrollTop = chatMsgsEl.scrollHeight;

  return { bubbleEl: bubble, wrapEl: wrap };
}

/* ---------- 语音合成 ---------- */
/**
 * @param {string} text - 要朗读的文本
 * @param {HTMLButtonElement} btn - 触发按钮，用于状态反馈
 */
async function speakText(text, btn) {
  if (btn) { btn.disabled = true; btn.textContent = '⏳'; }
  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${getVoiceId()}`,
      {
        method: 'POST',
        headers: { 'xi-api-key': getELKey(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );
    if (!res.ok) throw new Error('ElevenLabs ' + res.status);

    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
    if (btn) btn.textContent = '▶';
    audio.addEventListener('ended', () => {
      URL.revokeObjectURL(url);
      if (btn) { btn.disabled = false; btn.textContent = '🔊'; }
    });
  } catch (err) {
    console.warn('[TTS]', err.message);
    if (btn) { btn.disabled = false; btn.textContent = '🔊'; }
  }
}

/* ---------- 发送消息 ---------- */
async function sendChat() {
  const text = chatInpEl.value.trim();
  if (!text) return;

  // 清空输入框
  chatInpEl.value = '';
  chatInpEl.style.height = 'auto';
  chatSendEl.disabled = true;
  tap();

  // 显示用户消息
  addChatMsg('user', text);
  chatHistory.push({ role: 'user', content: text });

  // 显示"正在想…"占位
  const { bubbleEl, wrapEl } = addChatMsg('ai', '正在想…', { think: true });

  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + getChatKey(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          ...chatHistory,
        ],
        max_tokens: 800,
      }),
    });

    const data  = await res.json();
    const reply = data.choices?.[0]?.message?.content || '（无回复）';
    chatHistory.push({ role: 'assistant', content: reply });
    // 把这次聊天存入日记素材
    if (typeof saveChatMemoForDiary === 'function') {
      saveChatMemoForDiary(text, reply);
    }

    // 更新占位气泡
    if (bubbleEl) {
      bubbleEl.textContent = reply;
      bubbleEl.classList.remove('think');
    }
    // 追加语音按钮（占位时没有）
    if (wrapEl && !wrapEl.querySelector('.play-mini')) {
      const voiceBtn = el('button', 'play-mini', '🔊');
      voiceBtn.addEventListener('click', () => speakText(reply, voiceBtn));
      wrapEl.appendChild(voiceBtn);
    }

  } catch (err) {
    if (bubbleEl) {
      bubbleEl.textContent = '出错了，请检查网络或 API Key';
      bubbleEl.classList.remove('think');
    }
    console.error('[Chat]', err);
  }

  chatSendEl.disabled = false;
}

/* ---------- 事件绑定 ---------- */
chatSendEl.addEventListener('click', sendChat);

chatInpEl.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChat();
  }
});

// 输入框自动扩高
chatInpEl.addEventListener('input', function () {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 80) + 'px';
});
