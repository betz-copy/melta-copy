import { IMongoEntityTemplate } from '../externalServices/templates/interfaces/entityTemplates';

export const addDefaultFieldsToTemplate = (entityTemplate: IMongoEntityTemplate): IMongoEntityTemplate => {
    return {
        ...entityTemplate,
        properties: {
            ...entityTemplate.properties,
            properties: {
                ...entityTemplate.properties.properties,
                _id: { title: '_id', type: 'string' },
                disabled: { title: 'disabled', type: 'boolean' },
                createdAt: { title: 'createdAt', type: 'string', format: 'date-time' },
                updatedAt: { title: 'updatedAt', type: 'string', format: 'date-time' },
            },
        },
        propertiesOrder: [...entityTemplate.propertiesOrder, '_id', 'disabled', 'createdAt', 'updatedAt'],
    };
};
