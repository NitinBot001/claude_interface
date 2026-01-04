import { useChat } from '../../context/ChatContext';
import PlanBanner from '../ui/PlanBanner';
import Greeting from '../ui/Greeting';
import ChatInput from '../chat/ChatInput';
import ChatView from '../chat/ChatView';

export default function MainContent() {
  const { currentChatId, hasMessages } = useChat();

  return (
    <main 
      className="flex-1 flex flex-col min-h-0 pt-14 lg:pt-0"
      style={{ backgroundColor: '#121212' }}
    >
      {currentChatId && hasMessages ? (
        <ChatView />
      ) : (
        <div 
          className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 overflow-auto"
          style={{ backgroundColor: '#121212' }}
        >
          <div className="w-full max-w-2xl space-y-8 md:space-y-12">
            <PlanBanner />
            <Greeting />
            <ChatInput />
          </div>
        </div>
      )}
    </main>
  );
}