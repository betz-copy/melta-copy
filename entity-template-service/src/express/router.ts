import { Router } from 'express';
import entityTemplateRouter from './entityTemplate/router';
import categoryRouter from './category/router';

const appRouter = Router();

appRouter.use('/api/entities/templates', entityTemplateRouter);
appRouter.use('/api/categories', categoryRouter);

appRouter.use(['/isAlive', '/health', '/isalive'], (_req, res) => {
    res.status(200).send('alive');
});

appRouter.use('*', (_req, res) => {
    res.status(404).send('Invalid Route');
});

export default appRouter;
