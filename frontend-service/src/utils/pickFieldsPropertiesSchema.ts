import pickBy from 'lodash.pickby';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { IProcessDetails } from '../interfaces/processes/processTemplate';

export const filterAttachmentsFromPropertiesSchema = (
    schema: IMongoEntityTemplatePopulated['properties'],
): IMongoEntityTemplatePopulated['properties'] => {
    return {
        ...schema,
        properties: pickBy(schema.properties, (value) => value.format !== 'fileId' && value.format !== 'entityReference'),
        required: schema.required.filter((requiredKey) => schema.properties[requiredKey].format !== 'fileId'),
    };
};

export const pickProcessFieldsPropertiesSchema = (schema: IProcessDetails): IMongoEntityTemplatePopulated['properties'] => {
    const schemaProperties = schema.properties;

    Object.keys(schemaProperties.properties).forEach((property) => {
        if (schemaProperties.properties[property].format && schemaProperties.properties[property].format === 'entityReference') {
            delete schemaProperties.properties[property].format;
        }
    });

    const filteredProperties = filterAttachmentsFromPropertiesSchema({
        ...schemaProperties,
        hide: [],
        required: schemaProperties.required,
    });
    return filteredProperties;
};
