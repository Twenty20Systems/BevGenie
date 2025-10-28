# Phase 0: Database & Infrastructure Setup

This guide walks through setting up the BevGenie database and vector search infrastructure on Supabase.

## Prerequisites

- Supabase account (free tier sufficient for development)
- Access to Supabase dashboard
- Node.js 18+ installed locally

## Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Fill in project details:
   - **Name**: `bevgenie-dev` (or your preference)
   - **Database Password**: Generate a strong password
   - **Region**: Select closest to your location
4. Click "Create new project"
5. Wait for project to initialize (2-3 minutes)

## Step 2: Enable pgvector Extension

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Paste and run:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```
4. Verify by running:
```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```
You should see one row returned.

## Step 3: Create Database Schema

1. In **SQL Editor**, click **New Query**
2. Copy the entire contents of `lib/supabase/migrations.sql`
3. Paste into the SQL Editor
4. Click **Run**
5. Check the output at the bottom - should see "Success" messages

### What gets created:
- ✅ `knowledge_base` table with vector embeddings
- ✅ `user_personas` table with multi-dimensional scores
- ✅ `conversation_history` table for message tracking
- ✅ `persona_signals` table for audit trail
- ✅ `generated_brochures` table for returning users
- ✅ Vector similarity search function (`match_documents`)
- ✅ Hybrid search function (`hybrid_search`)
- ✅ Row Level Security (RLS) policies

### Verify Creation

Run these queries to verify tables exist:

```sql
-- Check all tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Check indexes
SELECT indexname FROM pg_indexes
WHERE tablename IN ('knowledge_base', 'user_personas', 'conversation_history');

-- Check functions
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public';
```

## Step 4: Get Environment Variables

### From Supabase Dashboard

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API Key (anon, public)** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Go to **Settings** → **Database**
4. Under "Connection pooling", copy:
   - **Connection string** and extract the password for later

5. Get the Service Role Key:
   - Go to **Settings** → **API**
   - Under "Project API Key", click on "Service Role Key"
   - Copy → `SUPABASE_SERVICE_ROLE_KEY`

## Step 5: Set Up Environment Variables

1. In your project root, create `.env.local`:
```bash
cp .env.example .env.local
```

2. Fill in the values:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Session Management
SESSION_SECRET=$(openssl rand -base64 32)

# OpenAI
OPENAI_API_KEY=sk-...
```

### Generate Session Secret
```bash
# macOS/Linux
openssl rand -base64 32

# Windows (WSL)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Step 6: Test Connection Locally

1. Install dependencies:
```bash
npm install
```

2. Create a test file `test-db-connection.ts`:
```typescript
import { supabase, supabaseAdmin } from './lib/supabase/client';

async function testConnection() {
  console.log('Testing Supabase connection...');

  // Test public client
  const { data: kbData, error: kbError } = await supabase
    .from('knowledge_base')
    .select('COUNT(*)');

  if (kbError) {
    console.error('❌ Error connecting to knowledge_base:', kbError);
    return;
  }
  console.log('✅ knowledge_base table accessible');

  // Test admin client
  if (!supabaseAdmin) {
    console.error('❌ Admin client not configured');
    return;
  }

  const { data: upData, error: upError } = await supabaseAdmin
    .from('user_personas')
    .select('COUNT(*)');

  if (upError) {
    console.error('❌ Error connecting with admin client:', upError);
    return;
  }
  console.log('✅ user_personas table accessible with admin client');

  console.log('\n✅ All database connections working!');
}

