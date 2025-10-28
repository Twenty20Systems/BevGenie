# BevGenie: Dynamic UI Generation Integration Plan

## Overview

Integrate the dynamic UI generation system from `dynamic_website` project into BevGenie to create personalized, AI-generated marketing pages/sections based on chat conversations.

This will allow the system to generate custom UI layouts in response to user questions about their specific pain points and needs.

---

## Architecture Overview

### Current BevGenie Flow (Phase 2)
```
User Question
    ↓
Chat API (/api/chat)
    ↓
Persona Detection + AI Response
    ↓
Return text message
    ↓
Display in chat bubble
```

### Enhanced Flow with Dynamic UI (Phase 3+)
```
User Question
    ↓
Chat API (/api/chat)
    ↓
Persona Detection + Intent Classification
    ↓
├─ If informational intent → Return text response
└─ If solution inquiry intent →
        ↓
    Generate PageSpecification (JSON)
        ↓
    Render as custom UI section
    (hero + features + cta, etc)
        ↓
    Display in chat window
```

---

## Phase 3: Dynamic Brochure/Solution Pages

### 3.1 Intent Classification System

**Add to `lib/ai/intent-classifier.ts`** (NEW FILE)

Classify user questions to determine if page generation is needed:

```typescript
export type UserIntent =
  | 'general_question'         // "Tell me about your solution"
  | 'pain_point_inquiry'       // "We struggle with ROI tracking"
  | 'feature_question'         // "Can you help with X?"
  | 'solution_request'         // "Generate a brochure for us"
  | 'comparison_inquiry'       // "How do you compare to X?"
  | 'case_study_request'       // "Show me examples"
  | 'pricing_inquiry'          // "How much does it cost?"
  | 'implementation_question'; // "How do we get started?"

export async function classifyIntent(message: string): Promise<{
  intent: UserIntent;
  confidence: number;
  shouldGenerateUI: boolean;
  suggestedLayout: 'solution_brief' | 'feature_showcase' | 'comparison' | null;
}>
```

**Should Generate UI When:**
- pain_point_inquiry (confidence > 0.7)
- solution_request (confidence > 0.6)
- case_study_request (confidence > 0.65)
- comparison_inquiry (confidence > 0.6)

---

### 3.2 Page Specification System

**Add to `lib/ai/page-specification.ts`** (NEW FILE)

Define what types of pages BevGenie can generate:

```typescript
export type BevGeniePageType =
  | 'solution_brief'           // Tailored solution for detected persona
  | 'feature_showcase'         // Features relevant to their pain points
  | 'case_study'               // Success story for their industry/size
  | 'comparison'               // vs competitors or alternative approaches
  | 'implementation_roadmap'   // Step-by-step implementation guide
  | 'roi_calculator';          // Interactive ROI estimation

export interface BevGeniePageSpec {
  id: string;
  type: BevGeniePageType;
  title: string;
  description: string;

  // Persona context
  targetPersona: {
    userType: 'supplier' | 'distributor';
    size?: 'craft' | 'mid_sized' | 'large';
    focus?: string[];
    painPoints: string[];
  };

  // Page content
  sections: PageSection[];

  // Metadata
  generatedFor: string;  // User message that triggered generation
  timestamp: Date;
  confidence: number;    // 0-1 quality score
}

export interface PageSection {
  id: string;
  type: 'hero' | 'feature_grid' | 'comparison_table' |
        'testimonial' | 'cta' | 'faq' | 'metrics' | 'steps';
  title?: string;
  content: Record<string, any>;
  order: number;
}
```

---

### 3.3 Page Generation Engine

**Add to `lib/ai/page-generator.ts`** (NEW FILE)

