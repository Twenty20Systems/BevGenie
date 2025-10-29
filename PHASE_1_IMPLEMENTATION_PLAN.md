# Phase 1 Implementation Plan: Security Hardening & Preparation

## Overview

**Goal:** Prepare BevGenie for two-product architecture by implementing security controls and database access separation.

**Timeline:** 1-2 weeks

**Effort:** ~40-50 hours

**Priority:** 🔴 CRITICAL - Must complete before Product 2 exists

---

## Phase 1 Breakdown

### 1.1 Implement RLS Policies (2-3 days)

#### What is RLS?
Row-Level Security (RLS) in PostgreSQL allows you to define database policies that automatically filter data based on the user's role.

**Example:**
```sql
-- Without RLS: Anyone with database access sees all data
SELECT * FROM knowledge_documents;  -- Returns ALL documents

-- With RLS: Data is filtered by role
SELECT * FROM knowledge_documents;  -- BevGenie role sees only public docs
                                    -- Admin role sees all docs
```

#### Current Problem
```
Current Database Access:
┌─────────────────────────────────────┐
│ BevGenie (Full Database Access)     │
│ ├─ Can read ALL tables              │
│ ├─ Can write to ALL tables          │
│ ├─ Can delete data                  │
│ └─ Can modify schema                │
└─────────────────────────────────────┘
         ↓
RISK: If BevGenie is compromised, attacker has full DB access
```

#### Solution: RLS Policies
```
With RLS Policies:
┌────────────────────────────────────────────────────────────┐
│ BevGenie (Limited by RLS Policies)                         │
│ ├─ knowledge_documents → Read ONLY                         │
│ ├─ prompt_templates → Read ONLY                            │
│ ├─ knowledge_usage_analytics → Write ONLY                  │
│ ├─ user_sessions → Read/Write own sessions                 │
│ └─ All other tables → No access (blocked)                  │
└────────────────────────────────────────────────────────────┘
         ↓
BENEFIT: Even if compromised, attacker limited to read analytics tables
```

#### Implementation Steps

**Step 1: Create Roles in Supabase**

In Supabase SQL Editor, run:

```sql
-- Create bevgenie role (for customer-facing app)
CREATE ROLE bevgenie_role NOLOGIN;

-- Create admin role (for management system)
CREATE ROLE admin_role NOLOGIN;

-- Grant basic permissions
GRANT USAGE ON SCHEMA public TO bevgenie_role, admin_role;
```

**Step 2: Enable RLS on Tables**

```sql
-- Enable RLS on all content tables
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_signals ENABLE ROW LEVEL SECURITY;
```

**Step 3: Create RLS Policies for BevGenie Role**

```sql
-- Allow BevGenie to read knowledge_documents
CREATE POLICY "bevgenie_read_knowledge_documents" ON knowledge_documents
  FOR SELECT
  TO bevgenie_role
  USING (is_published = true);

-- Allow BevGenie to read prompt_templates
CREATE POLICY "bevgenie_read_prompt_templates" ON prompt_templates
  FOR SELECT
  TO bevgenie_role
  USING (is_active = true);

-- Allow BevGenie to write analytics
CREATE POLICY "bevgenie_write_analytics" ON knowledge_usage_analytics
  FOR INSERT
  TO bevgenie_role
  WITH CHECK (true);

CREATE POLICY "bevgenie_read_own_sessions" ON user_sessions
  FOR SELECT
  TO bevgenie_role
  USING (true);

CREATE POLICY "bevgenie_write_own_sessions" ON user_sessions
  FOR INSERT
  TO bevgenie_role
  WITH CHECK (true);

-- Prevent all other access
CREATE POLICY "bevgenie_no_delete" ON knowledge_documents
  FOR DELETE
  TO bevgenie_role
  USING (false);

CREATE POLICY "bevgenie_no_update" ON knowledge_documents
  FOR UPDATE
  TO bevgenie_role
  USING (false);
```

**Step 4: Create RLS Policies for Admin Role**

