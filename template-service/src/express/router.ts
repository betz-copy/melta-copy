import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import relationshipTemplateRouter from './relationshipTemplate/router';
import ruleRouter from './rule/router';
import entityTemplateRouter from './entityTemplate/router';
import childTemplateRouter from './childTemplate/router';
import categoryRouter from './category/router';
import configRouter from './config/router';
import printingTemplateRouter from './printingTemplate/router';

const appRouter = Router();

appRouter.use('/api/templates/relationships', relationshipTemplateRouter);
appRouter.use('/api/templates/rules', ruleRouter);
appRouter.use('/api/templates/entities', entityTemplateRouter);
appRouter.use('/api/templates/child', childTemplateRouter);
appRouter.use('/api/templates/categories', categoryRouter);
appRouter.use('/api/templates/config', configRouter);
appRouter.use('/api/templates/printingTemplates', printingTemplateRouter);

appRouter.use('/isAlive', (_req, res) => {
    res.status(StatusCodes.OK).send('alive');
});

appRouter.use('*', (_req, res) => {
    res.status(StatusCodes.NOT_FOUND).send('Invalid Route');
});

export default appRouter;
