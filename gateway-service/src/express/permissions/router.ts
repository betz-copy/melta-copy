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
import { getValidateAuthorizationMiddleware, validateUserHasAtLeastSomePermissions } from './validateAuthorizationMiddleware';

const permissionsRouter: Router = Router();

permissionsRouter.get(
    '/',
    ValidateRequest(getPermissionsOfUsersRequestSchema),
    wrapMiddleware(getValidateAuthorizationMiddleware('Permissions', ['All'])),
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
    wrapMiddleware(getValidateAuthorizationMiddleware('Permissions', ['All'])),
    wrapController(PermissionsController.createPermissionsBulk),
);
permissionsRouter.delete(
    '/',
    ValidateRequest(deletePermissionsRequestSchema),
    wrapMiddleware(getValidateAuthorizationMiddleware('Permissions', ['All'])),
    wrapController(PermissionsController.deletePermissions),
);

export default permissionsRouter;
