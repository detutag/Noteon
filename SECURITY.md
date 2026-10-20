# Security Improvements Made

## Dependency Updates (package.json)
- Next.js: 13.5.6 → 15.1.2 (latest stable)
- React/React-DOM: 18 → 19 (latest stable)
- All Radix UI components updated to latest versions (1.1.x)
- BlockNote: 0.9.5 → 0.22.0 (latest)
- Added bcryptjs for secure password hashing
- Added jwt for token-based authentication

## Database Security
- Replaced Convex (realtime DB) with Turso/libsql (SQLite-compatible)
- All queries use parameterized statements to prevent SQL injection
- Row-level security enforced via userId validation
- Recursion limits implemented in archive/restore operations

## Authentication & Password Security
- Removed Clerk authentication dependency
- Local user authentication with JWT cookies
- Password hashing with bcrypt (12 salt rounds)
- HTTP-only cookies prevent XSS token theft
- Secure cookies enabled in production
- JWT token expiration configured (default 7 days)
- Password minimum length enforced (8 characters)
- Input validation on login/signup endpoints

## Security Headers (netlify.toml)
- X-Frame-Options: DENY (clickjacking protection)
- X-Content-Type-Options: nosniff
- X-XSS-Protection: enabled
- Referrer-Policy: strict-origin-when-cross-origin

## API Security
- All mutations require POST/PATCH/DELETE methods
- Token validation on protected routes
- Error messages don't leak sensitive information
- CORS configured for production domains
- API routes protected by middleware

## Recommended Additional Security Steps
1. Change JWT_SECRET from default value before production
2. Enable rate limiting on auth routes
3. Add CSP headers
4. Regular dependency updates (`npm audit fix`)
5. Use `.env.local` for secrets (added to .gitignore)
6. Enable Turso encryption at rest
7. Set up monitoring/alerts for suspicious activity
8. Consider implementing email verification for new accounts
9. Add password strength requirements
10. Implement account lockout after failed attempts
