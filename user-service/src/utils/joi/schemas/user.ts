import * as joi from 'joi';
import { partialSchema } from '.';
import { CompactPermissionsSchema } from './permission/compact';

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
    kartoffelId: joi.string().required(),
});
export const partialBaseUserSchema = partialSchema(baseUserSchema);

export const userSchema = baseUserSchema.keys({
    permissions: CompactPermissionsSchema.required(),
    displayName: joi.string(),
});
