# Phase 1.1 RLS Setup - Step-by-Step Execution Guide

**Status:** Ready to Execute
**Date:** 2025-10-29
**Project:** BevGenie-Vercel
**Database:** tliopsxaceedcyzjcwak (Supabase)

---

## 🎯 What You're About to Do

Create Row-Level Security (RLS) policies that will:
- ✅ Allow BevGenie to read published KB documents
- ✅ Allow BevGenie to read active prompt templates
- ✅ Allow BevGenie to write analytics/usage tracking
- ✅ BLOCK BevGenie from deleting or modifying anything
- ✅ Give admin_role full database access (for ManagementSystem)

**Security Impact:**
```
BEFORE:
BevGenie has FULL database access
↓
If hacked = complete database compromise

AFTER:
BevGenie has LIMITED access via RLS
↓
If hacked = only published content readable, no delete capability
```

---

## 📋 Your Execution Checklist

```
STEP 1: Prepare .......................... [ ]
STEP 2: Access Supabase Dashboard ........ [ ]
STEP 3: Open SQL Editor .................. [ ]
STEP 4: Execute SQL Script ............... [ ]
STEP 5: Verify Roles Created ............. [ ]
STEP 6: Verify RLS Policies Created ...... [ ]
STEP 7: Test Policies .................... [ ]
STEP 8: Document Results ................. [ ]
STEP 9: Commit to Git .................... [ ]
STEP 10: Update Status ................... [ ]
```

---

## 🚀 STEP 1: Prepare (5 minutes)

### What You Need:
- [x] Supabase project credentials (from .env.local)
- [x] SQL script: `PHASE_1_RLS_SETUP.sql` (already created)
- [x] Supabase dashboard access
- [x] This guide

### Your Project Details:
```
SUPABASE_URL: https://tliopsxaceedcyzjcwak.supabase.co
Project ID: tliopsxaceedcyzjcwak
Database: PostgreSQL (via Supabase)
```

**Checklist:**
- [ ] Have `.env.local` visible (for reference)
- [ ] Know your Supabase password (for login)
- [ ] Have PHASE_1_RLS_SETUP.sql open in editor
- [ ] Ready to access Supabase dashboard

---

## 🌐 STEP 2: Access Supabase Dashboard (3 minutes)

### Navigate to Your Project:

1. **Open Browser:**
   ```
   Go to: https://app.supabase.com
   ```

2. **Login (if needed):**
   ```
   Email: [Your Supabase account email]
   Password: [Your password]
   ```

3. **Find Your Project:**
   ```
   Look for: "BevGenie" or "tliopsxaceedcyzjcwak"
   Click on it to open
   ```

4. **You should see:**
   ```
   Project Name: [BevGenie or similar]
   Project URL: https://tliopsxaceedcyzjcwak.supabase.co
   Left sidebar with navigation options
   ```

**Checklist:**
- [ ] Logged into Supabase
- [ ] Viewing your project dashboard
- [ ] Can see left sidebar navigation

---

## 💻 STEP 3: Open SQL Editor (2 minutes)

### In Supabase Dashboard:

1. **Click on SQL Editor (Left Sidebar):**
   ```
   Left Navigation → SQL Editor
   (or look for "Editor" → "SQL")
   ```

2. **You should see:**
   ```
   Large text area for writing SQL
   "Run" button (usually top-right)
   Query results area below
   ```

3. **Create New Query:**
   ```
   Click: "+ New Query" or similar
   (Creates blank query window)
   ```

**Checklist:**
- [ ] SQL Editor open
- [ ] Blank query window visible
- [ ] Ready to paste SQL code

---

## ✍️ STEP 4: Execute SQL Script (10-15 minutes)

### Part A: Copy and Paste the SQL (2 minutes)

1. **Open PHASE_1_RLS_SETUP.sql in your text editor**
   ```
   File: D:\ClaudeProjects\BevGenie-Vercel\PHASE_1_RLS_SETUP.sql
   ```

2. **Select ALL the SQL code:**
   ```
   Ctrl+A (select all)
   Ctrl+C (copy)
   ```

3. **In Supabase SQL Editor:**
   ```
   Click in the query text area
   Ctrl+V (paste)
   ```

4. **You should see:**
   ```
   Large block of SQL code in the editor
   Comments explaining each section
   Multiple CREATE POLICY statements
   ```

