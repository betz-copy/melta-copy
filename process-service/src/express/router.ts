import { Router } from 'express';
import processInstanceRouter from './processInstance/router';
import processTemplateRouter from './processTemplate/router';

const appRouter = Router();

appRouter.use('/api/templates/processes', processTemplateRouter);
appRouter.use('/api/instances/processes', processInstanceRouter);

appRouter.use('/isAlive', (_req, res) => {
    res.status(200).send('alive');
});

appRouter.use('*', (_req, res) => {
    res.status(404).send('Invalid Route');
});

export default appRouter;