```sql
-- Admin gets full access to everything
CREATE POLICY "admin_full_access" ON knowledge_documents
  FOR ALL
  TO admin_role
  USING (true);

CREATE POLICY "admin_full_access_prompts" ON prompt_templates
  FOR ALL
  TO admin_role
  USING (true);

CREATE POLICY "admin_full_access_analytics" ON knowledge_usage_analytics
  FOR ALL
  TO admin_role
  USING (true);

-- ... repeat for all tables
```

#### Verification

After creating policies, test:

```bash
# Test that policies work correctly
1. Create a service key for bevgenie_role
2. Create a service key for admin_role
3. Try queries with each key
4. Verify bevgenie_role can only read published content
5. Verify admin_role can read/write everything
```

---

### 1.2 Create Separate Service Keys (1-2 days)

#### Current Problem
```
Current Setup:
1 Supabase Service Key with FULL permissions
  ├─ Used by BevGenie app
  ├─ Used by API endpoints
  └─ Used by external services
```

#### Solution: Separate Keys
```
New Setup:
SUPABASE_BEVGENIE_KEY (Limited permissions)
  └─ Used by BevGenie app only
     └─ Limited by RLS policies above

SUPABASE_ADMIN_KEY (Full permissions)
  └─ Used by Management System only (Phase 3)
     └─ Can bypass RLS (admin role)
```

#### Implementation Steps

**Step 1: Create New Service Keys in Supabase**

1. Go to Supabase Dashboard → Project Settings → API
2. Under "Service Role Key", look for "Generate key"
3. Create two new keys:
   - Name: "BevGenie Service Key" (limited)
   - Name: "Admin Service Key" (full access)

**Note:** Supabase doesn't directly restrict service keys to roles. Instead:
- BevGenie Key: Used with RLS policies (enforced via role)
- Admin Key: Used without RLS restrictions

**Step 2: Update Environment Variables**

Create `.env.local`:
```env
# BevGenie Key (Limited)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_BEVGENIE_KEY=eyJhbGc...  # New limited key

# Admin Key (Full - only used in Management System later)
# Don't add this to BevGenie .env - save for Phase 3
SUPABASE_ADMIN_KEY=eyJhbGc...     # New admin key (KEEP SEPARATE)
```

**Step 3: Create Client Abstraction**

Create `lib/supabase/clients.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

// BevGenie client - uses limited key
export const bevgenieSupabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_BEVGENIE_KEY!
);

// This will be used by BevGenie app
// RLS policies automatically apply with this key
```

**Step 4: Update API Endpoints**

Update `app/api/chat/route.ts`:

```typescript
import { bevgenieSupabaseClient } from '@/lib/supabase/clients';

// Change from: const supabase = createClient(...)
// To:
const supabase = bevgenieSupabaseClient;

// Now all queries use limited key with RLS policies
```

---

### 1.3 Refactor Database Access Layer (2-3 days)

#### Current Problem
```
Current Code:
Multiple files directly use Supabase client
  ├─ lib/ai/knowledge-search.ts → Direct queries
  ├─ lib/ai/orchestrator.ts → Direct queries
  ├─ app/api/chat/route.ts → Direct queries
  ├─ app/api/analytics/route.ts → Direct queries
  └─ ... many more files
```

#### Solution: Abstraction Layer
```
New Code:
Abstraction Layer
  ├─ lib/supabase/content-reader.ts → Read knowledge documents
  ├─ lib/supabase/analytics-writer.ts → Write analytics
  ├─ lib/supabase/session-manager.ts → Read/write sessions
  └─ All use bevgenieSupabaseClient internally

Files using abstraction
  ├─ lib/ai/knowledge-search.ts → Calls content-reader.ts
  ├─ lib/ai/orchestrator.ts → Calls analytics-writer.ts
  ├─ app/api/chat/route.ts → Uses session-manager.ts
  └─ ... all files use abstraction
```

#### Implementation Steps

**Step 1: Create Content Reader**

Create `lib/supabase/content-reader.ts`:

