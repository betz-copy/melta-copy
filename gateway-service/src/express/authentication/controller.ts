/* eslint-disable no-console */
import { Request, Response } from 'express';
import config from '../../config';
import UserService from '../../externalServices/userService';
import UsersManager from '../users/manager';
import { ShragaUser } from '../../utils/express/passport';
import { AuthenticationManager } from './manager';
import WorkspaceService from '../workspaces/service';

const { accessTokenName } = config.authentication.shragaAuthentication;

class AuthenticationController {
    static async createTokenAndRedirect(req: Request, res: Response) {
        const { RelayState, id } = req.user as unknown as ShragaUser;

        const user = await UserService.getUserByExternalId(id).catch(() => {});

        if (user) await UsersManager.syncUser(user._id);

        let token: string;
        if (RelayState?.includes(config.authentication.shragaAuthentication.simbaEndURL)) {
            const simbaWorkspace = await WorkspaceService.getFile(config.authentication.shragaAuthentication.simbaEndURL);

            token = AuthenticationManager.createAccessToken({
                id: config.authentication.shragaAuthentication.simbaId,
                kartoffelId: id,
                simbaWorkspaceId: simbaWorkspace._id,
            });
        } else {
            token = AuthenticationManager.createAccessToken({ id: user?._id || config.authentication.shragaAuthentication.unauthorizedId });
        }

        res.cookie(accessTokenName, token);

        return res.redirect(RelayState || '/');
    }
}

export default AuthenticationController;
