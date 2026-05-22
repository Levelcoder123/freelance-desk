import { query } from '../config/database.js';

export async function getProjects(userId, { status, priority, search, page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;
  const params = [userId];
  let where = 'WHERE p.user_id=$1';

  if (status)   { params.push(status);        where += ` AND p.status=$${params.length}`; }
  if (priority) { params.push(priority);       where += ` AND p.priority=$${params.length}`; }
  if (search)   { params.push(`%${search}%`); where += ` AND (p.name ILIKE $${params.length} OR c.name ILIKE $${params.length})`; }

  const cntParams = [...params];
  params.push(limit, offset);

  const { rows } = await query(
    `SELECT p.*, c.name AS client_name
     FROM projects p LEFT JOIN clients c ON c.id=p.client_id
     ${where}
     ORDER BY p.deadline ASC NULLS LAST
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const { rows: cr } = await query(
    `SELECT COUNT(*) FROM projects p LEFT JOIN clients c ON c.id=p.client_id ${where}`,
    cntParams
  );

  return { data: rows, meta: { total: parseInt(cr[0].count), page: +page, limit: +limit } };
}

export async function createProject(userId, data) {
  const { client_id, name, description, status, priority, progress, deadline, budget } = data;
  const { rows } = await query(
    `INSERT INTO projects(user_id,client_id,name,description,status,priority,progress,deadline,budget)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [userId, client_id, name, description, status, priority, progress, deadline, budget]
  );
  return rows[0];
}

export async function updateProject(userId, id, updates) {
  const fields = Object.keys(updates).map((k, i) => `${k}=$${i + 3}`).join(', ');
  const { rows } = await query(
    `UPDATE projects SET ${fields} WHERE id=$1 AND user_id=$2 RETURNING *`,
    [id, userId, ...Object.values(updates)]
  );
  return rows[0];
}

export async function deleteProject(userId, id) {
  const { rowCount } = await query(
    'DELETE FROM projects WHERE id=$1 AND user_id=$2', [id, userId]
  );
  return rowCount > 0;
}
