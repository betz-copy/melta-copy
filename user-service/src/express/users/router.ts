import { ValidateRequest, wrapController } from '@packages/utils';
import { Router } from 'express';
import UsersController from './controller';
import {
    createUserRequestSchema,
    getUserByExternalIdRequestSchema,
    getUserByIdRequestSchema,
    searchUsersByPermissionsSchema,
    searchUsersRequestSchema,
    updateUserRequestSchema,
    updateUsersBulkRequestSchema,
} from './validator.schema';

const usersRouter: Router = Router();

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

usersRouter.patch('/bulk', ValidateRequest(updateUsersBulkRequestSchema), wrapController(UsersController.updateUsersBulk));

usersRouter.get('/search/:workspaceId', ValidateRequest(searchUsersByPermissionsSchema), wrapController(UsersController.searchUsersByPermissions));

export default usersRouter;
