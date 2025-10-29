# BevGenie Code Architecture: All Components & Files Used

## Overview

This document maps every code file involved in the content generation pipeline, organized by layer.

---

## 📁 Directory Structure

```
project-root/
├── app/                           # Next.js App Router
│   ├── api/                       # API Routes
│   │   └── chat/                  # Chat endpoint
│   │       ├── route.ts           # Main chat API
│   │       └── stream/            # Streaming API
│   ├── genie/                     # Genie page route
│   │   └── page.tsx               # /genie page
│   ├── page.tsx                   # Homepage
│   ├── layout.tsx                 # Root layout
│   └── globals.css                # Global styles
│
├── components/                    # React Components
│   ├── genie/                     # Genie-specific components
│   │   ├── loading-screen.tsx    # BevGenieVisualLoader
│   │   ├── chat-bubble.tsx        # ChatBubble component
│   │   └── dynamic-content.tsx    # DynamicContent wrapper
│   ├── dynamic-page-renderer.tsx # Main page renderer
│   ├── chat-widget.tsx            # Homepage chat widget
│   ├── page-with-chat-sidebar.tsx # Page + chat layout
│   ├── page-loading-screen.tsx   # Page loading screen
│   ├── full-screen-page-view.tsx # Full screen page
│   ├── hero.tsx, challenges.tsx,  # Homepage sections
│   │   data-powered.tsx, etc.
│   ├── navigation.tsx, footer.tsx # Layout components
│   └── ui/                        # UI Component Library (shadcn/ui)
│
├── lib/                           # Core Logic & Utilities
│   ├── ai/                        # AI Pipeline
│   │   ├── orchestrator.ts        # Main orchestrator (9-step pipeline)
│   │   ├── signal-detection.ts    # Persona signal detection
│   │   ├── persona-detection.ts   # Persona profile handling
│   │   ├── knowledge-search.ts    # Knowledge base search
│   │   ├── embeddings.ts          # Embedding generation
│   │   ├── intent-classification.ts # Intent detection
│   │   ├── page-generator.ts      # Page spec generation (Claude)
│   │   ├── page-specs.ts          # Page type definitions
│   │   └── prompts/
│   │       └── system.ts          # AI system prompts
│   ├── session/                   # User Session Management
│   │   ├── session.ts             # Session operations
│   │   ├── types.ts               # Session type definitions
│   │   └── config.ts              # Session configuration
│   ├── supabase/                  # Database
│   │   ├── client.ts              # Supabase client
│   │   ├── queries.ts             # Database queries
│   │   └── page-queries.ts        # Page-specific queries
│   ├── constants/
│   │   └── colors.ts              # Color system
│   └── utils.ts                   # General utilities
│
├── hooks/                         # React Hooks
│   ├── useChat.ts                 # Chat state management
│   ├── useThinkingStream.ts       # Stream handling
│   └── use-toast.ts               # Toast notifications
│
└── public/                        # Static assets
```

---

## 🔄 Content Generation Pipeline - Code Flow

