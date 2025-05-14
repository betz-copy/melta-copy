import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { permissionsRouter } from './permissions/router';
import { usersRouter } from './users/router';
import { rolesRouter } from './roles/router';

export const appRouter = Router();

appRouter.use('/api/permissions', permissionsRouter);
appRouter.use('/api/roles', rolesRouter);
appRouter.use('/api/users', usersRouter);

appRouter.use('/isAlive', (_req, res) => {
    res.status(StatusCodes.OK).send('alive');
});

appRouter.use('*', (_req, res) => {
    res.status(StatusCodes.NOT_FOUND).send('Invalid Route');
});
