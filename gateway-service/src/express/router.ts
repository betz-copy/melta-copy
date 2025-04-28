import { Router } from 'express';
import passport from 'passport';
import { wrapMiddleware } from '@microservices/shared';
import authenticationRouter from './authentication/router';
import config from '../config';
import apiRouter from './apiRouter';
import UserService from '../externalServices/userService';

const appRouter = Router();

appRouter.use('/api/auth', authenticationRouter);

if (config.authentication.isRequired) {
    appRouter.use(passport.authenticate(['basic', 'jwt'], { session: false }));
} else {
    appRouter.use(
        wrapMiddleware(async (req, _res) => {
            if (!req.user) req.user = {} as any;
            const user = await UserService.getUserByExternalId(config.authentication.mockAuthenticatedUserId);
            req.user!.id = user._id;
        }),
    );
}

appRouter.use('/api', apiRouter);

export default appRouter;
