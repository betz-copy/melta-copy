import omitBy from 'lodash.omitby';
import { IMongoEntityTemplateWithConstraintsPopulated, IProcessDetails } from '@microservices/shared';

export const filterFieldsFromPropertiesSchema = <
    T extends IMongoEntityTemplateWithConstraintsPopulated['properties'] | (IProcessDetails['properties'] & { hide: string[] }),
>(
    schema: T | undefined = {} as T,
): IMongoEntityTemplateWithConstraintsPopulated['properties'] => {
    const { properties, required, hide = [] } = schema || {};
    return {
        properties: omitBy(
            properties,
            (value) => value.format === 'fileId' || value.format === 'entityReference' || value.items?.format === 'fileId',
        ),
        required:
            required?.filter(
                (requiredKey) =>
                    properties[requiredKey].format !== 'fileId' &&
                    properties[requiredKey].format !== 'entityReference' &&
                    properties[requiredKey].items?.format !== 'fileId',
                // TODO: yona - return this like some how: && schema.properties[requiredKey].serialCurrent === undefined,
            ) || [],
        hide,
        type: 'object',
    };
};

export const pickProcessFieldsPropertiesSchema = (schema: IProcessDetails): IMongoEntityTemplateWithConstraintsPopulated['properties'] => {
    const filteredProperties = filterFieldsFromPropertiesSchema({
        ...schema.properties,
        hide: [] as string[],
        required: schema.properties.required,
    });

    return {
        ...filteredProperties,
    };
};
