import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { IMongoRelationshipTemplate, IMongoRelationshipTemplatePopulated } from '../interfaces/relationshipTemplates';

export const templatesCompareFunc = (templateA: IMongoEntityTemplatePopulated, templateB: IMongoEntityTemplatePopulated) => {
    if (templateA.category._id !== templateB.category._id) {
        return templateA.category.displayName.localeCompare(templateB.category.displayName);
    }
    return templateA.displayName.localeCompare(templateB.displayName);
};

export const populateRelationshipTemplate = (
    relationshipTemplate: IMongoRelationshipTemplate,
    entityTemplates: IEntityTemplateMap,
): IMongoRelationshipTemplatePopulated => {
    const { sourceEntityId, destinationEntityId, ...restOfRelationshipTemplate } = relationshipTemplate;

    return {
        sourceEntity: entityTemplates.get(sourceEntityId)!,
        destinationEntity: entityTemplates.get(destinationEntityId)!,
        ...restOfRelationshipTemplate,
    };
};

export const getOppositeEntityTemplate = (entityTemplateId: string, relationshipTemplate: IMongoRelationshipTemplatePopulated) => {
    const { sourceEntity, destinationEntity } = relationshipTemplate;
    return sourceEntity._id === entityTemplateId ? destinationEntity : sourceEntity;
};

export const isRelationshipConnectedToEntityTemplate = (
    entityTemplate: IMongoEntityTemplatePopulated,
    relationshipTemplate: IMongoRelationshipTemplatePopulated,
) => {
    const { sourceEntity, destinationEntity } = relationshipTemplate;
    return sourceEntity._id === entityTemplate._id || destinationEntity._id === entityTemplate._id;
};

export const mapTemplates = <T extends Record<string, any> & { _id: string }>(templates: T[], sortByField: keyof T = 'displayName') => {
    const map: Map<string, T> = new Map();

    const sortedTemplates = templates.sort((a, b) => a[sortByField].localeCompare(b[sortByField]));

    sortedTemplates.forEach((template) => {
        map.set(template._id, template);
    });

    return map;
};

export const addDefaultFieldsToTemplate = (entityTemplate: IMongoEntityTemplatePopulated): IMongoEntityTemplatePopulated => {
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
    };
};
