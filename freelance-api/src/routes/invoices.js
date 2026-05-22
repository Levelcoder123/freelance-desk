import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import * as invoiceService from '../services/invoiceService.js';
import * as invoiceValidation from '../validations/invoiceValidation.js';

export const invoicesRouter = Router();
invoicesRouter.use(authenticate);

// ── GET /invoices
invoicesRouter.get('/', async (req, res, next) => {
  try {
    const result = await invoiceService.getInvoices(req.userId, req.query);
    res.json(result);
  } catch (err) { next(err); }
});

// ── POST /invoices
invoicesRouter.post('/', validate(invoiceValidation.invoiceSchema), async (req, res, next) => {
  try {
    const invoice = await invoiceService.createInvoice(req.userId, req.body);
    res.status(201).json(invoice);
  } catch (err) { next(err); }
});

// ── GET /invoices/:id
invoicesRouter.get('/:id', async (req, res, next) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.userId, req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) { next(err); }
});

// ── PATCH /invoices/:id
invoicesRouter.patch('/:id', validate(invoiceValidation.updateSchema), async (req, res, next) => {
  try {
    const allowed = ['client_id', 'project_id', 'invoice_number', 'status', 'amount',
      'currency', 'tax_rate', 'issue_date', 'due_date', 'notes', 'line_items'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nothing to update' });

    const invoice = await invoiceService.updateInvoice(req.userId, req.params.id, updates);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) { next(err); }
});

// ── DELETE /invoices/:id
invoicesRouter.delete('/:id', async (req, res, next) => {
  try {
    const success = await invoiceService.deleteInvoice(req.userId, req.params.id);
    if (!success) return res.status(404).json({ error: 'Invoice not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});

// ── POST /invoices/:id/send  (trigger email + Stripe payment link)
invoicesRouter.post('/:id/send', async (req, res, next) => {
  try {
    const invoice = await invoiceService.sendInvoice(req.userId, req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    res.json({ message: 'Invoice queued for sending', invoice_id: req.params.id });
  } catch (err) { next(err); }
});
