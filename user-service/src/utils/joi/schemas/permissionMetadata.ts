import * as joi from 'joi';
import { IInstancePermissionOrderedHierarchy } from '../../../express/permissions/interface/permissions';
import { PermissionScopeSchema } from './permission';

const getPermissionMetadataSchema = (classHierarchy: readonly string[]) => {
    const [className, ...restOfHierarchy] = classHierarchy;

    const schema: joi.PartialSchemaMap = {
        scope: PermissionScopeSchema,
    };

    if (className) {
        schema[className] = joi.object().pattern(joi.string(), getPermissionMetadataSchema(restOfHierarchy));
    }

    return joi.object(schema);
};

export const adminPermissionMetadataSchema = getPermissionMetadataSchema([]);
export const rulesPermissionMetadataSchema = getPermissionMetadataSchema([]);
export const permissionsPermissionMetadataSchema = getPermissionMetadataSchema([]);
export const processesPermissionMetadataSchema = getPermissionMetadataSchema([]);
export const templatesPermissionMetadataSchema = getPermissionMetadataSchema([]);
export const instancesPermissionMetadataSchema = getPermissionMetadataSchema(IInstancePermissionOrderedHierarchy);
