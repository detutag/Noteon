# Cloudflare Pages Deployment Guide

## Prerequisites
1. Install Wrangler CLI: `npm install -g wrangler`
2. Login to Cloudflare: `wrangler login`

## Local Development
```bash
wrangler pages dev .next --compatibility-date=2025-01-01
```

## Deploy to Production
```bash
wrangler pages deploy .next --project-name=noteon
```

## Environment Variables (Set in Cloudflare Dashboard)
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

## Build Configuration
- Build command: `npm run build`
- Build output directory: `.next`
