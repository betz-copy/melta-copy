import { useQueryClient } from 'react-query';
import { IFilterOfField, IFilterOfTemplate, ISearchFilter } from '../../../../interfaces/entities';
import { IEntitySingleProperty, IEntityTemplateMap } from '../../../../interfaces/entityTemplates';
import {
    dateFilterToFilterOfTemplate,
    numberFilterToFilterOfTemplate,
    textFilterToFilterOfTemplate,
} from '../../../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { IAGGidNumberFilter, IAGGridDateFilter, IAGGridTextFilter } from '../../../../utils/agGrid/interfaces';
import { IAGGridFilter, IFilterRelationReference } from '../commonInterfaces';

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

const relationFieldFilterToFilterOfTemplate = (field: string, fieldFilter: IAGGridFilter): IFilterOfTemplate => {
    switch (fieldFilter.filterType) {
        case 'text':
            return textFilterToFilterOfTemplate(field, fieldFilter);
        case 'number':
            return numberFilterToFilterOfTemplate(field, fieldFilter);
        case 'date':
            return dateFilterToFilterOfTemplate(field, fieldFilter);
        default:
            throw new Error('Invalid supported ag-grid filter type');
    }
};

export const filterRelationListToSearchFilter = (filterModel: IFilterRelationReference[]): ISearchFilter | undefined => {
    if (filterModel.length === 0) return undefined;

    const filters: IFilterOfTemplate[] = filterModel
        .map(({ filterProperty, filterField }) => {
            if (!filterProperty || !filterField) return {};
            return relationFieldFilterToFilterOfTemplate(filterProperty, filterField);
        })
        .filter((filter) => Object.keys(filter).length > 0); // Filter out empty filters

    if (filters.length === 0) return undefined;

    return {
        $and: filters,
    };
};

const handleRegexFilter = (filterValue: string): IAGGridTextFilter | null => {
    const startsWith = filterValue.startsWith('.*');
    const endsWith = filterValue.endsWith('.*');

    if (startsWith && endsWith)
        return {
            filterType: 'text',
            type: 'contains',
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

const handleDateFilter = (filterKeys: (keyof IFilterOfField)[], fieldFilter: IFilterOfField, filterType: string): IAGGridDateFilter => {
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
        dateFrom: fieldFilter[filterKeys[0]] as string,
        dateTo: null,
    } as IAGGridDateFilter;
};

const translateRelationFieldFilter = (fieldFilter: IFilterOfField, property?: IEntitySingleProperty): IAGGridFilter | null => {
    if (!property) return null;

    const { type, format } = property;

    const filterKeys = Object.keys(fieldFilter) as (keyof IFilterOfField)[];
    const [filterKey] = filterKeys;
    const filterValue = fieldFilter[filterKey];

    const filterType = filterFieldToValue[filterKey];

    switch (type) {
        case 'string':
        case 'boolean': {
            if (format === 'date-time' || format === 'date') return handleDateFilter(filterKeys, fieldFilter, filterType);

            if (filterKey === '$rgx' && typeof filterValue === 'string') {
                const regexFilter = handleRegexFilter(filterValue);
                if (regexFilter) return regexFilter;
            }

            if (filterKey === '$not' && filterValue && typeof filterValue === 'object') {
                const regexValue = filterValue['$rgx'];
                const regexFilter = handleRegexFilter(regexValue);
                if (regexFilter) return regexFilter;
            }

            return {
                filterType: 'text',
                type: filterType,
                filter: filterValue as string,
            } as IAGGridTextFilter;
        }
        case 'number':
            return {
                filterType: 'number',
                type: filterType,
                filter: filterValue as number,
            } as IAGGidNumberFilter;

        default:
            return null;
    }
};

// New function to handle relation filter conversion
export const SearchFilterToFilterRelationList = (relatedTemplateId: string, filterModel?: ISearchFilter): IFilterRelationReference[] => {
    if (!filterModel || !filterModel.$and || !Array.isArray(filterModel.$and)) return [];

    const relationFilters: IFilterRelationReference[] = [];
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const relatedTemplate = entityTemplates.get(relatedTemplateId)!;

    filterModel.$and.forEach((filter) => {
        Object.entries(filter).forEach(([field, fieldFilter]) => {
            if (!fieldFilter) return;

            const property = relatedTemplate.properties.properties[field];
            const filterField = translateRelationFieldFilter(fieldFilter, property);

            if (filterField) {
                relationFilters.push({
                    filterProperty: field,
                    filterField,
                });
            }
        });
    });

    return relationFilters;
};
