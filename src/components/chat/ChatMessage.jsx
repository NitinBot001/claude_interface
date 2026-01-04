// src/components/chat/ChatMessage.jsx
import { useState } from 'react';
import { User, Bot, Pencil, Copy, Check, RotateCcw, Image as ImageIcon, Square } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import MessageNavigation from './MessageNavigation';
import ImagePreview from './ImagePreview';
import MarkdownRenderer from './MarkdownRenderer';
import { getModelLabel } from '../../constants/models';

export default function ChatMessage({ message }) {
  const { 
    selectVersion, 
    setEditingMessageId,
    regenerateResponse,
    selectedModel,
    streamingMsgId,
    streamingContent,
    stopStreaming,
    isStreaming: globalIsStreaming
  } = useChat();
  
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  
  const {
    msg_id,
    user_msg,
    user_image,
    ai_response,
    parent_msg_id,
    siblingCount,
    siblingIndex,
    model,
    time_stamp_user_msg,
    time_stamp_ai_response
  } = message;

  const isStreaming = streamingMsgId === msg_id;
  const displayResponse = isStreaming ? streamingContent : ai_response;

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
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
    if (!globalIsStreaming) {
      setEditingMessageId(msg_id);
    }
  };

  const handleRegenerate = async () => {
    if (isRegenerating || isStreaming || globalIsStreaming) return;
    
    setIsRegenerating(true);
    try {
      await regenerateResponse(msg_id, user_msg, user_image);
    } catch (error) {
      console.error('Failed to regenerate:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleStopStreaming = () => {
    stopStreaming();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const displayModel = getModelLabel(model || selectedModel);

  // Common styles
  const avatarStyle = {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  };

  const actionButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 8px',
    fontSize: '12px',
    color: '#a1a1aa',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  };

  return (
    <div style={{ marginBottom: '32px' }}>
      {/* User Message */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        {/* User Avatar */}
        <div style={{
          ...avatarStyle,
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)'
        }}>
          <User style={{ width: '20px', height: '20px', color: 'white' }} />
        </div>
        
        {/* User Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '8px'
          }}>
            <span style={{ fontWeight: 600, color: '#ffffff' }}>You</span>
            <span style={{ fontSize: '12px', color: '#71717a' }}>
              {formatTime(time_stamp_user_msg)}
            </span>
          </div>
          
          {/* User Image */}
          {user_image && (
            <div style={{ marginBottom: '12px' }}>
              <div 
                onClick={() => setShowFullImage(!showFullImage)}
                style={{ 
                  display: 'inline-block',
                  cursor: 'pointer',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid #3d3d3d'
                }}
              >
                <ImagePreview
                  src={user_image}
                  size={showFullImage ? 'full' : 'xl'}
                  showRemove={false}
                />
              </div>
            </div>
          )}
          
          {/* User Text */}
          {user_msg && (
            <div style={{
              backgroundColor: '#27272a',
              borderRadius: '16px',
              borderTopLeftRadius: '4px',
              padding: '12px 16px',
              display: 'inline-block',
              maxWidth: '100%'
            }}>
              <p style={{
                color: '#fafafa',
                fontSize: '15px',
                lineHeight: '1.6',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {user_msg}
              </p>
            </div>
          )}
          
          {/* User Actions */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginTop: '8px',
            flexWrap: 'wrap'
          }}>
            <MessageNavigation
              currentIndex={siblingIndex}
              totalCount={siblingCount}
              onPrevious={handlePreviousVersion}
              onNext={handleNextVersion}
            />
            
            <button
              onClick={handleEdit}
              disabled={globalIsStreaming}
              style={{
                ...actionButtonStyle,
                opacity: globalIsStreaming ? 0.5 : 1,
                cursor: globalIsStreaming ? 'not-allowed' : 'pointer'
              }}
              onMouseOver={(e) => {
                if (!globalIsStreaming) {
                  e.currentTarget.style.backgroundColor = '#27272a';
                  e.currentTarget.style.color = '#fafafa';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#a1a1aa';
              }}
            >
              <Pencil size={14} />
              <span>Edit</span>
            </button>
            
            {user_image && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                fontSize: '12px',
                color: '#71717a'
              }}>
                <ImageIcon size={14} />
                <span>Image</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Response */}
      {(displayResponse || isStreaming || ai_response === '') && (
        <div style={{ display: 'flex', gap: '16px' }}>
          {/* AI Avatar */}
          <div style={{
            ...avatarStyle,
            backgroundColor: '#27272a',
            border: '1px solid #3d3d3d'
          }}>
            <Bot style={{ width: '20px', height: '20px', color: '#a1a1aa' }} />
          </div>
          
          {/* AI Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              marginBottom: '8px',
              flexWrap: 'wrap'
            }}>
              <span style={{ fontWeight: 600, color: '#ffffff' }}>Claude</span>
              <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                backgroundColor: '#27272a',
                borderRadius: '9999px',
                color: '#a1a1aa'
              }}>
                {displayModel}
              </span>
              {time_stamp_ai_response && !isStreaming && (
                <span style={{ fontSize: '12px', color: '#71717a' }}>
                  {formatTime(time_stamp_ai_response)}
                </span>
              )}
              {isStreaming && (
                <span style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: '#f97316'
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#f97316',
                    animation: 'pulse 1.5s infinite'
                  }} />
                  Generating...
                </span>
              )}
            </div>
            
            {/* Response Content */}
            <div style={{
              backgroundColor: '#18181b',
              borderRadius: '16px',
              borderTopLeftRadius: '4px',
              padding: '16px 20px',
              border: '1px solid #27272a'
            }}>
              {displayResponse ? (
                <MarkdownRenderer 
                  content={displayResponse} 
                  isStreaming={isStreaming}
                />
              ) : (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '8px 0'
                }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[0, 1, 2].map(i => (
                      <div 
                        key={i}
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#52525b',
                          animation: `bounce 1.4s infinite`,
                          animationDelay: `${i * 0.16}s`
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ color: '#71717a', fontSize: '14px' }}>
                    Thinking...
                  </span>
                </div>
              )}
            </div>
            
            {/* AI Actions */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              marginTop: '8px',
              flexWrap: 'wrap'
            }}>
              {isStreaming ? (
                <button
                  onClick={handleStopStreaming}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Square size={12} fill="currentColor" />
                  Stop
                </button>
              ) : displayResponse && (
                <>
                  <button
                    onClick={() => handleCopy(displayResponse)}
                    style={actionButtonStyle}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#27272a';
                      e.currentTarget.style.color = '#fafafa';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#a1a1aa';
                    }}
                  >
                    {copied ? (
                      <>
                        <Check size={14} style={{ color: '#22c55e' }} />
                        <span style={{ color: '#22c55e' }}>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleRegenerate}
                    disabled={isRegenerating || globalIsStreaming}
                    style={{
                      ...actionButtonStyle,
                      opacity: (isRegenerating || globalIsStreaming) ? 0.5 : 1,
                      cursor: (isRegenerating || globalIsStreaming) ? 'not-allowed' : 'pointer'
                    }}
                    onMouseOver={(e) => {
                      if (!isRegenerating && !globalIsStreaming) {
                        e.currentTarget.style.backgroundColor = '#27272a';
                        e.currentTarget.style.color = '#fafafa';
                      }
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#a1a1aa';
                    }}
                  >
                    <RotateCcw 
                      size={14} 
                      style={{ 
                        animation: isRegenerating ? 'spin 1s linear infinite' : 'none' 
                      }} 
                    />
                    <span>Regenerate</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Animations */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}