```
USER INPUT
    ↓
1. API LAYER
    └── app/api/chat/route.ts
        • POST /api/chat endpoint
        • Request validation
        • Session management
        • Response formatting
    ↓
2. ORCHESTRATOR (9-Step Pipeline)
    └── lib/ai/orchestrator.ts
        ├── Step 1: detectPersonaSignals()
        │   └── lib/ai/persona-detection.ts
        ├── Step 2: updatePersonaWithSignals()
        │   └── lib/ai/persona-detection.ts
        ├── Step 3: searchKnowledgeBase()
        │   └── lib/ai/knowledge-search.ts
        │       ├── lib/ai/embeddings.ts (generate vectors)
        │       └── lib/supabase/queries.ts (search db)
        ├── Step 4: getPersonalizedSystemPrompt()
        │   └── lib/ai/prompts/system.ts
        ├── Step 5: openai.chat.completions.create()
        │   └── (OpenAI API call)
        ├── Step 6: addConversationMessage()
        │   └── lib/session/session.ts
        ├── Step 7: determineGenerationMode()
        │   └── lib/ai/orchestrator.ts
        ├── Step 8: classifyMessageIntent()
        │   └── lib/ai/intent-classification.ts
        └── Step 9: generatePageSpec()
            └── lib/ai/page-generator.ts
                ├── Claude API call
                ├── validatePageSpec()
                └── lib/ai/page-specs.ts
    ↓
3. DATABASE LAYER
    └── lib/session/session.ts
        ├── getSession()
        ├── updatePersona()
        ├── addConversationMessage()
        └── lib/supabase/queries.ts
            ├── User sessions
            ├── Persona profiles
            ├── Signals history
            └── Conversation messages
    ↓
4. API RESPONSE
    └── lib/ai/orchestrator.ts returns ChatResponse
        {
          message,
          personaUpdated,
          signalsDetected,
          generatedPage
        }
    ↓
5. FRONTEND RENDERING
    └── app/genie/page.tsx
        ├── Show BevGenieVisualLoader
        │   └── components/genie/loading-screen.tsx
        │       └── 5-stage animation
        ├── Render DynamicContent
        │   └── components/genie/dynamic-content.tsx
        │       └── components/dynamic-page-renderer.tsx
        │           ├── Hero section rendering
        │           ├── Feature grid rendering
        │           ├── Metrics display
        │           └── CTA rendering
        └── Show ChatBubble
            └── components/genie/chat-bubble.tsx
```

---

## 📋 Complete File Reference by Purpose

### API Endpoints

| File | Purpose | Exports |
|------|---------|---------|
| `app/api/chat/route.ts` | Main chat endpoint | `POST /api/chat`, `GET /api/chat` |
| `app/api/chat/stream/route.ts` | Streaming endpoint | `POST /api/chat/stream` (future) |

---

### Core AI Pipeline (lib/ai/)

#### 1. **orchestrator.ts** - Main Orchestrator
```typescript
// The central conductor of all 9 steps
export async function processChat(request: ChatRequest): Promise<ChatResponse>

// Step-by-step process:
1. detectPersonaSignals(message, persona)
2. updatePersonaWithSignals(persona, signals)
3. searchKnowledgeBase(message, persona, count)
4. getPersonalizedSystemPrompt(persona, context)
5. openai.chat.completions.create() // GPT-4o
6. addConversationMessage(user/assistant, content)
7. determineGenerationMode(persona, messageCount)
8. classifyMessageIntent(message, count, persona)
9. generatePageSpec(request) // Claude
```

**Key Functions:**
- `processChat()` - Main entry point
- `determineGenerationMode()` - fresh | returning | data_connected
- `getPersonaDescription()` - Format persona for prompts

---

#### 2. **persona-detection.ts** - Persona Handling
```typescript
// Detects user signals and maintains persona profile
export function detectPersonaSignals(message, persona): Signal[]
export function updatePersonaWithSignals(persona, signals): PersonaScores
export function getPrimaryPersonaClass(persona): string

// Persona attributes tracked:
{
  overall_confidence: number
  sales_focus_score: number
  marketing_focus_score: number
  operational_focus_score: number
  company_type: string
  company_size: string
  pain_points_detected: string[]
  conversation_count: number
}
```

**Signal Types:**
- `pain_point` - Business problems mentioned
- `user_type` - Role/responsibility level
- `company_attr` - Company characteristics
- `focus_area` - What they care about

---

#### 3. **knowledge-search.ts** - Knowledge Base Search
```typescript
// Searches 50K+ documents for relevant context
export async function searchKnowledgeBase(query, limit): Document[]
export async function getContextForLLM(query, persona, limit): string
export async function getPainPointDocuments(painPoint): Document[]

// Process:
1. generateEmbedding(query) - Convert to vector
2. querySupabaseVector(embedding) - Find similar docs
3. rankByRelevance(results, persona) - Filter by persona
4. formatForLLM(documents) - Return as text context
```

