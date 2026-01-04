// src/components/chat/ImagePreview.jsx
import { useState } from 'react';
import { X, Image as ImageIcon, AlertCircle, ZoomIn } from 'lucide-react';

export default function ImagePreview({ 
  src, 
  onRemove, 
  size = 'md',
  showRemove = true,
  className = '',
  onClick
}) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const sizes = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
    full: 'max-w-full max-h-64'
  };

  if (error) {
    return (
      <div 
        className={`
          ${sizes[size]} rounded-lg flex items-center justify-center
          border border-red-500/30
          ${className}
        `}
        style={{ backgroundColor: '#1E1E1E' }}
      >
        <div className="text-center">
          <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />
          <span className="text-xs text-red-400">Failed</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Loading placeholder */}
      {!loaded && (
        <div 
          className={`
            ${sizes[size]} rounded-lg flex items-center justify-center
            animate-pulse
          `}
          style={{ backgroundColor: '#2A2A2A' }}
        >
          <ImageIcon className="w-6 h-6 text-gray-600" />
        </div>
      )}
      
      {/* Image */}
      <img
        src={src}
        alt="Preview"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        onClick={onClick}
        className={`
          ${sizes[size]} object-cover rounded-lg
          ${loaded ? 'block' : 'hidden'}
          ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}
        `}
      />
      
      {/* Zoom indicator */}
      {onClick && loaded && (
        <div className="absolute bottom-1 right-1 p-1 rounded bg-black/50">
          <ZoomIn className="w-3 h-3 text-white" />
        </div>
      )}
      
      {/* Remove button */}
      {showRemove && onRemove && loaded && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-2 -right-2 w-6 h-6 
                     rounded-full flex items-center justify-center
                     bg-red-500 hover:bg-red-600 
                     text-white transition-colors
                     shadow-lg"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}