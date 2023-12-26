import pickBy from 'lodash.pickby';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { IProcessDetails } from '../interfaces/processes/processTemplate';

export const filterAttachmentsAndEntitiesRefFromPropertiesSchema = (
    schema: IMongoEntityTemplatePopulated['properties'],
): IMongoEntityTemplatePopulated['properties'] => {
    return {
        ...schema,
        properties: pickBy(schema.properties, (value) => value.format !== 'fileId' && value.format !== 'entityReference'),
        required: schema.required.filter(
            (requiredKey) => schema.properties[requiredKey].format !== 'fileId' && schema.properties[requiredKey].format !== 'entityReference',
        ),
    };
};

export const pickProcessFieldsPropertiesSchema = (schema: IProcessDetails): IMongoEntityTemplatePopulated['properties'] => {
    const filteredProperties = filterAttachmentsAndEntitiesRefFromPropertiesSchema({
        ...schema.properties,
        hide: [],
        required: schema.properties.required,
    });

    return {
        ...filteredProperties,
    };
};
