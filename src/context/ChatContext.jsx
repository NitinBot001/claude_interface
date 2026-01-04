import { createContext, useContext, useState, useMemo } from 'react';
import { useChatDB } from '../hooks/useChatDB';
import { DEFAULT_MODEL } from '../constants/models';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const chatDB = useChatDB();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [userName] = useState('User');
  const [editingMessageId, setEditingMessageId] = useState(null);

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

  const activeChat = useMemo(() => {
    return chatDB.chats.find(c => c.chat_id === chatDB.currentChatId) || null;
  }, [chatDB.chats, chatDB.currentChatId]);

  const value = {
    ...chatDB,
    
    sidebarOpen,
    setSidebarOpen,
    selectedModel,
    setSelectedModel,
    userName,
    editingMessageId,
    setEditingMessageId,
    groupedChats,

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