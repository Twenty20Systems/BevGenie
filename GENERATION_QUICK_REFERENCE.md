# Content Generation Quick Reference

## 9-Step Generation Pipeline

```
User Query
    ↓
[1] Signal Detection      → Identifies pain points, role, company type
    ↓
[2] Persona Update        → Updates confidence scores
    ↓
[3] Knowledge Search      → Finds 5 relevant industry documents
    ↓
[4] System Prompt         → Creates personalized instructions
    ↓
[5] LLM Response          → GPT-4o generates conversational response
    ↓
[6] Save to History       → Persists to database
    ↓
[7] Generation Mode       → Determines "fresh" | "returning" | "data_connected"
    ↓
[8] Intent Classification → Determines what page type to generate
    ↓
[9] Page Generation       → Claude generates page specification
    ↓
Response to Client
    ├─ AI message
    ├─ Updated persona
    ├─ Detected signals
    ├─ Generation mode
    └─ Generated page spec
```

## What Gets Generated

### Text Response (Every Message)
- Conversational AI response using GPT-4o
- Personalized based on detected persona
- Informed by knowledge base context
- ~300 tokens max

### Page Specification (Every Message)
- JSON page object with sections
- Rendered as React components on client
- Includes hero, features, metrics, CTAs
- 5-7 different page types

## Key Data Points Tracked

### Per-User Persona Profile
```json
{
  "overall_confidence": 0.72,
  "sales_focus_score": 0.85,
  "marketing_focus_score": 0.30,
  "operational_focus_score": 0.45,
  "company_type": "craft_supplier",
  "company_size": "mid_market",
  "pain_points_detected": [
    "sales_effectiveness",
    "team_alignment",
    "territory_management"
  ],
  "conversation_count": 5,
  "session_duration": 12345
}
```

### Detected Signals (Per Message)
```
Signal Type    Category              Strength  Evidence
─────────────────────────────────────────────────────────
pain_point     sales_effectiveness   0.85      "prove ROI"
user_type      field_sales           0.75      "field team"
company_attr   multi_territory       0.65      "regions"
focus_area     metrics_tracking      0.80      "measure"
```

## Generation Modes Explained

### 🟦 Fresh Mode
- **When**: First message, no persona yet
- **Persona Confidence**: < 0.3
- **Page Type**: Basic "solution_brief"
- **Goal**: Learn about user
- **Example**: New visitor asking first question

### 🟨 Returning Mode
- **When**: Persona confidence > 0.5
- **Persona Confidence**: 0.3 - 0.7
- **Page Type**: Personalized based on persona
- **Goal**: Address detected needs
- **Example**: User with clear role/focus identified

### 🟩 Data Connected Mode
- **When**: >5 messages + 2+ pain points
- **Persona Confidence**: > 0.7
- **Page Type**: Advanced analytics/dashboards
- **Goal**: Deep analysis & recommendations
- **Example**: User with rich context, specific challenges

## API Endpoints

### POST /api/chat
**Input:**
```json
{
  "message": "How can we prove ROI from tasting events?"
}
```

**Output:**
```json
{
  "success": true,
  "message": "Great question! Based on your focus...",
  "session": {
    "sessionId": "uuid",
    "persona": { ...updated persona... },
    "messageCount": 2
  },
  "signals": ["pain_point/sales_effectiveness"],
  "generationMode": "returning",
  "knowledgeDocuments": 5,
  "generatedPage": {
    "page": {
      "type": "solution_brief",
      "title": "Territory Performance ROI Framework",
      "sections": [...]
    },
    "intent": "problem_solving",
    "intentConfidence": 0.89
  }
}
```

### GET /api/chat
**Returns:** Current session info, persona, message history

## Page Section Types

