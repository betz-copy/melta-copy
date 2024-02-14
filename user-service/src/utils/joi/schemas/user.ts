import * as joi from 'joi';
import { CompactPermissionsSchema } from './permission';

export const UserPreferencesSchema = joi.object({
    darkMode: joi.boolean(),
});

export const UsersSearchSchema = joi.object({
    fullName: joi.string(),
    jobTitle: joi.string(),
    preferences: UserPreferencesSchema,
    permissions: CompactPermissionsSchema,
});
