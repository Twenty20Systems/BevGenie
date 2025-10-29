# Phase 1.2 Implementation Checklist - Service Key Separation

**Status:** Ready to execute
**Duration:** ~30 minutes (including manual Supabase steps)
**Date:** 2025-10-29

---

## ✅ Quick Reference

**What you need to create:**
1. SUPABASE_BEVGENIE_KEY (limited access)
2. SUPABASE_ADMIN_KEY (full access)

**Where to create them:** https://tliopsxaceedcyzjcwak.supabase.co → Project Settings → API

---

## 📋 Step-by-Step Implementation

### Step 1: Open Supabase Dashboard (5 min)

```
1. Go to: https://tliopsxaceedcyzjcwak.supabase.co
2. Click: Project Settings (gear icon, lower left)
3. Click: API tab
4. Keep this page open for steps 2-3
```

---

### Step 2: Create SUPABASE_BEVGENIE_KEY (10 min)

**Location:** Project Settings → API → Service Role Key section

**Actions:**
```
1. Look for "Generate New API Key" button
2. Fill in:
   - Name: "BevGenie Service Key"
   - Description: "Limited access for BevGenie customer-facing app"
   - Role: Select "bevgenie_role" (from dropdown)
3. Click: "Create Key"
4. Copy the generated key (long base64 string)
```

**What you'll get:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsIn...
```

**Store it temporarily:**
- Copy to clipboard (you'll use it in Step 4)

---

### Step 3: Create SUPABASE_ADMIN_KEY (10 min)

**Location:** Project Settings → API (same page)

**Actions:**
```
1. Click: "Generate New API Key" again
2. Fill in:
   - Name: "Admin Service Key"
   - Description: "Full access for ManagementSystem admin panel"
   - Role: Select "admin_role" (from dropdown)
3. Click: "Create Key"
4. Copy the generated key (long base64 string)
```

**Store it temporarily:**
- Copy to clipboard (you'll use it in Step 4B)

---

### Step 4A: Update .env.local with BEVGENIE_KEY (5 min)

**File:** `D:\ClaudeProjects\BevGenie-Vercel\.env.local`

**Action:**
```bash
# Find this line:
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Replace with (or add new line):
SUPABASE_BEVGENIE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...paste_key_from_step_2
```

**Note:** Keep SUPABASE_SERVICE_KEY commented out (you might need it for refactoring)

---

### Step 4B: Store ADMIN_KEY Securely (5 min)

**File:** Create new file `D:\ClaudeProjects\BevGenie-Vercel\ADMIN_KEY_SECURE.txt`

**Action:**
```
1. Create new file: ADMIN_KEY_SECURE.txt
2. Add this content:
─────────────────────────────────────────────
SUPABASE_ADMIN_KEY
Full access service key for ManagementSystem
Created: 2025-10-29

Key:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...paste_key_from_step_3

Security:
- DO NOT commit this file to git
- DO NOT expose in client-side code
- Keep secure for handoff to Session 2
- Store in password manager if available
─────────────────────────────────────────────
3. Save file
```

**Update .gitignore:**
```bash
# Add this line to .gitignore:
ADMIN_KEY_SECURE.txt
```

---

### Step 5: Test SUPABASE_BEVGENIE_KEY (5 min)

**Action:**
```bash
# In BevGenie terminal:
cd D:\ClaudeProjects\BevGenie-Vercel

# Restart the app with new key:
npm run dev
```

**Verify:**
- App loads without errors ✓
- Chat interface loads ✓
- No "permission denied" errors ✓
- Database queries work ✓

---

### Step 6: Verify Keys in Supabase (5 min)

**Go back to:** https://tliopsxaceedcyzjcwak.supabase.co

**Check:**
```
Project Settings → API → Service Role Key section

