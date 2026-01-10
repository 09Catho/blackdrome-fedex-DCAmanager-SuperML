# 🚀 Deployment Guide

Complete guide for deploying the FedEx DCA Platform to production.

---

## 📋 **Pre-Deployment Checklist**

### **1. Code Quality**
- [x] All TypeScript errors resolved
- [x] No unused imports or components
- [x] Debug console.logs removed from production code
- [x] Environment variables configured
- [x] RLS policies tested and verified

### **2. Database Setup**
- [ ] Supabase project created
- [ ] All migrations applied successfully
- [ ] Seed data loaded
- [ ] Storage bucket created (`evidence`)
- [ ] Storage policies configured

### **3. Authentication**
- [ ] Demo users created
- [ ] Email confirmation disabled (for demo) or configured (for production)
- [ ] Password requirements set
- [ ] JWT expiry configured

### **4. Edge Functions**
- [ ] All 4 Edge Functions deployed:
  - `score_case`
  - `allocate_case`
  - `transition_case`
  - `sla_sweep`
- [ ] Environment secrets set
- [ ] Function logs checked for errors

---

## 🛠️ **Deployment Steps**

### **Step 1: Supabase Setup**

#### **1.1 Create Project**
```bash
# Go to https://supabase.com
# Click "New Project"
# Choose organization and region
# Set strong database password
# Wait ~2 minutes for provisioning
```

#### **1.2 Get Credentials**
```bash
# Go to Settings → API
# Copy:
# - Project URL (NEXT_PUBLIC_SUPABASE_URL)
# - anon/public key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
# - service_role key (SUPABASE_SERVICE_ROLE_KEY)
```

#### **1.3 Run Migrations**

**Option A: Using Supabase CLI (Recommended)**
```bash
# Install CLI
npm install -g supabase

# Link to project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

**Option B: Manual SQL**
Go to SQL Editor in Supabase Dashboard and run in order:
1. `supabase/migrations/20240101000000_initial_schema.sql`
2. `supabase/migrations/20240101000001_rls_policies.sql`
3. `supabase/migrations/20240101000002_dashboard_views.sql`
4. `supabase/migrations/20240101000003_seed_data.sql`

#### **1.4 Create Storage Bucket**
```bash
# In Supabase Dashboard → Storage
# 1. Create bucket "evidence"
# 2. Set to Private
# 3. Add policies:
```

```sql
-- Allow users to read evidence for cases they can access
CREATE POLICY "Users can view evidence for accessible cases"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'evidence' AND
  EXISTS (
    SELECT 1 FROM cases 
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- Allow users to upload evidence
CREATE POLICY "Users can upload evidence"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'evidence' AND
  EXISTS (
    SELECT 1 FROM cases 
    WHERE id::text = (storage.foldername(name))[1]
  )
);
```

#### **1.5 Deploy Edge Functions**
```bash
# Deploy each function
supabase functions deploy score_case
supabase functions deploy allocate_case
supabase functions deploy transition_case
supabase functions deploy sla_sweep

# Set secrets for functions
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### **1.6 Create Demo Users**

**Option A: Using API endpoint**
```bash
# Start dev server locally
npm run dev

# Hit the endpoint
curl http://localhost:3000/api/create-demo-users
```

**Option B: Manual SQL**
```sql
-- Run in SQL Editor
-- This creates admin@fedex.com and agent@dca1.com
-- See FEATURES.md for full user list
```

---

### **Step 2: Vercel Deployment**

#### **2.1 Connect Repository**
```bash
# Push code to GitHub
git init
git add .
git commit -m "Initial commit"
git push origin main

# Go to https://vercel.com
# Click "New Project"
# Import your GitHub repository
```

#### **2.2 Configure Environment Variables**

In Vercel Dashboard → Settings → Environment Variables, add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=generate-random-string-here
```

**Generate CRON_SECRET:**
```bash
# Linux/Mac
openssl rand -hex 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

#### **2.3 Deploy**
```bash
# Vercel will auto-deploy on push
# Or manually:
vercel --prod
```

#### **2.4 Set up Cron Job**

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/sla-sweep",
    "schedule": "0 */6 * * *"
  }]
}
```

This runs SLA sweep every 6 hours.

---

### **Step 3: Post-Deployment Verification**

#### **3.1 Test Authentication**
```bash
# Go to https://your-app.vercel.app/login
# Login with: admin@fedex.com / password123
# Should redirect to /fedex dashboard
```

#### **3.2 Test RLS**
```bash
# Login as DCA agent: agent@dca1.com / password123
# Go to /dca/cases
# Should see only 5 cases (Premier Recovery)
# Try to access: /dca/cases/[apex-case-id]
# Should see: "Case not found or you don't have access"
```

#### **3.3 Test Edge Functions**
```bash
# Open any case
# Click "Score with AI"
# Should see recovery probability and priority score update
# Check browser console for errors
```

#### **3.4 Test Storage**
```bash
# Open a case
# Click "Upload Evidence"
# Upload a file
# Should see file in list
# Verify file is accessible
```

#### **3.5 Test SLA Sweep**
```bash
curl -X POST https://your-app.vercel.app/api/sla-sweep \
  -H "Authorization: Bearer your-cron-secret"

# Should return: {"success": true, "checked": X, "breached": Y}
```

---

## 🔧 **Configuration**

### **Environment Variables**

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL | `https://abc.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (secret) | `eyJhbGc...` |
| `CRON_SECRET` | Yes | Secret for cron endpoint | Random 32-char string |

