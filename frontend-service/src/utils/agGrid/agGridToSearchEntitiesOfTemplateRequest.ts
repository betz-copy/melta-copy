import { environment } from '../../globals';
import { ICountSearchResult, IFilterOfField, IFilterOfTemplate, ISearchEntitiesOfTemplateBody, ISearchFilter } from '../../interfaces/entities';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { getDayEnd, getDayStart } from '../date';
import { addDefaultFieldsToTemplate } from '../templates';
import { IAGGidNumberFilter, IAGGridDateFilter, IAGGridFilterModel, IAGGridRequest, IAGGridSort, IAGGridTextFilter } from './interfaces';

export const setFilterToFilterOfTemplate = (field: string, values: (string | null)[]): IFilterOfTemplate => {
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
            return { [field]: { $not: { $rgx: `.*${escapeRegExp(filter!)}.*` } } };
        case 'startsWith':
            return { [field]: { $rgx: `${escapeRegExp(filter!)}.*` } };
        case 'endsWith':
            return { [field]: { $rgx: `.*${escapeRegExp(filter!)}` } };
        case 'blank': {
            return { [field]: { $eq: null } };
        }
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

export const filterModelToFilterOfTemplatePerField = (
    fieldTemplate: IEntitySingleProperty,
    field: string,
    fieldFilter: IAGGridFilterModel[keyof IAGGridFilterModel],
) => {
    switch (fieldFilter.filterType) {
        case 'text':
            if (fieldTemplate.format === 'fileId') {
                return textFilterOfFileToFilterTemplate(field, fieldFilter);
            } else {
                return textFilterToFilterOfTemplate(field, fieldFilter);
            }
        case 'number':
            return numberFilterToFilterOfTemplate(field, fieldFilter);
        case 'date':
            if (fieldTemplate.format === 'date') {
                return dateFilterToFilterOfTemplate(field, fieldFilter);
            } else {
                return dateTimeFilterToFilterOfTemplate(field, fieldFilter);
            }
        case 'set':
            const filtersValues = Array.isArray(fieldFilter.values)
                ? fieldFilter.values.map((item) => (typeof item === 'object' ? item?.fullName || null : item))
                : fieldFilter.values;

            return setFilterToFilterOfTemplate(field, filtersValues);
        default:
            throw new Error('Invalid supported ag-grid filter type');
    }
};

export const filterModelToFilterOfTemplate = (
    filterModel: IAGGridFilterModel,
    entityTemplate: IMongoEntityTemplatePopulated,
): ISearchEntitiesOfTemplateBody['filter'] => {
    const entityTemplateWithDefaultFields = addDefaultFieldsToTemplate(entityTemplate);

    const queries = Object.entries(filterModel).flatMap(([field, fieldFilter]) => {
        const fieldTemplate = entityTemplateWithDefaultFields.properties.properties[field];
        const filter = filterModelToFilterOfTemplatePerField(fieldTemplate, field, fieldFilter);

        if (filter[field] && typeof filter[field] === 'object' && '$and' in (filter[field] as object)) {
            return (filter[field] as { $and: IFilterOfField[] })['$and'].map((condition) => ({ [field]: condition }));
        }

        return [filter];
    });

    return queries.length > 0 ? { $and: queries } : undefined;
};

export const sortModelToSortOfSearchRequest = (sortModel: IAGGridSort[]): ISearchEntitiesOfTemplateBody['sort'] => {
    return sortModel.map(({ colId, sort }) => ({ field: colId, sort }));
};

export const getFilterModal = (
    filterModel?: ISearchEntitiesOfTemplateBody['filter'],
    defaultModal?: ISearchEntitiesOfTemplateBody['filter'],
): ISearchFilter | undefined => {
    if (!filterModel && !defaultModal) return undefined;

    const extractAndArray = (filter?: ISearchFilter): IFilterOfTemplate[] => {
        if (filter?.$and) {
            return Array.isArray(filter.$and) ? filter.$and : [filter.$and];
        }

        return [];
    };

    const filterModelAnds = extractAndArray(filterModel);
    const defaultModalAnds = extractAndArray(defaultModal);

    return {
        $and: [...filterModelAnds, ...defaultModalAnds],
    };
};

export const agGridToSearchEntitiesOfTemplateRequest = (
    agGridRequest: IAGGridRequest,
    entityTemplate: IMongoEntityTemplatePopulated & { entitiesWithFiles?: ICountSearchResult['entitiesWithFiles'] },
    defaultFilter?: ISearchEntitiesOfTemplateBody['filter'],
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
