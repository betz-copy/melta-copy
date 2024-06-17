import { Request, Response } from 'express';
import config from '../../config';
import { ShragaUser } from '../../utils/express/passport';
import { AuthenticationManager } from './manager';
import { UserService } from '../../externalServices/userService';

const { accessTokenName } = config.authentication.shragaAuthentication;

class AuthenticationController {
    static async createTokenAndRedirect(req: Request, res: Response) {
        const { RelayState, id } = req.user as unknown as ShragaUser;

        const user = await UserService.getUserByExternalId(id, []);

        const token = AuthenticationManager.createAccessToken({ id: user._id });
        res.cookie(accessTokenName, token);

        return res.redirect(RelayState || '');
    }
}

export default AuthenticationController;
