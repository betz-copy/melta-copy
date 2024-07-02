import { IEntitySingleProperty } from '../interfaces/entityTemplates';

const generateFromString = (propertyValues: IEntitySingleProperty) => {
    const { format } = propertyValues;

    if (propertyValues.enum) {
        return propertyValues.enum?.map((option) => `'${option}'`).join(' | ');
    }
    if (format === 'date' || format === 'date-time') {
        return 'Date';
    }
    // if (format === 'relationshipReference') {

    // }
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

    // return `interface ${interfaceName} ${JSON.stringify(dynamicInterface, null, 2)};`;
    let interfaceDefinition = `interface ${interfaceName} {\n`;

    Object.entries(dynamicInterface).forEach(([propertyName, propertyType]) => {
        interfaceDefinition += `  ${propertyName}: ${propertyType};\n`;
    });

    interfaceDefinition += '}';
    console.log(interfaceDefinition);

    return interfaceDefinition;
};
