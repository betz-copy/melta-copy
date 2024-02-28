import { Router } from 'express';
import { PermissionsController } from './controller';
import { wrapController } from '../../utils/express';
import { ValidateRequest } from '../../utils/joi';
import { getCompactPermissionsOfUserRequestSchema, syncCompactPermissionsRequestSchema } from './validator.schema';

export const permissionsRouter = Router();

permissionsRouter.get(
    '/compact',
    ValidateRequest(getCompactPermissionsOfUserRequestSchema),
    wrapController(PermissionsController.getCompactPermissionsOfUser),
);

permissionsRouter.post(
    '/compact/sync',
    ValidateRequest(syncCompactPermissionsRequestSchema),
    wrapController(PermissionsController.syncCompactPermissionsOfUser),
);
