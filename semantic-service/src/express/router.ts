import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import semanticRouter from './semantics/router';

const appRouter = Router();

appRouter.use('/api/semantic', semanticRouter);

appRouter.get('/isAlive', (_req, res) => {
    res.status(StatusCodes.OK).send('alive');
});

appRouter.all(/(.*)/, (_req, res) => {
    res.status(StatusCodes.NOT_FOUND).send('Invalid Route');
});

export default appRouter;
