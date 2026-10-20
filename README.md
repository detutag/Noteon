# Noteon

A modern, self-hosted Notion-like note-taking application built with Next.js 15, React 19, and Turso/libsql.

## Features

- ✨ Real-time document editing with BlockNote
- 🌙 Light / dark / system theme support
- 🔐 Local user authentication with bcrypt password hashing
- 💾 Self-hosted database with Turso/libsql
- 🚀 Deploy to Netlify or Cloudflare Pages
- 📱 Responsive design
- 🎨 Notion-like editor experience

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **UI Components:** Radix UI, Tailwind CSS, Shadcn/ui
- **Editor:** BlockNote
- **State Management:** Zustand
- **Authentication:** JWT with bcrypt password hashing
- **Database:** Turso/libsql (SQLite-compatible)
- **Deployment:** Netlify / Cloudflare Pages

## Quick Start

### 1. Clone and Install Dependencies
```bash
# Clone from GitHub or download the repository
cd Noteon
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Required variables:
- `JWT_SECRET` - Generate with: `openssl rand -base64 32`
- `JWT_EXPIRES_IN` - Token expiration (default: 7d)
- `TURSO_DATABASE_URL` - Your Turso/libsql connection string
- `TURSO_AUTH_TOKEN` - Your Turso auth token

### 3. Set Up Turso Database
1. Install Turso CLI: `npm install -g @libsql/turso`
2. Create database: `turso db create noteon`
3. Get connection URL: `turso db show noteon --url`
4. Add to `.env.local`

### 4. Run Development Server
```bash
npm run dev
# Open http://localhost:3000
```

## Authentication

This app uses local user authentication with:
- Password hashing with bcrypt (12 rounds)
- JWT tokens stored in HTTP-only cookies
- Automatic token validation on protected routes

To create a user, visit `/sign-up` and register with your email and password.

## Deployment

### Netlify
1. Push to GitHub
2. Import project in Netlify
3. Set environment variables
4. Deploy

Build command: `npm run build`  
Publish directory: `.next`

### Cloudflare Pages
1. Install Wrangler: `npm install -g wrangler`
2. Login: `wrangler login`
3. Deploy: `wrangler pages deploy .next --project-name=noteon`

Environment variables are set in the Cloudflare dashboard.

## Security

See [SECURITY.md](SECURITY.md) for security details and recommendations.

## License

MIT © detutag
