import { Router } from 'express';
import multer from 'multer';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { wrapController, wrapMulter } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { UsersController } from './controller';
import config from '../../config';
import {
    createUserRequestSchema,
    deletePermissionsFromMetadataRequestSchema,
    getUserProfileRequestSchema,
    getMyUserRequestSchema,
    getUserByIdRequestSchema,
    searchExternalUsersRequestSchema,
    searchUsersByPermissionsSchema,
    searchUsersRequestSchema,
    syncUserPermissionsRequestSchema,
    updateUserExternalMetadataRequestSchema,
    updateUserPreferencesMetadataRequestSchema,
} from './validator.schema';
import { AuthorizerControllerMiddleware } from '../../utils/authorizer';

const {
    service: { uploadsFolderPath },
} = config;

const { userService } = config;

const UserManagerProxy = createProxyMiddleware({
    target: `${userService.url}${userService.usersRoute}`,
    changeOrigin: true,
    proxyTimeout: userService.requestTimeout,
});

export const usersRouter: Router = Router();

usersRouter.get('/my', ValidateRequest(getMyUserRequestSchema), wrapController(UsersController.getMyUser));

usersRouter.get('/external', ValidateRequest(searchExternalUsersRequestSchema), wrapController(UsersController.searchExternalUsers));

usersRouter.get('/:userId', ValidateRequest(getUserByIdRequestSchema), wrapController(UsersController.getUserById));

usersRouter.get('/user-profile/:userId', ValidateRequest(getUserProfileRequestSchema), wrapController(UsersController.getUserProfile));

usersRouter.post('/search-ids', ValidateRequest(searchUsersRequestSchema), wrapController(UsersController.searchUserIds));

usersRouter.post('/search', ValidateRequest(searchUsersRequestSchema), wrapController(UsersController.searchUsers));

usersRouter.post(
    '/',
    AuthorizerControllerMiddleware.userCanWritePermissions,
    ValidateRequest(createUserRequestSchema),
    wrapController(UsersController.createUser),
);

usersRouter.patch(
    '/:userId/preferences',
    wrapMulter(multer({ dest: uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).single('file')),
    ValidateRequest(updateUserPreferencesMetadataRequestSchema),
    wrapController(UsersController.updateUserPreferencesMetadata),
);

usersRouter.patch(
    '/:userId/external',
    AuthorizerControllerMiddleware.userCanWritePermissions,
    ValidateRequest(updateUserExternalMetadataRequestSchema),
    wrapController(UsersController.updateUserExternalMetadata),
);

usersRouter.post(
    '/:userId/permissions/sync',
    AuthorizerControllerMiddleware.userCanWritePermissions,
    ValidateRequest(syncUserPermissionsRequestSchema),
    wrapController(UsersController.syncUserPermissions),
);

usersRouter.patch(
    '/metadata',
    AuthorizerControllerMiddleware.userCanWritePermissions,
    ValidateRequest(deletePermissionsFromMetadataRequestSchema),
    wrapController(UsersController.deletePermissionsFromMetadata),
);

usersRouter.get('/search/:workspaceId', ValidateRequest(searchUsersByPermissionsSchema), UserManagerProxy);
