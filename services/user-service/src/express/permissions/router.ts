import { Router } from 'express';
import { wrapController } from '../../utils/express';
import { ValidateRequest } from '../../utils/joi';
import { PermissionsController } from './controller';
import {
    deletePermissionsFromMetadataRequestSchema,
    getCompactPermissionsOfUserRequestSchema,
    syncCompactPermissionsRequestSchema,
} from './validator.schema';

export const permissionsRouter = Router();

permissionsRouter.post(
    '/compact/find-by-user-id/:userId',
    ValidateRequest(getCompactPermissionsOfUserRequestSchema),
    wrapController(PermissionsController.getCompactPermissionsOfUser),
);

permissionsRouter.post(
    '/compact/sync',
    ValidateRequest(syncCompactPermissionsRequestSchema),
    wrapController(PermissionsController.syncCompactPermissionsOfUser),
);

permissionsRouter.patch(
    '/metadata',
    ValidateRequest(deletePermissionsFromMetadataRequestSchema),
    wrapController(PermissionsController.deletePermissionsFromMetadata),
);
