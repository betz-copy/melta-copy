import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import bulkActionRouter from './bulkActions/router';
import entitiesRouter from './entities/router';
import relationshipsRouter from './relationships/router';

const appRouter = Router();

appRouter.use('/api/instances/entities', entitiesRouter);
appRouter.use('/api/instances/relationships', relationshipsRouter);
appRouter.use('/api/instances/bulk-actions', bulkActionRouter);

appRouter.use('/isAlive', (_req, res) => {
    res.status(StatusCodes.OK).send('alive');
});

appRouter.all(/(.*)/, (_req, res) => {
    res.status(StatusCodes.NOT_FOUND).send('Invalid Route');
});

export default appRouter;
