# BevGenie Architecture Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React/Next.js)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐        ┌─────────────────┐                   │
│  │  Chat Bubble     │        │  Loading Screen │                   │
│  │  (400x600px)     │◄───────│ (5-stage visual)│                   │
│  │  - Messages      │        │ - Animations    │                   │
│  │  - Input field   │        │ - Progress      │                   │
│  │  - Suggestions   │        │ - Metrics       │                   │
│  └──────────────────┘        └─────────────────┘                   │
│         ▲                             ▲                             │
│         │                             │                             │
│         └─────────────┬───────────────┘                             │
│                       │                                             │
│  ┌────────────────────▼──────────────────┐                         │
│  │  Dynamic Page Renderer                │                         │
│  │  - Hero sections                      │                         │
│  │  - Feature grids                      │                         │
│  │  - Metrics display                    │                         │
│  │  - Case studies                       │                         │
│  │  - CTAs                               │                         │
│  └───────────────────┬──────────────────┘                         │
│                      │                                             │
└──────────────────────┼─────────────────────────────────────────────┘
                       │
                       │ HTTP POST /api/chat
                       │ { message: "..." }
                       │
┌──────────────────────▼─────────────────────────────────────────────┐
│                    BACKEND (Node.js/Next.js API)                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Chat API Router (api/chat/route.ts)            │  │
│  │  - Request validation                                        │  │
│  │  - Session management                                        │  │
│  │  - Response formatting                                       │  │
│  └───────────────┬────────────────────────────────────────────┘  │
│                  │                                               │
│                  ▼                                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │         AI ORCHESTRATOR (lib/ai/orchestrator.ts)            │  │
│  │                                                              │  │
│  │  ┌─────────────────────────────────────────────────────┐   │  │
│  │  │ STEP 1: Signal Detection                            │   │  │
│  │  │ • Analyze user message for signals                  │   │  │
│  │  │ • Extract: pain_points, user_type, company_attr    │   │  │
│  │  └────────────────┬────────────────────────────────────┘   │  │
│  │                   │                                         │  │
│  │  ┌────────────────▼────────────────────────────────────┐   │  │
│  │  │ STEP 2: Persona Update                              │   │  │
│  │  │ • Update confidence scores                          │   │  │
│  │  │ • Record signals to database                        │   │  │
│  │  │ • Calculate overall confidence                      │   │  │
│  │  └────────────────┬────────────────────────────────────┘   │  │
│  │                   │                                         │  │
│  │  ┌────────────────▼────────────────────────────────────┐   │  │
│  │  │ STEP 3: Knowledge Search (knowledge-search.ts)      │   │  │
│  │  │ • Vectorize user query                              │   │  │
│  │  │ • Search Supabase pgvector index                    │   │  │
│  │  │ • Rank by relevance & persona fit                  │   │  │
│  │  │ • Return top 5 documents                            │   │  │
│  │  └────────────────┬────────────────────────────────────┘   │  │
│  │                   │                                         │  │
│  │  ┌────────────────▼────────────────────────────────────┐   │  │
│  │  │ STEP 4: System Prompt Generation (prompts/system.ts)│   │  │
│  │  │ • Build persona-aware system prompt                 │   │  │
│  │  │ • Include pain point guidance                       │   │  │
│  │  │ • Format knowledge context                          │   │  │
│  │  │ • Add tone/style requirements                       │   │  │
│  │  └────────────────┬────────────────────────────────────┘   │  │
│  │                   │                                         │  │
│  │  ┌────────────────▼────────────────────────────────────┐   │  │
│  │  │ STEP 5: LLM Call - GPT-4o                           │   │  │
│  │  │ • Call OpenAI API                                   │   │  │
│  │  │ • Pass system prompt + conversation history         │   │  │
│  │  │ • Temperature: 0.7, Max tokens: 300                │   │  │
│  │  │ • Return AI response text                           │   │  │
│  │  └────────────────┬────────────────────────────────────┘   │  │
│  │                   │                                         │  │
│  │  ┌────────────────▼────────────────────────────────────┐   │  │
│  │  │ STEP 6: Save Conversation                           │   │  │
│  │  │ • Persist user message                              │   │  │
│  │  │ • Persist AI response                               │   │  │
│  │  │ • Link to session for context                       │   │  │
│  │  └────────────────┬────────────────────────────────────┘   │  │
│  │                   │                                         │  │
│  │  ┌────────────────▼────────────────────────────────────┐   │  │
│  │  │ STEP 7: Determine Generation Mode                   │   │  │
│  │  │ • fresh: No persona detected yet                    │   │  │
│  │  │ • returning: Confidence > 0.5                       │   │  │
│  │  │ • data_connected: >5 msgs + 2+ pain_points         │   │  │
│  │  └────────────────┬────────────────────────────────────┘   │  │
│  │                   │                                         │  │
│  │  ┌────────────────▼────────────────────────────────────┐   │  │
│  │  │ STEP 8: Intent Classification                       │   │  │
│  │  │ (intent-classification.ts)                          │   │  │
│  │  │ • Analyze user intent                               │   │  │
│  │  │ • Suggest page type                                 │   │  │
│  │  │ • Calculate confidence                              │   │  │
│  │  │ • Options: solution_brief, feature_showcase, etc.   │   │  │
│  │  └────────────────┬────────────────────────────────────┘   │  │
│  │                   │                                         │  │
│  │  ┌────────────────▼────────────────────────────────────┐   │  │
│  │  │ STEP 9: Page Generation (page-generator.ts)         │   │  │
│  │  │ • Call Claude API                                   │   │  │
│  │  │ • Generate page specification                       │   │  │
│  │  │ • Validate JSON against schema                      │   │  │
│  │  │ • Retry (max 2x) on validation failure              │   │  │
│  │  │ • Return: success, page, generationTime             │   │  │
│  │  └────────────────┬────────────────────────────────────┘   │  │
│  │                   │                                         │  │
│  └───────────────────┼─────────────────────────────────────────┘  │
│                      │                                            │
└──────────────────────┼────────────────────────────────────────────┘
                       │
                       │ HTTP Response
                       │ {
                       │   message: "...",
                       │   persona: {...},
                       │   signals: [...],
                       │   generationMode: "...",
                       │   generatedPage: {...}
                       │ }
                       │
