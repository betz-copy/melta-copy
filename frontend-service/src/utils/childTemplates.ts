import { IChildTemplate, IFilter, IMongoChildTemplatePopulated } from '@packages/child-template';
import { IEntity } from '@packages/entity';
import { IEntitySingleProperty } from '@packages/entity-template';
import { IKartoffelUser } from '@packages/user';
import { isUserHasWritePermissions } from '../common/EntitiesPage/TemplateTable';
import { IChildTemplateMap, ITemplate } from '../interfaces/template';
import { UserState } from '../stores/user';
import { matchValueAgainstFilter } from './filters';

const parseFilterObject = (filters: (string & Record<string, unknown>) | undefined): (string & Record<string, unknown>) | undefined | null => {
    if (typeof filters === 'string') {
        try {
            return JSON.parse(filters);
        } catch {
            return null;
        }
    }
    return typeof filters === 'object' && filters !== null ? filters : null;
};

const getFilteredEnum = (enumVals: string[], filterObj: IFilter): string[] | undefined => {
    const enumEquals = filterObj.$or
        .map((condition: IFilter) => (Object.values(condition) as IFilter)[0]?.$in)
        .filter((val: IFilter): val is string[] => Array.isArray(val))
        .flat();

    return enumEquals.length > 0 ? enumVals.filter((val) => enumEquals.includes(val)) : enumVals;
};

export const getChildPropertiesFiltered = (childTemplate: IMongoChildTemplatePopulated): Record<string, IEntitySingleProperty> => {
    const properties: Record<string, IEntitySingleProperty> = {};

    for (const [key, value] of Object.entries(childTemplate.properties.properties)) {
        const filterObj = parseFilterObject(value.filters);

        const newValue = { ...value };

        if (value.enum && filterObj) newValue.enum = getFilteredEnum(value.enum, filterObj);

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
    template: ITemplate,
    isChildTemplate: boolean,
    entity: IEntity | string,
    currentUserKartoffelId?: string,
    units?: string[],
    isUserAdmin?: boolean,
): boolean | undefined => {
    if (!isChildTemplate || typeof entity === 'string') return true;

    for (const [key, prop] of Object.entries(template.properties.properties)) {
        const value = entity.properties[key];

        if (prop.isFilterByCurrentUser && currentUserKartoffelId && prop.format === 'user') {
            try {
                if (JSON.parse(value)?._id !== currentUserKartoffelId) return false;
            } catch (error) {
                console.error('user type is unexpected', { error });
            }
        }
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
