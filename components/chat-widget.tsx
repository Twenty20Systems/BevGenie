'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useChat } from '@/hooks/useChat';
import { SendIcon, Loader2, MessageCircle, X, RotateCcw } from 'lucide-react';

/**
 * Chat Widget Component
 *
 * Floating chat widget for collecting customer personas
 * and providing AI-powered responses
 */
export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    messages,
    isLoading,
    error,
    persona,
    generationMode,
    sendMessage,
    clearMessages,
    getPersonaInfo,
    messagesEndRef,
  } = useChat();

  const personaInfo = getPersonaInfo();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = inputRef.current?.value.trim();
    if (message) {
      sendMessage(message);
      inputRef.current!.value = '';
      inputRef.current?.focus();
    }
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      inputRef.current?.focus();
    }
  }, [isOpen, messages.length]);

  return (
    <>
      {/* Chat Widget Container */}
      <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${isOpen ? 'h-[600px] w-[400px]' : 'h-14 w-14'}`}>
        <Card
          className={`flex flex-col h-full bg-white shadow-2xl transition-all ${
            isOpen ? 'rounded-lg' : 'rounded-full'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold text-sm">BevGenie Chat</span>
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="hover:bg-blue-800 p-1 rounded transition-colors"
            >
              {isOpen ? <X className="w-5 h-5" /> : null}
            </button>
          </div>

          {isOpen && (
            <>
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4 border-b">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                    <MessageCircle className="w-12 h-12 text-gray-300 mb-2" />
                    <p className="text-sm">
                      👋 Hi! I'm BevGenie AI. Ask me how I can help your beverage business.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                            message.role === 'user'
                              ? 'bg-blue-500 text-white rounded-br-none'
                              : 'bg-gray-100 text-gray-900 rounded-bl-none'
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Thinking...</span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Persona Info */}
              {personaInfo && (
                <div className="px-4 py-2 bg-blue-50 border-b text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Detected:</span>
                      <Badge variant="outline" className="text-xs">
                        {personaInfo.userType}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {personaInfo.confidence}% confident
                      </Badge>
                    </div>
                    {personaInfo.topPainPoints.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">Pain points:</span>
                        {personaInfo.topPainPoints.map((point) => (
                          <Badge key={point} variant="secondary" className="text-xs">
                            {point}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="px-4 py-2 bg-red-50 border-b text-xs text-red-600">
                  {error}
                </div>
              )}

              {/* Input Area */}
              <form onSubmit={handleSubmit} className="p-3 border-t">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Ask me anything..."
                    disabled={isLoading}
                    className="text-sm"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <SendIcon className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </form>

              {/* Footer Actions */}
              {messages.length > 0 && (
                <div className="px-3 py-2 flex gap-2 border-t bg-gray-50">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearMessages}
                    className="text-xs w-full"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Toggle Button (when closed) */}
          {!isOpen && (
            <button
              onClick={() => setIsOpen(true)}
              className="w-full h-full flex items-center justify-center hover:bg-blue-100 transition-colors rounded-full"
            >
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </button>
          )}
        </Card>
      </div>
    </>
  );
}
