import { db } from '../config/database.js';
import { expenses, projects } from '../db/schema.js';
import { eq, and, sql, desc, count, ilike } from 'drizzle-orm';
import { Expense } from '../types/index.js';

function mapExpense(row: any): Expense {
  if (!row) return row;
  return {
    ...row,
    amount: row.amount ? parseFloat(row.amount) : 0,
  } as Expense;
}

interface GetExpensesFilters {
  category?: string;
  year?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface ExpenseSummary {
  category: string;
  total: number;
  count: number;
}

export async function getExpenses(userId: string, { category, year, search, page = 1, limit = 50 }: GetExpensesFilters) {
  const offset = (page - 1) * limit;

  let where = eq(expenses.userId, userId);

  if (category) { where = and(where, eq(expenses.category, category)) as any; }
  if (year)     { where = and(where, sql`EXTRACT(YEAR FROM ${expenses.expenseDate}) = ${year}`) as any; }
  if (search)   { where = and(where, ilike(expenses.description, `%${search}%`)) as any; }

  const result = await db.select({
      id: expenses.id,
      userId: expenses.userId,
      projectId: expenses.projectId,
      description: expenses.description,
      amount: expenses.amount,
      currency: expenses.currency,
      category: expenses.category,
      expenseDate: expenses.expenseDate,
      notes: expenses.notes,
      createdAt: expenses.createdAt,
      updatedAt: expenses.updatedAt,
      projectName: projects.name
  })
  .from(expenses)
  .leftJoin(projects, eq(projects.id, expenses.projectId))
  .where(where)
  .orderBy(desc(expenses.expenseDate))
  .limit(limit)
  .offset(offset);

  const [totalResult] = await db.select({ count: count() })
    .from(expenses)
    .where(where);

  const summary = await getExpenseSummary(userId);

  return {
    data: result.map(mapExpense),
    meta: { total: totalResult.count, page: +page, limit: +limit },
    summary,
    total: summary.reduce((s, r) => s + r.total, 0),
  };
}

export async function getExpenseSummary(userId: string): Promise<ExpenseSummary[]> {
  const result = await db.select({
      category: expenses.category,
      total: sql<number>`SUM(${expenses.amount})::float`,
      count: sql<number>`COUNT(*)::int`
  })
  .from(expenses)
  .where(eq(expenses.userId, userId))
  .groupBy(expenses.category)
  .orderBy(desc(sql`SUM(${expenses.amount})`));
  
  return result as ExpenseSummary[];
}

export async function createExpense(userId: string, data: any) {
  const drizzleData: any = {
      ...data,
      userId,
      expenseDate: data.expenseDate || data.expense_date || new Date().toISOString().slice(0, 10),
      projectId: data.projectId || data.project_id || null,
      amount: String(data.amount)
  };
  
  // Remove fields that don't belong in the DB
  delete drizzleData.expense_date;
  delete drizzleData.project_id;

  const result = await db.insert(expenses)
    .values(drizzleData)
    .returning();
  return mapExpense(result[0]);
}

export async function updateExpense(userId: string, id: string, updates: any) {
  const drizzleUpdates: any = { ...updates };
  
  if (updates.expenseDate !== undefined) drizzleUpdates.expenseDate = updates.expenseDate;
  if (updates.expense_date !== undefined) {
      drizzleUpdates.expenseDate = updates.expense_date;
      delete drizzleUpdates.expense_date;
  }
  
  if (updates.projectId !== undefined) drizzleUpdates.projectId = updates.projectId;
  if (updates.project_id !== undefined) {
      drizzleUpdates.projectId = updates.project_id;
      delete drizzleUpdates.project_id;
  }

  if (updates.amount !== undefined) drizzleUpdates.amount = String(updates.amount);

  const result = await db.update(expenses)
    .set({ ...drizzleUpdates, updatedAt: new Date() })
    .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
    .returning();
  
  return mapExpense(result[0]) || null;
}

export async function deleteExpense(userId: string, id: string): Promise<boolean> {
  const result = await db.delete(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
    .returning({ id: expenses.id });
  
  return result.length > 0;
}
