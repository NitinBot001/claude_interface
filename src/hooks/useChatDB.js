import { useState, useEffect, useCallback, useRef } from 'react';
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

  // Ref to track if we should preserve selections on next load
  const preserveSelectionsRef = useRef(false);
  const pendingSelectionsRef = useRef(null);

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

  // Load messages for a chat (with option to preserve selections)
  const loadMessages = useCallback(async (chatId, preserveSelections = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const chatMessages = await MessageDB.getByChatId(chatId);
      setMessages(chatMessages);
      
      if (chatMessages.length > 0) {
        const tree = buildMessageTree(chatMessages);
        setMessageTree(tree);
        
        // Apply pending selections if any
        if (pendingSelectionsRef.current) {
          setSelectedVersions(prev => ({
            ...prev,
            ...pendingSelectionsRef.current
          }));
          pendingSelectionsRef.current = null;
        } else if (!preserveSelections && !preserveSelectionsRef.current) {
          // Only reset if not preserving
          setSelectedVersions({});
        }
        
        // Reset the preserve flag
        preserveSelectionsRef.current = false;
      } else {
        setMessageTree({ tree: [], messageMap: new Map() });
        if (!preserveSelections) {
          setSelectedVersions({});
        }
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new chat (internal use - returns chatId)
  const createChatInternal = useCallback(async (title = 'New Chat') => {
    try {
      setError(null);
      const chatId = generateChatId();
      
      await ChatDB.create({
        chat_id: chatId,
        title: title.slice(0, 50) + (title.length > 50 ? '...' : ''),
        user_id: 'default_user',
      });
      
      return chatId;
    } catch (err) {
      console.error('Failed to create chat:', err);
      setError(err.message);
      return null;
    }
  }, []);

  // Create a new chat (external use - also sets as current)
  const createChat = useCallback(async (title = 'New Chat') => {
    const chatId = await createChatInternal(title);
    if (chatId) {
      await loadChats();
      setCurrentChatId(chatId);
    }
    return chatId;
  }, [createChatInternal, loadChats]);

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
        setSelectedVersions({});
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
      let isNewChat = false;
      
      // Create chat if none exists
      if (!chatId) {
        chatId = await createChatInternal(userMessage);
        if (!chatId) return null;
        isNewChat = true;
        
        // Set current chat ID immediately
        setCurrentChatId(chatId);
      }

      // Capture current selections before any state changes
      const currentSelections = { ...selectedVersions };

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
      } else if (!isNewChat) {
        // Not a new chat but no active path - check for existing root messages
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
      
      // Update chat title if first message
      if (isNewChat) {
        // Title already set during creation
      } else {
        // Just update the timestamp
        const chat = await ChatDB.getById(chatId);
        if (chat) {
          await ChatDB.update(chat);
        }
      }

      // Preserve current selections and add selection for new message
      const newSelections = { ...currentSelections };
      const parentKey = parentMsgId ?? 'root';
      newSelections[parentKey] = pOrder;
      
      // Set pending selections to be applied after reload
      pendingSelectionsRef.current = newSelections;
      preserveSelectionsRef.current = true;

      await loadChats();
      await loadMessages(chatId, true);

      return newMessage;
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err.message);
      return null;
    }
  }, [currentChatId, activePath, selectedVersions, createChatInternal, loadChats, loadMessages]);

  // Edit a message (create a new sibling branch)
  const editMessage = useCallback(async (originalMsgId, newUserMessage, model, aiResponse) => {
    try {
      setError(null);
      
      const originalMessage = await MessageDB.getById(originalMsgId);
      if (!originalMessage) {
        throw new Error('Original message not found');
      }

      const chatId = originalMessage.chat_id;
      const parentMsgId = originalMessage.parent_msg_id;
      
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

      // Preserve current selections and update to select new branch
      const currentSelections = { ...selectedVersions };
      const parentKey = parentMsgId ?? 'root';
      currentSelections[parentKey] = pOrder;
      
      // Set pending selections
      pendingSelectionsRef.current = currentSelections;
      preserveSelectionsRef.current = true;

      await loadChats();
      await loadMessages(chatId, true);

      return editedMessage;
    } catch (err) {
      console.error('Failed to edit message:', err);
      setError(err.message);
      return null;
    }
  }, [selectedVersions, loadChats, loadMessages]);

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

      // Preserve selections when updating response
      preserveSelectionsRef.current = true;
      await loadMessages(message.chat_id, true);
    } catch (err) {
      console.error('Failed to update AI response:', err);
      setError(err.message);
    }
  }, [loadMessages]);

  // Regenerate AI response for a message
  const regenerateResponse = useCallback(async (msgId, newAiResponse) => {
    await updateAIResponse(msgId, newAiResponse);
  }, [updateAIResponse]);

  // Switch to a specific chat
  const switchChat = useCallback((chatId) => {
    if (chatId !== currentChatId) {
      // Reset selections when switching chats
      setSelectedVersions({});
      setCurrentChatId(chatId);
    }
  }, [currentChatId]);

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
    setCurrentChatId: switchChat,
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