import { query } from '../config/database.js';

export async function getExpenses(userId, { category, year, search, page = 1, limit = 50 }) {
  const offset = (page - 1) * limit;
  const params = [userId];
  let where = 'WHERE user_id=$1';

  if (category) { params.push(category);      where += ` AND category=$${params.length}`; }
  if (year)     { params.push(year);           where += ` AND EXTRACT(YEAR FROM expense_date)=$${params.length}`; }
  if (search)   { params.push(`%${search}%`); where += ` AND description ILIKE $${params.length}`; }

  const cntParams = [...params];
  params.push(limit, offset);

  const { rows } = await query(
    `SELECT * FROM expenses ${where}
     ORDER BY expense_date DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const { rows: cr } = await query(
    `SELECT COUNT(*) FROM expenses ${where}`,
    cntParams
  );

  const { rows: summary } = await query(
    `SELECT category, SUM(amount) AS total, COUNT(*) AS count
     FROM expenses WHERE user_id=$1
     GROUP BY category ORDER BY total DESC`,
    [userId]
  );

  const total = summary.reduce((s, r) => s + parseFloat(r.total), 0);

  return {
    data: rows,
    meta: { total: parseInt(cr[0].count), page: +page, limit: +limit },
    summary,
    total,
  };
}

export async function createExpense(userId, data) {
  const { description, amount, currency, category, expense_date, notes } = data;
  const { rows } = await query(
    `INSERT INTO expenses(user_id,description,amount,currency,category,expense_date,notes)
     VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [userId, description, amount, currency, category, expense_date || new Date(), notes]
  );
  return rows[0];
}

export async function updateExpense(userId, id, updates) {
  const fields = Object.keys(updates).map((k, i) => `${k}=$${i + 3}`).join(', ');
  const { rows } = await query(
    `UPDATE expenses SET ${fields} WHERE id=$1 AND user_id=$2 RETURNING *`,
    [id, userId, ...Object.values(updates)]
  );
  return rows[0];
}

export async function deleteExpense(userId, id) {
  const { rowCount } = await query(
    'DELETE FROM expenses WHERE id=$1 AND user_id=$2', [id, userId]
  );
  return rowCount > 0;
}
