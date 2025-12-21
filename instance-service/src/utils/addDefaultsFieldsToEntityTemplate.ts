import { IMongoEntityTemplate } from '@packages/entity-template';

const addDefaultFieldsToTemplate = (entityTemplate: IMongoEntityTemplate): IMongoEntityTemplate => {
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
        } as IMongoEntityTemplate['properties'],
        propertiesOrder: [...entityTemplate.propertiesOrder, '_id', 'disabled', 'createdAt', 'updatedAt'] as IMongoEntityTemplate['propertiesOrder'],
    } as IMongoEntityTemplate;
};

export default addDefaultFieldsToTemplate;
