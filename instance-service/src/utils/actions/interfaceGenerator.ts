import { EntityTemplateManagerService } from '../../externalServices/templates/entityTemplateManager';
import { IEntitySingleProperty, IMongoEntityTemplate } from '../../externalServices/templates/interfaces/entityTemplates';

const generateFromString = (propertyValues: IEntitySingleProperty, entitiesTemplatesByIds: Map<string, IMongoEntityTemplate>) => {
    const { format, relationshipReference } = propertyValues;

    if (propertyValues.enum) {
        return propertyValues.enum?.map((option) => `'${option}'`).join(' | ');
    }
    if (format === 'date' || format === 'date-time') {
        return 'Date';
    }

    if (format === 'relationshipReference') {
        const entityTemplate: IMongoEntityTemplate = entitiesTemplatesByIds.get(relationshipReference?.relatedTemplateId!)!;

        return entityTemplate.name;
    }

    return 'string';
};

const generateFromArray = (propertyValues: IEntitySingleProperty) => {
    const { items } = propertyValues;

    if (items?.format === 'fileId') {
        return 'string[]';
    }

    const arrayOptions = items?.enum?.map((option) => `'${option}'`).join(' | ');

    return `(${arrayOptions})[]` || 'string[]';
};

export const generateInterface = (
    entity: Record<string, IEntitySingleProperty>,
    interfaceName: string,
    entitiesTemplatesByIds: Map<string, IMongoEntityTemplate>,
) => {
    const dynamicInterface: Record<string, string> = {
        'readonly _id': 'string',
        'readonly createdAt': 'string',
        'readonly updatedAt': 'string',
        'readonly disabled': 'string',
    };

    Object.entries(entity).forEach(([propertyName, propertyValues]) => {
        const { type, serialCurrent } = propertyValues;

        switch (type) {
            case 'number':
                dynamicInterface[`${serialCurrent ? 'readonly ' : ''}${propertyName}`] = 'number';
                break;
            case 'boolean':
                dynamicInterface[propertyName] = 'boolean';
                break;
            case 'array':
                dynamicInterface[propertyName] = generateFromArray(propertyValues);
                break;
            default:
                dynamicInterface[propertyName] = generateFromString(propertyValues, entitiesTemplatesByIds);
        }
    });

    return [
        `interface ${interfaceName} {`,
        ...Object.entries(dynamicInterface).map(([propertyName, propertyType]) => `  ${propertyName}: ${propertyType};`),
        '}',
    ].join('\n');
};

export const getAllRelatedEntities = async (entityId: string, relatedEntities: IMongoEntityTemplate[] = []) => {
    const entityTemplate = await EntityTemplateManagerService.getEntityTemplateById(entityId);
    if (!entityTemplate) return relatedEntities;
    if (!relatedEntities.some((entity) => entity._id === entityTemplate._id)) relatedEntities.push(entityTemplate);

    await Promise.all(
        Object.values(entityTemplate.properties.properties).map(async (propertyValues) => {
            if (propertyValues.format === 'relationshipReference') {
                const { relatedTemplateId = '' } = propertyValues.relationshipReference || {};

                if (!relatedEntities.some((entity) => entity._id === relatedTemplateId)) {
                    await getAllRelatedEntities(relatedTemplateId, relatedEntities);
                }
            }
        }),
    );

    return relatedEntities;
};

export const generateInterfaceWithRelationships = (entitiesTemplatesByIds: Map<string, IMongoEntityTemplate>) => {
    const interfaces = Object.values(entitiesTemplatesByIds).map((entityTemplate) => {
        return generateInterface(entityTemplate.properties.properties, entityTemplate.name, entitiesTemplatesByIds);
    });

    return interfaces.join('\n\n');
};
