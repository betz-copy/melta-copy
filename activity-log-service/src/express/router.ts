import { Router } from 'express';
import activityLogRouter from './activityLog/router';
import { StatusCodes } from 'http-status-codes';

const appRouter = Router();

appRouter.use('/api/activity-log', activityLogRouter);

appRouter.use(['/isAlive', '/health', '/isalive'], (_req, res) => {
    res.status(StatusCodes.OK).send('alive');
});

appRouter.use('*', (_req, res) => {
    res.status(StatusCodes.NOT_FOUND).send('Invalid Route');
});

export default appRouter;
