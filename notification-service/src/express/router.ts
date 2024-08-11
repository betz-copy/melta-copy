import { Router } from 'express';
import notificationsRouter from './notifications/router';
import { StatusCodes } from 'http-status-codes';

const appRouter = Router();

appRouter.use('/api/notifications', notificationsRouter);

appRouter.use('/isAlive', (_req, res) => {
    res.status(StatusCodes.OK).send('alive');
});

appRouter.use('*', (_req, res) => {
    res.status(StatusCodes.NOT_FOUND).send('Invalid Route');
});

export default appRouter;
