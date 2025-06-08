import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import chartsRouter from './charts/router';
import iFramesRouter from './iFrames/router';
import dashboardRouter from './dashboard/router';

const appRouter = Router();

appRouter.use('/api/dashboard/charts', chartsRouter);
appRouter.use('/api/dashboard/iframes', iFramesRouter);
appRouter.use('/api/dashboard/items', dashboardRouter);

appRouter.use('/isAlive', (_req, res) => {
    res.status(StatusCodes.OK).send('alive');
});

appRouter.use('*', (_req, res) => {
    res.status(StatusCodes.NOT_FOUND).send('Invalid Route');
});

export default appRouter;
