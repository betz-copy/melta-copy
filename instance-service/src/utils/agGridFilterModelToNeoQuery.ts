import assert from 'assert';

export interface IAGGridTextFilter {
    filterType: 'text';
    type: 'equals' | 'notEqual' | 'contains' | 'notContains' | 'startsWith' | 'endsWith';
    filter: string;
}

export interface IAGGidNumberFilter {
    filterType: 'number';
    type: 'equals' | 'notEqual' | 'lessThan' | 'lessThanOrEqual' | 'greaterThan' | 'greaterThanOrEqual' | 'inRange';
    filter: number;
    filterTo?: number; // only inRange type
}

export interface IAGGridDateFilter {
    filterType: 'date';
    type: 'equals' | 'notEqual' | 'lessThan' | 'lessThanOrEqual' | 'greaterThan' | 'greaterThanOrEqual' | 'inRange';
    dateFrom: string;
    dateTo?: string; // only inRange type
}

export interface IAGGridSetFilter {
    filterType: 'set';
    values: string[];
}

export interface IAGGridFilterModel {
    [key: string]: IAGGridTextFilter | IAGGidNumberFilter | IAGGridDateFilter | IAGGridSetFilter;
}

export interface IAGGridSort {
    colId: string;
    sort: 'asc' | 'desc';
}

export interface IAGGridRequest {
    startRow: number;
    endRow: number;
    filterModel: IAGGridFilterModel;
    quickFilter?: string;
    sortModel: IAGGridSort[];
}

export const setFilterToQuery = (field: string, { values }: IAGGridSetFilter) => {
    return `e.${field} IN [${values}]`;
};

export const textFilterToQuery = (field: string, { type, filter }: IAGGridTextFilter) => {
    switch (type) {
        case 'equals':
            return `e.${field} = '${filter}'`;
        case 'notEqual':
            return `e.${field} != '${filter}'`;
        case 'contains':
            return `e.${field} CONTAINS '${filter}'`;
        case 'notContains':
            return `e.${field} NOT CONTAINS '${filter}'`;
        case 'startsWith':
            return `e.${field} STARTS WITH '${filter}'`;
        case 'endsWith':
            return `e.${field} ENDS WITH '${filter}'`; // TODO: verify hebrew
        default:
            throw new Error('Invalid supported ag-grid filter type method');
    }
};

export const numberFilterToQuery = (field: string, { type, filter, filterTo }: IAGGidNumberFilter) => {
    switch (type) {
        case 'equals':
            return `e.${field} = ${filter}`;
        case 'notEqual':
            return `e.${field} != ${filter}`;
        case 'lessThan':
            return `e.${field} < ${filter}`;
        case 'lessThanOrEqual':
            return `e.${field} <= ${filter}`;
        case 'greaterThan':
            return `e.${field} > ${filter}`;
        case 'greaterThanOrEqual':
            return `e.${field} >= ${filter}`;
        case 'inRange':
            assert(filterTo, 'inRange must have filter & filterTo');
            return `${filter} <= e.${field} <= ${filterTo}`;
        default:
            throw new Error('Invalid supported ag-grid filter type method');
    }
};

/**
 *
 * @param date
 * @returns Date in YYYY-MM-DD Format
 */
const formatDate = (date: string) => {
    return new Date(date).toISOString().slice(0, 10);
};

export const dateFilterToQuery = (field: string, { type, dateFrom: dateFromString, dateTo: dateToString }: IAGGridDateFilter) => {
    const dateFrom = formatDate(dateFromString);

    switch (type) {
        case 'equals':
            return `date(e.${field}) = date('${dateFrom}')`;
        case 'notEqual':
            return `date(e.${field}) != date('${dateFrom}')`;
        case 'lessThan':
            return `date(e.${field}) < date('${dateFrom}')`;
        case 'lessThanOrEqual':
            return `date(e.${field}) <= date('${dateFrom}')`;
        case 'greaterThan':
            return `date(e.${field}) > date('${dateFrom}')`;
        case 'greaterThanOrEqual':
            return `date(e.${field}) >= date('${dateFrom}')`;
        case 'inRange':
            assert(dateToString, 'inRange must have dateFrom & dateTo');
            return `date('${dateFrom}') <= e.${field} <= date('${formatDate(dateToString)}')`;
        default:
            throw new Error('Invalid supported ag-grid filter type method');
    }
};

export const filterModelToQuery = (filterModel: IAGGridFilterModel) => {
    const queries = Object.keys(filterModel).map((field) => {
        const fieldFilter = filterModel[field];

        switch (fieldFilter.filterType) {
            case 'text':
                return textFilterToQuery(field, fieldFilter);
            case 'number':
                return numberFilterToQuery(field, fieldFilter);
            case 'date':
                return dateFilterToQuery(field, fieldFilter);
            case 'set':
                return setFilterToQuery(field, fieldFilter);
            default:
                throw new Error('Invalid supported ag-grid filter type');
        }
    });

    return queries.length > 0 ? `WHERE ${queries.join(' AND ')}` : '';
};

export const sortModelToNeo4JSort = (sortModel: IAGGridSort[]) => {
    const sortOptions = sortModel.map(({ colId, sort }) => `e.${colId} ${sort}`);

    return sortOptions.join(',');
};

export const agGridRequestToNeo4JRequest = (templateId: string, agGridRequest: IAGGridRequest, calculateOverallCount = false) => {
    if (calculateOverallCount) {
        return `
        MATCH (e: \`${templateId}\`) ${filterModelToQuery(agGridRequest.filterModel)}
        RETURN count(e)`;
    }

    const sortQuery = agGridRequest.sortModel.length > 0 ? `ORDER BY ${sortModelToNeo4JSort(agGridRequest.sortModel)}` : '';

    return `
    MATCH (e: \`${templateId}\`) ${filterModelToQuery(agGridRequest.filterModel)}
    RETURN e 
    ${sortQuery}
    SKIP ${agGridRequest.startRow}
    LIMIT ${agGridRequest.endRow - agGridRequest.startRow + 1}`;
};
