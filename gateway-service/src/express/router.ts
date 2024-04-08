import { Router } from 'express';
import passport from 'passport';
import authenticationRouter from './authentication/router';
import config from '../config';
import apiRouter from './apiRouter';
import { InstanceManagerService } from '../externalServices/instanceService';
import { EntityTemplateManagerService } from '../externalServices/entityTemplateService';
import { setUserIdOnPermissionsApi } from '../externalServices/permissionsService';

const appRouter = Router();

appRouter.use('/api/auth', authenticationRouter);

if (config.authentication.isRequired) {
    appRouter.use(passport.authenticate(['basic', 'jwt'], { session: false }));
} else {
    appRouter.use((req, _res, next) => {
        if (!req.user) req.user = {} as any;
        req.user!.id = config.authentication.mockAuthenticatedUserId;
        next();
    });
}

appRouter.use((req, _res, next) => {
    InstanceManagerService.setUserId(req.user!.id);
    EntityTemplateManagerService.setUserId(req.user!.id);
    setUserIdOnPermissionsApi(req.user!.id);
    next();
});

appRouter.use('/api', apiRouter);

export default appRouter;
