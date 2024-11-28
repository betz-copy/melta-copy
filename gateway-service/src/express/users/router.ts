import { Router } from 'express';
import multer from 'multer';
import { wrapController, wrapMulter } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { UsersController } from './controller';
import {
    createUserRequestSchema,
    deletePermissionsFromMetadataRequestSchema,
    getKartoffelUserProfileRequestSchema,
    getMyUserRequestSchema,
    getUserByIdRequestSchema,
    searchExternalUsersRequestSchema,
    searchUsersRequestSchema,
    syncUserPermissionsRequestSchema,
    updateUserExternalMetadataRequestSchema,
    updateUserPreferencesMetadataRequestSchema,
} from './validator.schema';
import config from '../../config';

const {
    service: { uploadsFolderPath },
} = config;

export const usersRouter: Router = Router();

usersRouter.get('/my', ValidateRequest(getMyUserRequestSchema), wrapController(UsersController.getMyUser));

usersRouter.get('/external', ValidateRequest(searchExternalUsersRequestSchema), wrapController(UsersController.searchExternalUsers));

usersRouter.get(
    '/kartoffel-user-profile/:kartoffelId',
    ValidateRequest(getKartoffelUserProfileRequestSchema),
    wrapController(UsersController.getKartoffelUserProfile),
);

usersRouter.get('/:userId', ValidateRequest(getUserByIdRequestSchema), wrapController(UsersController.getUserById));

usersRouter.post('/search-ids', ValidateRequest(searchUsersRequestSchema), wrapController(UsersController.searchUserIds));

usersRouter.post('/search', ValidateRequest(searchUsersRequestSchema), wrapController(UsersController.searchUsers));

usersRouter.post('/', ValidateRequest(createUserRequestSchema), wrapController(UsersController.createUser));

usersRouter.patch(
    '/:userId/preferences',
    wrapMulter(multer({ dest: uploadsFolderPath, limits: { fileSize: config.service.maxFileSize } }).single('file')),
    ValidateRequest(updateUserPreferencesMetadataRequestSchema),
    wrapController(UsersController.updateUserPreferencesMetadata),
);

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