```typescript
import { bevgenieSupabaseClient } from './clients';

export const contentReader = {
  // Read knowledge documents
  async getKnowledgeDocuments(limit: number = 50) {
    const { data, error } = await bevgenieSupabaseClient
      .from('knowledge_documents')
      .select('*')
      .eq('is_published', true)  // RLS enforces this anyway
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Search knowledge base
  async searchKnowledgeBase(query: string, embedding: number[]) {
    const { data, error } = await bevgenieSupabaseClient
      .from('knowledge_documents')
      .select('*')
      .eq('is_published', true)
      .textSearch('content', query)  // Full-text search
      .limit(10);

    if (error) throw error;
    return data;
  },

  // Get prompt templates
  async getPromptTemplates() {
    const { data, error } = await bevgenieSupabaseClient
      .from('prompt_templates')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    return data;
  }
};
```

**Step 2: Create Analytics Writer**

Create `lib/supabase/analytics-writer.ts`:

```typescript
import { bevgenieSupabaseClient } from './clients';

export const analyticsWriter = {
  // Record analytics
  async recordAnalytics(data: {
    session_id: string;
    knowledge_doc_id: string;
    timestamp: string;
    usage_type: string;
  }) {
    const { error } = await bevgenieSupabaseClient
      .from('knowledge_usage_analytics')
      .insert([data]);

    if (error) throw error;
  },

  // Batch record analytics
  async recordBatchAnalytics(records: any[]) {
    const { error } = await bevgenieSupabaseClient
      .from('knowledge_usage_analytics')
      .insert(records);

    if (error) throw error;
  }
};
```

**Step 3: Create Session Manager**

Create `lib/supabase/session-manager.ts`:

```typescript
import { bevgenieSupabaseClient } from './clients';

export const sessionManager = {
  // Create session
  async createSession(userId: string) {
    const { data, error } = await bevgenieSupabaseClient
      .from('user_sessions')
      .insert([{
        user_id: userId,
        created_at: new Date(),
        updated_at: new Date()
      }])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Get session
  async getSession(sessionId: string) {
    const { data, error } = await bevgenieSupabaseClient
      .from('user_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) throw error;
    return data;
  }
};
```

**Step 4: Update Existing Files**

Update files to use new abstraction:

```typescript
// OLD: lib/ai/knowledge-search.ts
const { data } = await supabase
  .from('knowledge_documents')
  .select('*');

// NEW: lib/ai/knowledge-search.ts
import { contentReader } from '@/lib/supabase/content-reader';

const data = await contentReader.getKnowledgeDocuments();
```

**Files to Update:**
- [ ] `lib/ai/knowledge-search.ts` - Use `contentReader`
- [ ] `lib/ai/orchestrator.ts` - Use `analyticsWriter`
- [ ] `app/api/chat/route.ts` - Use `sessionManager`
- [ ] `app/api/analytics/route.ts` - Use `analyticsWriter`
- [ ] Any other files making Supabase queries

---

### 1.4 Update Environment Configuration (1 day)

#### Current `.env.local`
```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...
```

#### New `.env.local` (Phase 1)
```env
# Supabase URLs and Keys
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_BEVGENIE_KEY=eyJhbGc...  # New limited key

# API Keys (same as before)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...

# Admin key (commented out for Phase 1, used in Phase 3)
# SUPABASE_ADMIN_KEY=eyJhbGc...
```

#### Create `.env.example`
```env
# Supabase
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_BEVGENIE_KEY=your_bevgenie_service_key_here

# APIs
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
```

#### Documentation
Create `ENVIRONMENT_VARIABLES.md`:
```markdown
# Environment Variables Guide

## Production (BevGenie)
- SUPABASE_URL: Your Supabase project URL
- SUPABASE_BEVGENIE_KEY: Limited service key (restricted by RLS)
- OPENAI_API_KEY: OpenAI API key for GPT-4o
- ANTHROPIC_API_KEY: Anthropic API key for Claude

## Notes
- Never commit .env.local
- Each environment (dev, staging, production) needs its own key
- Admin key is NOT included here (used only in Management System)
```

---

## Testing Phase 1

### Unit Tests

Create `__tests__/rls-policies.test.ts`:

