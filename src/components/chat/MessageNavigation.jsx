import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MessageNavigation({ 
  currentIndex, 
  totalCount, 
  onPrevious, 
  onNext 
}) {
  if (totalCount <= 1) return null;

  const displayIndex = currentIndex + 1; // 1-based display

  return (
    <div 
      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
      style={{ backgroundColor: '#1E1E1E' }}
    >
      <button
        onClick={onPrevious}
        disabled={currentIndex === 0}
        className={`p-0.5 rounded transition-colors ${
          currentIndex === 0 
            ? 'text-gray-600 cursor-not-allowed' 
            : 'text-gray-400 hover:text-white hover:bg-dark-600'
        }`}
        aria-label="Previous version"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
      
      <span className="text-gray-400 min-w-[3rem] text-center font-medium">
        {displayIndex} / {totalCount}
      </span>
      
      <button
        onClick={onNext}
        disabled={currentIndex === totalCount - 1}
        className={`p-0.5 rounded transition-colors ${
          currentIndex === totalCount - 1 
            ? 'text-gray-600 cursor-not-allowed' 
            : 'text-gray-400 hover:text-white hover:bg-dark-600'
        }`}
        aria-label="Next version"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}