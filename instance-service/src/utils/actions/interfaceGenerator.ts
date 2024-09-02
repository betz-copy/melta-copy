import { EntityTemplateManagerService } from '../../externalServices/templates/entityTemplateManager';
import { IEntitySingleProperty, IMongoEntityTemplate } from '../../externalServices/templates/interfaces/entityTemplates';

const generateFromString = async (propertyValues: IEntitySingleProperty) => {
    const { format, relationshipReference } = propertyValues;

    if (propertyValues.enum) {
        return propertyValues.enum?.map((option) => `'${option}'`).join(' | ');
    }
    if (format === 'date' || format === 'date-time') {
        return 'Date';
    }

    if (format === 'relationshipReference') {
        const entityTemplate: IMongoEntityTemplate = await EntityTemplateManagerService.getEntityTemplateById(
            relationshipReference?.relatedTemplateId!,
        )!;

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

export const generateInterface = async (entity: Record<string, IEntitySingleProperty>, interfaceName: string) => {
    const dynamicInterface: Record<string, string> = {
        'readonly _id': 'string',
        'readonly createdAt': 'string',
        'readonly updatedAt': 'string',
        'readonly disabled': 'string',
    };

    const getAllPropertiesTypes = Object.entries(entity).map(async ([propertyName, propertyValues]) => {
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
                dynamicInterface[propertyName] = await generateFromString(propertyValues);
        }
    });

    await Promise.all(getAllPropertiesTypes);

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

    console.dir({ relatedEntities }, { depth: null });

    return relatedEntities;
};

export const generateInterfaceWithRelationships = async (id: string) => {
    const entityAndAllRelatedEntities = await getAllRelatedEntities(id);
    const interfaces = await Promise.all(
        entityAndAllRelatedEntities.map(async (entity) => {
            return generateInterface(entity.properties.properties, entity.name);
        }),
    );

    return interfaces.join('\n\n');
};
