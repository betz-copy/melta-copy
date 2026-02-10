import { EntityTemplateType, getChildPropertiesFiltered, TemplateItem } from '@packages/child-template';
import { IEntitySingleProperty } from '@packages/entity-template';
import { CoordinateSystem } from '@packages/map';

const generateFromString = (
    { format, relationshipReference, enum: typeEnum }: IEntitySingleProperty,
    entitiesTemplatesByIds: Map<string, TemplateItem>,
) => {
    if (typeEnum) return typeEnum?.map((option) => `\`${option}\``).join(' | ');

    if (['date', 'date-time'].includes(format ?? '')) return 'Date';

    if (format === 'relationshipReference') return entitiesTemplatesByIds.get(relationshipReference!.relatedTemplateId)!.metaData.name;

    if (format === 'location')
        return `{ location: \`Polygon((\${string}))\`, coordinateSystem: ${Object.values(CoordinateSystem)
            .map((coordinateSystem) => `'${coordinateSystem}'`)
            .join(' | ')} }`;

    return 'string';
};

const generateFromArray = ({ items }: IEntitySingleProperty) => {
    if (['fileId', 'user'].includes(items?.format ?? '')) return 'string[]';

    const arrayOptions = items?.enum?.map((option) => `\`${option}\``).join(' | ');

    return `(${arrayOptions})[]` || 'string[]';
};

export const generateInterface = (
    entity: Record<string, IEntitySingleProperty>,
    interfaceName: string,
    entitiesTemplatesByIds: Map<string, TemplateItem>,
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

const generateMergedChildAndParentInterface = (parentInterfaceName: string, childInterfaceName: string) =>
    [
        `// all fields from ${parentInterfaceName} - parent , but overridden by fields from ${childInterfaceName} - child`,
        `interface ${childInterfaceName}Merged extends Omit<${parentInterfaceName},keyof ${childInterfaceName}>, ${childInterfaceName} {}`,
    ].join('\n');

export const generateInterfaceWithRelationships = (templateId: string, entitiesTemplatesByIds: Map<string, TemplateItem>) => {
    const currentTemplate = entitiesTemplatesByIds.get(templateId)!;
    const isChildTemplate = currentTemplate.type === EntityTemplateType.Child;
    const template = isChildTemplate ? currentTemplate.metaData.parentTemplate : currentTemplate.metaData;

    const relatedTemplates = Array.from(entitiesTemplatesByIds.values()).filter(({ metaData }) => metaData._id !== templateId);

    const interfaces = [
        ...relatedTemplates.map(
            ({
                metaData: {
                    properties: { properties },
                    name,
                },
            }) => generateInterface(properties, name, entitiesTemplatesByIds),
        ),
        generateInterface(template.properties.properties, template.name, entitiesTemplatesByIds),
        ...(isChildTemplate
            ? [
                  generateInterface(
                      getChildPropertiesFiltered(currentTemplate.metaData.properties.properties),
                      currentTemplate.metaData.name,
                      entitiesTemplatesByIds,
                  ),
                  generateMergedChildAndParentInterface(template.name, currentTemplate.metaData.name),
              ]
            : []),
    ];

    return interfaces.join('\n\n');
};
