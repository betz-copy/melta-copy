import pickBy from 'lodash.pickby';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';

export const filterAttachmentsPropertiesFromSchema = (
    schema: IMongoEntityTemplatePopulated['properties'],
): IMongoEntityTemplatePopulated['properties'] => {
    return {
        ...schema,
        properties: pickBy(schema.properties, (value) => value.format !== 'fileId'),
        required: schema.required.filter((requiredKey) => schema.properties[requiredKey].format !== 'fileId'),
    };
};
