'use client';

/**
 * Presentation Bubble Component
 *
 * Floating button that generates a personalized management presentation
 * based on the user's actual session questions and interactions.
 */

import React, { useState } from 'react';
import { FileText, Download, X, Sparkles, TrendingUp, Clock } from 'lucide-react';
import type { SessionTracker } from '@/lib/session/session-tracker';

interface PresentationBubbleProps {
  tracker: SessionTracker;
  onGenerate?: () => void;
}

export function PresentationBubble({ tracker, onGenerate }: PresentationBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [presentationUrl, setPresentationUrl] = useState<string | null>(null);

  const presentationData = tracker.getPresentationData();
  const hasQuestions = presentationData.actualQuestions.length > 0;

  const handleGenerate = async () => {
    setIsGenerating(true);
    onGenerate?.();

    try {
      const response = await fetch('/api/generate-presentation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ presentationData }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate presentation');
      }

      const result = await response.json();
      console.log('[Presentation] Generated:', result);

      // In a real implementation, this would download or open the presentation
      // For now, we'll just show success
      setPresentationUrl('/presentation-generated');

      // Simulate download or open
      setTimeout(() => {
        alert(`Presentation generated with ${result.slides.length} slides!\nBased on ${result.metadata.queriesCount} questions from your ${result.metadata.duration} session.`);
        setIsExpanded(false);
      }, 500);
    } catch (error) {
      console.error('[Presentation] Error:', error);
      alert('Failed to generate presentation. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!hasQuestions) {
    return null; // Don't show until user has asked at least one question
  }

  return (
    <>
      {/* Floating Button */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-[#AA6C39] to-[#8B5A2B] hover:from-[#BB7C49] hover:to-[#9B6A3B] rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-40 group"
          aria-label="Generate Presentation"
        >
          <FileText className="w-6 h-6 text-white" />
          <div className="absolute inset-0 rounded-full border-4 border-[#AA6C39] animate-ping opacity-75" />

          {/* Badge showing questions count */}
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {presentationData.actualQuestions.length}
          </div>

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-[#0A1930] text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Generate Presentation
          </div>
        </button>
      )}

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="fixed bottom-24 right-6 w-[420px] bg-white rounded-2xl shadow-2xl z-40 animate-scale-in border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#AA6C39] to-[#8B5A2B] px-6 py-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Generate Presentation</h3>
                <p className="text-white/80 text-xs">Based on your session</p>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Session Summary */}
            <div className="mb-6">
              <h4 className="font-semibold text-[#0A1930] mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#AA6C39]" />
                Your Session Summary
              </h4>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-[#AA6C39]">
                    {presentationData.actualQuestions.length}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Questions</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-[#AA6C39]">
                    {presentationData.session.duration}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Duration</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-[#AA6C39]">
                    {presentationData.roi.hoursSaved}h
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Saved</div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-4 border border-gray-200">
              <p className="text-sm font-medium text-[#0A1930] mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Your presentation will include:
              </p>
              <ul className="text-sm space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-[#AA6C39] mt-0.5">•</span>
                  <span>Your {presentationData.actualQuestions.length} actual questions (word-for-word)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#AA6C39] mt-0.5">•</span>
                  <span>Specific solutions for each problem you explored</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#AA6C39] mt-0.5">•</span>
                  <span>Before/after scenarios from your use cases</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#AA6C39] mt-0.5">•</span>
                  <span>${presentationData.roi.costSaved} in time savings analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#AA6C39] mt-0.5">•</span>
                  <span>{presentationData.problemSolutions.length} features demonstrated</span>
                </li>
              </ul>

              {/* Example Question */}
              {presentationData.actualQuestions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <p className="text-xs font-medium text-gray-600 mb-2">Example from your session:</p>
                  <p className="text-xs italic text-[#0A1930] bg-white p-3 rounded-lg border border-gray-200">
                    "{presentationData.actualQuestions[0]}"
                  </p>
                </div>
              )}
            </div>

            {/* ROI Highlight */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6 border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h5 className="font-semibold text-green-900">Session ROI</h5>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-green-700 mb-1">Time Saved</div>
                  <div className="text-lg font-bold text-green-900">
                    {presentationData.roi.hoursSaved} hours
                  </div>
                </div>
                <div>
                  <div className="text-xs text-green-700 mb-1">Cost Savings</div>
                  <div className="text-lg font-bold text-green-900">
                    ${presentationData.roi.costSaved}
                  </div>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-4 bg-gradient-to-r from-[#AA6C39] to-[#8B5A2B] hover:from-[#BB7C49] hover:to-[#9B6A3B] text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating Presentation...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Generate Presentation</span>
                </>
              )}
            </button>

            <p className="text-xs text-center text-gray-500 mt-3">
              10-12 slides | Personalized to your session | Ready for management
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
