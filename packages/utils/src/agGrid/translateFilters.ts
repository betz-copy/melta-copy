import { IPropertyValue } from '@packages/entity';
import {
    BasicFilterOperationTypes,
    FilterTypes,
    IAgGridFilterModel,
    NumberFilterOperationTypes,
    RelativeDateFilters,
    TextFilterOperationTypes,
} from '@packages/rule-breach';
import { StatusCodes } from 'http-status-codes';
import { ServiceError } from '../express/error';

export type FilterTranslateResult = IPropertyValue | Record<string, unknown>;

export const translateAgGridFilter = (
    type: BasicFilterOperationTypes | NumberFilterOperationTypes | TextFilterOperationTypes | RelativeDateFilters,
    filterValue: IPropertyValue,
    other?: IPropertyValue,
    onRelativeDateError?: (type: string) => never,
    onUnknownTypeError?: (type: string) => never,
): FilterTranslateResult => {
    switch (type) {
        case BasicFilterOperationTypes.equals:
            return filterValue;
        case BasicFilterOperationTypes.notEqual:
            return { $ne: filterValue };
        case BasicFilterOperationTypes.blank:
            return { $exists: false };
        case BasicFilterOperationTypes.notBlank:
            return { $exists: true };

        case NumberFilterOperationTypes.lessThan:
            return { $lt: filterValue };
        case NumberFilterOperationTypes.lessThanOrEqual:
            return { $lte: filterValue };
        case NumberFilterOperationTypes.greaterThan:
            return { $gt: filterValue };
        case NumberFilterOperationTypes.greaterThanOrEqual:
            return { $gte: filterValue };
        case NumberFilterOperationTypes.inRange:
            return { $gte: filterValue, $lte: other };

        case TextFilterOperationTypes.contains:
            return { $regex: new RegExp(String(filterValue), 'i') };
        case TextFilterOperationTypes.notContains:
            return { $not: { $regex: new RegExp(String(filterValue), 'i') } };
        case TextFilterOperationTypes.startsWith:
            return { $regex: new RegExp(`^${filterValue}`, 'i') };
        case TextFilterOperationTypes.endsWith:
            return { $regex: new RegExp(`${filterValue}$`, 'i') };

        // Relative date filters - frontend should resolve these to actual dates before sending
        case RelativeDateFilters.thisWeek:
        case RelativeDateFilters.thisMonth:
        case RelativeDateFilters.thisYear:
        case RelativeDateFilters.untilToday:
        case RelativeDateFilters.fromToday:
            if (onRelativeDateError) {
                onRelativeDateError(type);
            }
            throw new ServiceError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                `Relative date filter '${type}' should be resolved to date range before backend processing`,
            );

        default:
            if (onUnknownTypeError) {
                onUnknownTypeError(type);
            }
            throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, `A filter of type '${type}' does not exist`);
    }
};

export interface TranslateFilterModelOptions {
    /**
     * Optional function to transform set filter values
     * (e.g., extract _id from objects)
     */
    transformSetValue?: (value: unknown) => unknown;
    /**
     * Custom error handler for relative date filters
     */
    onRelativeDateError?: (type: string) => never;
    /**
     * Custom error handler for unknown filter types
     */
    onUnknownTypeError?: (type: string) => never;
}

export const translateAgGridFilterModel = (
    filterModel: Record<string, IAgGridFilterModel>,
    options: TranslateFilterModelOptions = {},
): Record<string, FilterTranslateResult> => {
    const { transformSetValue, onRelativeDateError, onUnknownTypeError } = options;

    return Object.entries(filterModel).reduce(
        (acc, [field, filter]) => {
            switch (filter.filterType) {
                case FilterTypes.text:
                    acc[field] = translateAgGridFilter(filter.type, filter.filter, undefined, onRelativeDateError, onUnknownTypeError);
                    break;
                case FilterTypes.number:
                    acc[field] = translateAgGridFilter(filter.type, filter.filter, filter.filterTo, onRelativeDateError, onUnknownTypeError);
                    break;
                case FilterTypes.date:
                    acc[field] = translateAgGridFilter(filter.type, filter.dateFrom, filter.dateTo, onRelativeDateError, onUnknownTypeError);
                    break;
                case FilterTypes.set:
                    acc[field] = {
                        $in: transformSetValue ? filter.values.map(transformSetValue) : filter.values,
                    };
                    break;
            }
            return acc;
        },
        {} as Record<string, FilterTranslateResult>,
    );
};
