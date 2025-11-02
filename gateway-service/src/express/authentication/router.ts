import { Router } from 'express';
import passport from 'passport';
import { wrapController } from '../../utils/express';
import AuthenticationController from './controller';

const authenticationRouter: Router = Router();

authenticationRouter.get('/login', passport.authenticate('shraga', { session: false, failureRedirect: '/unauthorized' }));
authenticationRouter.post(
    '/callback',
    passport.authenticate('shraga', { session: false, failureRedirect: '/unauthorized' }),
    wrapController(AuthenticationController.createTokenAndRedirect),
);

export default authenticationRouter;
