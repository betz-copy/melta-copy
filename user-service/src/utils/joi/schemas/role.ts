import * as joi from 'joi';
import { CompactPermissionsSchema } from './permission/compact';
import { partialSchema } from '.';

export const baseRoleSchema = joi.object({
    name: joi.string(),
});
export const partialBaseRoleSchema = partialSchema(baseRoleSchema);

export const roleSchema = baseRoleSchema.keys({
    permissions: CompactPermissionsSchema.required(),
});
