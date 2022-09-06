import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { IMongoRelationshipTemplate, IMongoRelationshipTemplatePopulated } from '../interfaces/relationshipTemplates';

export const templatesCompareFunc = (templateA: IMongoEntityTemplatePopulated, templateB: IMongoEntityTemplatePopulated) => {
    if (templateA.category._id !== templateB.category._id) {
        return templateA.category.displayName.localeCompare(templateB.category.displayName);
    }
    return templateA.displayName.localeCompare(templateB.displayName);
};

export const populateRelationshipTemplate = (
    relationshipTemplate: IMongoRelationshipTemplate,
    entityTemplates: IMongoEntityTemplatePopulated[],
): IMongoRelationshipTemplatePopulated => {
    const { sourceEntityId, destinationEntityId, ...restOfRelationshipTemplate } = relationshipTemplate;

    const sourceEntity = entityTemplates.find(({ _id }) => _id === sourceEntityId)!;
    const destinationEntity = entityTemplates.find(({ _id }) => _id === destinationEntityId)!;

    return {
        sourceEntity,
        destinationEntity,
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
