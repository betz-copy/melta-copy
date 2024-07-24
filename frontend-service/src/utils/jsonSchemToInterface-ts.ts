import { useQueryClient } from 'react-query';
import { IEntitySingleProperty, IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';

const generateFromString = (propertyValues: IEntitySingleProperty) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const { format, relationshipReference } = propertyValues;

    if (propertyValues.enum) {
        return propertyValues.enum?.map((option) => `'${option}'`).join(' | ');
    }
    if (format === 'date' || format === 'date-time') {
        return 'Date';
    }

    if (format === 'relationshipReference') {
        const entityTemplate: IMongoEntityTemplatePopulated = entityTemplates.get(relationshipReference?.relatedTemplateId!)!;

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

export const generateInterface = (entity: Record<string, IEntitySingleProperty>, interfaceName: string) => {
    const dynamicInterface: Record<string, string> = {
        'readonly _id': 'string',
        'readonly createdDate': 'string',
        'readonly updatedAt': 'string',
        'readonly disabled': 'string',
    };

    Object.entries(entity).forEach(([propertyName, propertyValues]) => {
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
                dynamicInterface[propertyName] = generateFromString(propertyValues);
        }
    });

    return [
        `interface ${interfaceName} {`,
        ...Object.entries(dynamicInterface).map(([propertyName, propertyType]) => `  ${propertyName}: ${propertyType};`),
        '}',
    ].join('\n');
};

const generateInterfacesForRelatedEntities = (entity: Record<string, IEntitySingleProperty>) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const interfaces: string[] = [];
    const relationshipReferenceIds = new Set<string>();

    const queue = [entity];

    while (queue.length > 0) {
        const currentEntity = queue.shift()!;

        Object.values(currentEntity).forEach((propertyValues) => {
            if (propertyValues.format === 'relationshipReference') {
                const { relatedTemplateId = '' } = propertyValues.relationshipReference || {};

                if (!relationshipReferenceIds.has(relatedTemplateId)) {
                    const relatedTemplate: IMongoEntityTemplatePopulated = entityTemplates.get(relatedTemplateId)!;

                    relationshipReferenceIds.add(relatedTemplateId);
                    interfaces.push(generateInterface(relatedTemplate.properties.properties, relatedTemplate.name));
                    queue.push(relatedTemplate.properties.properties);
                }
            }
        });
    }

    return interfaces;
};

export const generateInterfaceWithRelationships = (entity: Record<string, IEntitySingleProperty>, interfaceName: string) => {
    const generatedInterfacesForRelatedEntities = generateInterfacesForRelatedEntities(entity).reverse();
    const generatedInterfaceForEntity = generateInterface(entity, interfaceName);

    const allInterfaces = [...generatedInterfacesForRelatedEntities, generatedInterfaceForEntity].join('\n\n');
    return allInterfaces;
};
