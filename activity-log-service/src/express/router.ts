import { Router } from 'express';
import activityLogRouter from './activityLog/router';

const appRouter = Router();

appRouter.use('/api/activity-log', activityLogRouter);

appRouter.use(['/isAlive', '/health', '/isalive'], (_req, res) => {
    res.status(200).send('alive');
});

appRouter.use('*', (_req, res) => {
    res.status(404).send('Invalid Route');
});

export default appRouter;
