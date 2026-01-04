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
  const { sidebarOpen, setSidebarOpen, createNewChat } = useChat();

  return (
    <>
      {/* Overlay for mobile - solid dark overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - SOLID background */}
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
          className="p-4 flex items-center justify-between border-b border-dark-600"
          style={{ backgroundColor: '#171617' }}
        >
          <h1 className="text-lg font-semibold text-white">Claude</h1>
          <div className="flex items-center gap-2">
            <IconButton 
              onClick={createNewChat}
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
        <div className="p-3" style={{ backgroundColor: '#171617' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full rounded-lg pl-10 pr-4 py-2.5
                         text-sm text-gray-100 placeholder:text-gray-500
                         focus:outline-none focus:ring-2 focus:ring-accent-500/50
                         border border-dark-600"
              style={{ backgroundColor: '#1E1E1E' }}
            />
          </div>
        </div>

        {/* New Chat Button */}
        <div className="px-3 pb-3" style={{ backgroundColor: '#171617' }}>
          <button
            onClick={createNewChat}
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

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#171617' }}>
          <ChatHistory />
        </div>

        {/* Footer */}
        <div 
          className="p-3 border-t border-dark-600"
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
                            flex items-center justify-center">
              <span className="text-sm font-medium text-white">T</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-100 truncate">Toy</p>
              <p className="text-xs text-gray-500 truncate">Free Plan</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}