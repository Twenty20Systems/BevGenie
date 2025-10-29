# Code Dependency Diagram - Content Generation Pipeline

## File Dependency Tree

```
app/api/chat/route.ts (API ENTRY POINT)
    ├─ app/genie/page.tsx (calls this endpoint)
    │
    ├─ lib/ai/orchestrator.ts (MAIN ORCHESTRATOR)
    │   │
    │   ├─ lib/ai/persona-detection.ts
    │   │   └─ lib/session/types.ts (types)
    │   │
    │   ├─ lib/ai/knowledge-search.ts
    │   │   ├─ lib/ai/embeddings.ts
    │   │   │   └─ openai (external)
    │   │   │
    │   │   └─ lib/supabase/queries.ts
    │   │       ├─ lib/supabase/client.ts
    │   │       └─ @supabase/supabase-js (external)
    │   │
    │   ├─ lib/ai/prompts/system.ts
    │   │
    │   ├─ openai (external - GPT-4o)
    │   │
    │   ├─ lib/session/session.ts
    │   │   ├─ lib/supabase/queries.ts
    │   │   │   └─ lib/supabase/client.ts
    │   │   │
    │   │   └─ lib/session/types.ts
    │   │
    │   ├─ lib/ai/intent-classification.ts
    │   │   └─ lib/ai/page-specs.ts
    │   │
    │   └─ lib/ai/page-generator.ts
    │       ├─ @anthropic-ai/sdk (external - Claude)
    │       ├─ lib/ai/page-specs.ts
    │       │   └─ (validation)
    │       │
    │       └─ (retry logic)
    │
    └─ lib/session/session.ts
        └─ lib/supabase/queries.ts
            └─ lib/supabase/client.ts

frontend: app/genie/page.tsx (FRONTEND PAGE)
    ├─ hooks/useChat.ts
    │   └─ app/api/chat/route.ts (calls)
    │
    ├─ components/genie/loading-screen.tsx (BevGenieVisualLoader)
    │   ├─ lucide-react (icons)
    │   └─ React (UI)
    │
    ├─ components/genie/dynamic-content.tsx (DynamicContent)
    │   └─ components/dynamic-page-renderer.tsx (renders specs)
    │       ├─ lib/ai/page-specs.ts (types)
    │       ├─ lucide-react (icons)
    │       ├─ lib/constants/colors.ts
    │       └─ React components
    │
    └─ components/genie/chat-bubble.tsx (ChatBubble)
        ├─ lucide-react (icons)
        └─ React (UI)
```

---

## 9-Step Pipeline - Code Module Mapping

```
┌─────────────────────────────────────────────────────────────┐
│ orchestrator.ts - Main Orchestrator                         │
│ export processChat(request: ChatRequest): ChatResponse      │
└─────────────────────────────────────────────────────────────┘
    │
    ├─ [STEP 1] detectPersonaSignals()
    │   └─ lib/ai/persona-detection.ts
    │       └─ Analyzes message for signals
    │
    ├─ [STEP 2] updatePersonaWithSignals()
    │   └─ lib/ai/persona-detection.ts
    │       └─ Updates confidence scores
    │
    ├─ [STEP 3] searchKnowledgeBase()
    │   └─ lib/ai/knowledge-search.ts
    │       ├─ Calls generateEmbedding()
    │       │   └─ lib/ai/embeddings.ts → OpenAI API
    │       │
    │       └─ Queries Supabase vectors
    │           └─ lib/supabase/queries.ts
    │
    ├─ [STEP 4] getPersonalizedSystemPrompt()
    │   └─ lib/ai/prompts/system.ts
    │       └─ Builds persona-aware prompt
    │
    ├─ [STEP 5] openai.chat.completions.create()
    │   └─ OpenAI API (external)
    │       └─ GPT-4o model
    │
    ├─ [STEP 6] addConversationMessage()
    │   └─ lib/session/session.ts
    │       └─ lib/supabase/queries.ts
    │           └─ Saves to database
    │
    ├─ [STEP 7] determineGenerationMode()
    │   └─ orchestrator.ts (inline logic)
    │       └─ Returns: fresh | returning | data_connected
    │
    ├─ [STEP 8] classifyMessageIntent()
    │   └─ lib/ai/intent-classification.ts
    │       ├─ Uses lib/ai/page-specs.ts
    │       └─ Returns: intent + page type
    │
    └─ [STEP 9] generatePageSpec()
        └─ lib/ai/page-generator.ts
            ├─ Calls Claude API
            │   └─ @anthropic-ai/sdk (external)
            │
            ├─ Validates output
            │   └─ lib/ai/page-specs.ts
            │       └─ validatePageSpec()
            │
            └─ Retry logic (max 2x on validation failure)
```

