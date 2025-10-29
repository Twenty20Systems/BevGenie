# Multi-Session Coordination Guide

## Overview

You're working on TWO separate Claude Code sessions:
- **Session 1 (Current):** BevGenie-Vercel (Customer Product)
- **Session 2 (Separate):** ManagementSystem (Admin Product)

This document explains how to keep both sessions synchronized and share progress.

---

## Setup

### Directory Structure

```
D:/ClaudeProjects/
├─ BevGenie-Vercel/          ← Session 1 (Current)
│  ├─ app/
│  ├─ components/
│  ├─ lib/
│  ├─ .git/
│  └─ (BevGenie product code)
│
└─ ManagementSystem/          ← Session 2 (Separate)
   ├─ app/
   ├─ components/
   ├─ lib/
   ├─ .git/
   └─ (Management product code)
```

### Important: Separate Git Repositories

Each project needs its own git repository:

```bash
# Session 1 (BevGenie)
D:\ClaudeProjects\BevGenie-Vercel\.git

# Session 2 (ManagementSystem)
D:\ClaudeProjects\ManagementSystem\.git
```

---

## Synchronization Strategy

### 1. Shared Coordination Files

Create these files in a **shared location** that both sessions can reference:

**Option A: Shared Folder (Recommended)**
```
D:/ClaudeProjects/
├─ _SHARED/                    ← Shared coordination folder
│  ├─ MULTI_SESSION_TODO.md
│  ├─ SHARED_TYPES.ts
│  ├─ SESSION_STATUS.md
│  ├─ SYNC_CHECKLIST.md
│  └─ INTEGRATION_POINTS.md
│
├─ BevGenie-Vercel/
└─ ManagementSystem/
```

**Option B: Git Submodule (Advanced)**
```
BevGenie-Vercel/ contains reference to ManagementSystem/
```

### Recommendation: Use Option A (Shared Folder)

It's simpler and both sessions can easily reference shared files.

---

## Coordination Files to Create

### File 1: MULTI_SESSION_TODO.md

**Location:** `D:/ClaudeProjects/_SHARED/MULTI_SESSION_TODO.md`

**Purpose:** Master task list for both products

**Content:**
```markdown
# Multi-Session Master TODO

## Phase 1: Security Hardening (BevGenie)
- [ ] Implement RLS policies (Session 1)
- [ ] Create service keys (Session 1)
- [ ] Refactor database layer (Session 1)
- [ ] Testing & verification (Session 1)

## Phase 2: Shared Infrastructure
- [ ] Create @bevgenie/shared package (Session 1)
- [ ] Define shared types (Session 2 reads)
- [ ] Setup npm linking (Both sessions)

## Phase 3: Management System (ManagementSystem)
- [ ] Project setup (Session 2)
- [ ] Admin authentication (Session 2)
- [ ] KB management UI (Session 2)
- [ ] Prompt management UI (Session 2)
- [ ] Analytics dashboard (Session 2)

## Phase 4: Integration (Both)
- [ ] Connect to shared database (Session 2)
- [ ] Test RLS policies (Both)
- [ ] E2E testing (Both)
```

---

### File 2: SYNC_CHECKLIST.md

**Location:** `D:/ClaudeProjects/_SHARED/SYNC_CHECKLIST.md`

**Purpose:** Daily/weekly sync checklist

**Content:**
```markdown
# Synchronization Checklist

## Before Starting Each Session

### Session 1 (BevGenie-Vercel)
- [ ] Read SESSION_STATUS.md
- [ ] Check SHARED_TYPES.ts for any changes
- [ ] Review blockers from Session 2
- [ ] Update MULTI_SESSION_TODO.md

### Session 2 (ManagementSystem)
- [ ] Read SESSION_STATUS.md
- [ ] Check SHARED_TYPES.ts for any changes
- [ ] Review blockers from Session 1
- [ ] Update MULTI_SESSION_TODO.md

## After Each Session (Update This)

```Session 1 - [Date]```
- Completed: [list items]
- Blockers: [any issues]
- Next: [what Session 2 should do]
- Shared Changes: [types/interfaces changed]

```Session 2 - [Date]```
- Completed: [list items]
- Blockers: [any issues]
- Next: [what Session 1 should do]
- Shared Changes: [types/interfaces changed]

## Weekly Integration Check

- [ ] Both projects building without errors
- [ ] Shared types up to date
- [ ] Database schema aligned
- [ ] Environment variables documented
- [ ] Git commits reflect progress

## Blocker Resolution

When blocked:
1. Document in SYNC_CHECKLIST.md
2. Mark task as "BLOCKED" in MULTI_SESSION_TODO.md
3. Note what Session 1 or 2 needs to provide
4. Include deadline/priority
```

