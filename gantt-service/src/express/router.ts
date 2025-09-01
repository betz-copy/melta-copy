import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import ganttsRouter from './gantts/router';

const appRouter = Router();

appRouter.use('/api/gantts', ganttsRouter);

appRouter.use('/isAlive', (_req, res) => {
    res.status(StatusCodes.OK).send('alive');
});

appRouter.all(/(.*)/, (_req, res) => {
    res.status(StatusCodes.NOT_FOUND).send('Invalid Route');
});

export default appRouter;
