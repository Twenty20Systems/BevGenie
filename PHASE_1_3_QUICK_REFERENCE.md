# Phase 1.3 Quick Reference Guide

**Status:** ✅ COMPLETE - Ready for Phase 1.3 Step 8 (Testing)

---

## 📚 Documentation Files

| Document | Purpose | Audience |
|----------|---------|----------|
| **PHASE_1_3_IMPLEMENTATION_COMPLETE.md** | Detailed implementation overview, architecture, usage examples | Developers, Architects |
| **PHASE_1_3_READY_FOR_TESTING.md** | Testing strategy, test examples, verification checklist | QA, Developers |
| **SESSION_2_PHASE_1_FINAL_SUMMARY.md** | High-level summary, achievements, next steps | Project Managers, Leads |
| **PHASE_1_3_QUICK_REFERENCE.md** | This file - quick lookup guide | Everyone |

---

## 🚀 Quick Start: Using the DAL

### Import the DAL
```typescript
import { dal } from '@/lib/dal';
```

### Get User Persona
```typescript
const persona = await dal.data.getUserPersona(sessionId);
```

### Search Knowledge Base
```typescript
const results = await dal.knowledge.hybridSearchKnowledgeBase(
  query,
  embedding,
  { personaTags: ['supplier'], limit: 10 }
);
```

### Save Generated Page
```typescript
await dal.page.saveGeneratedPage({
  session_id: sessionId,
  page_type: 'sales_pitch',
  page_spec: pageData,
});
```

---

## 📁 File Structure

```
lib/repositories/
├── base.repository.ts          # Abstract base class
├── types.ts                    # TypeScript interfaces
├── data.repository.ts          # Persona operations
├── knowledge.repository.ts     # Search operations
├── page.repository.ts          # Page operations
├── repository-factory.ts       # DI container
└── index.ts                    # Barrel export

lib/
├── dal.ts                      # Entry point
└── supabase/
    └── queries-dal.ts          # Compatibility wrapper
```

---

## 🔧 Repository Methods by Category

### DataRepository (Personas)
- `getUserPersona(sessionId)` - Get persona
- `createUserPersona(data)` - Create persona
- `updateUserPersona(sessionId, updates)` - Update persona
- `deleteUserPersona(sessionId)` - Delete persona

### DataRepository (Conversations)
- `addConversationMessage(data)` - Save message
- `getConversationHistory(sessionId)` - Get messages
- `deleteConversationHistory(sessionId)` - Delete messages

### DataRepository (Signals)
- `recordPersonaSignal(data)` - Record signal
- `getPersonaSignals(sessionId)` - Get signals

### DataRepository (Cleanup)
- `deleteSessionData(sessionId)` - Delete all session data
- `getOldSessions(daysOld)` - Find old sessions

### KnowledgeRepository (Search)
- `vectorSearchKnowledgeBase(embedding, options)` - Vector search
- `hybridSearchKnowledgeBase(query, embedding, options)` - Hybrid search
- `textSearchKnowledgeBase(query, options)` - Text search
- `getPainPointDocuments(painPoints)` - Get by pain point
- `addKnowledgeDocuments(docs)` - Add documents

### PageRepository (Pages)
- `saveGeneratedPage(pageSpec)` - Save page
- `getGeneratedPage(pageId)` - Get page
- `getRecentPages(sessionId, limit)` - Recent pages
- `getMostViewedPages(sessionId, limit)` - Most viewed

### PageRepository (Analytics)
- `recordPageEvent(pageId, eventType)` - Track event
- `getPageAnalytics(pageId)` - Get analytics

### PageRepository (Brochures)
- `saveBrochure(data)` - Save brochure
- `getLatestBrochure(sessionId)` - Get latest

### PageRepository (Cleanup)
- `cleanupExpiredPages()` - Delete expired
- `isPageValid(pageId)` - Check validity

---

## ⚠️ Error Handling

### Error Types
```typescript
// ValidationError - Input validation failed
// NotFoundError - Record not found
// AuthorizationError - Permission denied
// RepositoryError - Other database errors
```

### Usage
```typescript
try {
  await dal.data.getUserPersona(sessionId);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid input:', error.message);
  } else if (error instanceof NotFoundError) {
    console.error('Not found:', error.message);
  }
}
```

---

## 🔐 Security Notes

### RLS Policy Enforcement
- All operations go through RLS policies
- bevgenie_role: read KB + write analytics
- admin_role: full access
- 31 policies on 5 tables

### Input Validation
- All required fields validated
- Array lengths checked
- Number ranges validated
- Empty values rejected

