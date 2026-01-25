import { ICountSearchResult, IFilterOfField, IFilterOfTemplate, ISearchEntitiesOfTemplateBody, ISearchFilter } from '@packages/entity';
import { IEntitySingleProperty } from '@packages/entity-template';
import {
    BasicFilterOperationTypes,
    FilterTypes,
    IAgGridDateFilter,
    IAgGridFilterModel,
    IAgGridNumberFilter,
    IAgGridRequest,
    IAgGridSort,
    IAgGridTextFilter,
    isRelativeDateFilter,
    NumberFilterOperationTypes,
    RelativeDateFilters,
    TextFilterOperationTypes,
} from '@packages/rule-breach';
import { FilterType } from '../../common/wizards/entityTemplate/commonInterfaces';
import { environment } from '../../globals';
import { ITemplate } from '../../interfaces/template';
import { getDayEnd, getDayStart } from '../date';
import { addDefaultFieldsToTemplate } from '../templates';

const { fileIdLength, fieldFilterPrefix } = environment;

export const setFilterToFilterOfTemplate = (field: string, values: (string | null)[], filterType?: FilterType): IFilterOfTemplate => {
    const filterValue = filterType === FilterType.field ? values.map((value) => `${fieldFilterPrefix}${value}`) : values;

    return { [field]: { $in: filterValue } };
};

export const textFilterToFilterOfTemplate = (field: string, { type, filter }: IAgGridTextFilter, filterType?: FilterType): IFilterOfTemplate => {
    const escapeRegExp = (string: string) => string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string

    const filterValue = filterType === FilterType.field ? `${fieldFilterPrefix}${filter}` : filter;
    const escapedValue = filterType === FilterType.field ? filterValue : filterValue ? escapeRegExp(filterValue!) : '';

    switch (type) {
        case BasicFilterOperationTypes.equals:
            return { [field]: { $eq: filterValue } };
        case BasicFilterOperationTypes.notEqual:
            return { [field]: { $ne: filterValue } };
        case TextFilterOperationTypes.contains:
            return { [field]: { $rgx: `.*${escapedValue}.*` } };
        case TextFilterOperationTypes.notContains:
            return { [field]: { $not: { $rgx: `.*${escapedValue}.*` } } };
        case TextFilterOperationTypes.startsWith:
            return { [field]: { $rgx: `${escapedValue}.*` } };
        case TextFilterOperationTypes.endsWith:
            return { [field]: { $rgx: `.*${escapedValue}` } };
        case BasicFilterOperationTypes.blank:
            return { [field]: { $eq: null } };
        case BasicFilterOperationTypes.notBlank:
            return { [field]: { $ne: null } };
        default:
            throw new Error('Invalid supported ag-grid filter type method');
    }
};

export const textFilterOfFileToFilterTemplate = (field: string, { type, filter }: IAgGridTextFilter, filterType?: FilterType): IFilterOfTemplate => {
    const escapeRegExp = (string: string) => string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string

    const filterValue = filterType === FilterType.field ? `${fieldFilterPrefix}${filter}` : escapeRegExp(filter!);

    switch (type) {
        case BasicFilterOperationTypes.equals:
            return { [field]: { $rgx: `.{${fileIdLength}}${filterValue}` } };
        case BasicFilterOperationTypes.notEqual:
            return { [field]: { $not: { $rgx: `.{${fileIdLength}}${filterValue}` } } };
        case TextFilterOperationTypes.contains:
            return { [field]: { $rgx: `.{${fileIdLength}}.*${filterValue}.*` } };
        case TextFilterOperationTypes.notContains:
            return { [field]: { $not: { $rgx: `.{${fileIdLength}}.*${filterValue}.*` } } };
        case TextFilterOperationTypes.startsWith:
            return { [field]: { $rgx: `^.{${fileIdLength}}${filterValue}.*` } };
        case TextFilterOperationTypes.endsWith:
            return { [field]: { $rgx: `.{${fileIdLength}}.*${filterValue}` } };
        case BasicFilterOperationTypes.blank:
            return { [field]: { $eq: null } };
        case BasicFilterOperationTypes.notBlank:
            return { [field]: { $ne: null } };
        default:
            throw new Error('Invalid supported ag-grid filter type method');
    }
};

