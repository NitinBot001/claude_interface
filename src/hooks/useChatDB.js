import { useState, useEffect, useCallback } from 'react';
import { MessageDB, ChatDB, calculateMsgIndex, getNextPOrder } from '../lib/db';
import { generateChatId, generateMsgId } from '../utils/uuid';
import { buildMessageTree, getActivePath } from '../utils/treeUtils';

export function useChatDB() {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageTree, setMessageTree] = useState({ tree: [], messageMap: new Map() });
  const [selectedVersions, setSelectedVersions] = useState({});
  const [activePath, setActivePath] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all chats on mount
  useEffect(() => {
    loadChats();
  }, []);

  // Load messages when chat changes
  useEffect(() => {
    if (currentChatId) {
      loadMessages(currentChatId);
    } else {
      setMessages([]);
      setMessageTree({ tree: [], messageMap: new Map() });
      setActivePath([]);
      setSelectedVersions({});
    }
  }, [currentChatId]);

  // Update active path when tree or selections change
  useEffect(() => {
    if (messageTree.tree.length > 0) {
      const path = getActivePath(messageTree.tree, selectedVersions);
      setActivePath(path);
    } else {
      setActivePath([]);
    }
  }, [messageTree, selectedVersions]);

  // Load all chats
  const loadChats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allChats = await ChatDB.getAll();
      
      // Sort by updated_at descending
      allChats.sort((a, b) => 
        new Date(b.updated_at) - new Date(a.updated_at)
      );
      
      setChats(allChats);
    } catch (err) {
      console.error('Failed to load chats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load messages for a chat
  const loadMessages = useCallback(async (chatId) => {
    try {
      setLoading(true);
      setError(null);
      
      const chatMessages = await MessageDB.getByChatId(chatId);
      setMessages(chatMessages);
      
      if (chatMessages.length > 0) {
        const tree = buildMessageTree(chatMessages);
        setMessageTree(tree);
      } else {
        setMessageTree({ tree: [], messageMap: new Map() });
      }
      
      // Reset version selections when loading new chat
      setSelectedVersions({});
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new chat
  const createChat = useCallback(async (title = 'New Chat') => {
    try {
      setError(null);
      const chatId = generateChatId();
      
      const newChat = await ChatDB.create({
        chat_id: chatId,
        title: title.slice(0, 50) + (title.length > 50 ? '...' : ''),
        user_id: 'default_user',
      });
      
      await loadChats();
      setCurrentChatId(chatId);
      
      return chatId;
    } catch (err) {
      console.error('Failed to create chat:', err);
      setError(err.message);
      return null;
    }
  }, [loadChats]);

  // Delete a chat
  const deleteChat = useCallback(async (chatId) => {
    try {
      setError(null);
      await ChatDB.delete(chatId);
      
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
        setMessageTree({ tree: [], messageMap: new Map() });
        setActivePath([]);
      }
      
      await loadChats();
    } catch (err) {
      console.error('Failed to delete chat:', err);
      setError(err.message);
    }
  }, [currentChatId, loadChats]);

  // Send a new message (first message or reply to current path end)
  const sendMessage = useCallback(async (userMessage, model, aiResponse) => {
    try {
      setError(null);
      let chatId = currentChatId;
      
      // Create chat if none exists
      if (!chatId) {
        chatId = await createChat(userMessage);
        if (!chatId) return null;
      }

      // Determine parent and calculate index
      let parentMsgId = null;
      let parentMsgIndex = null;
      let pOrder = 0;

      if (activePath.length > 0) {
        // Reply to the last message in active path
        const lastMessage = activePath[activePath.length - 1];
        parentMsgId = lastMessage.msg_id;
        parentMsgIndex = lastMessage.msg_index;
        
        // Get next p_order for this parent
        pOrder = await getNextPOrder(chatId, parentMsgId);
      } else {
        // First message - check if there are existing root messages
        pOrder = await getNextPOrder(chatId, null);
      }

      const msgIndex = calculateMsgIndex(parentMsgIndex, pOrder);
      const now = new Date().toISOString();

      const newMessage = {
        chat_id: chatId,
        msg_id: generateMsgId(),
        msg_index: msgIndex,
        parent_msg_id: parentMsgId,
        p_order: pOrder,
        user_msg: userMessage,
        model: model,
        time_stamp_user_msg: now,
        ai_response: aiResponse,
        time_stamp_ai_response: now
      };

      await MessageDB.add(newMessage);
      
      // Update chat title if first message and title is default
      const chat = await ChatDB.getById(chatId);
      if (chat && (chat.title === 'New Chat' || !chat.title)) {
        await ChatDB.updateTitle(chatId, userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : ''));
      } else {
        // Just update the timestamp
        await ChatDB.update(chat);
      }

      await loadChats();
      await loadMessages(chatId);

      return newMessage;
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err.message);
      return null;
    }
  }, [currentChatId, activePath, createChat, loadChats, loadMessages]);

  // Edit a message (create a new sibling branch)
  const editMessage = useCallback(async (originalMsgId, newUserMessage, model, aiResponse) => {
    try {
      setError(null);
      
      const originalMessage = await MessageDB.getById(originalMsgId);
      if (!originalMessage) {
        throw new Error('Original message not found');
      }

      const chatId = originalMessage.chat_id;
      const parentMsgId = originalMessage.parent_msg_id; // This is already denormalized (null for root)
      
      // Get parent's msg_index
      let parentMsgIndex = null;
      if (parentMsgId) {
        const parentMessage = await MessageDB.getById(parentMsgId);
        if (parentMessage) {
          parentMsgIndex = parentMessage.msg_index;
        }
      }

      // Get next p_order among siblings
      const pOrder = await getNextPOrder(chatId, parentMsgId);
      const msgIndex = calculateMsgIndex(parentMsgIndex, pOrder);
      const now = new Date().toISOString();

      const editedMessage = {
        chat_id: chatId,
        msg_id: generateMsgId(),
        msg_index: msgIndex,
        parent_msg_id: parentMsgId,
        p_order: pOrder,
        user_msg: newUserMessage,
        model: model,
        time_stamp_user_msg: now,
        ai_response: aiResponse,
        time_stamp_ai_response: now
      };

      await MessageDB.add(editedMessage);
      
      // Update chat timestamp
      const chat = await ChatDB.getById(chatId);
      if (chat) {
        await ChatDB.update(chat);
      }

      await loadChats();
      await loadMessages(chatId);

      // Select the new version
      const parentKey = parentMsgId ?? 'root';
      setSelectedVersions(prev => ({
        ...prev,
        [parentKey]: pOrder
      }));

      return editedMessage;
    } catch (err) {
      console.error('Failed to edit message:', err);
      setError(err.message);
      return null;
    }
  }, [loadChats, loadMessages]);

  // Navigate to a different version of a message
  const selectVersion = useCallback((parentMsgId, versionIndex) => {
    const parentKey = parentMsgId ?? 'root';
    setSelectedVersions(prev => ({
      ...prev,
      [parentKey]: versionIndex
    }));
  }, []);

  // Update AI response for a message
  const updateAIResponse = useCallback(async (msgId, aiResponse) => {
    try {
      setError(null);
      const message = await MessageDB.getById(msgId);
      if (!message) return;

      await MessageDB.update({
        ...message,
        ai_response: aiResponse,
        time_stamp_ai_response: new Date().toISOString()
      });

      await loadMessages(message.chat_id);
    } catch (err) {
      console.error('Failed to update AI response:', err);
      setError(err.message);
    }
  }, [loadMessages]);

  // Regenerate AI response for a message
  const regenerateResponse = useCallback(async (msgId, newAiResponse) => {
    await updateAIResponse(msgId, newAiResponse);
  }, [updateAIResponse]);

  return {
    // State
    chats,
    currentChatId,
    messages,
    messageTree,
    activePath,
    selectedVersions,
    loading,
    error,

    // Actions
    setCurrentChatId,
    createChat,
    deleteChat,
    sendMessage,
    editMessage,
    selectVersion,
    updateAIResponse,
    regenerateResponse,
    loadChats,
    loadMessages
  };
}