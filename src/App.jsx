import { ChatProvider } from './context/ChatContext';
import { Sidebar, MainContent, MobileHeader } from './components';

function App() {
  return (
    <ChatProvider>
      <div 
        className="flex h-screen overflow-hidden"
        style={{ backgroundColor: '#121212' }}
      >
        {/* Sidebar */}
        <Sidebar />
        
        {/* Mobile Header */}
        <MobileHeader />
        
        {/* Main Content Area */}
        <MainContent />
      </div>
    </ChatProvider>
  );
}

export default App;