export const numberFilterToFilterOfTemplate = (
    field: string,
    { type, filter, filterTo }: IAgGridNumberFilter,
    filterType?: FilterType,
): IFilterOfTemplate => {
    const filterValue = filterType === FilterType.field ? `${fieldFilterPrefix}${filter}` : filter;
    const filterToValue = filterType === FilterType.field ? `${fieldFilterPrefix}${filterTo}` : filterTo;

    switch (type) {
        case BasicFilterOperationTypes.equals:
            return { [field]: { $eq: filterValue } };
        case BasicFilterOperationTypes.notEqual:
            return { [field]: { $ne: filterValue } };
        case NumberFilterOperationTypes.lessThan:
            return { [field]: { $lt: filterValue } };
        case NumberFilterOperationTypes.lessThanOrEqual:
            return { [field]: { $lte: filterValue } };
        case NumberFilterOperationTypes.greaterThan:
            return { [field]: { $gt: filterValue } };
        case NumberFilterOperationTypes.greaterThanOrEqual:
            return { [field]: { $gte: filterValue } };
        case NumberFilterOperationTypes.inRange:
            return { [field]: { $gte: filterValue, $lte: filterToValue } };
        case BasicFilterOperationTypes.blank:
            return { [field]: { $eq: null } };
        case BasicFilterOperationTypes.notBlank:
            return { [field]: { $ne: null } };
        default:
            throw new Error('Invalid supported ag-grid filter type method');
    }
};

const timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;

const getRelativeDateFilter = (field: string, type: IAgGridDateFilter['type']) => {
    switch (type) {
        case RelativeDateFilters.thisWeek:
        case RelativeDateFilters.thisMonth:
        case RelativeDateFilters.thisYear:
            return { [field]: { $gte: type, $lte: type } };
        case RelativeDateFilters.untilToday:
            return { [field]: { $lte: type } };
        case RelativeDateFilters.fromToday:
            return { [field]: { $gte: type } };
        default:
            throw new Error('Invalid relative date filter');
    }
};

export const dateFilterToFilterOfTemplate = (
    field: string,
    { type, dateFrom: dateFromString, dateTo: dateToString }: IAgGridDateFilter,
    filterType?: FilterType,
): IFilterOfTemplate => {
    if (isRelativeDateFilter(type)) return getRelativeDateFilter(field, type);

    if (!dateFromString) {
        switch (type) {
            case BasicFilterOperationTypes.blank:
                return { [field]: { $eq: null } };
            case BasicFilterOperationTypes.notBlank:
                return { [field]: { $ne: null } };
            default:
                throw new Error('Invalid supported ag-grid filter type method');
        }
    }

    const dateFrom =
        filterType === FilterType.field
            ? `${fieldFilterPrefix}${dateFromString}`
            : new Date(new Date(dateFromString).getTime() - timezoneOffset).toISOString().split('T')[0];

    switch (type) {
        case BasicFilterOperationTypes.equals:
            return { [field]: { $eq: dateFrom } };
        case BasicFilterOperationTypes.notEqual:
            return { [field]: { $ne: dateFrom } };
        case NumberFilterOperationTypes.lessThan:
            return { [field]: { $lt: dateFrom } };
        case NumberFilterOperationTypes.lessThanOrEqual:
            return { [field]: { $lte: dateFrom } };
        case NumberFilterOperationTypes.greaterThan:
            return { [field]: { $gt: dateFrom } };
        case NumberFilterOperationTypes.greaterThanOrEqual:
            return { [field]: { $gte: dateFrom } };
        case NumberFilterOperationTypes.inRange: {
            const dateTo =
                filterType === FilterType.field
                    ? `${fieldFilterPrefix}${dateToString}`
                    : new Date(new Date(dateToString!).getTime() - timezoneOffset).toISOString().split('T')[0];
            return { [field]: { $gte: dateFrom, $lte: dateTo } };
        }
        default:
            throw new Error('Invalid supported ag-grid filter type method');
    }
};