```typescript
import { generateBrochure } from '@/lib/ai/orchestrator';

export async function generateCustomPage(
  userMessage: string,
  persona: PersonaScores,
  intent: UserIntent,
  conversationContext: string[]
): Promise<BevGeniePageSpec> {

  // Step 1: Determine page type based on intent + persona
  const pageType = determinePageType(intent, persona);

  // Step 2: Build context from knowledge base
  const relevantContent = await searchKnowledgeBase(
    userMessage,
    persona.pain_points_detected,
    10
  );

  // Step 3: Generate page spec via LLM
  const pageSpec = await generatePageSpecWithLLM(
    userMessage,
    persona,
    pageType,
    relevantContent,
    conversationContext
  );

  // Step 4: Validate page spec
  const validated = validatePageSpec(pageSpec);

  // Step 5: Store in database
  await savePage(validated, persona.session_id);

  return validated;
}

async function generatePageSpecWithLLM(
  userMessage: string,
  persona: PersonaScores,
  pageType: BevGeniePageType,
  relevantContent: any[],
  context: string[]
): Promise<BevGeniePageSpec> {

  const systemPrompt = buildPageGenerationPrompt(pageType, persona);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: buildUserPrompt(userMessage, persona, relevantContent, context)
      }
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  // Parse JSON response into PageSpec
  return JSON.parse(response.choices[0].message.content);
}

function buildPageGenerationPrompt(
  pageType: BevGeniePageType,
  persona: PersonaScores
): string {
  return `You are a marketing content generator for BevGenie.

Generate a ${pageType} page specification as JSON for a:
- Company type: ${persona.supplier_score > persona.distributor_score ? 'Supplier' : 'Distributor'}
- Focus areas: ${persona.sales_focus_score > 0.3 ? 'Sales' : ''} ${persona.marketing_focus_score > 0.3 ? 'Marketing' : ''} ${persona.operations_focus_score > 0.3 ? 'Operations' : ''}
- Pain points: ${persona.pain_points_detected.join(', ')}

Generate a valid PageSpec JSON with 3-5 sections that address their specific needs.

Output ONLY valid JSON matching this schema:
{
  "id": "uuid",
  "type": "${pageType}",
  "title": "Page title",
  "description": "Page description",
  "targetPersona": { /* persona info */ },
  "sections": [
    {
      "id": "uuid",
      "type": "hero|feature_grid|testimonial|cta|...",
      "title": "Section title",
      "content": { /* section-specific data */ },
      "order": 0
    }
  ],
  "generatedFor": "...",
  "timestamp": "${new Date().toISOString()}",
  "confidence": 0.85
}`;
}
```

---

### 3.4 Page Renderer Component

**Add to `components/dynamic-page.tsx`** (NEW FILE)

