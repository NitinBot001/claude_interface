const DB_NAME = 'ClaudeChatDB';
const DB_VERSION = 1;

const STORES = {
  MESSAGES: 'messages',
  CHATS: 'chats'
};

// Sentinel value for root messages (instead of null)
export const ROOT_PARENT = '__ROOT__';

// Database connection singleton
let dbInstance = null;

/**
 * Open or get existing database connection
 */
export async function openDB() {
  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      
      // Handle connection close
      dbInstance.onclose = () => {
        dbInstance = null;
      };
      
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Messages store
      if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
        const messageStore = db.createObjectStore(STORES.MESSAGES, { 
          keyPath: 'msg_id' 
        });
        
        // Indexes for efficient querying
        messageStore.createIndex('by_chat', 'chat_id', { unique: false });
        messageStore.createIndex('by_parent', 'parent_msg_id', { unique: false });
        messageStore.createIndex('by_msg_index', 'msg_index', { unique: false });
      }

      // Chats metadata store
      if (!db.objectStoreNames.contains(STORES.CHATS)) {
        const chatStore = db.createObjectStore(STORES.CHATS, { 
          keyPath: 'chat_id' 
        });
        
        chatStore.createIndex('by_date', 'updated_at', { unique: false });
        chatStore.createIndex('by_user', 'user_id', { unique: false });
      }
    };
  });
}

/**
 * Close database connection
 */
export async function closeDB() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Helper to normalize parent_msg_id (convert null to sentinel)
 */
function normalizeParentId(parentMsgId) {
  return parentMsgId === null || parentMsgId === undefined ? ROOT_PARENT : parentMsgId;
}

/**
 * Helper to denormalize parent_msg_id (convert sentinel back to null)
 */
function denormalizeParentId(parentMsgId) {
  return parentMsgId === ROOT_PARENT ? null : parentMsgId;
}

/**
 * Normalize message for storage
 */
function normalizeMessageForStorage(message) {
  return {
    ...message,
    parent_msg_id: normalizeParentId(message.parent_msg_id)
  };
}

/**
 * Denormalize message from storage
 */
function denormalizeMessageFromStorage(message) {
  if (!message) return null;
  return {
    ...message,
    parent_msg_id: denormalizeParentId(message.parent_msg_id)
  };
}

/**
 * Message operations
 */
export const MessageDB = {
  // Add a new message
  async add(message) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.MESSAGES, 'readwrite');
      const store = transaction.objectStore(STORES.MESSAGES);
      
      const normalizedMessage = normalizeMessageForStorage(message);
      const request = store.add(normalizedMessage);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  // Update existing message
  async update(message) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.MESSAGES, 'readwrite');
      const store = transaction.objectStore(STORES.MESSAGES);
      
      const normalizedMessage = normalizeMessageForStorage(message);
      const request = store.put(normalizedMessage);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  // Get message by ID
  async getById(msgId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.MESSAGES, 'readonly');
      const store = transaction.objectStore(STORES.MESSAGES);
      const request = store.get(msgId);
      
      request.onsuccess = () => {
        resolve(denormalizeMessageFromStorage(request.result));
      };
      request.onerror = () => reject(request.error);
    });
  },

  // Get all messages for a chat
  async getByChatId(chatId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.MESSAGES, 'readonly');
      const store = transaction.objectStore(STORES.MESSAGES);
      const index = store.index('by_chat');
      const request = index.getAll(chatId);
      
      request.onsuccess = () => {
        const messages = request.result.map(denormalizeMessageFromStorage);
        resolve(messages);
      };
      request.onerror = () => reject(request.error);
    });
  },

  // Get children of a message (for tree navigation)
  async getChildren(chatId, parentMsgId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.MESSAGES, 'readonly');
      const store = transaction.objectStore(STORES.MESSAGES);
      const index = store.index('by_chat');
      const request = index.getAll(chatId);
      
      request.onsuccess = () => {
        const normalizedParentId = normalizeParentId(parentMsgId);
        
        // Filter messages with matching parent
        const children = request.result
          .filter(msg => msg.parent_msg_id === normalizedParentId)
          .map(denormalizeMessageFromStorage)
          .sort((a, b) => (a.p_order ?? 0) - (b.p_order ?? 0));
        
        resolve(children);
      };
      request.onerror = () => reject(request.error);
    });
  },

  // Get siblings of a message (same parent)
  async getSiblings(chatId, parentMsgId) {
    return this.getChildren(chatId, parentMsgId);
  },

  // Get root messages (first messages in chat)
  async getRootMessages(chatId) {
    return this.getChildren(chatId, null);
  },

  // Count children of a message
  async countChildren(chatId, parentMsgId) {
    const children = await this.getChildren(chatId, parentMsgId);
    return children.length;
  },

  // Delete message by ID
  async delete(msgId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.MESSAGES, 'readwrite');
      const store = transaction.objectStore(STORES.MESSAGES);
      const request = store.delete(msgId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // Delete message and all descendants
  async deleteWithDescendants(msgId) {
    const message = await this.getById(msgId);
    if (!message) return;

    const children = await this.getChildren(message.chat_id, msgId);
    
    // Recursively delete children first
    for (const child of children) {
      await this.deleteWithDescendants(child.msg_id);
    }

    // Delete this message
    await this.delete(msgId);
  },

  // Delete all messages in a chat
  async deleteByChatId(chatId) {
    const messages = await this.getByChatId(chatId);
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.MESSAGES, 'readwrite');
      const store = transaction.objectStore(STORES.MESSAGES);
      
      let completed = 0;
      const total = messages.length;
      
      if (total === 0) {
        resolve();
        return;
      }
      
      messages.forEach(msg => {
        const request = store.delete(msg.msg_id);
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
      
      transaction.onerror = () => reject(transaction.error);
    });
  }
};

