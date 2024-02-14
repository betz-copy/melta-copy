import { Router } from 'express';
import { permissionsRouter } from './permissions/router';
import { usersRouter } from './users/router';

export const appRouter = Router();

appRouter.use('/api/permissions', permissionsRouter);
appRouter.use('/api/users', usersRouter);

appRouter.use('/isAlive', (_req, res) => {
    res.status(200).send('alive');
});

appRouter.use('*', (_req, res) => {
    res.status(404).send('Invalid Route');
});
