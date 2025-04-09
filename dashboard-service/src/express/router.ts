import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';

// import iFramesRouter from './iFrames/router';
import chartsRouter from './charts/router';

const appRouter = Router();

appRouter.use('/api/dashboards/charts', chartsRouter);
// appRouter.use('/api/dashboards/iframes', iFramesRouter);

appRouter.use('/isAlive', (_req, res) => {
    res.status(StatusCodes.OK).send('alive');
});

appRouter.use('*', (_req, res) => {
    res.status(StatusCodes.NOT_FOUND).send('Invalid Route');
});

export default appRouter;
