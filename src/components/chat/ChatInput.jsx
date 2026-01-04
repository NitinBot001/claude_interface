import { useState, useRef } from 'react';
import { Plus, Mic, Image, ArrowUp, Paperclip, Loader2 } from 'lucide-react';
import IconButton from '../ui/IconButton';
import ModelSelector from '../ui/ModelSelector';
import { useChat } from '../../context/ChatContext';

export default function ChatInput() {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);
  
  const { 
    sendMessage, 
    selectedModel,
    currentChatId,
    createChat 
  } = useChat();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Ensure we have a chat
      if (!currentChatId) {
        await createChat(message.slice(0, 50));
      }

      // Simulate AI response - replace with actual API call
      const simulatedResponse = `This is a simulated response to: "${message}"

I'm Claude, an AI assistant. In a real implementation, this would be the actual response from the Claude API.`;

      await sendMessage(message.trim(), selectedModel, simulatedResponse);
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div 
        className={`
          rounded-2xl p-1 
          shadow-lg transition-all duration-300 
          border
          ${isFocused 
            ? 'shadow-accent-500/30 border-accent-500/50' 
            : 'shadow-accent-500/10 border-dark-600 hover:shadow-accent-500/20'
          }
        `}
        style={{ backgroundColor: '#1E1E1E' }}
      >
        <div className="relative">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="Message Claude..."
            rows={1}
            disabled={isSubmitting}
            className="w-full bg-transparent px-4 pt-3 pb-12 
                       rounded-xl focus:outline-none resize-none
                       text-gray-100 placeholder:text-gray-500 placeholder:italic
                       disabled:opacity-50"
            style={{ minHeight: '80px', maxHeight: '200px' }}
          />

          {/* Bottom toolbar */}
          <div 
            className="absolute left-2 right-2 bottom-2 
                       flex items-center justify-between rounded-lg p-1"
            style={{ backgroundColor: '#1E1E1E' }}
          >
            {/* Left actions */}
            <div className="flex items-center gap-1">
              <IconButton aria-label="Add attachment" disabled={isSubmitting}>
                <Plus className="w-4 h-4" />
              </IconButton>
              <IconButton 
                aria-label="Voice input" 
                className="hidden sm:flex"
                disabled={isSubmitting}
              >
                <Mic className="w-4 h-4" />
              </IconButton>
              <IconButton 
                aria-label="Upload image" 
                className="hidden sm:flex"
                disabled={isSubmitting}
              >
                <Image className="w-4 h-4" />
              </IconButton>
              <IconButton 
                aria-label="Attach file" 
                className="sm:hidden"
                disabled={isSubmitting}
              >
                <Paperclip className="w-4 h-4" />
              </IconButton>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <ModelSelector disabled={isSubmitting} />
              <button
                onClick={handleSubmit}
                disabled={!message.trim() || isSubmitting}
                className={`
                  w-8 h-8 rounded-lg flex items-center justify-center
                  transition-all duration-200 group
                  ${message.trim() && !isSubmitting
                    ? 'btn-primary'
                    : 'bg-dark-600 cursor-not-allowed'
                  }
                `}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                ) : (
                  <ArrowUp 
                    className={`w-4 h-4 transition-transform duration-200
                               ${message.trim() 
                                 ? 'text-white group-hover:-translate-y-0.5' 
                                 : 'text-gray-500'
                               }`} 
                  />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hint text */}
      <p className="text-xs text-gray-500 text-center mt-3">
        Claude can make mistakes. Consider checking important information.
      </p>
    </div>
  );
}