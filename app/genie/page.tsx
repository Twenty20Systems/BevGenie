'use client';

import { useState } from 'react';
import { ChatBubble } from '@/components/genie/chat-bubble';
import { BevGenieVisualLoader } from '@/components/genie/loading-screen';
import { DynamicContent } from '@/components/genie/dynamic-content';
import type { BevGeniePage } from '@/lib/ai/page-specs';

/**
 * BevGenie Genie Page
 *
 * Main page for AI-powered dynamic content generation
 * Features:
 * - Full-screen loading experience with visual progress
 * - Chat bubble interface for user interaction
 * - Dynamic page rendering based on user queries
 * - Persistent chat history
 * - White background aesthetic matching homepage
 */
export default function GeniePage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [generatedContent, setGeneratedContent] = useState<BevGeniePage | null>(null);
  const [currentQuery, setCurrentQuery] = useState('');
  const [interactionContext, setInteractionContext] = useState<any>(null);

  const handleSendMessage = async (query: string, context?: any) => {
    setCurrentQuery(query);
    setIsGenerating(true);
    setLoadingProgress(0);
    setInteractionContext(context);

    try {
      // Call the real API endpoint with SSE streaming
      const requestBody = context
        ? { message: query, context, interactionSource: context.source }
        : { message: query };

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let generatedPage: BevGeniePage | null = null;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              try {
                const event = JSON.parse(data);

                // Handle stage progress updates
                if (event.stageId) {
                  const stageProgress: Record<string, number> = {
                    'init': 5,
                    'intent': 15,
                    'signals': 35,
                    'knowledge': 55,
                    'response': 75,
                    'page': 90,
                    'complete': 100,
                  };
                  setLoadingProgress(stageProgress[event.stageId] || 0);
                }

                // Handle generated page
                if (event.page) {
                  generatedPage = event.page;
                }
              } catch (e) {
                // Skip non-JSON lines
              }
            }
          }
        }
      }

      // Set the final generated page
      if (generatedPage) {
        setGeneratedContent(generatedPage);
      } else {
        throw new Error('No page generated');
      }

      setIsGenerating(false);
    } catch (error) {
      console.error('Generation failed:', error);
      setIsGenerating(false);
      // Show error to user
      alert('Failed to generate response. Please try again.');
    }
  };

  const handleBackToHome = () => {
    setGeneratedContent(null);
    setCurrentQuery('');
    setInteractionContext(null);
  };

  const handleNavigationClick = (action: string, context?: any) => {
    // Generate a new message based on the interaction
    const interactionMessage = `${currentQuery} - User clicked on: ${context?.text || action}`;
    handleSendMessage(interactionMessage, {
      ...context,
      source: action,
      originalQuery: currentQuery,
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Loading Screen (Full Screen Overlay) */}
      {isGenerating && (
        <BevGenieVisualLoader
          query={currentQuery}
          onComplete={() => {
            // Loader handles its own completion
          }}
        />
      )}

      {/* Generated Content */}
      {generatedContent && !isGenerating && (
        <DynamicContent
          specification={generatedContent}
          onBackToHome={handleBackToHome}
          onNavigationClick={handleNavigationClick}
        />
      )}

      {/* Welcome Page (if no content generated yet) */}
      {!generatedContent && !isGenerating && (
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-[#0A1930] mb-4">
              Welcome to BevGenie AI
            </h1>
            <p className="text-xl text-gray-600">
              Ask any question about your beverage business
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '🎯',
                title: 'Territory Analysis',
                description: 'Identify underperforming regions and growth opportunities'
              },
              {
                icon: '📊',
                title: 'ROI Tracking',
                description: 'Prove field execution impact on sales outcomes'
              },
              {
                icon: '🤝',
                title: 'Distributor Health',
                description: 'Monitor share-of-mind and relationship quality'
              }
            ].map((card) => (
              <div
                key={card.title}
                className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-[#00C8FF] transition-all cursor-pointer"
              >
                <div className="text-4xl mb-4">{card.icon}</div>
                <h3 className="text-lg font-semibold text-[#0A1930] mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-600">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Bubble (Always visible - Homepage Style) */}
      <ChatBubble
        onSendMessage={handleSendMessage}
        isLoading={isGenerating}
        loadingProgress={loadingProgress}
      />
    </div>
  );
}
