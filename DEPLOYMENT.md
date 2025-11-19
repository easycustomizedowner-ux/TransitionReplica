# EasyCustomized - Deployment Guide

## 🚀 Quick Deploy to Vercel

### Prerequisites
1. A Supabase account and project
2. A GitHub account
3. A Vercel account

---

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned
3. Go to **Settings → API** and copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)
   - **Service Role Key** (for Edge Functions)

---

## Step 2: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the entire contents of `supabase/schema.sql`
3. Paste and run it in the SQL Editor
4. Verify tables are created: `profiles`, `ads`, `quotes`, `chat_threads`, `chat_messages`, `vendor_inventory`

---

## Step 3: Create Storage Buckets

In Supabase dashboard, go to **Storage** and create these buckets:

### Public Buckets (anyone can read):
- `ad-images`
- `inventory-images`
- `avatars`

### Private Buckets (authenticated users only):
- `chat-attachments`

**For each bucket:**
1. Click "New Bucket"
2. Set the name
3. Set "Public bucket" checkbox accordingly
4. Click "Create bucket"
5. Go to bucket → Policies → Add policy for uploads (authenticated users can INSERT)

---

## Step 4: Deploy Edge Functions

Install Supabase CLI if you haven't:
```bash
npm install -g supabase
```

Login to Supabase:
```bash
supabase login
```

Link your project:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Deploy functions:
```bash
supabase functions deploy accept_quote
supabase functions deploy moderate_ad
```

Set secrets for Edge Functions:
```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Step 5: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository: `easycustomizedowner-ux/TransitionReplica`
4. Configure environment variables:
   - `VITE_SUPABASE_URL` = Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = Your Supabase Anon Key
5. Click "Deploy"

### Option B: Deploy via Vercel CLI
```bash
npm install -g vercel
vercel login
vercel
```

Follow the prompts and add environment variables when asked.

---

## Step 6: Post-Deployment Setup

### Create Admin User
1. Sign up as a regular user in your deployed app
2. Go to Supabase dashboard → **Authentication → Users**
3. Find your user and copy the UUID
4. Go to **SQL Editor** and run:
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'YOUR_USER_UUID';
```

### Test the Application
1. ✅ Sign up as Customer
2. ✅ Sign up as Vendor
3. ✅ Post a requirement (Customer)
4. ✅ Submit a quote (Vendor)
5. ✅ Accept quote and test chat (Customer)
6. ✅ Upload images to inventory (Vendor)

---

## Environment Variables Reference

### Required for Vercel:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Required for Edge Functions (set via Supabase CLI):
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Troubleshooting

### "Missing Supabase environment variables"
- Ensure you've added `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel dashboard
- Redeploy after adding variables

### Images not uploading
- Check Storage buckets are created
- Verify bucket policies allow authenticated users to INSERT
- Check browser console for specific errors

### Chat not working
- Ensure `chat_threads` and `chat_messages` tables exist
- Check RLS policies are applied from `schema.sql`
- Verify Realtime is enabled in Supabase (Settings → API → Realtime)

### Edge Functions failing
- Ensure functions are deployed: `supabase functions list`
- Check function logs: `supabase functions logs accept_quote`
- Verify `SUPABASE_SERVICE_ROLE_KEY` secret is set

---

## Support

For issues, check:
- Supabase logs (Dashboard → Logs)
- Vercel deployment logs
- Browser console errors
- Network tab for failed requests
