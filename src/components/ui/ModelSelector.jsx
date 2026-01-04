import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Sparkles, Zap, Brain } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

const models = [
  { id: 'sonnet-4.5', name: 'Sonnet 4.5', icon: Sparkles, description: 'Most capable' },
  { id: 'sonnet-4', name: 'Sonnet 4', icon: Zap, description: 'Fast & efficient' },
  { id: 'haiku-3.5', name: 'Haiku 3.5', icon: Brain, description: 'Quick responses' },
];

export default function ModelSelector() {
  const { selectedModel, setSelectedModel } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg 
                   hover:bg-dark-600 transition-colors duration-200"
      >
        <span className="text-sm text-gray-400 hidden sm:inline">
          {selectedModel}
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 
                     ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu - SOLID background with proper z-index */}
      {isOpen && (
        <div 
          className="absolute bottom-full right-0 mb-2 w-56 
                     rounded-xl shadow-2xl overflow-hidden
                     border border-dark-500"
          style={{ 
            backgroundColor: '#1E1E1E',
            zIndex: 100 
          }}
        >
          <div className="p-2">
            <p 
              className="text-xs text-gray-500 px-2 py-1.5 font-medium"
              style={{ backgroundColor: '#1E1E1E' }}
            >
              Select Model
            </p>
            {models.map((model) => {
              const Icon = model.icon;
              const isSelected = selectedModel === model.name;
              return (
                <button
                  key={model.id}
                  onClick={() => {
                    setSelectedModel(model.name);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg
                             transition-colors duration-200 ${
                               isSelected 
                                 ? 'text-accent-500' 
                                 : 'text-gray-300 hover:text-white'
                             }`}
                  style={{ 
                    backgroundColor: isSelected ? 'rgba(255, 107, 58, 0.15)' : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#3A3A3A';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Icon className="w-4 h-4" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{model.name}</p>
                    <p className="text-xs text-gray-500">{model.description}</p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-accent-500" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}