---

## Data Flow Through Modules

```
USER MESSAGE
    ↓
┌─────────────────────────────────┐
│ app/api/chat/route.ts           │
│ POST /api/chat                  │
└────────────┬────────────────────┘
             │
    ┌────────▼────────┐
    │ Validate Input  │
    └────────┬────────┘
             │
    ┌────────▼─────────────────┐
    │ Get Session              │
    │ lib/session/session.ts   │
    └────────┬─────────────────┘
             │
    ┌────────▼──────────────────────┐
    │ Load Conversation History     │
    │ lib/session/session.ts        │
    │ → lib/supabase/queries.ts     │
    └────────┬──────────────────────┘
             │
    ┌────────▼──────────────────────────────┐
    │ orchestrator.processChat()            │
    │ lib/ai/orchestrator.ts               │
    └────────┬──────────────────────────────┘
             │
    ┌────────▼──────────────────────┐
    │ Step 1-2: Signals & Persona  │
    │ lib/ai/persona-detection.ts  │
    │ ↓ update db                   │
    │ lib/supabase/queries.ts      │
    └────────┬──────────────────────┘
             │
    ┌────────▼──────────────────────┐
    │ Step 3: Knowledge Search     │
    │ lib/ai/knowledge-search.ts   │
    │ ├─ lib/ai/embeddings.ts      │
    │ │  → OpenAI API              │
    │ └─ lib/supabase/queries.ts   │
    │    → Search vectors          │
    └────────┬──────────────────────┘
             │
    ┌────────▼──────────────────────┐
    │ Step 4: System Prompt        │
    │ lib/ai/prompts/system.ts     │
    └────────┬──────────────────────┘
             │
    ┌────────▼──────────────────────┐
    │ Step 5: LLM Response         │
    │ → OpenAI GPT-4o API          │
    └────────┬──────────────────────┘
             │
    ┌────────▼──────────────────────┐
    │ Step 6: Save Conversation    │
    │ lib/session/session.ts       │
    │ → lib/supabase/queries.ts    │
    └────────┬──────────────────────┘
             │
    ┌────────▼──────────────────────┐
    │ Step 7-8: Mode & Intent      │
    │ orchestrator.ts              │
    │ lib/ai/intent-classification │
    └────────┬──────────────────────┘
             │
    ┌────────▼──────────────────────┐
    │ Step 9: Page Generation      │
    │ lib/ai/page-generator.ts     │
    │ ├─ → Claude API              │
    │ ├─ lib/ai/page-specs.ts      │
    │ │  (validate)                │
    │ └─ Retry logic               │
    └────────┬──────────────────────┘
             │
    ┌────────▼──────────────────────────┐
    │ ChatResponse                      │
    │ {                                 │
    │   message: string                 │
    │   persona: PersonaScores          │
    │   signals: string[]               │
    │   generatedPage?: BevGeniePage    │
    │ }                                 │
    └────────┬──────────────────────────┘
             │
             ▼
    ┌─────────────────────────────────┐
    │ app/genie/page.tsx              │
    │ Receives response                │
    └─────────────────────────────────┘
             │
    ┌────────▼──────────────────────┐
    │ Show Loading Screen           │
    │ components/genie/             │
    │   loading-screen.tsx          │
    │ BevGenieVisualLoader          │
    │ 5-stage animation             │
    └────────┬──────────────────────┘
             │
    ┌────────▼──────────────────────┐
    │ Render Dynamic Content        │
    │ components/genie/             │
    │   dynamic-content.tsx         │
    │ └─ dynamic-page-renderer.tsx  │
    │    ├─ Parse page spec         │
    │    ├─ Render sections         │
    │    └─ Apply styling           │
    └────────┬──────────────────────┘
             │
    ┌────────▼──────────────────────┐
    │ Show Chat Bubble              │
    │ components/genie/             │
    │   chat-bubble.tsx             │
    │ ├─ Update message history     │
    │ ├─ Show loading progress      │
    │ └─ Accept new input           │
    └─────────────────────────────────┘
```

---

## Component Dependency Matrix

