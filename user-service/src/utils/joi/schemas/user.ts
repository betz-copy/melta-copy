import * as joi from 'joi';
import { CompactPermissionsSchema } from './permission/compact';
import { partialSchema } from '.';

export const baseUserSchema = joi.object({
    fullName: joi.string(),
    jobTitle: joi.string(),
    hierarchy: joi.string(),
    mail: joi.string(),
    profile: joi.string(),
    roleIds: joi.array().items(joi.string()).allow(null),
    units: joi.any(),
    preferences: joi.object({
        darkMode: joi.boolean(),
        mailsNotificationsTypes: joi.array().items(joi.string()),
        profilePath: joi.string().allow(null),
    }),
    externalMetadata: joi.object({
        kartoffelId: joi.string().required(),
        digitalIdentitySource: joi.string().required(),
    }),
});
export const partialBaseUserSchema = partialSchema(baseUserSchema);

export const userSchema = baseUserSchema.keys({
    permissions: CompactPermissionsSchema.required(),
    displayName: joi.string(),
});
