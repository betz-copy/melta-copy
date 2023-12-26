import { Router } from 'express';
import PermissionsController from './controller';
import { wrapController, wrapMiddleware } from '../../utils/express';
import ValidateRequest from '../../utils/joi';

import {
    getPermissionsOfUsersRequestSchema,
    createPermissionsBulkRequestSchema,
    deletePermissionsRequestSchema,
    getMyPermissionsRequestSchema,
} from './validator.schema';
import { validateUserHasAtLeastSomePermissions, validateUserIsPermissionsManager } from './validateAuthorizationMiddleware';

const permissionsRouter: Router = Router();

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
    wrapController(PermissionsController.createPermissionsBulk),
);
permissionsRouter.delete(
    '/',
    ValidateRequest(deletePermissionsRequestSchema),
    wrapMiddleware(validateUserIsPermissionsManager),
    wrapController(PermissionsController.deletePermissions),
);

export default permissionsRouter;
