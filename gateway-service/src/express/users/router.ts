import { Router } from 'express';
import UsersController from './controller';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';

import { searchUsersRequestSchema } from './validator.schema';

const usersRouter: Router = Router();

usersRouter.get('/search', ValidateRequest(searchUsersRequestSchema), wrapController(UsersController.searchUsers));

export default usersRouter;
