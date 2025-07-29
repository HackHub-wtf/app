# 🚀 Deployment Guide

This guide covers deployment strategies, configuration, and best practices for deploying HackHub to production environments. HackHub is designed to be deployed on modern cloud platforms with automatic scaling and high availability.

## Deployment Overview

HackHub consists of two main components:
- **Frontend**: React SPA built with Vite
- **Backend**: Supabase (Database + Auth + Storage + API)

```mermaid
graph TD
    A[Developer] --> B[Git Repository]
    B --> C[GitHub Actions]
    C --> D[Build Artifacts]
    D --> E[Deployment Platform]
    
    E --> F[Frontend - Static Hosting]
    E --> G[Backend - Supabase]
    
    F --> H[CDN Distribution]
    G --> I[PostgreSQL Database]
    G --> J[Authentication Service]
    G --> K[File Storage]
    
    H --> L[End Users]
    I --> L
    J --> L
    K --> L
```

## Supported Platforms

### Frontend Deployment Options

1. **Vercel** (Recommended)
   - Zero-config deployment
   - Automatic previews for PRs
   - Edge network distribution
   - Built-in analytics

2. **Netlify**
   - Git-based deployment
   - Form handling
   - Serverless functions support

3. **Cloudflare Workers** (Recommended for production)
   - Global edge network with 200+ locations
   - Unlimited bandwidth
   - Automatic SSL/TLS certificates
   - Built-in analytics and performance monitoring
   - Edge-side functions and serverless deployment
   - Git-based deployment

4. **AWS CloudFront + S3**
   - Enterprise-grade CDN
   - Custom domain support
   - SSL/TLS certificates

5. **GitHub Pages**
   - Free for public repositories
   - Simple setup
   - Custom domain support

### Backend (Supabase)

- **Supabase Cloud** (Recommended)
- **Self-hosted Supabase** (Advanced users)

## Environment Configuration

### Environment Variables

Create environment files for different stages:

#### `.env.local` (Development)
```bash
# Supabase Configuration
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key

# App Configuration
VITE_APP_NAME=HackHub
VITE_APP_ENVIRONMENT=development
VITE_APP_VERSION=1.0.0

# Analytics (Optional)
VITE_GOOGLE_ANALYTICS_ID=
VITE_SENTRY_DSN=

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_REPORTING=false
```

#### `.env.production`
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key

# App Configuration
VITE_APP_NAME=HackHub
VITE_APP_ENVIRONMENT=production
VITE_APP_VERSION=1.0.0

# Analytics
VITE_GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
VITE_SENTRY_DSN=your-sentry-dsn

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true

# Performance
VITE_ENABLE_SERVICE_WORKER=true
VITE_CACHE_STRATEGY=network-first
```

#### `.env.staging`
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-staging-anon-key

# App Configuration
VITE_APP_NAME=HackHub (Staging)
VITE_APP_ENVIRONMENT=staging
VITE_APP_VERSION=1.0.0-rc

# Analytics
VITE_GOOGLE_ANALYTICS_ID=GA_STAGING_ID
VITE_SENTRY_DSN=your-staging-sentry-dsn

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
VITE_ENABLE_DEBUG_MODE=true
```

### Build Configuration

#### `vite.config.ts` Production Settings
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: mode === 'production' ? false : true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production'
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@mantine/core', '@mantine/hooks'],
          utils: ['date-fns', 'lodash-es']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  
  preview: {
    port: 3000,
    host: true
  }
}))
```

## Vercel Deployment

### Automatic Deployment

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and connect project
   vercel login
   vercel --prod
   ```

2. **Vercel Configuration** (`vercel.json`)
   ```json
   {
     "name": "hackhub",
     "version": 2,
     "builds": [
       {
         "src": "package.json",
         "use": "@vercel/static-build",
         "config": {
           "distDir": "dist"
         }
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "status": 404
       },
       {
         "src": "/(.*)",
         "dest": "/index.html"
       }
     ],
     "env": {
       "VITE_SUPABASE_URL": "@supabase-url",
       "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key"
     },
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           {
             "key": "X-Content-Type-Options",
             "value": "nosniff"
           },
           {
             "key": "X-Frame-Options",
             "value": "DENY"
           },
           {
             "key": "X-XSS-Protection",
             "value": "1; mode=block"
           }
         ]
       }
     ]
   }
   ```

