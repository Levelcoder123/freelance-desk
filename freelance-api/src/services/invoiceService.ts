import { db } from '../config/database.js';
import { invoices, clients, projects } from '../db/schema.js';
import { invoiceQueue } from '../workers/invoiceWorker.js';
import { eq, and, sql, desc, count, or, ilike } from 'drizzle-orm';
import { Invoice } from '../types/index.js';

function mapInvoice(row: any): Invoice {
  if (!row) return row;
  return {
    ...row,
    amount: row.amount ? parseFloat(row.amount) : 0,
    taxRate: row.taxRate ? parseFloat(row.taxRate) : 0,
    taxAmount: row.taxAmount ? parseFloat(row.taxAmount) : 0,
    totalAmount: row.totalAmount ? parseFloat(row.totalAmount) : 0,
  } as Invoice;
}

interface GetInvoicesFilters {
  status?: string;
  clientId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getInvoices(userId: string, { status, clientId, search, page = 1, limit = 20 }: GetInvoicesFilters) {
  const offset = (page - 1) * limit;

  let where = eq(invoices.userId, userId);

  if (status)   { where = and(where, eq(invoices.status, status)) as any; }
  if (clientId) { where = and(where, eq(invoices.clientId, clientId)) as any; }
  if (search)    { 
      where = and(
          where,
          or(
              ilike(invoices.invoiceNumber, `%${search}%`),
              ilike(clients.name, `%${search}%`)
          )
      ) as any;
  }

  const result = await db.select({
      id: invoices.id,
      userId: invoices.userId,
      clientId: invoices.clientId,
      projectId: invoices.projectId,
      invoiceNumber: invoices.invoiceNumber,
      status: invoices.status,
      amount: invoices.amount,
      currency: invoices.currency,
      taxRate: invoices.taxRate,
      taxAmount: invoices.taxAmount,
      totalAmount: invoices.totalAmount,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      paidAt: invoices.paidAt,
      notes: invoices.notes,
      stripePaymentLink: invoices.stripePaymentLink,
      lineItems: invoices.lineItems,
      createdAt: invoices.createdAt,
      updatedAt: invoices.updatedAt,
      clientName: clients.name,
      clientCompany: clients.company,
      projectName: projects.name
  })
  .from(invoices)
  .leftJoin(clients, eq(clients.id, invoices.clientId))
  .leftJoin(projects, eq(projects.id, invoices.projectId))
  .where(where)
  .orderBy(desc(invoices.createdAt))
  .limit(limit)
  .offset(offset);

  const [totalResult] = await db.select({ count: count() })
    .from(invoices)
    .leftJoin(clients, eq(clients.id, invoices.clientId))
    .where(where);

  return {
    data: result.map(mapInvoice),
    meta: {
      total: totalResult.count,
      page: +page,
      limit: +limit
    }
  };
}

export async function createInvoice(userId: string, data: any) {
  return await db.transaction(async (tx) => {
    const result = await tx.insert(invoices)
      .values({ ...data, userId })
      .returning();
    return mapInvoice(result[0]);
  });
}

export async function getInvoiceById(userId: string, id: string) {
  const result = await db.select({
      id: invoices.id,
      userId: invoices.userId,
      clientId: invoices.clientId,
      projectId: invoices.projectId,
      invoiceNumber: invoices.invoiceNumber,
      status: invoices.status,
      amount: invoices.amount,
      currency: invoices.currency,
      taxRate: invoices.taxRate,
      taxAmount: invoices.taxAmount,
      totalAmount: invoices.totalAmount,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      paidAt: invoices.paidAt,
      notes: invoices.notes,
      stripePaymentLink: invoices.stripePaymentLink,
      lineItems: invoices.lineItems,
      createdAt: invoices.createdAt,
      updatedAt: invoices.updatedAt,
      clientName: clients.name,
      clientEmail: clients.email,
      clientCompany: clients.company,
      clientAddress: clients.address,
      projectName: projects.name
  })
  .from(invoices)
  .leftJoin(clients, eq(clients.id, invoices.clientId))
  .leftJoin(projects, eq(projects.id, invoices.projectId))
  .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
  .limit(1);

  return mapInvoice(result[0]) || null;
}

export async function updateInvoice(userId: string, id: string, updates: any) {
  return await db.transaction(async (tx) => {
    const { id: _, userId: __, createdAt: ___, ...cleanUpdates } = updates;
    
    if (cleanUpdates.status === 'paid') cleanUpdates.paidAt = new Date();
    if (cleanUpdates.status && cleanUpdates.status !== 'paid') cleanUpdates.paidAt = null;

    const result = await tx.update(invoices)
      .set({ ...cleanUpdates, updatedAt: new Date() })
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .returning();
    
    return mapInvoice(result[0]) || null;
  });
}

export async function deleteInvoice(userId: string, id: string): Promise<boolean> {
  const result = await db.delete(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
    .returning({ id: invoices.id });
  
  return result.length > 0;
}

export async function sendInvoice(userId: string, id: string) {
  const result = await db.select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      clientEmail: clients.email,
      clientName: clients.name
  })
  .from(invoices)
  .leftJoin(clients, eq(clients.id, invoices.clientId))
  .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
  .limit(1);

  const invoice = result[0];
  if (!invoice) return null;

  await invoiceQueue.add('send-invoice', { invoiceId: id });
  await db.update(invoices).set({ status: 'pending' }).where(eq(invoices.id, id));
  
  return invoice;
}
