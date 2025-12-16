import {
    IChildTemplate,
    IChildTemplateMap,
    IEntity,
    IEntitySingleProperty,
    IKartoffelUser,
    IMongoChildTemplatePopulated,
    IMongoChildTemplateWithConstraintsPopulated,
    IMongoEntityTemplateWithConstraintsPopulated,
    matchValueAgainstFilter,
} from '@microservices/shared';
import { isUserHasWritePermissions } from '../common/EntitiesPage/TemplateTable';
import { UserState } from '../stores/user';

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

export const getChildPropertiesFiltered = (childTemplate: IMongoChildTemplatePopulated): Record<string, IEntitySingleProperty> => {
    const properties: Record<string, IEntitySingleProperty> = {};

    for (const [key, value] of Object.entries(childTemplate.properties.properties)) {
        const filterObj = parseFilterObject(value.filters);

        const newValue = { ...value };

        if (value.enum && filterObj) {
            newValue.enum = getFilteredEnum(value.enum, filterObj);
        }

        properties[key] = newValue;
    }

    return properties;
};

export const getChildrenWithWritePermission = (
    childEntityTemplateMap: IChildTemplateMap,
    parentId: string,
    currentUser: UserState['user'],
    currentClientSideUser: IEntity | IKartoffelUser,
) =>
    Array.from(childEntityTemplateMap.values()).filter(
        (child) => child.parentTemplate._id === parentId && isUserHasWritePermissions(currentClientSideUser, currentUser, child),
    );

export const isEntityFitsToChildTemplate = (
    template: IMongoEntityTemplateWithConstraintsPopulated | IMongoChildTemplateWithConstraintsPopulated,
    isChildTemplate: boolean,
    entity: IEntity | string,
    currentUserKartoffelId?: string,
    units?: string[],
    isUserAdmin?: boolean,
): boolean | undefined => {
    if (!isChildTemplate || typeof entity === 'string') return true;

    for (const [key, prop] of Object.entries(template.properties.properties)) {
        const value = entity.properties[key];

        if (prop.isFilterByCurrentUser && currentUserKartoffelId && value !== currentUserKartoffelId) return false;

        if (prop.isFilterByUserUnit && units && !isUserAdmin && !units.includes(value)) return false;

        if (prop.filters) {
            const parsed = typeof prop.filters === 'string' ? JSON.parse(prop.filters) : prop.filters;

            if (parsed && !matchValueAgainstFilter({ [key]: value }, parsed)) return false;
        }
    }

    return true;
};

export const childTemplateKeys: (keyof IChildTemplate)[] = [
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
