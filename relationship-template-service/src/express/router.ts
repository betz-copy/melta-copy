import { Router } from 'express';
import relationshipTemplateRouter from './relationshipTemplate/router';
import ruleRouter from './rule/router';

const appRouter = Router();

appRouter.use('/api/templates/relationships', relationshipTemplateRouter);
appRouter.use('/api/templates/rules', ruleRouter);

appRouter.use('/isAlive', (_req, res) => {
    res.status(200).send('alive');
});

appRouter.use('*', (_req, res) => {
    res.status(404).send('Invalid Route');
});

export default appRouter;
