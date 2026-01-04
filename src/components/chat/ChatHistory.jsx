import ChatItem from './ChatItem';
import { useChat } from '../../context/ChatContext';
import { SearchX, MessageSquare } from 'lucide-react';

export default function ChatHistory() {
  const { groupedChats, loading, searchResults, searchQuery } = useChat();
  const dateOrder = ['Today', 'Yesterday', 'Last 7 days', 'Older'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-accent-500 border-t-transparent 
                        rounded-full animate-spin" />
      </div>
    );
  }

  // If searching, show search results
  if (searchResults !== null) {
    if (searchResults.length === 0) {
      return (
        <div className="text-center py-8 px-4">
          <SearchX className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No chats found</p>
          <p className="text-xs text-gray-500 mt-1">
            No chats matching "{searchQuery}"
          </p>
        </div>
      );
    }

    return (
      <div className="py-2 px-2">
        <p className="text-xs text-gray-500 px-3 py-2 font-medium uppercase tracking-wider">
          Search Results ({searchResults.length})
        </p>
        <div className="space-y-0.5">
          {searchResults.map((chat) => (
            <div key={chat.chat_id} className="relative">
              <ChatItem chat={chat} />
              {chat.matchCount > 0 && (
                <span className="absolute right-12 top-1/2 -translate-y-1/2 
                                 text-xs text-gray-500 bg-dark-700 px-1.5 py-0.5 rounded">
                  {chat.matchCount} {chat.matchCount === 1 ? 'match' : 'matches'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Normal grouped view
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
          <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No chats yet</p>
          <p className="text-xs text-gray-500 mt-1">Start a new conversation</p>
        </div>
      )}
    </div>
  );
}