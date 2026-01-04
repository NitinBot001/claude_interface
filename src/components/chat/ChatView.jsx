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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activePath]);

  return (
    <div className="flex-1 flex flex-col" style={{ backgroundColor: '#121212' }}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {loading ? (
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
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div 
        className="p-4 border-t border-dark-600"
        style={{ backgroundColor: '#121212' }}
      >
        <ChatInput />
      </div>

      {/* Edit modal */}
      {editingMessageId && <EditMessageModal />}
    </div>
  );
}