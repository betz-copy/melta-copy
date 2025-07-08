import { IFilterOfTemplate, ISearchFilter } from '../interfaces/entity';
import { IEntityChildTemplate, IEntityChildTemplatePopulated } from '../interfaces/entityChildTemplate';
import { IEntitySingleProperty, IMongoEntityTemplate } from '../interfaces/entityTemplate';

const getFilterFromChildTemplate = (childTemplate: IEntityChildTemplatePopulated): ISearchFilter => {
    return Object.entries(childTemplate.properties.properties ?? {}).reduce<{ $and: IFilterOfTemplate<Record<string, any>>[] }>(
        (acc, [key, prop]) => {
            if (!prop.filters) return acc;

            const parsedFilters: ISearchFilter = typeof prop.filters === 'string' ? JSON.parse(prop.filters) : prop.filters;

            if (Array.isArray(parsedFilters.$and)) {
                const transformedFilters = parsedFilters.$and
                    .map((filter) => {
                        const fieldFilter = filter[key];
                        return fieldFilter ? { [key]: fieldFilter } : null;
                    })
                    .filter(Boolean) as IFilterOfTemplate<Record<string, any>>[];

                acc.$and.push(...transformedFilters);
            } else {
                acc.$and.push({ [key]: parsedFilters } as IFilterOfTemplate<Record<string, any>>);
            }

            return acc;
        },
        { $and: [] },
    );
};

const parseFilterObject = (filters: any): any | null => {
    if (typeof filters === 'string') {
        try {
            return JSON.parse(filters);
        } catch {
            return null;
        }
    }
    return typeof filters === 'object' && filters !== null ? filters : null;
};

const getFilteredEnum = (parentProp: IEntitySingleProperty, filterObj: any): string[] | undefined => {
    if (!parentProp.enum || !filterObj?.$and) return parentProp.enum;

    const enumEquals = filterObj.$and.map((condition: any) => condition.enum?.$eq).filter((val: any): val is string => typeof val === 'string');

    return enumEquals.length > 0 ? parentProp.enum.filter((val) => enumEquals.includes(val)) : parentProp.enum;
};

const getFilteredMultiEnum = (parentProp: IEntitySingleProperty, filterObj: any): string[] | undefined => {
    if (parentProp.type !== 'array' || !parentProp.items?.enum || !filterObj?.$and) return parentProp.items?.enum;

    const multiEnumIn = filterObj.$and
        .map((condition: any) => condition.multiEnum?.$in)
        .filter((val: any): val is string[] => Array.isArray(val))
        .flat();

    return multiEnumIn.length > 0 ? parentProp.items.enum.filter((val) => multiEnumIn.includes(val)) : parentProp.items.enum;
};

const getFullChildTemplateProperties = (
    childTemplate: IEntityChildTemplatePopulated,
    parentTemplate: IMongoEntityTemplate,
): Record<string, IEntitySingleProperty> => {
    const result: Record<string, IEntitySingleProperty> = {};

    for (const key of Object.keys(childTemplate.properties.properties)) {
        const parentProp = parentTemplate.properties.properties[key];
        const childProp = childTemplate.properties.properties[key];

        const filterObj = parseFilterObject(childProp?.filters);

        if (!filterObj?.$and) {
            result[key] = parentProp;
            // eslint-disable-next-line no-continue
            continue;
        }

        if (parentProp?.enum) {
            result[key] = {
                ...parentProp,
                enum: getFilteredEnum(parentProp, filterObj),
            };
        } else if (parentProp?.type === 'array' && parentProp.items?.enum) {
            result[key] = {
                ...parentProp,
                items: {
                    ...parentProp.items,
                    enum: getFilteredMultiEnum(parentProp, filterObj),
                },
            };
        } else {
            result[key] = parentProp;
        }
    }

    return result;
};

const dePopulateChildProperties = (
    childProperties: IEntityChildTemplatePopulated['properties']['properties'],
): IEntityChildTemplate['properties']['properties'] => {
    return Object.entries(childProperties).reduce((acc, [key, value]) => {
        acc[key] = {
            defaultValue: value.defaultValue,
            filters: value.filters,
            isEditableByUser: value.isEditableByUser,
        };
        return acc;
    }, {});
};

export { getFilterFromChildTemplate, getFullChildTemplateProperties, dePopulateChildProperties };
