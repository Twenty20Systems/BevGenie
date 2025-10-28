/**
 * BevGenie Page Specification Types
 *
 * Defines the JSON schema for different types of dynamically generated pages.
 * This specification-based approach allows:
 * - LLM to generate pages without hallucinating custom components
 * - Validation of page quality before rendering
 * - Component registry pattern for pre-built, tested components
 * - Easy caching and persistence of generated pages
 */

/**
 * Base section types that can be composed into pages
 * Each section has a specific purpose and predefined props schema
 */

export interface HeroSection {
  type: 'hero';
  headline: string; // Main headline (50-100 chars)
  subheadline?: string; // Supporting text (100-150 chars)
  backgroundImage?: string; // URL to background image
  ctaButton?: {
    text: string;
    action: 'schedule_demo' | 'download' | 'contact' | 'learn_more';
  };
}

export interface FeatureGridSection {
  type: 'feature_grid';
  title?: string;
  subtitle?: string;
  columns: 2 | 3 | 4; // Layout flexibility
  features: Array<{
    icon?: string; // Icon name or emoji
    title: string;
    description: string;
  }>;
}

export interface TestimonialSection {
  type: 'testimonial';
  quote: string;
  author: string;
  company?: string;
  role?: string;
  metric?: string; // e.g., "78% ROI improvement"
  image?: string; // Profile image URL
}

export interface ComparisonTableSection {
  type: 'comparison_table';
  title?: string;
  headers: string[]; // First header is usually "Feature", then competitors
  rows: Array<{
    feature: string;
    values: (string | boolean)[];
  }>;
}

export interface CTASection {
  type: 'cta';
  title: string;
  description?: string;
  buttons: Array<{
    text: string;
    action: 'schedule_demo' | 'download' | 'contact' | 'learn_more' | 'replicate';
    primary?: boolean;
  }>;
  backgroundColor?: 'blue' | 'green' | 'purple';
}

export interface FAQSection {
  type: 'faq';
  title?: string;
  items: Array<{
    question: string;
    answer: string;
  }>;
}

export interface MetricsSection {
  type: 'metrics';
  title?: string;
  metrics: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
}

export interface StepsSection {
  type: 'steps';
  title?: string;
  steps: Array<{
    number: number;
    title: string;
    description: string;
  }>;
  timeline?: string; // e.g., "90 days"
}

/**
 * Union type for all possible sections
 */
export type PageSection =
  | HeroSection
  | FeatureGridSection
  | TestimonialSection
  | ComparisonTableSection
  | CTASection
  | FAQSection
  | MetricsSection
  | StepsSection;

/**
 * Page type definitions
 * Each page type has a specific purpose and recommended section structure
 */

export type PageType =
  | 'solution_brief'
  | 'feature_showcase'
  | 'case_study'
  | 'comparison'
  | 'implementation_roadmap'
  | 'roi_calculator';

/**
 * Solution Brief Page
 * Used when: User asks about a pain point or problem
 * Purpose: Show how BevGenie solves their specific challenge
 * Sections: Hero -> Features -> Testimonial -> CTA
 */
export interface SolutionBriefPage {
  type: 'solution_brief';
  title: string;
  description: string;
  persona?: string; // e.g., "craft_brewery_sales_focus"
  painPointsAddressed: string[];
  sections: [HeroSection, FeatureGridSection, TestimonialSection, CTASection];
}

/**
 * Feature Showcase Page
 * Used when: User asks about specific features or capabilities
 * Purpose: Highlight relevant features with detailed explanations
 * Sections: Hero -> FeatureGrid -> ComparisonTable -> CTA
 */
export interface FeatureShowcasePage {
  type: 'feature_showcase';
  title: string;
  description: string;
  focusArea: string; // e.g., "Field Sales Tracking"
  featuredFeatures: string[];
  sections: [HeroSection, FeatureGridSection, ComparisonTableSection, CTASection];
}

/**
 * Case Study Page
 * Used when: User asks for proof points or success stories
 * Purpose: Demonstrate real results with specific metrics
 * Sections: Hero -> Metrics -> Testimonial -> Steps -> CTA
 */
export interface CaseStudyPage {
  type: 'case_study';
  title: string;
  customerName: string;
  customerType: string; // e.g., "Craft Brewery"
  challenge: string;
  sections: [HeroSection, MetricsSection, TestimonialSection, StepsSection, CTASection];
}

/**
 * Comparison Page
 * Used when: User asks about competitors or how BevGenie compares
 * Purpose: Highlight unique advantages and differentiators
 * Sections: Hero -> ComparisonTable -> FeatureGrid -> Testimonials -> CTA
 */
