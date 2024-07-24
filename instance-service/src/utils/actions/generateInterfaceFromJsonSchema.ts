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
    return `(${arrayOptions})[]`;
};

export const generateInterface = async (entity: Record<string, IEntitySingleProperty>, interfaceName: string) => {
    const dynamicInterface: Record<string, string> = {
        'readonly _id': 'string',
        'readonly createdDate': 'string',
        'readonly updatedAt': 'string',
        'readonly disabled': 'string',
    };

    const promises = Object.entries(entity).map(async ([propertyName, propertyValues]) => {
        const { type } = propertyValues;

        switch (type) {
            case 'number':
                dynamicInterface[propertyName] = 'number';
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

    await Promise.all(promises);

    return [
        `interface ${interfaceName} {`,
        ...Object.entries(dynamicInterface).map(([propertyName, propertyType]) => `  ${propertyName}: ${propertyType};`),
        '}',
    ].join('\n');
};

async function getAllRelatedEntities(entityId, relatedEntities: IMongoEntityTemplate[] = []) {
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
}

export const generateInterfaceWithRelationships = async (id: string) => {
    const interfaces: string[] = [];

    const entityAndAllRelatedEntities = await getAllRelatedEntities(id);
    await Promise.all(
        entityAndAllRelatedEntities.map(async (entity) => {
            const generatedInterface = await generateInterface(entity.properties.properties, entity.name);
            interfaces.push(generatedInterface);
        }),
    );

    return interfaces.join('\n\n');
};
