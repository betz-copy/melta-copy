import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import aiRouter from './ai/router';
import embeddingRouter from './embedding/router';

const appRouter = Router();

appRouter.use('/api/semantic/embedding', embeddingRouter);
appRouter.use('/api/semantic/ai', aiRouter);

appRouter.get('/isAlive', (_req, res) => {
    res.status(StatusCodes.OK).send('alive');
});

appRouter.all(/(.*)/, (_req, res) => {
    res.status(StatusCodes.NOT_FOUND).send('Invalid Route');
});

export default appRouter;
