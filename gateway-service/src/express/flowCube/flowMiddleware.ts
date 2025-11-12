import { BadRequestError, ForbiddenError } from '@microservices/shared';
import { NextFunction, Request, Response } from 'express';
import config from '../../config';
import UserService from '../../externalServices/userService';

const validateFlowHeaders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.path.includes('/workspaces/search') && !req.body.WorkspaceId) {
            res.json([]);
            return;
        }

        const expectedHeaders = {
            requestHostName: config.flowCube.flowRequestHostName,
            system: config.flowCube.flowSystemName,
        };

        const requestHostName = req.headers.requesthostname as string | undefined;
        const system = req.headers.system as string | undefined;
        const userMail = req.headers.requestusername as string | undefined;

        if (!requestHostName || !system || !userMail) {
            throw new BadRequestError('Missing required headers');
        }

        if (!requestHostName.startsWith(expectedHeaders.requestHostName) || system !== expectedHeaders.system) {
            throw new ForbiddenError('Invalid headers');
        }

        const userT = userMail.substring(0, userMail.indexOf('@'));
        const targetUser = await UserService.searchUsers({ search: userT, limit: 1 });

        if (!targetUser || !targetUser.users[0] || targetUser.count === 0) {
            res.json([]);
            return;
        }

        req.user = { id: targetUser.users[0]._id };

        next();
    } catch (error) {
        next(error);
    }
};

export default validateFlowHeaders;
