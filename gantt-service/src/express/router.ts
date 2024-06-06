import { Router } from 'express';
import ganttsRouter from './gantts/router';
import iFramesRouter from './iframes/router';

const appRouter = Router();

appRouter.use('/api/gantts', ganttsRouter);
appRouter.use('api/iFrames', iFramesRouter);

appRouter.use('/isAlive', (_req, res) => {
    res.status(200).send('alive');
});

appRouter.use('*', (_req, res) => {
    res.status(404).send('Invalid Route');
});

export default appRouter;
