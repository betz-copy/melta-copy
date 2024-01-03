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
    deletePermissionsRequestSchema,
} from './validator.schema';

const permissionsRouter: Router = Router();

permissionsRouter.get('/', ValidateRequest(getPermissionsRequestSchema), wrapController(PermissionsController.getPermissions));
permissionsRouter.get('/:id', ValidateRequest(getPermissionByIdRequestSchema), wrapController(PermissionsController.getPermissionById));

permissionsRouter.post('/', ValidateRequest(createPermissionRequestSchema), wrapController(PermissionsController.createPermission));
permissionsRouter.post(
    '/:userId/authorization',
    ValidateRequest(checkUserAuthorizationRequestSchema),
    wrapController(PermissionsController.checkUserAuthorization),
);

permissionsRouter.put('/:id', ValidateRequest(updatePermissionRequestSchema), wrapController(PermissionsController.updatePermission));

permissionsRouter.delete('/:id', ValidateRequest(deletePermissionRequestSchema), wrapController(PermissionsController.deletePermission));
permissionsRouter.delete('/', ValidateRequest(deletePermissionsRequestSchema), wrapController(PermissionsController.deletePermissions));

export default permissionsRouter;