3. **Environment Variables Setup**
   ```bash
   # Add environment variables
   vercel env add VITE_SUPABASE_URL production
   vercel env add VITE_SUPABASE_ANON_KEY production
   vercel env add VITE_GOOGLE_ANALYTICS_ID production
   ```

### Preview Deployments

Vercel automatically creates preview deployments for every pull request:

```yaml
# .github/workflows/preview.yml
name: Preview Deployment

on:
  pull_request:
    branches: [main]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24.1.0'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          scope: ${{ secrets.VERCEL_ORG_ID }}
```

## Cloudflare Workers Deployment

Cloudflare Workers provides excellent performance with a global edge network and is ideal for production deployments of SPAs.

### Setup via Dashboard

1. **Connect Repository**
   - Go to [Cloudflare Workers Dashboard](https://dash.cloudflare.com/workers)
   - Click "Create application" → "Pages" → "Connect to Git"
   - Authorize Cloudflare to access your repository
   - Select the HackHub repository

2. **Build Configuration**
   ```bash
   # Build command
   npm run build
   
   # Build output directory
   dist
   
   # Root directory (optional)
   /
   
   # Node.js version
   24.1.0
   ```

3. **Environment Variables**
   Set these in the Cloudflare Workers dashboard:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-production-anon-key
   VITE_APP_ENVIRONMENT=production
   VITE_GOOGLE_ANALYTICS_ID=your-ga-id
   VITE_SENTRY_DSN=your-sentry-dsn
   NODE_VERSION=24.1.0
   ```

### Setup via Wrangler CLI

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create Pages project (SPA deployment to Workers)
wrangler pages project create hackhub

# Deploy manually
npm run build
wrangler pages deploy dist --project-name=hackhub
```

### Configuration Files

Create `wrangler.toml` for advanced configuration:

```toml
name = "hackhub"
compatibility_date = "2024-01-01"

[env.production]
name = "hackhub"

[env.preview]
name = "hackhub-preview"

[[env.production.routes]]
pattern = "hackhub.yourdomain.com/*"
zone_name = "yourdomain.com"

[[env.production.routes]]
pattern = "www.hackhub.yourdomain.com/*"
zone_name = "yourdomain.com"
```

### Advanced Features

#### Custom Headers and Redirects

Create `_headers` file in your `public/` directory:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/static/*
  Cache-Control: public, max-age=31536000, immutable

/api/*
  Cache-Control: no-cache
```

Create `_redirects` file in your `public/` directory:

```
# SPA fallback
/*    /index.html   200

# Force HTTPS
http://hackhub.yourdomain.com/*  https://hackhub.yourdomain.com/:splat  301!
```

#### Edge Functions (Optional)

For advanced functionality, you can add Cloudflare Workers Functions:

```javascript
// functions/api/health.js
export async function onRequest(context) {
  return new Response(JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    edge: context.cf.colo
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  })
}
```

### Production Deployment Workflow

1. **Automatic Deployments**
   - Production deploys automatically on `main` branch pushes
   - Preview deployments for all pull requests
   - Rollback capability through dashboard

2. **Custom Domain Setup**
   ```bash
   # Add custom domain via dashboard or CLI
   wrangler pages domain add hackhub.yourdomain.com --project-name=hackhub
   ```

3. **SSL/TLS Configuration**
   - Automatic SSL certificates
   - Full (strict) encryption mode recommended
   - HSTS headers automatically added

### Performance Benefits

- **Global Edge Network**: 200+ locations worldwide
- **HTTP/3 Support**: Latest protocol for faster loading
- **Brotli Compression**: Automatic asset compression
- **Image Optimization**: Automatic image resizing and format conversion
- **Analytics**: Built-in web analytics and performance monitoring

## Netlify Deployment

### Configuration

1. **Netlify Configuration** (`netlify.toml`)
   ```toml
   [build]
     publish = "dist"
     command = "npm run build"
   
   [build.environment]
     NODE_VERSION = "24.1.0"
     NPM_VERSION = "10"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   
   [[headers]]
     for = "/*"
     [headers.values]
       X-Frame-Options = "DENY"
       X-XSS-Protection = "1; mode=block"
       X-Content-Type-Options = "nosniff"
       Referrer-Policy = "strict-origin-when-cross-origin"
   
   [[headers]]
     for = "/static/*"
     [headers.values]
       Cache-Control = "public, max-age=31536000, immutable"
   ```

2. **Deploy with Netlify CLI**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Login and deploy
   netlify login
   netlify deploy --prod
   ```

## AWS Deployment

### S3 + CloudFront Setup

1. **S3 Bucket Configuration**
   ```bash
   # Create S3 bucket
   aws s3 mb s3://hackhub-production
   
   # Enable static website hosting
   aws s3 website s3://hackhub-production \
     --index-document index.html \
     --error-document index.html
   ```

2. **CloudFront Distribution**
   ```yaml
   # cloudformation-template.yml
   AWSTemplateFormatVersion: '2010-09-09'
   Description: 'HackHub CloudFront Distribution'
   
   Resources:
     CloudFrontDistribution:
       Type: AWS::CloudFront::Distribution
       Properties:
         DistributionConfig:
           Origins:
             - DomainName: !GetAtt S3Bucket.DomainName
               Id: S3Origin
               CustomOriginConfig:
                 HTTPPort: 80
                 HTTPSPort: 443
                 OriginProtocolPolicy: https-only
           Enabled: true
           DefaultRootObject: index.html
           DefaultCacheBehavior:
             TargetOriginId: S3Origin
             ViewerProtocolPolicy: redirect-to-https
             CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad
           CustomErrorResponses:
             - ErrorCode: 404
               ResponseCode: 200
               ResponsePagePath: /index.html
   ```

3. **Deployment Script**
   ```bash
   #!/bin/bash
   # deploy-aws.sh
   
   # Build the application
   npm run build
   
   # Upload to S3
   aws s3 sync dist/ s3://hackhub-production \
     --delete \
     --cache-control "public, max-age=31536000" \
     --exclude "*.html" \
     --exclude "service-worker.js"
   
   # Upload HTML files with no cache
   aws s3 sync dist/ s3://hackhub-production \
     --delete \
     --cache-control "no-cache" \
     --include "*.html" \
     --include "service-worker.js"
   
   # Invalidate CloudFront cache
   aws cloudfront create-invalidation \
     --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
     --paths "/*"
   ```

## Supabase Backend Setup

### Production Instance

1. **Create Supabase Project**
   ```bash
   # Using Supabase CLI
   npx supabase projects create hackhub-production
   
   # Or create via dashboard at https://app.supabase.com
   ```

2. **Database Migration**
   ```bash
   # Apply migrations to production
   npx supabase db push --db-url postgresql://user:pass@db.project.supabase.co:5432/postgres
   
   # Run seed data (if needed)
   npx supabase db seed --db-url postgresql://user:pass@db.project.supabase.co:5432/postgres
   ```

3. **Environment Configuration**
   ```sql
   -- Set up environment-specific settings
   UPDATE auth.config SET 
     site_url = 'https://hackhub.yourdomain.com',
     jwt_exp = 3600;
   
   -- Configure email templates
   UPDATE auth.config SET 
     mailer_templates = '{
       "confirmation": {
         "subject": "Confirm your HackHub account",
         "content_html": "<h1>Welcome to HackHub!</h1>..."
       }
     }';
   ```

### Security Configuration

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Set up secure policies (see ARCHITECTURE.md for details)
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  release:
    types: [published]

env:
  NODE_VERSION: '24.1.0'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:run
      - run: npm run lint
      - run: npm run type-check

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_GOOGLE_ANALYTICS_ID: ${{ secrets.VITE_GOOGLE_ANALYTICS_ID }}
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: dist/

  deploy-staging:
    if: github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: build-files
          path: dist/
      
      - name: Deploy to Staging
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          scope: ${{ secrets.VERCEL_ORG_ID }}

  deploy-production:
    if: github.event_name == 'release'
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: build-files
          path: dist/
      
      - name: Deploy to Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          scope: ${{ secrets.VERCEL_ORG_ID }}
          vercel-args: '--prod'
```

## Performance Optimization

### Build Optimizations

1. **Code Splitting**
   ```typescript
   // Lazy load components
   const Dashboard = lazy(() => import('./pages/Dashboard'))
   const HackathonDetail = lazy(() => import('./pages/HackathonDetail'))
   
   // Use Suspense for loading states
   <Suspense fallback={<LoadingSpinner />}>
     <Routes>
       <Route path="/dashboard" element={<Dashboard />} />
       <Route path="/hackathons/:id" element={<HackathonDetail />} />
     </Routes>
   </Suspense>
   ```

2. **Asset Optimization**
   ```typescript
   // vite.config.ts
   export default defineConfig({
     build: {
       rollupOptions: {
         output: {
           assetFileNames: 'assets/[name].[hash][extname]',
           chunkFileNames: 'assets/[name].[hash].js',
           entryFileNames: 'assets/[name].[hash].js'
         }
       }
     },
     assetsInclude: ['**/*.woff2']
   })
   ```

### CDN Configuration

```javascript
// Service Worker for caching
const CACHE_NAME = 'hackhub-v1'
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response
        }
        return fetch(event.request)
      })
  )
})
```

## Monitoring and Analytics

### Error Tracking (Sentry)

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/react'

if (import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true') {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_APP_ENVIRONMENT,
    integrations: [
      new Sentry.BrowserTracing(),
    ],
    tracesSampleRate: 1.0,
  })
}
```

