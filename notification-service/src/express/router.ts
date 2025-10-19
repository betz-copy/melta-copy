import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import notificationsRouter from './notifications/router';

const appRouter = Router();

appRouter.use('/api/notifications', notificationsRouter);

appRouter.use('/isAlive', (_req, res) => {
    res.status(StatusCodes.OK).send('alive');
});

appRouter.all(/(.*)/, (_req, res) => {
    res.status(StatusCodes.NOT_FOUND).send('Invalid Route');
});

export default appRouter;