You should see both new keys:
✓ BevGenie Service Key (bevgenie_role)
✓ Admin Service Key (admin_role)
```

---

## 🎯 Verification Queries

Run these in Supabase SQL Editor to verify everything works:

### Query 1: Check BevGenie key has restricted access
```sql
SET ROLE bevgenie_role;
SELECT COUNT(*) as knowledge_count FROM knowledge_base;
SELECT COUNT(*) as conversation_count FROM conversation_history;
RESET ROLE;
```

Expected: Numbers returned (queries succeed despite restrictions)

### Query 2: Check Admin key has full access
```sql
SET ROLE admin_role;
DELETE FROM knowledge_base WHERE id = 'nonexistent';
RESET ROLE;
```

Expected: Query succeeds (no error)

---

## 📝 Files to Update

**Create New:**
- ✓ ADMIN_KEY_SECURE.txt (do NOT commit)

**Modify:**
- ✓ .env.local (add SUPABASE_BEVGENIE_KEY)
- ✓ .gitignore (add ADMIN_KEY_SECURE.txt)
- ✓ PHASE_1_2_COMPLETION_REPORT.md (create after completion)

---

## ✅ Completion Checklist

Before marking Phase 1.2 complete:

```
Supabase Creation:
☐ Created SUPABASE_BEVGENIE_KEY (bevgenie_role)
☐ Created SUPABASE_ADMIN_KEY (admin_role)
☐ Verified both keys exist in Supabase

Local Setup:
☐ Updated .env.local with SUPABASE_BEVGENIE_KEY
☐ Created ADMIN_KEY_SECURE.txt with admin key
☐ Updated .gitignore to exclude ADMIN_KEY_SECURE.txt

Testing:
☐ BevGenie app loads (npm run dev)
☐ Chat interface works
☐ No permission errors in console
☐ Database queries succeed

Documentation:
☐ Noted key creation timestamps
☐ Recorded verification results
☐ Prepared admin key handoff for Session 2

Git:
☐ Added .env.local with limited key
☐ Added .gitignore update
☐ Created completion report
☐ Made commit with "Sync: Phase 1.2 complete" message
```

---

## 🚨 Important Security Notes

**DO:**
- ✅ Use SUPABASE_BEVGENIE_KEY in .env.local (safe - limited access)
- ✅ Keep SUPABASE_ADMIN_KEY in separate secure file
- ✅ Store admin key securely (password manager ideal)
- ✅ Prepare clean handoff for Session 2

**DON'T:**
- ❌ Commit ADMIN_KEY_SECURE.txt to git
- ❌ Share SUPABASE_ADMIN_KEY in chat/messages
- ❌ Use admin key in client-side code
- ❌ Expose either key in public repositories

---

## ⏱️ Time Breakdown

| Step | Task | Duration |
|------|------|----------|
| 1 | Open Supabase | 5 min |
| 2 | Create BevGenie key | 10 min |
| 3 | Create Admin key | 10 min |
| 4A | Update .env.local | 5 min |
| 4B | Store admin key | 5 min |
| 5 | Test BevGenie app | 5 min |
| 6 | Verify in Supabase | 5 min |
| **Total** | | **~45 min** |

---

## 📞 If Something Goes Wrong

**Q: "bevgenie_role not in dropdown"**
A: Refresh Supabase dashboard (Ctrl+F5) or logout/login

**Q: "App doesn't load with new key"**
A: Check .env.local spelling, restart with `npm run dev`

**Q: "Permission denied errors"**
A: Verify key copied completely, no extra spaces

---

## 🎯 What Comes After Phase 1.2

**Once complete:**
1. ✅ Both service keys created
2. ✅ BevGenie using limited key
3. ✅ Admin key stored securely
4. ✅ Ready to handoff to Session 2

**Next steps:**
- Phase 1.3: Database refactoring (can do in parallel)
- Notify Session 2: Admin key ready for pickup

---

**Ready to start? Follow the steps above manually in Supabase, then report back when complete!**

