import * as joi from 'joi';
import { IInstancePermissionOrderedHierarchy } from '../../../../express/permissions/interface/permissions';
import { PermissionScopeSchema } from '.';

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

export const AdminPermissionMetadataSchema = getPermissionMetadataSchema([]);
export const RulesPermissionMetadataSchema = getPermissionMetadataSchema([]);
export const PermissionsPermissionMetadataSchema = getPermissionMetadataSchema([]);
export const ProcessesPermissionMetadataSchema = getPermissionMetadataSchema([]);
export const TemplatesPermissionMetadataSchema = getPermissionMetadataSchema([]);
export const InstancesPermissionMetadataSchema = getPermissionMetadataSchema(IInstancePermissionOrderedHierarchy);
