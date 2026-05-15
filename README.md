# Freelancer Dashboard

All-in-one dashboard for freelancers to manage clients, projects, invoices, and expenses.

## Tech Stack

| Layer       | Tech                            |
|-------------|---------------------------------|
| Frontend    | React 18 + Vite                 |
| Backend     | Node.js 20+ (ESM) + Express.js  |
| Database    | PostgreSQL 15+                  |
| Cache/Queue | Redis + BullMQ                  |
| Auth        | JWT (access + refresh rotation) |
| Validation  | Zod                             |
| Email       | Resend                          |
| Payments    | Stripe                          |
| Storage     | Cloudflare R2 / AWS S3          |
| Docker      | Docker + Docker Compose         |

## Project Structure

```
freelance_desk/
├── docker-compose.dev.yml    # Development environment
├── docker-compose.prod.yml   # Production environment
├── Makefile                  # Common commands
├── .env                      # Environment variables
│
├── freelance-api/            # Backend API
│   ├── src/
│   │   ├── index.js          # Entry point
│   │   ├── config/           # Database & Redis config
│   │   ├── db/               # Migrations
│   │   ├── middleware/       # Auth, validation, rate limiting
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Stripe, email, PDF
│   │   ├── workers/          # BullMQ background jobs
│   │   └── utils/            # Helpers
│   └── tests/                # Test files
│
└── freelance-dashboard/      # React frontend
    ├── src/
    │   ├── api/              # API client
    │   ├── components/       # Reusable UI components
    │   ├── hooks/            # Custom React hooks
    │   ├── pages/             # Page components
    │   ├── store/            # State management
    │   └── utils/            # Helpers
    └── public/               # Static assets
```

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker)
- Redis 7+ (or use Docker)

### Option 1: Run with Docker (Recommended)

```bash
# Start all services (API, frontend, DB, Redis)
docker-compose -f docker-compose.dev.yml up --build

# API runs at http://localhost:3000
# Frontend runs at http://localhost:5173
```

### Option 2: Run locally

```bash
# Backend
cd freelance-api
npm install
cp .env.example .env
# Fill in your .env values
npm run dev

# Frontend (in another terminal)
cd freelance-dashboard
npm install
npm run dev
```

### Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE freelance_db;"

# Run migrations
cd freelance-api
npm run migrate
```

## Environment Variables

Create a `.env` file in the root (copy from `.env.example`):

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | development or production |
| `PORT` | API port (default: 3000) |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Secret for JWT tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `STRIPE_SECRET_KEY` | Stripe API key |
| `RESEND_API_KEY` | Resend API key for emails |
| `R2_ACCESS_KEY` | Cloudflare R2 credentials |
| `R2_SECRET_KEY` | Cloudflare R2 credentials |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_URL` | Public URL for uploaded files |

## API Reference

### Auth
| Method | Endpoint             | Description        | Auth |
|--------|----------------------|--------------------|------|
| POST   | /api/v1/auth/register | Register new user | No   |
| POST   | /api/v1/auth/login    | Login             | No   |
| POST   | /api/v1/auth/refresh  | Refresh token     | No   |
| POST   | /api/v1/auth/logout   | Logout            | Yes  |
| GET    | /api/v1/auth/me       | Get profile       | Yes  |
| PATCH  | /api/v1/auth/me       | Update profile    | Yes  |

### Clients
| Method | Endpoint              | Description         |
|--------|-----------------------|---------------------|
| GET    | /api/v1/clients       | List + search       |
| POST   | /api/v1/clients       | Create client       |
| GET    | /api/v1/clients/:id   | Get with invoices   |
| PATCH  | /api/v1/clients/:id   | Update              |
| DELETE | /api/v1/clients/:id   | Delete              |

### Invoices
| Method | Endpoint                   | Description         |
|--------|----------------------------|---------------------|
| GET    | /api/v1/invoices           | List + filter       |
| POST   | /api/v1/invoices           | Create invoice      |
| GET    | /api/v1/invoices/:id       | Get details         |
| PATCH  | /api/v1/invoices/:id       | Update / pay        |
| DELETE | /api/v1/invoices/:id       | Delete              |
| POST   | /api/v1/invoices/:id/send  | Send to client      |

### Projects
| Method | Endpoint              | Description    |
|--------|-----------------------|----------------|
| GET    | /api/v1/projects      | List           |
| POST   | /api/v1/projects      | Create         |
| PATCH  | /api/v1/projects/:id  | Update         |
| DELETE | /api/v1/projects/:id  | Delete         |

### Expenses
| Method | Endpoint              | Description         |
|--------|-----------------------|---------------------|
| GET    | /api/v1/expenses      | List + summary      |
| POST   | /api/v1/expenses      | Log expense         |
| PATCH  | /api/v1/expenses/:id  | Update              |
| DELETE | /api/v1/expenses/:id  | Delete              |

### Dashboard
| Method | Endpoint           | Description                  |
|--------|--------------------|------------------------------|
| GET    | /api/v1/dashboard  | All stats in one request     |

## Available Scripts

From root directory using Makefile:

```bash
make dev          # Start development environment
make prod         # Start production environment
make stop         # Stop all containers
make logs         # View logs
make db-migrate   # Run database migrations
make db-reset     # Reset database (dangerous!)
```

From freelance-api:

```bash
npm run dev       # Development with nodemon
npm start         # Production
npm run migrate   # Run migrations
npm test          # Run tests
```

From freelance-dashboard:

```bash
npm run dev       # Start dev server
npm run build     # Build for production
npm run preview   # Preview production build
```

## What's Next

- [ ] Stripe service — payment links on invoices
- [ ] Resend service — invoice email delivery
- [ ] PDF worker — generate & store invoice PDFs
- [ ] BullMQ — overdue checker & reminder scheduler
- [ ] Tests — auth + invoice flows
- [ ] TypeScript migration