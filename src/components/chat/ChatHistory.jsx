import ChatItem from './ChatItem';
import { useChat } from '../../context/ChatContext';

export default function ChatHistory() {
  const { groupedChats, loading } = useChat();
  const dateOrder = ['Today', 'Yesterday', 'Last 7 days', 'Older'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-accent-500 border-t-transparent 
                        rounded-full animate-spin" />
      </div>
    );
  }

  const hasChats = Object.values(groupedChats).some(chats => chats.length > 0);

  return (
    <div className="py-2 px-2">
      {dateOrder.map((date) => {
        const dateChats = groupedChats[date];
        if (!dateChats || dateChats.length === 0) return null;

        return (
          <div key={date} className="mb-4">
            <p className="text-xs text-gray-500 px-3 py-2 font-medium uppercase tracking-wider">
              {date}
            </p>
            <div className="space-y-0.5">
              {dateChats.map((chat) => (
                <ChatItem key={chat.chat_id} chat={chat} />
              ))}
            </div>
          </div>
        );
      })}

      {!hasChats && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No chats yet</p>
          <p className="text-xs text-gray-600 mt-1">Start a new conversation</p>
        </div>
      )}
    </div>
  );
}