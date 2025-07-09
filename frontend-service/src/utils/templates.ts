import { IMongoCategory } from '../interfaces/categories';
import { IMongoChildTemplatePopulated } from '../interfaces/childTemplates';
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

    return {
        sourceEntity: entityTemplates.find((entity) => entity._id === sourceEntityId)!,
        destinationEntity: entityTemplates.find((entity) => entity._id === destinationEntityId)!,
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

export const mapCategories = (categories: IMongoCategory[], order: string[]): Map<string, IMongoCategory> => {
    const map: Map<string, IMongoCategory> = new Map();

    const sortedCategories = order.length > 0 ? categories.sort((a, b) => order.indexOf(a._id) - order.indexOf(b._id)) : categories;

    sortedCategories.forEach((category) => {
        map.set(category._id, category);
    });

    return map;
};

export const addDefaultFieldsToTemplate = <T extends IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated>(entityTemplate: T): T => {
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

export const getFirstXPropsKeys = (numOfPropsToShow: number, entityTemplate: IMongoEntityTemplatePopulated): string[] => {
    return [
        ...entityTemplate.propertiesPreview,
        ...entityTemplate.propertiesOrder
            .filter(
                (property) =>
                    !entityTemplate.propertiesPreview.includes(property) &&
                    entityTemplate.properties.properties[property].format !== 'fileId' &&
                    entityTemplate.properties.properties[property].items?.format !== 'fileId',
            )
            .slice(0, Math.max(numOfPropsToShow - entityTemplate.propertiesPreview.length, 0)),
    ];
};

export const isChildTemplate = (template: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated): template is IMongoChildTemplatePopulated => {
    return 'fatherTemplateId' in template && Boolean(template.fatherTemplateId);
};
