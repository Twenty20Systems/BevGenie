'use client';

/**
 * Presentation Bubble Component
 *
 * Floating button that generates a personalized management presentation
 * based on the user's actual session questions and interactions.
 */

import React, { useState } from 'react';
import { FileText, Download, X, Sparkles, TrendingUp, Clock, Eye, ExternalLink } from 'lucide-react';
import type { SessionTracker } from '@/lib/session/session-tracker';
import type { Slide } from '@/app/api/generate-presentation/route';
import pptxgen from 'pptxgenjs';

interface PresentationBubbleProps {
  tracker: SessionTracker;
  onGenerate?: () => void;
}

export function PresentationBubble({ tracker, onGenerate }: PresentationBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSlides, setGeneratedSlides] = useState<Slide[] | null>(null);
  const [showPreview, setShowPreview] = useState(false);

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

      // Store the generated slides
      setGeneratedSlides(result.slides);
      setIsExpanded(false);
    } catch (error) {
      console.error('[Presentation] Error:', error);
      alert('Failed to generate presentation. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedSlides) return;

    const presentationContent = {
      title: 'BevGenie Presentation',
      generatedDate: new Date().toISOString(),
      metadata: {
        queriesCount: presentationData.actualQuestions.length,
        duration: presentationData.session.duration,
        roiSavings: presentationData.roi.costSaved,
      },
      slides: generatedSlides,
      sessionData: presentationData,
    };

    const blob = new Blob([JSON.stringify(presentationContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bevgenie-presentation-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    if (!generatedSlides) return;

    let markdown = `# BevGenie Presentation\n\n`;
    markdown += `**Generated:** ${new Date().toLocaleDateString()}\n`;
    markdown += `**Session Duration:** ${presentationData.session.duration}\n`;
    markdown += `**Questions Asked:** ${presentationData.actualQuestions.length}\n`;
    markdown += `**ROI:** $${presentationData.roi.costSaved} saved\n\n`;
    markdown += `---\n\n`;

    generatedSlides.forEach((slide) => {
      markdown += `## Slide ${slide.slideNumber}: ${slide.title}\n\n`;
      if (slide.subtitle) {
        markdown += `**${slide.subtitle}**\n\n`;
      }

      if (slide.content.type === 'bullets' && Array.isArray(slide.content.data)) {
        slide.content.data.forEach((item: any) => {
          markdown += `- ${typeof item === 'string' ? item : JSON.stringify(item)}\n`;
        });
      } else if (slide.content.data) {
        markdown += `${JSON.stringify(slide.content.data, null, 2)}\n`;
      }

      markdown += `\n**Visual:** ${slide.visualDescription}\n\n`;
      markdown += `**Speaker Notes:** ${slide.speakerNotes}\n\n`;
      markdown += `---\n\n`;
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bevgenie-presentation-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPPTX = async () => {
    if (!generatedSlides) return;

    const pres = new pptxgen();

    // Set presentation metadata
    pres.author = 'BevGenie AI';
    pres.company = 'BevGenie';
    pres.subject = 'Session Presentation';
    pres.title = 'BevGenie Session Presentation';

    // Define colors matching BevGenie theme
    const colors = {
      primary: 'AA6C39', // Copper
      secondary: '8B5A2B', // Dark copper
      accent: '00C8FF', // Cyan
      dark: '0A1930', // Dark blue
      text: '333333',
      lightBg: 'F5F5F5',
    };

    generatedSlides.forEach((slide) => {
      const newSlide = pres.addSlide();

      // Background
      newSlide.background = { color: 'FFFFFF' };

      // Header section with gradient effect
      newSlide.addShape(pres.ShapeType.rect, {
        x: 0, y: 0, w: '100%', h: 1.2,
        fill: { color: colors.primary }
      });

      // Slide number
      newSlide.addText(`Slide ${slide.slideNumber}`, {
        x: 0.3, y: 0.2, w: 2, h: 0.3,
        fontSize: 12,
        color: 'FFFFFF',
        bold: false
      });

      // Title
      newSlide.addText(slide.title, {
        x: 0.3, y: 0.5, w: 9, h: 0.6,
        fontSize: 28,
        color: 'FFFFFF',
        bold: true
      });

      // Subtitle if exists
      if (slide.subtitle) {
        newSlide.addText(slide.subtitle, {
          x: 0.3, y: 1.3, w: 9, h: 0.4,
          fontSize: 16,
          color: colors.text,
          italic: true
        });
      }

      // Content area
      let contentY = slide.subtitle ? 1.8 : 1.5;

      if (slide.content.type === 'bullets' && Array.isArray(slide.content.data)) {
        // Bullet points
        const bullets = slide.content.data.map((item: any) => ({
          text: typeof item === 'string' ? item : JSON.stringify(item),
          options: { bullet: true, fontSize: 14, color: colors.text }
        }));

        newSlide.addText(bullets, {
          x: 0.5, y: contentY, w: 9, h: 3.5,
          fontSize: 14,
          color: colors.text,
          bullet: { type: 'number' }
        });
      } else if (slide.content.type === 'comparison' && Array.isArray(slide.content.data)) {
        // Two column layout for comparisons
        const leftColumn = slide.content.data.slice(0, Math.ceil(slide.content.data.length / 2));
        const rightColumn = slide.content.data.slice(Math.ceil(slide.content.data.length / 2));

        newSlide.addText(leftColumn.map((item: any) => ({
          text: typeof item === 'string' ? item : JSON.stringify(item),
          options: { fontSize: 12 }
        })), {
          x: 0.5, y: contentY, w: 4.5, h: 3.5,
          fontSize: 12,
          color: colors.text
        });

        newSlide.addText(rightColumn.map((item: any) => ({
          text: typeof item === 'string' ? item : JSON.stringify(item),
          options: { fontSize: 12 }
        })), {
          x: 5.5, y: contentY, w: 4.5, h: 3.5,
          fontSize: 12,
          color: colors.text
        });
      } else {
        // Default text content - handle both arrays and objects
        let contentText = '';
        if (Array.isArray(slide.content.data)) {
          contentText = slide.content.data.map((item: any) =>
            typeof item === 'string' ? item : JSON.stringify(item)
          ).join('\n');
        } else if (typeof slide.content.data === 'object' && slide.content.data !== null) {
          contentText = JSON.stringify(slide.content.data, null, 2);
        } else {
          contentText = String(slide.content.data || '');
        }

        newSlide.addText(contentText, {
          x: 0.5, y: contentY, w: 9, h: 3.5,
          fontSize: 14,
          color: colors.text,
          valign: 'top'
        });
      }

      // Visual suggestion box
      newSlide.addShape(pres.ShapeType.rect, {
        x: 0.3, y: 5.5, w: 9.4, h: 0.8,
        fill: { color: colors.lightBg },
        line: { color: colors.accent, width: 1 }
      });

      newSlide.addText(`💡 Visual: ${slide.visualDescription}`, {
        x: 0.5, y: 5.6, w: 9, h: 0.6,
        fontSize: 10,
        color: colors.text,
        italic: true
      });

      // Speaker notes
      newSlide.addNotes(slide.speakerNotes);

      // Footer with BevGenie branding
      newSlide.addText('Generated by BevGenie AI', {
        x: 0.3, y: 7, w: 4, h: 0.3,
        fontSize: 10,
        color: colors.primary,
        italic: true
      });

      newSlide.addText(`${presentationData.session.duration} | ${presentationData.actualQuestions.length} questions`, {
        x: 5.5, y: 7, w: 4.2, h: 0.3,
        fontSize: 10,
        color: colors.text,
        align: 'right'
      });
    });

    // Save the presentation
    await pres.writeFile({ fileName: `BevGenie-Presentation-${Date.now()}.pptx` });
  };

  if (!hasQuestions) {
    return null; // Don't show until user has asked at least one question
  }

  return (
    <>
      {/* Floating Button */}
      {!isExpanded && !generatedSlides && (
        <button
          onClick={() => setIsExpanded(true)}
          className="fixed bottom-6 left-6 w-14 h-14 bg-gradient-to-br from-[#AA6C39] to-[#8B5A2B] hover:from-[#BB7C49] hover:to-[#9B6A3B] rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-40 group"
          aria-label="Generate Presentation"
        >
          <FileText className="w-6 h-6 text-white" />
          <div className="absolute inset-0 rounded-full border-4 border-[#AA6C39] animate-ping opacity-75" />

          {/* Badge showing questions count */}
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {presentationData.actualQuestions.length}
          </div>

          {/* Tooltip */}
          <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-[#0A1930] text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Generate Presentation
          </div>
        </button>
      )}

      {/* Success Button - Shows after generation */}
      {!isExpanded && generatedSlides && (
        <button
          onClick={() => setShowPreview(true)}
          className="fixed bottom-6 left-6 w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-40 group"
          aria-label="View Presentation"
        >
          <FileText className="w-6 h-6 text-white" />

          {/* Success Badge */}
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
            <span className="text-green-600 text-xs font-bold">✓</span>
          </div>

          {/* Tooltip */}
          <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-[#0A1930] text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            View & Download
          </div>
        </button>
      )}

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="fixed bottom-24 left-6 w-[420px] bg-white rounded-2xl shadow-2xl z-40 animate-scale-in border border-gray-200">
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

      {/* Preview Modal */}
      {showPreview && generatedSlides && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#AA6C39] to-[#8B5A2B] px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold text-xl">Your Presentation</h3>
                <p className="text-white/80 text-sm">{generatedSlides.length} slides generated</p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Download Options */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <button
                onClick={handleDownloadPPTX}
                className="w-full py-4 px-4 bg-gradient-to-r from-[#AA6C39] to-[#8B5A2B] hover:from-[#BB7C49] hover:to-[#9B6A3B] text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <Download className="w-5 h-5" />
                <span>Download PowerPoint Presentation</span>
              </button>
            </div>

            {/* Slides Preview */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {generatedSlides.map((slide) => (
                  <div key={slide.slideNumber} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    {/* Slide Header */}
                    <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-xs text-gray-300 mb-1">Slide {slide.slideNumber}</div>
                          <h4 className="text-xl font-bold text-white">{slide.title}</h4>
                          {slide.subtitle && (
                            <p className="text-sm text-gray-300 mt-1">{slide.subtitle}</p>
                          )}
                        </div>
                        <div className="px-3 py-1 bg-white/20 rounded-full text-xs text-white">
                          {slide.content.type}
                        </div>
                      </div>
                    </div>

                    {/* Slide Content */}
                    <div className="p-6 bg-gray-50">
                      {Array.isArray(slide.content.data) ? (
                        <ul className="space-y-2">
                          {slide.content.data.map((item: any, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-[#AA6C39] mt-1">•</span>
                              <span className="text-gray-700 text-sm">
                                {typeof item === 'string' ? item : JSON.stringify(item)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(slide.content.data, null, 2)}
                        </pre>
                      )}
                    </div>

                    {/* Visual Description */}
                    <div className="px-6 py-3 bg-blue-50 border-t border-blue-100">
                      <p className="text-xs font-medium text-blue-900 mb-1">Visual Suggestion</p>
                      <p className="text-sm text-blue-700">{slide.visualDescription}</p>
                    </div>

                    {/* Speaker Notes */}
                    <div className="px-6 py-3 bg-gray-100 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-1">Speaker Notes</p>
                      <p className="text-sm text-gray-600">{slide.speakerNotes}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Generated from {presentationData.actualQuestions.length} questions | ${presentationData.roi.costSaved} ROI
              </p>
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
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
