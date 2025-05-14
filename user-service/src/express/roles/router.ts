import { Router } from 'express';
import { wrapController } from '../../utils/express';
import { ValidateRequest } from '../../utils/joi';
import { PermissionsController } from './controller';
import {
    deletePermissionsFromMetadataRequestSchema,
    getCompactPermissionsOfRoleRequestSchema,
    syncCompactPermissionsRequestSchema,
} from './validator.schema';

export const rolesRouter = Router();

rolesRouter.post(
    '/compact/find-by-role-name/:roleName',
    ValidateRequest(getCompactPermissionsOfRoleRequestSchema),
    wrapController(PermissionsController.getCompactPermissionsOfRole),
);

rolesRouter.post(
    '/compact/sync',
    ValidateRequest(syncCompactPermissionsRequestSchema),
    wrapController(PermissionsController.syncCompactPermissionsOfRole),
);

rolesRouter.patch(
    '/metadata',
    ValidateRequest(deletePermissionsFromMetadataRequestSchema),
    wrapController(PermissionsController.deletePermissionsFromMetadata),
);