### Analytics (Google Analytics)

```typescript
// src/lib/analytics.ts
import { gtag } from 'ga-gtag'

if (import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
  gtag('config', import.meta.env.VITE_GOOGLE_ANALYTICS_ID, {
    page_title: document.title,
    page_location: window.location.href
  })
}

export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
    gtag('event', eventName, parameters)
  }
}
```

### Health Checks

```typescript
// src/lib/healthCheck.ts
export const healthCheck = async () => {
  try {
    const { data, error } = await supabase
      .from('hackathons')
      .select('count')
      .limit(1)
    
    return {
      status: error ? 'unhealthy' : 'healthy',
      timestamp: new Date().toISOString(),
      database: error ? 'down' : 'up'
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'down',
      error: error.message
    }
  }
}
```

## Security Considerations

### Content Security Policy

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  frame-ancestors 'none';
">
```

### Environment Variable Security

```bash
# Never commit these to version control
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key  # Safe to expose (RLS protected)

# Keep these secret
SUPABASE_SERVICE_ROLE_KEY=secret-key  # Never expose to frontend
DATABASE_URL=postgresql://...          # Server-side only
```

## Backup and Recovery

### Database Backups

```bash
# Automated daily backups
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="hackhub_backup_$DATE.sql"

# Create backup
pg_dump $DATABASE_URL > $BACKUP_FILE