┌──────────────────────▼────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                              │
├────────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────┐  ┌──────────────────┐                   │
│  │  OpenAI API         │  │  Anthropic API   │                   │
│  │  ├─ GPT-4o          │  │  ├─ Claude 3.5  │                   │
│  │  │  (Responses)     │  │  │  (Pages)      │                   │
│  │  └─ Embeddings      │  │  └─ Prompting   │                   │
│  │     (Search)        │  │                  │                   │
│  └─────────────────────┘  └──────────────────┘                   │
│                                                                   │
│  ┌────────────────────────────────────────┐                      │
│  │     Supabase (PostgreSQL + pgvector)   │                      │
│  │  ├─ user_sessions                      │                      │
│  │  ├─ user_personas                      │                      │
│  │  ├─ persona_signals                    │                      │
│  │  ├─ conversation_messages              │                      │
│  │  └─ knowledge_documents (embeddings)   │                      │
│  └────────────────────────────────────────┘                      │
│                                                                   │
└────────────────────────────────────────────────────────────────────┘
```

## Data Flow: User Message → Generated Page

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  User Types: "How can we prove ROI from field events?"            │
│                          ↓                                          │
│  Chat Bubble Shows Loading Progress                                │
│  BevGenieVisualLoader Shows 5-Stage Pipeline                       │
│  (Understanding → Persona → Research → Personalize → Build)        │
│                          ↓                                          │
└─────────────────────────────────────────────────────────────────────┘
                           │
                           │ POST /api/chat
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    API LAYER (Node.js)                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Parse & Validate Message ✓                                     │
│  2. Get User Session                                               │
│  3. Load Conversation History                                      │
│                          ↓                                          │
└─────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│             ORCHESTRATOR - 9 STEP PIPELINE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Step 1: detectPersonaSignals()                                      │
│  Input: message + current persona                                   │
│  Output: [signal_1, signal_2, ...]                                  │
│           ↓ Pain Point: "sales_effectiveness" (0.85)               │
│           ↓ User Type: "field_sales" (0.75)                        │
│                          ↓                                          │
│ Step 2: updatePersonaWithSignals()                                  │
│  Input: existing persona + new signals                              │
│  Output: updated persona object                                     │
│           ↓ sales_focus_score: 0.85                                │
│           ↓ confidence: 0.72                                        │
│                          ↓                                          │
│ Step 3: searchKnowledgeBase()                                       │
│  Input: message + persona context                                   │
│  ├─ Vectorize: "How can we prove ROI..."                           │
│  ├─ Query Supabase pgvector embeddings                             │
│  └─ Return: [doc1, doc2, doc3, doc4, doc5]                         │
│       ↓ "Territory Performance Metrics"                            │
│       ↓ "Field Event ROI Tracking"                                 │
│       ↓ "Sales Effectiveness Measurement"                          │
│                          ↓                                          │
│ Step 4: getPersonalizedSystemPrompt()                               │
│  Input: updated persona + knowledge context                         │
│  Output: system prompt tailored to user                             │
│           "You are speaking to a Field Sales Manager                │
│            at a Craft Supplier. Their concerns: ROI,              │
│            territory performance, team alignment.                   │
│            Reference: [knowledge context]"                         │
│                          ↓                                          │
│ Step 5: openai.chat.completions.create()                           │
│  Input: system prompt + conversation history                        │
│  Output: AI response (text)                                         │
│           "Great question! Here's a framework for                  │
│            tracking field event ROI that's working                 │
│            well for similar suppliers... [details]"                │
│                          ↓                                          │
│ Step 6: addConversationMessage() (x2)                               │
│  Save to DB: user message + AI response                             │
│  (Enables context for next turn)                                    │
│                          ↓                                          │
│ Step 7: determineGenerationMode()                                   │
│  Result: "returning" (confidence > 0.5)                             │
│                          ↓                                          │
│ Step 8: classifyMessageIntent()                                     │
│  Input: message, conversation count, persona                        │
│  Output: intent + suggested page type                               │
│           "problem_solving" → "solution_brief" (0.89)              │
│                          ↓                                          │
│ Step 9: generatePageSpec()                                          │
│  Input: intent + persona + knowledge + history                      │
│  ├─ Call Claude API                                                │
│  ├─ Generate page JSON spec                                        │
│  ├─ Validate against schema                                        │
│  └─ Return: page object or retry                                   │
│                                                                     │
│  Generated Page:                                                    │
│  {                                                                  │
│    type: "solution_brief",                                          │
│    title: "Territory Performance ROI Framework",                    │
│    sections: [                                                      │
│      {type: "hero", headline: "..."},                               │
│      {type: "feature_grid", features: [...]},                       │
│      {type: "metrics", metrics: [...]},                             │
│      {type: "cta", buttons: [...]}                                  │
│    ]                                                                │
│  }                                                                  │
│                          ↓                                          │
└─────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    API RESPONSE                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ {                                                                   │
│   "success": true,                                                  │
│   "message": "Great question! Here's a framework...",              │
│   "session": {                                                      │
│     "sessionId": "uuid-123",                                        │
│     "persona": {updated_persona},                                   │
│     "messageCount": 2                                               │
│   },                                                                │
│   "signals": [                                                      │
│     "pain_point/sales_effectiveness: 0.85",                        │
│     "user_type/field_sales: 0.75"                                  │
│   ],                                                                │
│   "generationMode": "returning",                                    │
│   "knowledgeDocuments": 5,                                          │
│   "generatedPage": {                                                │
│     "page": {page_spec_object},                                     │
│     "intent": "problem_solving",                                    │
│     "intentConfidence": 0.89                                        │
│   }                                                                 │
│ }                                                                   │
│                          ↓                                          │
└─────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                CLIENT RENDERING                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 1. Show Loading Screen (BevGenieVisualLoader)                       │
│    ├─ Stage 1: Understanding Your Question                         │
│    ├─ Stage 2: Detecting Your Persona                              │
│    ├─ Stage 3: Gathering Intelligence                              │
│    ├─ Stage 4: Personalizing Solutions                             │
│    └─ Stage 5: Crafting Your Experience                            │
│                                                                     │
│    Progress: 0% → 100% over ~10-12 seconds                         │
│    Shows metrics and insights for each stage                        │
│                          ↓                                          │
│                                                                     │
│ 2. Render Generated Page (DynamicPageRenderer)                      │
│    ├─ Hero Section                                                 │
│    │  ├─ Headline: "Territory Performance ROI Framework"           │
│    │  ├─ Subheadline: "..."                                        │
│    │  └─ CTA buttons                                               │
│    │                                                                │
│    ├─ Feature Grid                                                 │
│    │  ├─ Feature 1: "Market Opportunity"                           │
│    │  ├─ Feature 2: "Competitive Analysis"                         │
│    │  ├─ Feature 3: "Action Items"                                 │
│    │  └─ Feature 4: "Timeline"                                     │
│    │                                                                │
│    ├─ Metrics Display                                              │
│    │  ├─ 42% Potential Growth                                      │
│    │  ├─ 3-6mo ROI Timeline                                        │
│    │  └─ 120% Efficiency Gain                                      │
│    │                                                                │
│    └─ CTA Section                                                  │
│       └─ "Ready to Take Action?"                                   │
│                                                                     │
│ 3. Keep Chat Bubble Visible                                        │
│    ├─ User can ask follow-up questions                             │
│    ├─ Chat shows in message history                                │
│    └─ Can generate new pages based on follow-ups                   │
│                          ↓                                          │
└─────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
                    ✨ USER SEES:
                    • Personalized AI response
                    • Visual loading experience
                    • Relevant page generated
                    • Can continue chatting
                    • Full context maintained
```

