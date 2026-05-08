# Setup Guide — Alvin's Journey Diet & Workout App

## Step 1 — Supabase Project

1. Go to **https://supabase.com** → New Project
2. Name it `alvin-journey`, choose a region close to you (Singapore works well)
3. Set a strong DB password and save it somewhere safe
4. Wait ~2 minutes for provisioning

### Create the Database Schema

1. In your Supabase dashboard → **SQL Editor** → **New Query**
2. Paste the entire contents of `supabase/migrations/001_initial.sql`
3. Click **Run**

### Seed Alvin's Baseline Data (optional but recommended)

In SQL Editor, run this to add your SK-X90 scan from 2026-05-02:

```sql
INSERT INTO body_scans (user_id, scan_date, weight_kg, body_fat_pct, muscle_kg, visceral_fat_grade, health_score, bmr, bmi, notes)
SELECT 
  id as user_id,
  '2026-05-02',
  104.8, 41.3, 44.4, 21, 54, 1696.3, 35.8,
  'SK-X90 InBody scan — baseline measurement'
FROM profiles
WHERE email = 'alvin.niode@gmail.com'
LIMIT 1;
```

### Enable Google OAuth

1. Supabase dashboard → **Authentication** → **Providers** → **Google**
2. Toggle **Enable**
3. Go to **https://console.cloud.google.com**
4. Create a new project (or use existing) → **APIs & Services** → **Credentials**
5. **Create Credentials** → **OAuth 2.0 Client ID** → Web application
6. Add to **Authorized redirect URIs**:
   - `https://YOUR-SUPABASE-PROJECT.supabase.co/auth/v1/callback`
7. Copy the **Client ID** and **Client Secret** back into Supabase Google provider settings
8. Save

### Get Your Supabase Keys

In Supabase → **Project Settings** → **API**:
- Copy **Project URL** → this is `NEXT_PUBLIC_SUPABASE_URL`
- Copy **anon public** key → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Step 2 — Local Development

```bash
# Copy and fill in the env file
cp .env.local.example .env.local
# Edit .env.local with your keys

# Install dependencies
npm install

# Run locally
npm run dev
# App is at http://localhost:3000
```

---

## Step 3 — GitHub

```bash
# In the project folder
git init
git add .
git commit -m "init: Alvin's Journey app"

# Create a new repo at https://github.com/new
# Name: alvin-journey (private)
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/alvin-journey.git
git branch -M main
git push -u origin main
```

---

## Step 4 — Vercel Deployment

1. Go to **https://vercel.com** → **Add New Project**
2. Import your GitHub repo `alvin-journey`
3. Framework: **Next.js** (auto-detected)
4. **Environment Variables** — add these two:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
5. Click **Deploy**

### Update OAuth Redirect URL

After Vercel gives you a domain (e.g. `alvin-journey.vercel.app`):

1. Back in Google Console → OAuth credentials → add to **Authorized redirect URIs**:
   - `https://alvin-journey.vercel.app/callback`
2. In Supabase → **Authentication** → **URL Configuration** → add:
   - `https://alvin-journey.vercel.app` to **Redirect URLs**

---

## You're Done! 🔥

Your app is now live at `https://alvin-journey.vercel.app`

- Login with `alvin.niode@gmail.com` via Google OAuth
- Your SK-X90 baseline data will show on the Dashboard
- Log meals, workouts, water daily
- Add body scans in Progress to track your journey
