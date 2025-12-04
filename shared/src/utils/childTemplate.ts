import {
    IChildTemplate,
    IChildTemplatePopulated,
    IChildTemplateProperty,
    IMongoChildTemplateWithConstraintsPopulated,
} from '../interfaces/childTemplate';
import { IFilterGroup, IFilterOfTemplate, ISearchFilter } from '../interfaces/entity';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../interfaces/entityTemplate';
import { IUser } from '../interfaces/user';
import { isAdmin } from './permissions';

const isChildTemplate = (
    template: IMongoEntityTemplatePopulated | IMongoChildTemplateWithConstraintsPopulated | IChildTemplatePopulated,
): template is IMongoChildTemplateWithConstraintsPopulated => {
    return 'parentTemplate' in template && Boolean(template.parentTemplate);
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
    const enumEquals = filterObj.$or
        .map((condition: any) => (Object.values(condition) as any)[0]?.$in)
        .filter((val: any): val is string[] => Array.isArray(val))
        .flat();

    return enumEquals.length > 0 ? enumVals.filter((val) => enumEquals.includes(val)) : enumVals;
};

const getChildPropertiesFiltered = (
    childProperties: Record<string, IEntitySingleProperty & IChildTemplateProperty>,
): Record<string, IEntitySingleProperty> => {
    const properties: Record<string, IEntitySingleProperty> = {};

    for (const [key, value] of Object.entries(childProperties)) {
        const filterObj = parseFilterObject(value.filters);

        const newValue = { ...value };

        if (value.enum && filterObj) {
            newValue.enum = getFilteredEnum(value.enum, filterObj);
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
            filters: value.filters ? JSON.parse(value.filters) : undefined,
            isEditableByUser: value.isEditableByUser,
            display: value.display,
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
    'filterByUnitUserField',
];

const getDefaultFilterFromChildTemplate = (
    template: IChildTemplatePopulated,
    currentUser: IUser,
    workspace: { id: string; hierarchyIds: string[] },
): ISearchFilter | undefined => {
    const filterClauses: (IFilterOfTemplate | IFilterGroup)[] = [];
    const isUserAdmin = isAdmin(currentUser?.permissions, workspace.hierarchyIds);

    Object.entries(template.properties.properties).forEach(([key, prop]) => {
        if (template.isFilterByCurrentUser && template.filterByCurrentUserField === key)
            filterClauses.push({ [key]: { $eq: currentUser.kartoffelId } });

        const units = currentUser.units?.[workspace.id];
        if (template.isFilterByUserUnit && units && !isUserAdmin && template.filterByUnitUserField === key)
            filterClauses.push({ [key]: { $in: units } });

        if (prop.filters) {
            const parsed = typeof prop.filters === 'string' ? JSON.parse(prop.filters) : prop.filters;
            if (parsed) filterClauses.push(parsed);
        }
    });

    return filterClauses.length ? { $and: filterClauses } : undefined;
};

export { dePopulateChildProperties, getChildPropertiesFiltered, childTemplateKeys, isChildTemplate, getDefaultFilterFromChildTemplate };
