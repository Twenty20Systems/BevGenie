'use client';

import React from 'react';
import { DynamicPageRenderer } from '@/components/dynamic-page-renderer';
import { Home, ChevronUp } from 'lucide-react';
import type { BevGeniePage } from '@/lib/ai/page-specs';

interface DynamicContentProps {
  specification: BevGeniePage;
  onNavigationClick?: (action: string, context?: any) => void;
  onBackToHome?: () => void;
}

/**
 * Dynamic Content Component
 *
 * Renders AI-generated page specifications with:
 * - White background (no gradients)
 * - Professional B2B SaaS layout
 * - Navigation header with back-to-home button
 * - Interactive CTA handlers
 * - Chat bubble overlay at bottom-right
 * - Responsive design
 */
export function DynamicContent({
  specification,
  onNavigationClick,
  onBackToHome
}: DynamicContentProps) {
  const handleScroll = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header - Back to Home */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToHome}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0A1930] hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Back to home"
            >
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 uppercase tracking-wide">
              {specification.type.replace(/_/g, ' ')}
            </span>
            <button
              onClick={handleScroll}
              className="p-2 text-gray-600 hover:text-[#00C8FF] rounded-lg transition-colors"
              title="Scroll to top"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <DynamicPageRenderer
        page={specification}
        onNavigationClick={onNavigationClick}
      />
    </div>
  );
}
