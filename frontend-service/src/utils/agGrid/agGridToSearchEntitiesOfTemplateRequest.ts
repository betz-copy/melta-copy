import { environment } from '../../globals';
import { ICountSearchResult, IFilterOfTemplate, ISearchEntitiesOfTemplateBody, ISearchFilter } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { getDayStart, getDayEnd } from '../date';
import { addDefaultFieldsToTemplate } from '../templates';
import {
    IAGGidNumberFilter,
    IAGGridDateFilter,
    IAGGridFilterModel,
    IAGGridRequest,
    IAGGridSetFilter,
    IAGGridSort,
    IAGGridTextFilter,
} from './interfaces';

export const setFilterToFilterOfTemplate = (field: string, { values }: IAGGridSetFilter): IFilterOfTemplate => {
    return { [field]: { $in: values } };
};

export const textFilterToFilterOfTemplate = (field: string, { type, filter }: IAGGridTextFilter): IFilterOfTemplate => {
    const escapeRegExp = (string: string) => {
        return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    };
    switch (type) {
        case 'equals':
            return { [field]: { $eq: filter } };
        case 'notEqual':
            return { [field]: { $ne: filter } };
        case 'contains':
            return { [field]: { $rgx: `.*${escapeRegExp(filter!)}.*` } };
        case 'notContains':
            return { [field]: { $not: { $rgx: `${escapeRegExp(filter!)}` } } };
        case 'startsWith':
            return { [field]: { $rgx: `${escapeRegExp(filter!)}.*` } };
        case 'endsWith':
            return { [field]: { $rgx: `.*${escapeRegExp(filter!)}` } };
        case 'blank':
            return { [field]: { $eq: null } };
        case 'notBlank':
            return { [field]: { $ne: null } };
        default:
            throw new Error('Invalid supported ag-grid filter type method');
    }
};

export const textFilterOfFileToFilterTemplate = (field: string, { type, filter }: IAGGridTextFilter): IFilterOfTemplate => {
    const escapeRegExp = (string: string) => {
        return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    };

    switch (type) {
        case 'equals':
            return { [field]: { $rgx: `.{${environment.fileIdLength}}${escapeRegExp(filter!)}` } };
        case 'notEqual':
            return { [field]: { $not: { $rgx: `.{${environment.fileIdLength}}${escapeRegExp(filter!)}` } } };
        case 'contains':
            return { [field]: { $rgx: `.{${environment.fileIdLength}}.*${escapeRegExp(filter!)}.*` } };
        case 'notContains':
            return { [field]: { $not: { $rgx: `.{${environment.fileIdLength}}.*${escapeRegExp(filter!)}.*` } } };
        case 'startsWith':
            return { [field]: { $rgx: `^.{${environment.fileIdLength}}${escapeRegExp(filter!)}.*` } };
        case 'endsWith':
            return { [field]: { $rgx: `.{${environment.fileIdLength}}.*${escapeRegExp(filter!)}` } };
        case 'blank':
            return { [field]: { $eq: null } };
        case 'notBlank':
            return { [field]: { $ne: null } };
        default:
            throw new Error('Invalid supported ag-grid filter type method');
    }
};

export const numberFilterToFilterOfTemplate = (field: string, { type, filter, filterTo }: IAGGidNumberFilter): IFilterOfTemplate => {
    switch (type) {
        case 'equals':
            return { [field]: { $eq: filter } };
        case 'notEqual':
            return { [field]: { $ne: filter } };
        case 'lessThan':
            return { [field]: { $lt: filter } };
        case 'lessThanOrEqual':
            return { [field]: { $lte: filter } };
        case 'greaterThan':
            return { [field]: { $gt: filter } };
        case 'greaterThanOrEqual':
            return { [field]: { $gte: filter } };
        case 'inRange': {
            return { [field]: { $gte: filter, $lte: filterTo } };
        }
        case 'blank':
            return { [field]: { $eq: null } };
        case 'notBlank':
            return { [field]: { $ne: null } };
        default:
            throw new Error('Invalid supported ag-grid filter type method');
    }
};

