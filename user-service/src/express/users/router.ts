import { Router } from 'express';
import { wrapController } from '../../utils/express';
import { ValidateRequest } from '../../utils/joi';
import { createUserRequestSchema, getUserByIdRequestSchema, searchUsersRequestSchema } from './validator.schema';
import { UsersController } from './controller';

export const usersRouter: Router = Router();

usersRouter.get('/:id', ValidateRequest(getUserByIdRequestSchema), wrapController(UsersController.getUserById));
usersRouter.post('/search', ValidateRequest(searchUsersRequestSchema), wrapController(UsersController.searchUsers));

usersRouter.post('/', ValidateRequest(createUserRequestSchema), wrapController(UsersController.createUser));
