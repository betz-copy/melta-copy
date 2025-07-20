import { isUserHasWritePermissions } from '../common/EntitiesPage/TemplateTable';
import { IChildTemplateMap, IMongoChildTemplatePopulated } from '../interfaces/childTemplates';
import { IEntity } from '../interfaces/entities';
import { IEntitySingleProperty } from '../interfaces/entityTemplates';
import { IKartoffelUser } from '../interfaces/users';
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

export const getChildPropertiesFiltered = (childTemplate: IMongoChildTemplatePopulated): Record<string, IEntitySingleProperty> => {
    const properties: Record<string, IEntitySingleProperty> = {};

    for (const [key, value] of Object.entries(childTemplate.properties.properties)) {
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

export const getChildrenWithWritePermission = (
    childEntityTemplateMap: IChildTemplateMap,
    parentId: string,
    currentUser: UserState['user'],
    currentClientSideUser: IEntity | IKartoffelUser,
) =>
    Array.from(childEntityTemplateMap.values()).filter(
        (child) => child.parentTemplate._id === parentId && isUserHasWritePermissions(currentClientSideUser, currentUser, child),
    );
