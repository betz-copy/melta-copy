import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import permissionsRouter from './permissions/router';
import rolesRouter from './roles/router';
import unitsRouter from './units/router';
import usersRouter from './users/router';

const appRouter = Router();

appRouter.use('/api/permissions', permissionsRouter);
appRouter.use('/api/roles', rolesRouter);
appRouter.use('/api/users', usersRouter);
appRouter.use('/api/units', unitsRouter);

appRouter.get('/isAlive', (_req, res) => {
    res.status(StatusCodes.OK).send('alive');
});

appRouter.all(/(.*)/, (_req, res) => {
    res.status(StatusCodes.NOT_FOUND).send('Invalid Route');
});

export default appRouter;
