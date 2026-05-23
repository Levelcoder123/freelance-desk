import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import * as expenseService from '../services/expenseService.js';
import * as expenseValidation from '../validations/expenseValidation.js';
import { Expense } from '../types/index.js';

export const expensesRouter = Router();
expensesRouter.use(authenticate as any);

// GET /expenses
expensesRouter.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await expenseService.getExpenses(req.userId, req.query as any);
    res.json(result);
  } catch (err) { next(err); }
});

// POST /expenses
expensesRouter.post('/', validate(expenseValidation.expenseSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
    const expense = await expenseService.createExpense(req.userId, req.body);
    res.status(201).json(expense);
  } catch (err) { next(err); }
});

// PATCH /expenses/:id
expensesRouter.patch('/:id', validate(expenseValidation.updateSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
    const allowed = ['description','amount','currency','category','expense_date','notes'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nothing to update' });

    const expense = await expenseService.updateExpense(req.userId, req.params.id, updates as Partial<Expense>);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json(expense);
  } catch (err) { next(err); }
});

// DELETE /expenses/:id
expensesRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
    const success = await expenseService.deleteExpense(req.userId, req.params.id);
    if (!success) return res.status(404).json({ error: 'Expense not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});
