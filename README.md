# Freelance Desk

A professional, full-stack, type-safe dashboard for freelancers to manage clients, projects, invoices, and expenses. Built with modern web technologies and a focus on developer experience and AI-assisted development.

## 🚀 Tech Stack

### Backend
- **Node.js (ESM)** & **Express.js**
- **TypeScript** (100% type-safe)
- **Drizzle ORM** for type-safe database access
- **PostgreSQL** for persistent storage
- **Redis** & **BullMQ** for background job processing
- **Zod** for schema validation
- **PDFKit** for professional invoice generation
- **Resend** for transactional emails
- **Stripe** for payment integration

### Frontend
- **React 19**
- **TypeScript**
- **Vite** for ultra-fast builds
- **TanStack Query** (React Query) for state management
- **Recharts** for interactive financial analytics
- **Vanilla CSS** for flexible, lightweight styling

### Infrastructure & Tooling
- **Docker** & **Docker Compose** for consistent environments
- **Makefile** for common developer tasks
- **Agent Skills** system for AI-driven code quality and debugging

## 📂 Project Structure

```
freelance_desk/
├── .agents/                  # Installed agent skills
├── freelance-api/            # Backend API (TypeScript + Drizzle)
│   ├── src/
│   │   ├── index.ts          # ESM Entry point
│   │   ├── config/           # Database, Redis & Auth config
│   │   ├── db/               # Drizzle schema & migrations
│   │   ├── middleware/       # Auth, validation, error handling
│   │   ├── routes/           # REST API endpoints
│   │   ├── services/         # Business logic (Stripe, Email, PDF, etc.)
│   │   ├── workers/          # BullMQ background workers
│   │   └── validations/      # Zod validation schemas
│   └── tests/                # Integration & Unit tests
│
└── freelance-dashboard/      # React Frontend (TypeScript + Vite)
    ├── src/
    │   ├── api/              # API abstraction layer
    │   ├── components/       # Reusable UI components
    │   ├── hooks/            # Custom React hooks
    │   ├── pages/            # View components
    │   ├── types/            # Shared TypeScript interfaces
    │   └── utils/            # Formatting & Date helpers
```

## 🛠️ Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)
- A `.env` file (see `.env.example`)

### 1. Launch with Docker (Recommended)
The easiest way to start is using the provided Makefile:

```bash
# Build and start all services (API, Dashboard, PG, Redis)
make dev

# Run database migrations
make migrate

# Seed with professional demo data
make seed
```

- **Dashboard:** [http://localhost:5173](http://localhost:5173)
- **API:** [http://localhost:3000](http://localhost:3000)

### 2. Manual Commands
| Task | Command |
|------|---------|
| Stop all containers | `make stop` |
| View logs | `make logs` |
| Build for production | `make prod` |
| Run Type Check | `cd freelance-api && npx tsc --noEmit` |

## 📦 Features & Capabilities

- **Authentication:** Secure JWT-based auth with access/refresh token rotation.
- **Client CRM:** Manage client profiles, contact info, and hourly rates.
- **Project Tracking:** Link expenses and invoices to specific projects with progress bars.
- **Invoicing System:** 
    - Automated PDF generation.
    - Direct "Send to Client" via Resend.
    - One-click Stripe payment links.
- **Expense Management:** Category-based tracking with project associations.
- **Financial Analytics:** Real-time dashboard showing revenue vs. expenses, tax estimates, and monthly goals.

## 🤖 AI Development
This project is optimized for AI-assisted development. It includes specialized skills in `.agents/skills/` for:
- **`systematic-debugging`**: Rigorous root-cause analysis.
- **`typescript-react-reviewer`**: High-quality code audits.
- **`postgres-drizzle`**: Database optimization.
- **`web-design-guidelines`**: Accessibility and UX excellence.

## 📜 License
MIT
