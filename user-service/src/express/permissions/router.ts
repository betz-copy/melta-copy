import { Router } from 'express';
import { PermissionsController } from './controller';
import { wrapController } from '../../utils/express';
import { ValidateRequest } from '../../utils/joi';
import { getPermissionsOfUserRequestSchema } from './validator.schema';

export const permissionsRouter = Router();

permissionsRouter.get('/', ValidateRequest(getPermissionsOfUserRequestSchema), wrapController(PermissionsController.getCompactPermissionsOfUser));

// permissionsRouter.post('/', ValidateRequest(createPermissionsRequestSchema), wrapController(PermissionsController.));
// permissionsRouter.patch('/user/:userId', ValidateRequest(), wrapController(PermissionsController.));
