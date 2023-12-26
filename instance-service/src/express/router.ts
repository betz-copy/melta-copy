import { Router } from 'express';
import entitiesRouter from './entities/router';
import relationshipsRouter from './relationships/router';

const appRouter = Router();

appRouter.use('/api/instances/entities', entitiesRouter);
appRouter.use('/api/instances/relationships', relationshipsRouter);

appRouter.use('/isAlive', (_req, res) => {
    res.status(200).send('alive');
});

appRouter.use('*', (_req, res) => {
    res.status(404).send('Invalid Route');
});

export default appRouter;
