import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import * as projectService from '../services/projectService.js';
import * as projectValidation from '../validations/projectValidation.js';

export const projectsRouter = Router();
projectsRouter.use(authenticate);

// GET /projects
projectsRouter.get('/', async (req, res, next) => {
  try {
    const result = await projectService.getProjects(req.userId, req.query);
    res.json(result);
  } catch (err) { next(err); }
});

// POST /projects
projectsRouter.post('/', validate(projectValidation.projectSchema), async (req, res, next) => {
  try {
    const project = await projectService.createProject(req.userId, req.body);
    res.status(201).json(project);
  } catch (err) { next(err); }
});

// PATCH /projects/:id
projectsRouter.patch('/:id', validate(projectValidation.updateSchema), async (req, res, next) => {
  try {
    const allowed = ['client_id','name','description','status','priority','progress','deadline','budget'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nothing to update' });

    const project = await projectService.updateProject(req.userId, req.params.id, updates);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) { next(err); }
});

// DELETE /projects/:id
projectsRouter.delete('/:id', async (req, res, next) => {
  try {
    const success = await projectService.deleteProject(req.userId, req.params.id);
    if (!success) return res.status(404).json({ error: 'Project not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});
