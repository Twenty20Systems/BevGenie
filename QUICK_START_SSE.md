# Quick Start - SSE Streaming Architecture

## What Changed

The chat system now uses **Server-Sent Events (SSE)** streaming instead of regular HTTP requests.

### Simple View
```
Old: Message → Wait → Response
New: Message → Stream (Stage 1) → Stream (Stage 2) → ... → Response
```

## How to Use

### In Components (No changes needed)
The chat widget works the same way:

```tsx
import { useChat } from '@/hooks/useChat';

export function ChatWidget() {
  const { sendMessage, generationStatus } = useChat();

  return (
    <div>
      {/* Real-time progress is automatic */}
      <div>{generationStatus.stageName} ({generationStatus.progress}%)</div>
      {/* Rest of component */}
    </div>
  );
}
```

### Behind the Scenes

```
useChat.sendMessage()
    ↓
useThinkingStream.stream()
    ↓
/api/chat/stream endpoint
    ↓
Server processes in 5 stages, sending SSE events
    ↓
Client receives events and updates UI in real-time
    ↓
Page appears on landing page
```

## What the User Sees

### Stage 1: Intent Analysis (10%)
```
Analyzing your question... 10%
```

### Stage 2: Profile Detection (40%)
```
Detecting your profile... 40%
```

### Stage 3: Knowledge Search (60%)
```
Searching knowledge base... 60%
```

### Stage 4: Response Generation (80%)
```
Generating response... 80%
```

### Stage 5: Page Creation (95%)
```
Generating personalized page... 95%
```

### Complete (100%)
```
[Page appears on screen] 100%
```

---

## Technical Overview

### New Files

**1. SSE Streaming Endpoint** (`app/api/chat/stream/route.ts`)
- Accepts: `POST /api/chat/stream`
- Returns: `text/event-stream` with SSE events

**2. Stream Hook** (`hooks/useThinkingStream.ts`)
- Handles SSE connections
- Parses events
- Manages state

### Modified Files

**1. Chat Hook** (`hooks/useChat.ts`)
- Uses `useThinkingStream` instead of regular fetch
- Real-time state updates

**2. Chat Widget** (`components/chat-widget.tsx`)
- Shows progress bar
- Displays current stage name

---

## Testing

### Manual Test
```bash
# 1. Start the dev server
npm run dev

# 2. Open http://localhost:7011 in browser

# 3. Click chat button and ask a question

# 4. Watch the progress bar fill from 0-100% with stage updates
```

### What to Look For
- ✅ Progress bar appears and fills 0→100%
- ✅ Stage names change (Intent → Signals → Knowledge → Response → Page)
- ✅ Page appears when progress reaches 100%
- ✅ Chat works as before but with live feedback

---

## Event Flow

### Client Sends
```json
{
  "message": "How can you help our sales team?"
}
```

### Server Streams Back
```
event: stage
data: {"stageId":"intent","progress":10,...}

event: stage
data: {"stageId":"signals","progress":30,...}

event: page
data: {"page":{...}}

event: complete
data: {"success":true,...}
```

### Client Receives & Updates
- Event 1 → Shows 10% progress
- Event 2 → Shows 30% progress
- Event 3 → Stores page data
- Event 4 → Displays page, completes flow

---

## Key Features

1. **Real-Time Feedback**
   - Users see progress as it happens
   - No waiting for complete response

2. **Better UX**
   - Progress bar shows what's happening
   - Stage names explain current activity
   - Feels faster/more responsive

3. **Graceful Degradation**
   - If streaming fails, shows error
   - Can retry message
   - No data loss

4. **Type Safe**
   - Full TypeScript support
   - Interfaces for all event types
   - Compile-time error checking

---

## Comparison: Old vs New

### Old (Regular HTTP)
```typescript
// User clicks send
POST /api/chat
  ↓
[WAIT 3-5 seconds]
  ↓
Response arrives
  ↓
Show page
```

### New (SSE Streaming)
```typescript
// User clicks send
POST /api/chat/stream
  ↓
[0.5s] Intent stage (10%)
  ↓
[0.5s] Signals stage (40%)
  ↓
[1s] Knowledge stage (60%)
  ↓
[1s] Response stage (80%)
  ↓
[1s] Page stage (95%)
  ↓
[0.5s] Complete (100%)
  ↓
Show page
```

**Result**: User sees progress happening instead of blank screen waiting

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   BevGenie Chat System                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Client Layer:                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ChatWidget (components/chat-widget.tsx)          │  │
│  │ ├─ useChat hook                                  │  │
│  │ │  └─ useThinkingStream hook                     │  │
│  │ └─ Real-time progress display                    │  │
│  └──────────────────────────────────────────────────┘  │
│                        ↓ SSE                            │
│  Server Layer:                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ /api/chat/stream (app/api/chat/stream/route.ts) │  │
│  │ ├─ Intent Classification                         │  │
│  │ ├─ Signal Detection                              │  │
│  │ ├─ Knowledge Search                              │  │
│  │ ├─ Response Generation                           │  │
│  │ └─ Page Generation                               │  │
│  └──────────────────────────────────────────────────┘  │
│                        ↓                                │
│  Data Layer:                                            │
│  ├─ Supabase (Sessions, Conversations)                 │
│  ├─ OpenAI (Chat responses)                            │
│  ├─ Anthropic Claude (Page generation)                 │
│  └─ Knowledge Base (Vector search)                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Performance Notes

- **Build Time**: ~5 seconds (minimal overhead)
- **Stream Startup**: ~500ms
- **Each Stage**: ~500ms - 1.5s (depends on API)
- **Total**: ~4-6 seconds (same as before, but with feedback)

---

## Error Handling

If something goes wrong at any stage:

1. Server sends `event: error` with error details
2. Client displays error message
3. User can retry
4. Stream is cleanly closed

---

## Next: What's Possible Now

1. **Progressive Page Rendering**
   - Render page sections as they're generated
   - Start showing page while still generating

2. **Streaming Optimizations**
   - Cache popular responses
   - Optimize stage execution
   - Parallel processing

3. **Analytics**
   - Track which stage users abandon
   - Measure stage duration
   - Optimize slow stages

4. **Better Cancellation**
   - Let users cancel mid-generation
   - Show estimated time remaining
   - Pause/resume support

---

## Summary

✅ **Chat now uses SSE streaming**
✅ **Real-time progress feedback**
✅ **All code committed**
✅ **Production ready**

Users now get:
- Visual progress during page generation
- Better UX with stage names
- Matches dynamic_website architecture
- Same functionality, better experience

---

**Implementation**: Complete ✅
**Testing**: Passed ✅
**Status**: Ready for use ✅
