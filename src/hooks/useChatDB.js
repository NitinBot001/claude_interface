// src/hooks/useChatDB.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageDB, ChatDB, calculateMsgIndex, getNextPOrder } from '../lib/db';
import { generateChatId, generateMsgId } from '../utils/uuid';
import { buildMessageTree, getActivePath } from '../utils/treeUtils';
import { sendChatMessageStream } from '../lib/puter';

export function useChatDB() {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageTree, setMessageTree] = useState({ tree: [], messageMap: new Map() });
  const [selectedVersions, setSelectedVersions] = useState({});
  const [activePath, setActivePath] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null); // null = not searching
  
  // Streaming state
  const [streamingMsgId, setStreamingMsgId] = useState(null);
  const [streamingContent, setStreamingContent] = useState('');

  const preserveSelectionsRef = useRef(false);
  const pendingSelectionsRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    loadChats();
  }, []);

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

  useEffect(() => {
    if (messageTree.tree.length > 0) {
      const path = getActivePath(messageTree.tree, selectedVersions);
      setActivePath(path);
    } else {
      setActivePath([]);
    }
  }, [messageTree, selectedVersions]);

  // Search functionality
  const searchChats = useCallback(async (query) => {
    const trimmedQuery = query.trim().toLowerCase();
    setSearchQuery(query);
    
    if (!trimmedQuery) {
      setSearchResults(null);
      return;
    }

    try {
      const results = [];
      
      for (const chat of chats) {
        // Check chat title
        const titleMatch = chat.title?.toLowerCase().includes(trimmedQuery);
        
        // Check messages in this chat
        const chatMessages = await MessageDB.getByChatId(chat.chat_id);
        const messageMatch = chatMessages.some(msg => 
          msg.user_msg?.toLowerCase().includes(trimmedQuery) ||
          msg.ai_response?.toLowerCase().includes(trimmedQuery)
        );
        
        if (titleMatch || messageMatch) {
          results.push({
            ...chat,
            matchType: titleMatch ? 'title' : 'content',
            matchCount: chatMessages.filter(msg => 
              msg.user_msg?.toLowerCase().includes(trimmedQuery) ||
              msg.ai_response?.toLowerCase().includes(trimmedQuery)
            ).length
          });
        }
      }
      
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    }
  }, [chats]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults(null);
  }, []);

  const loadChats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allChats = await ChatDB.getAll();
      
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

  const loadMessages = useCallback(async (chatId, preserveSelections = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const chatMessages = await MessageDB.getByChatId(chatId);
      setMessages(chatMessages);
      
      if (chatMessages.length > 0) {
        const tree = buildMessageTree(chatMessages);
        setMessageTree(tree);
        
        if (pendingSelectionsRef.current) {
          setSelectedVersions(prev => ({
            ...prev,
            ...pendingSelectionsRef.current
          }));
          pendingSelectionsRef.current = null;
        } else if (!preserveSelections && !preserveSelectionsRef.current) {
          setSelectedVersions({});
        }
        
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

  // Check if current chat is empty (no messages)
  const isCurrentChatEmpty = useCallback(async () => {
    if (!currentChatId) return true;
    
    const chatMessages = await MessageDB.getByChatId(currentChatId);
    return chatMessages.length === 0;
  }, [currentChatId]);

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

  // Fixed: Don't create new chat if current one is empty
  const createChat = useCallback(async (title = 'New Chat') => {
    // Check if current chat is empty
    const isEmpty = await isCurrentChatEmpty();
    
    if (isEmpty && currentChatId) {
      // Current chat is already empty, just return it
      return currentChatId;
    }

    const chatId = await createChatInternal(title);
    if (chatId) {
      await loadChats();
      setCurrentChatId(chatId);
      clearSearch();
    }
    return chatId;
  }, [createChatInternal, loadChats, isCurrentChatEmpty, currentChatId, clearSearch]);

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
      clearSearch();
    } catch (err) {
      console.error('Failed to delete chat:', err);
      setError(err.message);
    }
  }, [currentChatId, loadChats, clearSearch]);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStreamingMsgId(null);
    setStreamingContent('');
  }, []);

  // Send a new message with streaming
  const sendMessage = useCallback(async (userMessage, model, userImage = null) => {
    try {
      setError(null);
      let chatId = currentChatId;
      let isNewChat = false;
      
      if (!chatId) {
        chatId = await createChatInternal(userMessage || 'Image conversation');
        if (!chatId) return null;
        isNewChat = true;
        setCurrentChatId(chatId);
      }

      const currentSelections = { ...selectedVersions };

      let parentMsgId = null;
      let parentMsgIndex = null;
      let pOrder = 0;

      if (activePath.length > 0) {
        const lastMessage = activePath[activePath.length - 1];
        parentMsgId = lastMessage.msg_id;
        parentMsgIndex = lastMessage.msg_index;
        pOrder = await getNextPOrder(chatId, parentMsgId);
      } else if (!isNewChat) {
        pOrder = await getNextPOrder(chatId, null);
      }

      const msgIndex = calculateMsgIndex(parentMsgIndex, pOrder);
      const now = new Date().toISOString();
      const msgId = generateMsgId();

      const newMessage = {
        chat_id: chatId,
        msg_id: msgId,
        msg_index: msgIndex,
        parent_msg_id: parentMsgId,
        p_order: pOrder,
        user_msg: userMessage,
        user_image: userImage,
        model: model,
        time_stamp_user_msg: now,
        ai_response: '',
        time_stamp_ai_response: null
      };

      await MessageDB.add(newMessage);

      const newSelections = { ...currentSelections };
      const parentKey = parentMsgId ?? 'root';
      newSelections[parentKey] = pOrder;
      
      pendingSelectionsRef.current = newSelections;
      preserveSelectionsRef.current = true;

      await loadChats();
      await loadMessages(chatId, true);

      // Start streaming
      setStreamingMsgId(msgId);
      setStreamingContent('');

      abortControllerRef.current = new AbortController();

      try {
        const finalResponse = await sendChatMessageStream(
          userMessage || 'What do you see in this image?',
          userImage,
          {
            model,
            onChunk: (chunk, fullText) => {
              setStreamingContent(fullText);
            },
            onStart: () => {
              console.log('Streaming started');
            },
            onEnd: async (fullText) => {
              console.log('Streaming ended');
              
              const updatedMessage = {
                ...newMessage,
                ai_response: fullText,
                time_stamp_ai_response: new Date().toISOString()
              };

              await MessageDB.update(updatedMessage);
              
              if (isNewChat) {
                const title = userMessage 
                  ? userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : '')
                  : 'Image conversation';
                await ChatDB.updateTitle(chatId, title);
              } else {
                const chat = await ChatDB.getById(chatId);
                if (chat) await ChatDB.update(chat);
              }

              setStreamingMsgId(null);
              setStreamingContent('');

              preserveSelectionsRef.current = true;
              await loadChats();
              await loadMessages(chatId, true);
            },
            onError: (err) => {
              console.error('Streaming error:', err);
            }
          }
        );

        return newMessage;
      } catch (apiError) {
        console.error('AI API Error:', apiError);
        
        setStreamingMsgId(null);
        setStreamingContent('');

        const errorMessage = {
          ...newMessage,
          ai_response: `Error: ${apiError.message}`,
          time_stamp_ai_response: new Date().toISOString()
        };

        await MessageDB.update(errorMessage);
        preserveSelectionsRef.current = true;
        await loadMessages(chatId, true);
        
        throw apiError;
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err.message);
      setStreamingMsgId(null);
      setStreamingContent('');
      return null;
    }
  }, [currentChatId, activePath, selectedVersions, createChatInternal, loadChats, loadMessages]);

  // Fixed: Edit message - close modal immediately, preserve selection
  const editMessage = useCallback(async (originalMsgId, newUserMessage, model, userImage = null) => {
    try {
      setError(null);
      
      const originalMessage = await MessageDB.getById(originalMsgId);
      if (!originalMessage) {
        throw new Error('Original message not found');
      }

      const chatId = originalMessage.chat_id;
      const parentMsgId = originalMessage.parent_msg_id;
      
      let parentMsgIndex = null;
      if (parentMsgId) {
        const parentMessage = await MessageDB.getById(parentMsgId);
        if (parentMessage) {
          parentMsgIndex = parentMessage.msg_index;
        }
      }

      const pOrder = await getNextPOrder(chatId, parentMsgId);
      const msgIndex = calculateMsgIndex(parentMsgIndex, pOrder);
      const now = new Date().toISOString();
      const msgId = generateMsgId();

      const imageToUse = userImage;

      const editedMessage = {
        chat_id: chatId,
        msg_id: msgId,
        msg_index: msgIndex,
        parent_msg_id: parentMsgId,
        p_order: pOrder,
        user_msg: newUserMessage,
        user_image: imageToUse,
        model: model,
        time_stamp_user_msg: now,
        ai_response: '',
        time_stamp_ai_response: null
      };

      await MessageDB.add(editedMessage);

      // Prepare selections for the new branch
      const currentSelections = { ...selectedVersions };
      const parentKey = parentMsgId ?? 'root';
      currentSelections[parentKey] = pOrder;
      
      // Set pending selections BEFORE loading messages
      pendingSelectionsRef.current = currentSelections;
      preserveSelectionsRef.current = true;

      // Load messages first to show the new message
      await loadChats();
      await loadMessages(chatId, true);

      // Start streaming
      setStreamingMsgId(msgId);
      setStreamingContent('');

      try {
        await sendChatMessageStream(
          newUserMessage || 'What do you see in this image?',
          imageToUse,
          {
            model,
            onChunk: (chunk, fullText) => {
              setStreamingContent(fullText);
            },
            onEnd: async (fullText) => {
              const updatedMessage = {
                ...editedMessage,
                ai_response: fullText,
                time_stamp_ai_response: new Date().toISOString()
              };

              await MessageDB.update(updatedMessage);
              
              const chat = await ChatDB.getById(chatId);
              if (chat) await ChatDB.update(chat);

              setStreamingMsgId(null);
              setStreamingContent('');

              // Preserve the selection for the edited message
              pendingSelectionsRef.current = currentSelections;
              preserveSelectionsRef.current = true;
              await loadChats();
              await loadMessages(chatId, true);
            }
          }
        );

        return editedMessage;
      } catch (apiError) {
        console.error('AI API Error:', apiError);
        
        setStreamingMsgId(null);
        setStreamingContent('');

        const errorMessage = {
          ...editedMessage,
          ai_response: `Error: ${apiError.message}`,
          time_stamp_ai_response: new Date().toISOString()
        };

        await MessageDB.update(errorMessage);
        
        // Still preserve selection even on error
        pendingSelectionsRef.current = currentSelections;
        preserveSelectionsRef.current = true;
        await loadMessages(chatId, true);
        
        throw apiError;
      }
    } catch (err) {
      console.error('Failed to edit message:', err);
      setError(err.message);
      setStreamingMsgId(null);
      setStreamingContent('');
      return null;
    }
  }, [selectedVersions, loadChats, loadMessages]);

  const selectVersion = useCallback((parentMsgId, versionIndex) => {
    const parentKey = parentMsgId ?? 'root';
    setSelectedVersions(prev => ({
      ...prev,
      [parentKey]: versionIndex
    }));
  }, []);

  const regenerateResponse = useCallback(async (msgId, userMessage = null, userImage = null) => {
    try {
      setError(null);
      const message = await MessageDB.getById(msgId);
      if (!message) return;

      const textToUse = userMessage ?? message.user_msg;
      const imageToUse = userImage !== undefined ? userImage : message.user_image;

      await MessageDB.update({
        ...message,
        ai_response: '',
        time_stamp_ai_response: null
      });

      preserveSelectionsRef.current = true;
      await loadMessages(message.chat_id, true);

      setStreamingMsgId(msgId);
      setStreamingContent('');

      await sendChatMessageStream(
        textToUse || 'What do you see in this image?',
        imageToUse,
        {
          model: message.model,
          onChunk: (chunk, fullText) => {
            setStreamingContent(fullText);
          },
          onEnd: async (fullText) => {
            await MessageDB.update({
              ...message,
              ai_response: fullText,
              time_stamp_ai_response: new Date().toISOString()
            });

            setStreamingMsgId(null);
            setStreamingContent('');

            preserveSelectionsRef.current = true;
            await loadMessages(message.chat_id, true);
          }
        }
      );
    } catch (err) {
      console.error('Failed to regenerate response:', err);
      setError(err.message);
      
      setStreamingMsgId(null);
      setStreamingContent('');

      const message = await MessageDB.getById(msgId);
      if (message) {
        await MessageDB.update({
          ...message,
          ai_response: `Error: ${err.message}`,
          time_stamp_ai_response: new Date().toISOString()
        });
        preserveSelectionsRef.current = true;
        await loadMessages(message.chat_id, true);
      }
    }
  }, [loadMessages]);

  const switchChat = useCallback((chatId) => {
    if (chatId !== currentChatId) {
      stopStreaming();
      setSelectedVersions({});
      setCurrentChatId(chatId);
      clearSearch();
    }
  }, [currentChatId, stopStreaming, clearSearch]);

  return {
    chats,
    currentChatId,
    messages,
    messageTree,
    activePath,
    selectedVersions,
    loading,
    error,
    
    // Search
    searchQuery,
    searchResults,
    searchChats,
    clearSearch,
    
    // Streaming state
    streamingMsgId,
    streamingContent,
    isStreaming: !!streamingMsgId,

    setCurrentChatId: switchChat,
    createChat,
    deleteChat,
    sendMessage,
    editMessage,
    selectVersion,
    regenerateResponse,
    stopStreaming,
    loadChats,
    loadMessages
  };
}