**Returns:**
- Top 5 most relevant documents
- Formatted as markdown text
- ~2000 tokens max context

---

#### 4. **embeddings.ts** - Vector Generation
```typescript
// Converts text to vector embeddings for semantic search
export async function generateEmbedding(text): number[]
export async function getCachedEmbedding(text): number[] | null

// Uses:
- OpenAI Embeddings API
- Model: text-embedding-3-small
- Caches results in memory
```

---

#### 5. **intent-classification.ts** - Intent Detection
```typescript
// Determines user intent and best page type
export function classifyMessageIntent(
  message,
  conversationCount,
  persona
): {
  intent: string
  suggestedPageType: string
  confidence: number
}

// Possible intents:
- exploration: Learning/researching
- problem_solving: Has specific issue
- learning: Wants to learn
- decision_making: Comparing options
- implementation: Ready to execute

// Maps to page types:
- "problem_solving" → "solution_brief"
- "learning" → "feature_showcase"
- "decision_making" → "comparison_guide"
```

---

#### 6. **page-generator.ts** - Page Spec Generation
```typescript
// Generates custom page specifications using Claude
export async function generatePageSpec(request): PageGenerationResponse

interface PageGenerationRequest {
  userMessage: string
  pageType: PageType
  persona: PersonaScores
  knowledgeContext: string[]
  conversationHistory: Message[]
  personaDescription: string
}

interface PageGenerationResponse {
  success: boolean
  page?: BevGeniePage
  error?: string
  retryCount?: number
  generationTime?: number
}

// Process:
1. buildPrompt(request) - Create Claude prompt
2. callClaude() - Generate page spec
3. validatePageSpec(page) - Check structure
4. retry(request, feedback) - Retry if validation fails (max 2x)
```

**Features:**
- Uses Claude AI (Anthropic)
- Max 2 retries on validation failure
- Validates against BevGeniePage schema
- Returns generation timing metadata

---

#### 7. **page-specs.ts** - Page Type Definitions
```typescript
// Defines all possible page structures

export type PageType =
  | 'solution_brief'
  | 'feature_showcase'
  | 'analytics_dashboard'
  | 'case_study'
  | 'metrics_tracker'
  | 'comparison_guide'

export interface BevGeniePage {
  type: PageType
  title: string
  description: string
  sections: Section[]
}

export interface Section {
  type: SectionType
  headline?: string
  content?: string
  features?: Feature[]
  metrics?: Metric[]
  buttons?: Button[]
  // ... more fields
}

export type SectionType =
  | 'hero'
  | 'feature_grid'
  | 'metrics'
  | 'comparison'
  | 'case_study'
  | 'cta'
  | 'testimonial'
  | 'faq'

// Validation:
export function validatePageSpec(page): ValidationError[]
export const PAGE_TYPE_TEMPLATES = { /* templates for each type */ }
```

---

#### 8. **prompts/system.ts** - System Prompts
```typescript
// Creates personalized AI instructions

export function getPersonalizedSystemPrompt(
  persona: PersonaScores,
  knowledgeContext: string
): string

export function formatKnowledgeContext(documents): string

// Exports:
export const PAIN_POINT_PROMPTS = {
  sales_effectiveness: "...",
  team_alignment: "...",
  // ... more pain points
}

// Output: Personalized system prompt with:
- Persona context
- Pain point guidance
- Knowledge base context
- Tone/style requirements
```

---

### Session Management (lib/session/)

#### 1. **session.ts** - Session Operations
```typescript
// Manages user sessions and persistence

export async function getSession(): Promise<Session>
export async function updatePersona(persona): Promise<void>
export async function addConversationMessage(
  role: 'user' | 'assistant',
  content: string,
  mode: string
): Promise<void>
export async function getConversationHistory(): Promise<Message[]>
export async function recordPersonaSignal(
  type: string,
  evidence: string,
  strength: number,
  painPoints?: string[],
  metadata?: object
): Promise<void>

// Uses:
- Supabase client
- Database queries
- Session types
```

