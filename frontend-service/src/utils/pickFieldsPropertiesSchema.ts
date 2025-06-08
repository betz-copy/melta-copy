import pickBy from 'lodash.pickby';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { IProcessDetails } from '../interfaces/processes/processTemplate';

export const filterFieldsFromPropertiesSchema = (
    schema: IMongoEntityTemplatePopulated['properties'] | undefined = {} as IMongoEntityTemplatePopulated['properties'],

    fieldsToFilter: Record<string, boolean> | undefined = undefined,
): IMongoEntityTemplatePopulated['properties'] => {
    const getProperty = (key: string) => schema.properties[key];

    return {
        ...schema,
        properties: pickBy(
            schema?.properties,

            (value) => value.format !== 'fileId' && value.format !== 'entityReference' && value.items?.format !== 'fileId' && !value.archive,
        ),
        required:
            schema?.required?.filter(
                (requiredKey) =>
                    getProperty(requiredKey)?.format !== 'fileId' &&
                    getProperty(requiredKey)?.format !== 'entityReference' &&
                    getProperty(requiredKey)?.items?.format !== 'fileId' &&
                    getProperty(requiredKey)?.serialCurrent === undefined &&
                    (!fieldsToFilter || !!fieldsToFilter?.[requiredKey]),
            ) ?? [],
    };
};

export const pickProcessFieldsPropertiesSchema = (schema: IProcessDetails): IMongoEntityTemplatePopulated['properties'] => {
    const filteredProperties = filterFieldsFromPropertiesSchema({
        ...schema.properties,
        hide: [],
        required: schema.properties.required,
    });

    return {
        ...filteredProperties,
    };
};
