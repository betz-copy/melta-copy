import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { objectFilter } from './object';

export const filterAttachmentsPropertiesFromSchema = (
    schema: IMongoEntityTemplatePopulated['properties'],
): IMongoEntityTemplatePopulated['properties'] => {
    return {
        ...schema,
        properties: objectFilter(schema.properties, (_key, value) => value.format !== 'fileId'),
        required: schema.required.filter((requiredKey) => schema.properties[requiredKey].format !== 'fileId'),
    };
};