## Database Schema (Simplified)

```
┌─────────────────────────────────┐
│      user_sessions              │
├─────────────────────────────────┤
│ id (PK)                         │
│ session_id (unique)             │
│ user_id                         │
│ created_at                      │
│ updated_at                      │
│ current_mode                    │
└─────────────────────────────────┘
         │
         │ has one
         ▼
┌─────────────────────────────────┐
│      user_personas              │
├─────────────────────────────────┤
│ id (PK)                         │
│ session_id (FK)                 │
│ sales_focus_score               │
│ marketing_focus_score           │
│ pain_points_detected (array)    │
│ company_type                    │
│ overall_confidence              │
│ updated_at                      │
└─────────────────────────────────┘
         │
         │ has many
         ▼
┌─────────────────────────────────┐
│    persona_signals              │
├─────────────────────────────────┤
│ id (PK)                         │
│ persona_id (FK)                 │
│ signal_type                     │
│ category                        │
│ strength (0-1)                  │
│ evidence                        │
│ created_at                      │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ conversation_messages           │
├─────────────────────────────────┤
│ id (PK)                         │
│ session_id (FK)                 │
│ message_role (user/assistant)   │
│ message_content                 │
│ generation_mode                 │
│ created_at                      │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ knowledge_documents             │
├─────────────────────────────────┤
│ id (PK)                         │
│ content (text)                  │
│ embedding (vector)  ◄─ pgvector │
│ metadata (jsonb)                │
│ created_at                      │
└─────────────────────────────────┘
```