```typescript
import { bevgenieSupabaseClient, adminSupabaseClient } from '@/lib/supabase/clients';

describe('RLS Policies', () => {
  test('BevGenie can read published documents', async () => {
    const { data } = await bevgenieSupabaseClient
      .from('knowledge_documents')
      .select('*')
      .eq('is_published', true);

    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThan(0);
  });

  test('BevGenie cannot read unpublished documents', async () => {
    const { data, error } = await bevgenieSupabaseClient
      .from('knowledge_documents')
      .select('*')
      .eq('is_published', false);

    // Should return empty or error
    expect(data?.length).toBe(0);
  });

  test('BevGenie cannot delete documents', async () => {
    const { error } = await bevgenieSupabaseClient
      .from('knowledge_documents')
      .delete()
      .eq('id', 'some-id');

    expect(error).toBeDefined();
  });

  test('Admin can read all documents', async () => {
    const { data } = await adminSupabaseClient
      .from('knowledge_documents')
      .select('*');

    expect(data).toBeDefined();
    // Admin should see all documents
  });
});
```

### Manual Testing Checklist

- [ ] BevGenie app starts without errors
- [ ] API calls to `/api/chat` work correctly
- [ ] Knowledge search still returns results
- [ ] Analytics are recorded
- [ ] Session management works
- [ ] No database errors in logs

### Security Verification

- [ ] Verify BevGenie key cannot delete data
- [ ] Verify BevGenie key cannot access unpublished content
- [ ] Verify BevGenie key cannot modify schema
- [ ] Verify queries still perform well with RLS enabled
- [ ] Verify error messages don't leak sensitive info

---

## Success Criteria

✅ Phase 1 is complete when:

1. **RLS Policies** ✅
   - bevgenie_role created and policies applied
   - admin_role created and policies applied
   - Policies tested and verified

2. **Service Keys** ✅
   - SUPABASE_BEVGENIE_KEY created and working
   - SUPABASE_ADMIN_KEY created (saved securely)
   - Environment variables updated

3. **Database Access** ✅
   - Abstraction layer created (content-reader, analytics-writer, session-manager)
   - All Supabase queries use abstraction
   - No direct client usage in application code

4. **Testing** ✅
   - All tests passing
   - Manual security verification completed
   - No performance regression
   - Error handling correct

5. **Documentation** ✅
   - RLS policies documented
   - Environment variables documented
   - Database access abstraction documented

---

## Risks & Mitigations

### Risk 1: RLS Performance Impact
**Risk:** RLS policies might slow down queries
**Mitigation:** Test query performance before/after
**Monitoring:** Add query performance metrics

### Risk 2: Existing Code Breaks
**Risk:** Changing to limited key might break existing functionality
**Mitigation:** Comprehensive testing before deploying
**Rollback:** Keep old key as backup for 48 hours

### Risk 3: Admin Key Security
**Risk:** Admin key leaked if stored incorrectly
**Mitigation:** Store only in Vercel secrets, never in git
**Monitoring:** Audit key usage logs

---

## Timeline Estimate

- **Days 1-2:** RLS policy creation and testing (4-6 hours)
- **Days 3-4:** Service key separation (3-4 hours)
- **Days 5-7:** Database access refactoring (8-12 hours)
- **Day 8:** Environment configuration and testing (4-6 hours)

**Total:** 19-32 hours over 8 calendar days
**Recommended:** Spread over 2 weeks with daily testing

---

## Next: Phase 2

After Phase 1 is complete and verified, proceed to:

**Phase 2: Set Up Project Structure for Separation**
- Create @bevgenie/shared package
- Plan repo split structure
- Document product boundaries

See `ARCHITECTURE_ALIGNMENT_ANALYSIS.md` for Phase 2 details.

---

## References

- `ARCHITECTURE_ALIGNMENT_ANALYSIS.md` - Full alignment analysis
- `two_product_arch.txt` - Two-product architecture blueprint
- Supabase RLS Documentation: https://supabase.com/docs/guides/auth/row-level-security
- PostgreSQL RLS: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
