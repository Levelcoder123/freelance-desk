import { query } from '../config/database.js';

export async function getClients(userId, { search, status, page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;
  const params = [userId];
  let where = 'WHERE c.user_id=$1';

  if (status) { params.push(status); where += ` AND c.status=$${params.length}`; }

  if (search) {
    params.push(search);
    where += ` AND to_tsvector('english', c.name || ' ' || COALESCE(c.company,'') || ' ' || COALESCE(c.email,''))
               @@ plainto_tsquery('english', $${params.length})`;
  }

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT c.*,
            COUNT(i.id)                                          AS invoice_count,
            COALESCE(SUM(i.amount) FILTER (WHERE i.status='paid'), 0) AS total_earned
     FROM clients c
     LEFT JOIN invoices i ON i.client_id = c.id
     ${where}
     GROUP BY c.id
     ORDER BY c.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const countParams = params.slice(0, params.length - 2);
  const { rows: countRows } = await query(
    `SELECT COUNT(*) FROM clients c ${where}`, countParams
  );

  return {
    data: rows,
    meta: { total: parseInt(countRows[0].count), page: +page, limit: +limit },
  };
}

export async function createClient(userId, data) {
  const { name, company, email, phone, address, tags, hourly_rate, status, notes } = data;
  const { rows } = await query(
    `INSERT INTO clients(user_id,name,company,email,phone,address,tags,hourly_rate,status,notes)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [userId, name, company, email, phone, address, tags, hourly_rate, status, notes]
  );
  return rows[0];
}

export async function getClientById(userId, id) {
  const { rows } = await query(
    `SELECT c.*,
            COALESCE(json_agg(i.*) FILTER (WHERE i.id IS NOT NULL), '[]') AS invoices
     FROM clients c
     LEFT JOIN invoices i ON i.client_id = c.id
     WHERE c.id=$1 AND c.user_id=$2
     GROUP BY c.id`,
    [id, userId]
  );
  return rows[0];
}

export async function updateClient(userId, id, updates) {
  const fields = Object.keys(updates).map((k, i) => `${k}=$${i + 3}`).join(', ');
  const { rows } = await query(
    `UPDATE clients SET ${fields} WHERE id=$1 AND user_id=$2 RETURNING *`,
    [id, userId, ...Object.values(updates)]
  );
  return rows[0];
}

export async function deleteClient(userId, id) {
  const { rowCount } = await query(
    'DELETE FROM clients WHERE id=$1 AND user_id=$2',
    [id, userId]
  );
  return rowCount > 0;
}
