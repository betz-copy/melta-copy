import { Router } from 'express';
import PermissionsController from './controller';
import { wrapController } from '../../utils/express';
import { ValidateRequest } from '../../utils/joi';
import {
    getPermissionsRequestSchema,
    createPermissionRequestSchema,
    checkUserAuthorizationRequestSchema,
    deletePermissionRequestSchema,
    updatePermissionRequestSchema,
    getPermissionByIdRequestSchema,
} from './validator.schema';

const permissionsRouter: Router = Router();

// TODO: add search

permissionsRouter.get('/', ValidateRequest(getPermissionsRequestSchema), wrapController(PermissionsController.getPermissions));
permissionsRouter.get('/:id', ValidateRequest(getPermissionByIdRequestSchema), wrapController(PermissionsController.getPermissionById));

permissionsRouter.post('/', ValidateRequest(createPermissionRequestSchema), wrapController(PermissionsController.createPermission));
permissionsRouter.post(
    '/:userId/authorization',
    ValidateRequest(checkUserAuthorizationRequestSchema),
    wrapController(PermissionsController.checkUserAuthorization),
);

permissionsRouter.put('/:id', ValidateRequest(updatePermissionRequestSchema), wrapController(PermissionsController.updatePermission));

// TODO: add middleware of calling the manager of CheckUserAuthorization to check if user can delete/create/update permission!
permissionsRouter.delete('/:id', ValidateRequest(deletePermissionRequestSchema), wrapController(PermissionsController.deletePermission));

export default permissionsRouter;