# Upload to cloud storage
aws s3 cp $BACKUP_FILE s3://hackhub-backups/

# Keep only last 30 days
aws s3 ls s3://hackhub-backups/ --recursive | \
  awk '$1 < "'$(date -d '30 days ago' '+%Y-%m-%d')'" {print $4}' | \
  xargs -I {} aws s3 rm s3://hackhub-backups/{}
```

### Disaster Recovery Plan

1. **Database Recovery**
   ```bash
   # Restore from backup
   pg_restore --clean --no-acl --no-owner -d $DATABASE_URL backup.sql
   ```

2. **Frontend Recovery**
   ```bash
   # Redeploy from last known good commit
   git checkout last-known-good-commit
   npm run build
   vercel --prod
   ```

## Scaling Considerations

### Frontend Scaling
- **CDN**: Global edge distribution
- **Caching**: Aggressive static asset caching
- **Compression**: Gzip/Brotli compression
- **Image Optimization**: WebP format, lazy loading

### Backend Scaling (Supabase)
- **Database**: Automatic scaling with Supabase Pro
- **Connection Pooling**: Built-in connection pooling
- **Read Replicas**: For read-heavy workloads
- **Caching**: Redis for session management

## Maintenance

### Regular Tasks

```bash
# Weekly maintenance script
#!/bin/bash
# maintenance.sh

# Update dependencies
npm audit fix
npm update

# Clean up old deployments
vercel remove --safe --yes

# Database maintenance
psql $DATABASE_URL -c "VACUUM ANALYZE;"

