import { query } from '../config/database.js';
import { invoiceQueue } from '../workers/invoiceWorker.js';
import { Invoice } from '../types/index.js';

interface GetInvoicesFilters {
  status?: string;
  client_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getInvoices(userId: string, { status, client_id, search, page = 1, limit = 20 }: GetInvoicesFilters) {
  const offset = (page - 1) * limit;
  const params: any[] = [userId];
  let where = 'WHERE i.user_id=$1';

  if (status)    { params.push(status);    where += ` AND i.status=$${params.length}`; }
  if (client_id) { params.push(client_id); where += ` AND i.client_id=$${params.length}`; }
  if (search)    { params.push(`%${search}%`); where += ` AND (i.invoice_number ILIKE $${params.length} OR c.name ILIKE $${params.length})`; }

  const limitParamIndex = params.length + 1;
  const offsetParamIndex = params.length + 2;
  params.push(limit, offset);

  const { rows } = await query(
    `SELECT i.*, c.name AS client_name, c.company AS client_company, p.name AS project_name
     FROM invoices i
     LEFT JOIN clients  c ON c.id = i.client_id
     LEFT JOIN projects p ON p.id = i.project_id
     ${where}
     ORDER BY i.created_at DESC
     LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`,
    params
  );

  const cntParams = params.slice(0, params.length - 2);
  const { rows: cr } = await query(
    `SELECT COUNT(*)::int FROM invoices i LEFT JOIN clients c ON c.id = i.client_id ${where}`,
    cntParams
  );

  return {
    data: rows as Invoice[],
    meta: {
      total: cr[0].count,
      page: +page,
      limit: +limit
    }
  };
}

export async function createInvoice(userId: string, data: Partial<Invoice>): Promise<Invoice> {
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

export async function getInvoiceById(userId: string, id: string): Promise<Invoice | null> {
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
  return rows[0] || null;
}

export async function updateInvoice(userId: string, id: string, updates: Partial<Invoice>): Promise<Invoice | null> {
  const finalUpdates = { ...updates };
  // Auto-set paid_at when status → paid
  if (finalUpdates.status === 'paid') finalUpdates.paid_at = new Date();
  if (finalUpdates.status && finalUpdates.status !== 'paid') finalUpdates.paid_at = null;

  // Serialize JSONB field
  if (finalUpdates.line_items !== undefined) {
    (finalUpdates as any).line_items = JSON.stringify(finalUpdates.line_items)
  }

  const keys = Object.keys(finalUpdates);
  if (keys.length === 0) return getInvoiceById(userId, id);

  const fields = keys.map((k, i) => `${k}=$${i + 3}`).join(', ');
  const { rows } = await query(
    `UPDATE invoices SET ${fields} WHERE id=$1 AND user_id=$2 RETURNING *`,
    [id, userId, ...Object.values(finalUpdates)]
  );
  return rows[0] || null;
}

export async function deleteInvoice(userId: string, id: string): Promise<boolean> {
  const { rowCount } = await query(
    'DELETE FROM invoices WHERE id=$1 AND user_id=$2',
    [id, userId]
  );
  return (rowCount ?? 0) > 0;
}

export async function sendInvoice(userId: string, id: string): Promise<Invoice | null> {
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
