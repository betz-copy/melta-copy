import { CookieOptions, Request, Response } from 'express';
import config from '../../config';
import UserService from '../../externalServices/userService';
import { ShragaUser } from '../../utils/express/passport';
import UsersManager from '../users/manager';
import WorkspaceService from '../workspaces/service';
import { AuthenticationManager } from './manager';

const { accessTokenName, clientSideURLPrefix } = config.authentication.shragaAuthentication;
const { httpOnly, path, domain } = config.authentication.cookieOptions;

const isDevelop = process.env.NODE_ENV === 'development';

class AuthenticationController {
    static async createClientSideToken(kartoffelId: string, workspaceId: string) {
        const clientSideWorkspace = await WorkspaceService.getById(workspaceId);
        const { metadata } = clientSideWorkspace;
        if (!metadata || !metadata.clientSide) throw new Error(`Client-side metadata is missing for workspace ${workspaceId}`);

        const { usersInfoChildTemplateId, clientSideWorkspaceName } = metadata.clientSide;
        const user = await UserService.getUserByExternalId(kartoffelId).catch(() => undefined);

        const token = AuthenticationManager.createAccessToken({
            kartoffelId,
            _id: user?._id ?? kartoffelId,
            clientSide: {
                workspaceId: clientSideWorkspace._id,
                usersInfoChildTemplateId,
                workspaceName: clientSideWorkspaceName,
            },
        });

        return token;
    }

    static async createUserToken(userId: string) {
        const user = await UserService.getUserByExternalId(userId).catch(() => undefined);

        if (user) {
            await UsersManager.syncUser(user._id);

            return AuthenticationManager.createAccessToken({
                _id: user._id,
                kartoffelId: user.kartoffelId,
            });
        }

        return AuthenticationManager.createAccessToken({
            kartoffelId: userId,
            _id: userId,
        });
    }

    static async createTokenAndRedirect(req: Request, res: Response) {
        const { RelayState, id } = req.user as unknown as ShragaUser;

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
            secure: !isDevelop,
            sameSite: isDevelop ? 'lax' : 'none',
            path,
            domain,
        };

        res.cookie(accessTokenName, token, cookieOptions);

        return res.redirect(redirectUrl);
    }
}

export default AuthenticationController;
