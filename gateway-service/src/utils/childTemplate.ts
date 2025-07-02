import {
    IEntityChildTemplatePopulated,
    IEntitySingleProperty,
    IFilterOfTemplate,
    IFullMongoEntityTemplate,
    IMongoEntityChildTemplatePopulated,
    IMongoEntityTemplate,
    IMongoEntityTemplatePopulated,
    ISearchFilter,
} from '@microservices/shared';

const getFilterFromChildTemplate = (childTemplate: IEntityChildTemplatePopulated): ISearchFilter => {
    return Object.entries(childTemplate.properties ?? {}).reduce<{ $and: IFilterOfTemplate<Record<string, any>>[] }>(
        (acc, [key, prop]) => {
            if (!prop.filters) return acc;

            const parsedFilters: ISearchFilter<Record<string, any>> = typeof prop.filters === 'string' ? JSON.parse(prop.filters) : prop.filters;

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
        { $and: [{ disabled: { $eq: false } }] },
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

    for (const key of Object.keys(childTemplate.properties)) {
        const parentProp = parentTemplate.properties.properties[key];
        const childProp = childTemplate.properties[key];

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

const transformChild = (
    child: IMongoEntityChildTemplatePopulated,
    parent: IMongoEntityTemplatePopulated,
): IMongoEntityTemplatePopulated & { fatherTemplateId?: IFullMongoEntityTemplate } => {
    const childPropertyKeys = Object.keys(child.properties);

    const childProperties = Object.fromEntries(
        Object.entries(parent.properties.properties)
            .filter(([key]) => childPropertyKeys.includes(key))
            .map(([key, parentProp]) => [
                key,
                {
                    ...parentProp,
                    defaultValue: child.properties[key].defaultValue,
                    filters: child.properties[key].filters,
                },
            ]),
    );

    return {
        ...parent,
        _id: child._id,
        displayName: child.displayName,
        fatherTemplateId: child.fatherTemplateId,
        properties: {
            ...parent.properties,
            properties: childProperties,
        },
        propertiesOrder: parent.propertiesOrder.filter((key) => key in childProperties),
    };
};
export { getFilterFromChildTemplate, getFullChildTemplateProperties, transformChild };