# Check disk usage
df -h

# Monitor error rates
curl -s https://api.sentry.io/api/0/projects/$SENTRY_PROJECT/stats/ \
  -H "Authorization: Bearer $SENTRY_TOKEN"
```

### Monitoring Checklist

- [ ] Application uptime and response times
- [ ] Database performance and connections
- [ ] Error rates and exceptions
- [ ] User authentication flows
- [ ] File upload/download functionality
- [ ] Email delivery status
- [ ] CDN cache hit rates
- [ ] Security scan results

## 🚀 Production Setup Guide

This section provides a complete step-by-step guide for deploying HackHub to production.

### Recommended Production Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Cloudflare    │    │   Supabase.com   │    │   Monitoring    │
│    Workers      │───▶│    (Backend)     │───▶│   & Analytics   │
│   (Frontend)    │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                         │                        │
        ▼                         ▼                        ▼
   Global Edge            Database & Auth            Error Tracking
   Network (CDN)          Real-time API              Performance
   Static Assets          File Storage               Monitoring
```

### Step 1: Backend Setup (Supabase.com)

1. **Create Supabase Project**
   ```bash
   # Go to https://app.supabase.com
   # Click "New project"
   # Choose organization and region
   # Set project name: "hackhub-production"
   # Choose a strong database password
   ```

2. **Configure Database**
   ```bash
   # Get your project details
   # API URL: https://your-project.supabase.co
   # Anon key: your-anon-key (safe to expose)
   # Service role key: your-service-key (keep secret!)
   ```

3. **Apply Database Schema**
   ```bash
   # Install Supabase CLI if not already installed
   npm install -g @supabase/cli
   
   # Login to Supabase
   supabase login
   
   # Link to your remote project
   supabase link --project-ref your-project-ref
   
   # Push your local schema to production
   supabase db push
   ```

4. **Configure Authentication**
   ```bash
   # In Supabase Dashboard → Authentication → Settings
   # Set Site URL: https://your-domain.com
   # Add redirect URLs:
   # - https://your-domain.com/auth/callback
   # - https://your-domain.com/dashboard
   
   # Configure email templates in Authentication → Email Templates
   ```

5. **Set up Storage**
   ```bash
   # In Supabase Dashboard → Storage
   # Create buckets:
   # - avatars (public)
   # - team-files (private)
   # - hackathon-assets (public)
   ```

### Step 2: Frontend Setup (Cloudflare Workers)

1. **Prepare Environment**
   ```bash
   # Create production environment file
   cat > .env.production << EOF
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-production-anon-key
   VITE_APP_NAME=HackHub
   VITE_APP_ENVIRONMENT=production
   VITE_APP_VERSION=1.0.0
   VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
   VITE_SENTRY_DSN=https://your-sentry-dsn
   VITE_ENABLE_ANALYTICS=true
   VITE_ENABLE_ERROR_REPORTING=true
   EOF
   ```

2. **Deploy to Cloudflare Workers**
   ```bash
   # Option A: Via Dashboard
   # 1. Go to https://dash.cloudflare.com/workers
   # 2. Create application → Pages → Connect to Git
   # 3. Connect your GitHub repository
   # 4. Set build command: npm run build
   # 5. Set output directory: dist
   # 6. Add environment variables from .env.production
   
   # Option B: Via CLI
   npm install -g wrangler
   wrangler login
   npm run build
   wrangler pages deploy dist --project-name=hackhub
   ```

3. **Configure Custom Domain**
   ```bash
   # In Cloudflare Workers Dashboard
   # Go to Custom domains → Add custom domain
   # Add: hackhub.yourdomain.com
   # Update DNS records as instructed
   ```

### Step 3: Domain and SSL Setup

1. **DNS Configuration**
   ```bash
   # Add these DNS records to your domain:
   # CNAME hackhub -> your-pages-subdomain.pages.dev
   # or
   # A @ -> Cloudflare IP addresses (if using apex domain)
   ```

2. **SSL/TLS Settings**
   ```bash
   # In Cloudflare Dashboard → SSL/TLS
   # Set encryption mode: Full (strict)
   # Enable HSTS
   # Enable Always Use HTTPS
   ```

