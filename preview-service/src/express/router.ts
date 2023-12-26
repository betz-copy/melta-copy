import { Router } from 'express';
import { filesRouter } from './files/router';

const appRouter = Router();

appRouter.use('/isAlive', (_req, res) => {
    res.status(200).send('alive');
});

appRouter.use('/api/preview', filesRouter);

appRouter.use('*', (_req, res) => {
    res.status(404).send('Invalid Route');
});

export { appRouter };