/**
 * Chat metadata operations
 */
export const ChatDB = {
  // Create new chat
  async create(chat) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.CHATS, 'readwrite');
      const store = transaction.objectStore(STORES.CHATS);
      
      const chatData = {
        ...chat,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const request = store.add(chatData);
      
      request.onsuccess = () => resolve(chatData);
      request.onerror = () => reject(request.error);
    });
  },

  // Update chat
  async update(chat) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.CHATS, 'readwrite');
      const store = transaction.objectStore(STORES.CHATS);
      
      const chatData = {
        ...chat,
        updated_at: new Date().toISOString()
      };
      
      const request = store.put(chatData);
      
      request.onsuccess = () => resolve(chatData);
      request.onerror = () => reject(request.error);
    });
  },

  // Get chat by ID
  async getById(chatId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.CHATS, 'readonly');
      const store = transaction.objectStore(STORES.CHATS);
      const request = store.get(chatId);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  // Get all chats
  async getAll() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.CHATS, 'readonly');
      const store = transaction.objectStore(STORES.CHATS);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  // Delete chat and all its messages
  async delete(chatId) {
    await MessageDB.deleteByChatId(chatId);
    
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.CHATS, 'readwrite');
      const store = transaction.objectStore(STORES.CHATS);
      const request = store.delete(chatId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // Update chat title
  async updateTitle(chatId, title) {
    const chat = await this.getById(chatId);
    if (chat) {
      return this.update({ ...chat, title });
    }
  }
};

/**
 * Calculate msg_index based on parent and p_order
 * Formula: parent_msg_index + (1 / 10^p_order)
 */
export function calculateMsgIndex(parentMsgIndex, pOrder) {
  // First message in chat (no parent)
  if (parentMsgIndex === null || parentMsgIndex === undefined) {
    return 1;
  }
  
  // Normalize p_order
  const order = pOrder ?? 0;
  
  // Calculate: parent_index + (1 / 10^order)
  return parentMsgIndex + (1 / Math.pow(10, order + 1));
}

/**
 * Get the next p_order for a new child of a parent
 */
export async function getNextPOrder(chatId, parentMsgId) {
  try {
    const siblings = await MessageDB.getChildren(chatId, parentMsgId);
    
    if (!siblings || siblings.length === 0) {
      return 0;
    }
    
    // Find the maximum p_order among siblings
    const maxOrder = siblings.reduce((max, sibling) => {
      const order = sibling.p_order ?? 0;
      return order > max ? order : max;
    }, -1);
    
    return maxOrder + 1;
  } catch (error) {
    console.error('Error getting next p_order:', error);
    return 0;
  }
}

/**
 * Clear all data (for testing/reset)
 */
export async function clearAllData() {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.MESSAGES, STORES.CHATS], 'readwrite');
    
    transaction.objectStore(STORES.MESSAGES).clear();
    transaction.objectStore(STORES.CHATS).clear();
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export { STORES };