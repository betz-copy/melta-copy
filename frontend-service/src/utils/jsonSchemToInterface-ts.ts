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

    let interfaceDefinition = `interface ${interfaceName} {\n`;
    Object.entries(dynamicInterface).forEach(([propertyName, propertyType]) => {
        interfaceDefinition += `  ${propertyName}: ${propertyType};\n`;
    });
    interfaceDefinition += '}';

    return interfaceDefinition;
};

export const generateInterfaceWithRelationships = (entity: Record<string, IEntitySingleProperty>, interfaceName: string) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const relatedTemplateIds: string[] = [];
    let interfaces = '';
    Object.entries(entity).forEach(([_propertyName, propertyValues]) => {
        if (propertyValues.format === 'relationshipReference') {
            const { relatedTemplateId } = propertyValues.relationshipReference!;
            if (!relatedTemplateIds.includes(relatedTemplateId!)) relatedTemplateIds.push(relatedTemplateId);
        }
    });

    relatedTemplateIds.map((relatedTemplate) => {
        const entityTemplate: IMongoEntityTemplatePopulated = entityTemplates.get(relatedTemplate)!;
        const generatedInterface = generateInterface(entityTemplate.properties.properties, entityTemplate.name);
        console.log({ generatedInterface });

        interfaces += generatedInterface + '\n' + '\n';
    });

    interfaces += generateInterface(entity, interfaceName);
    return interfaces;
};
