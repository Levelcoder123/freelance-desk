import { query } from '../config/database.js';
import { invoiceQueue } from '../workers/invoiceWorker.js';

export async function getInvoices(userId, { status, client_id, search, page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;
  const params = [userId];
  let where = 'WHERE i.user_id=$1';

  if (status)    { params.push(status);    where += ` AND i.status=$${params.length}`; }
  if (client_id) { params.push(client_id); where += ` AND i.client_id=$${params.length}`; }
  if (search)    { params.push(`%${search}%`); where += ` AND (i.invoice_number ILIKE $${params.length} OR c.name ILIKE $${params.length})`; }

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT i.*, c.name AS client_name, c.company AS client_company, p.name AS project_name
     FROM invoices i
     LEFT JOIN clients  c ON c.id = i.client_id
     LEFT JOIN projects p ON p.id = i.project_id
     ${where}
     ORDER BY i.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const cntParams = params.slice(0, params.length - 2);
  const { rows: cr } = await query(
    `SELECT COUNT(*) FROM invoices i LEFT JOIN clients c ON c.id = i.client_id ${where}`,
    cntParams
  );

  return {
    data: rows,
    meta: {
      total: parseInt(cr[0].count),
      page: +page,
      limit: +limit
    }
  };
}

export async function createInvoice(userId, data) {
  const {
    client_id, project_id, invoice_number, status, amount,
    currency, tax_rate, issue_date, due_date, notes, line_items,
  } = data;

  const finalIssueDate = issue_date || new Date().toISOString().slice(0, 10);

  const { rows } = await query(
    `INSERT INTO invoices
       (user_id,client_id,project_id,invoice_number,status,amount,currency,tax_rate,issue_date,due_date,notes,line_items)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [userId, client_id, project_id, invoice_number, status, amount,
      currency, tax_rate, finalIssueDate, due_date, notes, JSON.stringify(line_items)]
  );
  return rows[0];
}

export async function getInvoiceById(userId, id) {
  const { rows } = await query(
    `SELECT i.*, c.name AS client_name, c.email AS client_email,
            c.company AS client_company, c.address AS client_address,
            p.name AS project_name
     FROM invoices i
     LEFT JOIN clients  c ON c.id = i.client_id
     LEFT JOIN projects p ON p.id = i.project_id
     WHERE i.id=$1 AND i.user_id=$2`,
    [id, userId]
  );
  return rows[0];
}

export async function updateInvoice(userId, id, updates) {
  // Auto-set paid_at when status → paid
  if (updates.status === 'paid') updates.paid_at = new Date().toISOString();
  if (updates.status && updates.status !== 'paid') updates.paid_at = null;

  // Serialize JSONB field
  if (updates.line_items !== undefined) {
    updates.line_items = JSON.stringify(updates.line_items)
  }

  const fields = Object.keys(updates).map((k, i) => `${k}=$${i + 3}`).join(', ');
  const { rows } = await query(
    `UPDATE invoices SET ${fields} WHERE id=$1 AND user_id=$2 RETURNING *`,
    [id, userId, ...Object.values(updates)]
  );
  return rows[0];
}

export async function deleteInvoice(userId, id) {
  const { rowCount } = await query(
    'DELETE FROM invoices WHERE id=$1 AND user_id=$2',
    [id, userId]
  );
  return rowCount > 0;
}

export async function sendInvoice(userId, id) {
  const { rows } = await query(
    `SELECT i.*, c.email AS client_email, c.name AS client_name
     FROM invoices i LEFT JOIN clients c ON c.id=i.client_id
     WHERE i.id=$1 AND i.user_id=$2`,
    [id, userId]
  );
  if (!rows[0]) return null;

  await invoiceQueue.add('send-invoice', { invoiceId: id });
  await query(`UPDATE invoices SET status='pending' WHERE id=$1`, [id]);
  return rows[0];
}
