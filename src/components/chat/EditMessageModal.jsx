import { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, Image as ImageIcon } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import ImagePreview from './ImagePreview';
import { fileToBase64, compressImage } from '../../lib/puter';
import { supportsVision } from '../../constants/models';

export default function EditMessageModal() {
  const { 
    editingMessageId, 
    setEditingMessageId,
    messageTree,
    editMessage,
    selectedModel
  } = useChat();

  const [editedText, setEditedText] = useState('');
  const [editedImage, setEditedImage] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState(null);
  
  const fileInputRef = useRef(null);

  const originalMessage = messageTree.messageMap.get(editingMessageId);

  useEffect(() => {
    if (originalMessage) {
      setEditedText(originalMessage.user_msg || '');
      setOriginalImage(originalMessage.user_image || null);
      setEditedImage(null);
      setImageError(null);
    }
  }, [originalMessage]);

  const handleClose = () => {
    if (!isSubmitting) {
      setEditingMessageId(null);
      setEditedText('');
      setEditedImage(null);
      setOriginalImage(null);
      setImageError(null);
    }
  };

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
      
      setEditedImage(base64);
    } catch (error) {
      console.error('Image processing error:', error);
      setImageError(error.message);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    if (editedImage && editedImage !== 'REMOVE') {
      setEditedImage(null);
    } else {
      setEditedImage('REMOVE');
    }
    setImageError(null);
  };

  const handleRestoreImage = () => {
    setEditedImage(null);
    setImageError(null);
  };

  const getCurrentImage = () => {
    if (editedImage === 'REMOVE') {
      return null;
    }
    if (editedImage) {
      return editedImage;
    }
    return originalImage;
  };

  const getImageForSubmit = () => {
    if (editedImage === 'REMOVE') {
      return null;
    }
    if (editedImage) {
      return editedImage;
    }
    return originalImage;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const trimmedText = editedText.trim();
    const imageToSubmit = getImageForSubmit();
    
    if (!trimmedText && !imageToSubmit) {
      setImageError('Please enter a message or attach an image');
      return;
    }

    const textUnchanged = trimmedText === (originalMessage?.user_msg || '');
    const imageUnchanged = editedImage === null;
    
    if (textUnchanged && imageUnchanged) {
      handleClose();
      return;
    }

    if (imageToSubmit && !supportsVision(selectedModel)) {
      setImageError('Selected model does not support images. Please remove the image or select a different model.');
      return;
    }

    setIsSubmitting(true);
    
    // Close the modal IMMEDIATELY before API call
    const msgIdToEdit = editingMessageId;
    const textToSubmit = trimmedText;
    const modelToUse = selectedModel;
    
    setEditingMessageId(null);
    setEditedText('');
    setEditedImage(null);
    setOriginalImage(null);
    setImageError(null);
    
    try {
      await editMessage(
        msgIdToEdit,
        textToSubmit,
        modelToUse,
        imageToSubmit
      );
    } catch (error) {
      console.error('Failed to edit message:', error);
      // Re-open modal on error? Or just show toast notification
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        handleClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isSubmitting]);

  if (!originalMessage || !editingMessageId) return null;

  const currentImage = getCurrentImage();
  const hasOriginalImage = !!originalImage;
  const isImageRemoved = editedImage === 'REMOVE';
  const hasNewImage = editedImage && editedImage !== 'REMOVE';

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 100 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          handleClose();
        }
      }}
    >
      <div 
        className="w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
        style={{ backgroundColor: '#1E1E1E' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-600 flex-shrink-0">
          <h3 className="text-lg font-medium text-white">Edit Message</h3>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 rounded-lg text-gray-400 hover:text-white 
                       hover:bg-dark-600 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 overflow-y-auto flex-1">
            {/* Original Message Display */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Original message
              </label>
              <div 
                className="p-3 rounded-lg"
                style={{ backgroundColor: '#121212' }}
              >
                {originalMessage.user_image && (
                  <div className="mb-2">
                    <img 
                      src={originalMessage.user_image} 
                      alt="Original" 
                      className="max-h-20 rounded-lg opacity-60"
                    />
                  </div>
                )}
                <p className="text-sm text-gray-500">
                  {originalMessage.user_msg || '(Image only)'}
                </p>
              </div>
            </div>

            {/* Image Section */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Image
                {hasOriginalImage && !isImageRemoved && !hasNewImage && (
                  <span className="text-gray-600 ml-2">(from original)</span>
                )}
                {hasNewImage && (
                  <span className="text-accent-500 ml-2">(new)</span>
                )}
                {isImageRemoved && (
                  <span className="text-red-400 ml-2">(will be removed)</span>
                )}
              </label>
              
              <div className="flex items-start gap-3">
                {currentImage && (
                  <div className="relative">
                    <ImagePreview
                      src={currentImage}
                      size="lg"
                      showRemove={false}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 w-6 h-6 
                                 rounded-full flex items-center justify-center
                                 bg-red-500 hover:bg-red-600 
                                 text-white transition-colors shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg
                               text-sm text-gray-300 hover:text-white
                               border border-dark-500 hover:border-dark-400
                               transition-colors disabled:opacity-50"
                    style={{ backgroundColor: '#121212' }}
                  >
                    <ImageIcon className="w-4 h-4" />
                    {currentImage ? 'Change Image' : 'Add Image'}
                  </button>

                  {isImageRemoved && hasOriginalImage && (
                    <button
                      type="button"
                      onClick={handleRestoreImage}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg
                                 text-sm text-accent-500 hover:text-accent-400
                                 border border-accent-500/30 hover:border-accent-500/50
                                 transition-colors disabled:opacity-50"
                      style={{ backgroundColor: 'rgba(255, 107, 58, 0.1)' }}
                    >
                      Restore Original
                    </button>
                  )}

                  {hasNewImage && hasOriginalImage && (
                    <button
                      type="button"
                      onClick={handleRestoreImage}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg
                                 text-sm text-gray-400 hover:text-gray-300
                                 transition-colors disabled:opacity-50"
                    >
                      Use Original Image
                    </button>
                  )}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              {imageError && (
                <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
                  <X className="w-4 h-4 flex-shrink-0" />
                  <span>{imageError}</span>
                </div>
              )}
            </div>

            {/* New Message Text */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                New message
              </label>
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={4}
                disabled={isSubmitting}
                className="w-full p-3 rounded-lg text-gray-100 resize-none
                           focus:outline-none focus:ring-2 focus:ring-accent-500/50
                           disabled:opacity-50"
                style={{ backgroundColor: '#121212' }}
                placeholder="Type your edited message..."
                autoFocus
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-dark-600 flex-shrink-0">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                This will create a new branch
              </p>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg text-gray-400 
                             hover:text-white hover:bg-dark-600 transition-colors
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (!editedText.trim() && !currentImage)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg 
                             transition-all duration-200
                             ${(editedText.trim() || currentImage) && !isSubmitting
                               ? 'bg-accent-500 hover:bg-accent-600 text-white'
                               : 'bg-dark-600 text-gray-500 cursor-not-allowed'
                             }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Edit
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}