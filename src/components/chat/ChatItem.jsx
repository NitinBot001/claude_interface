import { MessageSquare, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useChat } from '../../context/ChatContext';

export default function ChatItem({ chat }) {
  const { 
    currentChatId, 
    setCurrentChatId, 
    deleteChat, 
    setSidebarOpen 
  } = useChat();
  
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isActive = currentChatId === chat.chat_id;

  const handleClick = () => {
    if (currentChatId !== chat.chat_id) {
      setCurrentChatId(chat.chat_id);
    }
    setSidebarOpen(false);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      await deleteChat(chat.chat_id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={`
        flex items-center gap-3 p-3 rounded-lg cursor-pointer 
        transition-all duration-200 group
        ${isActive ? 'bg-dark-700' : 'hover:bg-dark-700'}
      `}
      style={{ backgroundColor: isActive ? '#1E1E1E' : undefined }}
    >
      <MessageSquare className="w-4 h-4 text-gray-500 flex-shrink-0" />
      <span className="flex-1 text-sm text-gray-300 truncate">
        {chat.title || 'New Chat'}
      </span>
      
      {showActions && !isDeleting && (
        <button
          onClick={handleDelete}
          className="p-1.5 rounded-md text-gray-500 
                     hover:text-red-400 transition-colors"
          style={{ backgroundColor: '#3A3A3A' }}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
      
      {isDeleting && (
        <div className="w-3.5 h-3.5 border-2 border-gray-500 border-t-transparent 
                        rounded-full animate-spin" />
      )}
    </div>
  );
}