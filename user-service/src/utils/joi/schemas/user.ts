import * as joi from 'joi';
import { CompactPermissionsSchema } from './permission';

export const userSchema = joi.object({
    fullName: joi.string().required(),
    jobTitle: joi.string().required(),
    hierarchy: joi.string().required(),
    mail: joi.string().email().required(),
    preferences: joi
        .object({
            darkMode: joi.boolean(),
        })
        .required(),
    externalMetadata: joi
        .object({
            kartoffelId: joi.string().required(),
            digitalIdentitySource: joi.string().required(),
        })
        .required(),
    permissions: CompactPermissionsSchema.required(),
});