### **Supabase Project Settings**

**Auth Settings** (Settings → Authentication):
- Email confirmations: **Disabled** (for demo) or **Enabled** (for production)
- Password minimum length: **8 characters**
- JWT expiry: **3600 seconds** (1 hour)

**API Settings** (Settings → API):
- Auto-refresh tokens: **Enabled**
- CORS allowed origins: Add your Vercel domain

**Database Settings** (Settings → Database):
- Connection pooling: **Enabled** (for production scale)
- Statement timeout: **60 seconds**

---

## 📊 **Performance Optimization**

### **1. Database Indexes**
```sql
-- Already created in migrations, but verify:
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_dca ON cases(assigned_dca_id);
CREATE INDEX IF NOT EXISTS idx_cases_sla_due ON cases(sla_due_at);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority_score DESC NULLS LAST);
```

### **2. Edge Function Caching**
```typescript
// In Edge Functions, add caching headers:
return new Response(JSON.stringify(result), {
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=60' // Cache for 60 seconds
  }
});
```

### **3. Next.js Optimization**
```typescript
// In next.config.js
module.exports = {
  images: {
    domains: ['your-project.supabase.co']
  },
  compress: true,
  poweredByHeader: false
};
```

---

## 🔒 **Security Hardening**

### **1. RLS Double-Check**
```sql
-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;
-- Should return empty result
```

### **2. Service Role Key Protection**
- ✅ Never expose service role key to client
- ✅ Only use in API routes and Edge Functions
- ✅ Add to `.gitignore` if in `.env.local`

### **3. CORS Configuration**
```typescript
// In API routes, add CORS headers
export async function POST(request: Request) {
  // Add CORS for your domain only
  const headers = {
    'Access-Control-Allow-Origin': 'https://your-app.vercel.app',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
  
  // ... rest of handler
}
```

---

## 📈 **Monitoring & Logging**

### **1. Supabase Logs**
```bash
# View Edge Function logs
supabase functions logs score_case --limit 100

# View database logs
# Go to Supabase Dashboard → Database → Logs
```

### **2. Vercel Logs**
```bash
# View production logs
vercel logs --follow

# View specific function logs
vercel logs /api/sla-sweep
```

### **3. Error Tracking**

**Option A: Sentry (Recommended)**
```bash
npm install @sentry/nextjs

# Follow setup wizard
npx @sentry/wizard -i nextjs
```

**Option B: Custom Error Handler**
```typescript
// lib/errorLogger.ts
export function logError(error: Error, context: string) {
  console.error(`[${context}]`, error);
  // Send to your logging service
}
```

---

## 🚨 **Troubleshooting**

### **Issue: RLS Not Working**
**Symptoms:** DCA agents can see all cases

**Fix:**
```sql
-- Verify RLS is enabled
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- Check policies exist
SELECT * FROM pg_policies WHERE tablename = 'cases';

-- Test with specific user
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "user-id-here"}';
SELECT * FROM cases; -- Should show filtered results
```

### **Issue: Edge Functions Timeout**
**Symptoms:** Score case takes >25 seconds

**Fix:**
- Reduce complexity of scoring algorithm
- Cache frequently accessed data
- Use connection pooling

### **Issue: Storage Upload Fails**
**Symptoms:** "Insufficient permissions"

**Fix:**
```sql
-- Check storage policies
SELECT * FROM storage.policies WHERE bucket_id = 'evidence';

-- Verify bucket exists
SELECT * FROM storage.buckets WHERE name = 'evidence';

-- Recreate policies if needed (see Step 1.4)
```

---

## 🔄 **Updates & Maintenance**

### **Schema Updates**
```bash
# Create new migration
supabase migration new add_new_feature

# Edit the new SQL file
# Then push
supabase db push
```

### **Edge Function Updates**
```bash
# Make changes to function code
# Redeploy
supabase functions deploy score_case

# Verify deployment
supabase functions list
```

### **Frontend Updates**
```bash
# Commit changes to git
git add .
git commit -m "feat: add new feature"
git push

# Vercel auto-deploys
# Or manually: vercel --prod
```

---

## ✅ **Production Checklist**

Before going live:

**Security:**
- [ ] RLS enabled on all tables
- [ ] Service role key not exposed to client
- [ ] CORS configured for production domain
- [ ] Strong passwords enforced
- [ ] Rate limiting configured

**Performance:**
- [ ] Database indexes created
- [ ] Connection pooling enabled
- [ ] Images optimized
- [ ] Caching headers set

**Functionality:**
- [ ] All user roles tested
- [ ] Status transitions validated
- [ ] File uploads working
- [ ] SLA sweep running
- [ ] Charts rendering

**Monitoring:**
- [ ] Error tracking configured
- [ ] Logs accessible
- [ ] Alerts set up for critical issues

**Documentation:**
- [ ] User guide provided
- [ ] Admin documentation ready
- [ ] API documentation complete

---

## 🎯 **Go-Live**

**Final Steps:**
1. Run full test suite
2. Backup database
3. Notify stakeholders
4. Monitor logs closely for first 24 hours
5. Have rollback plan ready

**Post-Launch:**
- Monitor error rates
- Check performance metrics
- Gather user feedback
- Plan iterative improvements

---

**Your FedEx DCA Platform is production-ready! 🚀**
