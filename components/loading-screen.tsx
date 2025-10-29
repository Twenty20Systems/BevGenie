'use client';

import React from 'react';
import { COLORS } from '@/lib/constants/colors';

interface LoadingScreenProps {
  progress: number;
  stageName: string;
  isVisible: boolean;
}

/**
 * Loading Screen Component
 *
 * Displays:
 * - Dark navy overlay (95% opacity)
 * - Centered white card with cyan progress bar
 * - Real-time progress updates
 * - Professional B2B SaaS aesthetic
 */
export function LoadingScreen({
  progress,
  stageName,
  isVisible,
}: LoadingScreenProps) {
  if (!isVisible) return null;

  // Stage icons
  const getProgressIcon = (progress: number) => {
    if (progress < 25) return '🔄';
    if (progress < 50) return '🔍';
    if (progress < 75) return '⚙️';
    if (progress < 100) return '✨';
    return '✅';
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{ backgroundColor: COLORS.overlay }}
    >
      {/* Loading Card */}
      <div
        className="w-96 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-6"
        style={{ backgroundColor: COLORS.white }}
      >
        {/* Animated Icon */}
        <div className="text-5xl animate-bounce">
          {getProgressIcon(progress)}
        </div>

        {/* Stage Name */}
        <div className="text-center">
          <h3
            className="text-lg font-bold mb-2"
            style={{ color: COLORS.navy }}
          >
            {stageName || 'Processing...'}
          </h3>
          <p className="text-sm" style={{ color: COLORS.textGray }}>
            Please wait while we generate your personalized page
          </p>
        </div>

        {/* Progress Details */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold" style={{ color: COLORS.darkGray }}>
              Progress
            </span>
            <span
              className="text-xs font-bold"
              style={{ color: COLORS.cyan }}
            >
              {progress}%
            </span>
          </div>

          {/* Progress Bar */}
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: COLORS.mediumGray }}
          >
            <div
              className="h-full rounded-full transition-all duration-300 shadow-lg"
              style={{
                width: `${progress}%`,
                backgroundColor: COLORS.cyan,
              }}
            >
              {/* Shimmer effect */}
              <div
                className="h-full w-full opacity-30 animate-pulse"
                style={{
                  background: 'linear-gradient(90deg, transparent, white, transparent)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s infinite',
                }}
              />
            </div>
          </div>
        </div>

        {/* Status Dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full transition-all duration-500"
              style={{
                backgroundColor:
                  progress > (i + 1) * 33
                    ? COLORS.cyan
                    : COLORS.mediumGray,
              }}
            />
          ))}
        </div>

        {/* Footer Text */}
        <p className="text-xs text-center" style={{ color: COLORS.textGray }}>
          Generating insights from your beverage business data
        </p>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
}
