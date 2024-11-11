import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import ProcessInstanceRouter from './instances/processes/router';
import StepInstanceRouter from './instances/steps/router';
import ProcessTemplateRouter from './templates/processes/router';

const appRouter = Router();

appRouter.use('/api/processes/templates', ProcessTemplateRouter);
appRouter.use('/api/processes/instances/steps', StepInstanceRouter);
appRouter.use('/api/processes/instances', ProcessInstanceRouter);

appRouter.use(['/isAlive', '/isalive', '/health'], (_req, res) => {
    res.status(StatusCodes.OK).send('alive');
});

appRouter.use('*', (_req, res) => {
    res.status(StatusCodes.NOT_FOUND).send('Invalid Route');
});

export default appRouter;