```
                                     Depends On
File                                 │ What External Files
─────────────────────────────────────┼──────────────────────────────
app/api/chat/route.ts                │ orchestrator, session, types
app/genie/page.tsx                   │ useChat, loading-screen,
                                     │ dynamic-content, chat-bubble
─────────────────────────────────────┼──────────────────────────────
lib/ai/orchestrator.ts               │ persona-detection, knowledge-search,
                                     │ embeddings, prompts, session,
                                     │ intent-classification,
                                     │ page-generator, page-specs
─────────────────────────────────────┼──────────────────────────────
lib/ai/persona-detection.ts          │ session/types
─────────────────────────────────────┼──────────────────────────────
lib/ai/knowledge-search.ts           │ embeddings, supabase/queries
─────────────────────────────────────┼──────────────────────────────
lib/ai/embeddings.ts                 │ openai (external API)
─────────────────────────────────────┼──────────────────────────────
lib/ai/intent-classification.ts      │ page-specs
─────────────────────────────────────┼──────────────────────────────
lib/ai/page-generator.ts             │ @anthropic-ai/sdk, page-specs
─────────────────────────────────────┼──────────────────────────────
lib/ai/page-specs.ts                 │ (no internal deps)
─────────────────────────────────────┼──────────────────────────────
lib/ai/prompts/system.ts             │ (no internal deps)
─────────────────────────────────────┼──────────────────────────────
lib/session/session.ts               │ supabase/queries, session/types
─────────────────────────────────────┼──────────────────────────────
lib/session/types.ts                 │ (no internal deps)
─────────────────────────────────────┼──────────────────────────────
lib/supabase/client.ts               │ @supabase/supabase-js
─────────────────────────────────────┼──────────────────────────────
lib/supabase/queries.ts              │ supabase/client
─────────────────────────────────────┼──────────────────────────────
hooks/useChat.ts                     │ app/api/chat/route.ts
─────────────────────────────────────┼──────────────────────────────
components/genie/loading-screen.tsx  │ lucide-react
─────────────────────────────────────┼──────────────────────────────
components/genie/chat-bubble.tsx     │ lucide-react
─────────────────────────────────────┼──────────────────────────────
components/genie/dynamic-content.tsx │ dynamic-page-renderer,
                                     │ page-specs
─────────────────────────────────────┼──────────────────────────────
components/dynamic-page-renderer.tsx │ page-specs, lucide-react,
                                     │ colors.ts
─────────────────────────────────────┴──────────────────────────────
```

---

## External API Dependencies

```
┌─────────────────────────────────────────────┐
│          EXTERNAL SERVICES                  │
└─────────────────────────────────────────────┘
    │
    ├─ OpenAI (npm: openai)
    │   ├─ Called from: lib/ai/orchestrator.ts (Step 5)
    │   ├─ Model: gpt-4o
    │   ├─ Method: chat.completions.create()
    │   ├─ Endpoint: /v1/chat/completions
    │   └─ Also used: lib/ai/embeddings.ts
    │       ├─ Model: text-embedding-3-small
    │       ├─ Method: embeddings.create()
    │       └─ Endpoint: /v1/embeddings
    │
    ├─ Anthropic (npm: @anthropic-ai/sdk)
    │   ├─ Called from: lib/ai/page-generator.ts (Step 9)
    │   ├─ Model: claude-opus (or claude-3-5-sonnet)
    │   ├─ Method: messages.create()
    │   └─ Endpoint: /v1/messages
    │
    └─ Supabase (npm: @supabase/supabase-js)
        ├─ Called from: lib/supabase/client.ts
        ├─ Used in: knowledge-search, session, queries
        ├─ Services:
        │   ├─ PostgreSQL database
        │   ├─ Vector search (pgvector extension)
        │   ├─ Real-time subscriptions (optional)
        │   └─ Authentication (optional)
        └─ Tables:
            ├─ user_sessions
            ├─ user_personas
            ├─ persona_signals
            ├─ conversation_messages
            └─ knowledge_documents
```

---

## Import Chain Analysis

### From app/genie/page.tsx:

```typescript
app/genie/page.tsx
├─ import { ChatBubble } from '@/components/genie/chat-bubble'
├─ import { BevGenieVisualLoader } from '@/components/genie/loading-screen'
├─ import { DynamicContent } from '@/components/genie/dynamic-content'
│   └─ → imports DynamicPageRenderer
│       └─ → imports dynamic-page-renderer.tsx
│           └─ → imports page-specs.ts (types)
└─ State & API calls via direct fetch('/api/chat')
    └─ → app/api/chat/route.ts
        └─ → lib/ai/orchestrator.ts
            └─ [9 sub-imports for each step]
```

### From app/api/chat/route.ts:

