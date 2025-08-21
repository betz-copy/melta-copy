import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { wrapController, ValidateRequest } from '@microservices/shared';
import UsersController from './controller';
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
    updateUserExternalMetadataRequestSchema,
    updateUserPreferencesMetadataRequestSchema,
    getKartoffelUserProfileRequestSchema,
    getKartoffelUserByIdSchema,
    getRoleByIdRequestSchema,
    searchRolesRequestSchema,
    createRoleRequestSchema,
    updateRoleRequestSchema,
    searchRolesByPermissionsSchema,
    syncPermissionsRequestSchema,
    updateUserRoleIdsRequestSchema,
    userRoleWorkspaceRequestSchema,
    getAllWorkspaceRolesSchema,
    updateUserUnitsRequestSchema,
} from './validator.schema';
import { AuthorizerControllerMiddleware } from '../../utils/authorizer';
import busboyMiddleware from '../../utils/busboy/busboyMiddleware';

const { userService } = config;

const UserManagerProxy = createProxyMiddleware({
    target: `${userService.url}${userService.usersRoute}`,
    changeOrigin: true,
    proxyTimeout: userService.requestTimeout,
});

const usersRouter: Router = Router();

usersRouter.get('/my', ValidateRequest(getMyUserRequestSchema), wrapController(UsersController.getMyUser));

usersRouter.get('/external', ValidateRequest(searchExternalUsersRequestSchema), wrapController(UsersController.searchExternalUsers));

usersRouter.get('/:userId', ValidateRequest(getUserByIdRequestSchema), wrapController(UsersController.getUserById));

usersRouter.get(
    '/kartoffelUserProfile/:kartoffelId',
    ValidateRequest(getKartoffelUserProfileRequestSchema),
    wrapController(UsersController.getKartoffelUserProfile),
);

usersRouter.get('/kartoffelUser/:kartoffelId', ValidateRequest(getKartoffelUserByIdSchema), wrapController(UsersController.getKartoffelUserById));

usersRouter.get('/user-profile/:userId', ValidateRequest(getUserProfileRequestSchema), wrapController(UsersController.getUserProfile));

usersRouter.post('/search-ids', ValidateRequest(searchUsersRequestSchema), wrapController(UsersController.searchUserIds));

usersRouter.post('/search', ValidateRequest(searchUsersRequestSchema), wrapController(UsersController.searchUsers));

usersRouter.patch(
    '/:userId/roleIds',
    AuthorizerControllerMiddleware.userCanWritePermissions,
    ValidateRequest(updateUserRoleIdsRequestSchema),
    wrapController(UsersController.updateUserRoleIds),
);

usersRouter.patch('/:userId/units', ValidateRequest(updateUserUnitsRequestSchema), wrapController(UsersController.updateUserUnits));

usersRouter.post(
    '/',
    AuthorizerControllerMiddleware.userCanWritePermissions,
    ValidateRequest(createUserRequestSchema),
    wrapController(UsersController.createUser),
);

usersRouter.patch(
    '/:userId/preferences',
    busboyMiddleware,
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
    '/:relatedId/permissions/sync',
    AuthorizerControllerMiddleware.userCanWritePermissions,
    ValidateRequest(syncPermissionsRequestSchema),
    wrapController(UsersController.syncPermissions),
);

usersRouter.patch(
    '/metadata',
    AuthorizerControllerMiddleware.userCanWritePermissions,
    ValidateRequest(deletePermissionsFromMetadataRequestSchema),
    wrapController(UsersController.deletePermissionsFromMetadata),
);

usersRouter.get('/search/:workspaceId', ValidateRequest(searchUsersByPermissionsSchema), UserManagerProxy);

usersRouter.get('/roles/:roleId', ValidateRequest(getRoleByIdRequestSchema), wrapController(UsersController.getRoleById));

usersRouter.post('/roles/search-ids', ValidateRequest(searchRolesRequestSchema), wrapController(UsersController.searchRoleIds));

usersRouter.post('/roles/search', ValidateRequest(searchRolesRequestSchema), wrapController(UsersController.searchRoles));

usersRouter.post(
    '/roles',
    AuthorizerControllerMiddleware.userCanWritePermissions,
    ValidateRequest(createRoleRequestSchema),
    wrapController(UsersController.createRole),
);

usersRouter.patch(
    '/roles/:roleId',
    AuthorizerControllerMiddleware.userCanWritePermissions,
    ValidateRequest(updateRoleRequestSchema),
    wrapController(UsersController.updateRole),
);

usersRouter.post(
    '/userRoleWorkspace/:workspaceId',
    ValidateRequest(userRoleWorkspaceRequestSchema),
    wrapController(UsersController.getUserRolePerWorkspace),
);

usersRouter.post('/roles/workspaces', ValidateRequest(getAllWorkspaceRolesSchema), wrapController(UsersController.getAllWorkspaceRoles));

usersRouter.get('/roles/search/:workspaceId', ValidateRequest(searchRolesByPermissionsSchema), UserManagerProxy);

export default usersRouter;
