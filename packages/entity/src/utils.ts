import { IKartoffelUser } from '@packages/common';
import { IMongoEntityTemplate, IMongoEntityTemplatePopulated, PropertyFormat } from '@packages/entity-template';
import { FilterLogicalOperator, IEntity, IFilterGroup, IFilterOfField, IPropertyValue, ISearchEntitiesOfTemplateBody, ISearchFilter } from './types';

const filterFieldToValue: Record<keyof IFilterOfField, string> = {
    $eq: 'equals',
    $ne: 'notEqual',
    $gt: 'greaterThan',
    $gte: 'greaterThanOrEqual',
    $lt: 'lessThan',
    $lte: 'lessThanOrEqual',
    $in: 'inRange',
    $not: 'not',
    $rgx: 'contains',
    $eqi: 'equals',
};

const evaluateOperator = (op: string, actual: IPropertyValue, expected: IPropertyValue): boolean => {
    switch (op) {
        case '$eq':
            return actual === expected;
        case '$ne':
        case '$nw':
            return actual !== expected;
        case '$lt':
            return actual < expected;
        case '$lte':
            return actual <= expected;
        case '$gt':
            return actual > expected;
        case '$gte':
            return actual >= expected;
        case '$in':
            if (Array.isArray(actual) && Array.isArray(expected)) return actual.some((val) => expected.includes(val));
            return Array.isArray(expected) && expected.includes(actual);
        case '$rgx':
            try {
                return new RegExp(expected).test(actual);
            } catch {
                return false;
            }
        case '$startWith':
            return typeof actual === 'string' && actual.startsWith(expected);
        case '$endWith':
            return typeof actual === 'string' && actual.endsWith(expected);
        case '$notContains':
            return typeof actual === 'string' && !actual.includes(expected);
        default:
            return true;
    }
};

const matchValueAgainstFilter = async (
    data: IEntity['properties'],
    entityTemplate: IMongoEntityTemplate | IMongoEntityTemplatePopulated,
    getUserById: (id: string) => Promise<IKartoffelUser>,
    filter?: ISearchFilter | IFilterGroup,
): Promise<string | undefined> => {
    if (!filter) return undefined;

    if ('$and' in filter && Array.isArray(filter.$and)) {
        for (const subFilter of filter.$and) {
            const result = await matchValueAgainstFilter(data, entityTemplate, getUserById, subFilter);
            if (result) return result;
        }
        return undefined;
    }

    if ('$or' in filter && Array.isArray(filter.$or)) {
        const results = await Promise.all(filter.$or.map((subFilter) => matchValueAgainstFilter(data, entityTemplate, getUserById, subFilter)));
        if (results.some((r) => !r)) return undefined;
        return results.find((r) => r);
    }

    const [field, condition] = Object.entries(filter)[0];
    const actual =
        entityTemplate.properties.properties[field].format === PropertyFormat.user ? (await getUserById(data[field])).fullName : data[field];

    for (const [op, expected] of Object.entries(condition)) {
        if (!evaluateOperator(op, actual, expected)) return field;
    }

    return undefined;
};

const combineFilters = (
    filterModel?: ISearchEntitiesOfTemplateBody['filter'],
    defaultModal?: ISearchEntitiesOfTemplateBody['filter'],
): ISearchFilter | undefined => {
    if (!filterModel && !defaultModal) return undefined;

    if (!filterModel) return defaultModal;
    if (!defaultModal) return filterModel;

    return {
        $and: [filterModel, defaultModal],
    };
};

const getFilterModal = (
    allFilters: (ISearchFilter | undefined)[],
    filterLogicalOperator: FilterLogicalOperator = FilterLogicalOperator.AND,
): ISearchFilter | undefined => {
    const filters = allFilters.filter((filter): filter is ISearchFilter => filter !== undefined);

    if (!filters.length) return undefined;

    return filterLogicalOperator === FilterLogicalOperator.AND ? { [FilterLogicalOperator.AND]: filters } : { [FilterLogicalOperator.OR]: filters };
};

export { filterFieldToValue, combineFilters, evaluateOperator, matchValueAgainstFilter, getFilterModal };
