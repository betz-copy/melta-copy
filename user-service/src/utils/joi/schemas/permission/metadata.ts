import * as joi from 'joi';
import { PermissionScopeSchema } from '.';

export const getPermissionMetadataSchema = (classHierarchy: readonly string[], allowNull = false) => {
    const [className, ...restOfHierarchy] = classHierarchy;

    const schema: joi.PartialSchemaMap = {
        scope: PermissionScopeSchema,
    };

    if (className) {
        schema[className] = joi.object().pattern(joi.string(), getPermissionMetadataSchema(restOfHierarchy, allowNull));
    }

    return allowNull ? joi.object(schema).allow(null) : joi.object(schema);
};
