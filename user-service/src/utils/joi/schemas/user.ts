import * as joi from 'joi';
import { CompactPermissionsSchema } from './permission/compact';
import { partialSchema } from '.';

export const baseUserSchema = joi.object({
    fullName: joi.string().required(),
    jobTitle: joi.string().required(),
    hierarchy: joi.string().required(),
    mail: joi.string().required(),
    preferences: joi
        .object({
            darkMode: joi.boolean(),
            // mailsNotificationsTypes: joi.array().items(NotificationType),
            mailsNotificationsTypes: joi.array().items(joi.string()),
        })
        .required(),
    externalMetadata: joi
        .object({
            kartoffelId: joi.string().required(),
            digitalIdentitySource: joi.string().required(),
        })
        .required(),
});
export const partialBaseUserSchema = partialSchema(baseUserSchema);

export const userSchema = baseUserSchema.keys({
    permissions: CompactPermissionsSchema.required(),
});
