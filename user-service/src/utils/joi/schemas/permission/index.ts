import { PermissionScopeOptions, PermissionTypeOptions } from '@microservices/shared';
import * as joi from 'joi';

export const PermissionScopeSchema = joi.string().valid(...PermissionScopeOptions);
export const PermissionTypeSchema = joi.string().valid(...PermissionTypeOptions);
