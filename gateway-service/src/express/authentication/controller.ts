import { Request, Response } from 'express';
import config from '../../config';
import UserService from '../../externalServices/userService';
import UsersManager from '../users/manager';
import { ShragaUser } from '../../utils/express/passport';
import { AuthenticationManager } from './manager';
import WorkspaceService from '../workspaces/service';

const { accessTokenName, clientSideEndURL, unauthorizedId } = config.authentication.shragaAuthentication;

class AuthenticationController {
    static async createClientSideToken(userId: string) {
        const clientSideWorkspace = await WorkspaceService.getFile(clientSideEndURL);
        const { usersInfoChildTemplateId, clientSideWorkspaceName } = clientSideWorkspace.metadata?.clientSide || {};

        const token = AuthenticationManager.createAccessToken({
            id: config.authentication.shragaAuthentication.clientSideId,
            kartoffelId: userId,
            clientSideWorkspaceId: clientSideWorkspace._id,
            usersInfoChildTemplateId,
            clientSideWorkspaceName,
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
        const { RelayState, id } = req.user as ShragaUser;

        let token: string;

        if (RelayState?.includes(clientSideEndURL)) {
            token = await AuthenticationController.createClientSideToken(id);
        } else {
            token = await AuthenticationController.createUserToken(id);
        }

        res.cookie(accessTokenName, token);

        return res.redirect(RelayState || '/');
    }
}

export default AuthenticationController;
