import * as joi from 'joi';
import { PermissionScopeOptions, PermissionTypeOptions } from '@microservices/shared';

export const PermissionScopeSchema = joi.string().valid(...PermissionScopeOptions);
export const PermissionTypeSchema = joi.string().valid(...PermissionTypeOptions);
