import { Router } from 'express';
import { filesRouter } from './files/router';

const appRouter = Router();

appRouter.use('/api/preview', filesRouter);

appRouter.use('*', (_req, res) => {
    res.status(404).send('Invalid Route');
});

export { appRouter };
