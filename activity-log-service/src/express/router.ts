import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import activityLogRouter from './activityLog/router';

const appRouter = Router();

appRouter.use('/api/activity-log', activityLogRouter);

appRouter.use(['/isAlive', '/health', '/isalive'], (_req, res) => {
    res.status(StatusCodes.OK).send('alive');
});

appRouter.all(/(.*)/, (_req, res) => {
    res.status(StatusCodes.NOT_FOUND).send('Invalid Route');
});

export default appRouter;
