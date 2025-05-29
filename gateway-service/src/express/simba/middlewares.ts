/* eslint-disable no-console */
import { NextFunction, Request, Response } from 'express';
import DefaultController from '../../utils/express/controller';

export const validateSimbaHeaders = async (req: Request, _res: Response, next: NextFunction) => {
    try {
        const { user } = req;

        console.log('workspaceId: ', req.params.workspaceId);
        console.log('user: ', user);

        next();
    } catch (error) {
        next(error);
    }
};

class SimbaValidator extends DefaultController {
    private workspaceId: string;

    constructor(workspaceId: string) {
        super(null);
        this.workspaceId = workspaceId;
    }

    async validateUserCanAccessSimba(req: Request) {
        console.log('req: ', req.user);
        console.log('workspaceId: ', this.workspaceId);

        console.log('validateUserCanAccessSimba');
    }
}

export default SimbaValidator;