---

### File 3: SESSION_STATUS.md

**Location:** `D:/ClaudeProjects/_SHARED/SESSION_STATUS.md`

**Purpose:** Current status of both sessions

**Content:**
```markdown
# Session Status

Last Updated: [Date] [Time]

## Session 1: BevGenie-Vercel

**Current Task:** [What are you working on]
**Status:** 🟢 On Track / 🟡 Delayed / 🔴 Blocked

**Progress:**
- Completed this session: [list]
- In progress: [current work]
- Next scheduled: [what's next]

**Blockers:**
- [None / List blockers here]

**Shared Changes:**
- Changed types: [list]
- New database migrations: [list]
- New environment variables: [list]

**Git Status:**
```
Latest commit: [hash] - Description
Branch: main
Untracked changes: [if any]
```

**For Session 2:**
- Please build: [features Session 1 needs]
- Need completed: [dependencies]
- Provide feedback on: [review items]

---

## Session 2: ManagementSystem

**Current Task:** [What are you working on]
**Status:** 🟢 On Track / 🟡 Delayed / 🔴 Blocked

**Progress:**
- Completed this session: [list]
- In progress: [current work]
- Next scheduled: [what's next]

**Blockers:**
- [None / List blockers here]

**Shared Changes:**
- Changed types: [list]
- New features needed from BevGenie: [list]
- New environment variables: [list]

**Git Status:**
```
Latest commit: [hash] - Description
Branch: main
Untracked changes: [if any]
```

**For Session 1:**
- Please build: [features Session 2 needs]
- Need completed: [dependencies]
- Provide feedback on: [review items]

---

## Integration Points

### Ready Now ✅
- [Features available from BevGenie]

### In Progress 🔄
- [Features being built]

### Not Started ❌
- [Features not yet started]

### Blocked 🛑
- [Blocked features and reasons]
```

---

### File 4: SHARED_TYPES.ts

**Location:** `D:/ClaudeProjects/_SHARED/SHARED_TYPES.ts`

**Purpose:** Shared TypeScript types for both products

**Content:**
```typescript
// ============================================================================
// SHARED TYPES - Used by both BevGenie and ManagementSystem
// ============================================================================

// Import this file in both projects using a shared path or npm package

// ============================================================================
// BevGenie Product Types
// ============================================================================

export interface BevGeniePage {
  type: 'solution_brief' | 'feature_showcase' | 'analytics_dashboard' |
        'case_study' | 'metrics_tracker' | 'comparison_guide';
  title: string;
  description?: string;
  sections: PageSection[];
  metadata?: Record<string, any>;
}

export interface PageSection {
  id: string;
  type: 'text' | 'metric' | 'image' | 'table' | 'callout';
  content: string;
  styling?: Record<string, any>;
}

export interface PersonaScores {
  sales_focus: number;          // 0-100
  marketing_focus: number;      // 0-100
  pain_points: string[];
  company_type: string;
  seniority_level: string;
  [key: string]: any;
}

export interface PersonaSignal {
  id: string;
  session_id: string;
  signal_type: string;
  signal_value: string;
  confidence: number;           // 0-1
  detected_at: string;          // ISO timestamp
}

// ============================================================================
// Management System Types
// ============================================================================

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  is_published: boolean;
  is_approved: boolean;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template_text: string;
  version: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Shared Session Types
// ============================================================================

export interface UserSession {
  id: string;
  user_id: string;
  persona: PersonaScores;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
}

export interface ConversationMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  generated_page?: BevGeniePage;
  created_at: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ChatResponse {
  message: string;
  persona: PersonaScores;
  signals: string[];
  generated_page?: BevGeniePage;
}

export interface AnalyticsRecord {
  session_id: string;
  knowledge_doc_id: string;
  usage_type: 'view' | 'search' | 'click';
  timestamp: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Database Migration Types
// ============================================================================

export interface MigrationRecord {
  id: string;
  name: string;
  executed_at: string;
  execution_time_ms: number;
  status: 'success' | 'failed';
  error_message?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export interface ApiError {
  code: string;
  message: string;
  status: number;
  details?: Record<string, any>;
}

// ============================================================================
// Version Information
// ============================================================================

export const SHARED_TYPES_VERSION = '1.0.0';
export const LAST_UPDATED = '2025-10-29';

// Keep this updated when types change!
export const CHANGELOG = `
v1.0.0 - Initial shared types for two-product architecture
- BevGenie types (BevGeniePage, Persona, Signals)
- Management System types (KnowledgeDocument, PromptTemplate, AdminUser)
- Shared session types
- API response types
`;
```

