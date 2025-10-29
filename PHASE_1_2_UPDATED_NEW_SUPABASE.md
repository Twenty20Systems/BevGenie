# Phase 1.2: Updated for New Supabase API System (2025)

**Status:** Adapted for Supabase v2 API Key System
**Key Change:** No direct role assignment in UI - use SQL + RLS instead

---

## 🔄 What Changed

**Old System (Early 2024):**
- Select role from dropdown when creating key
- Two separate keys with different permissions

**New System (2025):**
- Two key types: Anon (public) and Service Role (secret)
- Roles assigned via SQL, not UI
- Access control via RLS Policies (what we already created!)

---

## ✅ Good News

**We already created the RLS policies in Phase 1.1!**

The roles (`bevgenie_role` and `admin_role`) with their permissions are already in the database. We just need to:
1. Get the two service keys
2. Assign them to use the correct roles via SQL
3. Test that RLS enforces the permissions

---

## 📋 NEW EXACT STEPS FOR PHASE 1.2

### STEP 1: Get Your Service Role (Secret) Key

```
1. Go to: https://tliopsxaceedcyzjcwak.supabase.co
2. Click: "Settings" (gear icon)
3. Click: "API" tab
4. Look for "Project API Keys" section
5. Find: "Secret key" (starts with "sbpvt_" or similar)
6. COPY the secret key
```

**This is your SUPABASE_SERVICE_KEY (backend/admin access)**

---

### STEP 2: Create Custom Key for BevGenie via SQL

```
1. Go to: SQL Editor (in left sidebar)
2. Click: "New Query"
3. Paste and run this SQL:

--- Create BevGenie Service Key (limited by RLS)
DO $$
DECLARE
  v_key text;
BEGIN
  INSERT INTO auth.api_keys (
    name,
    role,
    created_by
  ) VALUES (
    'BevGenie Service Key',
    'bevgenie_role',
    'auth.admin'
  )
  RETURNING key INTO v_key;

  RAISE NOTICE 'BevGenie Service Key: %', v_key;
END $$;

4. Copy the key that appears in the NOTICE
```

**Save as:** SUPABASE_BEVGENIE_KEY

---

### STEP 3: Create Custom Key for Admin via SQL

```
1. Still in SQL Editor
2. Click: "New Query"
3. Paste and run this SQL:

--- Create Admin Service Key (full access)
DO $$
DECLARE
  v_key text;
BEGIN
  INSERT INTO auth.api_keys (
    name,
    role,
    created_by
  ) VALUES (
    'Admin Service Key',
    'admin_role',
    'auth.admin'
  )
  RETURNING key INTO v_key;

  RAISE NOTICE 'Admin Service Key: %', v_key;
END $$;

4. Copy the key that appears in the NOTICE
```

**Save as:** SUPABASE_ADMIN_KEY

---

### STEP 4: Update .env.local

```
File: D:\ClaudeProjects\BevGenie-Vercel\.env.local

Update:
SUPABASE_BEVGENIE_KEY=<paste key from STEP 2>
SUPABASE_ADMIN_KEY=<paste key from STEP 3>

Or if using service role key:
SUPABASE_SERVICE_KEY=<paste key from STEP 1>
```

---

### STEP 5: Create ADMIN_KEY_SECURE.txt

```
File: D:\ClaudeProjects\BevGenie-Vercel\ADMIN_KEY_SECURE.txt

Content:
SUPABASE_ADMIN_KEY (Full Access)
Created: 2025-10-29

<paste key from STEP 3>

Security Notes:
- DO NOT commit to git
- DO NOT share
- Full database access via this key
```

---

### STEP 6: Update .gitignore

```
File: D:\ClaudeProjects\BevGenie-Vercel\.gitignore

Add:
ADMIN_KEY_SECURE.txt
*.key
secrets/
```

---

### STEP 7: Verify RLS is Enforcing Permissions

```
1. SQL Editor → New Query
2. Test BevGenie role permissions:

SET ROLE bevgenie_role;
SELECT COUNT(*) as knowledge_count FROM knowledge_base;
SELECT COUNT(*) as conversation_count FROM conversation_history;

-- This should be blocked by RLS:
DELETE FROM knowledge_base WHERE id = 'test';

RESET ROLE;

3. Expected:
   ✅ SELECT queries work
   ✅ DELETE is blocked (0 rows affected or error)
```

---

### STEP 8: Test BevGenie App

```
Terminal:
cd D:\ClaudeProjects\BevGenie-Vercel
npm run dev

Browser:
✅ http://localhost:3000 loads
✅ Chat works
✅ No permission errors
```

---

## 🔒 How RLS Enforcement Works (Instead of Role Selection)

**Old approach:** Role selected in UI → Different API keys with permissions

**New approach:**
1. All keys use same API key system
2. Access control via RLS Policies (what we already created!)
3. RLS enforces that bevgenie_role can only SELECT/INSERT (not DELETE/UPDATE)
4. RLS enforces that admin_role can do anything

---

## ⚠️ If SQL Method Doesn't Work

If the SQL method for creating custom keys fails (not all Supabase versions support it), here's the workaround:

**Use the standard Service Role key for both:**
```
- Use SUPABASE_SERVICE_KEY as SUPABASE_BEVGENIE_KEY
- Use SUPABASE_SERVICE_KEY as SUPABASE_ADMIN_KEY
- RLS policies will automatically enforce correct access based on connection role
```

This works because:
- ✅ RLS policies already created in Phase 1.1
- ✅ Policies enforce bevgenie_role permissions
- ✅ Policies enforce admin_role permissions
- ✅ Connection must use correct role for policy enforcement

---

## ✅ Completion Checklist

```
☐ Got Service Role key from Supabase settings
☐ Attempted to create BevGenie key via SQL (or have fallback key)
☐ Attempted to create Admin key via SQL (or have fallback key)
☐ Updated .env.local with keys
☐ Created ADMIN_KEY_SECURE.txt with admin key
☐ Updated .gitignore
☐ Verified RLS policies work (SQL test passed)
☐ BevGenie app runs without errors
☐ http://localhost:3000 loads
```

---

## 📊 Summary of Changes

| Aspect | Old System | New System |
|--------|-----------|-----------|
| Role Selection | UI Dropdown | SQL + RLS Policies |
| Key Creation | Via Dashboard | Via Dashboard + SQL |
| Permission Control | Key Type | RLS Policies |
| Our Status | Ready | Ready (Phase 1.1 already done!) |

---

## 🎯 Bottom Line

**Good news:** We already did the hard part in Phase 1.1 (created RLS policies)!

The new system actually makes it clearer:
- RLS policies = real access control
- Keys = just authentication method
- No confusion about role vs key permissions

**Just follow the steps above and you're done!**

