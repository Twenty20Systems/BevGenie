# BevGenie Content Generation Flow

## Overview

BevGenie uses a sophisticated multi-stage pipeline to generate personalized content. The system combines persona detection, knowledge search, AI reasoning, and dynamic page generation to create relevant responses and UI pages for each user query.

## Complete Generation Pipeline

```
User Query Input
       ↓
┌──────────────────────────────────────────────────────────────┐
│                  ORCHESTRATOR (orchestrator.ts)              │
│                   Main Coordination Layer                    │
└──────────────────────────────────────────────────────────────┘
       ↓
┌────────────────────────────────────────────────────────────────────────┐
│                         STEP 1: SIGNAL DETECTION                       │
├────────────────────────────────────────────────────────────────────────┤
│ • Analyzes user message for personality signals                        │
│ • Detects pain points, industry focus, company type                    │
│ • Maps signals to persona categories                                   │
│                                                                        │
│ Input: User message, Current persona state                             │
│ Output: Signals array with type, category, strength, evidence          │
│                                                                        │
│ Example:                                                               │
│ Signal 1: pain_point/sales_effectiveness (strength: 0.85)             │
│ Signal 2: user_type/field_sales (strength: 0.75)                      │
└────────────────────────────────────────────────────────────────────────┘
       ↓
┌────────────────────────────────────────────────────────────────────────┐
│                    STEP 2: PERSONA UPDATE                              │
├────────────────────────────────────────────────────────────────────────┤
│ • Updates persona profile with new signals                             │
│ • Increases confidence scores for detected attributes                  │
│ • Records signals to database for persistence                          │
│                                                                        │
│ Input: Current persona, signals detected                               │
│ Output: Updated persona with refined confidence scores                 │
│                                                                        │
│ Persona Attributes:                                                    │
│ • sales_focus_score: 0.75                                              │
│ • marketing_focus_score: 0.30                                          │
│ • pain_points_detected: ["sales_effectiveness", "team_alignment"]      │
│ • company_type: "craft_supplier"                                       │
│ • overall_confidence: 0.72                                             │
└────────────────────────────────────────────────────────────────────────┘
       ↓
┌────────────────────────────────────────────────────────────────────────┐
│                  STEP 3: KNOWLEDGE BASE SEARCH                         │
├────────────────────────────────────────────────────────────────────────┤
│ (knowledge-search.ts)                                                  │
│                                                                        │
│ • Converts user message to embedding vector                            │
│ • Searches knowledge base for 5 most relevant documents                │
│ • Filters results by persona-relevant pain points                      │
│ • Formats context for LLM consumption                                  │
│                                                                        │
│ Knowledge Base Contents:                                               │
│ • 50K+ industry articles on beverage business                          │
│ • Case studies and success stories                                     │
│ • Sales methodologies and best practices                               │
│ • ROI tracking frameworks                                              │
│ • Territory management strategies                                      │
│                                                                        │
│ Search Process:                                                        │
│ 1. Vectorize query: "How can we prove field execution ROI?"            │
│ 2. Find similar vectors in knowledge base                              │
│ 3. Rank by relevance and persona fit                                   │
│ 4. Extract top 5 documents                                             │
│ 5. Format as context string for LLM                                    │
│                                                                        │
│ Output: Formatted knowledge context (up to ~2000 tokens)               │
└────────────────────────────────────────────────────────────────────────┘
       ↓
┌────────────────────────────────────────────────────────────────────────┐
│                 STEP 4: PERSONALIZED SYSTEM PROMPT                     │
├────────────────────────────────────────────────────────────────────────┤
│ (prompts/system.ts)                                                    │
│                                                                        │
│ • Generates persona-aware system prompt                                │
│ • Includes pain point specific guidance                                │
│ • Adds knowledge base context                                          │
│ • Sets tone and style expectations                                     │
│                                                                        │
│ System Prompt Components:                                              │
│ ├─ Base instructions for BevGenie assistant behavior                   │
│ ├─ Persona context (detected role, company, focus)                     │
│ ├─ Pain point guidance                                                 │
│ ├─ Knowledge base context                                              │
│ └─ Output format requirements                                          │
│                                                                        │
│ Example System Prompt Section:                                         │
│ "You are speaking to a Field Sales Manager at a Craft Supplier.       │
│  Their primary concerns are:                                           │
│  1. Proving ROI from field tasting events (0.85 confidence)           │
│  2. Territory performance tracking (0.72 confidence)                   │
│  3. Team alignment and execution (0.68 confidence)                     │
│                                                                        │
│  Provide actionable, data-focused insights tailored to these needs.    │
│  Reference the following industry best practices: [context...]"        │
└────────────────────────────────────────────────────────────────────────┘
       ↓
┌────────────────────────────────────────────────────────────────────────┐
│              STEP 5: LLM RESPONSE GENERATION (OpenAI)                  │
├────────────────────────────────────────────────────────────────────────┤
│ • Calls GPT-4o with personalized system prompt                         │
│ • Includes conversation history (full context)                         │
│ • Uses temperature: 0.7 (balanced creativity/consistency)              │
│ • Max tokens: 300 (concise but complete responses)                     │
│                                                                        │
│ Request Format:                                                        │
│ ├─ Model: gpt-4o                                                       │
│ ├─ System: [Personalized system prompt from Step 4]                    │
│ ├─ Messages: [Conversation history + new user message]                 │
│ └─ Temperature: 0.7                                                    │
│                                                                        │
│ Output: AI response tailored to persona and knowledge base              │
│                                                                        │
│ Example Response:                                                      │
│ "Great question! Based on what I'm hearing about your team's focus    │
│  on ROI measurement, here's a data-driven approach that's working     │
│  for similar craft suppliers... [detailed response]"                   │
└────────────────────────────────────────────────────────────────────────┘
       ↓
┌────────────────────────────────────────────────────────────────────────┐
│              STEP 6: CONVERSATION HISTORY PERSISTENCE                  │
├────────────────────────────────────────────────────────────────────────┤
│ • Saves user message to database                                       │
│ • Saves AI response to database                                        │
│ • Maintains full conversation thread                                   │
│ • Enables context in future requests                                   │
│                                                                        │
│ Stored in: Supabase conversation_messages table                        │
└────────────────────────────────────────────────────────────────────────┘
       ↓
┌────────────────────────────────────────────────────────────────────────┐
│            STEP 7: GENERATION MODE DETERMINATION                       │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│ Determines how much AI inference to apply:                             │
│                                                                        │
│ MODE: "fresh"          (First messages)                                │
│ ├─ Conditions: No persona detected yet                                 │
│ ├─ Focus: Build understanding of user                                  │
│ └─ Page Generation: Basic templates                                    │
│                                                                        │
│ MODE: "returning"      (Persona confidence > 0.5)                      │
│ ├─ Conditions: Clear persona profile established                       │
│ ├─ Focus: Personalized responses                                       │
│ └─ Page Generation: Persona-tailored layouts                           │
│                                                                        │
│ MODE: "data_connected" (>5 messages + 2+ pain points)                  │
│ ├─ Conditions: Rich conversation history & context                     │
│ ├─ Focus: Deep analysis and recommendations                            │
│ └─ Page Generation: Advanced analytics & dashboards                    │
└────────────────────────────────────────────────────────────────────────┘
       ↓
┌────────────────────────────────────────────────────────────────────────┐
│            STEP 8: INTENT CLASSIFICATION                               │
├────────────────────────────────────────────────────────────────────────┤
│ (intent-classification.ts)                                             │
│                                                                        │
│ • Analyzes user intent to determine page type                          │
│ • Classifies as: exploration, problem_solving, learning, etc.          │
│ • Suggests best page type template                                     │
│ • Returns confidence score                                             │
│                                                                        │
│ Example Classification:                                                │
│ Intent: "problem_solving"                                              │
│ Suggested Page Type: "solution_brief"                                  │
│ Confidence: 0.89                                                       │
│                                                                        │
│ Page Type Options:                                                     │
│ • solution_brief: Targeted recommendations                             │
│ • feature_showcase: Product/service highlights                         │
│ • analytics_dashboard: Data visualization                              │
│ • case_study: Real-world example                                       │
│ • metrics_tracker: KPI monitoring                                      │
│ • comparison_guide: Option evaluation                                  │
└────────────────────────────────────────────────────────────────────────┘
       ↓
┌────────────────────────────────────────────────────────────────────────┐
│              STEP 9: DYNAMIC PAGE GENERATION                           │
├────────────────────────────────────────────────────────────────────────┤
│ (page-generator.ts)                                                    │
│                                                                        │
│ • ALWAYS generates a page for every query (primary feature)            │
│ • Uses Claude AI (faster, streaming capable)                           │
│ • Retries up to 2 times if validation fails                            │
│                                                                        │
│ Process:                                                               │
│ 1. Prepare page generation prompt:                                     │
│    - Page type template                                                │
│    - User intent and message                                           │
│    - Persona context                                                   │
│    - Knowledge context (top 3 results)                                 │
│    - Conversation history (last 3 messages)                            │
│                                                                        │
│ 2. Call Claude with detailed instructions:                             │
│    - Model: claude-opus (high quality)                                 │
│    - Temperature: 0.7                                                  │
│    - Max tokens: 2000                                                  │
│                                                                        │
│ 3. Parse response as JSON page specification                           │
│                                                                        │
│ 4. Validate against BevGeniePage schema:                               │
│    ✓ Required fields present                                           │
│    ✓ Section types valid                                               │
│    ✓ Content length reasonable                                         │
│    ✓ No malformed structures                                           │
│                                                                        │
│ 5. Return with metadata:                                               │
│    - Success status                                                    │
│    - Generated page object                                             │
│    - Generation time in ms                                             │
│    - Retry count                                                       │
│                                                                        │
│ Return Format:                                                         │
│ {                                                                      │
│   success: true,                                                       │
│   page: {                                                              │
│     type: "solution_brief",                                            │
│     title: "Territory Performance ROI Framework",                      │
│     description: "...",                                                │
│     sections: [...]                                                    │
│   },                                                                   │
│   generationTime: 2341,                                                │
│   retryCount: 0                                                        │
│ }                                                                      │
└────────────────────────────────────────────────────────────────────────┘
       ↓
┌────────────────────────────────────────────────────────────────────────┐
│                    FINAL API RESPONSE                                  │
├────────────────────────────────────────────────────────────────────────┤
│ (api/chat/route.ts)                                                    │
│                                                                        │
│ Returns to client:                                                     │
│ {                                                                      │
│   success: true,                                                       │
│   message: "AI response text...",                                      │
│   session: {                                                           │
│     sessionId: "uuid",                                                 │
│     persona: { updated persona object },                               │
│     messageCount: 2                                                    │
│   },                                                                   │
│   signals: ["pain_point/sales_effectiveness", ...],                    │
│   generationMode: "returning",                                         │
│   knowledgeDocuments: 5,                                               │
│   generatedPage: {                                                     │
│     page: { ... full page spec ... },                                  │
│     intent: "problem_solving",                                         │
│     intentConfidence: 0.89                                             │
│   }                                                                    │
│ }                                                                      │
└────────────────────────────────────────────────────────────────────────┘
       ↓
┌────────────────────────────────────────────────────────────────────────┐
│                    CLIENT-SIDE RENDERING                               │
├────────────────────────────────────────────────────────────────────────┤
│ (components/genie/loading-screen.tsx & dynamic-page-renderer.tsx)     │
│                                                                        │
│ 1. Show BevGenieVisualLoader during generation                         │
│    - Displays 5-stage pipeline visualization                           │
│    - Shows progress 0-100%                                             │
│    - Takes ~10-12 seconds                                              │
│                                                                        │
│ 2. Render DynamicPageRenderer with page spec                           │
│    - Converts sections to React components                             │
│    - Applies styling and animations                                    │
│    - Renders hero, features, metrics, CTAs                             │
│                                                                        │
│ 3. Display chat bubble overlay                                         │
│    - Shows loading progress during generation                          │
│    - Allows follow-up questions                                        │
│    - Maintains message history                                         │
└────────────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. **Signal Detection** (persona-detection.ts)
- Scans message for personality signals
- Extracts pain points, company attributes, role indicators
- Calculates signal strength (0-1)
- Records evidence for signal

### 2. **Knowledge Search** (knowledge-search.ts)
- Embeddings-based semantic search
- Supabase vector store with pgvector
- Persona-aware filtering
- Returns ranked relevant documents

### 3. **Intent Classification** (intent-classification.ts)
- Classifies user intent from message
- Suggests optimal page type
- Returns confidence score
- Provides reasoning for classification

### 4. **Page Generation** (page-generator.ts)
- Uses Claude AI for high-quality generation
- Validates output against schema
- Retries on validation failure
- Returns timing metadata

### 5. **Dynamic Page Renderer** (dynamic-page-renderer.tsx)
- Converts page spec to React components
- Handles all section types
- Applies professional styling
- Responsive design

## Data Flow Diagram

```
User Message
     ↓
