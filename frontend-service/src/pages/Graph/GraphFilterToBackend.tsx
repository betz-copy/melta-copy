import { FilterType } from '../../common/wizards/entityTemplate/commonInterfaces';
import { environment } from '../../globals';
import { IFilterOfField, IFilterOfTemplate, IGraphFilterBody, IGraphFilterBodyBatch, ISearchFilter } from '../../interfaces/entities';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { filterModelToFilterOfTemplatePerField } from '../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { IAGGridDateFilter, IAGGridNumberFilter, IAGGridSetFilter, IAGGridTextFilter, RelativeDateFilters } from '../../utils/agGrid/interfaces';

const { relativeDateFilters, fieldFilterPrefix } = environment;

export interface IGraphFilterToBackendBody {
    [templateId: string]: { filter: ISearchFilter } | {};
}

export const filterModelToFilterOfGraph = (filterModel: IGraphFilterBodyBatch): IGraphFilterToBackendBody['filter'] => {
    const groupedByTemplate = Object.values(filterModel).reduce(
        (acc: Record<string, IFilterOfTemplate[]>, { selectedTemplate, selectedProperty, filterField }) => {
            const { _id, properties } = selectedTemplate;
            acc[_id] = acc[_id] || [];

            if (selectedProperty && filterField) {
                const propertyTemplate = properties.properties[selectedProperty];
                acc[_id].push(filterModelToFilterOfTemplatePerField(propertyTemplate, selectedProperty, filterField));
            } else acc[_id].push({});

            return acc;
        },
        {},
    );

    const templateFilterRecord = Object.entries(groupedByTemplate).map(([template, filters]) => [template, { filter: { $and: filters } }]);

    return Object.fromEntries(templateFilterRecord);
};

export const filterFieldToValue: Record<keyof IFilterOfField, string> = {
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

export const handleRegexFilter = (filterValue: string, not: boolean = false): IAGGridTextFilter | null => {
    const startsWith = filterValue.startsWith('.*');
    const endsWith = filterValue.endsWith('.*');

    if (startsWith && endsWith)
        return {
            filterType: 'text',
            type: not ? 'notContains' : 'contains',
            filter: filterValue.slice(2, -2),
        } as IAGGridTextFilter;

    if (endsWith)
        return {
            filterType: 'text',
            type: 'startsWith',
            filter: filterValue.slice(0, -2),
        } as IAGGridTextFilter;

    if (startsWith)
        return {
            filterType: 'text',
            type: 'endsWith',
            filter: filterValue.slice(2),
        } as IAGGridTextFilter;

    return null;
};

export const handleDateFilter = (
    filterKeys: (keyof IFilterOfField)[],
    fieldFilter: IFilterOfField,
    filterType: string,
    isFieldType: boolean,
): IAGGridDateFilter => {
    if (
        filterKeys.length === 2 ||
        Object.values(fieldFilter).some((value) => value === RelativeDateFilters.untilToday || value === RelativeDateFilters.fromToday)
    ) {
        const [dateFromVal, dateTo] = filterKeys;
        const dateFrom = isFieldType ? dateFromVal.slice(fieldFilterPrefix.length) : dateFromVal;

        if (relativeDateFilters.includes(fieldFilter[dateFrom] as string)) {
            return {
                filterType: 'date',
                type: fieldFilter[dateFrom],
                dateFrom: fieldFilter[dateFrom],
                dateTo: fieldFilter[dateTo],
            } as IAGGridDateFilter;
        }

        return {
            filterType: 'date',
            type: 'inRange',
            dateFrom: fieldFilter[dateFrom],
            dateTo: fieldFilter[dateTo],
        } as IAGGridDateFilter;
    }

    const dateFromVal = fieldFilter[filterKeys[0]] as string;

    return {
        filterType: 'date',
        type: filterType,
        dateFrom: isFieldType ? dateFromVal.slice(fieldFilterPrefix.length) : dateFromVal,
        dateTo: null,
    } as IAGGridDateFilter;
};

export const translateFieldFilter = (
    fieldFilter: IFilterOfField,
    { type: propType, format, enum: enumValues }: IEntitySingleProperty,
): { filterType: FilterType; filterField: IGraphFilterBody['filterField'] } => {
    const filterKeys = Object.keys(fieldFilter) as (keyof IFilterOfField)[];
    const [filterKey] = filterKeys;

    const rawValue = fieldFilter[filterKey];
    const isFieldType =
        (typeof rawValue === 'string' && rawValue.startsWith(fieldFilterPrefix)) ||
        (Array.isArray(rawValue) && rawValue.every((val) => typeof val === 'string' && val.startsWith(fieldFilterPrefix)));
    const filterType = isFieldType ? FilterType.field : FilterType.value;

    const filterValue = isFieldType
        ? !Array.isArray(rawValue)
            ? rawValue.slice(fieldFilterPrefix.length)
            : rawValue.map((val) => (val as string).slice(fieldFilterPrefix.length))
        : rawValue;

    const type = filterFieldToValue[filterKey];

    switch (propType) {
        case 'string':
        case 'boolean': {
            if (format === 'date-time' || format === 'date')
                return { filterType, filterField: handleDateFilter(filterKeys, fieldFilter, type, isFieldType) };

            if (enumValues)
                return {
                    filterType,
                    filterField: {
                        filterType: 'set',
                        values: filterValue as (string | null)[],
                    } as IAGGridSetFilter,
                };

            if (filterKey === '$rgx' && typeof filterValue === 'string') {
                const regexFilter = handleRegexFilter(filterValue);
                if (regexFilter) return { filterType, filterField: regexFilter };
            }

            if (filterKey === '$not' && typeof filterValue === 'object') {
                const notFilter = filterValue as IFilterOfField;
                if ('$rgx' in notFilter) {
                    return {
                        filterType,
                        filterField: {
                            filterType: 'text',
                            type: 'notContains',
                            filter: handleRegexFilter(notFilter.$rgx as string, true)?.filter,
                        } as IAGGridTextFilter,
                    };
                }
            }

            return {
                filterType,
                filterField: {
                    filterType: 'text',
                    type: type,
                    filter: filterValue as string,
                } as IAGGridTextFilter,
            };
        }
        case 'number':
            return {
                filterType,
                filterField: {
                    filterType: 'number',
                    type: type,
                    filter: filterValue as number,
                } as IAGGridNumberFilter,
            };

        case 'array':
            return {
                filterType,
                filterField: {
                    filterType: 'set',
                    values: filterValue as (string | null)[],
                } as IAGGridSetFilter,
            };

        default:
            throw new Error(`Unsupported filter type or missing value for filter: ${JSON.stringify(fieldFilter)}`);
    }
};

export const FilterOfGraphToFilterRecord = (
    filterModel: ISearchFilter | undefined,
    template: IMongoEntityTemplatePopulated,
): IGraphFilterBodyBatch => {
    const parsedFilters: IGraphFilterBodyBatch = {};

    if (!filterModel || !filterModel.$and || !Array.isArray(filterModel.$and)) return {};

    filterModel.$and.forEach((filter, index) => {
        Object.entries(filter).forEach(([field, fieldFilter]) => {
            if (!fieldFilter) return;

            parsedFilters[`${Date.now()}${index}`] = {
                selectedTemplate: template,
                selectedProperty: field,
                filterField: translateFieldFilter(fieldFilter, template.properties.properties[field]).filterField,
            };
        });
    });

    return parsedFilters;
};
