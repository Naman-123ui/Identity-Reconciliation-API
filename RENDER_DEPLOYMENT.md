# Deploy to Render - Complete Step by Step Guide

## ✅ What You Need
- GitHub account with your code pushed
- Render account (free)
- 10-15 minutes

---

## **STEP 1: Push Your Code to GitHub (5 minutes)**

### 1.1 Open PowerShell and navigate to your project
```powershell
cd "c:\Users\User\OneDrive\Desktop\Bitespeed_Assignment"
```

### 1.2 Initialize git (if not already done)
```powershell
git init
```

### 1.3 Add all files
```powershell
git add .
```

### 1.4 Create initial commit
```powershell
git commit -m "Initial commit: Bitespeed identity reconciliation"
```

### 1.5 Create GitHub repository
1. Go to https://github.com/new
2. **Repository name**: `bitespeed-identity`
3. **Description**: `Identity Reconciliation Backend Service`
4. Click **Create repository**

### 1.6 Add remote and push
```powershell
git remote add origin https://github.com/YOUR_USERNAME/bitespeed-identity.git
git branch -M main
git push -u origin main
```

✅ **Your code is now on GitHub!**

---

## **STEP 2: Sign Up on Render (2 minutes)**

### 2.1 Create Render account
1. Go to https://render.com
2. Click **Sign up**
3. Select **Sign up with GitHub**
4. Click **Authorize render-app**
5. Approve the authorization

✅ **You're now logged into Render!**

---

## **STEP 3: Create PostgreSQL Database (3 minutes)**

### 3.1 Create database service
1. Click **New +** button (top right)
2. Select **PostgreSQL**
3. Fill in the form:

| Field | Value |
|-------|-------|
| **Name** | `bitespeed-db` |
| **Database** | `bitespeed` |
| **User** | `bitespeed_user` |
| **Region** | Choose closest to you |
| **PostgreSQL Version** | 15 (default) |

4. Click **Create Database**
5. **Wait 1-2 minutes** while it deploys

### 3.2 Get connection details
1. After database is created, click on it
2. Look for **Connections** section at top
3. Copy the **Internal Database URL** (starts with `postgresql://`)
4. Save this - you'll need it in the next step!

✅ **Database is ready!**

---

## **STEP 4: Create Web Service (5 minutes)**

### 4.1 Create web service
1. Click **New +** → **Web Service**
2. Select your `bitespeed-identity` repository from GitHub
3. Fill in the form:

| Field | Value |
|-------|-------|
| **Name** | `bitespeed-identity` |
| **Environment** | `Node` |
| **Region** | Same as database |
| **Branch** | `main` |
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `npx prisma db push && npm start` |

4. Click **Create Web Service**

### 4.2 Wait for initial deployment attempt
- You'll see deployment logs
- It will fail initially - that's normal (missing DATABASE_URL)
- Don't worry, we'll fix it in the next step

---

## **STEP 5: Configure Environment Variables (3 minutes)**

### 5.1 Navigate to Environment section
1. In your Web Service dashboard, click **Environment** tab
2. You'll see an empty list

### 5.2 Add DATABASE_URL
1. Click **Add Environment Variable**
2. **Key**: `DATABASE_URL`
3. **Value**: Paste the PostgreSQL URL you copied earlier
   - Format: `postgresql://user:password@host:5432/database`
4. Click **Save**

### 5.3 Add NODE_ENV (optional but recommended)
1. Click **Add Environment Variable**
2. **Key**: `NODE_ENV`
3. **Value**: `production`
4. Click **Save**

✅ **Environment variables are set!**

---

## **STEP 6: Trigger Deployment (5 minutes)**

### 6.1 Redeploy your app
1. Go to the **Deployments** tab
2. Click the **3-dot menu** (⋮) on the latest failed deployment
3. Select **Redeploy**
4. Wait for deployment to complete (2-3 minutes)

### 6.2 Watch the deployment logs
You should see:
```
✓ Build successful
✓ Migrations completed
✓ Server running on port...
✅ Deployment complete!
```

---

## **STEP 7: Get Your Live URL (1 minute)**

### 7.1 Find your URL
1. Go back to your Web Service dashboard
2. At the top, you'll see your URL:
   - Format: `https://bitespeed-identity.onrender.com`
3. **Copy this URL** - this is your live API!

---

## **STEP 8: Test Your Deployment (2 minutes)**

### 8.1 Test health endpoint
Open PowerShell and run:
```powershell
curl https://YOUR_RENDER_URL/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-27T...",
  "service": "bitespeed-identity-reconciliation"
}
```

### 8.2 Test identify endpoint
```powershell
curl -X POST https://YOUR_RENDER_URL/identify `
  -H "Content-Type: application/json" `
  -d '{"email": "test@example.com", "phoneNumber": "1234567890"}'
```

**Expected response:**
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["test@example.com"],
    "phoneNumbers": ["1234567890"],
    "secondaryContactIds": []
  }
}
```

✅ **Your API is live!**

---

## 🔧 Troubleshooting

### ❌ Deployment shows "Build failed"
**Solution:**
1. Click on the deployment to see logs
2. Look for the error message
3. Check that `package.json` exists in root
4. Push fixes to GitHub
5. Redeploy

### ❌ "Error: Cannot connect to database"
**Solution:**
1. Go to **Environment** section
2. Check `DATABASE_URL` is correctly pasted
3. Verify the URL format is correct
4. Redeploy

### ❌ "/identify returns 500 error"
**Solution:**
1. Check deployment logs for errors
2. Ensure migrations ran (check logs for "migration success")
3. If migrations didn't run, manually trigger them:
   - Go to **Shell** tab
   - Run: `npx prisma db push`

### ❌ App keeps crashing
**Solution:**
1. Check logs in **Logs** tab
2. Look for "Cannot find module" errors
3. Try rebuilding: Click **Redeploy**

---

## 📋 Render Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] PostgreSQL database created
- [ ] Database URL copied
- [ ] Web Service created
- [ ] Environment variables set:
  - [ ] `DATABASE_URL`
  - [ ] `NODE_ENV` (optional)
- [ ] Deployment successful
- [ ] Health endpoint working
- [ ] Identify endpoint working

---

## 🎉 You're Done!

Your API is now live on Render! 

**Your live API URL:**
```
https://YOUR_RENDER_URL/identify
```

You can now:
- ✅ Share this URL with your team
- ✅ Use it in production
- ✅ Make API calls from anywhere
- ✅ Monitor logs in Render dashboard

---

## 💡 Render Features

| Feature | Details |
|---------|---------|
| **Free Tier** | Yes, with limits |
| **Auto-deploy** | Push to GitHub → auto-deploys |
| **Custom domain** | Can add your own domain |
| **SSL/HTTPS** | Automatic (included) |
| **Logs** | Real-time logs in dashboard |
| **Database backups** | Automatic daily |
| **Uptime SLA** | 99.9% guaranteed |

---

## 📞 Need Help?

- **Render docs**: https://render.com/docs
- **Prisma docs**: https://www.prisma.io/docs/
- **Node.js docs**: https://nodejs.org/en/docs/

Good luck! 🚀
