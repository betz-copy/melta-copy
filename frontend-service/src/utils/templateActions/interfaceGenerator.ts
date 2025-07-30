import { QueryClient } from 'react-query';
import { CoordinateSystem } from '../../common/inputs/JSONSchemaFormik/RjsfLocationWidget';
import { IEntitySingleProperty, IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';

const generateFromString = ({ format, relationshipReference, enum: typeEnum }: IEntitySingleProperty, queryClient: QueryClient) => {
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    if (typeEnum) return typeEnum?.map((option) => `\`${option}\``).join(' | ');

    if (format === 'date' || format === 'date-time') return 'Date';

    if (format === 'relationshipReference') return entityTemplates.get(relationshipReference?.relatedTemplateId!)!.name;

    if (format === 'location')
        return `{ location: \`Polygon((\${string}))\`, coordinateSystem: ${Object.values(CoordinateSystem)
            .map((coordinateSystem) => `'${coordinateSystem}'`)
            .join(' | ')} }`;

    return 'string';
};

const generateFromArray = ({ items }: IEntitySingleProperty) => {
    if (items?.format === 'fileId' || items?.format === 'user') return 'string[]';

    const arrayOptions = items?.enum?.map((option) => `\`${option}\``).join(' | ');

    return `(${arrayOptions})[]`;
};

const generateInterface = (template: Record<string, IEntitySingleProperty>, interfaceName: string, queryClient: QueryClient) => {
    const dynamicInterface: Record<string, string> = {
        'readonly _id': 'string',
        'readonly createdAt': 'string',
        'readonly updatedAt': 'string',
        'readonly disabled': 'string',
    };

    Object.entries(template).forEach(([propertyName, propertyValues]) => {
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
                dynamicInterface[`${isComment ? 'readonly ' : ''}${propertyName}`] = generateFromString(propertyValues, queryClient);
        }
    });

    return [
        `interface ${interfaceName} {`,
        ...Object.entries(dynamicInterface).map(([propertyName, propertyType]) => `  ${propertyName}: ${propertyType};`),
        '}',
    ].join('\n');
};

const generateInterfacesForRelatedTemplates = (template: Record<string, IEntitySingleProperty>, queryClient: QueryClient) => {
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const interfaces: string[] = [];
    const relationshipReferenceIds = new Set<string>();

    const queue = [template];

    while (queue.length > 0) {
        const currentTemplate = queue.shift()!;

        Object.values(currentTemplate).forEach((propertyValues) => {
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

const generateMergedChildAndParentInterface = (parentInterfaceName: string, childInterfaceName: string) =>
    [
        `// all fields from ${parentInterfaceName} - parent , but overridden by fields from ${childInterfaceName} - child`,
        `interface ${childInterfaceName}Merged extends Omit<${parentInterfaceName},keyof ${childInterfaceName}>, ${childInterfaceName} {}`,
    ].join('\n');

export const generateInterfaceWithRelationships = (
    template: Record<string, IEntitySingleProperty>,
    interfaceName: string,
    queryClient: QueryClient,
    parentTemplate?: IMongoEntityTemplatePopulated,
): string => {
    const baseTemplate = parentTemplate?.properties.properties ?? template;
    const baseName = parentTemplate?.name ?? interfaceName;
    const hasParent = !!parentTemplate;

    const interfaces = [
        ...generateInterfacesForRelatedTemplates(baseTemplate, queryClient).reverse(),
        generateInterface(baseTemplate, baseName, queryClient),
        ...(hasParent
            ? [generateInterface(template, interfaceName, queryClient), generateMergedChildAndParentInterface(parentTemplate!.name, interfaceName)]
            : []),
    ];

    return interfaces.join('\n\n');
};