```typescript
app/api/chat/route.ts
├─ import { getSession, ... } from '@/lib/session/session'
│   └─ → lib/supabase/queries.ts
│       └─ → lib/supabase/client.ts
└─ import { processChat } from '@/lib/ai/orchestrator'
    ├─ → lib/ai/persona-detection.ts
    ├─ → lib/ai/knowledge-search.ts
    │   ├─ → lib/ai/embeddings.ts (OpenAI)
    │   └─ → lib/supabase/queries.ts
    ├─ → lib/ai/prompts/system.ts
    ├─ → openai (GPT-4o)
    ├─ → lib/session/session.ts
    ├─ → lib/ai/intent-classification.ts
    └─ → lib/ai/page-generator.ts (Claude)
        ├─ → lib/ai/page-specs.ts
        └─ → @anthropic-ai/sdk
```

---

## Circular Dependencies Check

✅ **No circular dependencies detected!**

- All imports flow downward (DAG - Directed Acyclic Graph)
- orchestrator.ts is the central hub (receives, doesn't provide)
- All leaf modules have no internal dependencies
- Clear separation of concerns

---

## Module Responsibility Matrix

```
┌──────────────────────────┬─────────────────────────────┐
│ Module Layer             │ Responsibility              │
├──────────────────────────┼─────────────────────────────┤
│ ENTRY POINT              │ Endpoint handling, routing  │
│ - app/api/chat/route.ts  │                             │
├──────────────────────────┼─────────────────────────────┤
│ ORCHESTRATION            │ 9-step coordination         │
│ - orchestrator.ts        │ Error handling              │
│ - determineGenerationMode│ Response building           │
├──────────────────────────┼─────────────────────────────┤
│ AI COMPONENTS            │ Individual step execution   │
│ - persona-detection      │ Signal detection            │
│ - knowledge-search       │ Context retrieval           │
│ - embeddings             │ Vector generation           │
│ - intent-classification  │ Page type selection         │
│ - page-generator         │ Page spec creation          │
├──────────────────────────┼─────────────────────────────┤
│ PERSISTENCE              │ Database operations         │
│ - session                │ Session management          │
│ - supabase/queries       │ CRUD operations             │
├──────────────────────────┼─────────────────────────────┤
│ TYPE DEFINITIONS         │ Data structure contracts    │
│ - page-specs.ts          │ Validation rules            │
│ - session/types.ts       │ Interface definitions       │
├──────────────────────────┼─────────────────────────────┤
│ PROMPTING                │ AI instruction generation   │
│ - prompts/system.ts      │ Context formatting          │
├──────────────────────────┼─────────────────────────────┤
│ FRONTEND                 │ User interface rendering    │
│ - genie pages            │ Loading animation           │
│ - chat components        │ Message display             │
│ - dynamic-renderer       │ Page spec rendering         │
├──────────────────────────┼─────────────────────────────┤
│ STATE MANAGEMENT         │ Frontend state handling     │
│ - hooks/useChat.ts       │ API communication           │
│ - hooks/useThinkingStream│ Stream processing           │
└──────────────────────────┴─────────────────────────────┘
```

---

## Code File Size Estimates

```
Core Pipeline Files:
- orchestrator.ts           ~400 lines
- persona-detection.ts      ~300 lines
- knowledge-search.ts       ~250 lines
- page-generator.ts         ~250 lines
- intent-classification.ts  ~150 lines
- prompts/system.ts         ~200 lines
- embeddings.ts             ~100 lines
- page-specs.ts             ~150 lines
- session/session.ts        ~200 lines
- supabase/queries.ts       ~300 lines

Frontend Files:
- genie/loading-screen.tsx  ~250 lines
- genie/chat-bubble.tsx     ~200 lines
- dynamic-page-renderer.tsx ~400 lines
- genie/page.tsx            ~150 lines

API Files:
- api/chat/route.ts         ~150 lines
- api/chat/stream/route.ts  ~100 lines

Hooks:
- useChat.ts                ~150 lines
- useThinkingStream.ts      ~100 lines

Total Estimated: 4,500+ lines of code
```

---

## Scalability Path

```
Current Architecture:
├─ Single orchestrator.ts
├─ Single api/chat/route.ts
└─ Linear 9-step process

Future Enhancements:
├─ Worker queue for page generation
├─ Caching layer for embeddings
├─ Distributed signal detection
├─ Page generation versioning
├─ A/B testing framework
└─ Analytics tracking layer
```

---

**Total Modules:** 25+
**External APIs:** 3 (OpenAI, Anthropic, Supabase)
**Dependencies:** 10+ npm packages
**Architecture Pattern:** Modular, layered, DAG-based
**Status:** ✅ Production Ready
