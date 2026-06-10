/* ═══════════════════════════════════════════════════════════
   VOID.CHAT v3.0
   FOLLOW ME ON IG 
   @rixs4k
   ═══════════════════════════════════════════════════════════ */
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyCnYkVPbih6-Gzc2iBUuu12yIZwYfZDN-s",
  authDomain:        "webchat-oneway.firebaseapp.com",
  databaseURL:       "https://webchat-oneway-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "webchat-oneway",
  storageBucket:     "webchat-oneway.firebasestorage.app",
  messagingSenderId: "829743777840",
  appId:             "1:829743777840:web:001896b22e3402db3945f5"
};

const app = firebase.initializeApp(FIREBASE_CONFIG);
const rtdb = firebase.database(app);

let uid = localStorage.getItem('void_uid');
if (!uid) {
  uid = crypto.randomUUID();
  localStorage.setItem('void_uid', uid);
}
let username = localStorage.getItem('void_name') || null;

let messagesRef = null;
let presRef     = null;
let typingRef   = null;

let isSending    = false;
let typingTimer  = null;
let firstLoad    = true;
let historyDone  = false;   
let isNearBottom = true;
let panelOpen    = false;

const $     = id => document.getElementById(id);
const $el   = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };

const modalOverlay   = $('modal-overlay');
const appEl          = $('app');
const usernameInput  = $('username-input');
const enterBtn       = $('enter-btn');
const modalError     = $('modal-error');
const messagesArea   = $('messages-area');
const messagesEl     = $('messages');
const emptyState     = $('empty-state');
const typingRow      = $('typing-row');
const typingLabel    = $('typing-label');
const msgInput       = $('msg-input');
const sendBtn        = $('send-btn');
const charCounter    = $('char-counter');
const youName        = $('you-name');
const onlineCount    = $('online-count');
const panelOnlineCount = $('panel-online-count');
const panelUsername  = $('panel-username');
const connDot        = $('conn-dot');
const connToast      = $('conn-toast');
const connText       = $('conn-text');
const menuBtn        = $('menu-btn');
const roomPanel      = $('room-panel');
const closePanelBtn  = $('close-panel-btn');
const clearNameBtn   = $('clear-name-btn');
const renameOverlay  = $('rename-overlay');
const renameInput    = $('rename-input');
const renameCancelBtn = $('rename-cancel-btn');
const renameConfirmBtn = $('rename-confirm-btn');
const renameError    = $('rename-error');

/* ═══════════════════════════════════════════════════════════
   VOID.CHAT v3.0
   FOLLOW ME ON IG 
   @rixs4k
   ═══════════════════════════════════════════════════════════ */

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function fmtTime(ts) {
  return new Date(ts || Date.now()).toLocaleTimeString('en-GB', {
    hour:   '2-digit',
    minute: '2-digit',
  });
}

function initials(name) {
  if (!name) return '??';
  return name.slice(0, 2).toUpperCase();
}

function validateName(name) {
  if (!name || name.length < 2)   return 'MIN 2 CHARACTERS.';
  if (name.length > 20)           return 'MAX 20 CHARACTERS.';
  if (!/^[\w\-\.]+$/.test(name))  return 'USE: LETTERS, NUMBERS, _ - .';
  return null; 
}

let toastTimer = null;

function showToast(text, type = 'connecting', duration = 3000) {
  connText.textContent = text;
  connToast.className  = type; 
  clearTimeout(toastTimer);
  if (duration > 0) {
    toastTimer = setTimeout(() => {
      connToast.classList.add('hidden');
    }, duration);
  }
}

function hideToast() {
  clearTimeout(toastTimer);
  connToast.classList.add('hidden');
}


messagesArea.addEventListener('scroll', () => {
  const threshold  = 100;
  isNearBottom = (messagesArea.scrollHeight - messagesArea.scrollTop - messagesArea.clientHeight) < threshold;
}, { passive: true });

function scrollToBottom(force = false) {
  if (force || isNearBottom) {
    requestAnimationFrame(() => {
      messagesArea.scrollTop = messagesArea.scrollHeight;
    });
  }
}


