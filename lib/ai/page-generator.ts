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

CONTENT GUIDELINES:
- Beverage Industry Focus: Reference specific categories (spirits, beer, wine, non-alcoholic), market segments, and distributor challenges
- Use Real Metrics: Cite specific percentage improvements, market growth rates, efficiency gains
- Address Pain Points: Directly solve the user's business challenges with concrete solutions
- Show ROI: Include expected financial benefits, efficiency improvements, time savings
- Use Specific Examples: Reference real scenarios from the beverage industry

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

STYLING HINTS (for developers):
- Use the provided icons/emojis to enhance visual appeal
- Ensure at least 4-5 meaningful sections
- Mix text and visual content effectively
- Make every section valuable and specific

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

  // Add persona context if available
  if (request.personaDescription) {
    contextParts.push(`\nUser Profile/Persona:${request.personaDescription}`);
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
  contextParts.push(`Generate a professional and detailed ${request.pageType} page specification tailored to address the user's needs and business context.`);
  contextParts.push(`\nIMPORTANT:`);
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
