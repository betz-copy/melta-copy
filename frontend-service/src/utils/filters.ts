import { IPropertyValue, ISearchEntitiesOfTemplateBody, ISearchFilter } from '../interfaces/entities';

const evaluateOperator = (operator: string, actual: IPropertyValue, expected: IPropertyValue): boolean => {
    switch (operator) {
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
            return Array.isArray(expected) && Array.isArray(actual) ? expected.every((item) => actual.includes(item)) : expected.includes(actual);
        case '$between':
            return actual >= expected[0] && actual <= expected[1];
        case '$rgx':
            try {
                if (typeof actual !== 'string') return false;
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

const matchValueAgainstFilter = (data: Record<string, IPropertyValue>, filter: any): boolean => {
    if ('$and' in filter) return filter.$and.every((f: any) => matchValueAgainstFilter(data, f));
    if ('$or' in filter) return filter.$or.some((f: any) => matchValueAgainstFilter(data, f));

    const [field, condition] = Object.entries(filter)[0];
    const actual = data[field];

    if (!condition || typeof condition !== 'object') return true;

    return Object.entries(condition).every(([op, expected]) => evaluateOperator(op, actual, expected));
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

export { combineFilters, evaluateOperator, matchValueAgainstFilter };
