import { Router } from 'express';
import permissionsRouter from './permissions/router';
import { StatusCodes } from 'http-status-codes';

const appRouter = Router();

appRouter.use('/api/permissions', permissionsRouter);

appRouter.use('/isAlive', (_req, res) => {
    res.status(StatusCodes.OK).send('alive');
});

appRouter.use('*', (_req, res) => {
    res.status(StatusCodes.NOT_FOUND).send('Invalid Route');
});

export default appRouter;