#### 2. **types.ts** - Session Type Definitions
```typescript
export interface PersonaScores {
  overall_confidence: number
  sales_focus_score: number
  marketing_focus_score: number
  operational_focus_score: number
  company_type: string
  company_size: string
  pain_points_detected: string[]
}

export type PainPointType =
  | 'sales_effectiveness'
  | 'team_alignment'
  | 'territory_management'
  // ... more types
```

#### 3. **config.ts** - Configuration
```typescript
// Session configuration constants
export const SESSION_CONFIG = {
  sessionTimeout: 24 * 60 * 60 * 1000,
  // ... other settings
}
```

---

### Database Layer (lib/supabase/)

#### 1. **client.ts** - Supabase Client
```typescript
// Initialize Supabase client
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
```

#### 2. **queries.ts** - Main Database Queries
```typescript
// All database operations
export async function queryUserSession()
export async function updatePersonaInDB()
export async function insertConversationMessage()
export async function searchKnowledgeDocuments()
export async function recordSignalInDB()

// Tables accessed:
- user_sessions
- user_personas
- persona_signals
- conversation_messages
```

#### 3. **page-queries.ts** - Page-Specific Queries
```typescript
// Page generation related queries
export async function savePageGeneration()
export async function getPageHistory()
// ... page-specific operations
```

---

### Frontend Components

#### UI Components - Genie Feature

| Component | File | Purpose |
|-----------|------|---------|
| **BevGenieVisualLoader** | `components/genie/loading-screen.tsx` | 5-stage loading animation |
| **ChatBubble** | `components/genie/chat-bubble.tsx` | Chat interface (minimized/expanded) |
| **DynamicContent** | `components/genie/dynamic-content.tsx` | Wrapper for generated pages |

#### Page Renderers

| Component | File | Purpose |
|-----------|------|---------|
| **DynamicPageRenderer** | `components/dynamic-page-renderer.tsx` | Main page spec → React converter |
| **PageWithChatSidebar** | `components/page-with-chat-sidebar.tsx` | Page + chat layout |
| **FullScreenPageView** | `components/full-screen-page-view.tsx` | Full-screen page display |

#### Pages

| Page | File | Route |
|------|------|-------|
| **Genie Page** | `app/genie/page.tsx` | `/genie` |
| **Homepage** | `app/page.tsx` | `/` |

---

### Hooks (React State Management)

#### 1. **useChat.ts** - Chat State Management
```typescript
// Manages chat state and API communication
export function useChat() {
  // Returns:
  {
    messages: DynamicPageData[]
    generationStatus: {
      progress: number
      stageName: string
      isGeneratingPage: boolean
    }
    sendMessage: (message: string) => Promise<void>
    clearMessages: () => void
  }
}

// Features:
- Tracks message history
- Manages generation status
- Handles API communication
- Updates progress
```

#### 2. **useThinkingStream.ts** - Stream Handling
```typescript
// Handles streaming responses
export function useThinkingStream() {
  // Stream parsing and handling
}
```

---

## 🎯 Data Flow Through Code

### User Message Input

```
User Types Message
    ↓
ChatBubble Component (components/genie/chat-bubble.tsx)
    └─ onSendMessage() callback
    ↓
GeniePage (app/genie/page.tsx)
    └─ handleSendMessage(query)
    ↓
POST /api/chat (app/api/chat/route.ts)
    ├─ Parse request
    ├─ Get session (lib/session/session.ts)
    └─ Call orchestrator
```

### Backend Processing

