import { MessageSquare, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import ConfirmModal from '../ui/ConfirmModal';

export default function ChatItem({ chat }) {
  const { 
    currentChatId, 
    setCurrentChatId, 
    deleteChat, 
    setSidebarOpen 
  } = useChat();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isActive = currentChatId === chat.chat_id;

  const handleClick = () => {
    if (currentChatId !== chat.chat_id) {
      setCurrentChatId(chat.chat_id);
    }
    setSidebarOpen(false);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      await deleteChat(chat.chat_id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        onClick={handleClick}
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
        
        {/* Delete button - always visible on mobile, hover on desktop */}
        {!isDeleting && (
          <button
            onClick={handleDeleteClick}
            className="p-1.5 rounded-md text-gray-500 
                       hover:text-red-400 transition-colors
                       opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
            style={{ backgroundColor: '#3A3A3A' }}
            aria-label="Delete chat"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
        
        {isDeleting && (
          <div className="w-3.5 h-3.5 border-2 border-gray-500 border-t-transparent 
                          rounded-full animate-spin" />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Chat"
        message={`Are you sure you want to delete "${chat.title || 'New Chat'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
}