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

export const generateInterfaceWithRelationships = (entity: Record<string, IEntitySingleProperty>, interfaceName: string) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const relatedTemplateIds = [
        ...new Set(
            Object.values(entity)
                .filter(({ format }) => format === 'relationshipReference')
                .map(({ relationshipReference }) => relationshipReference?.relatedTemplateId!),
        ),
    ];

    const generatedInterfacesForRelatedEntities = relatedTemplateIds.map((relatedTemplate) => {
        const entityTemplate: IMongoEntityTemplatePopulated = entityTemplates.get(relatedTemplate)!;
        return generateInterface(entityTemplate.properties.properties, entityTemplate.name);
    });

    const generatedInterfaceForEntity = generateInterface(entity, interfaceName);
    const interfaces = [...generatedInterfacesForRelatedEntities, generatedInterfaceForEntity].join('\n\n');
    return interfaces;
};
