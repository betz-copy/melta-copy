import { Router } from 'express';
import { filesRouter } from './files/router';
import { StatusCodes } from 'http-status-codes';

const appRouter = Router();

appRouter.use('/isAlive', (_req, res) => {
    res.status(StatusCodes.OK).send('alive');
});

appRouter.use('/api/preview', filesRouter);

appRouter.use('*', (_req, res) => {
    res.status(StatusCodes.NOT_FOUND).send('Invalid Route');
});

export { appRouter };