**Checklist:**
- [ ] SQL code pasted into editor
- [ ] Code is complete (not truncated)
- [ ] Can see all the CREATE POLICY statements

### Part B: Execute the SQL (3-5 minutes)

1. **Run the Query:**
   ```
   Click: "Run" button (usually top-right corner)
   or press: Ctrl+Enter
   ```

2. **Wait for execution:**
   ```
   Should take a few seconds
   Watch for progress indicator
   ```

3. **Check Results:**
   ```
   Look for: "Execution successful" or similar
   Or check: Results section below the query
   ```

**What Success Looks Like:**
```
✅ No errors
✅ Green checkmark or "Success" message
✅ Results showing execution completed
```

**What Failure Looks Like:**
```
❌ Red error message
❌ Error code (e.g., "22P02 invalid input syntax")
❌ Query shows as failed
```

**If You See Errors:**
- [ ] Copy the error message
- [ ] Check if any part of the SQL is highlighted in red
- [ ] See "Troubleshooting" section at end of this guide

**Checklist:**
- [ ] SQL executed without errors
- [ ] Saw success message
- [ ] No error messages displayed

### Part C: Handle If Roles Already Exist (Troubleshooting)

If you see error like:
```
ERROR: role "bevgenie_role" already exists
```

**This is OK!** It means:
- [ ] Roles were already created (or this script was run before)
- [ ] Continue to verification step

**To Ignore This Error:**
1. Delete the problematic line (CREATE ROLE ...)
2. Run the rest of the script

---

## ✅ STEP 5: Verify Roles Created (3 minutes)

### Run This Verification Query:

1. **In SQL Editor, Create NEW query:**
   ```
   Click: "+ New Query"
   ```

2. **Paste This SQL:**
   ```sql
   SELECT rolname, rolcreatedb, rolcanlogin
   FROM pg_roles
   WHERE rolname IN ('bevgenie_role', 'admin_role')
   ORDER BY rolname;
   ```

3. **Run the Query:**
   ```
   Click: "Run"
   ```

4. **Expected Results:**
   ```
   You should see 2 rows:

   admin_role      | false | false
   bevgenie_role   | false | false

   (Both should have false for both columns - that's correct!)
   ```

**Checklist:**
- [ ] Verification query ran successfully
- [ ] Can see both roles in results
- [ ] Both roles show: rolcreatedb=false, rolcanlogin=false

---

## 🔐 STEP 6: Verify RLS Policies Created (5 minutes)

### Run This Verification Query:

1. **In SQL Editor, Create NEW query:**
   ```
   Click: "+ New Query"
   ```

2. **Paste This SQL:**
   ```sql
   SELECT tablename, COUNT(*) as policy_count
   FROM pg_policies
   WHERE tablename IN (
     'knowledge_documents',
     'prompt_templates',
     'user_sessions',
     'conversation_messages',
     'knowledge_usage_analytics',
     'user_personas',
     'persona_signals'
   )
   GROUP BY tablename
   ORDER BY tablename;
   ```

3. **Run the Query:**
   ```
   Click: "Run"
   ```

4. **Expected Results:**
   ```
   You should see multiple rows like:

   knowledge_documents       | 3
   prompt_templates          | 2
   user_sessions             | 2
   conversation_messages     | 2
   knowledge_usage_analytics | 1
   user_personas             | 2
   persona_signals           | 1

   (Exact counts may vary, but should be > 0)
   ```

**Checklist:**
- [ ] Verification query ran successfully
- [ ] All tables have policy_count > 0
- [ ] Can see all 7 tables listed

### View All Policies:

1. **Create another query to see details:**
   ```sql
   SELECT policyname, tablename, cmd, roles[1] as role
   FROM pg_policies
   WHERE tablename IN (
     'knowledge_documents',
     'prompt_templates',
     'user_sessions',
     'conversation_messages',
     'knowledge_usage_analytics',
     'user_personas',
     'persona_signals'
   )
   ORDER BY tablename, policyname;
   ```

2. **Run it:**
   ```
   Click: "Run"
   ```

3. **You should see:**
   ```
   Many rows showing:
   - policyname: e.g., "bevgenie_read_knowledge_documents"
   - tablename: e.g., "knowledge_documents"
   - cmd: SELECT, INSERT, DELETE, UPDATE, or ALL
   - role: bevgenie_role or admin_role
   ```

**Checklist:**
- [ ] Query executed successfully
- [ ] Can see list of all policies
- [ ] Policies include both bevgenie_role and admin_role

