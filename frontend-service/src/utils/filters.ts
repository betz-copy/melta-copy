export const evaluateOperator = (op: string, actual: any, expected: any): boolean => {
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

export const matchValueAgainstFilter = (data: any, filter: any): boolean => {
    console.log({data, filter});
    
    if ('$and' in filter) return filter.$and.every((f: any) => matchValueAgainstFilter(data, f));
    if ('$or' in filter) return filter.$or.some((f: any) => matchValueAgainstFilter(data, f));

    const [field, condition] = Object.entries(filter)[0];
    const actual = data[field];

    if (!condition || typeof condition !== 'object') return true;

    return Object.entries(condition).every(([op, expected]) => evaluateOperator(op, actual, expected));
};
