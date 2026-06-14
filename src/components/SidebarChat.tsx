import React, { useRef, useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  X, 
  ChevronRight, 
  ChevronLeft,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { ChatMessage } from '../types';

interface SidebarChatProps {
  chatHistory: ChatMessage[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSendMessage: (msg: string) => Promise<void>;
  isTyping: boolean;
}

export default function SidebarChat({
  chatHistory,
  isExpanded,
  onToggleExpand,
  onSendMessage,
  isTyping
}: SidebarChatProps) {
  const [draftMessage, setDraftMessage] = useState<string>('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Sync scroll on chat history changes
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isTyping]);

  const handleSend = () => {
    if (!draftMessage.trim()) return;
    onSendMessage(draftMessage.trim());
    setDraftMessage('');
  };

  // Keyboard shortcut Ctrl+B / Cmd+B listener for toggle visibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        onToggleExpand();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleExpand]);

  return (
    <div 
      className={`fixed lg:relative inset-y-0 right-[#000000] z-50 lg:z-auto bg-[#0c0c0c] border-[#222] transition-all duration-300 ease-in-out flex flex-col shrink-0 ${
        isExpanded 
          ? 'w-full md:w-96 translate-x-0 border-l border-[#222]' 
          : 'w-0 translate-x-full border-l-0 lg:w-0'
      }`}
    >
      {/* Absolute drawer overlay trigger on mobile when closed */}
      {!isExpanded && (
        <button
          onClick={onToggleExpand}
          className="lg:hidden fixed bottom-6 right-6 z-50 bg-[#00FF41] hover:bg-[#00E53B] text-black rounded-full p-4 p-y shadow-2xl transition hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
          title="Toggle Help Chat (Ctrl+B / Cmd+B)"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      )}

      {/* Actual Chat Window layout when expanded */}
      {isExpanded && (
        <div className="flex flex-col h-full w-full overflow-hidden">
          
          <header className="bg-[#111] border-b border-[#222] px-4 py-4 flex justify-between items-center text-xs font-mono text-white select-none">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00FF41] animate-pulse"></span>
              <span className="font-bold uppercase">Elite Recruiter Chat Line</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-[#00FF41] font-bold bg-[#00FF41]/10 px-1.5 py-0.5 rounded border border-[#00FF41]/10">LOGGED</span>
              <button 
                onClick={onToggleExpand}
                className="text-slate-400 hover:text-white transition p-1 rounded-md hover:bg-[#222]"
                title="Hide Chat Panel (Ctrl+B / Cmd+B)"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </header>

          {/* Message List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#050505]/60 scrollbar-thin">
            {chatHistory.length === 0 ? (
              <div className="text-center text-[#555] py-20 flex flex-col justify-center items-center">
                <MessageSquare className="w-8 h-8 opacity-20 mb-2" />
                <span className="text-xs font-mono">Channel active. Run a resume audit to see recruiter reviews or ask me to fix bullets directly!</span>
              </div>
            ) : (
              chatHistory.map((msg, idx) => (
                <div 
                  key={msg.id || idx} 
                  className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[8px] text-[#444] font-mono tracking-wider">
                    {msg.role === 'user' ? 'CANDIDATE' : 'RECRUITER'} • {msg.timestamp}
                  </span>
                  <div className={`p-3 rounded-lg text-xs font-mono leading-relaxed transition break-words select-text ${
                    msg.role === 'user' 
                      ? 'bg-[#00FF41]/10 text-[#00FF41] border border-[#00FF41]/20 rounded-tr-none max-w-[85%]' 
                      : 'bg-[#181818] text-[#eeeeee] border border-[#222] rounded-tl-none max-w-[85%]'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}

            {isTyping && (
              <div className="flex flex-col gap-1 items-start">
                <span className="text-[8px] text-[#444] font-mono">RECRUITER ALIGNED...</span>
                <div className="p-3 bg-[#181818] border border-[#222] rounded-lg rounded-tl-none text-xs font-mono text-[#555] animate-pulse">
                  Analyzing improvement tracks...
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Footer Input panel */}
          <footer className="p-3 bg-[#111] border-t border-[#222] flex gap-2">
            <input 
              type="text"
              value={draftMessage}
              onChange={(e) => setDraftMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask: 'Roast me harder' or 'Optimize this experience segment'..."
              className="flex-1 bg-[#181818] border border-[#333] rounded px-3 py-2 text-xs text-white placeholder-[#555] focus:outline-none focus:border-[#00FF41] font-mono transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={isTyping || !draftMessage.trim()}
              className="bg-[#00FF41] text-black hover:bg-[#00E53B] rounded px-3 py-2 transition-all flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </footer>

        </div>
      )}
    </div>
  );
}
