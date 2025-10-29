# Phase 1.2: Service Key Separation - Implementation Guide

**Status:** Ready to implement
**Estimated Duration:** 1-2 days
**Dependency:** Phase 1.1 Complete ✅

---

## 🎯 Objective

Create two separate Supabase service keys:
1. **SUPABASE_BEVGENIE_KEY** - Limited access (uses `bevgenie_role`)
2. **SUPABASE_ADMIN_KEY** - Full access (uses `admin_role`)

This ensures:
- BevGenie app only has restricted database access
- ManagementSystem can connect with full admin access
- If BevGenie is compromised, damage is limited
- Admin operations are properly segregated

---

## 📋 Step-by-Step Guide

### Step 1: Access Supabase Project Settings

1. Open Supabase Dashboard: https://tliopsxaceedcyzjcwak.supabase.co
2. Click on **Project Settings** (gear icon, lower left)
3. Navigate to **API** tab
4. Keep this page open - you'll use it for both keys

### Step 2: Create SUPABASE_BEVGENIE_KEY (Limited Access)

**Purpose:** BevGenie app uses this for customer-facing operations

**Instructions:**

1. In Supabase API settings, scroll to **Project API keys** section
2. Look for **Service Role Key** - this is the starting point
3. Create a new key:
   - Click **Generate New API Key**
   - Name: `BevGenie Service Key`
   - Description: `Limited access for BevGenie customer-facing app`
   - Role: Select `bevgenie_role` (from dropdown)
   - Click **Create Key**

4. Copy the generated key - this is **SUPABASE_BEVGENIE_KEY**
   ```
   eyJhbGc... (looks like this - long base64 string)
   ```

5. **Store immediately in .env.local:**
   ```
   SUPABASE_BEVGENIE_KEY=eyJhbGc...paste_your_key_here
   ```

**Security Note:** This key is safe to use in BevGenie code because it only has `bevgenie_role` permissions (no delete/update on core tables)

---

### Step 3: Create SUPABASE_ADMIN_KEY (Full Access)

**Purpose:** ManagementSystem uses this for admin operations

**Instructions:**

1. Back in Supabase API settings
2. Create another new key:
   - Click **Generate New API Key**
   - Name: `Admin Service Key`
   - Description: `Full access for ManagementSystem admin panel`
   - Role: Select `admin_role` (from dropdown)
   - Click **Create Key**

3. Copy the generated key - this is **SUPABASE_ADMIN_KEY**
   ```
   eyJhbGc... (another long base64 string)
   ```

4. **DO NOT add to .env.local** (this is too sensitive)
5. Instead, save it securely:
   - Create a file: `ADMIN_KEY_SECURE.txt` (will NOT commit to git)
   - Add to `.gitignore`: `ADMIN_KEY_SECURE.txt`
   - Paste the key there for safekeeping
   - Or use a password manager

**Security Note:** This key has full database access. Keep it VERY secure. Never expose it to client-side code.

---

### Step 4: Update BevGenie Environment

**In `.env.local`:**

```env
# Previous (delete or comment out):
# SUPABASE_SERVICE_KEY=eyJhbGc...full_access_key

# New (add):
SUPABASE_BEVGENIE_KEY=eyJhbGc...bevgenie_limited_key
```

**Verify in Supabase:**

1. Dashboard → Settings → API
2. Should see two new keys:
   - ✅ BevGenie Service Key
   - ✅ Admin Service Key

---

### Step 5: Test SUPABASE_BEVGENIE_KEY

**Test that BevGenie key works with limited access:**

```bash
# In your BevGenie project root
npm run dev
```

Then test the app:
1. Open localhost:3000
2. Try to load BevGenie chat
3. Check browser console for any auth errors
4. Chat should work normally
5. Check database queries work

**Expected Result:**
- ✅ BevGenie loads
- ✅ Chat works
- ✅ Can read knowledge base
- ✅ Can write conversations
- ✅ No "permission denied" errors

---

### Step 6: Document the Keys

**In `.env.local` (committed to git):**
```env
SUPABASE_BEVGENIE_KEY=eyJhbGc...bevgenie_key
```

**In ADMIN_KEY_SECURE.txt (NOT committed):**
```
Admin Key (full access):
eyJhbGc...admin_key
```

**In shared documentation:**
Create `PHASE_1_2_KEYS_CREATED.md` with:
- Date keys were created
- Which project they're for
- When admin key will be handed to Session 2
- Verification that both work

---

### Step 7: Prepare for Session 2

**Once admin key is created:**

