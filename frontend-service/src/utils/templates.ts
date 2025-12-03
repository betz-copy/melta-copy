import { IMongoCategory } from '../interfaces/categories';
import { IChildTemplateMap, IChildTemplatePopulated, IMongoChildTemplatePopulated } from '../interfaces/childTemplates';
import { IEntity, IEntityExpanded } from '../interfaces/entities';
import { IEntityTemplateMap, IEntityTemplatePopulated, IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { IMongoRelationshipTemplate, IMongoRelationshipTemplatePopulated, IRelationshipTemplateMap } from '../interfaces/relationshipTemplates';
import { INestedRelationshipTemplates } from '../pages/Entity';

export const templatesCompareFunc = (templateA: IMongoEntityTemplatePopulated, templateB: IMongoEntityTemplatePopulated) => {
    if (templateA.category._id !== templateB.category._id) {
        return templateA.category.displayName.localeCompare(templateB.category.displayName);
    }
    return templateA.displayName.localeCompare(templateB.displayName);
};

export const populateRelationshipTemplate = (
    { sourceEntityId, destinationEntityId, ...restOfRelationshipTemplate }: IMongoRelationshipTemplate,
    entityTemplates: IEntityTemplateMap,
    groupChildTemplate?: Record<string, IChildTemplatePopulated[]>,
): IMongoRelationshipTemplatePopulated => {
    return {
        sourceEntity: entityTemplates.get(sourceEntityId) ?? getFakeParentByChildren(sourceEntityId, groupChildTemplate)!,
        destinationEntity: entityTemplates.get(destinationEntityId) ?? getFakeParentByChildren(destinationEntityId, groupChildTemplate)!,
        ...restOfRelationshipTemplate,
    };
};

export const groupChildTemplatesByParent = (
    childTemplates: IChildTemplateMap,
    entityTemplates: IEntityTemplateMap,
): Record<string, IChildTemplatePopulated[]> => {
    const grouped: Record<string, IChildTemplatePopulated[]> = {};

    for (const childTemplate of childTemplates.values()) {
        const parentId = childTemplate.parentTemplate._id.toString();

        if (!entityTemplates.get(parentId)) {
            // to use it only if there are permission only to children
            if (!grouped[parentId]) grouped[parentId] = [childTemplate];
            else grouped[parentId].push(childTemplate);
        }
    }

    return grouped;
};

const getFakeParentByChildren = (id: string, groupChildTemplate?: Record<string, IChildTemplatePopulated[]>) => {
    const relevantGroup = groupChildTemplate?.[id] ?? [];

    const relevantProperties = {};
    const propertiesOrder: string[] = [];
    relevantGroup.forEach(({ properties: { properties } }) => {
        Object.entries(properties).forEach(([key, value]) => {
            if (relevantProperties[key] && !value.filters) return;
            else if (!relevantProperties[key]) {
                relevantProperties[key] = value;
                propertiesOrder.push(key);
            } else if (relevantProperties[key] && value.filters) {
                const prevFilters = relevantProperties[key].filters;
                relevantProperties[key].filters = prevFilters
                    ? JSON.stringify({
                          $or: [...JSON.parse(prevFilters).$or, ...JSON.parse(value.filters).$or],
                      })
                    : value.filters;
            }
        });
    });

    if (!relevantGroup.length) return undefined;

    return {
        ...relevantGroup[0],
        properties: { ...relevantGroup[0].properties, properties: relevantProperties },
        propertiesOrder,
        _id: id,
        displayName: relevantGroup[0].parentTemplate.displayName,
    };
};

export const getFullRelationshipTemplates = (
    relationshipTemplates: IRelationshipTemplateMap,
    entityTemplates: IEntityTemplateMap,
    parentEntityTemplate: IMongoEntityTemplatePopulated,
    depth: number,
    parentRelationshipTemplate?: IMongoRelationshipTemplatePopulated,
    expandedEntity?: IEntityExpanded,
    groupChildTemplate?: Record<string, IChildTemplatePopulated[]>,
    filterOnlyThoseWithInstances = false,
): INestedRelationshipTemplates[] => {
    const result: INestedRelationshipTemplates[] = [];

    for (const relationshipTemplate of relationshipTemplates.values()) {
        const isSelfProperty =
            relationshipTemplate.isProperty &&
            parentEntityTemplate.properties.properties[relationshipTemplate.name]?.relationshipReference?.relationshipTemplateId ===
                relationshipTemplate._id;

        const connection =
            relationshipTemplate.sourceEntityId === parentEntityTemplate._id
                ? 'sourceEntity'
                : relationshipTemplate.destinationEntityId === parentEntityTemplate._id
                  ? 'destinationEntity'
                  : undefined;

        if (isSelfProperty || !connection) continue;

        const hasInstances = expandedEntity?.connections.some(({ relationship: { templateId } }) => templateId === relationshipTemplate._id)!;

        if (filterOnlyThoseWithInstances && !hasInstances) continue;

        if (parentRelationshipTemplate?._id === relationshipTemplate._id) continue;

        result.push({
            relationshipTemplate: {
                ...populateRelationshipTemplate(relationshipTemplate, entityTemplates, groupChildTemplate),
                [connection]: parentEntityTemplate,
            },
            hasInstances,
            isExpandedEntityRelationshipSource: relationshipTemplate.sourceEntityId === parentEntityTemplate._id,
            children: [],
            depth,
            parentRelationship: parentRelationshipTemplate,
        });
    }
    return result;
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

export const getFirstXPropsKeys = (numOfPropsToShow: number, entityTemplate: IEntityTemplatePopulated): string[] => {
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

export const getFirstXFilledPropsKeys = (
    numOfPropsToShow: number,
    entityTemplate: IEntityTemplatePopulated,
    entity: IEntity,
): string[] => {
      if (entityTemplate.propertiesPreview.length) return entityTemplate.propertiesPreview;
    return getFirstXPropsKeys(numOfPropsToShow, entityTemplate).filter((field) => {
        const value = entity.properties[field];
        return value != null && value !== '';
    });
};

export const isChildTemplate = (
    template: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated | undefined | null,
): template is IMongoChildTemplatePopulated => {
    return typeof template === 'object' && template !== null && 'parentTemplate' in template && Boolean(template.parentTemplate);
};
