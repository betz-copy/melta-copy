import { Request, Response, NextFunction } from 'express';
import config from '../../config';
import { BadRequestError, ForbiddenError } from '../error';
import { UserService } from '../../externalServices/userService';

const validateFlowHeaders = async (req: Request, _res: Response, next: NextFunction) => {
    try {
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

        const targetUser = await UserService.searchUsers({ search: userMail, limit: 1 });

        req.user = { id: targetUser.users[0]._id };

        next();
    } catch (error) {
        next(error);
    }
};

export default validateFlowHeaders;
