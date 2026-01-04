// src/App.jsx
import { ChatProvider } from './context/ChatContext';
import { Sidebar, MainContent, MobileHeader } from './components';

function App() {
  return (
    <ChatProvider>
      <div 
        className="flex h-screen"
        style={{ backgroundColor: '#121212' }}
      >
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header */}
          <MobileHeader />
          
          {/* Main Content */}
          <MainContent />
        </div>
      </div>
    </ChatProvider>
  );
}

export default App;