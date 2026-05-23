import { query } from '../config/database.js';

export interface DashboardData {
  summary: {
    total_earned: number;
    total_expenses: number;
    total_pending: number;
    total_overdue: number;
    overdue_invoices: number;
    open_invoices: number;
    total_outstanding: number;
    expenses_by_category: { category: string; total: number }[];
  };
  monthly_revenue: { label: string; revenue: number; invoice_count: number }[];
  deadlines: { id: string; name: string; deadline: Date; priority: string; progress: number; client_name: string }[];
  recent_invoices: { id: string; invoice_number: string; amount: number; status: string; due_date: Date; client_name: string }[];
  tax: {
    gross: number;
    expenses: number;
    taxable: number;
    tax_owed: number;
    tax_rate: number;
    se_tax_rate: number;
  };
  goal: {
    target: number;
    earned: number;
    percent: number;
  };
}

/**
 * Aggregates all data required for the user's dashboard.
 */
export async function getDashboardData(userId: string): Promise<DashboardData> {
  const [
    summaryBase,
    monthlyRevenue,
    deadlines,
    recentInvoices,
    invoiceStats,
    expensesByCategory,
    userSettings
  ] = await Promise.all([
    fetchSummaryBase(userId),
    fetchMonthlyRevenue(userId),
    fetchUpcomingDeadlines(userId),
    fetchRecentInvoices(userId),
    fetchInvoiceStats(userId),
    fetchExpensesByCategory(userId),
    fetchUserSettings(userId)
  ]);

  const gross = parseFloat(summaryBase?.total_earned || 0);
  const expenses = parseFloat(summaryBase?.total_expenses || 0);
  const taxable = Math.max(0, gross - expenses);
  const taxRate = parseFloat(userSettings.tax_rate || 0);
  const seTaxRate = parseFloat(userSettings.se_tax_rate || 0);
  const taxOwed = taxable * ((taxRate + seTaxRate) / 100);

  return {
    summary: {
      total_earned: parseFloat(summaryBase?.total_earned || 0),
      total_expenses: parseFloat(summaryBase?.total_expenses || 0),
      total_pending: parseFloat(summaryBase?.total_pending || 0),
      total_overdue: parseFloat(summaryBase?.total_overdue || 0),
      overdue_invoices: invoiceStats.overdueCount,
      open_invoices: invoiceStats.openCount,
      total_outstanding: parseFloat(summaryBase?.total_pending || 0) + parseFloat(summaryBase?.total_overdue || 0),
      expenses_by_category: expensesByCategory,
    },
    monthly_revenue: monthlyRevenue,
    deadlines,
    recent_invoices: recentInvoices,
    tax: {
      gross,
      expenses,
      taxable,
      tax_owed: Math.round(taxOwed * 100) / 100,
      tax_rate: userSettings.tax_rate,
      se_tax_rate: userSettings.se_tax_rate,
    },
    goal: {
      target: parseFloat(userSettings.monthly_goal || 0),
      earned: gross,
      percent: userSettings.monthly_goal > 0 ? Math.min(100, Math.round((gross / userSettings.monthly_goal) * 100)) : 0,
    },
  };
}

// ── Private Helper Functions ────────────────────────────────────────

async function fetchSummaryBase(userId: string) {
  const { rows } = await query('SELECT * FROM v_dashboard_summary WHERE user_id=$1', [userId]);
  return rows[0] || {};
}

async function fetchMonthlyRevenue(userId: string) {
  const { rows } = await query(
    `SELECT TO_CHAR(month, 'Mon') AS label, revenue::float, invoice_count::int
     FROM v_monthly_revenue
     WHERE user_id=$1 AND month >= DATE_TRUNC('month', NOW() - INTERVAL '5 months')
     ORDER BY month ASC`,
    [userId]
  );
  return rows;
}

async function fetchUpcomingDeadlines(userId: string) {
  const { rows } = await query(
    `SELECT p.id, p.name, p.deadline, p.priority, p.progress, c.name AS client_name
     FROM projects p LEFT JOIN clients c ON c.id=p.client_id
     WHERE p.user_id=$1 AND p.deadline BETWEEN NOW() AND NOW() + INTERVAL '14 days'
       AND p.status='active'
     ORDER BY p.deadline ASC LIMIT 5`,
    [userId]
  );
  return rows;
}

async function fetchRecentInvoices(userId: string) {
  const { rows } = await query(
    `SELECT i.id, i.invoice_number, i.amount::float, i.status, i.due_date, c.name AS client_name
     FROM invoices i LEFT JOIN clients c ON c.id=i.client_id
     WHERE i.user_id=$1
     ORDER BY i.created_at DESC LIMIT 5`,
    [userId]
  );
  return rows;
}

async function fetchInvoiceStats(userId: string) {
  const [overdue, open] = await Promise.all([
    query(`SELECT COUNT(*)::int AS count FROM invoices WHERE user_id=$1 AND status='pending' AND due_date < NOW()`, [userId]),
    query(`SELECT COUNT(*)::int AS count FROM invoices WHERE user_id=$1 AND status IN ('draft','pending')`, [userId])
  ]);
  return {
    overdueCount: overdue.rows[0].count,
    openCount: open.rows[0].count
  };
}

async function fetchUserSettings(userId: string) {
  const { rows } = await query('SELECT monthly_goal::float, tax_rate::float, se_tax_rate::float FROM users WHERE id=$1', [userId]);
  return rows[0] || {};
}

async function fetchExpensesByCategory(userId: string) {
  const { rows } = await query(
    `SELECT category, SUM(amount)::float AS total
     FROM expenses WHERE user_id=$1
     GROUP BY category ORDER BY total DESC`,
    [userId]
  );
  return rows;
}
