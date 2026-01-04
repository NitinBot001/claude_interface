// src/components/ui/ModelSelector.jsx
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { MODELS, getModelLabel, getModelProvider } from '../../constants/models';

export default function ModelSelector({ disabled = false }) {
  const { selectedModel, setSelectedModel } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Calculate dropdown position
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 400; // max height of dropdown
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      
      // Prefer opening upward, but check if there's enough space
      if (spaceAbove >= dropdownHeight || spaceAbove > spaceBelow) {
        // Open upward
        setDropdownPosition({
          bottom: window.innerHeight - rect.top + 8,
          left: rect.right - 288, // 288px = w-72
          openUpward: true
        });
      } else {
        // Open downward
        setDropdownPosition({
          top: rect.bottom + 8,
          left: rect.right - 288,
          openUpward: false
        });
      }
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        buttonRef.current && 
        !buttonRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Filter models based on search
  const filteredModels = MODELS.map(group => ({
    ...group,
    options: group.options.filter(opt =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opt.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.options.length > 0);

  const currentLabel = getModelLabel(selectedModel);
  const currentProvider = getModelProvider(selectedModel);

  const handleSelect = (modelValue) => {
    setSelectedModel(modelValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Dropdown content
  const dropdownContent = isOpen ? createPortal(
    <div 
      ref={dropdownRef}
      className="fixed w-72 rounded-xl shadow-2xl border border-dark-500"
      style={{ 
        backgroundColor: '#1E1E1E',
        zIndex: 9999,
        ...(dropdownPosition.openUpward 
          ? { bottom: dropdownPosition.bottom, left: Math.max(8, dropdownPosition.left) }
          : { top: dropdownPosition.top, left: Math.max(8, dropdownPosition.left) }
        ),
        maxHeight: '400px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Search Input */}
      <div 
        className="p-2 border-b border-dark-600 flex-shrink-0"
        style={{ backgroundColor: '#1E1E1E' }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search models..."
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm
                       text-gray-100 placeholder:text-gray-500
                       focus:outline-none focus:ring-2 focus:ring-accent-500/50"
            style={{ backgroundColor: '#121212' }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      {/* Models List */}
      <div 
        className="overflow-y-auto flex-1"
        style={{ maxHeight: '340px' }}
      >
        {filteredModels.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No models found
          </div>
        ) : (
          filteredModels.map((group) => (
            <div key={group.label}>
              {/* Group Header */}
              <div 
                className="px-3 py-2 text-xs font-semibold text-gray-500 
                           uppercase tracking-wider sticky top-0"
                style={{ backgroundColor: '#1E1E1E' }}
              >
                {group.label}
              </div>
              
              {/* Group Options */}
              {group.options.map((model) => {
                const isSelected = selectedModel === model.value;
                return (
                  <button
                    key={model.value}
                    onClick={() => handleSelect(model.value)}
                    className={`
                      w-full flex items-center justify-between 
                      px-3 py-2.5 text-left
                      transition-colors duration-150
                      ${isSelected 
                        ? 'text-accent-500' 
                        : 'text-gray-300 hover:text-white hover:bg-dark-600'
                      }
                    `}
                    style={{ 
                      backgroundColor: isSelected ? 'rgba(255, 107, 58, 0.1)' : undefined 
                    }}
                  >
                    <span className="text-sm truncate pr-2">{model.label}</span>
                    {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-1.5 px-2 py-1.5 rounded-lg 
          transition-colors duration-200
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-dark-600'
          }
          ${isOpen ? 'bg-dark-600' : ''}
        `}
      >
        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-500 hidden sm:block">
            {currentProvider}
          </span>
          <span className="text-sm text-gray-300 hidden sm:block">
            {currentLabel}
          </span>
          <span className="text-sm text-gray-400 sm:hidden">
            Model
          </span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 
                     ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      
      {dropdownContent}
    </>
  );
}