testConnection().catch(console.error);
```

3. Run the test:
```bash
npx ts-node test-db-connection.ts
```

Expected output:
```
Testing Supabase connection...
✅ knowledge_base table accessible
✅ user_personas table accessible with admin client
✅ All database connections working!
```

## Step 7: Verify RLS Policies

1. In Supabase dashboard, go to **SQL Editor**
2. Run this query:
```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
ORDER BY tablename;
```

You should see policies for:
- `knowledge_base_read_public`
- `knowledge_base_write_service_role`
- `user_personas_select_own`
- `user_personas_insert_own`
- `user_personas_update_own`
- `conversation_history_select_own`
- `conversation_history_insert_own`
- `persona_signals_service_role`
- `generated_brochures_select_own`
- `generated_brochures_insert_own`

## Step 8: Verify Vector Indexes

1. Run this query to check vector index:
```sql
SELECT
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE indexname LIKE '%embedding%' OR indexname LIKE '%hnsw%';
```

Expected output should show:
```
idx_kb_embedding | knowledge_base | CREATE INDEX idx_kb_embedding ON public.knowledge_base USING hnsw (embedding vector_cosine_ops)
```

## Step 9: Test Vector Functions

1. First, add a test document:
```sql
INSERT INTO public.knowledge_base (
  content,
  metadata,
  persona_tags,
  pain_point_tags,
  source_type
) VALUES (
  'Test document about execution blind spot and ROI proof',
  '{"test": true}',
  ARRAY['supplier', 'sales'],
  ARRAY['pain_1'],
  'research-doc'
);
```

2. Test the search functions (once we have embeddings):
```sql
-- This will work once embeddings are populated
SELECT * FROM match_documents(
  ARRAY[0.1, 0.2, 0.3]::vector,
  0.5,
  5,
  ARRAY['supplier']
);
```

## Step 10: Set Up Data Seeding

Create `scripts/seed-knowledge-base.ts`:
```typescript
import { supabaseAdmin } from '@/lib/supabase/client';
import { createOpenAIEmbedding } from '@/lib/ai/embeddings';

const KNOWLEDGE_BASE_DOCS = [
  {
    content: 'Execution blind spot: Field teams invest heavily but can\'t prove ROI...',
    persona_tags: ['supplier', 'sales', 'marketing'],
    pain_point_tags: ['pain_1'],
    source_type: 'research-doc',
  },
  // Add more documents...
];

async function seedKnowledgeBase() {
  console.log('Seeding knowledge base...');

  for (const doc of KNOWLEDGE_BASE_DOCS) {
    // Get embedding from OpenAI
    const embedding = await createOpenAIEmbedding(doc.content);

    // Insert into database
    const { error } = await supabaseAdmin
      .from('knowledge_base')
      .insert({
        ...doc,
        embedding,
      });

    if (error) {
      console.error('Error seeding:', error);
    } else {
      console.log(`✅ Seeded: ${doc.content.substring(0, 50)}...`);
    }
  }

  console.log('✅ Knowledge base seeding complete!');
}

seedKnowledgeBase().catch(console.error);
```

## Troubleshooting

### "Connection refused"
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check that Supabase project is running in dashboard
- Verify you're not behind a restrictive firewall

### "PGRST" errors
- Usually RLS policy issues
- Check that policies are enabled in Supabase dashboard
- Use service role key for admin operations

### "pgvector not found"
- Make sure pgvector extension was created
- Run: `CREATE EXTENSION IF NOT EXISTS vector;`

### Vector search returns no results
- Ensure embeddings are populated in `knowledge_base.embedding` column
- Check that persona_tags match between query and documents
- Verify embedding dimensions match (should be 1536 for text-embedding-3-small)

## Next Steps

Once Phase 0 is complete:
1. ✅ Database schema created
2. ✅ Vector search functions working
3. ✅ RLS policies in place
4. ✅ Environment variables configured

Proceed to **Phase 1**: Session Management & Configuration

## Security Checklist

- [ ] Service role key only in `.env.local` (not committed)
- [ ] RLS policies enabled on all tables
- [ ] No public write access except for knowledge base (read-only for public)
- [ ] Session secret is cryptographically secure
- [ ] Anon key has limited permissions
- [ ] Rate limiting configured for OpenAI calls
- [ ] Database backups enabled in Supabase dashboard