1. Update `_SHARED/SESSION_STATUS.md`:
   ```
   SUPABASE_ADMIN_KEY: Created on [date]
   Location: ADMIN_KEY_SECURE.txt (BevGenie-Vercel)
   Status: Ready to hand to ManagementSystem
   ```

2. Create `ADMIN_KEY_HANDOFF.md`:
   - Instructions for Session 2 how to use the key
   - Where to find it
   - How to set up in ManagementSystem
   - Security warnings

3. Note: Do NOT commit ADMIN_KEY_SECURE.txt to git
4. Add to `.gitignore`:
   ```
   ADMIN_KEY_SECURE.txt
   admin_key.txt
   *.key
   secrets/
   ```

---

## ✅ Success Criteria for Phase 1.2

- ✅ SUPABASE_BEVGENIE_KEY created in Supabase
- ✅ SUPABASE_ADMIN_KEY created in Supabase
- ✅ BevGenie key added to `.env.local`
- ✅ Admin key stored securely (not in git)
- ✅ BevGenie app loads and works with new key
- ✅ Database queries work normally
- ✅ Documentation complete
- ✅ SESSION_STATUS.md updated
- ✅ Committed to git

---

## 🔒 Security Checklist

Before moving to Phase 1.3:

- [ ] Verified old full-access key is NO LONGER used
- [ ] BevGenie key is in `.env.local`
- [ ] Admin key is in secure file (not committed)
- [ ] `.gitignore` includes admin key file
- [ ] Both keys work when tested
- [ ] No errors in browser console
- [ ] Documentation updated
- [ ] Status file updated
- [ ] Changes committed to git

---

## 🚨 Troubleshooting

### Issue: "No bevgenie_role option in dropdown"

**Solution:**
- Roles must exist in database (they do - Phase 1.1 created them)
- Refresh Supabase dashboard
- Try creating key again

### Issue: "Key doesn't work in .env.local"

**Solution:**
1. Make sure you copied the full key (no missing characters)
2. No extra spaces or newlines
3. Restart BevGenie app: `npm run dev`
4. Check browser console for errors

### Issue: "Database queries fail with new key"

**Solution:**
1. Verify key is correct in `.env.local`
2. Check that `bevgenie_role` has correct permissions
3. Verify RLS policies are working
4. Run verification query in Supabase SQL editor:
   ```sql
   SET ROLE bevgenie_role;
   SELECT COUNT(*) FROM knowledge_base;
   RESET ROLE;
   ```

---

## 📊 What's Next

After Phase 1.2 complete:

1. **Immediate:**
   - Notify Session 2 admin key is ready
   - Prepare admin key handoff instructions
   - Update SESSION_STATUS.md

2. **Next Session:**
   - Start Phase 1.3: Database Access Refactoring
   - Create abstraction layer for database access
   - Refactor all queries to use limited key

3. **Session 2 Can Now Start:**
   - Phase 3.1: ManagementSystem project setup
   - Can use admin key once provided

---

## 📝 Files to Create/Update

**Create:**
- ✅ ADMIN_KEY_SECURE.txt (NOT committed)
- ✅ PHASE_1_2_KEYS_CREATED.md (document completion)
- ✅ ADMIN_KEY_HANDOFF.md (instructions for Session 2)

**Update:**
- ✅ .env.local (add SUPABASE_BEVGENIE_KEY)
- ✅ .gitignore (add ADMIN_KEY_SECURE.txt)
- ✅ _SHARED/SESSION_STATUS.md (Phase 1.2 complete)
- ✅ PHASE_1_2_COMPLETION_REPORT.md (document process)

**Commit:**
- All changes except ADMIN_KEY_SECURE.txt

---

## ⏱️ Estimated Timeline

- **Step 1-3:** 10 minutes (create keys in Supabase)
- **Step 4-5:** 10 minutes (update .env, test app)
- **Step 6-7:** 10 minutes (document, prepare for Session 2)
- **Total:** ~30 minutes
- **Plus buffer:** 30-60 minutes for troubleshooting

**Total Duration:** 1-2 hours (well within 1-2 day estimate)

---

## 🎯 Quick Reference

**BevGenie Key:**
- Where: `.env.local`
- Type: Limited (bevgenie_role)
- Can do: READ KB, WRITE conversations/analytics
- Cannot do: DELETE, UPDATE core tables
- Safe for: Client-side code, public key

**Admin Key:**
- Where: ADMIN_KEY_SECURE.txt (secure storage)
- Type: Full access (admin_role)
- Can do: Everything
- Cannot do: Nothing (has all permissions)
- Keep: VERY SECRET, never in public code

---

**Ready to implement?** Follow the steps above!

When complete, mark Phase 1.2 as done and move to Phase 1.3.

Good luck! 🚀

