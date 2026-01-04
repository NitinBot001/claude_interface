import { useState, useEffect } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export default function EditMessageModal() {
  const { 
    editingMessageId, 
    setEditingMessageId,
    messageTree,
    editMessage,
    selectedModel
  } = useChat();

  const [editedText, setEditedText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the original message
  const originalMessage = messageTree.messageMap.get(editingMessageId);

  useEffect(() => {
    if (originalMessage) {
      setEditedText(originalMessage.user_msg);
    }
  }, [originalMessage]);

  const handleClose = () => {
    setEditingMessageId(null);
    setEditedText('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editedText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Simulate AI response - replace with actual API call
      const simulatedResponse = `This is a simulated response to your edited message: "${editedText}"`;
      
      await editMessage(
        editingMessageId,
        editedText.trim(),
        selectedModel,
        simulatedResponse
      );
      
      handleClose();
    } catch (error) {
      console.error('Failed to edit message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!originalMessage) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 100 }}
    >
      <div 
        className="w-full max-w-lg rounded-2xl shadow-2xl"
        style={{ backgroundColor: '#1E1E1E' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-600">
          <h3 className="text-lg font-medium text-white">Edit Message</h3>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white 
                       hover:bg-dark-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              Original message
            </label>
            <p 
              className="text-sm text-gray-500 p-3 rounded-lg"
              style={{ backgroundColor: '#121212' }}
            >
              {originalMessage.user_msg}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              New message
            </label>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={4}
              className="w-full p-3 rounded-lg text-gray-100 resize-none
                         focus:outline-none focus:ring-2 focus:ring-accent-500/50"
              style={{ backgroundColor: '#121212' }}
              placeholder="Type your edited message..."
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-gray-400 
                         hover:text-white hover:bg-dark-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!editedText.trim() || isSubmitting}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg 
                         transition-all duration-200
                         ${editedText.trim() && !isSubmitting
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
        </form>
      </div>
    </div>
  );
}