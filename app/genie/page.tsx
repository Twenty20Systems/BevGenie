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
   * @param query - The user's question
   * @param context - Optional context (if from navigation/button click)
   * @param isNavigationClick - If true, don't add messages to chat (silent navigation)
   */
  const handleSendMessage = async (query: string, context?: any, isNavigationClick: boolean = false) => {
    setCurrentQuery(query);
    setIsGenerating(true);
    setLoadingProgress(0);

    // Add user message to chat ONLY if it's not from navigation
    if (!isNavigationClick) {
      const userMessageId = `msg-${Date.now()}`;
      setChatMessages(prev => [...prev, {
        id: userMessageId,
        role: 'user',
        content: query,
        timestamp: Date.now()
      }]);
    }

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

        // Add assistant text response to chat ONLY if it's not from navigation
        if (!isNavigationClick && textResponse) {
          setChatMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: textResponse,
            timestamp: Date.now(),
            pageId
          }]);
        }

        setIsGenerating(false);

        // Scroll to new page after render
        setTimeout(() => {
          scrollToLatestPage();
        }, 100);
      } else {
        console.warn('[Genie] No page generated');
        setIsGenerating(false);

        // Only show error in chat if not from navigation
        if (!isNavigationClick) {
          setChatMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: 'Unable to generate a page at this time. Please try rephrasing your question.',
            timestamp: Date.now()
          }]);
        }
      }
    } catch (error) {
      console.error('[Genie] Generation failed:', error);
      setIsGenerating(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Add error message to chat only if not from navigation
      if (!isNavigationClick) {
        setChatMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
          timestamp: Date.now()
        }]);
      }
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
   * These are silent - no chat messages added
   */
  const handleNavigationClick = (action: string, context?: any) => {
    // Generate a new message based on the interaction
    const interactionMessage = `${currentQuery} - User clicked on: ${context?.text || action}`;
    // Pass true for isNavigationClick to keep it silent
    handleSendMessage(interactionMessage, {
      ...context,
      source: action,
      originalQuery: currentQuery,
      pageIndex: pageHistory.length
    }, true);
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
          className="min-h-screen bg-gradient-to-br from-[#0A1930] via-[#0D2342] to-[#0A1930] relative overflow-hidden"
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-72 h-72 bg-[#00C8FF] rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#00C8FF] rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00C8FF] rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
            {/* Hero Section */}
            <div className="text-center mb-20 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00C8FF]/10 border border-[#00C8FF]/30 rounded-full mb-6">
                <div className="w-2 h-2 bg-[#00C8FF] rounded-full animate-pulse" />
                <span className="text-[#00C8FF] text-sm font-medium">Powered by Advanced AI</span>
              </div>

              <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
                <span className="text-white">Meet BevGenie</span>
                <span className="block text-[#00C8FF] mt-2">
                  Your AI Business Partner
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Transform raw beverage market data into actionable intelligence.
                Ask questions in plain English, get instant, personalized insights tailored to your role.
              </p>
            </div>

            {/* What is BevGenie Section */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 md:p-12 mb-16 animate-slide-up">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-[#00C8FF] to-[#0066FF] rounded-xl flex items-center justify-center">
                  <span className="text-2xl">✨</span>
                </div>
                <h2 className="text-3xl font-bold text-white">What is BevGenie?</h2>
              </div>

              <p className="text-lg text-gray-300 leading-relaxed mb-6">
                BevGenie is an intelligent AI assistant designed specifically for the beverage industry.
                Think of it as having an expert analyst, strategist, and data scientist working 24/7 to answer your business questions.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-[#00C8FF]/50 transition-all hover:shadow-lg hover:shadow-[#00C8FF]/20">
                  <div className="text-3xl mb-3">🧠</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Instant Intelligence</h3>
                  <p className="text-gray-400">
                    Ask questions naturally. Get comprehensive answers with data, charts, and actionable recommendations in seconds.
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-[#00C8FF]/50 transition-all hover:shadow-lg hover:shadow-[#00C8FF]/20">
                  <div className="text-3xl mb-3">🎯</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Personalized Insights</h3>
                  <p className="text-gray-400">
                    Learns your role, preferences, and pain points. Every response is tailored to what matters most to you.
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-[#00C8FF]/50 transition-all hover:shadow-lg hover:shadow-[#00C8FF]/20">
                  <div className="text-3xl mb-3">📊</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Visual Storytelling</h3>
                  <p className="text-gray-400">
                    Generates beautiful, interactive pages with metrics, charts, and clear visualizations that make complex data simple.
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-[#00C8FF]/50 transition-all hover:shadow-lg hover:shadow-[#00C8FF]/20">
                  <div className="text-3xl mb-3">🚀</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Continuous Learning</h3>
                  <p className="text-gray-400">
                    Each interaction makes BevGenie smarter. It remembers context, tracks your journey, and improves over time.
                  </p>
                </div>
              </div>
            </div>

            {/* Use Cases */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-white text-center mb-10">
                How BevGenie Helps You Win
              </h2>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    icon: '🎯',
                    title: 'Territory Intelligence',
                    description: 'Identify high-potential markets, track penetration, and discover untapped opportunities with data-driven territory analysis.',
                    example: 'Show me high-potential territories'
                  },
                  {
                    icon: '💰',
                    title: 'ROI Optimization',
                    description: 'Prove the value of your field sales investments with clear metrics, benchmarks, and success stories from similar companies.',
                    example: 'How do I prove field ROI?'
                  },
                  {
                    icon: '📈',
                    title: 'Strategic Planning',
                    description: 'Build comprehensive go-to-market strategies with competitive insights, market trends, and actionable roadmaps.',
                    example: 'Create a GTM strategy for craft beer'
                  },
                ].map((card, idx) => (
                  <div
                    key={idx}
                    className="group bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 cursor-pointer transition-all hover:bg-white/10 hover:border-[#00C8FF]/50 hover:shadow-xl hover:shadow-[#00C8FF]/20 hover:-translate-y-1"
                    onClick={() => handleSendMessage(card.example)}
                  >
                    <div className="text-4xl mb-4">{card.icon}</div>
                    <h3 className="text-xl font-bold text-white mb-3">{card.title}</h3>
                    <p className="text-gray-400 mb-4 leading-relaxed">{card.description}</p>
                    <div className="flex items-center gap-2 text-[#00C8FF] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Try it: "{card.example}"</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Start Examples */}
            <div className="text-center bg-gradient-to-r from-[#00C8FF]/10 to-[#0066FF]/10 backdrop-blur-lg border border-[#00C8FF]/20 rounded-2xl p-10">
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to Get Started?
              </h3>
              <p className="text-gray-300 mb-8">
                Try asking BevGenie one of these questions, or type your own:
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                {[
                  'Show me territory performance metrics',
                  'How can I improve distributor relationships?',
                  'What are compliance requirements for spirits?',
                  'Analyze my sales team effectiveness',
                  'Compare my performance to industry benchmarks'
                ].map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(question)}
                    className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-[#00C8FF]/50 rounded-xl text-white transition-all hover:shadow-lg hover:shadow-[#00C8FF]/20 hover:-translate-y-0.5 text-sm font-medium"
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
