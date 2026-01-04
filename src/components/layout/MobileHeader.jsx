import { Menu, Plus } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import IconButton from '../ui/IconButton';

export default function MobileHeader() {
  const { setSidebarOpen, createChat } = useChat();

  const handleNewChat = async () => {
    await createChat('New Chat');
  };

  return (
    <header 
      className="lg:hidden fixed top-0 left-0 right-0 border-b border-dark-600 flex-shrink-0"
      style={{ 
        backgroundColor: '#171617',
        zIndex: 30,
        height: '56px'
      }}
    >
      <div className="flex items-center justify-between px-4 h-full">
        <IconButton 
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </IconButton>
        
        <h1 className="text-lg font-semibold text-white">Claude</h1>
        
        <IconButton 
          onClick={handleNewChat}
          aria-label="New chat"
        >
          <Plus className="w-5 h-5" />
        </IconButton>
      </div>
    </header>
  );
}