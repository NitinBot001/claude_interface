// src/components/chat/ChatView.jsx
import { useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import EditMessageModal from './EditMessageModal';

export default function ChatView() {
  const { 
    activePath, 
    loading,
    editingMessageId
  } = useChat();
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activePath]);

  return (
    <div 
      className="flex-1 flex flex-col min-h-0"
      style={{ backgroundColor: '#121212' }}
    >
      {/* Messages area - scrollable */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto"
        style={{ backgroundColor: '#121212' }}
      >
        <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
          {loading && activePath.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent 
                              rounded-full animate-spin" />
            </div>
          ) : activePath.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No messages yet. Start a conversation!</p>
            </div>
          ) : (
            activePath.map((message) => (
              <ChatMessage key={message.msg_id} message={message} />
            ))
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input area - fixed at bottom */}
      <div 
        className="flex-shrink-0 border-t border-dark-600 p-4"
        style={{ backgroundColor: '#121212' }}
      >
        <ChatInput />
      </div>

      {/* Edit modal */}
      {editingMessageId && <EditMessageModal />}
    </div>
  );
}