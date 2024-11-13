import { IMongoEntityTemplate } from '@microservices/shared/src/interfaces/entityTemplate';

export const addDefaultFieldsToTemplate = (entityTemplate: IMongoEntityTemplate): IMongoEntityTemplate => {
    return {
        ...entityTemplate.toObject(),
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
