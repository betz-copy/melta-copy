import { Router } from 'express';
import { wrapController } from '../../utils/express';
import { ValidateRequest } from '../../utils/joi';
import { getUserByIdRequestSchema } from './validator.schema';
import { UsersController } from './controller';

export const usersRouter: Router = Router();

usersRouter.get('/:id', ValidateRequest(getUserByIdRequestSchema), wrapController(UsersController.getUserById));