### Step 4: Monitoring and Analytics Setup

1. **Error Tracking (Sentry)**
   ```bash
   # Create Sentry project at https://sentry.io
   # Get your DSN and add to environment variables
   # Sentry will automatically track JavaScript errors
   ```

2. **Analytics (Google Analytics)**
   ```bash
   # Create GA4 property at https://analytics.google.com
   # Get your Measurement ID (G-XXXXXXXXXX)
   # Add to environment variables
   ```

3. **Uptime Monitoring**
   ```bash
   # Set up monitoring with services like:
   # - UptimeRobot (free)
   # - Pingdom
   # - StatusCake
   # 
   # Monitor these endpoints:
   # - https://hackhub.yourdomain.com (main site)
   # - https://your-project.supabase.co/rest/v1/ (API health)
   ```

### Step 5: Security Configuration

1. **Content Security Policy**
   ```bash
   # Add _headers file to public/ directory:
   /*
     Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co
     X-Frame-Options: DENY
     X-Content-Type-Options: nosniff
     X-XSS-Protection: 1; mode=block
     Referrer-Policy: strict-origin-when-cross-origin
   ```

2. **Environment Security**
   ```bash
   # Verify secrets are properly configured:
   # ✅ VITE_SUPABASE_ANON_KEY (safe to expose - RLS protected)
   # ❌ Service role key (never expose to frontend)
   # ❌ Database passwords (server-side only)
   ```

### Step 6: Performance Optimization

1. **Cloudflare Optimizations**
   ```bash
   # In Cloudflare Dashboard → Speed
   # Enable Auto Minify (HTML, CSS, JS)
   # Enable Brotli compression
   # Set Browser Cache TTL: 4 hours
   # Enable Always Online
   ```

2. **Image Optimization**
   ```bash
   # Enable Cloudflare Image Resizing
   # Use WebP format automatically
   # Set up appropriate caching headers
   ```

### Step 7: Backup and Recovery

1. **Database Backups**
   ```bash
   # Supabase Pro automatically backs up daily
   # For manual backups:
   pg_dump "postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres" > backup.sql
   ```

2. **Static Asset Backups**
   ```bash
   # GitHub repository serves as source backup
   # Cloudflare Workers keeps deployment history
   # Consider additional backups for critical assets
   ```

### Step 8: Go Live Checklist

Before launching to production:

- [ ] **Backend**: Supabase project configured with production data
- [ ] **Frontend**: Cloudflare Workers deployed with correct environment variables
- [ ] **Domain**: Custom domain configured with SSL
- [ ] **Database**: Schema applied, RLS policies active
- [ ] **Auth**: Email templates configured, redirect URLs set
- [ ] **Storage**: Buckets created with proper policies
- [ ] **Monitoring**: Error tracking and analytics active
- [ ] **Security**: CSP headers and security policies configured
- [ ] **Performance**: CDN and optimization settings enabled
- [ ] **Backups**: Automated backup strategy in place
- [ ] **Testing**: Full user journey tested on production

### Step 9: Post-Launch Monitoring

1. **First Week**
   ```bash
   # Monitor daily:
   # - Error rates and performance metrics
   # - User authentication flows
   # - Database performance
   # - CDN cache hit rates
   ```

2. **Ongoing Monitoring**
   ```bash
   # Weekly tasks:
   # - Review error logs
   # - Check backup status
   # - Monitor user growth
   # - Performance optimization opportunities
   ```

### Production Environment URLs

Once deployed, your production environment will have:

- **Frontend**: `https://hackhub.yourdomain.com`
- **API**: `https://your-project.supabase.co/rest/v1/`
- **Database**: `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres`
- **Storage**: `https://your-project.supabase.co/storage/v1/object/public/`
- **Auth**: `https://your-project.supabase.co/auth/v1/`

### Support and Maintenance

- **Supabase Support**: Available through their dashboard
- **Cloudflare Support**: Enterprise support available
- **Community**: GitHub issues and discussions
- **Documentation**: Always up-to-date in the `docs/` folder

---

This deployment guide ensures HackHub can be deployed reliably across different environments with proper monitoring, security, and scaling capabilities. For specific deployment questions or advanced configurations, consult the platform-specific documentation or contact our DevOps team.
