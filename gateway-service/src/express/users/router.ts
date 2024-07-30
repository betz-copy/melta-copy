import { Router } from 'express';
import { UsersController } from './controller';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import {
    createUserRequestSchema,
    getUserByIdRequestSchema,
    searchExternalUsersRequestSchema,
    searchUsersRequestSchema,
    syncUserPermissionsRequestSchema,
    deletePermissionsFromMetadataRequestSchema,
    updateUserExternalMetadataRequestSchema,
} from './validator.schema';

export const usersRouter: Router = Router();

usersRouter.get('/:userId', ValidateRequest(getUserByIdRequestSchema), wrapController(UsersController.getUserById));

usersRouter.get('/search-ids', ValidateRequest(searchUsersRequestSchema), wrapController(UsersController.searchUserIds));
usersRouter.get('/search', ValidateRequest(searchUsersRequestSchema), wrapController(UsersController.searchUsers));

usersRouter.post('/', ValidateRequest(createUserRequestSchema), wrapController(UsersController.createUser));

usersRouter.patch(
    '/:userId/external',
    ValidateRequest(updateUserExternalMetadataRequestSchema),
    wrapController(UsersController.updateUserExternalMetadata),
);

usersRouter.post('/:userId/permissions/sync', ValidateRequest(syncUserPermissionsRequestSchema), wrapController(UsersController.syncUserPermissions));

usersRouter.patch(
    '/metadata',
    ValidateRequest(deletePermissionsFromMetadataRequestSchema),
    wrapController(UsersController.deletePermissionsFromMetadata),
);

usersRouter.get('/external', ValidateRequest(searchExternalUsersRequestSchema), wrapController(UsersController.searchExternalUsers));
