# Freelancer Dashboard - Codebase Context

## Project Overview

A full-stack freelancer management dashboard consisting of:
- **freelance-api**: Node.js/Express REST API
- **freelance-dashboard**: React + Vite frontend

## Tech Stack

- **Backend**: Node.js 20+, Express.js, PostgreSQL, Redis + BullMQ
- **Frontend**: React 18, Vite, CSS (no framework)
- **Auth**: JWT with access + refresh token rotation
- **Validation**: Zod
- **Payments**: Stripe integration planned
- **Email**: Resend integration planned
- **Storage**: Cloudflare R2 / AWS S3 planned

## Key Conventions

### Backend (freelance-api)
- ES modules (type: "module" in package.json)
- Routes in `src/routes/`, middleware in `src/middleware/`
- Zod schemas for request validation
- PostgreSQL with raw SQL migrations (not ORM)
- Redis for caching and BullMQ job queue

### Frontend (freelance-dashboard)
- React functional components with hooks
- Custom API client in `src/api/`
- CSS in `src/index.css` (no CSS framework)
- State management in `src/store/`

### API Routes
- All routes prefixed with `/api/v1/`
- Auth routes: `/api/v1/auth/*`
- Resources: `/api/v1/clients`, `/api/v1/invoices`, `/api/v1/projects`, `/api/v1/expenses`
- Dashboard: `/api/v1/dashboard`

## Development

```bash
# Docker (recommended)
docker-compose -f docker-compose.dev.yml up --build

# Local development
cd freelance-api && npm run dev
cd freelance-dashboard && npm run dev
```

## Database

Migrations are SQL files in `freelance-api/src/db/migrations/`. Run with:
```bash
cd freelance-api && npm run migrate
```

## Testing

Tests are in `freelance-api/tests/`. Test framework not yet configured.

## Common Issues

- Ensure PostgreSQL and Redis are running before starting API
- Frontend expects API at `http://localhost:3000`
- JWT tokens expire (check refresh token flow for long sessions)