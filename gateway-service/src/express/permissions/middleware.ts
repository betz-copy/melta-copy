import { Request } from 'express';
import { checkAuthorization, translateMethodToOperation } from '../../utils/permissions';
import { ServiceError } from '../error';
import { ResourceType } from './interface';

export const validateAuthorization = async (req: Request) => {
    const { user, method } = req;

    if (!user) {
        throw new ServiceError(401, `req.user is not defined`);
    }

    const operation = translateMethodToOperation(method);
    console.log(`operation: ${operation}`);

    const resourceType: ResourceType = 'Templates';
    const relatedCategories: string[] = ['People'];

    const authorizationResult = await checkAuthorization(user.id, resourceType, relatedCategories, operation);
    const { authorized, metadata } = authorizationResult;

    if (!authorized) {
        console.log('user doesnt authorized', metadata, JSON.stringify(authorizationResult, null, 2));
        throw new ServiceError(403, JSON.stringify(metadata, null, 4));
    }
};
