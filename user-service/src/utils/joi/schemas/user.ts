import * as joi from 'joi';
import { mongoIdSchema, partialSchema } from '.';
import { CompactPermissionsSchema } from './permission/compact';

export const baseUserSchema = joi.object({
    fullName: joi.string(),
    jobTitle: joi.string(),
    hierarchy: joi.string(),
    mail: joi.string(),
    profile: joi.string(),
    roleIds: joi.array().items(mongoIdSchema).allow(null),
    units: joi.object({}).pattern(mongoIdSchema, joi.array().items(mongoIdSchema)),
    preferences: joi.object({
        darkMode: joi.boolean(),
        mailsNotificationsTypes: joi.array().items(joi.string()),
        profilePath: joi.string().allow(null),
    }),
    kartoffelId: mongoIdSchema.required(),
});
export const partialBaseUserSchema = partialSchema(baseUserSchema);

export const userSchema = baseUserSchema.keys({
    permissions: CompactPermissionsSchema.required(),
    displayName: joi.string(),
});
