import { Router } from 'express';
import { wrapController } from '../../utils/express';
import { ValidateRequest } from '../../utils/joi';
import {
    createUserRequestSchema,
    getUserByExternalIdRequestSchema,
    getUserByIdRequestSchema,
    searchUsersRequestSchema,
    updateUserRequestSchema,
    updateUsersBulkRequestSchema,
} from './validator.schema';
import { UsersController } from './controller';

export const usersRouter: Router = Router();

usersRouter.post('/find-by-id/:id', ValidateRequest(getUserByIdRequestSchema), wrapController(UsersController.getUserById));
usersRouter.post(
    '/find-by-external-id/:externalId',
    ValidateRequest(getUserByExternalIdRequestSchema),
    wrapController(UsersController.getUserByExternalId),
);

usersRouter.post('/search-ids', ValidateRequest(searchUsersRequestSchema), wrapController(UsersController.searchUserIds));
usersRouter.post('/search', ValidateRequest(searchUsersRequestSchema), wrapController(UsersController.searchUsers));

usersRouter.post('/', ValidateRequest(createUserRequestSchema), wrapController(UsersController.createUser));

usersRouter.patch('/:id', ValidateRequest(updateUserRequestSchema), wrapController(UsersController.updateUser));
// usersRouter.patch('/preferences/:id', ValidateRequest(updateUserPreferencesMetadataRequestSchema), wrapController(UsersController.updateUser));

usersRouter.patch('/bulk', ValidateRequest(updateUsersBulkRequestSchema), wrapController(UsersController.updateUsersBulk));
