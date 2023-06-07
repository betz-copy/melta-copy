import pickBy from 'lodash.pickby';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { IProcessDetails } from '../interfaces/processes/processTemplate';

export const filterAttachmentsPropertiesFromSchema = (
    schema: IMongoEntityTemplatePopulated['properties'],
): IMongoEntityTemplatePopulated['properties'] => {
    return {
        ...schema,
        properties: pickBy(schema.properties, (value) => value.format !== 'fileId'),
        required: schema.required.filter((requiredKey) => schema.properties[requiredKey].format !== 'fileId'),
    };
};

export const filterAttachmentsProcessPropertiesFromSchema = (
    schema: IProcessDetails,
): IMongoEntityTemplatePopulated['properties'] => {
    return filterAttachmentsPropertiesFromSchema({ ...schema.properties, hide: [], required: [] })

};
