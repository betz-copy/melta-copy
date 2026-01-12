import {
    basicFilterOperationTypes,
    FilterTypes,
    IAgGridRequest,
    IAgGridSort,
    IPropertyValue,
    numberFilterOperationTypes,
    relativeDateFilters,
    textFilterOperationTypes,
} from '@packages/rule-breach';
import { RuleBreachSearchFilterTypeError } from '../../express/error';

const translateAgGridFilter = (
    type: basicFilterOperationTypes | numberFilterOperationTypes | textFilterOperationTypes | relativeDateFilters,
    filterValue: IPropertyValue,
    other?: IPropertyValue,
) => {
    switch (type) {
        case basicFilterOperationTypes.equals:
            return filterValue;
        case basicFilterOperationTypes.notEqual:
            return { $ne: filterValue };
        case basicFilterOperationTypes.blank:
            return { $exists: false };
        case basicFilterOperationTypes.notBlank:
            return { $exists: true };

        case numberFilterOperationTypes.lessThan:
            return { $lt: filterValue };
        case numberFilterOperationTypes.lessThanOrEqual:
            return { $lte: filterValue };
        case numberFilterOperationTypes.greaterThan:
            return { $gt: filterValue };
        case numberFilterOperationTypes.greaterThanOrEqual:
            return { $gte: filterValue };
        case numberFilterOperationTypes.inRange:
            return { $gte: filterValue, $lte: other };

        case textFilterOperationTypes.contains:
            return { $regex: new RegExp(filterValue, 'i') };
        case textFilterOperationTypes.notContains:
            return { $not: { $regex: new RegExp(filterValue, 'i') } };
        case textFilterOperationTypes.startsWith:
            return { $regex: new RegExp(`^${filterValue}`, 'i') };
        case textFilterOperationTypes.endsWith:
            return { $regex: new RegExp(`${filterValue}$`, 'i') };

        // Relative date filters - frontend should resolve these to actual dates before sending
        case relativeDateFilters.thisWeek:
        case relativeDateFilters.thisMonth:
        case relativeDateFilters.thisYear:
        case relativeDateFilters.untilToday:
        case relativeDateFilters.fromToday:
            throw new RuleBreachSearchFilterTypeError(`Relative date filter '${type}' should be resolved to date range before backend processing`);

        default:
            throw new RuleBreachSearchFilterTypeError(type);
    }
};

export const translateAgGridFilterModel = (filterModel: IAgGridRequest['filterModel']) => {
    const query: object = {};

    Object.entries(filterModel).forEach(([field, filter]) => {
        switch (filter.filterType) {
            case FilterTypes.text:
                query[field] = translateAgGridFilter(filter.type, filter.filter);
                break;
            case FilterTypes.number:
                query[field] = translateAgGridFilter(filter.type, filter.filter, filter.filterTo);
                break;
            case FilterTypes.date:
                query[field] = translateAgGridFilter(filter.type, filter.dateFrom, filter.dateTo);
                break;
            case FilterTypes.set:
                query[field] = { $in: filter.values };
                break;
        }
    });

    return query;
};

export const translateAgGridSortModel = (sortModel: IAgGridSort[]) => {
    const sort: object = {};

    sortModel.forEach(({ colId, sort: sortType }) => {
        sort[colId] = sortType === 'asc' ? 1 : -1;
    });

    return sort;
};
