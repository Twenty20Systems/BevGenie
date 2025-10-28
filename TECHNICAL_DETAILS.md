# BevGenie Technical Implementation Reference

## Processing Pipeline Overview

1. User submits message in ChatWidget
2. useChat hook sends POST /api/chat
3. Backend processChat() orchestrates:
   - Persona signal detection
   - Knowledge base search
   - OpenAI LLM call (chat response)
   - Intent classification
   - Claude page generation
4. API returns JSON with complete page
5. Frontend shows 11.5s loading animation
6. Page renders when animation completes

## Key Files and Responsibilities

### Backend
- app/api/chat/route.ts - Entry point
- lib/ai/orchestrator.ts - Main processing (processChat)
- lib/ai/page-generator.ts - Claude page generation
- lib/ai/page-specs.ts - Schema definitions
- lib/ai/intent-classification.ts - Page type detection
- lib/ai/persona-detection.ts - Signal extraction
- lib/ai/knowledge-search.ts - Knowledge base queries

### Frontend
- hooks/useChat.ts - State management
- components/chat-widget.tsx - Chat UI
- components/page-loading-screen.tsx - Animation
- components/dynamic-page-renderer.tsx - Page rendering
- components/full-screen-page-view.tsx - Full-screen display
- app/page.tsx - Main routing

## Page Generation Details

### Claude Model Used
- Model: claude-3-5-sonnet-20241022
- Max tokens: 4000
- Prompt includes: page type template, persona description, knowledge context, conversation history
- Output: Valid JSON matching BevGeniePage schema

### Retry Logic
- Max retries: 2
- Validation checks: Required fields, character limits, schema compliance
- On failure: Adds validation errors to next attempt prompt
- On all failures: Returns error but chat still works

### Page Types (6 templates)
1. solution_brief - Hero + Features + Testimonial + CTA
2. feature_showcase - Hero + Features + Comparison + CTA
3. case_study - Hero + Metrics + Testimonial + Steps
4. comparison - Comparison Table + FAQ + CTA
5. implementation_roadmap - Steps + Timeline + FAQ
6. roi_calculator - Metrics + CTA

### Section Types (8 components)
1. hero - Large headline, subheadline, CTA
2. feature_grid - 2-4 columns of features with icons
3. testimonial - Customer quote with details
4. comparison_table - Feature comparison matrix
5. cta - Call-to-action buttons
6. faq - Accordion questions/answers
7. metrics - Statistics and KPIs
8. steps - Process timeline with numbering

## Frontend State Management

### useChat Hook State
- messages: Message[] - Chat history
- isLoading: boolean - API call in progress
- error: string | null - Error message
- sessionId: string | null - Session ID
- persona: PersonaData | null - Detected persona
- generationMode: 'fresh' | 'returning' | 'data_connected'
- generationStatus: { isGeneratingPage, stage, progress }

### Message Object
- id: string - Unique ID
- role: 'user' | 'assistant' - Message sender
- content: string - Message text
- timestamp: Date - When sent
- generatedPage?: DynamicPageData - Page if generated

## Loading Animation System

### 5 Stages (11.5 seconds total)
1. Understanding Query (2s)
2. Analyzing Persona (2s)
3. Researching Context (3s)
4. Personalizing Content (2s)
5. Building Dashboard (3s)

### 3 Animation Styles
1. Neural Network - Blue pulsing neurons with connections
2. Chemical Reaction - Flask with filling liquid
3. Holographic - Brain with rotating components

### Stage Indicators
- Green dot: Completed stages
- Blue dot: Current stage
- Gray dot: Future stages

## API Response Structure

```json
{
  "success": true,
  "message": "AI response text",
  "session": {
    "sessionId": "uuid",
    "persona": { ... },
    "messageCount": 5
  },
  "signals": ["user_type/supplier", "pain_point/sales"],
  "generationMode": "returning",
  "knowledgeDocuments": 3,
  "generatedPage": {
    "type": "solution_brief",
    "title": "Page Title",
    "description": "Page description",
    "sections": [...]
  }
}
```

## No Streaming Implementation

The system uses pure synchronous generation:
- Page fully generated on backend (5-15 seconds)
- Complete page included in single JSON response
- Frontend animation plays while page loads into React state
- Page renders immediately when animation completes

Why no streaming?
- Simpler validation (validate complete page before sending)
- Easier retry logic (retry entire page if validation fails)
- No partial/invalid pages (client always gets valid JSON)
- All-or-nothing approach ensures consistency

## Generation Mode Determination

```
fresh: Default, early conversation
returning: persona.overall_confidence > 0.5 && messageCount > 2
data_connected: messageCount > 5 && pain_points_detected.length >= 2
```

## Intent Classification

Determines page type from user message:
- Pain point mentioned? → solution_brief
- Features question? → feature_showcase
- Examples/proof? → case_study
- Comparison? → comparison
- Timeline/process? → implementation_roadmap
- ROI/numbers? → roi_calculator

## Persona Signals Extracted

Types:
- user_type (supplier, distributor)
- company_size (craft, mid_sized, large)
- business_focus (sales, marketing, operations, compliance)
- pain_point (specific pain points)

Each signal has:
- Type and category
- Strength (0-1 confidence)
- Evidence (text from message)
- Timestamp

## Knowledge Base Integration

- Searches knowledge base for context (5 max results)
- Context passed to OpenAI for chat response
- Context also passed to Claude for page generation
- Knowledge documents count included in response

## Graceful Degradation

If page generation fails:
1. Chat response still returns (generated by OpenAI)
2. generatedPage is undefined
3. No full-screen view shown
4. User sees chat response in widget
5. Error logged to console

System continues functioning without page.

## Performance Characteristics

Backend Processing:
- Persona detection: ~100ms
- Knowledge search: ~500ms
- OpenAI call: 2-4 seconds
- Claude page gen: 2-8 seconds
- Total: 5-15 seconds typical

Frontend:
- Loading animation: Fixed 11.5 seconds
- Page render: <100ms (already received)
- Total perceived: ~12-15 seconds

## Client Side Rendering

DynamicPageRenderer:
1. Receives complete BevGeniePage JSON
2. Routes sections to appropriate components
3. Each section renders based on type
4. All styling handled by Tailwind CSS
5. Interactive elements (FAQ expandable, buttons clickable)

## Why This Architecture?

Advantages:
- All generation logic on backend (secure)
- Page quality guaranteed before sending (validation)
- Retry logic built-in (robust)
- No real-time dependencies
- Scales easily (stateless API)
- Graceful degradation (chat works without pages)

Tradeoffs:
- 5-15 second wait time
- No progressive rendering
- Frontend waits for complete backend processing

