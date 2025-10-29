# Phase 1.3: Database Access Refactoring - Implementation Plan

**Status:** Ready to implement
**Duration:** 2-3 days
**Dependency:** Phase 1.2 Complete ✅

---

## 🎯 Objective

Create a centralized Data Access Layer (DAL) abstraction to:
- Standardize all database operations
- Enforce RLS policies through single entry point
- Improve testability and maintainability
- Prepare for easy future migrations
- Replace direct Supabase client usage with typed repositories

---

## 📊 Current State Analysis

### Files with Database Access: 10 Total

**Core Database Layer (4 files):**
1. `lib/supabase/client.ts` - Client initialization
2. `lib/supabase/queries.ts` - Main query operations
3. `lib/supabase/page-queries.ts` - Page generation queries
4. `lib/session/session.ts` - Session management

**Business Logic Layer (2 files):**
5. `lib/ai/knowledge-search.ts` - Knowledge base searches
6. `lib/ai/orchestrator.ts` - AI orchestration

**API Routes (2 files):**
7. `app/api/chat/route.ts` - Chat API
8. `app/api/chat/stream/route.ts` - Chat streaming API

**Test/Config (2 files):**
9. `test-supabase-connection.ts` - Connection testing
10. `lib/session/config.ts` - Configuration

---

## 🏗️ New Architecture

### Current Flow (Problematic)
```
API Routes / Components
         ↓
    (Direct imports)
         ↓
Direct Supabase Client Usage
  (queries.ts, session.ts, etc.)
         ↓
    Supabase SDK
         ↓
    Database
```

### New Flow (Abstracted)
```
API Routes / Components
         ↓
    Repository Interfaces
         ↓
    Data Access Layer (DAL)
  - DataRepository
  - PageRepository
  - KnowledgeRepository
         ↓
    Supabase Client
  (Single entry point)
         ↓
    Database
```

---

## 📋 Implementation Steps

### Step 1: Create Data Repository Base Layer

**File:** `lib/repositories/base.repository.ts`

```typescript
// Abstract base for all repositories
export abstract class BaseRepository {
  protected supabaseClient: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.supabaseClient = client;
  }

  // Common methods like error handling, logging
}
```

### Step 2: Create Typed Repositories

#### 2A: Data Repository (Personas, Conversations, Signals)
**File:** `lib/repositories/data.repository.ts`

```typescript
interface IDataRepository {
  // Persona operations
  getUserPersona(sessionId: string): Promise<UserPersona | null>;
  createUserPersona(sessionId: string, data: PersonaData): Promise<UserPersona>;
  updateUserPersona(sessionId: string, updates: Partial<UserPersona>): Promise<UserPersona>;
  deleteUserPersona(sessionId: string): Promise<void>;

  // Conversation operations
  addConversationMessage(sessionId: string, message: Message): Promise<Message>;
  getConversationHistory(sessionId: string): Promise<Message[]>;
  deleteConversationHistory(sessionId: string): Promise<void>;

  // Persona signal operations
  recordPersonaSignal(sessionId: string, signal: PersonaSignal): Promise<PersonaSignal>;
  getPersonaSignals(sessionId: string): Promise<PersonaSignal[]>;

  // Session cleanup
  deleteSessionData(sessionId: string): Promise<void>;
  getOldSessions(daysOld: number): Promise<Session[]>;
}
```

#### 2B: Knowledge Repository (Search, Knowledge Base)
**File:** `lib/repositories/knowledge.repository.ts`

```typescript
interface IKnowledgeRepository {
  // Vector search
  vectorSearchKnowledgeBase(
    embedding: number[],
    personaTags?: string[],
    limit?: number
  ): Promise<KnowledgeDocument[]>;

  // Hybrid search (text + vector)
  hybridSearchKnowledgeBase(
    query: string,
    embedding: number[],
    personaTags?: string[],
    limit?: number
  ): Promise<KnowledgeDocument[]>;

  // Text search
  textSearchKnowledgeBase(
    query: string,
    personaTags?: string[]
  ): Promise<KnowledgeDocument[]>;

  // Get documents by pain point
  getPainPointDocuments(painPoints: string[]): Promise<KnowledgeDocument[]>;

  // Add knowledge documents (admin)
  addKnowledgeDocuments(docs: KnowledgeDocument[]): Promise<void>;
}
```

#### 2C: Page Repository (Generated Pages, Brochures)
**File:** `lib/repositories/page.repository.ts`

```typescript
interface IPageRepository {
  // Page operations
  saveGeneratedPage(pageSpec: PageSpec): Promise<Page>;
  getGeneratedPage(pageId: string): Promise<Page | null>;
  getRecentPages(sessionId: string, limit?: number): Promise<Page[]>;
  getMostViewedPages(sessionId: string, limit?: number): Promise<Page[]>;

  // Analytics
  recordPageEvent(pageId: string, eventType: string): Promise<void>;
  getPageAnalytics(pageId: string): Promise<PageAnalytics>;
  getPageGenerationStats(sessionId: string, days?: number): Promise<Stats>;

  // Brochure operations
  saveBrochure(brochure: Brochure): Promise<Brochure>;
  getLatestBrochure(sessionId: string): Promise<Brochure | null>;

  // Cleanup
  cleanupExpiredPages(): Promise<void>;
  isPageValid(pageId: string): Promise<boolean>;
}
```

### Step 3: Create Repository Factory

**File:** `lib/repositories/repository-factory.ts`

