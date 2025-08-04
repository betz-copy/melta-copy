import { Request, Response } from 'express';
import config from '../../config';
import UserService from '../../externalServices/userService';
import UsersManager from '../users/manager';
import { ShragaUser } from '../../utils/express/passport';
import { AuthenticationManager } from './manager';
import WorkspaceService from '../workspaces/service';

const { accessTokenName, clientSideURLPrefix, unauthorizedId } = config.authentication.shragaAuthentication;

class AuthenticationController {
    static async createClientSideToken(userId: string, workspaceId) {
        const clientSideWorkspace = await WorkspaceService.getById(workspaceId);
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
        let redirectUrl = RelayState || '/';

        let token: string;

        if (RelayState?.includes(clientSideURLPrefix)) {
            const workspaceId = redirectUrl.split('/').pop();

            token = await AuthenticationController.createClientSideToken(id, workspaceId);
            redirectUrl = `${redirectUrl.split('/').slice(0, -1).join('/')}/main`;
        } else {
            token = await AuthenticationController.createUserToken(id);
        }

        res.cookie(accessTokenName, token);

        return res.redirect(redirectUrl);
    }
}

export default AuthenticationController;