---

## 🧪 STEP 7: Test Policies Work (10 minutes)

### Test 1: BevGenie Can Read Published Documents

1. **Create new query:**
   ```sql
   -- Switch to bevgenie_role context
   SET ROLE bevgenie_role;

   -- Try to read knowledge_documents
   SELECT id, title, is_published
   FROM knowledge_documents
   LIMIT 5;

   -- Switch back to default role
   RESET ROLE;
   ```

2. **Run it:**
   - If there are published documents, you'll see them
   - If no published docs exist, you'll see empty result (that's OK)
   - **You should NOT see an error**

**Checklist:**
- [ ] Query ran without "permission denied" error
- [ ] Either saw results or empty result set (both OK)

### Test 2: BevGenie CANNOT Read Unpublished Documents

1. **Create new query:**
   ```sql
   -- Switch to bevgenie_role
   SET ROLE bevgenie_role;

   -- Try to read ALL documents (including unpublished)
   SELECT id, title, is_published
   FROM knowledge_documents
   WHERE is_published = false
   LIMIT 5;

   -- Switch back
   RESET ROLE;
   ```

2. **Expected Result:**
   ```
   Empty result set (0 rows)

   This is correct! BevGenie role can only see published docs
   with is_published = true
   ```

**Checklist:**
- [ ] Query ran without error
- [ ] Returned empty result (correct behavior)

### Test 3: Admin Role Can Read Everything

1. **Create new query:**
   ```sql
   -- Switch to admin_role
   SET ROLE admin_role;

   -- Admin should see ALL documents
   SELECT COUNT(*) as total_docs
   FROM knowledge_documents;

   -- Switch back
   RESET ROLE;
   ```

2. **Expected Result:**
   ```
   total_docs: [some number]

   Admin can see all documents including unpublished
   ```

**Checklist:**
- [ ] Query ran successfully
- [ ] Returned row count
- [ ] No permission errors

---

## 📝 STEP 8: Document Results (5 minutes)

### Create Results Document:

1. **Create file:** `PHASE_1_RLS_RESULTS.md`

2. **Add this content:**
   ```markdown
   # Phase 1.1 RLS Setup - Results

   **Date:** 2025-10-29
   **Status:** ✅ COMPLETE

   ## Roles Created
   - [x] bevgenie_role created
   - [x] admin_role created

   ## RLS Policies Created

   ### knowledge_documents
   - [x] bevgenie_read_knowledge_documents (SELECT is_published=true)
   - [x] bevgenie_no_delete_docs (DELETE blocked)
   - [x] bevgenie_no_update_docs (UPDATE blocked)
   - [x] admin_full_access_docs (ALL allowed)

   ### prompt_templates
   - [x] bevgenie_read_prompt_templates (SELECT is_active=true)
   - [x] bevgenie_no_delete_prompts (DELETE blocked)
   - [x] bevgenie_no_update_prompts (UPDATE blocked)
   - [x] admin_full_access_prompts (ALL allowed)

   ### Analytics & Sessions
   - [x] knowledge_usage_analytics policies created
   - [x] user_sessions policies created
   - [x] conversation_messages policies created
   - [x] user_personas policies created
   - [x] persona_signals policies created

   ## Tests Passed
   - [x] BevGenie can read published documents
   - [x] BevGenie cannot read unpublished documents
   - [x] Admin can read all documents
   - [x] No permission errors

   ## Security Verification
   - [x] BevGenie role restricted to published content only
   - [x] Delete operations blocked for BevGenie
   - [x] Update operations blocked for BevGenie
   - [x] Admin role has full access

   ## Next Steps
   1. Proceed to Phase 1.2: Service Key Separation
   2. Create SUPABASE_BEVGENIE_KEY (limited)
   3. Create SUPABASE_ADMIN_KEY (full access)
   4. Update environment variables
   ```

**Checklist:**
- [ ] Created results document
- [ ] Documented all created roles and policies
- [ ] Documented test results
- [ ] Ready for next phase

---

## 🔗 STEP 9: Commit to Git (5 minutes)

### Commit Your Work:

