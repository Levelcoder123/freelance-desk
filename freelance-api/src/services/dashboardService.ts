import { db } from '../config/database.js';
import { invoices, clients, projects, users, expenses } from '../db/schema.js';
import { eq, and, sql, desc, count, between, inArray, lt } from 'drizzle-orm';

export interface DashboardData {
  summary: {
    totalEarned: number;
    totalExpenses: number;
    totalPending: number;
    totalOverdue: number;
    overdueInvoices: number;
    openInvoices: number;
    totalOutstanding: number;
    expensesByCategory: { category: string; total: number }[];
    activeClients: number;
  };
  monthlyRevenue: { label: string; revenue: number; invoiceCount: number }[];
  deadlines: { id: string; name: string; deadline: Date | string; priority: string; progress: number; clientName: string }[];
  recentInvoices: { id: string; invoiceNumber: string; amount: number; status: string; dueDate: Date | string; clientName: string }[];
  tax: {
    gross: number;
    expenses: number;
    taxable: number;
    taxOwed: number;
    taxRate: number;
    seTaxRate: number;
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
    userSettings,
    clientCount
  ] = await Promise.all([
    fetchSummaryBase(userId),
    fetchMonthlyRevenue(userId),
    fetchUpcomingDeadlines(userId),
    fetchRecentInvoices(userId),
    fetchInvoiceStats(userId),
    fetchExpensesByCategory(userId),
    fetchUserSettings(userId),
    fetchClientCount(userId)
  ]);

  const gross = parseFloat(summaryBase?.total_earned || '0');
  const expenses_val = parseFloat(summaryBase?.total_expenses || '0');
  const taxable = Math.max(0, gross - expenses_val);
  const taxRate = parseFloat(userSettings.taxRate || '0');
  const seTaxRate = parseFloat(userSettings.seTaxRate || '0');
  const taxOwed = taxable * ((taxRate + seTaxRate) / 100);

  return {
    summary: {
      totalEarned: gross,
      totalExpenses: expenses_val,
      totalPending: parseFloat(summaryBase?.total_pending || '0'),
      totalOverdue: parseFloat(summaryBase?.total_overdue || '0'),
      overdueInvoices: invoiceStats.overdueCount,
      openInvoices: invoiceStats.openCount,
      totalOutstanding: parseFloat(summaryBase?.total_pending || '0') + parseFloat(summaryBase?.total_overdue || '0'),
      expensesByCategory: expensesByCategory as any,
      activeClients: clientCount
    },
    monthlyRevenue,
    deadlines: deadlines as any,
    recentInvoices: recentInvoices as any,
    tax: {
      gross,
      expenses: expenses_val,
      taxable,
      taxOwed: Math.round(taxOwed * 100) / 100,
      taxRate,
      seTaxRate,
    },
    goal: {
      target: parseFloat(userSettings.monthlyGoal || '0'),
      earned: gross,
      percent: userSettings.monthlyGoal && parseFloat(userSettings.monthlyGoal) > 0 
        ? Math.min(100, Math.round((gross / parseFloat(userSettings.monthlyGoal)) * 100)) 
        : 0,
    },
  };
}

// ── Private Helper Functions ────────────────────────────────────────

async function fetchSummaryBase(userId: string) {
  const result = await db.execute(sql`SELECT * FROM v_dashboard_summary WHERE user_id = ${userId}`);
  return result.rows[0] as any || {};
}

async function fetchMonthlyRevenue(userId: string) {
  const result = await db.execute(sql`
     SELECT TO_CHAR(month, 'Mon') AS label, revenue::float, invoice_count::int AS "invoiceCount"
     FROM v_monthly_revenue
     WHERE user_id = ${userId} AND month >= DATE_TRUNC('month', NOW() - INTERVAL '5 months')
     ORDER BY month ASC
  `);
  return result.rows as any[];
}

async function fetchUpcomingDeadlines(userId: string) {
  return db.select({
      id: projects.id,
      name: projects.name,
      deadline: projects.deadline,
      priority: projects.priority,
      progress: projects.progress,
      clientName: clients.name
  })
  .from(projects)
  .leftJoin(clients, eq(clients.id, projects.clientId))
  .where(
      and(
          eq(projects.userId, userId),
          between(projects.deadline, sql`NOW()::date`, sql`(NOW() + INTERVAL '14 days')::date`),
          eq(projects.status, 'active')
      )
  )
  .orderBy(projects.deadline)
  .limit(5);
}

async function fetchRecentInvoices(userId: string) {
  return db.select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      amount: sql<number>`${invoices.amount}::float`,
      status: invoices.status,
      dueDate: invoices.dueDate,
      clientName: clients.name
  })
  .from(invoices)
  .leftJoin(clients, eq(clients.id, invoices.clientId))
  .where(eq(invoices.userId, userId))
  .orderBy(desc(invoices.createdAt))
  .limit(5);
}

async function fetchInvoiceStats(userId: string) {
  const [overdue, open] = await Promise.all([
      db.select({ count: count() })
        .from(invoices)
        .where(
            and(
                eq(invoices.userId, userId),
                eq(invoices.status, 'pending'),
                lt(invoices.dueDate, sql`CURRENT_DATE`)
            )
        ),
      db.select({ count: count() })
        .from(invoices)
        .where(
            and(
                eq(invoices.userId, userId),
                inArray(invoices.status, ['draft', 'pending'])
            )
        )
  ]);
  
  return {
    overdueCount: overdue[0].count,
    openCount: open[0].count
  };
}

async function fetchUserSettings(userId: string) {
  const result = await db.select({
      monthlyGoal: users.monthlyGoal,
      taxRate: users.taxRate,
      seTaxRate: users.seTaxRate
  })
  .from(users)
  .where(eq(users.id, userId))
  .limit(1);
  
  return result[0] || {};
}

async function fetchExpensesByCategory(userId: string) {
  return db.select({
      category: expenses.category,
      total: sql<number>`SUM(${expenses.amount})::float`
  })
  .from(expenses)
  .where(eq(expenses.userId, userId))
  .groupBy(expenses.category)
  .orderBy(desc(sql`SUM(${expenses.amount})`));
}

async function fetchClientCount(userId: string) {
    const result = await db.select({ count: count() })
      .from(clients)
      .where(and(eq(clients.userId, userId), eq(clients.status, 'active')));
    return result[0].count;
}
