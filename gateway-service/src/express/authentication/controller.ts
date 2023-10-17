import { Request, Response } from 'express';
import config from '../../config';
import { ShragaUser } from '../../utils/express/passport';
import { AuthenticationManager } from './manager';

const { accessTokenName } = config.authentication.shragaAuthentication;
const { systemUnavailableURL } = config.service;

class AuthenticationController {
    static async createTokenAndRedirect(req: Request, res: Response) {
        const { RelayState, id } = req.user as ShragaUser;
        const result = AuthenticationManager.createAccessToken({ id } as Express.User);

        if (!result.token) return res.redirect(`${systemUnavailableURL}?reason=${result.reason}`);

        res.cookie(accessTokenName, result.token);
        return res.redirect(RelayState || '');
    }
}

export default AuthenticationController;
