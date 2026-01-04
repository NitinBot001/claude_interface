// src/components/layout/Sidebar.jsx
import { 
  Plus, 
  Search, 
  Settings, 
  HelpCircle, 
  X 
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import ChatHistory from '../chat/ChatHistory';
import IconButton from '../ui/IconButton';

export default function Sidebar() {
  const { 
    sidebarOpen, 
    setSidebarOpen, 
    createChat,
    searchQuery,
    searchChats,
    clearSearch
  } = useChat();

  const handleNewChat = async () => {
    await createChat('New Chat');
    setSidebarOpen(false);
  };

  const handleSearchChange = (e) => {
    searchChats(e.target.value);
  };

  const handleClearSearch = () => {
    clearSearch();
  };

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 lg:hidden"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 40 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0
          w-72 flex flex-col
          border-r border-dark-600
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ 
          backgroundColor: '#171617',
          zIndex: 50 
        }}
      >
        {/* Header */}
        <div 
          className="flex-shrink-0 p-4 flex items-center justify-between border-b border-dark-600"
          style={{ backgroundColor: '#171617' }}
        >
          <h1 className="text-lg font-semibold text-white">Nit-AI</h1>
          <div className="flex items-center gap-2">
            <IconButton 
              onClick={handleNewChat}
              aria-label="New chat"
            >
              <Plus className="w-5 h-5" />
            </IconButton>
            <IconButton 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </IconButton>
          </div>
        </div>

        {/* Search */}
        <div className="flex-shrink-0 p-3" style={{ backgroundColor: '#171617' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search chats..."
              className="w-full rounded-lg pl-10 pr-10 py-2.5
                         text-sm text-gray-100 placeholder:text-gray-500
                         focus:outline-none focus:ring-2 focus:ring-accent-500/50
                         border border-dark-600"
              style={{ backgroundColor: '#1E1E1E' }}
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 
                           text-gray-500 hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* New Chat Button */}
        <div className="flex-shrink-0 px-3 pb-3" style={{ backgroundColor: '#171617' }}>
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-3 px-4 py-3 
                       border border-accent-500/30 rounded-xl
                       text-accent-500 hover:border-accent-500/50
                       transition-all duration-200"
            style={{ backgroundColor: 'rgba(255, 107, 58, 0.1)' }}
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">New Chat</span>
          </button>
        </div>

        {/* Chat History - scrollable */}
        <div 
          className="flex-1 overflow-y-auto min-h-0"
          style={{ backgroundColor: '#171617' }}
        >
          <ChatHistory />
        </div>

        {/* Footer */}
        <div 
          className="flex-shrink-0 p-3 border-t border-dark-600"
          style={{ backgroundColor: '#171617' }}
        >
          <div className="flex items-center gap-2">
            <IconButton aria-label="Help">
              <HelpCircle className="w-5 h-5" />
            </IconButton>
            <IconButton aria-label="Settings">
              <Settings className="w-5 h-5" />
            </IconButton>
          </div>
          
          {/* User profile */}
          <div 
            className="mt-3 flex items-center gap-3 p-2 rounded-lg 
                       hover:bg-dark-700 cursor-pointer transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br 
                            from-accent-500 to-accent-600 
                            flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-white">U</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-100 truncate">User</p>
              <p className="text-xs text-gray-500 truncate">Free Plan</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}