import { Star } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export default function Greeting() {
  const { userName } = useChat();

  return (
    <div className="text-center">
      <div className="flex items-center justify-center mb-4">
        <div className="relative">
          <Star 
            className="w-6 h-6 text-accent-500 fill-accent-500/20 
                       animate-spin-slow" 
          />
          <div className="absolute inset-0 bg-accent-500/20 blur-xl rounded-full" />
        </div>
      </div>
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif">
        <span className="text-gray-400">Hey there,</span>
        <span className="text-white ml-2">{userName}</span>
      </h2>
    </div>
  );
}