```
orchestrator.processChat() (lib/ai/orchestrator.ts)
    ├─ Step 1: detectPersonaSignals() → lib/ai/persona-detection.ts
    ├─ Step 2: updatePersonaWithSignals() → lib/ai/persona-detection.ts
    ├─ Step 3: searchKnowledgeBase() → lib/ai/knowledge-search.ts
    │            ├─ generateEmbedding() → lib/ai/embeddings.ts
    │            └─ querySupabaseVector() → lib/supabase/queries.ts
    ├─ Step 4: getPersonalizedSystemPrompt() → lib/ai/prompts/system.ts
    ├─ Step 5: openai.chat.completions.create() → OpenAI API
    ├─ Step 6: addConversationMessage() → lib/session/session.ts
    │            └─ Database write → lib/supabase/queries.ts
    ├─ Step 7: determineGenerationMode() → lib/ai/orchestrator.ts
    ├─ Step 8: classifyMessageIntent() → lib/ai/intent-classification.ts
    └─ Step 9: generatePageSpec() → lib/ai/page-generator.ts
                 ├─ Claude API call
                 ├─ validatePageSpec() → lib/ai/page-specs.ts
                 └─ Retry logic
```

### Frontend Rendering

```
API Response arrives
    ↓
GeniePage (app/genie/page.tsx)
    ├─ Set isGenerating = true
    ├─ Set loadingProgress
    └─ Render:
        ├─ BevGenieVisualLoader (components/genie/loading-screen.tsx)
        │  └─ 5-stage animation loop
        ├─ DynamicContent (components/genie/dynamic-content.tsx)
        │  └─ DynamicPageRenderer (components/dynamic-page-renderer.tsx)
        │     ├─ Hero section
        │     ├─ Feature grid
        │     ├─ Metrics display
        │     └─ CTA section
        └─ ChatBubble (components/genie/chat-bubble.tsx)
           ├─ Show loading progress
           └─ Display chat history
```

---

## 🗄️ Database Schema (via Supabase)

```
user_sessions
├─ id (PK)
├─ session_id (unique)
├─ user_id
├─ created_at
├─ updated_at
└─ current_mode

user_personas
├─ id (PK)
├─ session_id (FK)
├─ sales_focus_score
├─ marketing_focus_score
├─ operational_focus_score
├─ pain_points_detected (array)
├─ company_type
├─ overall_confidence
└─ updated_at

persona_signals
├─ id (PK)
├─ persona_id (FK)
├─ signal_type
├─ category
├─ strength (0-1)
├─ evidence (text)
└─ created_at

conversation_messages
├─ id (PK)
├─ session_id (FK)
├─ message_role (user/assistant)
├─ message_content (text)
├─ generation_mode
└─ created_at

knowledge_documents
├─ id (PK)
├─ content (text)
├─ embedding (vector) ← pgvector
├─ metadata (jsonb)
└─ created_at
```

---

## 🔧 Configuration & Constants

### lib/constants/colors.ts
```typescript
export const COLORS = {
  cyan: '#00C8FF',
  navy: '#0A1930',
  green: '#198038',
  brown: '#AA6C39',
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  // ... more colors
}
```

---

## 📊 External Dependencies

### API Integrations

| Service | Purpose | File |
|---------|---------|------|
| **OpenAI** | GPT-4o responses + embeddings | `lib/ai/orchestrator.ts`, `lib/ai/embeddings.ts` |
| **Anthropic** | Claude for page generation | `lib/ai/page-generator.ts` |
| **Supabase** | PostgreSQL database + vector search | `lib/supabase/client.ts`, `lib/supabase/queries.ts` |

### NPM Packages

```
Dependencies used in code:
- openai: GPT-4o API
- @anthropic-ai/sdk: Claude API
- @supabase/supabase-js: Database client
- lucide-react: Icons
- tailwindcss: Styling
- react: UI framework
- next: Full-stack framework
```

---

## 🎬 Execution Flow Summary

```
┌─ FRONTEND ─────────────────────────────────────┐
│ User Types Message in Chat Bubble              │
│ → app/genie/page.tsx                           │
│ → handleSendMessage()                          │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─ API LAYER ────────────────────────────────────┐
│ POST /api/chat/route.ts                        │
│ → Validate request                             │
│ → Get session                                  │
│ → Load conversation history                    │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─ ORCHESTRATOR ─────────────────────────────────┐
│ lib/ai/orchestrator.ts                         │
│ → Step 1-9 Pipeline                            │
│ → Each step calls sub-modules                  │
│ → Builds context progressively                 │
│ → Generates response + page spec               │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─ BACKEND SERVICES ─────────────────────────────┐
│ OpenAI: GPT-4o response                        │
│ Anthropic: Claude page generation              │
│ Supabase: Session, persona, conversation       │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─ FRONTEND RENDERING ───────────────────────────┐
│ app/genie/page.tsx receives response           │
│ → Show BevGenieVisualLoader                    │
│ → Render DynamicContent with page spec         │
│ → Keep ChatBubble visible                      │
│ → Update chat history                          │
└────────────────────────────────────────────────┘
```