---

### File 5: INTEGRATION_POINTS.md

**Location:** `D:/ClaudeProjects/_SHARED/INTEGRATION_POINTS.md`

**Purpose:** Document where products integrate

**Content:**
```markdown
# Integration Points

## Database Integration

### Shared Supabase Instance

Both products connect to the SAME database:
```
SUPABASE_URL=https://xxxx.supabase.co
```

### Session 1 (BevGenie) Access
- Table: knowledge_documents (READ via RLS)
- Table: prompt_templates (READ via RLS)
- Table: user_sessions (READ/WRITE)
- Table: conversation_messages (WRITE)
- Table: knowledge_usage_analytics (WRITE)

### Session 2 (ManagementSystem) Access
- Table: knowledge_documents (FULL - via ADMIN key)
- Table: prompt_templates (FULL - via ADMIN key)
- Table: user_sessions (READ - via ADMIN key)
- Table: knowledge_usage_analytics (READ - via ADMIN key)
- Table: admin_users (FULL)
- Table: audit_logs (WRITE)

## API Integration

### BevGenie API Endpoints
```
POST /api/chat              - Chat endpoint
POST /api/chat/stream       - Streaming endpoint
GET  /api/sessions          - Session info
```

### Management System API Endpoints
```
GET    /api/admin/kb              - List KB documents
POST   /api/admin/kb              - Create KB document
PUT    /api/admin/kb/:id          - Update KB document
DELETE /api/admin/kb/:id          - Delete KB document

GET    /api/admin/prompts         - List prompts
POST   /api/admin/prompts         - Create prompt
PUT    /api/admin/prompts/:id     - Update prompt

GET    /api/admin/analytics       - Analytics data
GET    /api/admin/analytics/export - Export analytics

GET    /api/admin/users           - List admin users
POST   /api/admin/users           - Create admin user
```

## Authentication Integration

### BevGenie (Session-based)
- Anonymous or session-based access
- No user login required
- Supabase service key: SUPABASE_BEVGENIE_KEY

### Management System (Admin-only)
- Supabase Auth required (email/password)
- Admin role check via RLS policies
- Supabase service key: SUPABASE_ADMIN_KEY

## Shared Types Integration

### How Session 1 Uses Shared Types
```typescript
// BevGenie imports from shared package
import { BevGeniePage, PersonaScores } from '@bevgenie/shared';

// Uses for type checking
const page: BevGeniePage = generatePage();
const persona: PersonaScores = detectPersona();
```

### How Session 2 Uses Shared Types
```typescript
// Management System imports from shared package
import { KnowledgeDocument, PromptTemplate } from '@bevgenie/shared';

// Uses for type checking
const doc: KnowledgeDocument = await fetchDocument();
const prompt: PromptTemplate = await fetchPrompt();
```

## Environment Variables

### Session 1 (BevGenie)
```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_BEVGENIE_KEY=eyJ... (Limited)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...
```

### Session 2 (ManagementSystem)
```env
SUPABASE_URL=https://xxxx.supabase.co (SAME as Session 1)
SUPABASE_ADMIN_KEY=eyJ... (Full access)
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3007
```

**Important:** Both use the SAME SUPABASE_URL but DIFFERENT service keys!

## Data Flow Diagrams

### Content Management Workflow

```
ManagementSystem (Session 2)
     ↓ (Admin uploads KB doc)
