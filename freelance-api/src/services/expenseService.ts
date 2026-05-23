import { query } from '../config/database.js';
import { Expense } from '../types/index.js';

interface GetExpensesFilters {
  category?: string;
  year?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface ExpenseSummary {
  category: string;
  total: number;
  count: number;
}

export async function getExpenses(userId: string, { category, year, search, page = 1, limit = 50 }: GetExpensesFilters) {
  const offset = (page - 1) * limit;
  const params: any[] = [userId];
  let where = 'WHERE user_id=$1';

  if (category) { params.push(category);      where += ` AND category=$${params.length}`; }
  if (year)     { params.push(year);           where += ` AND EXTRACT(YEAR FROM expense_date)=$${params.length}`; }
  if (search)   { params.push(`%${search}%`); where += ` AND description ILIKE $${params.length}`; }

  const cntParams = [...params];
  const limitParamIndex = params.length + 1;
  const offsetParamIndex = params.length + 2;
  params.push(limit, offset);

  const { rows } = await query(
    `SELECT * FROM expenses ${where}
     ORDER BY expense_date DESC
     LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`,
    params
  );

  const { rows: cr } = await query(
    `SELECT COUNT(*)::int FROM expenses ${where}`,
    cntParams
  );

  const { rows: summaryRows } = await query(
    `SELECT category, SUM(amount)::float AS total, COUNT(*)::int AS count
     FROM expenses WHERE user_id=$1
     GROUP BY category ORDER BY total DESC`,
    [userId]
  );

  const summary = summaryRows as ExpenseSummary[];
  const total = summary.reduce((s, r) => s + r.total, 0);

  return {
    data: rows as Expense[],
    meta: { total: cr[0].count, page: +page, limit: +limit },
    summary,
    total,
  };
}

export async function createExpense(userId: string, data: Partial<Expense>): Promise<Expense> {
  const { description, amount, currency, category, expense_date, notes } = data;
  const { rows } = await query(
    `INSERT INTO expenses(user_id,description,amount,currency,category,expense_date,notes)
     VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [userId, description, amount, currency, category, expense_date || new Date(), notes]
  );
  return rows[0];
}

export async function updateExpense(userId: string, id: string, updates: Partial<Expense>): Promise<Expense | null> {
  const keys = Object.keys(updates);
  if (keys.length === 0) {
      const { rows } = await query('SELECT * FROM expenses WHERE id=$1 AND user_id=$2', [id, userId]);
      return rows[0] || null;
  }

  const fields = keys.map((k, i) => `${k}=$${i + 3}`).join(', ');
  const { rows } = await query(
    `UPDATE expenses SET ${fields} WHERE id=$1 AND user_id=$2 RETURNING *`,
    [id, userId, ...Object.values(updates)]
  );
  return rows[0] || null;
}

export async function deleteExpense(userId: string, id: string): Promise<boolean> {
  const { rowCount } = await query(
    'DELETE FROM expenses WHERE id=$1 AND user_id=$2', [id, userId]
  );
  return (rowCount ?? 0) > 0;
}
