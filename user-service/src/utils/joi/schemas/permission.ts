import * as joi from 'joi';
import { PermissionScopeOptions, PermissionType, PermissionTypeOptions } from '../../../express/permissions/interface';
import {
    AdminPermissionMetadataSchema,
    InstancesPermissionMetadataSchema,
    PermissionsPermissionMetadataSchema,
    ProcessesPermissionMetadataSchema,
    RulesPermissionMetadataSchema,
    TemplatesPermissionMetadataSchema,
} from './permissionMetadata';
import { UnknownPermissionTypeError } from '../../../express/permissions/errors';

export const PermissionScopeSchema = joi.string().valid(...PermissionScopeOptions);
export const PermissionTypeSchema = joi.string().valid(...PermissionTypeOptions);

const getCompactPermissionSchema = (allowNull: boolean = false) => {
    return joi.custom((value) => {
        let schema: joi.ObjectSchema;

        Object.entries(value).forEach(([type, permissionCompact]) => {
            switch (type) {
                case PermissionType.admin:
                    schema = AdminPermissionMetadataSchema;
                    break;
                case PermissionType.rules:
                    schema = RulesPermissionMetadataSchema;
                    break;
                case PermissionType.permissions:
                    schema = PermissionsPermissionMetadataSchema;
                    break;
                case PermissionType.processes:
                    schema = ProcessesPermissionMetadataSchema;
                    break;
                case PermissionType.templates:
                    schema = TemplatesPermissionMetadataSchema;
                    break;
                case PermissionType.instances:
                    schema = InstancesPermissionMetadataSchema;
                    break;

                default:
                    throw new UnknownPermissionTypeError(type);
            }

            if (allowNull && permissionCompact === null) return;

            const { error } = schema.validate(permissionCompact);
            if (error) throw error;
        });

        return value;
    });
};

export const CompactPermissionsSchema = getCompactPermissionSchema();
export const CompactNullablePermissionsSchema = getCompactPermissionSchema(true);
