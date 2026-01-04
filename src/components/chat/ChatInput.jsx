// src/components/chat/ChatInput.jsx
import { useState, useRef } from 'react';
import { 
  Plus, 
  Mic, 
  Image as ImageIcon, 
  ArrowUp, 
  Loader2,
  X
} from 'lucide-react';
import IconButton from '../ui/IconButton';
import ModelSelector from '../ui/ModelSelector';
import ImagePreview from './ImagePreview';
import { useChat } from '../../context/ChatContext';
import { fileToBase64, compressImage } from '../../lib/puter';
import { supportsVision } from '../../constants/models';

export default function ChatInput() {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageError, setImageError] = useState(null);
  
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const { sendMessage, selectedModel } = useChat();

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!supportsVision(selectedModel)) {
      setImageError('Selected model does not support images');
      return;
    }

    try {
      setImageError(null);
      let base64 = await fileToBase64(file);
      
      if (file.size > 1024 * 1024) {
        base64 = await compressImage(base64, 1920, 0.85);
      }
      
      setSelectedImage(base64);
    } catch (error) {
      console.error('Image processing error:', error);
      setImageError(error.message);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImageError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const trimmedMessage = message.trim();
    if ((!trimmedMessage && !selectedImage) || isSubmitting) return;

    if (selectedImage && !supportsVision(selectedModel)) {
      setImageError('Selected model does not support images. Please remove the image or select a different model.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      setMessage('');
      const imageToSend = selectedImage;
      setSelectedImage(null);
      setImageError(null);
      
      await sendMessage(trimmedMessage, selectedModel, imageToSend);
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessage(trimmedMessage);
      if (selectedImage) {
        setSelectedImage(selectedImage);
      }
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

  const handleTextareaChange = (e) => {
    setMessage(e.target.value);
    
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const canSubmit = (message.trim() || selectedImage) && !isSubmitting;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit}>
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
          {/* Selected Image Preview */}
          {selectedImage && (
            <div className="px-4 pt-3">
              <ImagePreview
                src={selectedImage}
                onRemove={handleRemoveImage}
                size="md"
              />
            </div>
          )}

          {/* Image Error */}
          {imageError && (
            <div className="px-4 pt-3">
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <X className="w-4 h-4 flex-shrink-0" />
                <span>{imageError}</span>
              </div>
            </div>
          )}

          {/* Text Input - no overflow hidden here */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder={selectedImage ? "Add a message about this image..." : "Message Claude..."}
              rows={1}
              disabled={isSubmitting}
              className="w-full bg-transparent px-4 pt-3 pb-14 
                        rounded-xl focus:outline-none resize-none
                        text-gray-100 placeholder:text-gray-500 placeholder:italic
                        disabled:opacity-50"
              style={{ minHeight: '80px', maxHeight: '200px' }}
            />

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Bottom Toolbar */}
            <div 
              className="absolute left-2 right-2 bottom-2 
                        flex items-center justify-between rounded-lg p-1"
              style={{ backgroundColor: '#1E1E1E' }}
            >
              {/* Left actions */}
              <div className="flex items-center gap-1">
                <IconButton 
                  type="button"
                  aria-label="Add attachment" 
                  disabled={isSubmitting}
                  onClick={handleImageButtonClick}
                >
                  <Plus className="w-4 h-4" />
                </IconButton>
                
                <IconButton 
                  type="button"
                  aria-label="Voice input" 
                  className="hidden sm:flex"
                  disabled={isSubmitting}
                >
                  <Mic className="w-4 h-4" />
                </IconButton>
                
                <IconButton 
                  type="button"
                  aria-label="Upload image"
                  onClick={handleImageButtonClick}
                  disabled={isSubmitting}
                  className={selectedImage ? 'text-accent-500' : ''}
                >
                  <ImageIcon className="w-4 h-4" />
                </IconButton>
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-2">
                <ModelSelector disabled={isSubmitting} />
                
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={`
                    w-8 h-8 rounded-lg flex items-center justify-center
                    transition-all duration-200 group
                    ${canSubmit
                      ? 'btn-primary'
                      : 'bg-dark-600 cursor-not-allowed'
                    }
                  `}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <ArrowUp 
                      className={`w-4 h-4 transition-transform duration-200
                                ${canSubmit 
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
      </form>

      {/* Hint text */}
      <p className="text-xs text-gray-500 text-center mt-3">
        {selectedImage 
          ? 'Image attached. AI can analyze and discuss this image.'
          : 'Claude can make mistakes. Consider checking important information.'
        }
      </p>
    </div>
  );
}