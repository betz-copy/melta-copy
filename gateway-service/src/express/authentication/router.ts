import { Router } from 'express';
import * as passport from 'passport';
import AuthenticationController from './controller';
import { wrapController } from '../../utils/express';

const authenticationRouter: Router = Router();

authenticationRouter.get('/login', passport.authenticate('shraga', { failureRedirect: '/unauthorized' }));
authenticationRouter.post(
    '/callback',
    passport.authenticate('shraga', { failureRedirect: '/unauthorized' }),
    wrapController(AuthenticationController.createTokenAndRedirect),
);

export default authenticationRouter;