export const dateTimeFilterToFilterOfTemplate = (
    field: string,
    { type, dateFrom: dateFromString, dateTo: dateToString }: IAgGridDateFilter,
    filterType?: FilterType,
): IFilterOfTemplate => {
    if (isRelativeDateFilter(type)) return getRelativeDateFilter(field, type);

    if (!dateFromString) {
        switch (type) {
            case BasicFilterOperationTypes.blank:
                return { [field]: { $eq: null } };
            case BasicFilterOperationTypes.notBlank:
                return { [field]: { $ne: null } };
            default:
                throw new Error('Invalid supported ag-grid filter type method');
        }
    }

    const dateFrom = filterType === FilterType.field ? `${fieldFilterPrefix}${dateFromString}` : getDayStart(new Date(dateFromString)).toISOString();

    switch (type) {
        case BasicFilterOperationTypes.equals:
            return { [field]: { $gte: dateFrom, $lte: dateFrom } };
        case BasicFilterOperationTypes.notEqual:
            return { [field]: { $not: { $gte: dateFrom, $lte: dateFrom } } };
        case NumberFilterOperationTypes.lessThan:
            return { [field]: { $lt: dateFrom } }; // dont include this day
        case NumberFilterOperationTypes.lessThanOrEqual:
            return { [field]: { $lte: dateFrom } }; // include this day
        case NumberFilterOperationTypes.greaterThan:
            return { [field]: { $gt: dateFrom } }; // dont include this day
        case NumberFilterOperationTypes.greaterThanOrEqual:
            return { [field]: { $gte: dateFrom } }; // include this day
        case NumberFilterOperationTypes.inRange: {
            const dateTo = filterType === FilterType.field ? `${fieldFilterPrefix}${dateToString}` : getDayEnd(new Date(dateToString!)).toISOString();
            return { [field]: { $gte: dateFrom, $lte: dateTo } };
        }
        default:
            throw new Error('Invalid supported ag-grid filter type method');
    }
};

export const filterModelToFilterOfTemplatePerField = (
    fieldTemplate: IEntitySingleProperty,
    field: string,
    fieldFilter: IAgGridFilterModel,
    filterType?: FilterType,
) => {
    switch (fieldFilter.filterType) {
        case FilterTypes.text:
            if (fieldTemplate.format === 'fileId') return textFilterOfFileToFilterTemplate(field, fieldFilter, filterType);
            else return textFilterToFilterOfTemplate(field, fieldFilter, filterType);
        case FilterTypes.number:
            return numberFilterToFilterOfTemplate(field, fieldFilter, filterType);
        case FilterTypes.date:
            if (fieldTemplate.format === 'date') return dateFilterToFilterOfTemplate(field, fieldFilter, filterType);
            else return dateTimeFilterToFilterOfTemplate(field, fieldFilter, filterType);

        case FilterTypes.set: {
            const filtersValues = Array.isArray(fieldFilter.values)
                ? fieldFilter.values.map((item) => (typeof item === 'object' ? item?.fullName || null : item))
                : fieldFilter.values;

            return setFilterToFilterOfTemplate(field, filtersValues, filterType);
        }
        default:
            throw new Error('Invalid supported ag-grid filter type');
    }
};

export const filterModelToFilterOfTemplate = (
    filterModel: Record<string, IAgGridFilterModel>,
    entityTemplate: ITemplate,
): ISearchEntitiesOfTemplateBody['filter'] => {
    const entityTemplateWithDefaultFields = addDefaultFieldsToTemplate(entityTemplate);

    const queries = Object.entries(filterModel).flatMap(([field, fieldFilter]) => {
        const fieldTemplate = entityTemplateWithDefaultFields.properties.properties[field];
        const filter = filterModelToFilterOfTemplatePerField(fieldTemplate, field, fieldFilter);

        if (filter[field] && typeof filter[field] === 'object' && '$and' in (filter[field] as object)) {
            return (filter[field] as { $and: IFilterOfField[] }).$and.map((condition) => ({ [field]: condition }));
        }

        return [filter];
    });

    return queries.length > 0 ? { $and: queries } : undefined;
};

export const sortModelToSortOfSearchRequest = (sortModel: IAgGridSort[]): ISearchEntitiesOfTemplateBody['sort'] => {
    return sortModel.map(({ colId, sort }) => ({ field: colId, sort }));
};

export const getFilterModal = (filterModel?: ISearchFilter, defaultModal?: ISearchFilter): ISearchFilter | undefined => {
    if (!filterModel && !defaultModal) return undefined;
    if (!filterModel) return defaultModal;
    if (!defaultModal) return filterModel;

    return {
        $and: [filterModel, defaultModal],
    };
};

export const agGridToSearchEntitiesOfTemplateRequest = (
    agGridRequest: IAgGridRequest,
    entityTemplate: ITemplate & {
        entitiesWithFiles?: ICountSearchResult['entitiesWithFiles'];
    },
    defaultFilter?: ISearchEntitiesOfTemplateBody['filter'], // only for create dashboard/ chart
): ISearchEntitiesOfTemplateBody => {
    const { startRow, endRow, filterModel, quickFilter, sortModel } = agGridRequest;

    return {
        skip: startRow,
        limit: endRow - startRow,
        textSearch: quickFilter,
        filter: getFilterModal(filterModelToFilterOfTemplate(filterModel, entityTemplate), defaultFilter),
        showRelationships: false,
        sort: sortModelToSortOfSearchRequest(sortModel),
        entitiesWithFiles: entityTemplate.entitiesWithFiles,
    };
};
