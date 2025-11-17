import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Download } from 'lucide-react';
import { api } from '../utils/api';
import type { ChatMessage } from '../types';

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [provider, setProvider] = useState('continue');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const providers = ['continue', 'alibaba', 'kimi', 'codestral'];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.execute({ task: input, provider });

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.success
          ? response.result || 'No response content'
          : response.error || 'Request failed',
        timestamp: new Date(),
        provider: response.provider,
        error: !response.success,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Request failed',
        timestamp: new Date(),
        error: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    if (window.confirm('Clear all messages?')) {
      setMessages([]);
    }
  };

  const exportChat = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      provider,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        provider: m.provider,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col animate-fade-in">
      {/* Header - Mobile Responsive */}
      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-primary-400" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Chat Interface</h2>
              <p className="text-xs sm:text-sm text-gray-400">Interactive LLM conversation</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Provider Select - Mobile Responsive */}
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="px-3 py-2 glass rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm"
            >
              {providers.map((p) => (
                <option key={p} value={p} className="bg-gray-800">
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>

            {/* Action Buttons */}
            <button
              onClick={exportChat}
              disabled={messages.length === 0}
              className="p-2 glass hover:bg-white/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Export chat"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={clearChat}
              disabled={messages.length === 0}
              className="p-2 glass hover:bg-white/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Clear chat"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area - Mobile Responsive */}
      <div className="flex-1 card overflow-y-auto mb-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center px-4">
              <Bot className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 opacity-30" />
              <p className="text-base sm:text-lg font-medium">Start a conversation</p>
              <p className="text-xs sm:text-sm mt-2">Type a message below to begin</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-primary-400" />
                </div>
                <div className="glass p-4 rounded-lg flex-1 max-w-[80%]">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - Mobile Responsive */}
      <form onSubmit={handleSubmit} className="card">
        <div className="flex gap-2 sm:gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 glass rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm sm:text-base"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 sm:px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </form>
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-2 sm:gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-secondary-500/20' : message.error ? 'bg-red-500/20' : 'bg-primary-500/20'
        }`}
      >
        {isUser ? (
          <User className={`w-5 h-5 ${isUser ? 'text-secondary-400' : 'text-primary-400'}`} />
        ) : (
          <Bot className={`w-5 h-5 ${message.error ? 'text-red-400' : 'text-primary-400'}`} />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[80%] sm:max-w-[70%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`glass p-3 sm:p-4 rounded-lg ${
            message.error ? 'border border-red-500/30' : ''
          }`}
        >
          <p className="text-sm sm:text-base whitespace-pre-wrap break-words">{message.content}</p>
          {message.provider && (
            <p className="text-xs text-gray-500 mt-2">via {message.provider}</p>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1 px-2">
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
