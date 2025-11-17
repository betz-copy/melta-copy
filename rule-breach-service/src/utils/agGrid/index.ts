import {
    basicFilterOperationTypes,
    filterTypes,
    IAgGridRequest,
    IAgGridSort,
    numberFilterOperationTypes,
    textFilterOperationTypes,
} from '@microservices/shared';
import { RuleBreachSearchFilterTypeError } from '../../express/error';

const translateAgGridFilter = (
    type: basicFilterOperationTypes | numberFilterOperationTypes | textFilterOperationTypes,
    filterValue: any,
    other?: any,
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

        default:
            throw new RuleBreachSearchFilterTypeError(type);
    }
};

export const translateAgGridFilterModel = (filterModel: IAgGridRequest['filterModel']) => {
    const query: object = {};

    Object.entries(filterModel).forEach(([field, filter]) => {
        switch (filter.filterType) {
            case filterTypes.text:
                query[field] = translateAgGridFilter(filter.type, filter.filter);
                break;
            case filterTypes.number:
                query[field] = translateAgGridFilter(filter.type, filter.filter, filter.filterTo);
                break;
            case filterTypes.date:
                query[field] = translateAgGridFilter(filter.type, filter.dateFrom, filter.dateTo);
                break;
            case filterTypes.set:
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
