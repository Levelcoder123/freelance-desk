-- ─────────────────────────────────────────────
--  EXTENSIONS
-- ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- for fuzzy search

-- ─────────────────────────────────────────────
--  USERS
-- ─────────────────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  plan          VARCHAR(20)  NOT NULL DEFAULT 'free', -- free | pro | team
  monthly_goal  NUMERIC(12,2)        DEFAULT 10000,
  tax_rate      NUMERIC(5,2)         DEFAULT 25.0,
  se_tax_rate   NUMERIC(5,2)         DEFAULT 15.3,
  timezone      VARCHAR(50)          DEFAULT 'UTC',
  created_at    TIMESTAMPTZ          DEFAULT NOW(),
  updated_at    TIMESTAMPTZ          DEFAULT NOW()
);

-- ─────────────────────────────────────────────
--  REFRESH TOKENS  (for JWT rotation)
-- ─────────────────────────────────────────────
CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked    BOOLEAN     DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

-- ─────────────────────────────────────────────
--  CLIENTS
-- ─────────────────────────────────────────────
CREATE TABLE clients (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         VARCHAR(255) NOT NULL,
  company      VARCHAR(255),
  email        VARCHAR(255),
  phone        VARCHAR(50),
  address      TEXT,
  tags         TEXT[]       DEFAULT '{}',
  hourly_rate  NUMERIC(10,2),
  status       VARCHAR(20)  NOT NULL DEFAULT 'active', -- active | inactive
  notes        TEXT,
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX idx_clients_user    ON clients(user_id);
CREATE INDEX idx_clients_status  ON clients(user_id, status);
-- Full-text search index
CREATE INDEX idx_clients_search  ON clients USING gin(
  to_tsvector('english', name || ' ' || COALESCE(company,'') || ' ' || COALESCE(email,''))
);

-- ─────────────────────────────────────────────
--  PROJECTS
-- ─────────────────────────────────────────────
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  status      VARCHAR(20)  NOT NULL DEFAULT 'active', -- active | completed | paused
  priority    VARCHAR(10)  NOT NULL DEFAULT 'medium', -- low | medium | high
  progress    INTEGER      NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  deadline    DATE,
  budget      NUMERIC(12,2),
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX idx_projects_user      ON projects(user_id);
CREATE INDEX idx_projects_client    ON projects(client_id);
CREATE INDEX idx_projects_deadline  ON projects(user_id, deadline);

-- ─────────────────────────────────────────────
--  INVOICES
-- ─────────────────────────────────────────────
CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
  invoice_number  VARCHAR(50) NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft|pending|paid|overdue|cancelled
  amount          NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency        CHAR(3)       NOT NULL DEFAULT 'USD',
  tax_rate        NUMERIC(5,2)  DEFAULT 0,
  tax_amount      NUMERIC(12,2) GENERATED ALWAYS AS (amount * tax_rate / 100) STORED,
  total_amount    NUMERIC(12,2) GENERATED ALWAYS AS (amount + (amount * tax_rate / 100)) STORED,
  issue_date      DATE          NOT NULL DEFAULT CURRENT_DATE,
  due_date        DATE,
  paid_at         TIMESTAMPTZ,
  notes           TEXT,
  pdf_url         TEXT,                   -- S3/R2 URL after generation
  stripe_payment_link VARCHAR(500),
  line_items      JSONB         DEFAULT '[]', -- [{desc, qty, rate, amount}]
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(user_id, invoice_number)
);
CREATE INDEX idx_invoices_user    ON invoices(user_id);
CREATE INDEX idx_invoices_client  ON invoices(client_id);
CREATE INDEX idx_invoices_status  ON invoices(user_id, status);
CREATE INDEX idx_invoices_due     ON invoices(due_date) WHERE status IN ('pending','overdue');

-- ─────────────────────────────────────────────
--  EXPENSES
-- ─────────────────────────────────────────────
CREATE TABLE expenses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  amount      NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency    CHAR(3)       DEFAULT 'USD',
  category    VARCHAR(50)   NOT NULL DEFAULT 'Other',
  expense_date DATE         NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ   DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   DEFAULT NOW()
);
CREATE INDEX idx_expenses_user     ON expenses(user_id);
CREATE INDEX idx_expenses_category ON expenses(user_id, category);
CREATE INDEX idx_expenses_date     ON expenses(user_id, expense_date);

-- ─────────────────────────────────────────────
--  AUTO-UPDATE updated_at TRIGGER
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at     BEFORE UPDATE ON users     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_clients_updated_at   BEFORE UPDATE ON clients   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_projects_updated_at  BEFORE UPDATE ON projects  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_invoices_updated_at  BEFORE UPDATE ON invoices  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_expenses_updated_at  BEFORE UPDATE ON expenses  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────
--  USEFUL VIEWS
-- ─────────────────────────────────────────────

-- Dashboard summary per user
CREATE VIEW v_dashboard_summary AS
SELECT
  u.id AS user_id,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active')       AS active_clients,
  COUNT(DISTINCT i.id)                                            AS total_invoices,
  COALESCE(SUM(i.amount) FILTER (WHERE i.status = 'paid'), 0)   AS total_earned,
  COALESCE(SUM(i.amount) FILTER (WHERE i.status = 'pending'), 0) AS total_pending,
  COALESCE(SUM(i.amount) FILTER (WHERE i.status = 'overdue'), 0) AS total_overdue,
  COALESCE(SUM(e.amount), 0)                                      AS total_expenses
FROM users u
LEFT JOIN clients  c ON c.user_id = u.id
LEFT JOIN invoices i ON i.user_id = u.id
LEFT JOIN expenses e ON e.user_id = u.id
GROUP BY u.id;

-- Monthly revenue (last 12 months)
CREATE VIEW v_monthly_revenue AS
SELECT
  user_id,
  DATE_TRUNC('month', paid_at) AS month,
  SUM(amount)                   AS revenue,
  COUNT(*)                      AS invoice_count
FROM invoices
WHERE status = 'paid' AND paid_at IS NOT NULL
GROUP BY user_id, DATE_TRUNC('month', paid_at);