export interface ComparisonPage {
  type: 'comparison';
  title: string;
  description: string;
  competitors: string[];
  sections: [
    HeroSection,
    ComparisonTableSection,
    FeatureGridSection,
    TestimonialSection,
    CTASection
  ];
}

/**
 * Implementation Roadmap Page
 * Used when: User asks about getting started or implementation timeline
 * Purpose: Show clear path to launch with realistic timeline
 * Sections: Hero -> Steps -> Timeline -> FAQ -> CTA
 */
export interface ImplementationRoadmapPage {
  type: 'implementation_roadmap';
  title: string;
  description: string;
  estimatedDuration: string; // e.g., "90 days"
  sections: [HeroSection, StepsSection, FAQSection, CTASection];
}

/**
 * ROI Calculator Page
 * Used when: User asks about cost, value, or ROI
 * Purpose: Help user understand financial impact with concrete numbers
 * Sections: Hero -> Metrics -> Features -> Testimonial -> CTA
 */
export interface ROICalculatorPage {
  type: 'roi_calculator';
  title: string;
  description: string;
  assumptions: Array<{
    label: string;
    defaultValue: number;
    unit: string;
  }>;
  sections: [HeroSection, MetricsSection, FeatureGridSection, CTASection];
}

/**
 * Union type for all BevGenie page types
 */
export type BevGeniePage =
  | SolutionBriefPage
  | FeatureShowcasePage
  | CaseStudyPage
  | ComparisonPage
  | ImplementationRoadmapPage
  | ROICalculatorPage;

/**
 * Metadata about a generated page
 * Used for storage, analytics, and debugging
 */
export interface PageMetadata {
  id: string;
  type: PageType;
  createdAt: Date;
  expiresAt?: Date; // Pages can be cached temporarily
  intent: string;
  intentConfidence: number;
  persona?: {
    userType?: string;
    company_size?: string;
    primary_pain_point?: string;
  };
  messageContext: {
    userMessage: string;
    conversationLength: number;
  };
}

/**
 * Validation rules for each section type
 * Used to ensure generated pages meet quality standards
 */
export const VALIDATION_RULES = {
  hero: {
    headline: { minLength: 10, maxLength: 100 },
    subheadline: { minLength: 20, maxLength: 150 },
  },
  feature_grid: {
    minFeatures: 2,
    maxFeatures: 6,
    featureTitle: { minLength: 5, maxLength: 50 },
    featureDescription: { minLength: 10, maxLength: 150 },
  },
  testimonial: {
    quote: { minLength: 20, maxLength: 300 },
    author: { minLength: 2, maxLength: 50 },
  },
  comparison_table: {
    minRows: 3,
    maxRows: 12,
    feature: { minLength: 5, maxLength: 50 },
  },
  cta: {
    title: { minLength: 10, maxLength: 100 },
    minButtons: 1,
    maxButtons: 3,
  },
  faq: {
    minItems: 2,
    maxItems: 8,
    question: { minLength: 10, maxLength: 100 },
    answer: { minLength: 20, maxLength: 500 },
  },
  metrics: {
    minMetrics: 1,
    maxMetrics: 5,
    value: { minLength: 1, maxLength: 20 },
  },
  steps: {
    minSteps: 2,
    maxSteps: 10,
    title: { minLength: 5, maxLength: 50 },
    description: { minLength: 10, maxLength: 200 },
  },
};

/**
 * Page type templates
 * Used to guide LLM on structure and content for each page type
 */
export const PAGE_TYPE_TEMPLATES: Record<PageType, string> = {
  solution_brief: `
    Solution Brief for BevGenie

    Purpose: Address a specific pain point the user mentioned

    Structure:
    1. Hero: Headline about solving their pain point
    2. Features: 3-4 key capabilities that solve the problem
    3. Testimonial: Success story from similar company
    4. CTA: Call to action (demo, case study)

    Tone: Professional, solution-focused, empathetic
    Length: ~2-3 minutes to read
  `,
  feature_showcase: `
    Feature Showcase Page

    Purpose: Highlight specific features the user asked about

    Structure:
    1. Hero: Feature headline and benefit
    2. Features: 4-6 key feature details
    3. Comparison: How this compares to traditional approaches
    4. CTA: Learn more, request demo

    Tone: Technical but accessible, benefits-focused
    Length: ~3-4 minutes to read
  `,
  case_study: `
    Case Study Page

    Purpose: Provide proof of concept with real metrics

    Structure:
    1. Hero: Customer success story headline
    2. Metrics: Key results (ROI, efficiency gains, etc.)
    3. Testimonial: Quote from customer
    4. Steps: How implementation happened
    5. CTA: Replicate success, book consultation

    Tone: Results-focused, inspiring, data-driven
    Length: ~4-5 minutes to read
  `,
  comparison: `
    Comparison Page

    Purpose: Show why BevGenie stands out from alternatives

    Structure:
    1. Hero: "Why BevGenie is different"
    2. Comparison Table: Feature-by-feature comparison
    3. Features: Unique advantages
    4. Testimonial: Customer preference story
    5. CTA: See full comparison, talk to expert

    Tone: Confident, fact-based, not attacking competitors
    Length: ~3-4 minutes to read
  `,
  implementation_roadmap: `
    Implementation Roadmap Page

    Purpose: Show clear path to launch with realistic timeline

    Structure:
    1. Hero: "Your path to success"
    2. Steps: Implementation phases
    3. FAQ: Common concerns addressed
    4. CTA: Start implementation, schedule kickoff

    Tone: Reassuring, clear, actionable
    Length: ~3-4 minutes to read
  `,
  roi_calculator: `
    ROI Calculator Page

    Purpose: Help user understand financial impact

    Structure:
    1. Hero: Calculate your ROI
    2. Metrics: Potential savings/gains based on industry averages
    3. Features: What drives the ROI
    4. CTA: Get detailed report, schedule deep dive

    Tone: Professional, data-driven, empowering
    Length: ~2-3 minutes to read
  `,
};