---

## 📈 Performance Considerations

### Code-Level Optimizations

1. **Caching**
   - Embeddings cached in `lib/ai/embeddings.ts`
   - Reduces redundant API calls

2. **Parallel Processing**
   - Knowledge search happens independently
   - Signal detection happens independently

3. **Retry Logic**
   - Page generation retries on validation failure (max 2x)
   - Improves reliability without frontend impact

4. **Database Indexing**
   - Vector index on knowledge_documents.embedding
   - Session index on user_sessions.session_id

---

## 🚨 Error Handling

### At Each Stage

| Stage | Error Handling | File |
|-------|----------------|------|
| Session | Fallback to new session | `lib/session/session.ts` |
| Signal Detection | Skip if confidence < 0.5 | `lib/ai/persona-detection.ts` |
| Knowledge Search | Use base system prompt | `lib/ai/knowledge-search.ts` |
| LLM Response | Return default message | `lib/ai/orchestrator.ts` |
| Page Generation | Return response without page | `lib/ai/page-generator.ts` |
| Database | Continue without persistence | `lib/supabase/queries.ts` |

---

## 🎓 Key Code Patterns

### 1. Modular Architecture
```
Each AI operation is its own module
- Easy to test
- Easy to replace
- Easy to understand
```

### 2. Type Safety
```typescript
// Strong typing throughout
interface ChatRequest { /* ... */ }
interface ChatResponse { /* ... */ }
type PageType = 'solution_brief' | 'feature_showcase' | ...
```

### 3. Async/Await Pattern
```typescript
// All async operations use await
async function processChat(request) {
  const signals = detectPersonaSignals() // sync
  await recordPersonaSignal() // async → db
  const context = await searchKnowledgeBase() // async → api
}
```

### 4. Graceful Degradation
```typescript
// System continues even if component fails
try {
  generatedPage = await generatePageSpec()
} catch (error) {
  console.error('Page generation failed')
  // Continue without page
}
```

---

## 📚 Summary: All Files by Role

### Request Handling (API Layer)
- `app/api/chat/route.ts`

### Orchestration (9-Step Pipeline)
- `lib/ai/orchestrator.ts`

### AI Components (Step Implementation)
- `lib/ai/persona-detection.ts`
- `lib/ai/knowledge-search.ts`
- `lib/ai/embeddings.ts`
- `lib/ai/intent-classification.ts`
- `lib/ai/page-generator.ts`
- `lib/ai/prompts/system.ts`

### Type & Spec Definitions
- `lib/ai/page-specs.ts`
- `lib/session/types.ts`

### Data Persistence
- `lib/session/session.ts`
- `lib/supabase/client.ts`
- `lib/supabase/queries.ts`
- `lib/supabase/page-queries.ts`

### Frontend Components (UI)
- `app/genie/page.tsx`
- `components/genie/loading-screen.tsx`
- `components/genie/chat-bubble.tsx`
- `components/genie/dynamic-content.tsx`
- `components/dynamic-page-renderer.tsx`

### State Management
- `hooks/useChat.ts`
- `hooks/useThinkingStream.ts`

### Utilities & Constants
- `lib/constants/colors.ts`
- `lib/utils.ts`

---

**Total Code Files in Pipeline:** 25+ critical files
**Total Lines of Code:** ~5,000+ lines across all modules
**External API Calls:** 3 (OpenAI, Anthropic, Supabase)
**Database Tables:** 5 main tables

**Status:** ✅ Production Ready
