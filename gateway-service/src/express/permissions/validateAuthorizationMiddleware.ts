import { Request } from 'express';
import { checkUserAuthorization, getPermissions, ResourceType } from '../../externalServices/permissionsApi';
import { ServiceError } from '../error';

export const validateAuthorization = async (req: Request, resourceType: ResourceType, relatedCategories: string[]) => {
    const { user } = req;

    if (!user) {
        throw new Error('req.user expected to be defined for validateAuthorization');
    }

    // scopes are not used. permissions always have read & write scopes
    const authorizationResult = await checkUserAuthorization(user.id, resourceType, relatedCategories, 'Read');
    const { authorized, metadata } = authorizationResult;

    if (!authorized) {
        throw new ServiceError(403, 'user not authorized', metadata);
    }
};

export const getValidateAuthorizationMiddleware = (resourceType: ResourceType, relatedCategories: string[] = []) => {
    return (req: Request) => validateAuthorization(req, resourceType, relatedCategories);
};

export const validateUserHasAtLeastSomePermissions = async (req: Request) => {
    const { user } = req;

    if (!user) {
        throw new Error('req.user expected to be defined for validateAuthorization');
    }

    const permissionsOfUser = await getPermissions({ userId: user.id });
    if (permissionsOfUser.length === 0) {
        throw new ServiceError(403, 'user not authorized, needs to have at least one permission');
    }
};

export const validateUserIsTemplateManager = getValidateAuthorizationMiddleware('Templates', ['All']);
