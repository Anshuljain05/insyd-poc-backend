# Railway Deployment Troubleshooting Guide

## 🚨 Common Railway Deployment Issues & Solutions

### Issue 1: Build Failures (No Logs)

**Symptoms:**
- Deployment fails with no visible logs
- Build process appears to hang or fail silently
- Railway shows "Build failed" without details

**Solutions Applied:**

#### ✅ Fixed Package.json Scripts
```json
{
  "scripts": {
    "build": "npx prisma generate && tsc",
    "start": "npx prisma migrate deploy && node dist/index.js",
    "postinstall": "prisma generate"
  }
}
```

**Key Changes:**
- **build**: Now generates Prisma client AND compiles TypeScript
- **start**: Runs migrations then starts compiled JavaScript (not ts-node)
- **postinstall**: Ensures Prisma client is generated after npm install

#### ✅ Added Nixpacks Configuration (`nixpacks.toml`)
```toml
[phases.setup]
nixPkgs = ['nodejs_18']

[phases.install]
cmds = [
  'npm ci',
  'npx prisma generate'
]

[phases.build]
cmds = [
  'npm run build'
]

[start]
cmd = 'npm start'
```

**Why This Helps:**
- Explicitly specifies Node.js 18
- Ensures clean install with `npm ci`
- Generates Prisma client during install phase
- Proper build sequence

#### ✅ Updated Railway.json
```json
{
  "deploy": {
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

#### ✅ Added Node Version File (`.node-version`)
```
18.18.0
```

### Issue 2: Database Connection Problems

**Common Errors:**
```
Error: P1001: Can't reach database server
```

**Solutions:**

1. **Ensure PostgreSQL Service is Added:**
   - In Railway dashboard, add PostgreSQL service
   - Connect it to your backend service
   - DATABASE_URL will be automatically provided

2. **Verify Environment Variables:**
   ```bash
   # Check in Railway dashboard under Variables tab
   DATABASE_URL=postgresql://postgres:password@hostname:port/database
   ```

3. **Migration Issues:**
   - Railway automatically runs `npx prisma migrate deploy` on startup
   - Ensure migration files are committed to git
   - Check Railway logs for migration errors

### Issue 3: Environment Variables

**Required Variables for Railway:**
```env
# Automatically provided by Railway PostgreSQL service
DATABASE_URL=<railway-provides-this>

# You need to set these manually
PORT=3001  # Optional, Railway sets this automatically
EMAIL_FROM=notifications@yourcompany.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FRONTEND_URL=https://your-frontend-url.vercel.app
```

### Issue 4: Health Check Failures

**Symptoms:**
- Railway shows service as unhealthy
- Deployment succeeds but service doesn't start

**Solution:**
The `/health` endpoint now includes database connectivity check:
```typescript
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});
```

### 🔧 Deployment Steps (After Fixes)

1. **Push Updated Code:**
   ```bash
   git push origin master
   ```

2. **Railway Deployment:**
   - Railway will automatically trigger new deployment
   - Build process will now work correctly
   - Watch the deployment logs for any issues

3. **Set Environment Variables:**
   - Go to Railway dashboard → Your service → Variables
   - Add the required environment variables listed above

4. **Add PostgreSQL Database:**
   - In Railway dashboard, click "Add Service"
   - Select "PostgreSQL"
   - Connect it to your backend service

5. **Verify Deployment:**
   ```bash
   # Test health endpoint (replace with your Railway URL)
   curl https://your-backend-url.railway.app/health
   
   # Expected response:
   {"ok": true}
   ```

### 🐛 Debugging Railway Deployments

#### View Build Logs:
1. Go to Railway dashboard
2. Click on your service
3. Go to "Deployments" tab
4. Click on the latest deployment
5. View "Build Logs" and "Deploy Logs"

#### Common Log Errors and Solutions:

**Error: `Cannot find module 'typescript'`**
```bash
# Solution: TypeScript is in devDependencies, build phase needs it
npm install --save-dev typescript
```

**Error: `Prisma schema not found`**
```bash
# Solution: Ensure prisma/schema.prisma is committed to git
git add prisma/schema.prisma
git commit -m "Add Prisma schema"
```

**Error: `Port already in use`**
```bash
# Solution: Railway provides PORT automatically
# Remove hardcoded ports, use process.env.PORT
const port = process.env.PORT || 3001;
```

### ✅ Verification Checklist

After deployment, verify:

- [ ] Build completes successfully
- [ ] Service starts without errors
- [ ] Health endpoint responds: `GET /health` returns `{"ok": true}`
- [ ] Database migrations applied successfully
- [ ] WebSocket connections work
- [ ] CORS allows frontend domain
- [ ] Environment variables are set correctly

### 🔗 Frontend Integration

After successful backend deployment:

1. **Update Frontend Configuration:**
   ```typescript
   // In frontend src/config/api.ts
   const config = {
     apiUrl: 'https://your-backend-url.railway.app',
     wsUrl: 'wss://your-backend-url.railway.app'
   };
   ```

2. **Test Integration:**
   - Frontend demo controls should work
   - Real-time notifications should appear
   - Health check should be accessible

### 📞 Support

If issues persist:
1. Check Railway documentation: https://docs.railway.app
2. Review Railway dashboard logs carefully
3. Test locally first: `npm run build && npm start`
4. Verify all files are committed to git
5. Check Railway service limits and quotas
