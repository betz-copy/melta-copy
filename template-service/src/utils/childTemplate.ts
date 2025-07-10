/* eslint-disable no-continue */
import { IChildTemplatePopulated, IChildTemplatePopulatedFromDb, IEntitySingleProperty } from '@microservices/shared';

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

export const populateChildTemplateWithParent = (childTemplate: IChildTemplatePopulatedFromDb): IChildTemplatePopulated => {
    const { category: _unused, ...parent } = childTemplate.parentTemplate;
    const childPropertyKeys = Object.keys(childTemplate.properties);

    const childProperties = Object.fromEntries(
        Object.entries(parent.properties.properties)
            .filter(([key]) => childPropertyKeys.includes(key))
            .map(([key, parentProp]) => [
                key,
                {
                    ...parentProp,
                    defaultValue: childTemplate.properties[key].defaultValue,
                    filters: childTemplate.properties[key].filters,
                    isFilterByCurrentUser: childTemplate.filterByCurrentUserField === key,
                },
            ]),
    );

    return {
        ...parent,
        ...childTemplate,
        properties: {
            ...parent.properties,
            properties: childProperties,
        },
        propertiesOrder: parent.propertiesOrder.filter((key) => key in childProperties),
    };
};

const getFullChildTemplateProperties = (
    childTemplate: IChildTemplatePopulated,
    parentProperties: Record<string, IEntitySingleProperty>,
): Record<string, IEntitySingleProperty> => {
    const result: Record<string, IEntitySingleProperty> = {};

    for (const key of Object.keys(childTemplate.properties)) {
        const parentProp = parentProperties[key];
        const childProp = childTemplate.properties[key];

        const filterObj = parseFilterObject(childProp?.filters);

        if (!filterObj?.$and) {
            result[key] = parentProp;
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

export default getFullChildTemplateProperties;