/**
 * Validate a page specification
 * Returns validation errors if the page doesn't meet quality standards
 */
export function validatePageSpec(page: BevGeniePage): string[] {
  const errors: string[] = [];

  // Validate basic structure
  if (!page.type || !page.title || !page.description) {
    errors.push('Missing required fields: type, title, or description');
    return errors;
  }

  // Validate sections array
  if (!page.sections || !Array.isArray(page.sections) || page.sections.length === 0) {
    errors.push('Page must contain at least one section');
    return errors;
  }

  // Validate each section
  page.sections.forEach((section, index) => {
    const sectionErrors = validateSection(section);
    sectionErrors.forEach((error) => {
      errors.push(`Section ${index} (${section.type}): ${error}`);
    });
  });

  return errors;
}

/**
 * Validate individual section
 */
function validateSection(section: PageSection): string[] {
  const errors: string[] = [];
  const rules = VALIDATION_RULES[section.type as keyof typeof VALIDATION_RULES];

  if (!rules) {
    errors.push(`Unknown section type: ${section.type}`);
    return errors;
  }

  // Type-specific validation
  switch (section.type) {
    case 'hero':
      if (
        !section.headline ||
        section.headline.length < (rules.headline?.minLength || 10)
      ) {
        errors.push(`Headline too short (min ${rules.headline?.minLength} chars)`);
      }
      if (
        section.headline &&
        section.headline.length > (rules.headline?.maxLength || 100)
      ) {
        errors.push(`Headline too long (max ${rules.headline?.maxLength} chars)`);
      }
      break;

    case 'feature_grid':
      if (!section.features || section.features.length < (rules.minFeatures || 2)) {
        errors.push(`Too few features (min ${rules.minFeatures})`);
      }
      if (section.features && section.features.length > (rules.maxFeatures || 6)) {
        errors.push(`Too many features (max ${rules.maxFeatures})`);
      }
      section.features?.forEach((feature, i) => {
        if (!feature.title || !feature.description) {
          errors.push(`Feature ${i}: Missing title or description`);
        }
      });
      break;

    case 'cta':
      if (!section.buttons || section.buttons.length < (rules.minButtons || 1)) {
        errors.push(`Too few buttons (min ${rules.minButtons})`);
      }
      if (section.buttons && section.buttons.length > (rules.maxButtons || 3)) {
        errors.push(`Too many buttons (max ${rules.maxButtons})`);
      }
      break;

    case 'faq':
      if (!section.items || section.items.length < (rules.minItems || 2)) {
        errors.push(`Too few FAQ items (min ${rules.minItems})`);
      }
      if (section.items && section.items.length > (rules.maxItems || 8)) {
        errors.push(`Too many FAQ items (max ${rules.maxItems})`);
      }
      break;

    case 'steps':
      if (!section.steps || section.steps.length < (rules.minSteps || 2)) {
        errors.push(`Too few steps (min ${rules.minSteps})`);
      }
      if (section.steps && section.steps.length > (rules.maxSteps || 10)) {
        errors.push(`Too many steps (max ${rules.maxSteps})`);
      }
      break;

    case 'metrics':
      if (!section.metrics || section.metrics.length < (rules.minMetrics || 1)) {
        errors.push(`Too few metrics (min ${rules.minMetrics})`);
      }
      if (section.metrics && section.metrics.length > (rules.maxMetrics || 5)) {
        errors.push(`Too many metrics (max ${rules.maxMetrics})`);
      }
      break;
  }

  return errors;
}
