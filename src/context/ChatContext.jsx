import { createContext, useContext, useState, useMemo } from 'react';
import { useChatDB } from '../hooks/useChatDB';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const chatDB = useChatDB();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Sonnet 4.5');
  const [userName] = useState('Toy');
  const [editingMessageId, setEditingMessageId] = useState(null);

  // Group chats by date for sidebar - memoized
  const groupedChats = useMemo(() => {
    return chatDB.chats.reduce((acc, chat) => {
      const chatDate = new Date(chat.updated_at || chat.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);

      let dateGroup;
      if (chatDate.toDateString() === today.toDateString()) {
        dateGroup = 'Today';
      } else if (chatDate.toDateString() === yesterday.toDateString()) {
        dateGroup = 'Yesterday';
      } else if (chatDate > lastWeek) {
        dateGroup = 'Last 7 days';
      } else {
        dateGroup = 'Older';
      }

      if (!acc[dateGroup]) acc[dateGroup] = [];
      acc[dateGroup].push(chat);
      return acc;
    }, {});
  }, [chatDB.chats]);

  // Memoize active chat
  const activeChat = useMemo(() => {
    return chatDB.chats.find(c => c.chat_id === chatDB.currentChatId) || null;
  }, [chatDB.chats, chatDB.currentChatId]);

  const value = {
    // From useChatDB
    ...chatDB,
    
    // UI State
    sidebarOpen,
    setSidebarOpen,
    selectedModel,
    setSelectedModel,
    userName,
    editingMessageId,
    setEditingMessageId,
    groupedChats,

    // Computed
    activeChat,
    hasMessages: chatDB.activePath.length > 0
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};