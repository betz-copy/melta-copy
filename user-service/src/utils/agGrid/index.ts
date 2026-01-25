import { FilterQuery, IAgGridFilterModel } from '@packages/rule-breach';
import { translateAgGridFilterModel as baseTranslateFilterModel, ServiceError, translateAgGridSortModel } from '@packages/utils';
import { StatusCodes } from 'http-status-codes';

export const translateAgGridFilterModel = (filterModel: Record<string, IAgGridFilterModel>): Record<string, FilterQuery> => {
    return baseTranslateFilterModel(filterModel, {
        transformSetValue: (value) => (typeof value === 'object' && value !== null ? ((value as { _id?: unknown })?._id ?? null) : value),
        onRelativeDateError: (type) => {
            throw new ServiceError(
                StatusCodes.BAD_REQUEST,
                `Relative date filter '${type}' should be resolved to date range before backend processing`,
            );
        },
        onUnknownTypeError: (type) => {
            throw new ServiceError(StatusCodes.NOT_FOUND, `A filter of type '${type}' does not exist`);
        },
    }) as Record<string, FilterQuery>;
};

export { translateAgGridSortModel };
