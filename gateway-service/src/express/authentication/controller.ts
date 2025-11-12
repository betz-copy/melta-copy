import { CookieOptions, Request, Response } from 'express';
import config from '../../config';
import UserService from '../../externalServices/userService';
import { ShragaUser } from '../../utils/express/passport';
import UsersManager from '../users/manager';
import WorkspaceService from '../workspaces/service';
import { AuthenticationManager } from './manager';

const { accessTokenName, clientSideURLPrefix, unauthorizedId } = config.authentication.shragaAuthentication;
const { httpOnly, path, domain } = config.authentication.cookieOptions;

const isDevelopment = process.env.NODE_ENV === 'development';

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
            const workspaceId = redirectUrl.split('/').pop()!;

            token = await AuthenticationController.createClientSideToken(id, workspaceId);
            redirectUrl = redirectUrl.replace(workspaceId, 'main');
        } else {
            token = await AuthenticationController.createUserToken(id);
        }

        const cookieOptions: CookieOptions = {
            httpOnly,
            secure: !isDevelopment,
            sameSite: isDevelopment ? 'lax' : 'none',
            path,
            domain,
        };

        res.cookie(accessTokenName, token, cookieOptions);

        return res.redirect(redirectUrl);
    }
}

export default AuthenticationController;
