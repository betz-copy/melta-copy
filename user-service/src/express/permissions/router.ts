import { Router } from 'express';
import { PermissionsController } from './controller';
import { wrapController } from '../../utils/express';
import { ValidateRequest } from '../../utils/joi';
import { getCompactPermissionsOfUserRequestSchema, updateCompactPermissionsRequestSchema } from './validator.schema';

export const permissionsRouter = Router();

permissionsRouter.get(
    '/compact',
    ValidateRequest(getCompactPermissionsOfUserRequestSchema),
    wrapController(PermissionsController.getCompactPermissionsOfUser),
);

permissionsRouter.post(
    '/compact',
    ValidateRequest(updateCompactPermissionsRequestSchema),
    wrapController(PermissionsController.updateCompactPermissionsOfUser),
);
