import { Request } from 'express';
import { checkUserAuthorization, getPermissions, ResourceType, Scope } from '../../externalServices/permissionsService';
import { ForbiddenError } from '../error';
import { RequestWithPermissionsOfUserId } from '../instances/middlewares';
import PermissionsManager from './manager';

export const validateAuthorization = async (
    req: Request,
    resourceType: ResourceType,
    relatedCategories: string[],
    permissionType: Scope = 'Write', // for now only instance support read/write permission type - so by default is write
) => {
    const { user } = req;

    if (!user) {
        throw new Error('req.user expected to be defined for validateAuthorization');
    }

    const authorizationResult = await checkUserAuthorization(user.id, resourceType, relatedCategories, permissionType);
    const { authorized, metadata } = authorizationResult;
    if (!authorized) {
        throw new ForbiddenError(`User not authorized for ${permissionType} access`, metadata);
    }
};

export const getValidateAuthorizationMiddleware = (resourceType: ResourceType, relatedCategories: string[] = [], permissionType: Scope = 'Read') => {
    return (req: Request) => validateAuthorization(req, resourceType, relatedCategories, permissionType);
};

export const validateUserHasAtLeastSomePermissions = async (req: Request) => {
    const { user } = req;

    if (!user) {
        throw new Error('req.user expected to be defined for validateAuthorization');
    }

    const permissionsArrOfUser = await getPermissions({ userId: user.id });
    if (permissionsArrOfUser.length === 0) {
        throw new ForbiddenError('user not authorized, needs to have at least one permission');
    }
    const permissionsOfUserId = PermissionsManager.buildPermissionsOfUserId(permissionsArrOfUser);

    (req as RequestWithPermissionsOfUserId).permissionsOfUserId = permissionsOfUserId;
};

export const validateUserIsProcessesManager = getValidateAuthorizationMiddleware('Processes', ['All']);
export const validateUserIsTemplatesManager = getValidateAuthorizationMiddleware('Templates', ['All']);
export const validateUserIsPermissionsManager = getValidateAuthorizationMiddleware('Permissions', ['All']);
export const validateUserIsRulesManager = getValidateAuthorizationMiddleware('Rules', ['All']);
