import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import categoryRouter from './category/router';
import childTemplateRouter from './childTemplate/router';
import configRouter from './config/router';
import entityTemplateRouter from './entityTemplate/router';
import printingTemplateRouter from './printingTemplate/router';
import relationshipTemplateRouter from './relationshipTemplate/router';
import ruleRouter from './rule/router';

const appRouter = Router();

appRouter.use('/api/templates/relationships', relationshipTemplateRouter);
appRouter.use('/api/templates/rules', ruleRouter);
appRouter.use('/api/templates/entities', entityTemplateRouter);
appRouter.use('/api/templates/child', childTemplateRouter);
appRouter.use('/api/templates/categories', categoryRouter);
appRouter.use('/api/templates/config', configRouter);
appRouter.use('/api/templates/print', printingTemplateRouter);

appRouter.get('/isAlive', (_req, res) => {
    res.status(StatusCodes.OK).send('alive');
});

appRouter.all(/(.*)/, (_req, res) => {
    res.status(StatusCodes.NOT_FOUND).send('Invalid Route');
});

export default appRouter;