function renderMsg(data) {
  const isOwn = data.uid === uid;
  const isSys = !!data.system;

    if (!emptyState.classList.contains('hidden')) {
    emptyState.classList.remove('visible');
    emptyState.classList.add('hidden');
  }

  const row = $el('div', `msg-row${isOwn ? ' own' : ''}${isSys ? ' sys-row' : ''}`);

  if (isSys) {
    row.innerHTML = `
      <div class="bubble-wrap">
        <div class="bubble sys-bubble">— ${esc(data.text)} —</div>
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

  messagesEl.appendChild(row);
  scrollToBottom();
}

function initMessages() {
  messagesRef = rtdb.ref('messages').limitToLast(100);

  messagesRef.once('value', snapshot => {
    firstLoad = false;
    const messages = [];
    snapshot.forEach(child => messages.push({ key: child.key, ...child.val() }));
    messages.forEach(renderMsg);

    if (messages.length === 0) {
      emptyState.classList.remove('hidden');
      emptyState.classList.add('visible');
    }

    scrollToBottom(true);
    historyDone = true;

    const lastKey = messages.length ? messages[messages.length - 1].key : null;
    const newRef  = lastKey
      ? rtdb.ref('messages').orderByKey().startAfter(lastKey)
      : rtdb.ref('messages').limitToLast(1);

    newRef.on('child_added', snap => {
      if (!historyDone) return; 
      renderMsg(snap.val());
    }, err => {
      console.error('[void.chat] new-msg listener error:', err);
    });

  }, err => {
    console.error('[void.chat] initial load error:', err);
    showToast('FAILED TO LOAD MESSAGES', 'error');
    messagesRef.on('child_added', snap => renderMsg(snap.val()), () => {});
  });

  rtdb.ref('.info/connected').on('value', snap => {
    const connected = snap.val() === true;
    if (connected) {
      connDot.classList.add('online');
      showToast('CONNECTED', 'connected', 2500);
    } else {
      connDot.classList.remove('online');
      showToast('OFFLINE — RECONNECTING...', 'error', 0); 
    }
  });
}


function initPresence() {
  presRef = rtdb.ref(`presence/${uid}`);

  rtdb.ref('.info/connected').on('value', snap => {
    if (snap.val() === true && username) {
      presRef.onDisconnect().remove();
      presRef.set({
        username,
        ts: firebase.database.ServerValue.TIMESTAMP,
      }).catch(err => console.warn('[void.chat] presence set error:', err));
    }
  });

  rtdb.ref('presence').on('value', snap => {
    const count = snap.numChildren();
    onlineCount.textContent      = count;
    panelOnlineCount.textContent = count;
  }, err => console.error('[void.chat] presence count error:', err));
}

function setTyping(on) {
  if (!typingRef) typingRef = rtdb.ref(`typing/${uid}`);
  if (on && username) {
    typingRef.set({ username }).catch(() => {});
  } else {
    typingRef.remove().catch(() => {});
  }
}

function initTyping() {
  msgInput.addEventListener('input', () => {
    updateCharCounter();
    setTyping(true);
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => setTyping(false), 2200);
  });

  msgInput.addEventListener('blur', () => {
    clearTimeout(typingTimer);
    setTyping(false);
  });

  rtdb.ref('typing').on('value', snap => {
    const all    = snap.val() || {};
    const others = Object.entries(all)
      .filter(([id]) => id !== uid)
      .map(([, d]) => d.username)
      .filter(Boolean);

    if (!others.length) {
      typingRow.classList.remove('visible');
      typingLabel.textContent = '';
      return;
    }

    let label;
    if (others.length === 1) {
      label = esc(others[0]);
    } else if (others.length === 2) {
      label = `${esc(others[0])} & ${esc(others[1])}`;
    } else {
      label = `${esc(others[0])} +${others.length - 1} MORE`;
    }

    typingLabel.textContent = `${label} IS TYPING...`;
    typingRow.classList.add('visible');
  });
}


function updateCharCounter() {
  const len = msgInput.value.length;
  const max = parseInt(msgInput.maxLength, 10) || 500;
  charCounter.textContent = `${len}/${max}`;
  charCounter.classList.remove('warning', 'danger');
  if      (len > max * 0.9)  charCounter.classList.add('danger');
  else if (len > max * 0.75) charCounter.classList.add('warning');
}

async function sendMsg() {
  if (isSending) return;

  const text = msgInput.value.trim();
  if (!text) return;

  if (!username) {
    showToast('NO USERNAME — REFRESH PAGE', 'error');
    return;
  }

  isSending          = true;
  sendBtn.disabled   = true;
  msgInput.disabled  = true;

  const savedText = text;
  msgInput.value = '';
  updateCharCounter();
  setTyping(false);
  clearTimeout(typingTimer);

  try {
    await rtdb.ref('messages').push({
      uid,
      username,
      text: savedText,
      timestamp: firebase.database.ServerValue.TIMESTAMP,
    });
  } catch (e) {
    console.error('[void.chat] send error:', e);
    showToast('FAILED TO SEND — TRY AGAIN', 'error');
    msgInput.value = savedText;
    
    updateCharCounter();
  } finally {
    isSending          = false;
    msgInput.disabled  = false;
    sendBtn.disabled   = false;
    msgInput.focus();
  }
}

sendBtn.addEventListener('click', sendMsg);

msgInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMsg();
  }
});

function openPanel() {
  panelOpen = true;
  roomPanel.classList.remove('hidden');
}

function closePanel() {
  panelOpen = false;
  roomPanel.classList.add('hidden');
}

menuBtn.addEventListener('click', () => {
  if (panelOpen) closePanel(); else openPanel();
});

closePanelBtn.addEventListener('click', closePanel);

document.addEventListener('click', e => {
  if (panelOpen && !roomPanel.contains(e.target) && e.target !== menuBtn) {
    closePanel();
  }
}, true);

function openRenameModal() {
  renameInput.value    = username || '';
  renameError.textContent = '';
  renameOverlay.classList.remove('hidden');
  renameInput.focus();
  renameInput.select();
}

function closeRenameModal() {
  renameOverlay.classList.add('hidden');
}

function applyRename() {
  const newName = renameInput.value.trim();
  const err     = validateName(newName);
  if (err) {
    renameError.textContent = err;
    return;
  }
  if (newName === username) {
    closeRenameModal();
    return;
  }

  const oldName = username;
  username      = newName;
  localStorage.setItem('void_name', username);

  youName.textContent         = username;
  panelUsername.textContent   = username;

  if (presRef) {
    presRef.set({
      username,
      ts: firebase.database.ServerValue.TIMESTAMP,
    }).catch(() => {});
  }

  rtdb.ref('messages').push({
    system:    true,
    text:      `${oldName} → ${newName}`,
    timestamp: firebase.database.ServerValue.TIMESTAMP,
  }).catch(() => {});

  closeRenameModal();
  showToast(`HANDLE: ${username}`, 'connected');
}

clearNameBtn.addEventListener('click', openRenameModal);
renameCancelBtn.addEventListener('click', closeRenameModal);
renameConfirmBtn.addEventListener('click', applyRename);

renameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') applyRename();
  if (e.key === 'Escape') closeRenameModal();
});

renameOverlay.addEventListener('click', e => {
  if (e.target === renameOverlay) closeRenameModal();
});

function startChat() {
  youName.textContent       = username;
  panelUsername.textContent = username;

  modalOverlay.style.display = 'none';
  appEl.style.display        = 'flex';

  msgInput.disabled = false;
  sendBtn.disabled  = false;

  emptyState.classList.remove('hidden');
  emptyState.classList.add('visible');

  initMessages();
  initPresence();
  initTyping();

  requestAnimationFrame(() => msgInput.focus());
}

function enterChat() {
  const name = usernameInput.value.trim();
  const err  = validateName(name);
  if (err) {
    modalError.textContent = err;
    usernameInput.focus();
    return;
  }

  username = name;
  localStorage.setItem('void_name', username);
  modalError.textContent = '';
  startChat();
}

enterBtn.addEventListener('click', enterChat);
usernameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') enterChat();
  if (modalError.textContent) modalError.textContent = ''; 
});
usernameInput.addEventListener('input', () => {
  if (modalError.textContent) modalError.textContent = '';
});

if (username) {
  usernameInput.value = username;
  requestAnimationFrame(() => {
    requestAnimationFrame(startChat);
  });
} else {
  usernameInput.focus();
}


document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (!renameOverlay.classList.contains('hidden')) {
      closeRenameModal();
    } else if (panelOpen) {
      closePanel();
    } else if (document.activeElement === msgInput) {
      msgInput.blur();
    }
  }
});

function cleanup() {
  clearTimeout(typingTimer);
  clearTimeout(toastTimer);
  if (typingRef) typingRef.remove().catch(() => {});
  if (presRef)   presRef.remove().catch(() => {});
}

window.addEventListener('beforeunload', cleanup);
window.addEventListener('pagehide',     cleanup); 

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    clearTimeout(typingTimer);
    setTyping(false);
  }
});
