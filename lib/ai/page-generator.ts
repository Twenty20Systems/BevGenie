/**
 * Page Generation Engine
 *
 * Uses Claude to generate page specifications based on:
 * - User intent and message
 * - Current persona profile
 * - Knowledge base context
 * - BevGenie page type definitions
 *
 * Ensures generated pages are high-quality by:
 * - Providing clear prompts with page type templates
 * - Validating output against spec schema
 * - Retrying with adjusted prompts on failure
 * - Gracefully degrading to text response if generation fails
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  BevGeniePage,
  PageType,
  PAGE_TYPE_TEMPLATES,
  validatePageSpec,
} from './page-specs';
import { PersonaScores } from '@/lib/session/types';

const client = new Anthropic();

export interface KBDocument {
  id: string;
  content: string;
  source_type?: string;
  source_url?: string;
  persona_tags?: string[];
  pain_point_tags?: string[];
  similarity_score?: number;
}

export interface PageGenerationRequest {
  userMessage: string;
  pageType: PageType;
  persona?: PersonaScores;
  knowledgeContext?: string[];
  knowledgeDocuments?: KBDocument[];
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  personaDescription?: string;
  pageContext?: any; // Context from user interactions (button clicks, navigation)
  interactionSource?: string; // Source of interaction (hero_cta_click, cta_click, learn_more, etc.)
}

export interface PageGenerationResponse {
  success: boolean;
  page?: BevGeniePage;
  error?: string;
  retryCount?: number;
  generationTime?: number;
}

/**
 * Generate a page specification using Claude
 * Main entry point for page generation
 */
export async function generatePageSpec(
  request: PageGenerationRequest
): Promise<PageGenerationResponse> {
  const startTime = Date.now();
  let retryCount = 0;
  const maxRetries = 2;

  while (retryCount <= maxRetries) {
    try {
      const page = await attemptPageGeneration(request, retryCount);

      // Validate the generated page
      const validationErrors = validatePageSpec(page);
      if (validationErrors.length === 0) {
        return {
          success: true,
          page,
          retryCount,
          generationTime: Date.now() - startTime,
        };
      }

      // If validation fails and we have retries left, try again with feedback
      if (retryCount < maxRetries) {
        retryCount++;
        // Adjust request for retry with validation feedback
        request = {
          ...request,
          userMessage: `${request.userMessage}\n\n[Previous attempt had validation issues: ${validationErrors.join(', ')}. Please regenerate with these corrections.]`,
        };
        continue;
      }

      // All retries exhausted
      return {
        success: false,
        error: `Validation failed after ${maxRetries} retries: ${validationErrors.join(', ')}`,
        retryCount,
        generationTime: Date.now() - startTime,
      };
    } catch (error) {
      if (retryCount < maxRetries) {
        retryCount++;
        continue;
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during page generation',
        retryCount,
        generationTime: Date.now() - startTime,
      };
    }
  }

  return {
    success: false,
    error: 'Max retries exceeded',
    retryCount,
    generationTime: Date.now() - startTime,
  };
}

/**
 * Internal function to attempt page generation with Claude
 */
