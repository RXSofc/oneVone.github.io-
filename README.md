# void.chat

A minimalist real-time public chat room — no account, no login, just pick a name and talk.

Built with vanilla HTML/CSS/JS and Firebase Realtime Database.

![screenshot](screenshot.png)

---

## Features

- 💬 Real-time messaging via Firebase Realtime Database
- 👤 Custom username — stored in localStorage, no auth required
- 🟢 Live presence counter (online users)
- ✍️ Typing indicator with debounce
- 📱 Mobile-friendly card layout
- 🎨 Clean white/gray UI with smooth animations

---

## Tech Stack

| Layer    | Tech                          |
|----------|-------------------------------|
| Frontend | Vanilla HTML, CSS, JavaScript |
| Database | Firebase Realtime Database    |
| Fonts    | DM Sans, IBM Plex Mono, Cormorant Garamond (Google Fonts) |
| Hosting  | Firebase Hosting / GitHub Pages / Vercel |

---

## Project Structure

```
void.chat/
├── index.html   # markup & structure
├── style.css    # all styling & animations
├── app.js       # firebase logic & event handlers
└── README.md
```

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/RXSofc/void.chat.git
cd void.chat
```

### 2. Setup Firebase

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. Enable **Realtime Database** — choose a region, start in **test mode**
4. Go to **Project Settings → Your apps** → add a Web app → copy the config

### 3. Paste your Firebase config

Open `app.js` and replace the config at the top:

```js
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  databaseURL:       "https://YOUR_PROJECT-default-rtdb.REGION.firebasedatabase.app",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};
```

### 4. Set Realtime Database Rules

In Firebase Console → Realtime Database → Rules:

```json
{
  "rules": {
    "messages": {
      ".read": true,
      ".write": true
    },
    "presence": {
      ".read": true,
      "$uid": { ".write": true }
    },
    "typing": {
      ".read": true,
      "$uid": { ".write": true }
    }
  }
}
```

### 5. Open and run

No build step needed. Just open `index.html` in a browser — or deploy it anywhere static hosting is supported.

---

## Deployment

### Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Vercel

```bash
npm install -g vercel
vercel
```

### GitHub Pages

Push to a repo → Settings → Pages → set source to `main` branch → done.

---

## Data Structure (RTDB)

```
root/
├── messages/
│   └── {auto-id}/
│       ├── uid        # anonymous session id
│       ├── username   # display name
│       ├── text       # message content
│       └── timestamp  # ServerValue.TIMESTAMP
│
├── presence/
│   └── {uid}/
│       ├── username
│       └── ts
│
└── typing/
    └── {uid}/
        └── username
```

---

## License

MIT — free to use, modify, and distribute.
