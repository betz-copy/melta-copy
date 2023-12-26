import { Router } from 'express';
import UsersController from './controller';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';

import { searchUsersRequestSchema, getUserById } from './validator.schema';

const usersRouter: Router = Router();

usersRouter.get('/search', ValidateRequest(searchUsersRequestSchema), wrapController(UsersController.searchUsers));
usersRouter.get('/:userId', ValidateRequest(getUserById), wrapController(UsersController.getUserById));

export default usersRouter;
