import { query } from '../config/database.js';
import { Client } from '../types/index.js';

interface GetClientsFilters {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function getClients(userId: string, { search, status, page = 1, limit = 20 }: GetClientsFilters) {
  const offset = (page - 1) * limit;
  const params: any[] = [userId];
  let where = 'WHERE c.user_id=$1';

  if (status) { 
    params.push(status); 
    where += ` AND c.status=$${params.length}`; 
  }

  if (search) {
    params.push(search);
    where += ` AND to_tsvector('english', c.name || ' ' || COALESCE(c.company,'') || ' ' || COALESCE(c.email,''))
               @@ plainto_tsquery('english', $${params.length})`;
  }

  const limitParamIndex = params.length + 1;
  const offsetParamIndex = params.length + 2;
  params.push(limit, offset);

  const { rows } = await query(
    `SELECT c.*,
            COUNT(i.id)::int                                     AS invoice_count,
            COALESCE(SUM(i.amount) FILTER (WHERE i.status='paid'), 0)::float AS total_earned
     FROM clients c
     LEFT JOIN invoices i ON i.client_id = c.id
     ${where}
     GROUP BY c.id
     ORDER BY c.created_at DESC
     LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`,
    params
  );

  const countParams = params.slice(0, params.length - 2);
  const { rows: countRows } = await query(
    `SELECT COUNT(*)::int FROM clients c ${where}`, countParams
  );

  return {
    data: rows as Client[],
    meta: { total: countRows[0].count, page: +page, limit: +limit },
  };
}

export async function createClient(userId: string, data: Partial<Client>): Promise<Client> {
  const { name, company, email, phone, address, tags, hourly_rate, status, notes } = data;
  const { rows } = await query(
    `INSERT INTO clients(user_id,name,company,email,phone,address,tags,hourly_rate,status,notes)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [userId, name, company, email, phone, address, tags, hourly_rate, status, notes]
  );
  return rows[0];
}

export async function getClientById(userId: string, id: string): Promise<Client | null> {
  const { rows } = await query(
    `SELECT c.*,
            COALESCE(json_agg(i.*) FILTER (WHERE i.id IS NOT NULL), '[]') AS invoices
     FROM clients c
     LEFT JOIN invoices i ON i.client_id = c.id
     WHERE c.id=$1 AND c.user_id=$2
     GROUP BY c.id`,
    [id, userId]
  );
  return rows[0] || null;
}

export async function updateClient(userId: string, id: string, updates: Partial<Client>): Promise<Client | null> {
  const keys = Object.keys(updates);
  if (keys.length === 0) return getClientById(userId, id);

  const fields = keys.map((k, i) => `${k}=$${i + 3}`).join(', ');
  const { rows } = await query(
    `UPDATE clients SET ${fields} WHERE id=$1 AND user_id=$2 RETURNING *`,
    [id, userId, ...Object.values(updates)]
  );
  return rows[0] || null;
}

export async function deleteClient(userId: string, id: string): Promise<boolean> {
  const { rowCount } = await query(
    'DELETE FROM clients WHERE id=$1 AND user_id=$2',
    [id, userId]
  );
  return (rowCount ?? 0) > 0;
}
