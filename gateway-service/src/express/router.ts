import { wrapMiddleware } from '@packages/utils';
import { Router } from 'express';
import passport from 'passport';
import config from '../config';
import UserService from '../externalServices/userService';
import { IConnectedUser } from '../utils/express/passport';
import apiRouter from './apiRouter';
import authenticationRouter from './authentication/router';

const appRouter = Router();

appRouter.use('/api/auth', authenticationRouter);

if (config.authentication.isRequired) {
    appRouter.use(passport.authenticate(['basic', 'jwt'], { session: false }));
} else {
    appRouter.use(
        wrapMiddleware(async (req, _res) => {
            if (!req.user) req.user = {} as IConnectedUser;
            const user = await UserService.getUserByExternalId(config.authentication.mockAuthenticatedUserId);
            req.user!.id = user._id;
        }),
    );
}

appRouter.use('/api', apiRouter);

export default appRouter;
