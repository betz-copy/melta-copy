import * as joi from 'joi';
import { PermissionType } from '../../../../express/permissions/interface';
import {
    AdminPermissionMetadataSchema,
    InstancesPermissionMetadataSchema,
    PermissionsPermissionMetadataSchema,
    ProcessesPermissionMetadataSchema,
    RulesPermissionMetadataSchema,
    TemplatesPermissionMetadataSchema,
} from './metadata';
import { UnknownPermissionTypeError } from '../../../../express/permissions/errors';

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
