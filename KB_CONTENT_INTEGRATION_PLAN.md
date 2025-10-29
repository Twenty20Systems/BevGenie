# Knowledge Base Content Integration - Implementation Guide

**Date:** 2025-10-29
**Status:** ⏳ IMPLEMENTATION READY
**Priority:** HIGH - Ensures personalized, KB-driven content generation

---

## 🎯 Problem Statement

Currently, the page generation produces **generic content** because:
1. KB search results are converted to strings early in the pipeline
2. Individual document objects are lost by the time page generation occurs
3. No specialized UI components exist to showcase KB content
4. Generated pages don't reference actual KB data

---

##✅ Solution Overview

### Phase 1: KB Document Components (COMPLETE ✅)
Created `components/genie/kb-content-showcase.tsx`:
- **KBContentShowcase component** - Display multiple KB documents
- **KBDocumentCard component** - Individual document with metadata
- **Relevance indicators** - Visual match percentage
- **Source type icons** - Visual categorization
- **Tag display** - Persona and pain point tags
- **Professional styling** - Matches B2B SaaS design system

### Phase 2: Update Page Generation Interface (COMPLETE ✅)
Modified `lib/ai/page-generator.ts`:
- Added `KBDocument` interface
- Extended `PageGenerationRequest` with `knowledgeDocuments`
- Now supports passing actual KB document objects

### Phase 3: KB Document Retrieval Function (COMPLETE ✅)
Enhanced `lib/ai/knowledge-search.ts`:
- Added `getKnowledgeDocuments()` function
- Returns full `SearchResult[]` with:
  - Content
  - Source type & URL
  - Persona tags
  - Pain point tags
  - Similarity score

### Phase 4: API Route Integration (TODO - NEXT STEP)
Update `app/api/chat/stream/route.ts`:

```typescript
// Around line 186 - where KB context is retrieved:

// BEFORE:
const knowledgeContext = await getContextForLLM(message, updatedPersona, 5);
const pageKnowledgeContext = knowledgeContext
  ? knowledgeContext.split('\n').filter((l: string) => l.trim())
  : [];

// AFTER:
const knowledgeContext = await getContextForLLM(message, updatedPersona, 5);
const knowledgeDocuments = await getKnowledgeDocuments(
  message,
  undefined, // Will use persona-based filtering
  undefined,
  5 // Get 5 most relevant documents
);
const pageKnowledgeContext = knowledgeContext
  ? knowledgeContext.split('\n').filter((l: string) => l.trim())
  : [];

// Then pass to page generator:
const pageGenResult = await generatePageSpec({
  userMessage: message,
  pageType: pageType as any,
  persona: updatedPersona,
  knowledgeContext: pageKnowledgeContext,
  knowledgeDocuments: knowledgeDocuments, // ADD THIS LINE
  conversationHistory: messages.slice(-3),
  personaDescription: 'User profile',
});
```

### Phase 5: Page Specs Enhancement (TODO - NEXT STEP)
Add KB content section to page specs:

```typescript
// In lib/ai/page-specs.ts, add:

export interface KBContentSection {
  type: 'kb_content';
  title?: string;
  subtitle?: string;
  documents: Array<{
    id: string;
    content: string;
    source_type?: string;
    source_url?: string;
    persona_tags?: string[];
    pain_point_tags?: string[];
    similarity_score?: number;
  }>;
}

// Add to PageSection union:
export type PageSection =
  | HeroSection
  | FeatureGridSection
  | TestimonialSection
  | ComparisonTableSection
  | CTASection
  | FAQSection
  | MetricsSection
  | StepsSection
  | KBContentSection; // ADD THIS

// Add sample template for page types:
// In PAGE_TYPE_TEMPLATES, include KB content sections
```

### Phase 6: Page Renderer Enhancement (TODO - NEXT STEP)
Update `components/dynamic-page-renderer.tsx`:

```typescript
// In SectionRenderer function, add:
case 'kb_content':
  return <KBContentSection section={section} />;

// Add rendering function:
function KBContentSection({ section }: { section: any }) {
  return (
    <KBContentShowcase
      documents={section.documents}
      title={section.title}
      subtitle={section.subtitle}
    />
  );
}

// Import:
import { KBContentShowcase } from '@/components/genie/kb-content-showcase';
```

### Phase 7: Enhanced Page Generation Prompt (TODO - NEXT STEP)
Update `buildUserPrompt()` in page-generator.ts:

```typescript
function buildUserPrompt(request: PageGenerationRequest): string {
  const contextParts: string[] = [];

  contextParts.push(`CONTEXT:`);
  contextParts.push(`User's Question/Topic: "${request.userMessage}"`);

  // ... existing code ...

  // ADD THIS SECTION:
  if (request.knowledgeDocuments && request.knowledgeDocuments.length > 0) {
    contextParts.push(`\nAVAILABLE KNOWLEDGE BASE DOCUMENTS:`);
    contextParts.push(`(Use these documents to create personalized content)`);

    request.knowledgeDocuments.forEach((doc, idx) => {
      contextParts.push(`\n[Document ${idx + 1}] (Relevance: ${Math.round((doc.similarity_score || 0) * 100)}%)`);
      contextParts.push(`Source: ${doc.source_type || 'unknown'}`);
      if (doc.source_url) contextParts.push(`URL: ${doc.source_url}`);
      contextParts.push(`Content: ${doc.content.substring(0, 500)}...`);
    });

    contextParts.push(`\nIMPORTANT:`);
    contextParts.push(`- Include a KB_CONTENT section in your page to showcase these documents`);
    contextParts.push(`- Reference the most relevant documents in other sections`);
    contextParts.push(`- Create unique content based on each document's specifics`);
  }

  // ... rest of code ...
}
```

### Phase 8: Claude Prompt Update (TODO - NEXT STEP)
Update system prompt in `buildSystemPrompt()`:

```typescript
// In SECTION COMPOSITION section, add:

KB_CONTENT Section:
- title: optional section title
- subtitle: optional subtitle
- documents: array of documents with:
  * id, content, source_type, source_url
  * persona_tags, pain_point_tags, similarity_score

// Add to schema reference:
- "kb_content": Knowledge base content showcase
  * title (optional)
  * subtitle (optional)
  * documents array with full document objects

// Add to content guidelines:
- Include KB_CONTENT section when knowledge documents are provided
- Make each page unique by using document-specific content
- Don't generate generic content - always reference KB data
- Use similarity scores to emphasize most relevant insights
```

---

## 📊 Expected Results After Implementation

### Before
```
User: "How do we improve field sales?"
Generated Page: Generic response about "improving sales"
Content: Same for all queries - doesn't use KB
```

### After
```
User: "How do we improve field sales?"
Generated Page:
  1. Hero: Specific problem from KB
  2. Features: Solutions mentioned in KB
  3. Metrics: Data from KB documents
  4. KB Content: Display 5 relevant KB documents with:
     - Relevance % for each
     - Source type icons
     - Direct content from KB
     - Links to full sources
  5. CTA: Action based on KB insights
```

---

## 🔄 Data Flow After Implementation

```
User Query
  ↓
Detect Intent & Persona
  ↓
Vector Search Knowledge Base
  ↓
├─ Get Context String (for LLM response)
└─ Get Document Objects (for page generation)
  ↓
Generate Page Spec
├─ Include KB documents in prompt
├─ Generate unique content per document
└─ Add kb_content section to page
  ↓
Render Page with:
├─ Hero/Features/Metrics (personalized from KB)
├─ KB Content Section (showcase documents)
└─ CTA (action-oriented)
```

---

## 🛠️ Implementation Steps (In Order)

1. ✅ **Create KB showcase component** - DONE
   - File: `components/genie/kb-content-showcase.tsx`

2. ✅ **Update page generation interface** - DONE
   - File: `lib/ai/page-generator.ts`

3. ✅ **Add KB document retrieval** - DONE
   - File: `lib/ai/knowledge-search.ts`

4. ⏳ **Update chat API route** (5 min)
   - File: `app/api/chat/stream/route.ts`
   - Import `getKnowledgeDocuments`
   - Pass documents to `generatePageSpec`

5. ⏳ **Add KB content section type** (10 min)
   - File: `lib/ai/page-specs.ts`
   - Add `KBContentSection` interface
   - Update `PageSection` union
   - Add to templates

6. ⏳ **Update page renderer** (5 min)
   - File: `components/dynamic-page-renderer.tsx`
   - Add KB content case
   - Import `KBContentShowcase`
   - Render section

7. ⏳ **Enhance prompts** (10 min)
   - File: `lib/ai/page-generator.ts`
   - Update `buildUserPrompt`
   - Update `buildSystemPrompt`
   - Add kb_content section schema

8. ⏳ **Test end-to-end** (10 min)
   - Visit `/genie`
   - Send query
   - Verify KB documents in response
   - Check each page is unique

**Total Time: ~40 minutes**

---

## ✅ Verification Checklist

- [ ] KB showcase component renders correctly
- [ ] Chat API retrieves KB documents
- [ ] Page spec includes kb_content section
- [ ] Each query generates unique content
- [ ] KB documents display with all metadata
- [ ] Relevance percentages are accurate
- [ ] Source links are clickable
- [ ] Responsive on mobile
- [ ] Build compiles without errors

---

## 📝 Files to Modify

1. `app/api/chat/stream/route.ts` - Import and call `getKnowledgeDocuments`
2. `lib/ai/page-specs.ts` - Add `KBContentSection` interface
3. `lib/ai/page-generator.ts` - Update prompts to use KB documents
4. `components/dynamic-page-renderer.tsx` - Add KB section rendering

## 📁 Files Already Created

1. `components/genie/kb-content-showcase.tsx` - ✅ Component ready
2. `lib/ai/knowledge-search.ts` - ✅ `getKnowledgeDocuments()` added
3. `lib/ai/page-generator.ts` - ✅ `KBDocument` interface added

---

## 🎯 Success Criteria

- ✅ Each query generates **unique, KB-driven content**
- ✅ Page includes **actual KB documents** with metadata
- ✅ **Relevance scores** displayed prominently
- ✅ **No generic content** - all personalized to KB results
- ✅ **Professional UI** showcasing documents
- ✅ **Builds successfully** without errors
- ✅ **Performance** acceptable (< 5s generation time)

---

## 💾 Next Action

Ready to proceed with Phase 4 (API Route Integration). This will complete the KB content integration and enable personalized page generation based on actual knowledge base search results.

**Impact:** Pages will now contain unique, KB-driven content instead of generic responses.
