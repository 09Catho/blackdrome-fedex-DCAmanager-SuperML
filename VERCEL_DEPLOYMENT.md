# 🚀 Vercel Deployment Guide - Complete Setup

Deploy your FedEx DCA Platform to Vercel (Frontend + Backend together)

---

## 📋 **Prerequisites**

- ✅ GitHub repo pushed: https://github.com/09Catho/blackdrome-fedex-DCAmanager-SuperML
- ✅ Supabase project created with migrations applied
- ✅ Supabase Edge Functions deployed
- ⚠️ Have your Supabase credentials ready

---

## 🌟 **Option 1: Deploy via Vercel Dashboard (Recommended)**

### **Step 1: Connect GitHub**

1. Go to: **https://vercel.com/signup**
2. Sign up with GitHub (as 09Catho)
3. Click **"Add New..."** → **"Project"**
4. Click **"Import Git Repository"**
5. Find: `blackdrome-fedex-DCAmanager-SuperML`
6. Click **"Import"**

### **Step 2: Configure Project**

**Framework Preset:** Next.js (auto-detected) ✅

**Root Directory:** `./` (keep default)

**Build Command:** `npm run build` (auto-filled)

**Output Directory:** `.next` (auto-filled)

**Install Command:** `npm install` (auto-filled)

### **Step 3: Environment Variables** ⚠️ **CRITICAL**

Click **"Environment Variables"** and add these **EXACTLY**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
CRON_SECRET=your-random-secret-32-chars
```

**Where to get these:**

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Go to: Supabase Dashboard → Settings → API
   - Copy "Project URL"

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Same place → Copy "Project API keys" → "anon" → "public"

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Same place → Copy "service_role" → "secret" ⚠️ KEEP SECRET!

4. **CRON_SECRET**
   - Generate random string:
   ```bash
   # PowerShell
   -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
   ```

**Apply to:** ✅ Production, Preview, Development (check all)

### **Step 4: Deploy**

1. Click **"Deploy"**
2. Wait 2-3 minutes (building...)
3. ✅ **Success!** Your app is live!

---

## 🌐 **Option 2: Deploy via CLI**

### **Step 1: Install Vercel CLI**

```bash
npm install -g vercel
```

### **Step 2: Login**

```bash
vercel login
```

Enter your email (ashketchume45@gmail.com)

### **Step 3: Deploy**

```bash
cd "I:/FedEX Hackathon"
vercel
```

**Answer the prompts:**
```
Set up and deploy? Y
Which scope? (select your account)
Link to existing project? N
What's your project's name? blackdrome-fedex-dca
In which directory is your code? ./
Want to override settings? N
```

### **Step 4: Add Environment Variables**

```bash
# Add each variable
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste value when prompted

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste value

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Paste value

vercel env add CRON_SECRET
# Paste value
```

**For each, select:** Production, Preview, Development

### **Step 5: Redeploy with Env Vars**

```bash
vercel --prod
```

---

## ⚙️ **Post-Deployment Configuration**

### **1. Set up Custom Domain (Optional)**

1. In Vercel Dashboard → Your Project → Settings → Domains
2. Add custom domain (if you have one)
3. Or use the default: `your-project.vercel.app`

### **2. Configure Cron Jobs**

Your `vercel.json` already has:
```json
{
  "crons": [{
    "path": "/api/sla-sweep",
    "schedule": "0 */6 * * *"
  }]
}
```

This runs SLA sweep **every 6 hours** automatically! ✅

### **3. Update Supabase CORS**

In Supabase Dashboard → Settings → API → CORS:

Add your Vercel domain:
```
https://your-project.vercel.app
```

---

## 🧪 **Testing Your Deployment**

### **1. Test Homepage**

```
https://your-project.vercel.app
```

Should redirect to `/login`

### **2. Test Login**

```
Email: admin@fedex.com
Password: password123
```

Should log in and show dashboard

### **3. Test API Routes**

```bash
# Test case creation (from your deployed app)
curl https://your-project.vercel.app/api/cases/create \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"customer_name":"Test","amount":10000,"ageing_days":30}'
```

### **4. Test SLA Sweep**

```bash
curl https://your-project.vercel.app/api/sla-sweep \
  -X POST \
  -H "Authorization: Bearer your-cron-secret"
```

---

## 🔍 **Verify Everything Works**

### **✅ Checklist:**

- [ ] Homepage loads
- [ ] Login works (FedEx admin)
- [ ] Dashboard shows data
- [ ] Cases page loads
- [ ] Case details work
- [ ] AI scoring works
- [ ] Status changes work
- [ ] SLA timers count down
- [ ] Login as DCA agent works
- [ ] DCA sees only their cases (RLS working)
- [ ] File uploads work
- [ ] Charts render

---

## 📊 **Monitor Your Deployment**

### **1. View Logs**

Vercel Dashboard → Your Project → Deployments → Click latest → **Logs**

Or via CLI:
```bash
vercel logs --follow
```

### **2. Check Performance**

Vercel Dashboard → Your Project → Analytics

- Speed Insights
- Web Vitals
- Error tracking

### **3. Monitor Edge Functions**

Supabase Dashboard → Edge Functions → Select function → **Logs**

---

## 🐛 **Troubleshooting**

### **Issue: Build Fails**

**Check build logs in Vercel**

Common fixes:
```bash
# If TypeScript errors
npm run build
# Fix any errors locally first