```typescript
export class RepositoryFactory {
  private dataRepository: DataRepository;
  private knowledgeRepository: KnowledgeRepository;
  private pageRepository: PageRepository;

  constructor(supabaseClient: SupabaseClient) {
    this.dataRepository = new DataRepository(supabaseClient);
    this.knowledgeRepository = new KnowledgeRepository(supabaseClient);
    this.pageRepository = new PageRepository(supabaseClient);
  }

  getData(): IDataRepository {
    return this.dataRepository;
  }

  getKnowledge(): IKnowledgeRepository {
    return this.knowledgeRepository;
  }

  getPage(): IPageRepository {
    return this.pageRepository;
  }
}
```

### Step 4: Create DAL Context Provider

**File:** `lib/repositories/dal-context.ts`

```typescript
// For use in Next.js/React
export const createDAL = () => {
  const client = createSupabaseClient();
  return new RepositoryFactory(client);
};

export const dal = createDAL();
```

### Step 5: Refactor Existing Code

#### 5A: Refactor `lib/supabase/queries.ts`
- Move all functions into `DataRepository` class
- Remove direct Supabase client imports
- Implement `IDataRepository` interface

#### 5B: Refactor `lib/supabase/page-queries.ts`
- Move all functions into `PageRepository` class
- Remove direct Supabase client imports
- Implement `IPageRepository` interface

#### 5C: Refactor `lib/session/session.ts`
- Replace direct Supabase calls with repository calls
- Use `dal.getData()` instead of direct client
- Wrap repository calls for session context

#### 5D: Refactor `lib/ai/knowledge-search.ts`
- Replace direct Supabase calls with repository calls
- Use `dal.getKnowledge()` instead of direct client
- Keep existing function signatures (wrapper functions)

#### 5E: Refactor `lib/ai/orchestrator.ts`
- Update to use repository layer
- Change imports from direct queries to DAL
- Keep AI logic the same

### Step 6: Update API Routes

#### 6A: Update `app/api/chat/route.ts`
```typescript
// Before:
import { getSession, updatePersona } from '@/lib/session/session';

// After:
import { dal } from '@/lib/repositories/dal-context';

const dataRepo = dal.getData();
```

#### 6B: Update `app/api/chat/stream/route.ts`
- Same pattern as chat/route.ts

---

## 🧪 Testing Strategy

### Unit Tests
- Test each repository method independently
- Mock Supabase client responses
- Verify error handling

### Integration Tests
- Test repository interactions
- Verify RLS policy enforcement
- Test complete user flows

### Migration Tests
- Verify old code produces same results as new code
- Smoke test all database operations
- Performance testing (should be same or better)

---

## 📦 Deliverables

### New Files to Create (8 files):
1. `lib/repositories/base.repository.ts` - Base repository class
2. `lib/repositories/data.repository.ts` - Data repository implementation
3. `lib/repositories/knowledge.repository.ts` - Knowledge repository implementation
4. `lib/repositories/page.repository.ts` - Page repository implementation
5. `lib/repositories/repository-factory.ts` - Factory pattern
6. `lib/repositories/dal-context.ts` - DAL context and exports
7. `lib/repositories/index.ts` - Barrel export
8. `lib/repositories/types.ts` - TypeScript interfaces

### Files to Refactor (6 files):
1. `lib/supabase/queries.ts` - Move logic to repositories
2. `lib/supabase/page-queries.ts` - Move logic to repositories
3. `lib/session/session.ts` - Use repositories
4. `lib/ai/knowledge-search.ts` - Use repositories
5. `lib/ai/orchestrator.ts` - Use repositories
6. `app/api/chat/route.ts` - Use repositories
7. `app/api/chat/stream/route.ts` - Use repositories

---

## ✅ Success Criteria

- ✅ All database access goes through repository layer
- ✅ No direct Supabase client usage outside repositories
- ✅ All existing functionality still works
- ✅ Type safety maintained with interfaces
- ✅ Error handling consistent across all operations
- ✅ Testable with dependency injection
- ✅ No performance degradation
- ✅ Code is more maintainable and readable

---

## ⏱️ Timeline Estimate

| Task | Duration |
|------|----------|
| Step 1-2: Create base layer | 2 hours |
| Step 2: Create repositories | 4 hours |
| Step 3-4: Factory & context | 1 hour |
| Step 5: Refactor existing code | 6 hours |
| Step 6: Update API routes | 2 hours |
| Testing & bug fixes | 4 hours |
| **Total** | **~19 hours (2-3 days)** |

---

## 🎯 Phased Rollout (Optional)

If time is short, can implement in phases:

**Phase 1 (1 day):** Create base repositories + refactor queries.ts
- Immediate value: Centralized query logic
- Blocker for: Nothing (optional)

**Phase 2 (1 day):** Refactor session and knowledge layers
- Immediate value: Consistent data access
- Blocker for: Nothing (optional)

**Phase 3 (1 day):** Refactor API routes + testing
- Final polish and testing
- Blocker for: Phase 1.4 testing

---

## 🚀 Next After Phase 1.3

**Phase 1.4: Testing & Verification**
- Test all RLS policies
- Verify performance
- Security audit
- BevGenie app testing

**Then: Ready for Production**

---

## 📝 Notes

- Keep old code in place until new code is tested
- Use parallel imports during transition
- Can run both simultaneously during testing
- Delete old code once verified

---

**Ready to start Phase 1.3 refactoring?**

This is the foundation for clean, maintainable, and testable code!

