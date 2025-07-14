import {
    IChildTemplate,
    IChildTemplatePopulated,
    IChildTemplateProperty,
    IMongoChildTemplateWithConstraintsPopulated,
} from '../interfaces/childTemplate';
import { IFilterOfTemplate, ISearchFilter } from '../interfaces/entity';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../interfaces/entityTemplate';

const isChildTemplate = (
    template: IMongoEntityTemplatePopulated | IMongoChildTemplateWithConstraintsPopulated | IChildTemplatePopulated,
): template is IMongoChildTemplateWithConstraintsPopulated => {
    return 'parentTemplate' in template && Boolean(template.parentTemplate);
};

const getFilterFromChildTemplate = (childTemplate: IChildTemplatePopulated | IChildTemplate): ISearchFilter => {
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

const getFilteredEnum = (enumVals: string[], filterObj: any): string[] | undefined => {
    const enumEquals = filterObj.$and.map((condition: any) => condition.enum?.$eq).filter((val: any): val is string => typeof val === 'string');

    return enumEquals.length > 0 ? enumVals.filter((val) => enumEquals.includes(val)) : enumVals;
};

const getFilteredMultiEnum = (enumVals: string[], filterObj: any): string[] | undefined => {
    const multiEnumIn = filterObj.$and
        .map((condition: any) => condition.multiEnum?.$in)
        .filter((val: any): val is string[] => Array.isArray(val))
        .flat();

    return multiEnumIn.length > 0 ? enumVals.filter((val) => multiEnumIn.includes(val)) : enumVals;
};

const getChildPropertiesFiltered = (
    childProperties: Record<string, IEntitySingleProperty & IChildTemplateProperty>,
): Record<string, IEntitySingleProperty> => {
    const properties: Record<string, IEntitySingleProperty> = {};

    for (const [key, value] of Object.entries(childProperties)) {
        const filterObj = parseFilterObject(value.filters);

        let newValue = { ...value };

        if (value.enum && filterObj) {
            newValue.enum = getFilteredEnum(value.enum, filterObj);
        }

        if (value.type === 'array' && value.items?.enum && filterObj) {
            newValue = {
                ...value,
                items: {
                    ...value.items,
                    enum: getFilteredMultiEnum(value.items.enum, filterObj),
                },
            };
        }

        properties[key] = newValue;
    }

    return properties;
};

const dePopulateChildProperties = (
    childProperties: IChildTemplatePopulated['properties']['properties'],
): IChildTemplate['properties']['properties'] => {
    return Object.entries(childProperties).reduce((acc, [key, value]) => {
        acc[key] = {
            defaultValue: value.defaultValue,
            filters: value.filters,
            isEditableByUser: value.isEditableByUser,
        };
        return acc;
    }, {});
};

const childTemplateKeys: (keyof IChildTemplate)[] = [
    'name',
    'displayName',
    'description',
    'parentTemplateId',
    'category',
    'properties',
    'disabled',
    'actions',
    'viewType',
    'isFilterByCurrentUser',
    'isFilterByUserUnit',
    'filterByCurrentUserField',
];

export { dePopulateChildProperties, getChildPropertiesFiltered, getFilterFromChildTemplate, childTemplateKeys, isChildTemplate };
