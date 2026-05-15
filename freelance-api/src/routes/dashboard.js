import { Router } from 'express';
import { query } from '../config/database.js';
import { authenticate } from '../middleware/authenticate.js';

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);

// GET /dashboard  — single call, all stats the UI needs
dashboardRouter.get('/', async (req, res, next) => {
  try {
    const uid = req.userId;

    // Core summary (uses the view)
    const { rows: [summary] } = await query(
      'SELECT * FROM v_dashboard_summary WHERE user_id=$1', [uid]
    );

    // Monthly revenue last 6 months
    const { rows: monthly } = await query(
      `SELECT TO_CHAR(month, 'Mon') AS label, revenue, invoice_count
       FROM v_monthly_revenue
       WHERE user_id=$1 AND month >= DATE_TRUNC('month', NOW() - INTERVAL '5 months')
       ORDER BY month ASC`,
      [uid]
    );

    // Upcoming deadlines (next 14 days)
    const { rows: deadlines } = await query(
      `SELECT p.id, p.name, p.deadline, p.priority, p.progress, c.name AS client_name
       FROM projects p LEFT JOIN clients c ON c.id=p.client_id
       WHERE p.user_id=$1 AND p.deadline BETWEEN NOW() AND NOW() + INTERVAL '14 days'
         AND p.status='active'
       ORDER BY p.deadline ASC LIMIT 5`,
      [uid]
    );

    // Recent invoices (last 5)
    const { rows: recentInvoices } = await query(
      `SELECT i.id, i.invoice_number, i.amount, i.status, i.due_date, c.name AS client_name
       FROM invoices i LEFT JOIN clients c ON c.id=i.client_id
       WHERE i.user_id=$1
       ORDER BY i.created_at DESC LIMIT 5`,
      [uid]
    );

    // Overdue invoices count
    const { rows: [overdueCheck] } = await query(
      `SELECT COUNT(*) AS count FROM invoices
       WHERE user_id=$1 AND status='pending' AND due_date < NOW()`,
      [uid]
    );

    // Open invoices count (draft + pending)
    const { rows: [openCheck] } = await query(
      `SELECT COUNT(*) AS count FROM invoices
       WHERE user_id=$1 AND status IN ('draft','pending')`,
      [uid]
    );

    // Tax estimate
    const { rows: [user] } = await query(
      'SELECT monthly_goal, tax_rate, se_tax_rate FROM users WHERE id=$1', [uid]
    );

    // Expenses by category for chart
    const { rows: expensesByCategory } = await query(
      `SELECT category, SUM(amount)::float AS total
       FROM expenses WHERE user_id=$1
       GROUP BY category ORDER BY total DESC`,
      [uid]
    );

    const gross      = parseFloat(summary?.total_earned || 0);
    const expenses   = parseFloat(summary?.total_expenses || 0);
    const taxable    = Math.max(0, gross - expenses);
    const taxOwed    = taxable * ((parseFloat(user.tax_rate) + parseFloat(user.se_tax_rate)) / 100);

    res.json({
      summary: {
        ...summary,
        overdue_invoices:     parseInt(overdueCheck.count),
        open_invoices:        parseInt(openCheck.count),
        total_outstanding:    parseFloat(summary?.total_pending || 0) + parseFloat(summary?.total_overdue || 0),
        expenses_by_category: expensesByCategory,
      },
      monthly_revenue: monthly,
      deadlines,
      recent_invoices: recentInvoices,
      tax: {
        gross, expenses, taxable,
        tax_owed:    Math.round(taxOwed * 100) / 100,
        tax_rate:    user.tax_rate,
        se_tax_rate: user.se_tax_rate,
      },
      goal: {
        target:  parseFloat(user.monthly_goal),
        earned:  gross,
        percent: user.monthly_goal > 0 ? Math.min(100, Math.round((gross / user.monthly_goal) * 100)) : 0,
      },
    });
  } catch (err) { next(err); }
});