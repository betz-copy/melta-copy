import { Router } from 'express';
import { wrapController, ValidateRequest } from '@microservices/shared';
import {
    deletePermissionsFromMetadataRequestSchema,
    getCompactPermissionsRequestSchema,
    syncCompactPermissionsRequestSchema,
} from './validator.schema';
import PermissionsController from './controller';

const permissionsRouter = Router();

permissionsRouter.post(
    '/compact/find-by-related-id/:relatedId',
    ValidateRequest(getCompactPermissionsRequestSchema),
    wrapController(PermissionsController.getCompactPermissions),
);

permissionsRouter.post(
    '/compact/sync',
    ValidateRequest(syncCompactPermissionsRequestSchema),
    wrapController(PermissionsController.syncCompactPermissions),
);

permissionsRouter.patch(
    '/metadata',
    ValidateRequest(deletePermissionsFromMetadataRequestSchema),
    wrapController(PermissionsController.deletePermissionsFromMetadata),
);

export default permissionsRouter;
