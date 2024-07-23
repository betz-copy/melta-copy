import { Router } from 'express';
import { IPermission } from '../../externalServices/permissionsService';
import PermissionsController from './controller';
import { wrapController, wrapMiddleware } from '../../utils/express';
import ValidateRequest from '../../utils/joi';

import {
    getPermissionsOfUsersRequestSchema,
    createPermissionsBulkRequestSchema,
    deletePermissionsRequestSchema,
    getMyPermissionsRequestSchema,
    updatePermissionsBulkRequestSchema,
} from './validator.schema';
import { validateUserHasAtLeastSomePermissions, validateUserIsPermissionsManager } from './validateAuthorizationMiddleware';

const permissionsRouter: Router = Router();

const extractResponseLogData = (permissions: IPermission[]) => {
    return {
        performedOn: permissions[0].userId,
        permissionsData: permissions.map((permission) => ({
            _id: permission._id,
            category: permission.category,
            resourceType: permission.resourceType,
            scopes: permission.scopes,
        })),
    };
};

permissionsRouter.get(
    '/',
    ValidateRequest(getPermissionsOfUsersRequestSchema),
    wrapMiddleware(validateUserIsPermissionsManager),
    wrapController(PermissionsController.getPermissionsOfUsers),
);
permissionsRouter.get(
    '/my',
    wrapMiddleware(validateUserHasAtLeastSomePermissions),
    ValidateRequest(getMyPermissionsRequestSchema),
    wrapController(PermissionsController.getMyPermissions),
);
permissionsRouter.post(
    '/bulk',
    ValidateRequest(createPermissionsBulkRequestSchema),
    wrapMiddleware(validateUserIsPermissionsManager),
    wrapController(PermissionsController.createPermissionsBulk, {
        toLog: true,
        logRequestFields: [],
        indexName: 'permissions',
        responseDataExtractor: extractResponseLogData,
    }),
);

permissionsRouter.put(
    '/bulk',
    ValidateRequest(updatePermissionsBulkRequestSchema),
    wrapMiddleware(validateUserIsPermissionsManager),
    wrapController(PermissionsController.updatePermissionsBulk, {
        toLog: true,
        logRequestFields: [{ key: 'permissionsToUpdate', path: 'body' }],
        indexName: 'permissions',
        responseDataExtractor: extractResponseLogData,
    }),
);

permissionsRouter.delete(
    '/',
    ValidateRequest(deletePermissionsRequestSchema),
    wrapMiddleware(validateUserIsPermissionsManager),
    wrapController(PermissionsController.deletePermissions, {
        toLog: true,
        logRequestFields: [{ key: 'idsToDelete', path: 'query.ids' }],
        indexName: 'permissions',
        responseDataExtractor: extractResponseLogData,
    }),
);

export default permissionsRouter;