Supabase Database
     ↓ (Published docs)
BevGenie (Session 1)
     ↓ (Reads for knowledge search)
Customer sees AI-generated page
```

### Analytics Workflow

```
BevGenie (Session 1)
     ↓ (Records analytics on usage)
knowledge_usage_analytics table
     ↓ (Admin reads)
ManagementSystem (Session 2)
     ↓ (Shows in analytics dashboard)
Admin sees usage insights
```

## Deployment Integration

### Session 1 - BevGenie
- Repo: BevGenie-Vercel
- Vercel Project: bevgenie-prod
- Domain: app.bevgenie.com
- Service Key: SUPABASE_BEVGENIE_KEY

### Session 2 - ManagementSystem
- Repo: ManagementSystem
- Vercel Project: bevgenie-mgmt-prod
- Domain: admin.bevgenie.com
- Service Key: SUPABASE_ADMIN_KEY

Both connect to same Supabase database but with different keys/permissions.

## Sync Points (When to Coordinate)

### Before Session 1 Work
- [ ] Check if ManagementSystem has new database migrations
- [ ] Read SHARED_TYPES.ts for any type changes
- [ ] Verify BevGenie can read new knowledge documents

### Before Session 2 Work
- [ ] Check if BevGenie has security updates
- [ ] Read updated SHARED_TYPES.ts
- [ ] Verify analytics tables are being populated

### After Each Session
- [ ] Commit shared type changes
- [ ] Update SESSION_STATUS.md
- [ ] Note any blockers
- [ ] List what other session needs

### Weekly Integration Check
- [ ] Both projects building ✓
- [ ] Shared types consistent ✓
- [ ] Database schema aligned ✓
- [ ] No conflicts in git ✓
- [ ] Deployments planned ✓
```

---

## How to Use These Files

### Step 1: Create Shared Folder

```bash
mkdir D:\ClaudeProjects\_SHARED
```

### Step 2: Copy These Files

Copy all the files above into `D:\ClaudeProjects\_SHARED\`:
- MULTI_SESSION_TODO.md
- SYNC_CHECKLIST.md
- SESSION_STATUS.md
- SHARED_TYPES.ts
- INTEGRATION_POINTS.md

### Step 3: Link in BevGenie-Vercel

In BevGenie-Vercel, create a reference file:

**`BevGenie-Vercel/SYNC_REFERENCE.md`:**
```markdown
# Sync Reference for This Session

## Shared Coordination Files

Location: `D:\ClaudeProjects\_SHARED\`

- Read before starting: SYNC_CHECKLIST.md
- Check current status: SESSION_STATUS.md
- Task list: MULTI_SESSION_TODO.md
- Shared types: SHARED_TYPES.ts
- Integration details: INTEGRATION_POINTS.md

## How to Sync

1. Read SYNC_CHECKLIST.md
2. Update SESSION_STATUS.md with your progress
3. Mark completed tasks in MULTI_SESSION_TODO.md
4. Note any blockers for other session
5. Commit in local git with reference

See MULTI_SESSION_COORDINATION.md for full guide.
```

### Step 4: Link in ManagementSystem

In ManagementSystem, create same reference file:

**`ManagementSystem/SYNC_REFERENCE.md`:**
```markdown
# Sync Reference for This Session

## Shared Coordination Files

Location: `D:\ClaudeProjects\_SHARED\`

See SYNC_REFERENCE.md in BevGenie-Vercel for same info.
```

---

## Daily Workflow

### Each Morning (Before Starting)

1. **Read SESSION_STATUS.md**
   - See what other session accomplished
   - Check for any blockers noted by them

2. **Check SYNC_CHECKLIST.md**
   - See what tasks are marked for your session
   - Review shared changes from last session

3. **Review MULTI_SESSION_TODO.md**
   - Pick your task for today
   - Mark it as "in progress"

4. **Start your work**

### Each Evening (After Finishing)

1. **Update SESSION_STATUS.md**
   - What did you complete?
   - Any blockers for other session?
   - What should they work on next?
   - Any shared type changes?

2. **Update MULTI_SESSION_TODO.md**
   - Mark completed tasks
   - Update status of current tasks

