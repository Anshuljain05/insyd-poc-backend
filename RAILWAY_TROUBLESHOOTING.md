# Railway Deployment Troubleshooting Guide

## 🚨 Common Railway Deployment Issues & Solutions

### 1. Healthcheck Failure

**Symptoms**: 
- Railway shows "Healthcheck Failed" 
- Deployment stops with no detailed logs
- Service never becomes "Active"

**Root Causes & Solutions**:

#### A. Database Connection Issues
```bash
# Check if DATABASE_URL is set correctly
railway variables

# Verify database connection
railway run -- npm run dev
```

**Solution**: Ensure DATABASE_URL is properly set in Railway environment variables.

#### B. Server Not Binding to Correct Host/Port
**Problem**: Server listens on `localhost` instead of `0.0.0.0`
**Solution**: ✅ **FIXED** - Server now binds to `0.0.0.0`

```typescript
// Fixed in src/index.ts
server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${port}`);
});
```

#### C. Missing Environment Variables
**Problem**: Required environment variables not set
**Solution**: Set these in Railway dashboard:

```env
DATABASE_URL=<auto-provided-by-railway>
NODE_ENV=production
FRONTEND_URL=https://notification-poc-web.vercel.app
EMAIL_FROM=noreply@notifications.com
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=<your-smtp-user>
SMTP_PASS=<your-smtp-pass>
```

#### D. Database Migration Failures
**Problem**: Migrations fail during startup
**Solution**: ✅ **FIXED** - Automatic migration deployment

The server now runs `prisma migrate deploy` automatically in production:

```typescript
// Added in src/index.ts
if (process.env.NODE_ENV === 'production') {
  console.log('🔄 Running database migrations...');
  exec('npx prisma migrate deploy', ...);
}
```

### 2. Build Failures

**Symptoms**: Build process fails before deployment

#### A. TypeScript Compilation Errors
```bash
# Check build locally
npm run build

# If errors, fix TypeScript issues
npm run dev
```

#### B. Missing Dependencies
```bash
# Ensure all dependencies are in package.json
npm install
npm run build
```

### 3. Runtime Errors

**Symptoms**: App builds but crashes immediately

#### A. Uncaught Exceptions
**Solution**: ✅ **FIXED** - Added global error handlers

```typescript
// Added in src/index.ts
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});
```

#### B. Database Connection Timeout
**Solution**: ✅ **FIXED** - Added connection timeout

```typescript
// Added timeout to health check
await Promise.race([
  prisma.$queryRaw`SELECT 1`,
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('DB timeout')), 5000)
  )
]);
```

### 4. Environment-Specific Issues

#### A. Email Service Blocking Startup
**Problem**: SMTP verification blocks server startup
**Solution**: ✅ **FIXED** - Non-blocking email verification

```typescript
// Fixed: Email verification is now non-blocking
emailService.verifyConnection().catch(error => {
  console.warn('Email service verification failed (non-critical):', error.message);
});
```

#### B. CORS Configuration
**Solution**: ✅ **FIXED** - Production-ready CORS

```typescript
const corsOptions = {
  origin: [
    'https://notification-poc-web.vercel.app',
    'https://notification-frontend-5a262wn8p-anshuljain05s-projects.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};
```

## 🔧 Deployment Checklist

### Pre-Deployment
- [ ] ✅ DATABASE_URL environment variable set
- [ ] ✅ All critical environment variables configured
- [ ] ✅ Build script works locally (`npm run build`)
- [ ] ✅ Start script tested (`npm start`)
- [ ] ✅ Health endpoint accessible

### During Deployment
1. **Watch Railway Logs**: Check for startup errors
2. **Monitor Build Phase**: Ensure dependencies install correctly
3. **Check Health Endpoint**: Verify `/health` returns 200 OK
4. **Test Database**: Confirm migrations run successfully

### Post-Deployment
- [ ] Health check: `curl https://your-app.railway.app/health`
- [ ] API test: Create a notification via POST
- [ ] WebSocket test: Verify real-time connections work
- [ ] Frontend connection: Test from deployed frontend

## 🚀 Current Deployment Status

### ✅ Fixed Issues:
1. **Server Binding**: Now binds to `0.0.0.0:PORT`
2. **Database Connection**: Proper error handling and timeouts
3. **Environment Variables**: Fallbacks for non-critical variables
4. **Email Service**: Non-blocking initialization
5. **Error Handling**: Global exception catchers
6. **Graceful Shutdown**: SIGTERM/SIGINT handlers
7. **Auto-Migrations**: Runs `prisma migrate deploy` in production
8. **Health Check**: Enhanced with detailed status information
9. **CORS Configuration**: Production-ready with all frontend URLs

### 🎯 Expected Behavior:
1. **Build Phase**: Dependencies install, TypeScript compiles, Prisma generates
2. **Start Phase**: Database connects, migrations run, server starts on Railway's port
3. **Health Check**: `/health` endpoint returns 200 with status information
4. **Runtime**: Server accepts requests, WebSocket connections work

## 🐛 Debug Commands

```bash
# Check Railway service status
railway status

# View live logs
railway logs

# Test locally with Railway environment
railway run -- npm start

# Connect to Railway database
railway connect

# Check environment variables
railway variables
```

## 📞 If Still Failing

If deployment still fails after these fixes:

1. **Check Railway Logs**: Look for specific error messages
2. **Verify Environment Variables**: Ensure DATABASE_URL is correct
3. **Test Database Connection**: Use `railway connect` to verify DB access
4. **Gradual Rollback**: Comment out non-essential features to isolate issues

## 🔄 Redeployment Steps

1. **Pull Latest Changes**: `git pull origin master`
2. **Verify Locally**: `npm run build && npm start`
3. **Push to Railway**: Git push triggers automatic deployment
4. **Monitor Logs**: Watch Railway dashboard for deployment progress
5. **Test Health**: `curl https://your-app.railway.app/health`

The latest changes should resolve the healthcheck failures. The server now properly:
- Binds to the correct host and port
- Handles database connections with timeouts
- Runs migrations automatically
- Provides detailed health check information
- Handles errors gracefully without crashing