## Processing Timeline

```
T+0ms:    User submits message
T+50ms:   Signal detection complete
T+250ms:  Knowledge search complete
T+350ms:  System prompt generated
T+1350ms: LLM (GPT-4o) response ready
T+1500ms: Save to conversation history
T+1550ms: Classification complete
T+3550ms: Page generation complete (Claude)
T+3600ms: API response sent to client
T+4000ms: Chat bubble progress: 40%
          Loading screen shows Stage 3
T+6000ms: Chat bubble progress: 80%
          Loading screen shows Stage 5
T+10000ms: Chat bubble progress: 100%
           Page rendering begins
T+12000ms: Page fully rendered, loading screen hidden
```

## Scaling Considerations

```
Per Request:
- 1 OpenAI API call (GPT-4o)      → ~1.5s latency
- 1 Anthropic API call (Claude)   → ~2.5s latency
- 1 Supabase search query         → ~200ms
- 1 Supabase write (conversation) → ~50ms
- 3-5 database updates (signals)  → ~150ms
└─ Total: ~5-7 seconds + client rendering

Concurrent Users (Example):
- 100 users: 100-200 API calls/min to GPT-4o
- 100 users: 100-200 API calls/min to Claude
- 100 users: Knowledge search throughput ≤ 10/sec
- Database connections: ~20 concurrent

Optimization:
- Cache page specs (same query = same page)
- Rate limit page generation (3x per minute per user)
- Queue long-running generation tasks
- Use streaming for real-time updates
```

---

**Architecture Status**: ✅ Production Ready
**Last Updated**: October 29, 2025
**Components**: 9 stages + 3 external APIs + 5 database tables