[Orchestrator]
     ├→ Signal Detection → Persona Update
     ├→ Knowledge Search → Context Formatting
     ├→ System Prompt Generation
     ├→ LLM Call (GPT-4o) → AI Response
     ├→ Save Conversation
     ├→ Intent Classification
     └→ Page Generation (Claude)
     ↓
[Chat API Response]
     ├─ message: "AI response text"
     ├─ persona: { updated persona }
     ├─ signals: [detected signals]
     ├─ generationMode: "returning"
     └─ generatedPage: { page spec }
     ↓
[Client Rendering]
     ├─ Show Loading Screen (10-12s)
     ├─ Render Dynamic Page
     └─ Display Chat Bubble
```

## Generation Modes

### Fresh Mode (First Message)
- No persona profile yet
- Uses basic system prompt
- Generates simple introductory pages
- Focus: Understand user

### Returning Mode (Persona > 0.5 confidence)
- Clear persona profile established
- Uses personalized system prompt with detected attributes
- Generates tailored solution pages
- Focus: Address detected needs

### Data Connected Mode (> 5 messages + 2+ pain points)
- Rich conversation context
- Advanced persona understanding
- Generates analytics dashboards
- Focus: Deep analysis

## Page Types Generated

1. **solution_brief** - Targeted recommendations for problems
2. **feature_showcase** - Product/service highlights
3. **analytics_dashboard** - Data visualization pages
4. **case_study** - Real-world examples
5. **metrics_tracker** - KPI monitoring layouts
6. **comparison_guide** - Option evaluation matrices

## Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Chat LLM | GPT-4o (OpenAI) | Personalized responses |
| Page Generation | Claude (Anthropic) | High-quality page specs |
| Embeddings | OpenAI embeddings-3-small | Semantic search |
| Vector Store | Supabase + pgvector | Knowledge base search |
| Database | Supabase PostgreSQL | Session, persona, history |
| Frontend | React/Next.js | Page rendering |
| Styling | Tailwind CSS | Professional design |

## Performance Metrics

- **Signal Detection**: ~50ms
- **Knowledge Search**: ~200ms (includes embedding)
- **LLM Response**: ~1-2s (GPT-4o)
- **Page Generation**: ~2-3s (Claude)
- **Total Generation**: ~5-7s
- **Loading Screen Duration**: ~10-12s (animated delays included)

## Error Handling

- **Knowledge Search Failure**: Falls back to basic prompt
- **LLM Error**: Returns default helpful message
- **Page Generation Failure**: Graceful degradation (no page shown)
- **Retry Logic**: 2 retries on validation failure
- **Timeout Protection**: 30s max per LLM call

## Future Enhancements

- [ ] Streaming page generation for real-time updates
- [ ] A/B testing different page templates
- [ ] User feedback loop for persona refinement
- [ ] Multi-turn page modification ("adjust this section...")
- [ ] Integration with Supabase data APIs
- [ ] Custom page type definitions per user
- [ ] Page generation history and versioning
