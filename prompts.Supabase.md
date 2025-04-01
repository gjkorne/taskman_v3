GIT Prompts

git status
git add .
git commit -m "comment"
git push origin main

supabase login
supabase link J3w!Ynj<6x,+,q2O
supabase db push

Supabase

Absolutely, Greg! Here's a **clean, step-by-step guide to setting up and using the Supabase CLI using only `cmd` (Command Prompt)** — no PowerShell or fancy terminal needed.

---

## ✅ Step-by-Step: Install Supabase CLI & Push Migrations (Using CMD)

---

sup### 🗂 4. **Navigate to Your Project Folder**
If your project is in `C:\Users\gjkor\taskman_v3`, run:
```cmd
cd C:\Users\gjkor\taskman_v3
```

---

### 🔑 5. **Log Into Supabase**
```cmd
supabase login
```

This will open a browser window to authenticate with your Supabase account.

---

### 🔗 6. **Link Your Local Project to Supabase**
Get your **Project Ref** from the URL:  
`https://app.supabase.com/project/**your-project-ref**/settings/general`

Then run:
```cmd
supabase link --project-ref your-project-ref
```

Example:
```cmd
supabase link --project-ref abcdefghijklmnopqrst
```

---

### 📤 7. **Push Migrations to Supabase**
Make sure your `.sql` migration files are in `supabase/migrations/`

Then push them:
```cmd
supabase db push
```

This applies all pending migrations to your **linked Supabase project**.

---

### 🧪 Bonus: Create a Migration from Local Changes
```cmd
supabase db diff --schema public --file supabase/migrations/20240401_add_tasks.sql
```

Then push:
```cmd
supabase db push
```

---

## ✅ Summary of Useful Commands (in CMD)

```cmd
cd C:\path\to\your\project
supabase login
supabase link --project-ref your-project-ref
supabase db push
supabase db diff --schema public --file supabase/migrations/filename.sql
```

---

Let me know if you want help generating the `diff` or linking your project. If you tell me your directory layout or what schema changed, I’ll help you create and push a migration directly.