import { Router } from 'express';
import semanticRouter from './semantics/router';

const appRouter = Router();

appRouter.use('/api/semantic', semanticRouter);

appRouter.use('/isAlive', (_req, res) => {
    res.status(200).send('alive');
});

appRouter.use('*', (_req, res) => {
    res.status(404).send('Invalid Route');
});

export default appRouter;
