import { db } from '../config/database.js';
import { clients, invoices } from '../db/schema.js';
import { eq, and, sql, desc, count, or, ilike } from 'drizzle-orm';
import { Client } from '../types/index.js';

function mapClient(row: any): Client {
  if (!row) return row;
  return {
    ...row,
    hourlyRate: row.hourlyRate ? parseFloat(row.hourlyRate) : null,
    totalEarned: row.totalEarned ? parseFloat(row.totalEarned) : 0,
  } as Client;
}

interface GetClientsFilters {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function getClients(userId: string, { search, status, page = 1, limit = 20 }: GetClientsFilters) {
  const offset = (page - 1) * limit;

  let where = eq(clients.userId, userId);

  if (status) {
    where = and(where, eq(clients.status, status)) as any;
  }

  if (search) {
      where = and(
          where,
          or(
              ilike(clients.name, `%${search}%`),
              ilike(clients.company, `%${search}%`),
              ilike(clients.email, `%${search}%`)
          )
      ) as any;
  }

  const result = await db.select({
      id: clients.id,
      name: clients.name,
      company: clients.company,
      email: clients.email,
      phone: clients.phone,
      status: clients.status,
      hourlyRate: clients.hourlyRate,
      createdAt: clients.createdAt,
      invoiceCount: sql<number>`count(${invoices.id})::int`,
      totalEarned: sql<number>`coalesce(sum(${invoices.amount}) filter (where ${invoices.status} = 'paid'), 0)::float`
  })
  .from(clients)
  .leftJoin(invoices, eq(invoices.clientId, clients.id))
  .where(where)
  .groupBy(clients.id)
  .orderBy(desc(clients.createdAt))
  .limit(limit)
  .offset(offset);

  const [totalResult] = await db.select({ count: count() })
    .from(clients)
    .where(where);

  return {
    data: result.map(mapClient),
    meta: { total: totalResult.count, page: +page, limit: +limit },
  };
}

export async function createClient(userId: string, data: any) {
  const result = await db.insert(clients)
    .values({ ...data, userId })
    .returning();
  return mapClient(result[0]);
}

export async function getClientById(userId: string, id: string) {
  const result = await db.select({
      id: clients.id,
      userId: clients.userId,
      name: clients.name,
      company: clients.company,
      email: clients.email,
      phone: clients.phone,
      address: clients.address,
      tags: clients.tags,
      hourlyRate: clients.hourlyRate,
      status: clients.status,
      notes: clients.notes,
      createdAt: clients.createdAt,
      updatedAt: clients.updatedAt,
      invoices: sql<any>`coalesce(json_agg(${invoices}.*) filter (where ${invoices.id} is not null), '[]')`
  })
  .from(clients)
  .leftJoin(invoices, eq(invoices.clientId, clients.id))
  .where(and(eq(clients.id, id), eq(clients.userId, userId)))
  .groupBy(clients.id)
  .limit(1);

  return mapClient(result[0]) || null;
}

export async function updateClient(userId: string, id: string, updates: any) {
  const { id: _, userId: __, createdAt: ___, ...cleanUpdates } = updates;
  
  const result = await db.update(clients)
    .set({ ...cleanUpdates, updatedAt: new Date() })
    .where(and(eq(clients.id, id), eq(clients.userId, userId)))
    .returning();
  
  return mapClient(result[0]) || null;
}

export async function deleteClient(userId: string, id: string): Promise<boolean> {
  const result = await db.delete(clients)
    .where(and(eq(clients.id, id), eq(clients.userId, userId)))
    .returning({ id: clients.id });
  
  return result.length > 0;
}
