'use client';

import React from 'react';
import { COLORS } from '@/lib/constants/colors';
import { BookOpen, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

export interface KBDocument {
  id: string;
  content: string;
  source_type?: string;
  source_url?: string;
  persona_tags?: string[];
  pain_point_tags?: string[];
  similarity_score?: number;
}

interface KBContentShowcaseProps {
  documents: KBDocument[];
  title?: string;
  subtitle?: string;
}

/**
 * KB Content Showcase Component
 * Displays knowledge base documents in professional cards
 * with relevance indicators and source information
 */
export function KBContentShowcase({
  documents,
  title = 'Industry Insights',
  subtitle = 'Relevant knowledge base content',
}: KBContentShowcaseProps) {
  if (!documents || documents.length === 0) {
    return null;
  }

  return (
    <div className="kb-content-showcase">
      {title && (
        <h3
          className="text-3xl font-bold mb-2"
          style={{ color: COLORS.navy }}
        >
          {title}
        </h3>
      )}
      {subtitle && (
        <p className="mb-8 text-lg" style={{ color: COLORS.darkGray }}>
          {subtitle}
        </p>
      )}

      <div className="space-y-6">
        {documents.map((doc, idx) => (
          <KBDocumentCard
            key={doc.id || idx}
            document={doc}
            index={idx + 1}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual KB Document Card Component
 */
interface KBDocumentCardProps {
  document: KBDocument;
  index: number;
}

function KBDocumentCard({ document, index }: KBDocumentCardProps) {
  const relevancePercentage = Math.round((document.similarity_score || 0) * 100);
  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return '#10b981'; // Green
    if (score >= 0.6) return '#3b82f6'; // Blue
    return '#f59e0b'; // Amber
  };

  const getSourceIcon = (sourceType?: string) => {
    switch (sourceType?.toLowerCase()) {
      case 'regulatory':
        return <AlertCircle className="w-5 h-5" />;
      case 'market_data':
        return <TrendingUp className="w-5 h-5" />;
      case 'best_practice':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  return (
    <div
      className="kb-document-card p-6 rounded-xl border-2 hover:shadow-lg transition-all"
      style={{
        backgroundColor: COLORS.white,
        border: `2px solid ${COLORS.mediumGray}`,
      }}
    >
      {/* Header with relevance indicator */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div
            className="flex-shrink-0 mt-1"
            style={{ color: getRelevanceColor(document.similarity_score || 0) }}
          >
            {getSourceIcon(document.source_type)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-block px-2 py-1 text-xs font-bold rounded-full text-white"
                style={{
                  backgroundColor: getRelevanceColor(document.similarity_score || 0),
                }}
              >
                {relevancePercentage}% Match
              </span>
              {document.source_type && (
                <span
                  className="inline-block px-2 py-1 text-xs font-semibold rounded-full"
                  style={{
                    backgroundColor: `${COLORS.navy}22`,
                    color: COLORS.navy,
                  }}
                >
                  {document.source_type.replace(/_/g, ' ')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p
          className="text-base leading-relaxed"
          style={{ color: COLORS.darkGray }}
        >
          {document.content}
        </p>
      </div>

      {/* Tags */}
      {(document.persona_tags?.length || 0) > 0 || (document.pain_point_tags?.length || 0) > 0 ? (
        <div className="flex flex-wrap gap-2 pt-4 border-t" style={{ borderColor: COLORS.mediumGray }}>
          {document.persona_tags?.map((tag) => (
            <span
              key={tag}
              className="text-xs font-medium px-2 py-1 rounded-md"
              style={{
                backgroundColor: `${COLORS.cyan}22`,
                color: COLORS.cyan,
              }}
            >
              {tag}
            </span>
          ))}
          {document.pain_point_tags?.map((tag) => (
            <span
              key={tag}
              className="text-xs font-medium px-2 py-1 rounded-md"
              style={{
                backgroundColor: `#f59e0b22`,
                color: '#d97706',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {/* Source URL */}
      {document.source_url && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: COLORS.mediumGray }}>
          <a
            href={document.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium hover:underline"
            style={{ color: COLORS.cyan }}
          >
            View Source →
          </a>
        </div>
      )}
    </div>
  );
}
