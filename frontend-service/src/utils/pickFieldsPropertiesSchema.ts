import { IMongoEntityTemplateWithConstraintsPopulated, IProperties, PropertyFormat } from '@packages/entity-template';
import { IProcessDetails } from '@packages/process';
import { pickBy } from 'lodash';

export const filterFieldsFromPropertiesSchema = (
    schema: IMongoEntityTemplateWithConstraintsPopulated['properties'] | undefined = {} as IMongoEntityTemplateWithConstraintsPopulated['properties'],
    fieldsToFilter: Record<string, boolean> | undefined = undefined,
): IMongoEntityTemplateWithConstraintsPopulated['properties'] => {
    const getProperty = (key: string) => schema.properties[key];
    const formats = ['fileId', 'entityReference'];
    return {
        ...schema,
        properties: pickBy(
            schema?.properties,
            (value) =>
                !formats.includes(value.format ?? '') && value.items?.format !== PropertyFormat.fileId && !value.archive && value.display !== false,
        ),
        required:
            schema.required.filter(
                (requiredKey) =>
                    !formats.includes(getProperty(requiredKey)?.format ?? '') &&
                    getProperty(requiredKey)?.items?.format !== PropertyFormat.fileId &&
                    getProperty(requiredKey)?.serialCurrent === undefined &&
                    (!fieldsToFilter || !!fieldsToFilter?.[requiredKey]),
            ) ?? [],
    };
};

export const pickProcessFieldsPropertiesSchema = (schema: IProcessDetails): IMongoEntityTemplateWithConstraintsPopulated['properties'] => {
    const filteredProperties = filterFieldsFromPropertiesSchema({
        type: 'object',
        hide: [],
        properties: schema.properties.properties,
        required: schema.properties.required,
    } as IProperties & { required: string[] });

    return {
        ...filteredProperties,
    };
};

export const pickOnlyGivenFields = (
    schema: IMongoEntityTemplateWithConstraintsPopulated['properties'],
    fieldsToPick: Record<string, boolean> | undefined = undefined,
) => {
    return Object.fromEntries(Object.entries(schema.properties).filter(([key, _value]) => !fieldsToPick || !!fieldsToPick?.[key]));
};