```bash
# Navigate to BevGenie-Vercel directory
cd D:\ClaudeProjects\BevGenie-Vercel

# Add the SQL script and results
git add PHASE_1_RLS_SETUP.sql
git add PHASE_1_RLS_EXECUTION_GUIDE.md
git add PHASE_1_RLS_RESULTS.md

# Commit with message
git commit -m "Sync: Complete Phase 1.1 RLS Policies

- Created bevgenie_role and admin_role in Supabase
- Implemented RLS policies for all core tables
- BevGenie restricted to published content only
- Admin role has full access
- All policies tested and verified

See PHASE_1_RLS_RESULTS.md for details."

# Verify
git log --oneline -1
```

**Checklist:**
- [ ] Files committed to git
- [ ] Commit message is descriptive
- [ ] Latest commit shows in git log

---

## 📊 STEP 10: Update Status (3 minutes)

### Update Shared Status File:

1. **Open:** `D:\ClaudeProjects\_SHARED\SESSION_STATUS.md`

2. **Add this section:**
   ```markdown
   ## Session 1 - 2025-10-29

   **Completed:**
   ✅ Phase 1.1: RLS Policies
      - Created bevgenie_role and admin_role
      - Created RLS policies for all 7 tables
      - Tested policies work correctly
      - All tests passed

   **In Progress:**
   🔄 Phase 1.2: Service Key Separation

   **Blockers:**
   None - Ready to continue with service keys

   **For Session 2:**
   Please wait for completion of Phase 1 before connecting to database

   **Shared Changes:**
   - No type changes
   - Database schema stable
   - RLS policies now active

   **Git Status:**
   Latest commit: [your commit hash] - Complete Phase 1.1 RLS Policies
   Branch: main
   ```

3. **Save file**

**Checklist:**
- [ ] Updated SESSION_STATUS.md
- [ ] Status reflects Phase 1.1 completion
- [ ] Noted next step (Phase 1.2)
- [ ] File saved

---

## 🎉 SUCCESS CHECKLIST

**Phase 1.1 is COMPLETE when all of these are TRUE:**

```
✅ Step 1: Prepared for execution
✅ Step 2: Accessed Supabase Dashboard
✅ Step 3: Opened SQL Editor
✅ Step 4: Executed SQL Script (no errors)
✅ Step 5: Verified roles created (bevgenie_role, admin_role)
✅ Step 6: Verified RLS policies created (all 7 tables have policies)
✅ Step 7: Tested policies work correctly
✅ Step 8: Documented results
✅ Step 9: Committed to git
✅ Step 10: Updated shared status file

**RESULT:** Phase 1.1 RLS Policies COMPLETE ✅
**NEXT:** Phase 1.2 Service Key Separation
**TIMELINE:** Ready to proceed immediately
```

---

## 🚨 Troubleshooting

### Issue 1: "Role already exists"
**Error:**
```
ERROR: role "bevgenie_role" already exists
```

**Solution:**
- This is OK - role was already created
- Delete the CREATE ROLE lines
- Run the rest of the script
- Policies will still be created

**Action:**
- [ ] Remove problem lines
- [ ] Re-run script
- [ ] Continue to verification

---

### Issue 2: "Table does not exist"
**Error:**
```
ERROR: relation "knowledge_documents" does not exist
```

**Solution:**
- One of the required tables doesn't exist in your database
- Check your database schema

**Action:**
- [ ] List all tables: `\dt public.*`
- [ ] Compare with script
- [ ] Create missing tables first
- [ ] Then run RLS script

---

### Issue 3: Permission Denied
**Error:**
```
ERROR: permission denied to create policy
```

**Solution:**
- You don't have admin access to the Supabase project
- Make sure you're logged in as project owner/admin

**Action:**
- [ ] Check Supabase project settings
- [ ] Verify you have admin role
- [ ] Try again

---

### Issue 4: SQL Syntax Error
**Error:**
```
ERROR: syntax error
```

**Solution:**
- SQL code may have been corrupted when copying
- Copy fresh from PHASE_1_RLS_SETUP.sql

**Action:**
- [ ] Clear query editor
- [ ] Copy fresh SQL from file
- [ ] Run again

---

## 📞 Getting Help

If you get stuck:
1. **Check this guide** for your specific error
2. **Check Supabase docs:** https://supabase.com/docs/guides/auth/row-level-security
3. **Review PHASE_1_IMPLEMENTATION_PLAN.md** for context
4. **Check git logs** for similar operations

---

**Status:** 🟢 READY TO EXECUTE
**Next Step:** Follow Step 1 above to begin RLS setup
**Expected Duration:** ~1 hour for all 10 steps
**Result:** Secure BevGenie database access 🔒
