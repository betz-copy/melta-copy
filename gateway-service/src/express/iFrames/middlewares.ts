import { Request } from 'express';
import { IFrame } from '../../externalServices/iFramesService';
import { ServiceError } from '../error';
import PermissionsManager from '../permissions/manager';
import IFrameManager from './manager';
import { IPermissionsOfUser } from '../permissions/interfaces';

const validateHasPermissionsToIFrame = async (iFrame: IFrame, allowedCategoriesIds: string[]) => {
    const unauthorizedCategories = iFrame.categoryIds.filter((id) => !allowedCategoriesIds.includes(id));

    if (unauthorizedCategories.length > 0) {
        throw new ServiceError(403, 'user not authorized ', {
            metadata: `unauthorized iFrame items' categories ${JSON.stringify(unauthorizedCategories)}`,
        });
    }
};

export const getAllowedCategories = (userPermissions: Omit<IPermissionsOfUser, 'user'>) => {
    return userPermissions.instancesPermissions.filter((permission) => permission.scopes.includes('Read')).map((permission) => permission.category);
};

export const validateUserHasPermissionsToIFrame = async (userId: string, newIFrame: IFrame | undefined, existingIFrameId: string | undefined) => {
    const userPermissions = await PermissionsManager.getPermissionsOfUserId(userId);

    const allowedCategoriesIds: string[] = getAllowedCategories(userPermissions);

    if (newIFrame) {
        await validateHasPermissionsToIFrame(newIFrame, allowedCategoriesIds);
    }
    if (existingIFrameId) {
        const iFrame = await IFrameManager.getIFrameById(existingIFrameId);
        await validateHasPermissionsToIFrame(iFrame, allowedCategoriesIds);
    }
};

export const validateUserCanGetIFrame = async (req: Request) => {
    await validateUserHasPermissionsToIFrame(req.user!.id, undefined, req.params.iFrameId);
};

export const validateUserCanCreateIFrame = async (req: Request) => {
    await validateUserHasPermissionsToIFrame(req.user!.id, req.body, undefined);
};

export const validateUserCanUpdateIFrame = async (req: Request) => {
    await validateUserHasPermissionsToIFrame(req.user!.id, req.body, req.params.iFrameId);
};

export const validateUserCanDeleteIFrame = async (req: Request) => {
    await validateUserHasPermissionsToIFrame(req.user!.id, undefined, req.params.iFrameId);
};
