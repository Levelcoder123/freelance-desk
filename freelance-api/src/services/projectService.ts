import { query } from '../config/database.js';
import { Project } from '../types/index.js';

interface GetProjectsFilters {
  status?: string;
  priority?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getProjects(userId: string, { status, priority, search, page = 1, limit = 20 }: GetProjectsFilters) {
  const offset = (page - 1) * limit;
  const params: any[] = [userId];
  let where = 'WHERE p.user_id=$1';

  if (status)   { params.push(status);        where += ` AND p.status=$${params.length}`; }
  if (priority) { params.push(priority);       where += ` AND p.priority=$${params.length}`; }
  if (search)   { params.push(`%${search}%`); where += ` AND (p.name ILIKE $${params.length} OR c.name ILIKE $${params.length})`; }

  const cntParams = [...params];
  const limitParamIndex = params.length + 1;
  const offsetParamIndex = params.length + 2;
  params.push(limit, offset);

  const { rows } = await query(
    `SELECT p.*, c.name AS client_name
     FROM projects p LEFT JOIN clients c ON c.id=p.client_id
     ${where}
     ORDER BY p.deadline ASC NULLS LAST
     LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`,
    params
  );

  const { rows: cr } = await query(
    `SELECT COUNT(*)::int FROM projects p LEFT JOIN clients c ON c.id=p.client_id ${where}`,
    cntParams
  );

  return { data: rows as Project[], meta: { total: cr[0].count, page: +page, limit: +limit } };
}

export async function createProject(userId: string, data: Partial<Project>): Promise<Project> {
  const { client_id, name, description, status, priority, progress, deadline, budget } = data;
  const { rows } = await query(
    `INSERT INTO projects(user_id,client_id,name,description,status,priority,progress,deadline,budget)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [userId, client_id, name, description, status, priority, progress, deadline, budget]
  );
  return rows[0];
}

export async function updateProject(userId: string, id: string, updates: Partial<Project>): Promise<Project | null> {
  const keys = Object.keys(updates);
  if (keys.length === 0) {
      const { rows } = await query('SELECT * FROM projects WHERE id=$1 AND user_id=$2', [id, userId]);
      return rows[0] || null;
  }

  const fields = keys.map((k, i) => `${k}=$${i + 3}`).join(', ');
  const { rows } = await query(
    `UPDATE projects SET ${fields} WHERE id=$1 AND user_id=$2 RETURNING *`,
    [id, userId, ...Object.values(updates)]
  );
  return rows[0] || null;
}

export async function deleteProject(userId: string, id: string): Promise<boolean> {
  const { rowCount } = await query(
    'DELETE FROM projects WHERE id=$1 AND user_id=$2', [id, userId]
  );
  return (rowCount ?? 0) > 0;
}
