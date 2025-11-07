'use client';

import React, { useMemo } from 'react';
import { BevGeniePage, PageSection, sanitizePageContent } from '@/lib/ai/page-specs';
import { COLORS } from '@/lib/constants/colors';
import { Download, Share2, ExternalLink, ArrowRight, Target, BarChart3, TrendingUp, Zap, Users, Map as MapIcon, Award, Shield } from 'lucide-react';
import { SingleScreenSection } from '@/components/genie/single-screen-section';

/**
 * Get section heights directly from LLM's layout guidance
 * NO frontend calculations - LLM decides everything
 */
function getSectionHeightsFromLLM(sections: PageSection[]): Map<number, string> {
  const heightMap = new Map<number, string>();
  const AVAILABLE_VH = 87; // 100vh - 13vh for header

  let totalRequested = 0;
  let sectionsWithoutHeight = 0;

  // First pass: collect LLM's explicit height requests
  sections.forEach((section: any, index) => {
    if (section.layout?.requestedHeightPercent) {
      totalRequested += section.layout.requestedHeightPercent;
    } else {
      sectionsWithoutHeight++;
    }
  });

  // Second pass: assign heights
  sections.forEach((section: any, index) => {
    if (section.layout?.requestedHeightPercent) {
      // Use LLM's explicit request
      const vh = Math.floor((section.layout.requestedHeightPercent / 100) * AVAILABLE_VH);
      heightMap.set(index, `${vh}vh`);
    } else if (sectionsWithoutHeight > 0) {
      // Distribute remaining space equally
      const remaining = AVAILABLE_VH - Math.floor((totalRequested / 100) * AVAILABLE_VH);
      const autoVH = Math.floor(remaining / sectionsWithoutHeight);
      heightMap.set(index, `${autoVH}vh`);
    }
  });

  console.log('🎨 [LLM Heights]:',
    Array.from(heightMap.entries()).map(([idx, height]) => {
      const section: any = sections[idx];
      const requested = section.layout?.requestedHeightPercent;
      return `${section.type}: ${height}${requested ? ` (LLM requested ${requested}%)` : ' (auto)'}`;
    }).join(', ')
  );

  return heightMap;
}

interface DynamicPageRendererProps {
  page: BevGeniePage;
  onDownload?: () => void;
  onShare?: () => void;
  onNavigationClick?: (action: string, context?: any) => void;
  compact?: boolean; // For displaying in chat vs full page
  onBackToHome?: () => void;
}

/**
 * Dynamic Page Renderer
 *
 * Converts BevGenie page specifications (JSON) into rendered React components.
 * Supports 6 page types and 8 section types with consistent styling.
 * Automatically sizes sections to fit within 100vh viewport.
 */
