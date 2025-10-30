'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatBubble } from '@/components/genie/chat-bubble';
import { BevGenieVisualLoader } from '@/components/genie/loading-screen';
import { DynamicContent } from '@/components/genie/dynamic-content';
import type { BevGeniePage } from '@/lib/ai/page-specs';
import { COLORS } from '@/lib/constants/colors';

/**
 * Page History Item
 */
interface PageHistoryItem {
  id: string;
  query: string;
  content: BevGeniePage;
  textResponse?: string;
  timestamp: number;
  context?: any;
}

/**
 * Chat Message
 */
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  pageId?: string; // Link to generated page
}

/**
 * BevGenie Genie Page - Vertical Scrolling Architecture
 *
 * Features:
 * - Landing page that never gets removed
 * - Generated pages stack vertically below
 * - Smooth scroll to newly generated content
 * - Chat history with both text responses and UI pages
 * - Persistent context across interactions
 */
export default function GeniePage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentQuery, setCurrentQuery] = useState('');

  // Page stacking state - CRITICAL: Array of all generated pages
  const [pageHistory, setPageHistory] = useState<PageHistoryItem[]>([]);

  // Chat message history
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Ref for scrolling to newly generated pages
  const lastPageRef = useRef<HTMLDivElement>(null);

  // Show landing page only when no pages generated yet
  const showLandingPage = pageHistory.length === 0 && !isGenerating;

  /**
   * Scroll to the latest generated page
   */
  const scrollToLatestPage = () => {
    if (lastPageRef.current) {
      lastPageRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  /**
   * Handle user message - Generate BOTH text response AND UI page
   */
  const handleSendMessage = async (query: string, context?: any) => {
    setCurrentQuery(query);
    setIsGenerating(true);
    setLoadingProgress(0);

    // Add user message to chat
    const userMessageId = `msg-${Date.now()}`;
    setChatMessages(prev => [...prev, {
      id: userMessageId,
      role: 'user',
      content: query,
      timestamp: Date.now()
    }]);

    try {
      // Call the real API endpoint with SSE streaming
      const requestBody = context
        ? { message: query, context, interactionSource: context.source }
        : { message: query };

      console.log('[Genie] Calling API with:', requestBody);

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let generatedPage: BevGeniePage | null = null;
      let textResponse = '';

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

                // Handle text response chunks
                if (event.text) {
                  textResponse += event.text;
                }

                // Handle generated page
                if (event.page) {
                  generatedPage = event.page;
                  console.log('[Genie] Page received:', generatedPage.type);
                }
              } catch (e) {
                // Skip non-JSON lines
                console.debug('[Genie] Skipping non-JSON line');
              }
            }
          }
        }
      }

      // Create new page entry
      if (generatedPage) {
        const pageId = `page-${Date.now()}`;
        const newPage: PageHistoryItem = {
          id: pageId,
          query,
          content: generatedPage,
          textResponse: textResponse || `Here's what I found about "${query}"`,
          timestamp: Date.now(),
          context
        };

        // Add page to history (APPEND, don't replace!)
        setPageHistory(prev => [...prev, newPage]);

        // Add assistant text response to chat
        setChatMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: textResponse || `I've generated a detailed page about "${query}". Scroll down to see it! ↓`,
          timestamp: Date.now(),
          pageId
        }]);

        setIsGenerating(false);

        // Scroll to new page after render
        setTimeout(() => {
          scrollToLatestPage();
        }, 100);
      } else {
        console.warn('[Genie] No page generated');
        setIsGenerating(false);
        setChatMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: 'Unable to generate a page at this time. Please try rephrasing your question.',
          timestamp: Date.now()
        }]);
      }
    } catch (error) {
      console.error('[Genie] Generation failed:', error);
      setIsGenerating(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Add error message to chat
      setChatMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
        timestamp: Date.now()
      }]);
    }
  };

  /**
   * Handle back to home - Scroll to top (don't remove pages)
   */
  const handleBackToHome = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Handle navigation click within a generated page
   */
  const handleNavigationClick = (action: string, context?: any) => {
    // Generate a new message based on the interaction
    const interactionMessage = `${currentQuery} - User clicked on: ${context?.text || action}`;
    handleSendMessage(interactionMessage, {
      ...context,
      source: action,
      originalQuery: currentQuery,
      pageIndex: pageHistory.length
    });
  };

  return (
    <div className="relative" id="infinite-canvas">
      {/* Loading Screen (Full Screen Overlay) */}
      {isGenerating && (
        <BevGenieVisualLoader
          query={currentQuery}
          onComplete={() => {
            // Loader handles its own completion
          }}
        />
      )}

      {/* ===================================================================
          LANDING PAGE - Static, Never Removed
          =================================================================== */}
      {showLandingPage && (
        <section
          id="landing-page"
          className="min-h-screen"
          style={{ backgroundColor: COLORS.white }}
        >
          <div className="max-w-5xl mx-auto px-6 py-20">
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold mb-4" style={{ color: COLORS.navy }}>
                Welcome to BevGenie AI
              </h1>
              <p className="text-xl" style={{ color: COLORS.textGray }}>
                Ask any question about your beverage business
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: '🎯',
                  title: 'Territory Analysis',
                  description: 'Get insights on market penetration and opportunities',
                },
                {
                  icon: '📊',
                  title: 'Sales Performance',
                  description: 'Track metrics and identify growth areas',
                },
                {
                  icon: '🚀',
                  title: 'Strategic Planning',
                  description: 'Build data-driven go-to-market strategies',
                },
              ].map((card, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-xl border-2 hover:shadow-lg transition-all cursor-pointer"
                  style={{
                    backgroundColor: COLORS.white,
                    borderColor: COLORS.mediumGray,
                  }}
                  onClick={() => handleSendMessage(`Tell me about ${card.title}`)}
                >
                  <div className="text-4xl mb-4">{card.icon}</div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.navy }}>
                    {card.title}
                  </h3>
                  <p style={{ color: COLORS.textGray }}>{card.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-16 text-center">
              <p className="text-sm mb-4" style={{ color: COLORS.textGray }}>
                Or try these example questions:
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                {[
                  'How do I improve field sales execution?',
                  'Show me ROI from similar companies',
                  'What are compliance requirements for spirits?',
                ].map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(question)}
                    className="px-4 py-2 rounded-lg border transition-colors hover:shadow-md"
                    style={{
                      backgroundColor: COLORS.lightGray,
                      borderColor: COLORS.mediumGray,
                      color: COLORS.darkGray,
                    }}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===================================================================
          GENERATED PAGES STACK - Vertical Scrolling
          =================================================================== */}
      {pageHistory.length > 0 && (
        <div id="generated-pages-stack">
          {pageHistory.map((page, index) => (
            <section
              key={page.id}
              id={page.id}
              ref={index === pageHistory.length - 1 ? lastPageRef : null}
              className="min-h-screen"
              data-page-index={index}
            >
              <DynamicContent
                specification={page.content}
                onBackToHome={handleBackToHome}
                onNavigationClick={handleNavigationClick}
              />
            </section>
          ))}
        </div>
      )}

      {/* Chat Bubble (Always visible) - Passes message history */}
      <ChatBubble
        onSendMessage={handleSendMessage}
        isGenerating={isGenerating}
        messages={chatMessages}
        pageHistory={pageHistory}
      />
    </div>
  );
}
