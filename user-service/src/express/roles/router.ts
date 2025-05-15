import { Router } from 'express';
import { wrapController, ValidateRequest } from '@microservices/shared';
import {
    createRoleRequestSchema,
    getRoleByIdRequestSchema,
    searchRolesByPermissionsSchema,
    searchRolesRequestSchema,
    updateRoleRequestSchema,
    updateRolesBulkRequestSchema,
} from './validator.schema';
import RolesController from './controller';

const rolesRouter: Router = Router();

rolesRouter.post('/find-by-id/:id', ValidateRequest(getRoleByIdRequestSchema), wrapController(RolesController.getRoleById));

rolesRouter.post('/search-ids', ValidateRequest(searchRolesRequestSchema), wrapController(RolesController.searchRoleIds));
rolesRouter.post('/search', ValidateRequest(searchRolesRequestSchema), wrapController(RolesController.searchRoles));

rolesRouter.post('/', ValidateRequest(createRoleRequestSchema), wrapController(RolesController.createRole));

rolesRouter.patch('/:id', ValidateRequest(updateRoleRequestSchema), wrapController(RolesController.updateRole));

rolesRouter.patch('/bulk', ValidateRequest(updateRolesBulkRequestSchema), wrapController(RolesController.updateRolesBulk));

rolesRouter.get(
    '/roles/search/:workspaceId',
    ValidateRequest(searchRolesByPermissionsSchema),
    wrapController(RolesController.searchRolesByPermissions),
);

export default rolesRouter;
