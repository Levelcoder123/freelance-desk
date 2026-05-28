<div align="center">
  <h1>🚀 Freelance Desk</h1>
  <p><strong>An advanced, type-safe, and highly optimized full-stack operations dashboard for freelancers.</strong></p>

  [![CI](https://github.com/Levelcoder123/freelance-desk/actions/workflows/ci.yml/badge.svg)](https://github.com/Levelcoder123/freelance-desk/actions/workflows/ci.yml)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
  [![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
</div>

<br />

Freelance Desk is a production-grade application engineered to handle the complete financial and operational lifecycle of a freelance business. It moves beyond standard CRUD apps by implementing advanced architectural patterns, background job queues, compound React components, and comprehensive CI/CD pipelines.

## ✨ Core Capabilities

- **Financial Analytics Engine:** Real-time dashboards powered by **Drizzle ORM SQL Views**, calculating gross revenue, tax obligations, overdue balances, and expense categorization dynamically.
- **Automated Invoicing Workflow:** Generates professional, fully-styled PDF invoices on the fly (via `pdfkit`) and securely delivers them as native email attachments using **Resend**.
- **Payment Integration:** One-click integration with **Stripe** to generate seamless payment links directly embedded in client emails.
- **Client & Project CRM:** Hierarchical relationships tracking clients, their associated active projects, progress states, and linked expenses.
- **Enterprise Authentication:** Highly secure, JWT-based authentication featuring robust **Access/Refresh Token Rotation** and secure password reset flows.

---

## 🏗️ Architecture & Tech Stack

The repository is structured as a tightly integrated monorepo, utilizing cutting-edge technologies chosen for performance, type safety, and scalability.

### 🛡️ Backend (`/freelance-api`)
- **Runtime:** Node.js 20+ (Strict ESM) with Express.
- **Database:** PostgreSQL configured with **Drizzle ORM** for 100% type-safe SQL queries, migrations, and schema definitions.
- **Background Processing:** **BullMQ** powered by **Redis** orchestrates asynchronous, heavy tasks (like PDF generation and network-dependent email sending) to ensure sub-100ms API response times.
- **Validation:** Strict runtime boundary checks using **Zod**.
- **Testing:** Exhaustive integration and unit testing powered by **Vitest** and **Supertest**, executing against an ephemeral isolated PostgreSQL instance.

### 🎨 Frontend (`/freelance-dashboard`)
- **Framework:** React 19 bootstrapped with Vite.
- **Component Architecture:** Designed using the **Compound Component Pattern** (e.g., `<Modal.Header>`, `<Card.Content>`) to eliminate prop-drilling and ensure massive UI reusability.
- **State Management:** **TanStack Query (React Query)** handles server state, intelligent caching (`staleTime: 30s`), and optimistic updates. **Zustand** manages local auth state.
- **Performance:** Implements aggressive **Route-based Code Splitting** (`React.lazy`) and customized Rollup manual chunking to ensure instant First Contentful Paint (FCP).
- **Design System:** Custom Vanilla CSS utilizing CSS Variables for seamless Light/Dark mode transitions, strictly adhering to **Vercel Web Interface Guidelines** for accessibility (a11y) and UX.

---

## ⚙️ CI/CD & DevOps

The project utilizes robust, automated pipelines to ensure code quality and deployment safety.

- **GitHub Actions:** Multi-job workflow running concurrently on every push and pull request.
  - **`api-ci`**: Spins up ephemeral Postgres & Redis services, runs Drizzle migrations, executes type-checking (`tsc --noEmit`), and runs the Vitest coverage suite.
  - **`dashboard-ci`**: Installs frontend dependencies, executes strict type-checking, and runs Vitest component tests (via JSDOM).
- **Containerization:** Fully Dockerized development and production environments (`Dockerfile.dev`, `docker-compose.dev.yml`).

---

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (For local tooling)

### Quick Start
The project includes a robust `Makefile` to abstract complex Docker commands.

1. **Clone & Configure:**
   ```bash
   git clone https://github.com/Levelcoder123/freelance-desk.git
   cd freelance-desk
   cp freelance-api/env.example freelance-api/.env
   # Add your Resend and Stripe API keys to .env
   ```

2. **Boot the Environment:**
   ```bash
   # Builds images and starts API, Dashboard, Postgres, and Redis
   make dev
   ```

3. **Initialize the Database:**
   ```bash
   # Applies Drizzle SQL migrations
   make migrate
   
   # Populates the database with realistic test data
   make seed
   ```

The application is now live!
- **Dashboard:** [http://localhost:5173](http://localhost:5173)
- **API Server:** [http://localhost:3000](http://localhost:3000)

### Essential Commands
| Task | Command | Description |
|------|---------|-------------|
| **Stop** | `make stop` | Halts all running containers safely. |
| **Logs** | `docker compose -f docker-compose.dev.yml logs -f api` | Tails the backend API & worker logs. |
| **Test** | `cd freelance-api && npm test` | Runs the Vitest integration suite. |
| **Wipe** | `make reset` | Destroys containers **and volumes** (wipes DB). |

---

## 🧠 AI-Driven Development
This repository is optimized for AI-assisted workflows via the Gemini CLI. It includes specialized domain-knowledge files in `.agents/skills/` to enforce standards:
- **`systematic-debugging`**: Enforces strict root-cause analysis before code modification.
- **`vercel-composition-patterns`**: Guides the AI to write scalable React compound components.
- **`postgres-drizzle`**: Ensures all database interactions use optimal ORM patterns.

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