| Type | Purpose | When Used |
|------|---------|-----------|
| **hero** | Main headline & CTA | All pages |
| **feature_grid** | 3-4 benefit cards | Solution/showcase pages |
| **metrics** | KPI display (1000+, 24/7, etc) | Analytics pages |
| **comparison** | Side-by-side comparison | Evaluation pages |
| **case_study** | Success story narrative | Proof pages |
| **cta** | Call-to-action section | All pages (footer) |
| **testimonial** | Social proof | Some pages |
| **faq** | Common questions | Reference pages |

## Colors & Styling

```
Primary:     #00C8FF (Cyan - action items, highlights)
Secondary:   #0A1930 (Navy - backgrounds, headers)
Success:     #198038 (Green - confirmations, complete)
Accent:      #AA6C39 (Brown - warmth, secondary highlights)
Background:  #FFFFFF (White - main content areas)
Text:        #0A1930 (Navy - primary text)
Gray:        #666666 (Medium - secondary text)
Light Gray:  #F5F5F5 (Very light - backgrounds)
```

## Processing Times

| Stage | Duration | Notes |
|-------|----------|-------|
| Signal Detection | ~50ms | Local analysis |
| Knowledge Search | ~200ms | Includes embedding generation |
| LLM Response (GPT-4o) | ~1-2s | Network + processing |
| Page Generation (Claude) | ~2-3s | Network + Claude processing |
| **Total Generation** | **~5-7s** | All stages combined |
| Loading Animation | ~10-12s | User-facing delay (includes visual effects) |

## Database Tables Used

| Table | Purpose |
|-------|---------|
| `user_sessions` | Session tracking |
| `user_personas` | Persona profiles |
| `persona_signals` | Signal history |
| `conversation_messages` | Chat history |
| `knowledge_documents` | Vector embeddings |

## Knowledge Base Contents

- **50,000+** industry articles
- **100+** case studies
- **Territory management** guides
- **Sales methodologies** frameworks
- **ROI calculation** templates
- **Best practices** documentation
- **Competitive analysis** resources
- **Distributor relationships** strategies

## Troubleshooting

### Page Not Generating
- ✓ Check if `OPENAI_API_KEY` is set
- ✓ Check if `ANTHROPIC_API_KEY` is set
- ✓ Check Supabase connection
- ✓ Review server logs for errors

### Persona Not Updating
- ✓ Verify signals are being detected
- ✓ Check if `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- ✓ Ensure database permissions allow writes

### Knowledge Search Failing
- ✓ Verify embeddings are created
- ✓ Check pgvector extension enabled in Supabase
- ✓ Verify knowledge_documents table populated

### AI Response Generic
- ✓ Need more conversation history (2+ messages)
- ✓ Need clearer persona signals
- ✓ Check knowledge base has relevant documents

## Configuration

### Environment Variables Needed
```
OPENAI_API_KEY=sk-...           # For GPT-4o responses
ANTHROPIC_API_KEY=sk-ant-...    # For Claude page generation
SUPABASE_URL=https://...        # Database
SUPABASE_SERVICE_ROLE_KEY=...   # Database write access
```

### Optional Optimizations
```
GENERATION_MODE_OVERRIDE=fresh  # Force specific mode
MAX_KNOWLEDGE_DOCS=10           # More/less context
PAGE_GENERATION_TIMEOUT=30000   # Max wait time (ms)
EMBEDDING_MODEL=text-embedding-3-small  # Currently used
```

## Feature Flags

- **Always Generate Pages**: `true` (generates page for every query)
- **Retry on Validation Fail**: `true` (2 retries max)
- **Persona Persistence**: `true` (saves to database)
- **Knowledge Search**: `true` (includes context)
- **Streaming Support**: Planned for future (not yet enabled)

## Next Steps for Enhancement

1. **Streaming Responses**: Real-time page generation visible to user
2. **A/B Testing**: Test different page layouts/content
3. **Custom Pages**: User can request modifications to pages
4. **Export**: Save pages as PDF or shareable link
5. **Analytics**: Track which page types convert best
6. **Feedback Loop**: User ratings improve future generations

---

**Last Updated**: October 29, 2025
**System Status**: ✅ Production Ready
