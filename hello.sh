#!/usr/bin/env bash
set -e

echo "🔧 Adding new chat infrastructure (without breaking existing files)..."

mkdir -p src/lib \
         src/utils \
         src/hooks \
         src/components/chat

########################################
# lib/db.js
########################################
cat > src/lib/db.js <<'EOF'
const DB_NAME = "chat_app";
const STORE = "messages";
const VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putMessage(msg) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(msg);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getMessages() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
EOF

########################################
# utils/uuid.js
########################################
cat > src/utils/uuid.js <<'EOF'
export function uuid() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : "xxxx-4xxx-yxxx-xxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
}
EOF

########################################
# utils/treeUtils.js
########################################
cat > src/utils/treeUtils.js <<'EOF'
export function getMessageByIndex(messages, index) {
  if (!messages || index < 0 || index >= messages.length) return null;
  return messages[index];
}

export function clampIndex(index, max) {
  return Math.max(0, Math.min(index, max));
}
EOF

########################################
# hooks/useChatDB.js
########################################
cat > src/hooks/useChatDB.js <<'EOF'
import { useEffect } from "react";
import { putMessage, getMessages } from "../lib/db";

export function useChatDB(messages, setMessages) {
  useEffect(() => {
    getMessages().then((saved) => {
      if (saved?.length) setMessages(saved);
    });
  }, []);

  useEffect(() => {
    messages.forEach((m) => putMessage(m));
  }, [messages]);
}
EOF

########################################
# BACKUP + UPDATE ChatContext.jsx
########################################
if [ -f src/context/ChatContext.jsx ]; then
  cp src/context/ChatContext.jsx src/context/ChatContext.jsx.bak
fi

cat > src/context/ChatContext.jsx <<'EOF'
import { createContext, useState } from "react";
import { uuid } from "../utils/uuid";
import { useChatDB } from "../hooks/useChatDB";

export const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [index, setIndex] = useState(0);

  useChatDB(messages, setMessages);

  const sendMessage = (content) => {
    const msg = { id: uuid(), role: "user", content };
    setMessages((prev) => [...prev, msg]);
    setIndex((prev) => prev + 1);
  };

  const goPrev = () => setIndex((i) => Math.max(0, i - 1));
  const goNext = () =>
    setIndex((i) => Math.min(messages.length - 1, i + 1));

  return (
    <ChatContext.Provider
      value={{ messages, sendMessage, index, goPrev, goNext }}
    >
      {children}
    </ChatContext.Provider>
  );
}
EOF

########################################
# BACKUP + UPDATE ChatMessage.jsx
########################################
if [ -f src/components/chat/ChatMessage.jsx ]; then
  cp src/components/chat/ChatMessage.jsx src/components/chat/ChatMessage.jsx.bak
fi

cat > src/components/chat/ChatMessage.jsx <<'EOF'
export default function ChatMessage({ role, content }) {
  return (
    <div className={`chat-message ${role}`}>
      <p>{content}</p>
    </div>
  );
}
EOF

########################################
# MessageNavigation.jsx
########################################
cat > src/components/chat/MessageNavigation.jsx <<'EOF'
import { useContext } from "react";
import { ChatContext } from "../../context/ChatContext";

export default function MessageNavigation() {
  const { messages, index, goPrev, goNext } = useContext(ChatContext);

  if (!messages.length) return null;

  return (
    <div className="message-nav">
      <button onClick={goPrev} disabled={index === 0}>
        {"<"}
      </button>
      <span>
        {index + 1} / {messages.length}
      </span>
      <button onClick={goNext} disabled={index === messages.length - 1}>
        {">"}
      </button>
    </div>
  );
}
EOF

########################################
# ChatView.jsx
########################################
cat > src/components/chat/ChatView.jsx <<'EOF'
import ChatHistory from "./ChatHistory";
import ChatInput from "./ChatInput";
import MessageNavigation from "./MessageNavigation";

export default function ChatView() {
  return (
    <div className="chat-view">
      <MessageNavigation />
      <ChatHistory />
      <ChatInput />
    </div>
  );
}
EOF

echo "✅ Done — new files added safely."
echo "👉 Backups created for:"
echo "   - src/context/ChatContext.jsx.bak"
echo "   - src/components/chat/ChatMessage.jsx.bak"
echo "Run your app normally — everything should still work."