export const dateFilterToFilterOfTemplate = (
    field: string,
    { type, dateFrom: dateFromString, dateTo: dateToString }: IAGGridDateFilter,
): IFilterOfTemplate => {
    if (!dateFromString) {
        switch (type) {
            case 'blank':
                return { [field]: { $eq: null } };
            case 'notBlank':
                return { [field]: { $ne: null } };
            default:
                throw new Error('Invalid supported ag-grid filter type method');
        }
    }

    const dateFrom = new Date(dateFromString).toISOString().split('T')[0];

    switch (type) {
        case 'equals':
            return { [field]: { $eq: dateFrom } };
        case 'notEqual':
            return { [field]: { $ne: dateFrom } };
        case 'lessThan':
            return { [field]: { $lt: dateFrom } };
        case 'lessThanOrEqual':
            return { [field]: { $lte: dateFrom } };
        case 'greaterThan':
            return { [field]: { $gt: dateFrom } };
        case 'greaterThanOrEqual':
            return { [field]: { $gte: dateFrom } };
        case 'inRange':
            // eslint-disable-next-line no-case-declarations
            const dateTo = new Date(dateToString!).toISOString().split('T')[0];
            return { [field]: { $gte: dateFrom, $lte: dateTo } };
        default:
            throw new Error('Invalid supported ag-grid filter type method');
    }
};

export const dateTimeFilterToFilterOfTemplate = (
    field: string,
    { type, dateFrom: dateFromString, dateTo: dateToString }: IAGGridDateFilter,
): IFilterOfTemplate => {
    if (!dateFromString) {
        switch (type) {
            case 'blank':
                return { [field]: { $eq: null } };
            case 'notBlank':
                return { [field]: { $ne: null } };
            default:
                throw new Error('Invalid supported ag-grid filter type method');
        }
    }

    const dateFrom = new Date(dateFromString);

    switch (type) {
        case 'equals':
            return { [field]: { $gte: getDayStart(dateFrom).toISOString(), $lte: getDayEnd(dateFrom).toISOString() } };
        case 'notEqual':
            return { [field]: { $not: { $gte: getDayStart(dateFrom).toISOString(), $lte: getDayEnd(dateFrom).toISOString() } } };
        case 'lessThan':
            return { [field]: { $lt: getDayStart(dateFrom).toISOString() } }; // dont include this day
        case 'lessThanOrEqual':
            return { [field]: { $lte: getDayEnd(dateFrom).toISOString() } }; // include this day
        case 'greaterThan':
            return { [field]: { $gt: getDayEnd(dateFrom).toISOString() } }; // dont include this day
        case 'greaterThanOrEqual':
            return { [field]: { $gte: getDayStart(dateFrom).toISOString() } }; // include this day
        case 'inRange':
            // eslint-disable-next-line no-case-declarations
            const dateTo = new Date(dateToString!);
            return { [field]: { $gte: getDayStart(dateFrom).toISOString(), $lte: getDayEnd(dateTo).toISOString() } };
        default:
            throw new Error('Invalid supported ag-grid filter type method');
    }
};

export const filterModelToFilterOfTemplate = (
    filterModel: IAGGridFilterModel,
    entityTemplate: IMongoEntityTemplatePopulated,
): ISearchEntitiesOfTemplateBody['filter'] => {
    const entityTemplateWithDefaultFields = addDefaultFieldsToTemplate(entityTemplate);

    const queries = Object.keys(filterModel).map((field) => {
        const fieldFilter = filterModel[field];

        const fieldTemplate = entityTemplateWithDefaultFields.properties.properties[field];

        switch (fieldFilter.filterType) {
            case 'text':
                if (fieldTemplate.format === 'fileId') return textFilterOfFileToFilterTemplate(field, fieldFilter);
                return textFilterToFilterOfTemplate(field, fieldFilter);
            case 'number':
                return numberFilterToFilterOfTemplate(field, fieldFilter);
            case 'date':
                if (fieldTemplate.format === 'date') {
                    return dateFilterToFilterOfTemplate(field, fieldFilter);
                }
                return dateTimeFilterToFilterOfTemplate(field, fieldFilter);
            case 'set':
                return setFilterToFilterOfTemplate(field, fieldFilter);
            default:
                throw new Error('Invalid supported ag-grid filter type');
        }
    });

    return queries.length > 0 ? { $and: queries } : undefined;
};

export const sortModelToSortOfSearchRequest = (sortModel: IAGGridSort[]): ISearchEntitiesOfTemplateBody['sort'] => {
    return sortModel.map(({ colId, sort }) => ({ field: colId, sort }));
};

export const agGridToSearchEntitiesOfTemplateRequest = (
    agGridRequest: IAGGridRequest,
    entityTemplate: IMongoEntityTemplatePopulated & { entitiesWithFiles?: ICountSearchResult['entitiesWithFiles'] },
): ISearchEntitiesOfTemplateBody => {
    const { startRow, endRow, filterModel, quickFilter, sortModel } = agGridRequest;
    return {
        skip: startRow,
        limit: endRow - startRow,
        textSearch: quickFilter,
        filter: filterModelToFilterOfTemplate(filterModel, entityTemplate),
        showRelationships: false,
        sort: sortModelToSortOfSearchRequest(sortModel),
        entitiesWithFiles: entityTemplate.entitiesWithFiles,
    };
};