export function DynamicPageRenderer({
  page,
  onDownload,
  onShare,
  onNavigationClick,
  compact = false,
  onBackToHome,
}: DynamicPageRendererProps) {
  // 🚨 DEBUG: Log received page data
  console.log('🎨 [Renderer] Received page:', {
    type: page.type,
    title: page.title?.substring(0, 50),
    sectionCount: page.sections?.length || 0,
    sectionTypes: page.sections?.map(s => s.type).join(', ') || 'none'
  });

  // Sanitize content to ensure it fits on screen (safety measure)
  const sanitizedPage = useMemo(() => sanitizePageContent(page), [page]);

  // Get section heights from LLM's layout decisions (not frontend calculations)
  const sectionHeights = useMemo(() =>
    getSectionHeightsFromLLM(sanitizedPage.sections),
    [sanitizedPage.sections]
  );

  // Build CSS Grid template rows from calculated heights
  const gridTemplateRows = sanitizedPage.sections
    .map((_, idx) => sectionHeights.get(idx) || '1fr')
    .join(' ');

  return (
    <div
      className={`dynamic-page-renderer w-full h-full ${compact ? 'compact' : 'full'}`}
      style={{
        display: 'grid',
        gridTemplateRows,
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Render sections in grid cells */}
      {sanitizedPage.sections.map((section, index) => (
        <SectionRenderer
          key={index}
          section={section}
          index={index}
          onNavigationClick={onNavigationClick}
          onBackToHome={onBackToHome}
        />
      ))}
    </div>
  );
}

/**
 * Section Renderer
 * Routes to appropriate section component based on section type
 * CSS Grid handles positioning - no wrapper needed
 */
function SectionRenderer({
  section,
  index,
  onNavigationClick,
  onBackToHome,
}: {
  section: PageSection;
  index: number;
  onNavigationClick?: (action: string, context?: any) => void;
  onBackToHome?: () => void;
}) {
  // Grid cell wrapper - lets grid handle sizing
  const gridCellStyle: React.CSSProperties = {
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  };

  switch (section.type) {
    case 'single_screen':
      return (
        <div style={gridCellStyle}>
          <SingleScreenSection
            headline={(section as any).headline}
            subtitle={(section as any).subtitle}
            insights={(section as any).insights}
            stats={(section as any).stats}
            visualContent={(section as any).visualContent}
            howItWorks={(section as any).howItWorks}
            ctas={(section as any).ctas}
            onCTAClick={onNavigationClick}
            onBackToHome={onBackToHome}
          />
        </div>
      );
    case 'hero':
      return (
        <div style={gridCellStyle}>
          <HeroSection section={section} onNavigationClick={onNavigationClick} />
        </div>
      );
    case 'feature_grid':
      return (
        <div style={gridCellStyle}>
          <FeatureGridSection section={section} onNavigationClick={onNavigationClick} />
        </div>
      );
    // Testimonial sections removed - BevGenie is a new product
    case 'comparison_table':
      return (
        <div style={gridCellStyle}>
          <ComparisonTableSection section={section} />
        </div>
      );
    case 'cta':
      return (
        <div style={gridCellStyle}>
          <CTASection section={section} onNavigationClick={onNavigationClick} />
        </div>
      );
    case 'faq':
      return (
        <div style={gridCellStyle}>
          <FAQSection section={section} />
        </div>
      );
    case 'metrics':
      return (
        <div style={gridCellStyle}>
          <MetricsSection section={section} />
        </div>
      );
    case 'steps':
      return (
        <div style={gridCellStyle}>
          <StepsSection section={section} onNavigationClick={onNavigationClick} />
        </div>
      );
    default:
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          Unknown section type: {(section as any).type}
        </div>
      );
  }
}

/**
 * Hero Section Component
 * Premium design with dark gradient background, animated blur elements, and always-visible CTAs
 */
