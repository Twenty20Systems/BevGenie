'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, Send, RotateCcw, ChevronDown } from 'lucide-react';
import { DynamicPageRenderer } from './dynamic-page-renderer';
import type { BevGeniePage } from '@/lib/ai/page-specs';
import type { DynamicPageData } from '@/hooks/useChat';

interface PageWithChatSidebarProps {
  page: BevGeniePage | null;
  messages: DynamicPageData[];
  isLoading: boolean;
  generationStatus: {
    progress: number;
    stageName: string;
    isGeneratingPage: boolean;
  };
  onClose: () => void;
  onSendMessage: (message: string) => void;
  onClearChat: () => void;
}

/**
 * Page with Chat Sidebar Component
 *
 * Displays:
 * - Full-screen generated page (main view)
 * - Chat sidebar with text messages only
 * - Real-time progress animation (prominent)
 * - Dynamic page updates as user chats
 */
export function PageWithChatSidebar({
  page,
  messages,
  isLoading,
  generationStatus,
  onClose,
  onSendMessage,
  onClearChat,
}: PageWithChatSidebarProps) {
  const [inputValue, setInputValue] = useState('');
  const [chatExpanded, setChatExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, generationStatus.progress]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  // Progress animation stages
  const getProgressColor = (progress: number) => {
    if (progress < 25) return 'from-blue-500 to-blue-600';
    if (progress < 50) return 'from-blue-600 to-cyan-500';
    if (progress < 75) return 'from-cyan-500 to-green-500';
    if (progress < 100) return 'from-green-500 to-emerald-500';
    return 'from-emerald-500 to-green-600';
  };

  const getProgressIcon = (progress: number) => {
    if (progress < 25) return '🔄';
    if (progress < 50) return '🔍';
    if (progress < 75) return '⚙️';
    if (progress < 100) return '✨';
    return '✅';
  };

  return (
    <div className="fixed inset-0 flex bg-gray-50">
      {/* Main Page Content - Full Width */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white px-8 py-5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-xl">
              🚀
            </div>
            <div>
              <h1 className="font-bold text-xl">BevGenie Solution</h1>
              <p className="text-xs text-blue-100">AI-Powered Page</p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Return to home"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar - Prominent Display */}
        {isLoading && (
          <div className="sticky top-16 z-39 bg-white border-b-2 border-gray-200 px-8 py-4 shadow-sm">
            <div className="flex items-center gap-4">
              {/* Animated Icon */}
              <div className="text-3xl animate-bounce">{getProgressIcon(generationStatus.progress)}</div>

              {/* Progress Details */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900 text-sm">
                    {generationStatus.stageName || 'Generating...'}
                  </p>
                  <span className="font-bold text-blue-600 text-sm">{generationStatus.progress}%</span>
                </div>

                {/* Animated Progress Bar */}
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(
                      generationStatus.progress
                    )} transition-all duration-300 shadow-lg`}
                    style={{ width: `${generationStatus.progress}%` }}
                  >
                    {/* Shimmer effect */}
                    <div
                      className="h-full w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"
                      style={{
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 2s infinite',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="p-8 max-w-7xl mx-auto">
          {page ? (
            <div className="animate-fade-in">
              <DynamicPageRenderer page={page} compact={false} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-center text-gray-500">
              <MessageCircle className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">Start chatting to generate a page</p>
              <p className="text-sm mt-2">Send a message in the chat sidebar to begin</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Sidebar */}
      <div
        className={`fixed right-0 top-0 h-screen z-50 bg-white shadow-2xl transition-all duration-300 flex flex-col ${
          chatExpanded ? 'w-96' : 'w-0 overflow-hidden'
        }`}
      >
        {/* Sidebar Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            <h2 className="font-bold">Chat</h2>
            <span className="text-xs bg-white/30 px-2 py-1 rounded-full ml-2">{messages.length}</span>
          </div>

          <button
            onClick={() => setChatExpanded(!chatExpanded)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title={chatExpanded ? 'Collapse' : 'Expand'}
          >
            <ChevronDown className={`w-5 h-5 transition-transform ${chatExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((msg, idx) => (
            <div key={idx} className="animate-fade-in">
              {/* User Message */}
              {msg.role === 'user' && (
                <div className="flex justify-end">
                  <div className="max-w-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg rounded-tr-none shadow-sm">
                    <p className="text-sm font-medium break-words">{msg.content}</p>
                  </div>
                </div>
              )}

              {/* Assistant Message */}
              {msg.role === 'assistant' && (
                <div className="flex justify-start">
                  <div className="max-w-xs bg-gray-100 text-gray-900 px-4 py-2 rounded-lg rounded-tl-none shadow-sm">
                    <p className="text-sm break-words">{msg.content}</p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg rounded-tl-none">
                <div className="flex gap-1 items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 flex-shrink-0">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask something..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {messages.length > 0 && (
              <button
                type="button"
                onClick={onClearChat}
                disabled={isLoading}
                className="w-full px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-3 h-3 inline mr-1" />
                Clear
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Sidebar Toggle Button (when collapsed) */}
      {!chatExpanded && (
        <button
          onClick={() => setChatExpanded(true)}
          className="fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-110"
          title="Open chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
}