async function attemptPageGeneration(
  request: PageGenerationRequest,
  retryCount: number
): Promise<BevGeniePage> {
  const systemPrompt = buildSystemPrompt(request, retryCount);
  const userPrompt = buildUserPrompt(request);

  const response = await client.messages.create({
    model: 'claude-opus-4-1-20250805',
    max_tokens: 4000,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  // Extract the text response
  const textContent = response.content.find((block) => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  // Parse the JSON from the response
  let pageSpec: BevGeniePage;
  try {
    // Try to extract JSON from the response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    pageSpec = JSON.parse(jsonMatch[0]) as BevGeniePage;
  } catch (error) {
    throw new Error(`Failed to parse page specification: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return pageSpec;
}

/**
 * Build the system prompt for page generation
 * Provides context about page types, structure, and requirements
 */
function buildSystemPrompt(
  request: PageGenerationRequest,
  retryCount: number
): string {
  const template = PAGE_TYPE_TEMPLATES[request.pageType];
  const retryNote =
    retryCount > 0
      ? `\n\nNote: This is retry attempt ${retryCount}. Please pay careful attention to the schema requirements and ensure all fields are present and valid.`
      : '';

  return `You are an expert B2B SaaS marketing page generator specializing in the beverage industry. You create professional, detailed, and personalized pages for BevGenie - a beverage industry intelligence platform.

Your task is to generate a professional ${request.pageType} page specification that will be rendered as a full-featured React website component.

Page Type: ${request.pageType}
${template}

CRITICAL REQUIREMENTS:
1. Output ONLY valid JSON that matches the BevGeniePage schema
2. Do NOT include markdown formatting, code blocks, or explanations - output JSON only
3. Ensure all required fields are present and complete
4. Follow the character limits specified in validation rules
5. Create DETAILED, SPECIFIC, and PROFESSIONAL content for the beverage industry
6. Include concrete metrics, data points, and industry-specific insights from the knowledge base
7. Make headlines compelling and subheadlines supporting - not redundant
8. Create action-oriented CTAs with clear business value
9. Structure content to flow logically from problem → insight → solution → action
10. Use professional B2B SaaS language appropriate for C-suite executives and department heads

DESIGN & VISUAL REQUIREMENTS - BEVGENIE DESIGN SYSTEM:
The generated pages will use BevGenie's modern design system with production-ready styling:

BevGenie Brand Colors (PRIMARY - Use These):
- Copper: #AA6C39 (primary brand color for CTAs, accents, icons)
- Dark Copper: #8B5A2B (hover states, darker accents)
- Cyan: #00C8FF (secondary brand color for highlights, links)
- Dark Cyan: #00B8EF (hover states for cyan elements)
- Navy: #0A1930 (dark backgrounds, text, headers)
- White: #FFFFFF (clean backgrounds)
- Light Gray: #F9FAFB (alternating section backgrounds)

Brand Gradients (Use for Impact):
- Copper Gradient: from-[#AA6C39] to-[#8B5A2B] (primary buttons, hero sections)
- Cyan Gradient: from-[#00C8FF] to-[#00B8EF] (secondary accents, highlights)
- Copper-Cyan Gradient: from-[#AA6C39] to-[#00C8FF] (special elements, gradient text)
- Dark Gradient: from-[#0A1930] to-[#243b53] (dramatic backgrounds)

Typography Scale (Use Larger Fonts for Modern Feel):
- Headlines: text-5xl lg:text-6xl xl:text-7xl (48-72px) - Make them BIG
- Subheadlines: text-2xl lg:text-3xl (24-30px)
- Body Text: text-xl (20px) - More readable than text-base
- Small Text: text-sm (14px)

Available Professional Components:
- Hero sections with gradient backgrounds and floating blur elements
- Stats/Metrics grids with large gradient numbers
- Feature cards with hover effects and gradient icons
- Timeline/Steps with connecting gradient lines
- CTA sections with dramatic gradient backgrounds
- Comparison tables with branded styling

Animation Classes Available:
- animate-fade-in: Smooth fade-in (0.5s)
- animate-slide-up: Slide up from bottom (0.6s)
- animate-slide-in-left/right: Directional slides
- animate-scale-in: Scale up effect (0.4s)
- animate-float: Floating animation for decorative elements
- animate-pulse-slow: Slow pulse for attention
- animate-stagger-1/2/3: Sequential animation delays
- gradient-text: Copper-to-cyan gradient text effect

Modern Hover Effects (Apply to Interactive Elements):
- hover:-translate-y-1 hover:shadow-xl: Lift effect on cards
- hover:-translate-y-2: Stronger lift for primary actions
- hover:scale-110: Icon scaling on hover
- hover:border-[#00C8FF]: Border color change
- group and group-hover: Parent-child hover interactions
- glow-copper / glow-cyan: Branded glow effects

Pattern Utilities:
- pattern-dots: Subtle dot pattern background
- pattern-grid: Subtle grid pattern background

CRITICAL SPACING & SIZE GUIDELINES:
- Sections: py-20 (80px vertical padding) for generous whitespace
- Cards: p-8 (32px padding) for comfortable spacing
- Grid gaps: gap-8 or gap-12 for breathing room
- Button padding: px-8 py-4 for substantial CTAs
- Icon sizes: w-16 h-16 for feature icons (larger than typical)

MODERN VISUAL PATTERNS TO FOLLOW:
1. Hero Sections:
   - min-h-[85vh] to fill viewport
   - Floating blur elements with animate-pulse
   - Large gradient headlines (5xl-7xl)
   - Two-column grid on desktop
   - Decorative elements in background

2. Stats/Metrics:
   - Large gradient numbers (text-5xl)
   - 4-column grid on desktop
   - Hover lift effects
   - Icon in gradient container
   - Clear labels and descriptions

3. Feature Cards:
   - Larger padding (p-8)
   - Gradient border glow on hover
   - Icon size w-16 h-16
   - Hover lift with shadow increase
   - Gradient icon backgrounds

4. CTAs:
   - Dramatic gradient backgrounds
   - Large buttons (px-10 py-5)
   - White text on dark gradient
   - Contrasting button styles
   - Trust indicators below buttons

Your JSON output should leverage these modern styles for maximum visual impact

CONTENT GUIDELINES:
- Beverage Industry Focus: Reference specific categories (spirits, beer, wine, non-alcoholic), market segments, and distributor challenges
- Use Real Metrics: Cite specific percentage improvements, market growth rates, efficiency gains from the KB context
- Address Pain Points: Directly solve the user's business challenges with concrete solutions using KB insights
- Show ROI: Include expected financial benefits, efficiency improvements, time savings mentioned in KB
- Use Specific Examples: Reference real scenarios from the beverage industry found in KB documents
- PERSONALIZATION: Each query must generate different content based on the KB documents retrieved - NEVER generic

SECTION COMPOSITION FOR EACH PAGE TYPE:
- Solution Brief: Hero (problem-focused) → Features (benefits) → Metrics (proof) → Testimonial (trust) → CTA (action)
- Feature Showcase: Hero (feature intro) → Feature Grid (detailed features) → Metrics (results) → FAQ (objections) → CTA
- Case Study: Hero (results) → Metrics (proof) → Steps (process) → Testimonial (impact) → CTA
- Comparison: Hero (positioning) → Comparison Table (analysis) → Steps (next steps) → FAQ (questions) → CTA
- Implementation Roadmap: Hero (journey) → Steps (detailed timeline) → Feature Grid (capabilities) → Metrics (milestones) → CTA
- ROI Calculator: Hero (value prop) → Metrics (starting assumptions) → Steps (calculation method) → Feature Grid (inputs) → CTA

Schema Reference:
- type: string (must be "${request.pageType}")
- title: string (required, compelling page title, 50-100 chars)
- description: string (required, executive summary, 150-250 chars)
- sections: array of section objects (required, minimum 4-5 sections)

Each section has a type property with requirements:
- "hero": headline (50-100 chars), subheadline (100-150 chars), ctaButton with text/action
- "feature_grid": title, subtitle, columns (2-4), features array with icon/title/description
- "testimonial": quote (100-200 chars), author, company, role, metric (optional), image URL (optional)
- "comparison_table": title, headers array, rows with feature/values
- "cta": title, description (optional), buttons array with text/action/primary boolean
- "faq": title (optional), items array with question/answer pairs
- "metrics": title (optional), metrics array with value/label/description
- "steps": title (optional), steps array with number/title/description, timeline (optional)

STYLING & ANIMATION IMPLEMENTATION:
- Hero sections: Use gradient backgrounds (from-[#AA6C39] via-[#0A1930] to-[#243b53]) with floating blur circles
- Headlines: Apply gradient-text class or inline gradient for copper-to-cyan text effect
- Metrics: Large gradient numbers with from-[#AA6C39] to-[#00C8FF] gradient
- Feature icons: w-16 h-16 in rounded-2xl containers with gradient backgrounds
- Cards: Apply hover:-translate-y-1 hover:shadow-xl for lift effect
- Buttons: Copper gradient (from-[#AA6C39] to-[#8B5A2B]) for primary, border-2 border-[#00C8FF] for secondary
- Sections: py-20 for generous vertical spacing
- Grids: gap-8 or gap-12 for modern whitespace
- Apply animate-fade-in to sections, animate-slide-up to cards
- Use animate-stagger-1/2/3 for sequential grid items
- Add decorative elements: floating blur orbs with animate-pulse-slow
- Feature grids should have hover:scale-105 transition-transform on cards
- Metrics should use KPICard styling with trend indicators (up/down arrows)
- CTA buttons should be prominent with primary color (#00C8FF)
- Ensure at least 4-5 meaningful sections with proper spacing
- Alternate between white and light gray backgrounds for visual rhythm
- Use icons/emojis strategically to enhance visual appeal
- Make every section valuable and specific to the user's query

Respond with ONLY the JSON page specification, nothing else.${retryNote}`;
}

/**
 * Build the user prompt for page generation
 * Includes specific context from the conversation and knowledge base
 */
function buildUserPrompt(request: PageGenerationRequest): string {
  const contextParts: string[] = [];

  contextParts.push(`CONTEXT:`);
  contextParts.push(`User's Question/Topic: "${request.userMessage}"`);

  // Add page interaction context if available
  if (request.pageContext) {
    contextParts.push(`\nUser Interaction Context:`);
    contextParts.push(`- Interaction Type: ${request.interactionSource || 'direct_question'}`);
    if (request.pageContext.originalQuery) {
      contextParts.push(`- Original Query: "${request.pageContext.originalQuery}"`);
    }
    if (request.pageContext.context) {
      contextParts.push(`- User Clicked On: "${request.pageContext.context}"`);
    }
    contextParts.push(`\nNote: The user is refining their query by clicking on specific page elements.`);
    contextParts.push(`Generate deeper, more specific content based on what they clicked on.`);
  }

  // Add persona context if available
  if (request.personaDescription) {
    contextParts.push(`\nUser Profile/Persona:${request.personaDescription}`);
  }

  // Add knowledge documents as internal context for LLM (not visible to end user)
  if (request.knowledgeDocuments && request.knowledgeDocuments.length > 0) {
    contextParts.push(`\n====== INTERNAL KNOWLEDGE BASE CONTEXT ======`);
    contextParts.push(`These documents contain specific industry data, metrics, and solutions.`);
    contextParts.push(`Use these to inform and personalize your page content.`);
    contextParts.push(`Extract specific data points, metrics, and insights from these documents.`);
    contextParts.push(`Make your content unique and different from generic responses.\n`);
    request.knowledgeDocuments.forEach((doc, idx) => {
      const relevancePercent = Math.round((doc.similarity_score || 0) * 100);
      contextParts.push(`[DOCUMENT ${idx + 1}] Relevance: ${relevancePercent}%`);
      if (doc.source_type) contextParts.push(`Source Type: ${doc.source_type}`);
      contextParts.push(`\n${doc.content}\n`);
    });
    contextParts.push(`====== END KB CONTEXT ======\n`);
    contextParts.push(`CRITICAL: Your page must reflect the specific data and insights from these KB documents.`);
    contextParts.push(`This ensures unique, personalized content for each user query.`);
    contextParts.push(`The end user will NOT see these documents or KB metadata in the final page.`);
  }

  // Add knowledge context with emphasis on beverage industry insights
  if (request.knowledgeContext && request.knowledgeContext.length > 0) {
    contextParts.push(`\nRELEVANT INDUSTRY KNOWLEDGE (use these insights in your content):`);
    request.knowledgeContext.slice(0, 5).forEach((context, idx) => {
      contextParts.push(`\n[Industry Insight ${idx + 1}]:\n${context}`);
    });
  }

  // Add conversation history for context
  if (request.conversationHistory && request.conversationHistory.length > 2) {
    contextParts.push(`\nCONVERSATION CONTEXT:`);
    const recentHistory = request.conversationHistory
      .slice(-3)
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`);
    contextParts.push(recentHistory.join('\n\n'));
  }

  contextParts.push(`\n\nTASK:`);
  contextParts.push(`Generate a professional and detailed ${request.pageType} page specification.`);

  if (request.knowledgeDocuments && request.knowledgeDocuments.length > 0) {
    contextParts.push(`\n⚠️ CRITICAL REQUIREMENTS FOR KB-DRIVEN CONTENT:`);
    contextParts.push(`1. Your page content MUST be based on the specific KB documents provided above`);
    contextParts.push(`2. Extract and use specific metrics, data points, and insights from those documents`);
    contextParts.push(`3. Each question gets DIFFERENT content based on its unique KB documents`);
    contextParts.push(`4. Do NOT generate generic content - use the KB data to personalize`);
    contextParts.push(`5. Create headlines, features, and metrics that reflect the KB insights`);
    contextParts.push(`6. The user will NOT see KB documents or sources in the final page`);
    contextParts.push(`7. Your job is to synthesize KB data into a professional page\n`);
  }

  contextParts.push(`\nCONTENT REQUIREMENTS:`);
  contextParts.push(`- Use the industry knowledge provided above to create specific, data-driven content`);
  contextParts.push(`- Reference beverage industry metrics and challenges from the knowledge base`);
  contextParts.push(`- Create 4-5 professional sections that flow logically`);
  contextParts.push(`- Make content specific to their role and pain points`);
  contextParts.push(`- Include concrete metrics and business value propositions`);
  contextParts.push(`- Output ONLY valid JSON, no explanations or markdown`);

  return contextParts.join('\n');
}

/**
 * Determine if a page has likely been generated before
 * Useful for caching to avoid regenerating identical pages
 */
export function getPageCacheKey(
  userMessage: string,
  pageType: PageType,
  personaHash?: string
): string {
  const messageHash = hashString(userMessage.substring(0, 100));
  const persona = personaHash || 'default';
  return `page_${pageType}_${messageHash}_${persona}`;
}

/**
 * Simple hash function for creating cache keys
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Process a batch of user messages to generate pages for each
 * Useful for analyzing conversation patterns
 */
export async function generatePagesBatch(
  requests: PageGenerationRequest[]
): Promise<PageGenerationResponse[]> {
  return Promise.all(requests.map((req) => generatePageSpec(req)));
}

/**
 * Get a fallback text-only response if page generation fails
 * Ensures graceful degradation
 */
export function getFallbackPageContent(pageType: PageType, userMessage: string): string {
  const fallbacks: Record<PageType, string> = {
    solution_brief: "I understand your challenge. Our solution is designed to address these specific pain points in the beverage industry. Let me know if you would like more details about how we can help.",
    feature_showcase: "Great question! These features are core to our platform and help teams work more efficiently. Would you like me to walk through any specific capability in more detail?",
    case_study: "We have helped many beverage companies achieve significant results. Each implementation is tailored to their unique needs. Would you like to discuss a similar scenario?",
    comparison: "We stand out by focusing specifically on the beverage industry with purpose-built features. Let me know which aspects matter most to you, and I can provide a detailed comparison.",
    implementation_roadmap: "Most implementations follow a structured process that we can customize to your timeline. We ensure a smooth launch with proper planning and support every step of the way.",
    roi_calculator: "The financial impact depends on your specific situation. Factors like team size, current processes, and your goals all play a role. Let us discuss your scenario to build a more accurate projection.",
  };

  return fallbacks[pageType];
}

/**
 * Enhance a page specification with additional context
 * Used to personalize generated pages
 */
export function enhancePageWithContext(
  page: BevGeniePage,
  persona?: PersonaScores
): BevGeniePage {
  if (!persona) {
    return page;
  }

  // Add persona metadata if not already present
  if ('persona' in page && typeof page.persona === 'string') {
    const personaLabel = determinePrimaryPersona(persona);
    page.persona = personaLabel;
  }

  // Enhance CTA buttons based on persona focus
  if (persona.sales_focus_score > 0.7) {
    // For sales-focused users, emphasize demo/trial CTAs
    // This would require modifying the sections array
  }

  if (persona.compliance_focus_score > 0.7) {
    // For compliance-focused users, emphasize security/compliance
  }

  return page;
}

/**
 * Determine the primary persona classification
 */
function determinePrimaryPersona(persona: PersonaScores): string {
  const classifications: string[] = [];

  if (persona.supplier_score > 0.7) classifications.push('supplier');
  if (persona.distributor_score > 0.7) classifications.push('distributor');
  if (persona.craft_score > 0.7) classifications.push('craft');
  if (persona.mid_sized_score > 0.7) classifications.push('mid_sized');
  if (persona.large_score > 0.7) classifications.push('large');

  if (persona.sales_focus_score > 0.7) classifications.push('sales_focus');
  if (persona.marketing_focus_score > 0.7) classifications.push('marketing_focus');
  if (persona.compliance_focus_score > 0.7) classifications.push('compliance_focus');

  return classifications.join('_');
}

/**
 * Generate multiple page variants for A/B testing
 * Creates 2-3 variations with different messaging
 */
export async function generatePageVariants(
  baseRequest: PageGenerationRequest,
  variantCount: number = 2
): Promise<PageGenerationResponse[]> {
  const variants: PageGenerationRequest[] = [];

  for (let i = 0; i < variantCount; i++) {
    const variant = {
      ...baseRequest,
      userMessage: `${baseRequest.userMessage} (Variant ${i + 1}: Try a different approach to messaging)`,
    };
    variants.push(variant);
  }

  return generatePagesBatch(variants);
}

/**
 * Estimate the generation time for a page
 * Useful for setting expectations and managing timeouts
 */
export function estimateGenerationTime(pageType: PageType): number {
  // Rough estimates in milliseconds
  const estimates: Record<PageType, number> = {
    solution_brief: 3000,
    feature_showcase: 4000,
    case_study: 5000,
    comparison: 4500,
    implementation_roadmap: 4000,
    roi_calculator: 3500,
  };

  return estimates[pageType];
}