3. **Commit in git**
   - Include reference to shared files in commit message

4. **Share with other session**
   - If other session is separate Claude instance, they'll see updated files

---

## Tips for Success

### ✅ DO:
- Update SESSION_STATUS.md after each session
- Commit changes to git frequently
- Keep SHARED_TYPES.ts in sync
- Document blockers clearly
- Note what the other session needs to do

### ❌ DON'T:
- Make database changes without coordinating
- Change shared types without notifying
- Work on same file simultaneously
- Forget to update the shared checklist
- Commit breaking changes without warning

---

## Example: First Week Coordination

### Day 1 - Session 1 (BevGenie)

**Start:**
- Read all shared files
- Create first entry in SESSION_STATUS.md

**Work:**
- Implement Phase 1: RLS policies
- Update SHARED_TYPES.ts with any changes
- Update MULTI_SESSION_TODO.md: Mark Phase 1 as "in progress"

**End:**
- Update SESSION_STATUS.md with progress
- Note: "Session 2 can start when this is done"
- Commit with message: "Sync: Implementing Phase 1 RLS policies"

### Day 2 - Session 2 (ManagementSystem)

**Start:**
- Read SESSION_STATUS.md from Day 1
- See that Phase 1 is "in progress"
- Start on project setup (doesn't depend on Phase 1)

**Work:**
- Create project structure
- Setup Next.js, TypeScript
- Create admin authentication skeleton

**End:**
- Update SESSION_STATUS.md with progress
- Note: "Ready for type imports from BevGenie"
- Commit with message: "Sync: Initial ManagementSystem project structure"

### Day 3 - Session 1 (BevGenie)

**Start:**
- Read SESSION_STATUS.md from Day 2
- See ManagementSystem project is set up
- Continue Phase 1 work

**Work:**
- Finish RLS policies
- Create service key separation

**End:**
- Update SESSION_STATUS.md: "Phase 1 RLS complete"
- Notify Session 2: "Can now use SUPABASE_ADMIN_KEY"

### Day 4 - Session 2 (ManagementSystem)

**Start:**
- Read SESSION_STATUS.md: "RLS is done!"
- Use new SUPABASE_ADMIN_KEY from BevGenie setup
- Update environment variables

**Work:**
- Connect to shared Supabase database
- Test admin authentication
- Verify RLS policies are working

**End:**
- Update SESSION_STATUS.md: "Connected to Supabase!"
- Both products now linked!

---

## Troubleshooting

### Problem: Types are out of sync

**Solution:**
1. Check SHARED_TYPES.ts in _SHARED folder
2. Compare with types used in both projects
3. Update SHARED_TYPES.ts if needed
4. Both sessions re-import fresh types
5. Rebuild both projects

### Problem: Database migrations conflict

**Solution:**
1. Document migration in INTEGRATION_POINTS.md
2. Tell other session which tables changed
3. Coordinate timing of deployments
4. Test RLS policies after migrations

### Problem: API endpoint mismatch

**Solution:**
1. Update INTEGRATION_POINTS.md with actual endpoints
2. Both sessions review and agree on API contracts
3. Write API tests that both can run
4. Document in SYNC_CHECKLIST.md

### Problem: One session is blocked

**Solution:**
1. Document in SESSION_STATUS.md
2. Add to SYNC_CHECKLIST.md under "Blocker Resolution"
3. Note what other session needs to provide
4. Set deadline for unblocking
5. Check back tomorrow

---

## Summary

**To keep both sessions in sync:**

1. ✅ Create `D:/ClaudeProjects/_SHARED/` folder
2. ✅ Create coordination files in _SHARED
3. ✅ Update SESSION_STATUS.md after each session
4. ✅ Reference MULTI_SESSION_TODO.md for task list
5. ✅ Keep SHARED_TYPES.ts consistent
6. ✅ Document integrations in INTEGRATION_POINTS.md
7. ✅ Commit with references to shared files

**The result:**
- Both sessions always know what the other is doing
- No duplicate work
- Clear dependencies managed
- Smooth integration when both products connect

---

**Created:** 2025-10-29
**Status:** Ready to use
**Next Step:** Create the _SHARED folder and these files in your projects directory
