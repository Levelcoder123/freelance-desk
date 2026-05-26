import { db } from '../config/database.js';
import { projects, clients } from '../db/schema.js';
import { eq, and, sql, desc, count, or, ilike } from 'drizzle-orm';
import { Project } from '../types/index.js';

function mapProject(row: any): Project {
  if (!row) return row;
  return {
    ...row,
    budget: row.budget ? parseFloat(row.budget) : null,
  } as Project;
}

interface GetProjectsFilters {
  status?: string;
  priority?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getProjects(userId: string, { status, priority, search, page = 1, limit = 20 }: GetProjectsFilters) {
  const offset = (page - 1) * limit;

  let where = eq(projects.userId, userId);

  if (status)   { where = and(where, eq(projects.status, status)) as any; }
  if (priority) { where = and(where, eq(projects.priority, priority)) as any; }
  if (search)   { 
      where = and(
          where, 
          or(
              ilike(projects.name, `%${search}%`),
              ilike(clients.name, `%${search}%`)
          )
      ) as any; 
  }

  const result = await db.select({
      id: projects.id,
      userId: projects.userId,
      clientId: projects.clientId,
      name: projects.name,
      description: projects.description,
      status: projects.status,
      priority: projects.priority,
      progress: projects.progress,
      deadline: projects.deadline,
      budget: projects.budget,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      clientName: clients.name
  })
  .from(projects)
  .leftJoin(clients, eq(clients.id, projects.clientId))
  .where(where)
  .orderBy(projects.deadline)
  .limit(limit)
  .offset(offset);

  const [totalResult] = await db.select({ count: count() })
    .from(projects)
    .leftJoin(clients, eq(clients.id, projects.clientId))
    .where(where);

  return { data: result.map(mapProject), meta: { total: totalResult.count, page: +page, limit: +limit } };
}

export async function createProject(userId: string, data: any) {
  const result = await db.insert(projects)
    .values({ ...data, userId })
    .returning();
  return mapProject(result[0]);
}

export async function updateProject(userId: string, id: string, updates: any) {
  const { id: _, userId: __, createdAt: ___, ...cleanUpdates } = updates;
  
  const result = await db.update(projects)
    .set({ ...cleanUpdates, updatedAt: new Date() })
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .returning();
  
  return mapProject(result[0]) || null;
}

export async function deleteProject(userId: string, id: string): Promise<boolean> {
  const result = await db.delete(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .returning({ id: projects.id });
  
  return result.length > 0;
}
