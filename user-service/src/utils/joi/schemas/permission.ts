import * as joi from 'joi';
import { PermissionScopeOptions, PermissionType, PermissionTypeOptions } from '../../../express/permissions/interface';
import {
    adminPermissionMetadataSchema,
    instancesPermissionMetadataSchema,
    permissionsPermissionMetadataSchema,
    processesPermissionMetadataSchema,
    rulesPermissionMetadataSchema,
    templatesPermissionMetadataSchema,
} from './permissionMetadata';
import { UnknownPermissionTypeError } from '../../../express/permissions/errors';

export const PermissionScopeSchema = joi.string().valid(...PermissionScopeOptions);
export const PermissionTypeSchema = joi.string().valid(...PermissionTypeOptions);

export const validateCompactNullablePermissions = joi.custom((value) => {
    let schema: joi.ObjectSchema;

    Object.entries(value).forEach(([type, permissionCompact]) => {
        switch (type) {
            case PermissionType.admin:
                schema = adminPermissionMetadataSchema;
                break;
            case PermissionType.rules:
                schema = rulesPermissionMetadataSchema;
                break;
            case PermissionType.permissions:
                schema = permissionsPermissionMetadataSchema;
                break;
            case PermissionType.processes:
                schema = processesPermissionMetadataSchema;
                break;
            case PermissionType.templates:
                schema = templatesPermissionMetadataSchema;
                break;
            case PermissionType.instances:
                schema = instancesPermissionMetadataSchema;
                break;

            default:
                throw new UnknownPermissionTypeError(type);
        }

        const { error } = schema.validate(permissionCompact);
        if (error) throw error;
    });

    return value;
});
