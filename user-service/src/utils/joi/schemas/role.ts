import * as joi from 'joi';
import { partialSchema } from '.';
import { CompactPermissionsSchema } from './permission/compact';

export const baseRoleSchema = joi.object({
    name: joi.string(),
});
export const partialBaseRoleSchema = partialSchema(baseRoleSchema);

export const roleSchema = baseRoleSchema.keys({
    permissions: CompactPermissionsSchema.required(),
});
