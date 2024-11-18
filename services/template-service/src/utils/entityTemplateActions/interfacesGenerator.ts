import { IEntitySingleProperty, IEntityTemplatePopulated } from '@microservices/shared';

const generateFromString = (
    { format, relationshipReference, enum: typeEnum }: IEntitySingleProperty,
    entitiesTemplatesByIds: Map<string, IEntityTemplatePopulated>,
) => {
    if (typeEnum) return typeEnum?.map((option) => `\`${option}\``).join(' | ');

    if (format === 'date' || format === 'date-time') return 'Date';

    if (format === 'relationshipReference') return entitiesTemplatesByIds.get(relationshipReference?.relatedTemplateId!)!.name;

    return 'string';
};

const generateFromArray = ({ items }: IEntitySingleProperty) => {
    if (items?.format === 'fileId') return 'string[]';

    const arrayOptions = items?.enum?.map((option) => `\`${option}\``).join(' | ');

    return `(${arrayOptions})[]` || 'string[]';
};

export const generateInterface = (
    entity: Record<string, IEntitySingleProperty>,
    interfaceName: string,
    entitiesTemplatesByIds: Map<string, IEntityTemplatePopulated>,
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

export const generateInterfaceWithRelationships = (entitiesTemplatesByIds: Map<string, IEntityTemplatePopulated>) =>
    [...entitiesTemplatesByIds.values()]
        .map(({ properties: { properties }, name }) => generateInterface(properties, name, entitiesTemplatesByIds))
        .join('\n\n');
