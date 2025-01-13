import { QueryClient } from 'react-query';
import { IEntitySingleProperty, IEntityTemplateMap, IMongoEntityTemplatePopulated } from '@microservices/shared-interfaces';

const generateFromString = ({ format, relationshipReference, enum: typeEnum }: IEntitySingleProperty, queryClient: QueryClient) => {
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    if (typeEnum) return typeEnum?.map((option) => `\`${option}\``).join(' | ');

    if (format === 'date' || format === 'date-time') return 'Date';

    if (format === 'relationshipReference') return entityTemplates.get(relationshipReference!.relatedTemplateId)!.name;

    return 'string';
};

const generateFromArray = ({ items }: IEntitySingleProperty) => {
    if (items?.format === 'fileId') return 'string[]';

    const arrayOptions = items?.enum?.map((option) => `\`${option}\``).join(' | ');

    return `(${arrayOptions})[]`;
};

export const generateInterface = (entity: Record<string, IEntitySingleProperty>, interfaceName: string, queryClient: QueryClient) => {
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
                dynamicInterface[propertyName] = generateFromString(propertyValues, queryClient);
        }
    });

    return [
        `interface ${interfaceName} {`,
        ...Object.entries(dynamicInterface).map(([propertyName, propertyType]) => `  ${propertyName}: ${propertyType};`),
        '}',
    ].join('\n');
};

const generateInterfacesForRelatedEntities = (entity: Record<string, IEntitySingleProperty>, queryClient: QueryClient) => {
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
                    interfaces.push(generateInterface(relatedTemplate.properties.properties, relatedTemplate.name, queryClient));
                    queue.push(relatedTemplate.properties.properties);
                }
            }
        });
    }

    return interfaces;
};

export const generateInterfaceWithRelationships = (
    entity: Record<string, IEntitySingleProperty>,
    interfaceName: string,
    queryClient: QueryClient,
) => {
    const generatedInterfacesForRelatedEntities = generateInterfacesForRelatedEntities(entity, queryClient).reverse();
    const generatedInterfaceForEntity = generateInterface(entity, interfaceName, queryClient);

    return [...generatedInterfacesForRelatedEntities, generatedInterfaceForEntity].join('\n\n');
};