export const filterOfTemplateToFilterModel = (filterOfTemplate: ISearchFilter, entityTemplate: IMongoEntityTemplatePopulated): IAGGridFilterModel => {
    console.log('hiiiiiiiii');

    const filterModel: IAGGridFilterModel = {};

    const processFilter = (filter: IFilterOfTemplate<any>) => {
        Object.keys(filter).forEach((field) => {
            const fieldFilter = filter[field];
            if (!fieldFilter) return; // Skip undefined or null filters

            const fieldTemplate = entityTemplate.properties.properties[field];

            if ('$in' in fieldFilter && fieldFilter.$in) {
                // Set filter
                filterModel[field] = {
                    filterType: 'set',
                    values: fieldFilter.$in,
                } as IAGGridSetFilter;
            } else if ('$eq' in fieldFilter || '$ne' in fieldFilter) {
                // Text or number filter (equals or not equal)
                const isTextField = fieldTemplate.format === 'string';
                const value = fieldFilter.$eq ?? fieldFilter.$ne;
                if (value !== undefined) {
                    filterModel[field] = {
                        filterType: isTextField ? 'text' : 'number',
                        type: fieldFilter.$eq !== undefined ? 'equals' : 'notEqual',
                        filter: value,
                    };
                }
            } else if ('$lt' in fieldFilter || '$lte' in fieldFilter || '$gt' in fieldFilter || '$gte' in fieldFilter) {
                // Number or date range filter
                const isDateField = fieldTemplate.format === 'date' || fieldTemplate.format === 'datetime';
                const typeMapping: Record<string, string> = {
                    $lt: 'lessThan',
                    $lte: 'lessThanOrEqual',
                    $gt: 'greaterThan',
                    $gte: 'greaterThanOrEqual',
                };

                Object.entries(typeMapping).forEach(([key, type]) => {
                    if (key in fieldFilter && fieldFilter[key as keyof typeof fieldFilter] !== undefined) {
                        filterModel[field] = {
                            filterType: isDateField ? 'date' : 'number',
                            type,
                            filter: fieldFilter[key as keyof typeof fieldFilter],
                        } as IAGGidNumberFilter | IAGGridDateFilter;
                    }
                });
            } else if ('$rgx' in fieldFilter && fieldFilter.$rgx) {
                // Text filter with regex
                const regexString = fieldFilter.$rgx;
                if (regexString.startsWith('.*') && regexString.endsWith('.*')) {
                    filterModel[field] = {
                        filterType: 'text',
                        type: 'contains',
                        filter: regexString.slice(2, -2),
                    };
                } else if (regexString.startsWith('.*')) {
                    filterModel[field] = {
                        filterType: 'text',
                        type: 'endsWith',
                        filter: regexString.slice(2),
                    };
                } else if (regexString.endsWith('.*')) {
                    filterModel[field] = {
                        filterType: 'text',
                        type: 'startsWith',
                        filter: regexString.slice(0, -2),
                    };
                } else {
                    filterModel[field] = {
                        filterType: 'text',
                        type: 'equals',
                        filter: regexString,
                    };
                }
            } else if ('$not' in fieldFilter && fieldFilter.$not?.$rgx) {
                // Text filter with notContains
                const regexString = fieldFilter.$not.$rgx;
                if (regexString) {
                    filterModel[field] = {
                        filterType: 'text',
                        type: 'notContains',
                        filter: regexString.slice(2, -2),
                    };
                }
            } else if ('$eq' in fieldFilter && fieldFilter.$eq === null) {
                // Blank filter
                filterModel[field] = {
                    filterType: 'text',
                    type: 'blank',
                };
            } else if ('$ne' in fieldFilter && fieldFilter.$ne === null) {
                // Not blank filter
                filterModel[field] = {
                    filterType: 'text',
                    type: 'notBlank',
                };
            }
        });
    };

    // Handle `$and` and `$or` recursively
    if (filterOfTemplate.$and) {
        const andFilters = Array.isArray(filterOfTemplate.$and) ? filterOfTemplate.$and : [filterOfTemplate.$and];
        andFilters.forEach((andFilter) => processFilter(andFilter));
    }

    if (filterOfTemplate.$or) {
        filterOfTemplate.$or.forEach((orFilter) => processFilter(orFilter));
    }

    console.log({ inFunccccccccc: filterModel });

    return filterModel;
};
