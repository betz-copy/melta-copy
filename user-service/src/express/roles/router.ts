import { ValidateRequest, wrapController } from '@packages/utils';
import { Router } from 'express';
import RolesController from './controller';
import {
    createRoleRequestSchema,
    getAllWorkspaceRolesSchema,
    getRoleByIdRequestSchema,
    searchRolesByPermissionsSchema,
    searchRolesRequestSchema,
    updateRoleRequestSchema,
    updateRolesBulkRequestSchema,
    userRoleWorkspaceSchema,
} from './validator.schema';

const rolesRouter: Router = Router();

rolesRouter.post('/find-by-id/:id', ValidateRequest(getRoleByIdRequestSchema), wrapController(RolesController.getRoleById));

rolesRouter.post('/search-ids', ValidateRequest(searchRolesRequestSchema), wrapController(RolesController.searchRoleIds));
rolesRouter.post('/search', ValidateRequest(searchRolesRequestSchema), wrapController(RolesController.searchRoles));

rolesRouter.post('/', ValidateRequest(createRoleRequestSchema), wrapController(RolesController.createRole));

rolesRouter.patch('/:id', ValidateRequest(updateRoleRequestSchema), wrapController(RolesController.updateRole));

rolesRouter.patch('/bulk', ValidateRequest(updateRolesBulkRequestSchema), wrapController(RolesController.updateRolesBulk));

rolesRouter.get('/search/:workspaceId', ValidateRequest(searchRolesByPermissionsSchema), wrapController(RolesController.searchRolesByPermissions));

rolesRouter.post('/workspaces', ValidateRequest(getAllWorkspaceRolesSchema), wrapController(RolesController.getAllWorkspaceRoles));

rolesRouter.post(
    '/userRoleWorkspace/:workspaceId',
    ValidateRequest(userRoleWorkspaceSchema),
    wrapController(RolesController.getUserRolePerWorkspace),
);

export default rolesRouter;
