import pickBy from 'lodash.pickby';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { IProcessDetails } from '../interfaces/processes/processTemplate';

export const filterFieldsFromPropertiesSchema = (
    schema: IMongoEntityTemplatePopulated['properties'] | undefined = {} as IMongoEntityTemplatePopulated['properties'],
): IMongoEntityTemplatePopulated['properties'] => {
    return {
        ...schema,
        properties: pickBy(
            schema?.properties,
            (value) => value.format !== 'fileId' && value.format !== 'entityReference' && value.items?.format !== 'fileId' && !value.archive,
        ),
        required:
            schema?.required?.filter(
                (requiredKey) =>
                    schema.properties[requiredKey].format !== 'fileId' &&
                    schema.properties[requiredKey].format !== 'entityReference' &&
                    schema.properties[requiredKey].items?.format !== 'fileId' &&
                    schema.properties[requiredKey].serialCurrent === undefined,
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
