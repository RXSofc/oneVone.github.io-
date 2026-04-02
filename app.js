// ══════════════════════════════════════════════
//  Firebase Config
// ══════════════════════════════════════════════
const firebaseConfig = {
  apiKey:            "AIzaSyCnYkVPbih6-Gzc2iBUuu12yIZwYfZDN-s",
  authDomain:        "webchat-oneway.firebaseapp.com",
  databaseURL:       "https://webchat-oneway-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "webchat-oneway",
  storageBucket:     "webchat-oneway.firebasestorage.app",
  messagingSenderId: "829743777840",
  appId:             "1:829743777840:web:001896b22e3402db3945f5"
};

firebase.initializeApp(firebaseConfig);
const rtdb = firebase.database();

// ══════════════════════════════════════════════
//  Session
// ══════════════════════════════════════════════
let uid = localStorage.getItem('void_uid');
if (!uid) {
  uid = crypto.randomUUID();
  localStorage.setItem('void_uid', uid);
}
let username = localStorage.getItem('void_name') || null;

// ══════════════════════════════════════════════
//  DOM References
// ══════════════════════════════════════════════
const $ = id => document.getElementById(id);

const modalOverlay  = $('modal-overlay');
const usernameInput = $('username-input');
const enterBtn      = $('enter-btn');
const modalError    = $('modal-error');
const messagesEl    = $('messages');
const scrollAnchor  = $('scroll-anchor');
const typingRow     = $('typing-row');
const typingLabel   = $('typing-label');
const msgInput      = $('msg-input');
const sendBtn       = $('send-btn');
const youTag        = $('you-tag');
const onlineCount   = $('online-count');

// ══════════════════════════════════════════════
//  Helpers
// ══════════════════════════════════════════════
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function fmtTime(ts) {
  const d = new Date(ts || Date.now());
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function initials(name) {
  return name ? name.slice(0, 2).toUpperCase() : '??';
}

// ══════════════════════════════════════════════
//  Render Message
// ══════════════════════════════════════════════
function renderMsg(data) {
  const isOwn = data.uid === uid;
  const isSys = !!data.system;
  const row   = document.createElement('div');
  row.className = `msg-row${isOwn ? ' own' : ''}${isSys ? ' sys-row' : ''}`;

  if (isSys) {
    row.innerHTML = `
      <div class="bubble-wrap">
        <div class="bubble sys-bubble">${esc(data.text)}</div>
      </div>`;
  } else {
    row.innerHTML = `
      <div class="msg-avatar">${esc(initials(data.username))}</div>
      <div class="bubble-wrap">
        <div class="msg-meta">
          <span class="msg-uname">${esc(data.username)}</span>
          <span>${esc(fmtTime(data.timestamp))}</span>
        </div>
        <div class="bubble">${esc(data.text)}</div>
      </div>`;
  }

  messagesEl.insertBefore(row, scrollAnchor);
  scrollAnchor.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

// ══════════════════════════════════════════════
//  Messages (Realtime Database)
// ══════════════════════════════════════════════
function initMessages() {
  rtdb.ref('messages').limitToLast(120).on('child_added', snap => {
    renderMsg(snap.val());
  }, err => {
    console.error('[void.chat] RTDB messages error:', err);
  });
}

// ══════════════════════════════════════════════
//  Presence
// ══════════════════════════════════════════════
function initPresence() {
  const presRef = rtdb.ref(`presence/${uid}`);

  rtdb.ref('.info/connected').on('value', snap => {
    if (snap.val()) {
      presRef.onDisconnect().remove();
      presRef.set({ username, ts: firebase.database.ServerValue.TIMESTAMP });
    }
  });

  rtdb.ref('presence').on('value', snap => {
    onlineCount.textContent = snap.numChildren();
  });
}

// ══════════════════════════════════════════════
//  Typing Indicator
// ══════════════════════════════════════════════
let typingTimer = null;

function setTyping(on) {
  const ref = rtdb.ref(`typing/${uid}`);
  on ? ref.set({ username }) : ref.remove();
}

function initTyping() {
  msgInput.addEventListener('input', () => {
    setTyping(true);
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => setTyping(false), 2200);
  });

  rtdb.ref('typing').on('value', snap => {
    const all    = snap.val() || {};
    const others = Object.entries(all)
      .filter(([id]) => id !== uid)
      .map(([, d]) => d.username);

    if (!others.length) {
      typingRow.classList.remove('visible');
      return;
    }

    const label = others.length <= 2
      ? others.map(esc).join(' &amp; ')
      : `${esc(others[0])} +${others.length - 1}`;

    typingLabel.innerHTML = `${label} ngetik...`;
    typingRow.classList.add('visible');
  });
}

// ══════════════════════════════════════════════
//  Send Message
// ══════════════════════════════════════════════
async function sendMsg() {
  const text = msgInput.value.trim();
  if (!text) return;

  msgInput.value = '';
  setTyping(false);
  clearTimeout(typingTimer);

  try {
    await rtdb.ref('messages').push({
      uid,
      username,
      text,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
  } catch (e) {
    console.error('[void.chat] send error:', e);
  }
}

sendBtn.addEventListener('click', sendMsg);
msgInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMsg();
  }
});

// ══════════════════════════════════════════════
//  Modal — Enter Chat
// ══════════════════════════════════════════════
function startChat() {
  youTag.textContent = username;
  modalOverlay.style.display = 'none';
  msgInput.disabled = false;
  sendBtn.disabled  = false;
  msgInput.focus();
  initMessages();
  initPresence();
  initTyping();
}

function enterChat() {
  const name = usernameInput.value.trim();
  if (!name || name.length < 2) {
    modalError.textContent = 'min 2 karakter ya bro.';
    return;
  }
  if (!/^[\w\-\.]+$/.test(name)) {
    modalError.textContent = 'huruf, angka, _ - . aja.';
    return;
  }
  username = name;
  localStorage.setItem('void_name', username);
  startChat();
}

enterBtn.addEventListener('click', enterChat);
usernameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') enterChat();
});

// Auto-skip modal kalau username udah ada
if (username) startChat();

// Cleanup typing on tab close
window.addEventListener('beforeunload', () => {
  rtdb.ref(`typing/${uid}`).remove();
});
