import { Request } from 'express';
import { IFrame, IFramesService } from '../../externalServices/iFramesService';
import { ServiceError } from '../error';
import { getAllowedCategoriesForInstances } from '../instances/middlewares';
import PermissionsManager from '../permissions/manager';

const validateHasPermissionsToIFrameItems = async (iFrame: IFrame, allowedCategoriesIds: string[]) => {
    const unauthorizedTemplates = iFrame.categoryIds.filter((id) => !allowedCategoriesIds.includes(id));

    if (unauthorizedTemplates.length > 0) {
        throw new ServiceError(403, 'user not authorized', {
            metadata: `unauthorized iFrame items' entity templates ${JSON.stringify(unauthorizedTemplates)}`,
        });
    }
};

export const validateUserHasPermissionsToIFrame = async (userId: string, newIFrame: IFrame | undefined, existingIFrameId: string | undefined) => {
    const userPermissions = await PermissionsManager.getPermissionsOfUserId(userId);

    if (!userPermissions.templatesManagementId) {
        throw new ServiceError(403, 'user not authorized', { metadata: `user is not templates manager to create/update/delete iframes` });
    }

    const allowedCategories = await getAllowedCategoriesForInstances(userPermissions);
    const allowedCategoriesIds = allowedCategories.map((category) => category._id);

    if (newIFrame) {
        await validateHasPermissionsToIFrameItems(newIFrame, allowedCategoriesIds);
    }
    if (existingIFrameId) {
        const existingIFrame = await IFramesService.getIFrameById(existingIFrameId);
        await validateHasPermissionsToIFrameItems(existingIFrame, allowedCategoriesIds);
    }
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