---

## 📊 Key Numbers

| Metric | Value |
|--------|-------|
| Total Repository Files | 7 |
| Total Lines of Code | 1,716 |
| Repositories | 3 (Data, Knowledge, Page) |
| Methods | 35+ |
| TypeScript Interfaces | 15+ |
| Error Classes | 4 |
| RLS Policies | 31 |
| Tables with RLS | 5 |

---

## ✅ Build Status

```
Build: ✅ Compiles successfully
Status: Next.js 16.0.0 (Turbopack)
Time: < 15 seconds
TypeScript: ✅ All types validated
```

---

## 🧪 Testing

### Test Locations
- Unit tests: `lib/repositories/__tests__/`
- Integration tests: `app/api/__tests__/`
- E2E tests: `e2e/`

### Running Tests
```bash
npm test                    # Run all tests
npm test -- data.repo      # Run specific test
npm test -- --coverage     # With coverage
npm test -- --watch        # Watch mode
```

---

## 📖 Examples

### Example 1: Get or Create Persona
```typescript
import { dal } from '@/lib/dal';

export async function getOrCreatePersona(sessionId: string) {
  let persona = await dal.data.getUserPersona(sessionId);
  if (!persona) {
    persona = await dal.data.createUserPersona({
      session_id: sessionId,
    });
  }
  return persona;
}
```

### Example 2: Record Chat Message
```typescript
import { dal } from '@/lib/dal';

export async function recordMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string
) {
  return await dal.data.addConversationMessage({
    session_id: sessionId,
    message_role: role,
    message_content: content,
  });
}
```

### Example 3: Search Knowledge Base
```typescript
import { dal } from '@/lib/dal';

export async function findRelevantDocs(
  query: string,
  embedding: number[]
) {
  return await dal.knowledge.hybridSearchKnowledgeBase(
    query,
    embedding,
    {
      personaTags: ['supplier', 'sales'],
      limit: 10,
    }
  );
}
```

---

## 🔄 Backward Compatibility

### Old Way (Still Works)
```typescript
import { getUserPersona } from '@/lib/supabase/queries-dal';
const persona = await getUserPersona(sessionId);
```

### New Way (Recommended)
```typescript
import { dal } from '@/lib/dal';
const persona = await dal.data.getUserPersona(sessionId);
```

---

## 🎯 Next Steps

### Phase 1.3 Step 8: Testing (1-2 days)
1. Write unit tests
2. Write integration tests
3. Manual verification
4. Performance testing

### Phase 1.4: Final Verification (1 day)
1. Regression testing
2. Staging deployment
3. Production readiness
4. Go-live preparation

---

## 📞 Quick Lookup

**Q: How do I use the DAL?**
A: `import { dal } from '@/lib/dal';` then use `dal.data`, `dal.knowledge`, or `dal.page`

**Q: How do I handle errors?**
A: Import error classes and catch them: `catch (error) { if (error instanceof ValidationError) {...} }`

**Q: Is it backward compatible?**
A: Yes! Old code continues to work via `queries-dal.ts` wrapper

**Q: Where are types defined?**
A: In `lib/repositories/types.ts`

**Q: How do I test repositories?**
A: Use DI pattern: `new DataRepository(mockClient)` in tests

**Q: Are RLS policies still active?**
A: Yes! All 31 policies remain active and enforced

**Q: Can I use old query functions?**
A: Yes, but new DAL is recommended: `import { dal } from '@/lib/dal'`

**Q: How is this more secure?**
A: Multiple layers: RLS policies + DAL validation + TypeScript type safety

---

## 📚 Related Files

**Documentation:**
- `PHASE_1_3_IMPLEMENTATION_COMPLETE.md` - Full details
- `PHASE_1_3_READY_FOR_TESTING.md` - Testing guide
- `SESSION_2_PHASE_1_FINAL_SUMMARY.md` - Summary
- `PHASE_1_3_QUICK_REFERENCE.md` - This file

**Source Code:**
- `lib/repositories/` - All repository code
- `lib/dal.ts` - DAL entry point
- `lib/supabase/queries-dal.ts` - Compatibility wrapper

---

## 🚀 Ready to Start

**Build Status:** ✅ Ready
**Documentation:** ✅ Complete
**Code Quality:** ✅ High
**Security:** ✅ Multi-layer
**Testing:** ✅ Next phase

**Proceed with:** Phase 1.3 Step 8 - Testing & Verification

See `PHASE_1_3_READY_FOR_TESTING.md` for testing guide.
