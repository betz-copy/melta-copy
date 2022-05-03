import assert from 'assert';

export interface IAGGridTextFilter {
    filterType: 'text';
    type: 'equals' | 'notEqual' | 'contains' | 'notContains' | 'startsWith' | 'endsWith' | 'blank' | 'notBlank';
    filter: string;
}

export interface IAGGidNumberFilter {
    filterType: 'number';
    type: 'equals' | 'notEqual' | 'lessThan' | 'lessThanOrEqual' | 'greaterThan' | 'greaterThanOrEqual' | 'inRange' | 'blank' | 'notBlank';
    filter: number;
    filterTo?: number; // only inRange type
}

export interface IAGGridDateFilter {
    filterType: 'date';
    type: 'equals' | 'notEqual' | 'lessThan' | 'lessThanOrEqual' | 'greaterThan' | 'greaterThanOrEqual' | 'inRange' | 'blank' | 'notBlank';
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
    return `node.${field} IN [${values.map((value) => `'${value}'`).join(',')}]`;
};

export const textFilterToQuery = (field: string, { type, filter }: IAGGridTextFilter) => {
    switch (type) {
        case 'equals':
            return `node.${field} = '${filter}'`;
        case 'notEqual':
            return `node.${field} != '${filter}'`;
        case 'contains':
            return `node.${field} CONTAINS '${filter}'`;
        case 'notContains':
            return `node.${field} NOT CONTAINS '${filter}'`;
        case 'startsWith':
            return `node.${field} STARTS WITH '${filter}'`;
        case 'endsWith':
            return `node.${field} ENDS WITH '${filter}'`;
        case 'blank':
            return `node.${field} IS NULL`;
        case 'notBlank':
            return `node.${field} IS NOT NULL`;
        default:
            throw new Error('Invalid supported ag-grid filter type method');
    }
};

export const numberFilterToQuery = (field: string, { type, filter, filterTo }: IAGGidNumberFilter) => {
    switch (type) {
        case 'equals':
            return `node.${field} = ${filter}`;
        case 'notEqual':
            return `node.${field} != ${filter}`;
        case 'lessThan':
            return `node.${field} < ${filter}`;
        case 'lessThanOrEqual':
            return `node.${field} <= ${filter}`;
        case 'greaterThan':
            return `node.${field} > ${filter}`;
        case 'greaterThanOrEqual':
            return `node.${field} >= ${filter}`;
        case 'inRange':
            assert(filterTo, 'inRange must have filter & filterTo');
            return `${filter} <= node.${field} <= ${filterTo}`;
        case 'blank':
            return `node.${field} IS NULL`;
        case 'notBlank':
            return `node.${field} IS NOT NULL`;
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
            return `date(node.${field}) = date('${dateFrom}')`;
        case 'notEqual':
            return `date(node.${field}) != date('${dateFrom}')`;
        case 'lessThan':
            return `date(node.${field}) < date('${dateFrom}')`;
        case 'lessThanOrEqual':
            return `date(node.${field}) <= date('${dateFrom}')`;
        case 'greaterThan':
            return `date(node.${field}) > date('${dateFrom}')`;
        case 'greaterThanOrEqual':
            return `date(node.${field}) >= date('${dateFrom}')`;
        case 'inRange':
            assert(dateToString, 'inRange must have dateFrom & dateTo');
            return `date('${dateFrom}') <= node.${field} <= date('${formatDate(dateToString)}')`;
        case 'blank':
            return `node.${field} IS NULL`;
        case 'notBlank':
            return `node.${field} IS NOT NULL`;
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

    return queries.length > 0 ? queries.join(' AND ') : '';
};

export const sortModelToNeo4JSort = (sortModel: IAGGridSort[]) => {
    const sortOptions = sortModel.map(({ colId, sort }) => `node.${colId} ${sort}`);

    return sortOptions.join(',');
};

const constructFilterQuery = (templateId: string, filterModel: IAGGridFilterModel) => {
    return `WHERE node:\`${templateId}\` ${Object.keys(filterModel).length ? `AND ${filterModelToQuery(filterModel)}` : ''}`;
};

const constructSearchQuery = (agGridRequest: IAGGridRequest, filterQuery: string) => {
    return `
        CALL db.index.fulltext.queryNodes('globalSearch', '*${agGridRequest.quickFilter}*')
        YIELD node, score
        ${filterQuery}
        RETURN node, score
        ORDER BY score ${agGridRequest.sortModel.length ? `,${sortModelToNeo4JSort(agGridRequest.sortModel)}` : ''} 
        SKIP ${agGridRequest.startRow}
        LIMIT ${agGridRequest.endRow - agGridRequest.startRow + 1}`;
};

const constructOverallCountQuery = (filterQuery: string, quickFilter?: string) => {
    if (quickFilter) {
        return `
            CALL db.index.fulltext.queryNodes('globalSearch', '*${quickFilter}*')
            YIELD node
            ${filterQuery}
            RETURN count(node)`;
    }

    return `
        MATCH (node) 
        ${filterQuery}
        RETURN count(node)`;
};

export const agGridRequestToNeo4JRequest = (templateId: string, agGridRequest: IAGGridRequest, calculateOverallCount = false) => {
    const filterQuery = constructFilterQuery(templateId, agGridRequest.filterModel);

    if (calculateOverallCount) {
        return constructOverallCountQuery(filterQuery, agGridRequest.quickFilter);
    }

    if (agGridRequest.quickFilter) {
        return constructSearchQuery(agGridRequest, filterQuery);
    }

    const sortQuery = agGridRequest.sortModel.length ? `ORDER BY ${sortModelToNeo4JSort(agGridRequest.sortModel)}` : '';

    return `
        MATCH (node) 
        ${filterQuery}
        RETURN node 
        ${sortQuery}
        SKIP ${agGridRequest.startRow}
        LIMIT ${agGridRequest.endRow - agGridRequest.startRow + 1}`;
};
