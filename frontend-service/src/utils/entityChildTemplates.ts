import { IEntityChildTemplate } from '../interfaces/entityChildTemplates';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';

// returns IEntitySingleProperty for childTemplate properties and filters the enum lists according to childTemplate filters
export const getFullChildTemplateProperties = (
    childTemplate: IEntityChildTemplate,
    parentTemplate: IMongoEntityTemplatePopulated,
): Record<string, IEntitySingleProperty> => {
    const result: Record<string, IEntitySingleProperty> = {};

    for (const key of Object.keys(childTemplate.properties)) {
        const parentProp = parentTemplate.properties.properties[key];
        const childProp = childTemplate.properties[key];

        let filterObj: any = null;

        if (typeof childProp?.filters === 'string') {
            try {
                filterObj = JSON.parse(childProp.filters);
            } catch {
                continue;
            }
        } else if (typeof childProp?.filters === 'object' && childProp.filters !== null) {
            filterObj = childProp.filters;
        }

        if (!filterObj?.$and) {
            result[key] = parentProp;
            continue;
        }

        const enumEquals = filterObj.$and.map((condition: any) => condition.enum?.$eq).filter((val: any): val is string => typeof val === 'string');

        const multiEnumIn = filterObj.$and
            .map((condition: any) => condition.multiEnum?.$in)
            .filter((val: any): val is string[] => Array.isArray(val))
            .flat();

        if (parentProp?.enum) {
            const filteredEnum = enumEquals.length > 0 ? parentProp.enum.filter((val: string) => enumEquals.includes(val)) : parentProp.enum;

            result[key] = {
                ...parentProp,
                enum: filteredEnum,
            };
        } else if (parentProp?.type === 'array' && parentProp.items?.enum) {
            const filteredMultiEnum =
                multiEnumIn.length > 0 ? parentProp.items.enum.filter((val: string) => multiEnumIn.includes(val)) : parentProp.items.enum;

            result[key] = {
                ...parentProp,
                items: {
                    ...parentProp.items,
                    enum: filteredMultiEnum,
                },
            };
        } else {
            result[key] = parentProp;
        }
    }

    return result;
};
