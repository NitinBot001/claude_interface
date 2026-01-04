import { useState } from 'react';
import { User, Bot, Pencil, Copy, Check, RotateCcw } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import MessageNavigation from './MessageNavigation';

export default function ChatMessage({ message }) {
  const { 
    selectVersion, 
    setEditingMessageId,
    selectedModel 
  } = useChat();
  
  const [copied, setCopied] = useState(false);
  
  const {
    msg_id,
    user_msg,
    ai_response,
    parent_msg_id,
    siblingCount,
    siblingIndex,
    model,
    time_stamp_user_msg
  } = message;

  const handleCopy = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePreviousVersion = () => {
    if (siblingIndex > 0) {
      selectVersion(parent_msg_id, siblingIndex - 1);
    }
  };

  const handleNextVersion = () => {
    if (siblingIndex < siblingCount - 1) {
      selectVersion(parent_msg_id, siblingIndex + 1);
    }
  };

  const handleEdit = () => {
    setEditingMessageId(msg_id);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-4">
      {/* User Message */}
      <div className="flex gap-3 justify-end">
        <div className="flex flex-col items-end max-w-[80%]">
          <div 
            className="rounded-2xl rounded-tr-sm px-4 py-3"
            style={{ backgroundColor: '#FF6B3A' }}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-white">
              {user_msg}
            </p>
          </div>
          
          {/* User message footer */}
          <div className="flex items-center gap-2 mt-1.5 px-1">
            {/* Version navigation */}
            <MessageNavigation
              currentIndex={siblingIndex}
              totalCount={siblingCount}
              onPrevious={handlePreviousVersion}
              onNext={handleNextVersion}
            />
            
            {/* Edit button */}
            <button
              onClick={handleEdit}
              className="p-1 rounded text-gray-500 hover:text-gray-300 
                         hover:bg-dark-700 transition-colors"
              title="Edit message"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            
            {/* Timestamp */}
            <span className="text-xs text-gray-600">
              {formatTime(time_stamp_user_msg)}
            </span>
          </div>
        </div>
        
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#FF6B3A' }}
        >
          <User className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* AI Response */}
      {ai_response && (
        <div className="flex gap-3">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#3A3A3A' }}
          >
            <Bot className="w-4 h-4 text-gray-300" />
          </div>
          
          <div className="flex flex-col max-w-[80%]">
            <div 
              className="rounded-2xl rounded-tl-sm px-4 py-3"
              style={{ backgroundColor: '#1E1E1E' }}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-100">
                {ai_response}
              </p>
            </div>
            
            {/* AI message footer */}
            <div className="flex items-center gap-2 mt-1.5 px-1">
              <span 
                className="text-xs px-2 py-0.5 rounded"
                style={{ backgroundColor: '#1E1E1E', color: '#9CA3AF' }}
              >
                {model || selectedModel}
              </span>
              
              <button
                onClick={() => handleCopy(ai_response)}
                className="p-1 rounded text-gray-500 hover:text-gray-300 
                           hover:bg-dark-700 transition-colors"
                title="Copy response"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              
              <button
                className="p-1 rounded text-gray-500 hover:text-gray-300 
                           hover:bg-dark-700 transition-colors"
                title="Regenerate response"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}