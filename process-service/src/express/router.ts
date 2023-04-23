import { Router } from 'express';
import ProcessInstanceRouter from './instances/processes/router';
import StepInstanceRouter from './instances/steps/router';
import ProcessTemplateRouter from './templates/processes/router';

const appRouter = Router();

appRouter.use('/api/processes/templates', ProcessTemplateRouter);
appRouter.use('/api/processes/instances/steps', StepInstanceRouter);
appRouter.use('/api/processes/instances', ProcessInstanceRouter);

appRouter.use('/isAlive', (_req, res) => {
    res.status(200).send('alive');
});

appRouter.use('*', (_req, res) => {
    res.status(404).send('Invalid Route');
});

export default appRouter;