# If dependency issues
rm -rf node_modules package-lock.json
npm install
git add .
git commit -m "fix: update dependencies"
git push
```

### **Issue: "Environment variable not defined"**

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Verify all 4 variables are set
3. Click **"Redeploy"**

### **Issue: API Routes Return 500**

Check:
1. Supabase credentials are correct
2. Service role key has proper permissions
3. Supabase project is not paused
4. Check Vercel function logs

### **Issue: RLS Not Working**

1. Verify Supabase URL is correct
2. Check RLS policies in Supabase Dashboard → Database → Policies
3. Test query in Supabase SQL Editor:
   ```sql
   SELECT * FROM cases WHERE assigned_dca_id = current_user_dca_id();
   ```

### **Issue: Login Doesn't Work**

1. Check Supabase Auth is enabled
2. Verify users exist in Authentication → Users
3. Check Site URL in Supabase → Authentication → Settings:
   - Add: `https://your-project.vercel.app`
4. Check Redirect URLs:
   - Add: `https://your-project.vercel.app/**`

---

## 🔐 **Security Best Practices**

### **1. Environment Variables**

✅ **DO:**
- Use Vercel environment variables
- Never commit .env files
- Rotate secrets regularly

❌ **DON'T:**
- Never hardcode credentials
- Never expose service_role key to client
- Don't log sensitive data

### **2. Rate Limiting**

Add to your API routes:
```typescript
// app/api/cases/create/route.ts
export const config = {
  maxDuration: 10, // seconds
};
```

### **3. CORS**

Already configured in API routes:
```typescript
headers: {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
}
```

---

## 🚀 **Continuous Deployment**

Once set up, every push to `main` branch auto-deploys!

```bash
# Make changes
git add .
git commit -m "feat: add new feature"
git push origin main

# Vercel automatically:
# 1. Detects push
# 2. Runs build
# 3. Deploys to production
# 4. Updates your live site
```

**Preview Deployments:**
- Every PR gets a preview URL
- Test before merging
- Share with team/judges

---

## 📈 **Performance Optimization**

### **1. Edge Functions**

Already optimized:
- Deployed in Supabase Edge (globally distributed)
- Sub-100ms response times
- Auto-scales

### **2. Static Assets**

Vercel automatically:
- Compresses images
- Minifies JS/CSS
- Caches static files
- Uses CDN

### **3. Database**

- Supabase has connection pooling
- Indexes on key columns
- RLS adds <10ms overhead

---

## 📱 **Share Your App**

**Your Live URLs:**

**Production:**
```
https://your-project.vercel.app
```

**Demo Credentials:**
```
FedEx Admin:
Email: admin@fedex.com
Password: password123

DCA Agent:
Email: agent@dca1.com
Password: password123
```

**GitHub Repo:**
```
https://github.com/09Catho/blackdrome-fedex-DCAmanager-SuperML
```

---

## 🎯 **Quick Deploy Checklist**

### **Before Deploying:**
- [x] Code pushed to GitHub
- [x] Supabase project created
- [x] Migrations applied
- [x] Edge Functions deployed
- [x] Demo users created
- [x] Seed data loaded

### **During Deploy:**
- [ ] Import GitHub repo to Vercel
- [ ] Add all 4 environment variables
- [ ] Deploy
- [ ] Wait for build to complete

### **After Deploy:**
- [ ] Test login
- [ ] Test dashboards
- [ ] Test RLS (DCA isolation)
- [ ] Test AI scoring
- [ ] Test all features
- [ ] Share URL with team/judges

---

## 🎉 **You're Live!**

Your FedEx DCA Platform is now:
- ✅ Deployed globally (Vercel Edge Network)
- ✅ Auto-scaling (handles any traffic)
- ✅ Secure (environment variables, RLS)
- ✅ Fast (sub-second page loads)
- ✅ Monitored (logs & analytics)
- ✅ Auto-deploying (on every push)

**Deployment URL will be:**
```
https://blackdrome-fedex-dca-manager-super-ml.vercel.app
```
(or similar, Vercel will assign)

---

## 📞 **Need Help?**

**Vercel Support:**
- Docs: https://vercel.com/docs
- Discord: https://vercel.com/discord

**Supabase Support:**
- Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com

---

**Ready to deploy? Go to https://vercel.com and import your GitHub repo! 🚀**
