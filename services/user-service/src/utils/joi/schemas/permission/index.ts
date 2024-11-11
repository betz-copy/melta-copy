import * as joi from 'joi';
import { PermissionScopeOptions, PermissionTypeOptions } from '../../../../express/permissions/interface';

export const PermissionScopeSchema = joi.string().valid(...PermissionScopeOptions);
export const PermissionTypeSchema = joi.string().valid(...PermissionTypeOptions);
