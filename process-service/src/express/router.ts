import { Router } from 'express';
import processTemplateRouter from './processTemplate/router';

const appRouter = Router();

appRouter.use('/api/templates/process', processTemplateRouter);

appRouter.use('/isAlive', (_req, res) => {
    res.status(200).send('alive');
});

appRouter.use('*', (_req, res) => {
    res.status(404).send('Invalid Route');
});

export default appRouter;
