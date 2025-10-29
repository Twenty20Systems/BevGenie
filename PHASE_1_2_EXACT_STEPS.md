# Phase 1.2: Exact Manual Steps - Service Key Creation

**Follow these EXACT steps in order**

---

## 🔑 STEP 1: Create SUPABASE_BEVGENIE_KEY

### 1.1 Open Supabase Dashboard
```
URL: https://tliopsxaceedcyzjcwak.supabase.co
```

### 1.2 Navigate to API Settings
```
1. Click the GEAR ICON (bottom left) - "Project Settings"
2. Click the "API" tab at the top
3. Scroll down to "Project API Keys" section
```

### 1.3 Create First Service Key
```
1. Find the button "Generate New API Key" (or similar)
2. FILL IN THE FORM:
   - Name: BevGenie Service Key
   - Description: Limited access for BevGenie customer-facing app
   - Role: bevgenie_role (SELECT FROM DROPDOWN)
3. Click "Create" or "Generate" button
4. COPY the entire key that appears
```

### 1.4 Save First Key
```
You will get something like:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInN1YiI6InByb2plY3RfaWQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiaWF0IjoxNjk4ODAxMDAwLCJleHAiOjE2OTg4MDQ2MDB9.xxxxxxxxxxxxxxxxxxxxx

KEEP THIS HANDY - you'll need it in a few minutes
```

---

## 🔑 STEP 2: Create SUPABASE_ADMIN_KEY

### 2.1 In Same Supabase Page
```
You should still be in: Project Settings → API tab
```

### 2.2 Create Second Service Key
```
1. Click "Generate New API Key" AGAIN
2. FILL IN THE FORM:
   - Name: Admin Service Key
   - Description: Full access for ManagementSystem admin panel
   - Role: admin_role (SELECT FROM DROPDOWN)
3. Click "Create" or "Generate" button
4. COPY the entire key that appears
```

### 2.3 Save Second Key
```
You will get something similar to the first key

KEEP THIS HANDY - it's very important!
```

---

## 📝 STEP 3: Update .env.local

### 3.1 Open File
```
File: D:\ClaudeProjects\BevGenie-Vercel\.env.local
```

### 3.2 Find the Current Key Line
```
Look for (may be different):
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3.3 Replace or Add
```
Change to:
SUPABASE_BEVGENIE_KEY=<PASTE KEY FROM STEP 1.4 HERE>

Example:
SUPABASE_BEVGENIE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInN1YiI6InByb2plY3RfaWQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiaWF0IjoxNjk4ODAxMDAwLCJleHAiOjE2OTg4MDQ2MDB9.xxxxxxxxxxxxxxxxxxxxx
```

### 3.4 Save File
```
Ctrl+S (or File → Save)
```

---

## 🔐 STEP 4: Create Secure File for Admin Key

### 4.1 Create New File
```
Location: D:\ClaudeProjects\BevGenie-Vercel\
File Name: ADMIN_KEY_SECURE.txt
```

### 4.2 Add Content
```
SUPABASE_ADMIN_KEY (Full Access - DO NOT EXPOSE)
Created: 2025-10-29

<PASTE KEY FROM STEP 2.3 HERE>

Example:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInN1YiI6InByb2plY3RfaWQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiaWF0IjoxNjk4ODAxMDAwLCJleHAiOjE2OTg4MDQ2MDB9.xxxxxxxxxxxxxxxxxxxxx

Security Notes:
- DO NOT commit this file to git
- DO NOT share this key
- Keep secure for Session 2 handoff only
```

### 4.3 Save File
```
Ctrl+S
```

---

## 🚫 STEP 5: Update .gitignore

### 5.1 Open .gitignore
```
File: D:\ClaudeProjects\BevGenie-Vercel\.gitignore
```

### 5.2 Add Line
```
At the end of the file, add:
ADMIN_KEY_SECURE.txt
```

### 5.3 Save
```
Ctrl+S
```

---

## ✅ STEP 6: Verify Everything

### 6.1 Go Back to Supabase
```
URL: https://tliopsxaceedcyzjcwak.supabase.co
Project Settings → API
```

### 6.2 Check Both Keys Exist
```
You should see in "Service Role Keys" or similar section:
1. ✅ BevGenie Service Key (bevgenie_role)
2. ✅ Admin Service Key (admin_role)
```

---

## 🧪 STEP 7: Test BevGenie App

### 7.1 Open Terminal/Command Prompt
```
Navigate to: D:\ClaudeProjects\BevGenie-Vercel
```

### 7.2 Restart App
```
Stop current app (Ctrl+C)
Then run:
npm run dev
```

### 7.3 Check for Errors
```
Look for:
✅ Server running on localhost:3000
✅ No "permission denied" errors
✅ No "authentication" errors
```

### 7.4 Test in Browser
```
1. Open: http://localhost:3000
2. Check: Chat interface loads
3. Check: No errors in browser console (F12)
4. Check: Try to send a message (should work)
```

---

## 📋 COMPLETION CHECKLIST

Before you tell me you're done, verify:

```
Supabase Creation:
☐ Created key named "BevGenie Service Key" with bevgenie_role
☐ Created key named "Admin Service Key" with admin_role
☐ Both keys visible in Supabase dashboard

Local Files:
☐ Updated .env.local with SUPABASE_BEVGENIE_KEY (complete key, no truncation)
☐ Created ADMIN_KEY_SECURE.txt with SUPABASE_ADMIN_KEY (complete key)
☐ Updated .gitignore to include ADMIN_KEY_SECURE.txt

Testing:
☐ App starts without errors (npm run dev)
☐ http://localhost:3000 loads
☐ Chat interface visible
☐ No console errors (press F12 to check)
```

---

## 🎯 Summary

| Step | What | Time |
|------|------|------|
| 1 | Create BevGenie key in Supabase | 5 min |
| 2 | Create Admin key in Supabase | 5 min |
| 3 | Update .env.local | 2 min |
| 4 | Create ADMIN_KEY_SECURE.txt | 2 min |
| 5 | Update .gitignore | 1 min |
| 6 | Verify in Supabase | 2 min |
| 7 | Test BevGenie app | 5 min |
| **TOTAL** | | **~22 minutes** |

---

**READY? Start with STEP 1!**

When done, tell me:
- ✅ Both keys created
- ✅ .env.local updated
- ✅ Admin key stored securely
- ✅ BevGenie app runs without errors

