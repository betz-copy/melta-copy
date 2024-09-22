import { Request, Response } from 'express';
import config from '../../config';
import { UserService } from '../../externalServices/userService';
import { ShragaUser } from '../../utils/express/passport';
import { UsersManager } from '../users/manager';
import { AuthenticationManager } from './manager';

const { accessTokenName } = config.authentication.shragaAuthentication;

class AuthenticationController {
    static async createTokenAndRedirect(req: Request, res: Response) {
        const { RelayState, id } = req.user as unknown as ShragaUser;

        console.log(id);

        const user = await UserService.getUserByExternalId('5e5688324203fc40043591aa').catch(() => {});

        if (user) await UsersManager.syncUser(user._id);

        const token = AuthenticationManager.createAccessToken({ id: user?._id || config.authentication.shragaAuthentication.unauthorizedId });
        res.cookie(accessTokenName, token);

        return res.redirect(RelayState || '');
    }
}

export default AuthenticationController;
