import { IInstancePermissionOrderedHierarchy, IUnitPermissionOrderedHierarchy, PermissionType } from '@microservices/shared';
import * as joi from 'joi';
import { UnknownPermissionTypeError } from '../../../../express/permissions/errors';
import { getPermissionMetadataSchema } from './metadata';

const getSubCompactPermissionSchema = (allowNull = false) => {
    return joi.custom((value) => {
        let schema: joi.ObjectSchema;

        Object.entries(value).forEach(([type, permissionCompact]) => {
            switch (type) {
                case PermissionType.admin:
                    schema = getPermissionMetadataSchema([], allowNull);
                    break;
                case PermissionType.rules:
                    schema = getPermissionMetadataSchema([], allowNull);
                    break;
                case PermissionType.permissions:
                    schema = getPermissionMetadataSchema([], allowNull);
                    break;
                case PermissionType.processes:
                    schema = getPermissionMetadataSchema([], allowNull);
                    break;
                case PermissionType.templates:
                    schema = getPermissionMetadataSchema([], allowNull);
                    break;
                case PermissionType.instances:
                    schema = getPermissionMetadataSchema(IInstancePermissionOrderedHierarchy, allowNull);
                    break;
                case PermissionType.units:
                    schema = getPermissionMetadataSchema(IUnitPermissionOrderedHierarchy, allowNull);
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

export const SubCompactPermissionSchema = getSubCompactPermissionSchema();
export const SubCompactNullablePermissionSchema = getSubCompactPermissionSchema(true);
export const CompactPermissionsSchema = joi.object().pattern(joi.string(), getSubCompactPermissionSchema());
export const CompactNullablePermissionsSchema = joi.object().pattern(joi.string(), getSubCompactPermissionSchema(true));
