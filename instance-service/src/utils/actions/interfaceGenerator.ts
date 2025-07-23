import { CoordinateSystem, IEntitySingleProperty, IMongoEntityTemplate } from '@microservices/shared';

const generateFromString = (
    { format, relationshipReference, enum: typeEnum }: IEntitySingleProperty,
    entitiesTemplatesByIds: Map<string, IMongoEntityTemplate>,
) => {
    if (typeEnum) return typeEnum?.map((option) => `\`${option}\``).join(' | ');

    if (format === 'date' || format === 'date-time') return 'Date';

    if (format === 'relationshipReference') return entitiesTemplatesByIds.get(relationshipReference!.relatedTemplateId)!.name;

    if (format === 'location')
        return `{ location: \`Polygon((\${string}))\`, coordinateSystem: ${Object.values(CoordinateSystem)
            .map((coordinateSystem) => `'${coordinateSystem}'`)
            .join(' | ')} }`;

    return 'string';
};

const generateFromArray = ({ items }: IEntitySingleProperty) => {
    if (items?.format === 'fileId' || items?.format === 'user') return 'string[]';

    const arrayOptions = items?.enum?.map((option) => `\`${option}\``).join(' | ');

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
        const isComment = propertyValues.format === 'comment';

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
                dynamicInterface[`${isComment ? 'readonly ' : ''}${propertyName}`] = generateFromString(propertyValues, entitiesTemplatesByIds);
        }
    });

    return [
        `interface ${interfaceName} {`,
        ...Object.entries(dynamicInterface).map(([propertyName, propertyType]) => `  ${propertyName}: ${propertyType};`),
        '}',
    ].join('\n');
};

export const generateInterfaceWithRelationships = (entitiesTemplatesByIds: Map<string, IMongoEntityTemplate>) =>
    [...entitiesTemplatesByIds.values()]
        .map(({ properties: { properties }, name }) => generateInterface(properties, name, entitiesTemplatesByIds))
        .join('\n\n');
