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

  const handleSendMessage = async (query: string) => {
    setCurrentQuery(query);
    setIsGenerating(true);
    setLoadingProgress(0);

    try {
      // Simulate API call with progress updates
      // In production, this would call your actual API endpoints

      // Step 1: Analyze Query (25% progress)
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLoadingProgress(25);

      // Step 2: Generate UI (50% progress)
      await new Promise(resolve => setTimeout(resolve, 2200));
      setLoadingProgress(50);

      // Step 3: Research & Intelligence (75% progress)
      await new Promise(resolve => setTimeout(resolve, 2500));
      setLoadingProgress(75);

      // Step 4: Personalization (90% progress)
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLoadingProgress(90);

      // Step 5: Finalize (100% progress)
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoadingProgress(100);

      // Create sample page specification (in production, this comes from API)
      const samplePage: BevGeniePage = {
        type: 'solution_brief',
        title: `Response to: ${query}`,
        description: `AI-generated analysis and recommendations based on your query`,
        sections: [
          {
            type: 'hero',
            headline: query,
            subheadline: 'Your AI-powered analysis is ready. Review the insights below.',
            ctas: [
              { text: 'Export Report', url: '#' },
              { text: 'Ask Follow-up', url: '#' }
            ]
          },
          {
            type: 'feature_grid',
            title: 'Key Insights',
            features: [
              {
                title: 'Market Opportunity',
                description: 'Based on your query and industry data, we identified significant opportunities',
                icon: 'target'
              },
              {
                title: 'Competitive Analysis',
                description: 'Comparison with industry benchmarks shows strong positioning',
                icon: 'zap'
              },
              {
                title: 'Action Items',
                description: 'Prioritized recommendations to maximize ROI and market share',
                icon: 'checkmark'
              },
              {
                title: 'Timeline',
                description: 'Realistic implementation timeline for quick wins',
                icon: 'calendar'
              }
            ]
          },
          {
            type: 'metrics',
            title: 'Performance Metrics',
            metrics: [
              {
                value: '42%',
                label: 'Potential Growth',
                description: 'Based on implemented recommendations'
              },
              {
                value: '3-6mo',
                label: 'ROI Timeline',
                description: 'Expected time to positive ROI'
              },
              {
                value: '120%',
                label: 'Efficiency Gain',
                description: 'Improvement in operational efficiency'
              }
            ]
          },
          {
            type: 'cta',
            title: 'Ready to Take Action?',
            description: 'Start implementing these recommendations today to see immediate results',
            buttons: [
              { text: 'Create Implementation Plan', url: '#' },
              { text: 'Schedule Consultation', url: '#' }
            ]
          }
        ]
      };

      // Show result after brief delay
      setTimeout(() => {
        setGeneratedContent(samplePage);
        setIsGenerating(false);
      }, 500);

    } catch (error) {
      console.error('Generation failed:', error);
      setIsGenerating(false);
    }
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
        <DynamicContent specification={generatedContent} />
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
