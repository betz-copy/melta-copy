/* eslint-disable default-case */

import {
    basicFilterOperationTypes,
    FilterQuery,
    filterTypes,
    IAgGridFilterModel,
    IAgGridSort,
    numberFilterOperationTypes,
    textFilterOperationTypes,
    ServiceError,
} from '@microservices/shared';

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
            throw new ServiceError(404, `A filter of type '${type}' does not exist`);
    }
};

export const translateAgGridFilterModel = (filterModel: Record<string, IAgGridFilterModel>) => {
    return Object.entries(filterModel).reduce(
        (acc, [field, filter]) => {
            switch (filter.filterType) {
                case filterTypes.text:
                    acc[field] = translateAgGridFilter(filter.type, filter.filter);
                    break;
                case filterTypes.number:
                    acc[field] = translateAgGridFilter(filter.type, filter.filter, filter.filterTo);
                    break;
                case filterTypes.date:
                    acc[field] = translateAgGridFilter(filter.type, filter.dateFrom, filter.dateTo);
                    break;
                case filterTypes.set:
                    acc[field] = { $in: filter.values };
                    break;
            }
            return acc;
        },
        {} as Record<string, FilterQuery>,
    );
};

export const translateAgGridSortModel = (sortModel: IAgGridSort[]) => {
    return sortModel.reduce(
        (acc, { colId, sort: sortType }) => {
            acc[colId] = sortType === 'asc' ? 1 : -1;
            return acc;
        },
        {} as Record<string, number>,
    );
};
