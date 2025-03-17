import { IFilterOfField, IFilterOfTemplate, IGraphFilterBody, IGraphFilterBodyBatch, ISearchFilter } from '../../interfaces/entities';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import {
    dateFilterToFilterOfTemplate,
    dateTimeFilterToFilterOfTemplate,
    numberFilterToFilterOfTemplate,
    setFilterToFilterOfTemplate,
    textFilterToFilterOfTemplate,
} from '../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { IAGGidNumberFilter, IAGGridDateFilter, IAGGridSetFilter, IAGGridTextFilter } from '../../utils/agGrid/interfaces';

export interface IGraphFilterToBackendBody {
    [templateId: string]: { filter: ISearchFilter } | {};
}

const propertyAndValueRelation = (
    template: IMongoEntityTemplatePopulated,
    property: string,
    filterField: IGraphFilterBody['filterField'],
): IFilterOfTemplate => {
    const { type, format } = template.properties.properties[property];

    if (format === 'date-time' || format === 'date') {
        if (format === 'date') {
            return dateFilterToFilterOfTemplate(property, filterField as IAGGridDateFilter);
        }
        return dateTimeFilterToFilterOfTemplate(property, filterField as IAGGridDateFilter);
    }
    if (type === 'number') {
        return numberFilterToFilterOfTemplate(property, filterField as IAGGidNumberFilter);
    }
    if (type === 'string' || type === 'boolean') {
        return textFilterToFilterOfTemplate(property, filterField as IAGGridTextFilter);
    }

    if (type === 'array') {
        return setFilterToFilterOfTemplate(property, filterField as IAGGridSetFilter);
    }
    return { [property]: { $eq: filterField } } as IFilterOfTemplate;
};

export const filterModelToFilterOfGraph = (filterModel: IGraphFilterBodyBatch): IGraphFilterToBackendBody['filters'] => {
    const groupedByTemplate = Object.values(filterModel).reduce((acc: Record<string, IFilterOfTemplate[]>, obj: IGraphFilterBody) => {
        const { selectedTemplate, selectedProperty, filterField } = obj;
        const { _id } = selectedTemplate;

        if (!acc[_id]) {
            // eslint-disable-next-line no-param-reassign
            acc[_id] = [];
        }
        if (
            selectedProperty &&
            selectedTemplate.properties.properties[selectedProperty].items?.enum &&
            (filterField as IAGGridSetFilter).values.length > 0
        ) {
            acc[_id].push(propertyAndValueRelation(selectedTemplate, selectedProperty, filterField));
        } else if (selectedProperty) acc[_id].push(propertyAndValueRelation(selectedTemplate, selectedProperty, filterField));
        else acc[_id].push({});
        return acc;
    }, {} as Record<string, Record<string, IFilterOfField>[]>);
    const result = Object.keys(groupedByTemplate).reduce((finalObj: Record<string, IGraphFilterToBackendBody['filters']>, template: string) => {
        // eslint-disable-next-line no-param-reassign
        finalObj[template] = {
            filter: {
                $and: groupedByTemplate[template],
            },
        };
        return finalObj;
    }, {});
    return result;
};

const filterFieldToValue: Record<keyof IFilterOfField, string> = {
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

function handleRegexFilter(filterValue: string): IAGGridTextFilter | null {
    if (filterValue.startsWith('.*') && filterValue.endsWith('.*'))
        return {
            filterType: 'text',
            type: 'contains',
            filter: filterValue.slice(2, -2),
        } as IAGGridTextFilter;

    if (filterValue.endsWith('.*'))
        return {
            filterType: 'text',
            type: 'startsWith',
            filter: filterValue.slice(0, -2),
        } as IAGGridTextFilter;

    if (filterValue.startsWith('.*'))
        return {
            filterType: 'text',
            type: 'endsWith',
            filter: filterValue.slice(2),
        } as IAGGridTextFilter;

    return null;
}

function translateFieldFilter(fieldFilter: IFilterOfField, { type, format }: IEntitySingleProperty): IGraphFilterBody['filterField'] {
    const filterKeys = Object.keys(fieldFilter) as (keyof IFilterOfField)[];
    const [filterKey] = filterKeys;
    const filterValue = fieldFilter[filterKey];

    const filterType = filterFieldToValue[filterKey];

    if (format === 'date-time' || format === 'date') {
        if (filterKeys.length === 2) {
            const [dateFrom, dateTo] = filterKeys;

            return {
                filterType: 'date',
                type: 'inRange',
                dateFrom: fieldFilter[dateFrom] as string,
                dateTo: fieldFilter[dateTo] as string,
            } as IAGGridDateFilter;
        }

        return {
            filterType: 'date',
            type: filterType,
            dateFrom: fieldFilter[filterKey] as string,
            dateTo: null,
        } as IAGGridDateFilter;
    }

    if (type === 'number')
        return {
            filterType: 'number',
            type: filterType,
            filter: filterValue as number,
        } as IAGGidNumberFilter;

    if (type === 'string' || type === 'boolean') {
        if (filterKey === '$rgx' && typeof filterValue === 'string') {
            const regexFilter = handleRegexFilter(filterValue);
            if (regexFilter) return regexFilter;
        }

        return {
            filterType: 'text',
            type: filterType,
            filter: filterValue as string,
        } as IAGGridTextFilter;
    }

    if (type === 'array')
        return {
            filterType: 'set',
            values: filterValue as (string | null)[],
        } as IAGGridSetFilter;

    throw new Error(`Unsupported filter type or missing value for filter: ${JSON.stringify(fieldFilter)}`);
}

export const FilterOfGraphToFilterRecord = (
    filterModel: ISearchFilter | undefined,
    template: IMongoEntityTemplatePopulated,
): IGraphFilterBodyBatch => {
    const parsedFilters: IGraphFilterBodyBatch = {};

    if (!filterModel || !filterModel.$and) return {};

    if (Array.isArray(filterModel.$and)) {
        filterModel.$and.forEach((filter, index) => {
            Object.entries(filter).forEach(([field, fieldFilter]) => {
                if (!fieldFilter) return;

                parsedFilters[`${Date.now()}${index}`] = {
                    selectedTemplate: template,
                    selectedProperty: field,
                    filterField: translateFieldFilter(fieldFilter, template.properties.properties[field]),
                };
            });
        });
    }

    return parsedFilters;
};
