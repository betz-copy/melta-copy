import { Router } from 'express';
import { workspacesRouter } from './workspaces/router';

export const appRouter = Router();

appRouter.use('/api/workspaces', workspacesRouter);

appRouter.use('/isAlive', (_req, res) => {
    res.status(200).send('alive');
});

appRouter.use('*', (_req, res) => {
    res.status(404).send('Invalid Route');
});
