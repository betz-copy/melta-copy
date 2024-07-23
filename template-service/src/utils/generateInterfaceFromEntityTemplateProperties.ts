import { IEntitySingleProperty } from '../express/entityTemplate/interface';
import EntityTemplateManager from '../express/entityTemplate/manager';

const generateFromString = (propertyValues: IEntitySingleProperty) => {
    const { format } = propertyValues;

    if (propertyValues.enum) {
        return propertyValues.enum?.map((option) => `'${option}'`).join(' | ');
    }
    if (format === 'date' || format === 'date-time') {
        return 'Date';
    }

    if (format === 'relationshipReference') {
        // const relatedEntityTemplate = await EntityTemplateManager.getTemplateById(relationshipReference?.relatedTemplateId!);
        // console.log({ relatedEntityTemplate });
        // return relatedEntityTemplate.name;
        return 'Wallet';
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

export const generateInterfaceWithRelationships = async (entity: Record<string, IEntitySingleProperty>, interfaceName: string) => {
    const relatedTemplateIds: string[] = [];
    let interfaces = '';
    Object.entries(entity).forEach(([_propertyName, propertyValues]) => {
        if (propertyValues.format === 'relationshipReference') {
            const { relatedTemplateId } = propertyValues.relationshipReference!;
            if (!relatedTemplateIds.includes(relatedTemplateId!)) relatedTemplateIds.push(relatedTemplateId);
        }
    });

    await Promise.all(
        relatedTemplateIds.map(async (relatedTemplate) => {
            const entityTemplate = await EntityTemplateManager.getTemplateById(relatedTemplate);
            const generatedInterface = generateInterface(entityTemplate.properties.properties, entityTemplate.name);
            // eslint-disable-next-line prefer-template, no-useless-concat
            interfaces += generatedInterface + '\n' + '\n';
        }),
    );
    interfaces += generateInterface(entity, interfaceName);

    return interfaces;
};
