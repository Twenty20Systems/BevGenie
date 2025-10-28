# SSE Streaming Architecture Implementation

## Overview

Implemented Server-Sent Events (SSE) streaming for BevGenie to match the dynamic_website pattern, enabling **real-time page generation with live progress updates**.

### Key Achievement
Pages now generate in real-time while users see each stage of the process, instead of waiting for a static HTTP response.

---

## Architecture

### 1. SSE Streaming Endpoint
**File:** `app/api/chat/stream/route.ts`

**Flow:**
```
POST /api/chat/stream
├── Stage 1: Analyze Intent (10-20%)
├── Stage 2: Detect Signals & Update Persona (30-40%)
├── Stage 3: Search Knowledge Base (50-60%)
├── Stage 4: Generate Chat Response (70-80%)
├── Stage 5: Generate Dynamic Page (85-95%)
└── Complete: Send final response + generated page (100%)
```

**SSE Events Sent:**
```typescript
// Stage updates
event: stage
data: {
  "stageId": "intent",
  "status": "active|complete",
  "stageName": "Analyzing your question...",
  "progress": 20
}

// Page data when available
event: page
data: {
  "page": { /* full page spec */ }
}

// Final completion
event: complete
data: {
  "success": true,
  "message": "...",
  "session": { ... },
  "generatedPage": { ... }
}

// Errors
event: error
data: {
  "error": "Error message"
}
```

---

### 2. useThinkingStream Hook
**File:** `hooks/useThinkingStream.ts`

Handles SSE event streaming client-side:

```typescript
const { stream } = useThinkingStream();

const result = await stream(
  message,
  (stage) => console.log(stage),    // onStage callback
  (page) => console.log(page),      // onPage callback
  (response) => console.log(response) // onComplete callback
);
```

**Features:**
- Parses SSE stream events
- Handles multiple event types (stage, page, complete, error)
- Abort controller for cancelling streams
- TypeScript interfaces for all events

---

### 3. Updated useChat Hook
**File:** `hooks/useChat.ts`

Now integrates SSE streaming:

```typescript
const sendMessage = async (content) => {
  // Start streaming
  const result = await stream(
    content,
    (stage) => {
      // Update UI with real-time stage
      setState(prev => ({
        ...prev,
        generationStatus: {
          isGeneratingPage: true,
          stageName: stage.stageName,
          progress: stage.progress
        }
      }));
    },
    // ... more callbacks
  );

  // Add assistant message with generated page
  setState(prev => ({
    ...prev,
    messages: [...prev.messages, {
      role: 'assistant',
      content: result.message,
      generatedPage: generatedPage
    }]
  }));
};
```

---

### 4. Real-Time Stage Display
**File:** `components/chat-widget.tsx`

Added real-time stage indicator:

```tsx
{generationStatus.isGeneratingPage && (
  <div className="fixed bottom-24 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4">
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-bold text-sm text-gray-900">Generating page...</h3>
      <span className="text-xs font-semibold text-blue-600">
        {generationStatus.progress}%
      </span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
      <div
        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
        style={{ width: `${generationStatus.progress}%` }}
      />
    </div>
    {generationStatus.stageName && (
      <p className="text-xs text-gray-600">{generationStatus.stageName}</p>
    )}
  </div>
)}
```

---

## Implementation Details

### Stage Pipeline

| Stage | ID | Progress | Description |
|-------|-----|---------|-------------|
| 1 | `intent` | 10-20% | Analyze user intent and message type |
| 2 | `signals` | 30-40% | Detect persona signals, update profile |
| 3 | `knowledge` | 50-60% | Search knowledge base for context |
| 4 | `response` | 70-80% | Generate AI response with GPT-4o |
| 5 | `page` | 85-95% | Generate page spec with Claude |
| Complete | `complete` | 100% | Return final response and page |

### Per-Stage Logic

**Stage 1: Intent Classification**
- Analyzes user message to detect intent type
- Determines if page generation is needed
- Suggests appropriate page type (solution_brief, feature_showcase, etc.)

**Stage 2: Persona & Signals**
- Detects pain point signals in user message
- Updates persona scores with new information
- Records signals to database for analytics

**Stage 3: Knowledge Search**
- Performs hybrid search (vector + keyword) on knowledge base
- Gathers context relevant to user question
- Prepares context for LLM

**Stage 4: Chat Response**
- Calls OpenAI GPT-4o with personalized system prompt
- Generates contextual response based on persona
- Streams response text back to client

**Stage 5: Page Generation**
- Calls Claude API to generate page specification
- Uses knowledge context to tailor page content
- Validates generated page spec
- Sends page data as SSE event

---

## Benefits

1. **Real-Time Feedback**: Users see generation progress in real-time
2. **Better UX**: No waiting for single HTTP response; progress is visible
3. **Progressive Enhancement**: Pages can start rendering before fully complete
4. **Error Visibility**: Can detect and report errors at each stage
5. **Analytics**: Each stage can be logged for performance monitoring

---

## Client Flow

```
User sends message
        ↓
useChat calls stream() with message
        ↓
/api/chat/stream endpoint starts
        ↓
Send stage events as each completes
        ↓
When page is generated, send page event
        ↓
Send complete event with response
        ↓
Client renders page on landing page
        ↓
Chat remains available in sidebar
```

---

## Testing

The implementation:
- ✅ Builds successfully with no TypeScript errors
- ✅ SSE endpoint compiles and runs
- ✅ useThinkingStream hook properly parses SSE events
- ✅ Real-time stage updates display in chat widget
- ✅ Full streaming flow works end-to-end

---

## Next Steps

Future enhancements could include:
1. Stream page rendering progressively (render sections as they arrive)
2. Add cancellation UI for long-running generations
3. Implement performance metrics per stage
4. Add retry logic for failed stages
5. Cache generated pages for repeated queries
6. Add analytics dashboard for generation metrics

---

## Files Created/Modified

**New Files:**
- `app/api/chat/stream/route.ts` - SSE streaming endpoint (320 lines)
- `hooks/useThinkingStream.ts` - SSE event handler hook (210 lines)

**Modified Files:**
- `hooks/useChat.ts` - Updated to use streaming
- `components/chat-widget.tsx` - Added real-time stage display

**Total Lines Added:** ~737 lines

---

## Commit

```
Implement SSE streaming for real-time page generation

- Add /api/chat/stream endpoint with Server-Sent Events streaming
- Implement 5-stage real-time progress: Intent → Signals → Knowledge → Response → Page
- Create useThinkingStream hook for handling SSE event streaming
- Update useChat hook to use streaming instead of static HTTP requests
- Add real-time stage display widget in chat showing progress percentage
- Stream events: stage updates, page data, and complete response
- Pages now generate in real-time while user sees progress
```

Commit: `bfd655c`
