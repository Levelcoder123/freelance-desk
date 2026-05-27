import { pgTable, uuid, varchar, numeric, text, timestamp, boolean, integer, date, jsonb, index, unique, check, pgView } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  plan: varchar('plan', { length: 20 }).notNull().default('free'),
  monthlyGoal: numeric('monthly_goal', { precision: 12, scale: 2 }).default('10000'),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('25.00'),
  seTaxRate: numeric('se_tax_rate', { precision: 5, scale: 2 }).default('15.30'),
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revoked: boolean('revoked').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIndex: index('idx_refresh_tokens_user').on(table.userId),
}));

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  company: varchar('company', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  tags: text('tags').array().default(sql`'{}'::text[]`),
  hourlyRate: numeric('hourly_rate', { precision: 10, scale: 2 }),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIndex: index('idx_clients_user').on(table.userId),
  userStatusIndex: index('idx_clients_status').on(table.userId, table.status),
}));

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  priority: varchar('priority', { length: 10 }).notNull().default('medium'),
  progress: integer('progress').notNull().default(0),
  deadline: date('deadline'),
  budget: numeric('budget', { precision: 12, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIndex: index('idx_projects_user').on(table.userId),
  clientIndex: index('idx_projects_client').on(table.clientId),
  deadlineIndex: index('idx_projects_deadline').on(table.userId, table.deadline),
  progressCheck: check('progress_check', sql`progress BETWEEN 0 AND 100`),
}));

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'set null' }),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('0'),
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }), // This is generated in SQL
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }), // This is generated in SQL
  issueDate: date('issue_date').notNull().default(sql`CURRENT_DATE`),
  dueDate: date('due_date'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  notes: text('notes'),
  pdfUrl: text('pdf_url'),
  stripePaymentLink: varchar('stripe_payment_link', { length: 500 }),
  lineItems: jsonb('line_items').default('[]'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userInvoiceUnique: unique('invoices_user_id_invoice_number_unique').on(table.userId, table.invoiceNumber),
  userIndex: index('idx_invoices_user').on(table.userId),
  clientIndex: index('idx_invoices_client').on(table.clientId),
  statusIndex: index('idx_invoices_status').on(table.userId, table.status),
  dueIndex: index('idx_invoices_due').on(table.dueDate),
  amountCheck: check('amount_check', sql`amount >= 0`),
}));

export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
  description: varchar('description', { length: 255 }).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD'),
  category: varchar('category', { length: 50 }).notNull().default('Other'),
  expenseDate: date('expense_date').notNull().default(sql`CURRENT_DATE`),
  receiptUrl: text('receipt_url'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIndex: index('idx_expenses_user').on(table.userId),
  categoryIndex: index('idx_expenses_category').on(table.userId, table.category),
  dateIndex: index('idx_expenses_date').on(table.userId, table.expenseDate),
  projectIndex: index('idx_expenses_project').on(table.projectId),
  amountCheck: check('amount_check', sql`amount >= 0`),
}));

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIndex: index('idx_password_reset_tokens_user').on(table.userId),
  validTokenIndex: index('idx_password_reset_tokens_valid').on(table.token, table.expiresAt).where(sql`used_at IS NULL`),
}));

// Views (Mapped to existing views)
export const dashboardSummaryView = pgView('v_dashboard_summary', {
  userId: uuid('user_id'),
  activeClients: integer('active_clients'),
  totalInvoices: integer('total_invoices'),
  totalEarned: numeric('total_earned'),
  totalPending: numeric('total_pending'),
  totalOverdue: numeric('total_overdue'),
  totalExpenses: numeric('total_expenses'),
}).existing();

export const monthlyRevenueView = pgView('v_monthly_revenue', {
  userId: uuid('user_id'),
  month: timestamp('month'),
  revenue: numeric('revenue'),
  invoiceCount: integer('invoice_count'),
}).existing();