```typescript
'use client';

import React from 'react';
import { BevGeniePageSpec } from '@/lib/ai/page-specification';

interface DynamicPageProps {
  spec: BevGeniePageSpec;
  onCTAClick?: (action: string) => void;
}

export function DynamicPage({ spec, onCTAClick }: DynamicPageProps) {
  return (
    <div className="w-full bg-gradient-to-br from-white to-gray-50 rounded-lg overflow-hidden">
      {/* Page Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">{spec.title}</h2>
        <p className="text-sm text-gray-600 mt-1">{spec.description}</p>
        {spec.confidence < 0.7 && (
          <p className="text-xs text-yellow-600 mt-2">
            ⚠️ Generated content - please review for accuracy
          </p>
        )}
      </div>

      {/* Page Sections */}
      <div className="px-6 py-6 space-y-6">
        {spec.sections
          .sort((a, b) => a.order - b.order)
          .map((section) => (
            <PageSection
              key={section.id}
              section={section}
              onCTAClick={onCTAClick}
            />
          ))}
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
        <button
          onClick={() => downloadPageAsPDF(spec)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          📥 Download as PDF
        </button>
        <button
          onClick={() => sharePageLink(spec)}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700"
        >
          🔗 Share Link
        </button>
      </div>
    </div>
  );
}

function PageSection({ section, onCTAClick }: any) {
  switch (section.type) {
    case 'hero':
      return <HeroSection {...section.content} />;
    case 'feature_grid':
      return <FeatureGridSection {...section.content} />;
    case 'testimonial':
      return <TestimonialSection {...section.content} />;
    case 'comparison_table':
      return <ComparisonTableSection {...section.content} />;
    case 'cta':
      return <CTASection {...section.content} onCTAClick={onCTAClick} />;
    case 'faq':
      return <FAQSection {...section.content} />;
    case 'metrics':
      return <MetricsSection {...section.content} />;
    case 'steps':
      return <StepsSection {...section.content} />;
    default:
      return null;
  }
}

// Section Components
function HeroSection({ headline, subheadline, image }: any) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-lg">
      <h3 className="text-3xl font-bold mb-3">{headline}</h3>
      <p className="text-lg text-blue-100">{subheadline}</p>
    </div>
  );
}

function FeatureGridSection({ features }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {features.map((feature: any, idx: number) => (
        <div key={idx} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
          <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
          <p className="text-sm text-gray-600">{feature.description}</p>
        </div>
      ))}
    </div>
  );
}

function ComparisonTableSection({ rows, columns }: any) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            {columns.map((col: string, idx: number) => (
              <th key={idx} className="p-3 text-left font-semibold text-gray-900 border border-gray-200">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any[], idx: number) => (
            <tr key={idx} className="hover:bg-gray-50">
              {row.map((cell: any, cellIdx: number) => (
                <td key={cellIdx} className="p-3 border border-gray-200 text-gray-700">
                  {typeof cell === 'boolean' ? (cell ? '✓' : '✗') : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CTASection({ headline, subheadline, buttons }: any) {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded">
      <h4 className="text-xl font-bold text-gray-900 mb-2">{headline}</h4>
      <p className="text-gray-700 mb-4">{subheadline}</p>
      <div className="flex gap-3 flex-wrap">
        {buttons?.map((btn: any, idx: number) => (
          <button
            key={idx}
            className={`px-4 py-2 rounded font-medium ${
              btn.primary
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TestimonialSection({ quote, author, company }: any) {
  return (
    <div className="bg-gray-100 p-6 rounded-lg border-l-4 border-blue-600">
      <p className="text-gray-900 italic mb-3">"{quote}"</p>
      <p className="font-semibold text-gray-900">{author}</p>
      <p className="text-sm text-gray-600">{company}</p>
    </div>
  );
}

function FAQSection({ items }: any) {
  const [openIdx, setOpenIdx] = React.useState<number | null>(null);

  return (
    <div className="space-y-3">
      {items.map((item: any, idx: number) => (
        <div key={idx} className="border border-gray-200 rounded-lg">
          <button
            onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
            className="w-full p-4 text-left font-semibold text-gray-900 hover:bg-gray-50"
          >
            {item.question}
            <span className="float-right">{openIdx === idx ? '−' : '+'}</span>
          </button>
          {openIdx === idx && (
            <div className="p-4 border-t border-gray-200 bg-gray-50 text-gray-700">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MetricsSection({ metrics }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {metrics.map((metric: any, idx: number) => (
        <div key={idx} className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
          <div className="text-3xl font-bold text-blue-600">{metric.value}</div>
          <p className="text-sm text-gray-600 mt-1">{metric.label}</p>
        </div>
      ))}
    </div>
  );
}

function StepsSection({ steps }: any) {
  return (
    <div className="space-y-4">
      {steps.map((step: any, idx: number) => (
        <div key={idx} className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
            {idx + 1}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{step.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

async function downloadPageAsPDF(spec: BevGeniePageSpec) {
  // TODO: Implement PDF generation
  console.log('Downloading PDF:', spec.id);
}

async function sharePageLink(spec: BevGeniePageSpec) {
  // TODO: Implement link sharing
  console.log('Sharing link for page:', spec.id);
}
```

---

### 3.5 Updated Chat Widget

**Modify `components/chat-widget.tsx`**

Add dynamic page display alongside messages:

```typescript
// Add to chat state
const [dynamicPages, setDynamicPages] = useState<BevGeniePageSpec[]>([]);

// Update handleSubmit
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const message = inputRef.current?.value.trim();
  if (message && !isLoading) {
    sendMessage(message);

    // Check if response includes dynamic page
    // If yes, add to dynamicPages array

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }
};

// Render dynamic pages in messages area
{dynamicPages.map((page) => (
  <div key={page.id} className="my-4">
    <DynamicPage spec={page} onCTAClick={handleCTA} />
  </div>
))}
```

---

### 3.6 Database Schema Update

**Update `lib/supabase/migrations.sql`**

Add new table for storing generated pages:

```sql
CREATE TABLE IF NOT EXISTS generated_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL REFERENCES user_personas(session_id),
  page_type VARCHAR(100) NOT NULL,
  title TEXT NOT NULL,
  specification JSONB NOT NULL,
  target_persona JSONB NOT NULL,
  generated_for TEXT NOT NULL,
  quality_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_generated_pages_session_id ON generated_pages(session_id);
CREATE INDEX idx_generated_pages_created_at ON generated_pages(created_at);
```

---

## Phase 4: Enhanced Features

### 4.1 PDF Export
- Convert PageSpec to PDF with professional styling
- Include company branding/customization
- Email delivery option

### 4.2 Page Persistence
- Save generated pages to database
- Retrieve/share via unique URL
- Analytics tracking (views, engagement)

### 4.3 Personalization
- Template selection based on persona
- A/B testing different layouts
- Optimization scoring

### 4.4 Advanced Sections
- Interactive calculators
- Video embeds
- Live chat integration
- Form submission handling

---

## Implementation Timeline

| Phase | Feature | Effort | Timeline |
|-------|---------|--------|----------|
| 3.1 | Intent Classification | 2-3h | Week 1 |
| 3.2 | Page Specification | 2h | Week 1 |
| 3.3 | Page Generator | 3-4h | Week 1-2 |
| 3.4 | Page Renderer | 3-4h | Week 2 |
| 3.5 | Chat Integration | 2h | Week 2 |
| 3.6 | Database Updates | 1h | Week 2 |
| 4.1-4.4 | Advanced Features | 8-12h | Week 3+ |

---

## Example User Flow

### Scenario: Craft Brewery Sales Manager

```
User: "We're a craft brewery and we can't prove ROI for our field sales activities"

System:
1. Detect intent: pain_point_inquiry (confidence: 0.92)
2. Classify persona: Supplier, Craft, Sales-focused
3. Generate PageSpec type: "solution_brief"
4. Build LLM prompt with:
   - Their specific pain point (ROI tracking)
   - Their company profile (craft brewery)
   - Their focus area (field sales)
   - Relevant knowledge base articles

Response:
1. Chat message: "I understand - field sales ROI tracking is a major challenge for craft breweries..."
2. Render DynamicPage with sections:
   - Hero: "Prove Your Field Sales ROI"
   - Feature Grid: "Key Capabilities"
     * Real-time activity tracking
     * ROI measurement dashboard
     * Sales enablement tools
   - Testimonial: Success story from similar brewery
   - CTA: "Schedule Demo" / "See Case Study"
3. Metrics: "78% average ROI improvement"
4. Steps: "3-Step Implementation"

User can:
- Download as PDF brochure
- Share with team
- Continue chatting for more details
```

---

## Key Benefits

✅ **Personalization** - Unique pages per user's needs
✅ **Engagement** - Rich, visual content vs. plain text
✅ **Conversion** - Multiple CTAs and contact opportunities
✅ **Scalability** - AI-generated content (not manual)
✅ **Analytics** - Track which pages work best
✅ **Speed** - Generated in real-time (seconds)
✅ **Branding** - Consistent with BevGenie visual identity

---

## Architecture Pattern

This follows the **Specification-Based UI Pattern**:
1. LLM generates JSON spec (not React code)
2. Spec validated against schema
3. Renderer converts spec to React components
4. Components render final UI

**Benefits:**
- LLM can't generate buggy code
- UI is deterministic and testable
- Easy to validate quality
- Can cache/store/analyze specs
- Works across different rendering platforms

---

## Next Steps

1. **Implement Intent Classification** (3.1)
2. **Define Page Specification** (3.2)
3. **Build Page Generator** (3.3)
4. **Create Page Renderer** (3.4)
5. **Integrate with Chat** (3.5)
6. **Update Database** (3.6)
7. **Test end-to-end flows**
8. **Iterate on page templates**
9. **Add PDF export** (4.1)
10. **Launch Phase 3** 🚀

---

## Questions to Answer

1. **What persona profiles need what page types?**
   - Answer: Build page type recommendations per persona

2. **How many sections per page?**
   - Answer: 3-5 sections (hero + features/comparison + social proof + CTA)

3. **What CTAs should we offer?**
   - Answer: Schedule Demo, Download Case Study, Request Pricing, View Implementation Plan

4. **How to handle failed page generation?**
   - Answer: Fallback to brochure generation (Phase 3 original), show error gracefully

5. **How to measure success?**
   - Answer: Track page views, CTA clicks, time spent, feedback ratings

---

This integration will transform BevGenie from a chat-only interface into a dynamic content generation platform! 🚀
