/* eslint-disable no-console */
import { Request, Response } from 'express';
import config from '../../config';
import UserService from '../../externalServices/userService';
import UsersManager from '../users/manager';
import { ShragaUser } from '../../utils/express/passport';
import { AuthenticationManager } from './manager';
import WorkspaceService from '../workspaces/service';

const { accessTokenName, simbaEndURL, unauthorizedId } = config.authentication.shragaAuthentication;

class AuthenticationController {
    static async createSimbaToken(userId: string) {
        const simbaWorkspace = await WorkspaceService.getFile(simbaEndURL);

        const token = AuthenticationManager.createAccessToken({
            id: config.authentication.shragaAuthentication.simbaId,
            kartoffelId: userId,
            simbaWorkspaceId: simbaWorkspace._id,
        });

        return token;
    }

    static async createUserToken(userId: string) {
        const user = await UserService.getUserByExternalId(userId).catch(() => {});

        if (user) await UsersManager.syncUser(user._id);

        const token = AuthenticationManager.createAccessToken({ id: user?._id || unauthorizedId });

        return token;
    }

    static async createTokenAndRedirect(req: Request, res: Response) {
        const { RelayState, id } = req.user as unknown as ShragaUser;

        let token: string;

        if (RelayState?.includes(simbaEndURL)) {
            token = await AuthenticationController.createSimbaToken(id);
        } else {
            token = await AuthenticationController.createUserToken(id);
        }

        res.cookie(accessTokenName, token);

        return res.redirect(RelayState || '/');
    }
}

export default AuthenticationController;
