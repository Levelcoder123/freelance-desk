import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import * as clientService from '../services/clientService.js';
import * as clientValidation from '../validations/clientValidation.js';

export const clientsRouter = Router();
clientsRouter.use(authenticate);

// ── GET /clients  (list + search)
clientsRouter.get('/', async (req, res, next) => {
  try {
    const result = await clientService.getClients(req.userId, req.query);
    res.json(result);
  } catch (err) { next(err); }
});

// ── POST /clients
clientsRouter.post('/', validate(clientValidation.clientSchema), async (req, res, next) => {
  try {
    const client = await clientService.createClient(req.userId, req.body);
    res.status(201).json(client);
  } catch (err) { next(err); }
});

// ── GET /clients/:id
clientsRouter.get('/:id', async (req, res, next) => {
  try {
    const client = await clientService.getClientById(req.userId, req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  } catch (err) { next(err); }
});

// ── PATCH /clients/:id
clientsRouter.patch('/:id', validate(clientValidation.updateSchema), async (req, res, next) => {
  try {
    const allowed = ['name','company','email','phone','address','tags','hourly_rate','status','notes'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nothing to update' });

    const client = await clientService.updateClient(req.userId, req.params.id, updates);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  } catch (err) { next(err); }
});

// ── DELETE /clients/:id
clientsRouter.delete('/:id', async (req, res, next) => {
  try {
    const success = await clientService.deleteClient(req.userId, req.params.id);
    if (!success) return res.status(404).json({ error: 'Client not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});
