'use client';

import React from 'react';
import { DynamicPageRenderer } from '@/components/dynamic-page-renderer';
import type { BevGeniePage } from '@/lib/ai/page-specs';

interface DynamicContentProps {
  specification: BevGeniePage;
}

/**
 * Dynamic Content Component
 *
 * Renders AI-generated page specifications with:
 * - White background (no gradients)
 * - Professional B2B SaaS layout
 * - Chat bubble overlay at bottom-right
 * - Responsive design
 */
export function DynamicContent({ specification }: DynamicContentProps) {
  return (
    <div className="min-h-screen bg-white">
      <DynamicPageRenderer page={specification} />
    </div>
  );
}
