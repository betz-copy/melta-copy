import { IPropertyValue } from '@packages/entity';
import {
    basicFilterOperationTypes,
    FilterQuery,
    FilterTypes,
    IAgGridFilterModel,
    IAgGridSort,
    numberFilterOperationTypes,
    relativeDateFilters,
    textFilterOperationTypes,
} from '@packages/rule-breach';
import { ServiceError } from '@packages/utils';
import { StatusCodes } from 'http-status-codes';

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
            throw new ServiceError(
                StatusCodes.BAD_REQUEST,
                `Relative date filter '${type}' should be resolved to date range before backend processing`,
            );

        default:
            throw new ServiceError(StatusCodes.NOT_FOUND, `A filter of type '${type}' does not exist`);
    }
};

export const translateAgGridFilterModel = (filterModel: Record<string, IAgGridFilterModel>) => {
    return Object.entries(filterModel).reduce(
        (acc, [field, filter]) => {
            switch (filter.filterType) {
                case FilterTypes.text:
                    acc[field] = translateAgGridFilter(filter.type, filter.filter);
                    break;
                case FilterTypes.number:
                    acc[field] = translateAgGridFilter(filter.type, filter.filter, filter.filterTo);
                    break;
                case FilterTypes.date:
                    acc[field] = translateAgGridFilter(filter.type, filter.dateFrom, filter.dateTo);
                    break;
                case FilterTypes.set:
                    acc[field] = { $in: filter.values.map((value) => (typeof value === 'object' ? (value?._id ?? null) : value)) };
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