function HeroSection({
  section,
  onNavigationClick,
}: {
  section: any;
  onNavigationClick?: (action: string, context?: any) => void;
}) {
  // Split headline to apply gradient to last word
  const words = section.headline?.split(' ') || [];
  const lastWord = words[words.length - 1];
  const restOfHeadline = words.slice(0, -1).join(' ');

  return (
    <div className="hero-section relative h-full flex items-center justify-center overflow-hidden px-6 md:px-12">
      {/* Gradient background - DARK NAVY */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A1628] via-[#1e3a5f] to-[#0A1628]" />

      {/* Floating blur elements - ANIMATED */}
      <div className="absolute top-[10%] right-[5%] w-[30%] h-[40%] bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[10%] left-[5%] w-[30%] h-[40%] bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="max-w-5xl relative z-10 w-full text-center">
        {/* Badge */}
        <div className="inline-block mb-4 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 backdrop-blur-sm">
          <span className="text-sm font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Market Intelligence Platform
          </span>
        </div>

        {/* Headline with gradient on last word */}
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
          <span className="text-white">{restOfHeadline} </span>
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            {lastWord}
          </span>
        </h2>

        {/* Subheadline */}
        {section.subheadline && (
          <p className="text-lg md:text-xl text-slate-300 mb-6 max-w-3xl mx-auto leading-relaxed">
            {section.subheadline}
          </p>
        )}

        {/* CTA Buttons - ALWAYS SHOW */}
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => onNavigationClick?.('explore_features', { source: 'hero_primary_cta' })}
            className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-semibold hover:shadow-2xl hover:shadow-cyan-500/50 transition-all hover:-translate-y-1 flex items-center gap-2 text-white"
          >
            {section.ctaButton?.text || 'Explore Features'}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => onNavigationClick?.('schedule_demo', { source: 'hero_secondary_cta' })}
            className="px-8 py-4 bg-white/10 backdrop-blur-sm rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition-all hover:-translate-y-1 text-white"
          >
            Schedule Demo
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Icon mapping for common feature types
 * Maps feature title keywords to Lucide React icons
 */
const FEATURE_ICONS: Record<string, React.ReactElement> = {
  'performance': <BarChart3 className="w-6 h-6" />,
  'intelligence': <Zap className="w-6 h-6" />,
  'distributor': <Users className="w-6 h-6" />,
  'competitive': <Target className="w-6 h-6" />,
  'gap': <TrendingUp className="w-6 h-6" />,
  'account': <Award className="w-6 h-6" />,
  'prioritization': <MapIcon className="w-6 h-6" />,
  'optimization': <Shield className="w-6 h-6" />,
  'default': <Zap className="w-6 h-6" />
};

/**
 * Get appropriate icon based on feature title
 */
function getFeatureIcon(title: string): React.ReactElement {
  const lowerTitle = title.toLowerCase();
  for (const [key, icon] of Object.entries(FEATURE_ICONS)) {
    if (lowerTitle.includes(key)) {
      return icon;
    }
  }
  return FEATURE_ICONS.default;
}

/**
 * Feature Grid Section Component
 * Grid of features with icons and descriptions - Premium design with gradient cards and hover effects
 */
function FeatureGridSection({ section, onNavigationClick }: { section: any; onNavigationClick?: any }) {
  const gradients = [
    'from-cyan-500 to-blue-600',
    'from-blue-600 to-purple-600',
    'from-purple-600 to-pink-600',
    'from-pink-600 to-orange-500'
  ];

  return (
    <div className="feature-grid-section h-full flex flex-col px-6 md:px-12 py-6 overflow-hidden bg-gradient-to-br from-[#0A1628] to-[#1e3a5f]">
      {section.title && (
        <div className="text-center mb-6 flex-shrink-0">
          <h3 className="text-3xl md:text-4xl font-bold mb-3 text-white">
            {section.title}
          </h3>
          {section.subtitle && (
            <p className="text-base md:text-lg text-slate-300">
              {section.subtitle}
            </p>
          )}
        </div>
      )}

      <div className="flex-1 grid md:grid-cols-3 gap-6 max-w-7xl mx-auto w-full overflow-hidden">
        {section.features?.map((feature: any, idx: number) => {
          const icon = getFeatureIcon(feature.title);

          return (
            <div
              key={idx}
              onClick={() => onNavigationClick?.('feature_detail', { feature: feature.title })}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 p-6 hover:border-cyan-400/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/20 cursor-pointer flex flex-col"
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${gradients[idx % 4]} transition-opacity duration-500`} />

              {/* Icon with gradient */}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradients[idx % 4]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 flex-shrink-0 shadow-lg text-white`}>
                {icon}
              </div>

              {/* Content */}
              <h4 className="text-xl font-bold mb-3 text-white group-hover:text-cyan-400 transition-colors">
                {feature.title}
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed flex-1">
                {feature.description}
              </p>

              {/* Hover Arrow */}
              <div className="mt-4 flex items-center gap-2 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-sm font-semibold">Learn More</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Testimonial Section Component
 * Customer quote with attribution
 */
function TestimonialSection({ section }: { section: any }) {
  return (
    <div className="testimonial-section">
      <div
        className="p-8 rounded-lg"
        style={{
          backgroundColor: COLORS.lightGray,
          borderLeft: `4px solid ${COLORS.cyan}`,
        }}
      >
        <div className="flex items-start gap-4">
          {section.image && (
            <img
              src={section.image}
              alt={section.author}
              className="w-16 h-16 rounded-full object-cover flex-shrink-0"
            />
          )}
          <div className="flex-grow">
            <blockquote
              className="text-lg italic mb-4"
              style={{ color: COLORS.darkGray }}
            >
              "{section.quote}"
            </blockquote>
            <div>
              <p
                className="font-semibold"
                style={{ color: COLORS.navy }}
              >
                {section.author}
              </p>
              {section.role && (
                <p className="text-sm" style={{ color: COLORS.textGray }}>
                  {section.role}
                </p>
              )}
              {section.company && (
                <p className="text-sm" style={{ color: COLORS.textGray }}>
                  {section.company}
                </p>
              )}
              {section.metric && (
                <p
                  className="text-sm font-semibold mt-2"
                  style={{ color: COLORS.cyan }}
                >
                  {section.metric}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Comparison Table Section Component
 * Feature-by-feature comparison matrix
 */
function ComparisonTableSection({ section }: { section: any }) {
  return (
    <div className="comparison-table-section">
      {section.title && (
        <h3
          className="text-2xl font-bold mb-6"
          style={{ color: COLORS.navy }}
        >
          {section.title}
        </h3>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: COLORS.navy, color: COLORS.white }}>
              {section.headers?.map((header: string, idx: number) => (
                <th
                  key={idx}
                  className="px-6 py-4 text-left font-semibold border"
                  style={{ borderColor: COLORS.mediumGray }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section.rows?.map((row: any, rowIdx: number) => (
              <tr
                key={rowIdx}
                style={{
                  backgroundColor:
                    rowIdx % 2 === 0 ? COLORS.white : COLORS.lightGray,
                }}
              >
                <td
                  className="px-6 py-4 font-semibold border"
                  style={{
                    color: COLORS.navy,
                    borderColor: COLORS.mediumGray,
                  }}
                >
                  {row.feature}
                </td>
                {row.values.map((value: any, colIdx: number) => (
                  <td
                    key={colIdx}
                    className="px-6 py-4 border text-center"
                    style={{
                      color: COLORS.darkGray,
                      borderColor: COLORS.mediumGray,
                    }}
                  >
                    {typeof value === 'boolean' ? (
                      value ? (
                        <span style={{ color: COLORS.cyan, fontWeight: 'bold' }}>
                          ✓
                        </span>
                      ) : (
                        <span style={{ color: COLORS.copper, fontWeight: 'bold' }}>
                          ✗
                        </span>
                      )
                    ) : (
                      value
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * CTA Section Component
 * Premium animated gradient banner with interactive buttons
 */
function CTASection({
  section,
  onNavigationClick,
}: {
  section: any;
  onNavigationClick?: (action: string, context?: any) => void;
}) {
  const handleButtonClick = (button: any) => {
    if (onNavigationClick) {
      onNavigationClick(button.action || 'cta_click', {
        text: button.text,
        context: section.title,
        isPrimary: button.primary,
      });
    }
  };

  return (
    <div className="cta-section relative h-full flex items-center justify-center overflow-hidden px-6 md:px-12">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 animate-gradient-x" />

      {/* Floating blur elements with staggered animation */}
      <div className="absolute top-[20%] right-[10%] w-[25%] h-[50%] bg-white/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[20%] left-[10%] w-[25%] h-[50%] bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />

      <div className="relative z-10 max-w-4xl text-center">
        <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
          {section.title}
        </h3>
        {section.description && (
          <p className="text-lg md:text-xl mb-8 text-white/90 max-w-2xl mx-auto leading-relaxed">
            {section.description}
          </p>
        )}

        <div className="flex flex-wrap gap-4 justify-center">
          {section.buttons?.length > 0 ? (
            section.buttons.map((button: any, idx: number) => (
              <button
                key={idx}
                onClick={() => handleButtonClick(button)}
                className={`group px-8 py-4 font-semibold rounded-xl transition-all duration-300 hover:-translate-y-1 flex items-center gap-2 ${
                  button.primary
                    ? 'bg-white text-blue-600 hover:shadow-2xl hover:shadow-white/30'
                    : 'bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 hover:bg-white/30'
                }`}
              >
                {button.text}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            ))
          ) : (
            <>
              <button
                onClick={() => onNavigationClick?.('get_started', { source: 'cta_primary' })}
                className="group px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:shadow-2xl hover:shadow-white/30 transition-all hover:-translate-y-1 flex items-center gap-2"
              >
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => onNavigationClick?.('contact_sales', { source: 'cta_secondary' })}
                className="group px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl border-2 border-white/30 hover:bg-white/30 transition-all hover:-translate-y-1 flex items-center gap-2"
              >
                Contact Sales
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * FAQ Section Component
 * Accordion-style frequently asked questions
 */
function FAQSection({ section }: { section: any }) {
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);

  return (
    <div className="faq-section">
      {section.title && (
        <h3
          className="text-2xl font-bold mb-6"
          style={{ color: COLORS.navy }}
        >
          {section.title}
        </h3>
      )}

      <div className="space-y-3">
        {section.items?.map((item: any, idx: number) => (
          <div
            key={idx}
            className="rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            style={{
              backgroundColor: COLORS.white,
              border: `1px solid ${COLORS.mediumGray}`,
            }}
          >
            <button
              onClick={() =>
                setExpandedIndex(expandedIndex === idx ? null : idx)
              }
              className="w-full px-6 py-4 text-left font-semibold flex items-center justify-between transition-colors"
              style={{
                backgroundColor: COLORS.lightGray,
                color: COLORS.navy,
              }}
            >
              {item.question}
              <span
                className={`transform transition-transform ${
                  expandedIndex === idx ? 'rotate-180' : ''
                }`}
              >
                ▼
              </span>
            </button>
            {expandedIndex === idx && (
              <div
                className="px-6 py-4 border-t"
                style={{
                  color: COLORS.darkGray,
                  backgroundColor: COLORS.white,
                  borderColor: COLORS.mediumGray,
                }}
              >
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Metrics Section Component
 * Display key metrics and statistics - Modern design with gradient numbers
 */
function MetricsSection({ section }: { section: any }) {
  return (
    <div className="metrics-section h-full flex flex-col justify-center py-6 px-6 md:px-12">
      {section.title && (
        <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 text-center" style={{ color: COLORS.navy }}>
          {section.title}
        </h3>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {section.metrics?.map((metric: any, idx: number) => (
          <div
            key={idx}
            className="metric-card p-4 md:p-6 rounded-xl text-center hover:shadow-xl transition-all hover:-translate-y-1 duration-300 border-2"
            style={{
              backgroundColor: COLORS.white,
              borderColor: COLORS.mediumGray,
            }}
          >
            <div className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-[#AA6C39] to-[#00C8FF] bg-clip-text text-transparent">
              {metric.value}
            </div>
            <p className="text-sm md:text-base lg:text-lg font-bold mb-1" style={{ color: COLORS.navy }}>
              {metric.label}
            </p>
            {metric.description && (
              <p className="text-xs md:text-sm leading-relaxed" style={{ color: COLORS.darkGray }}>
                {metric.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Steps Section Component
 * Implementation or process steps with gradient timeline
 */
function StepsSection({ section }: { section: any }) {
  return (
    <div className="steps-section h-full flex flex-col justify-center py-6 px-6 md:px-12">
      {section.title && (
        <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3" style={{ color: COLORS.navy }}>
          {section.title}
        </h3>
      )}
      {section.timeline && (
        <p className="text-base md:text-lg font-semibold mb-6 bg-gradient-to-r from-[#AA6C39] to-[#00C8FF] bg-clip-text text-transparent">
          Timeline: {section.timeline}
        </p>
      )}

      <div className="relative flex-1">
        {/* Vertical gradient line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 hidden md:block bg-gradient-to-b from-[#AA6C39] via-[#00C8FF] to-[#AA6C39]" />

        {/* Steps */}
        <div className="space-y-4">
          {section.steps?.map((step: any, idx: number) => (
            <div key={idx} className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 rounded-full text-white font-bold text-base shadow-lg bg-gradient-to-br from-[#AA6C39] to-[#00C8FF]">
                  {step.number}
                </div>
              </div>
              <div className="flex-grow p-4 bg-white rounded-xl border-2 hover:shadow-xl hover:-translate-y-1 transition-all" style={{ borderColor: COLORS.mediumGray }}>
                <h4 className="text-base md:text-lg font-bold mb-1" style={{ color: COLORS.navy }}>
                  {step.title}
                </h4>
                <p className="text-sm md:text-base leading-relaxed" style={{ color: COLORS.textGray }}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

