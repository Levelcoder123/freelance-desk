DOCKER := $(shell docker ps >/dev/null 2>&1 && echo docker || echo "sudo docker")
COMPOSE_DEV := $(DOCKER) compose -f docker-compose.dev.yml
COMPOSE_PROD := $(DOCKER) compose -f docker-compose.prod.yml

# Colors for output
GREEN := $(shell tput -T xterm setaf 2 2>/dev/null || echo "")
YELLOW := $(shell tput -T xterm setaf 3 2>/dev/null || echo "")
BLUE := $(shell tput -T xterm setaf 4 2>/dev/null || echo "")
RESET := $(shell tput -T xterm sgr0 2>/dev/null || echo "")

.PHONY: help dev prod up down logs clean reset build test lint migrate seed status

help:
	@echo "$(BLUE)Freelance Desk$(RESET)"
	@echo ""
	@echo "$(GREEN)Development:"
	@echo "  make dev         # Start dev environment (attached)"
	@echo "  make up          # Start dev in background"
	@echo "  make down        # Stop all containers"
	@echo "  make logs        # View logs (follow mode)"
	@echo ""
	@echo "$(GREEN)Production:"
	@echo "  make prod        # Start production in background"
	@echo "  make prod-down   # Stop production"
	@echo "  make prod-logs  # View production logs"
	@echo ""
	@echo "$(GREEN)Database:"
	@echo "  make migrate     # Run migrations"
	@echo "  make seed        # Seed database"
	@echo "  make db-shell    # Connect to PostgreSQL"
	@echo ""
	@echo "$(GREEN)Development:"
	@echo "  make test        # Run tests"
	@echo "  make lint        # Run linter"
	@echo "  make api-shell   # Shell into API container"
	@echo "  make redis-shell # Shell into Redis"
	@echo ""
	@echo "$(GREEN)Cleanup:"
	@echo "  make clean       # Stop containers (keep volumes)"
	@echo "  make reset       # Stop + remove volumes"
	@echo "  make status      # Show running containers"

# =========================
# Development
# =========================

dev:
	$(COMPOSE_DEV) up --build

up:
	$(COMPOSE_DEV) up --build -d
	@echo "$(GREEN)Services started. Run 'make logs' to view logs.$(RESET)"

down:
	$(COMPOSE_DEV) down --remove-orphans

dev-restart:
	$(COMPOSE_DEV) restart

# =========================
# Production
# =========================

prod:
	$(COMPOSE_PROD) up --build -d
	@echo "$(GREEN)Production started.$(RESET)"

prod-down:
	$(COMPOSE_PROD) down --remove-orphans

prod-logs:
	$(COMPOSE_PROD) logs -f

# =========================
# Logs & Status
# =========================

logs:
	$(COMPOSE_DEV) logs -f

logs-api:
	$(COMPOSE_DEV) logs -f api

logs-dashboard:
	$(COMPOSE_DEV) logs -f dashboard

status:
	$(COMPOSE_DEV) ps

# =========================
# Database
# =========================

migrate:
	$(COMPOSE_DEV) exec -T api npm run migrate

seed:
	$(COMPOSE_DEV) exec -T api npm run seed

db-shell:
	$(COMPOSE_DEV) exec -T postgres psql -U postgres -d freelance_db

redis-shell:
	$(COMPOSE_DEV) exec -T redis redis-cli -a $(shell grep REDIS_PASSWORD .env | cut -d= -f2)

# =========================
# Development
# =========================

test:
	$(COMPOSE_DEV) exec -T api npm test

test-unit:
	$(COMPOSE_DEV) exec -T api npm run test:unit

test-integration:
	$(COMPOSE_DEV) exec -T api npm run test:integration

test-coverage:
	$(COMPOSE_DEV) exec -T api npm run test:coverage

lint:
	$(COMPOSE_DEV) exec -T api npm run lint

api-shell:
	$(COMPOSE_DEV) exec api sh

dashboard-shell:
	$(COMPOSE_DEV) exec dashboard sh

# =========================
# Build
# =========================

build:
	$(COMPOSE_DEV) build --parallel
	@echo "$(GREEN)Build complete.$(RESET)"

build-no-cache:
	$(COMPOSE_DEV) build --no-cache --parallel

# =========================
# Cleanup
# =========================

clean:
	$(COMPOSE_DEV) down --remove-orphans

reset:
	$(COMPOSE_DEV) down -v --remove-orphans
	@echo "$(YELLOW)All volumes removed.$(RESET)"