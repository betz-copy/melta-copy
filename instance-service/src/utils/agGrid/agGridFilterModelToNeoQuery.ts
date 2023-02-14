import assert from 'assert';
import { formatDate } from '../neo4j/lib';
import {
    IAGGidNumberFilter,
    IAGGridDateFilter,
    IAGGridFilterModel,
    IAGGridRequest,
    IAGGridSetFilter,
    IAGGridSort,
    IAGGridTextFilter,
} from './interfaces';
import config from '../../config';

const {
    neo4j: { specialCharsToEscapeNeo4jQuery },
} = config;

type CypherQueryWithParameters = { cypherQuery: string; parameters: Record<string, any> };

export const setFilterToQuery = (field: string, { values }: IAGGridSetFilter, parametersParentVariableName: string): CypherQueryWithParameters => {
    const valuesWithoutNulls = values.filter(Boolean) as string[];

    const valuesVariableName = `${field}_values`;
    const valuesVariablePath = `${parametersParentVariableName}.${valuesVariableName}`;

    // do toString to support filtering boolean fields with set filter.
    // currently ag-grid allows set filter to contain only strings. see here: https://github.com/ag-grid/ag-grid/issues/1005
    const isFieldInValuesQuery = `toString(node.${field}) IN $${valuesVariablePath}`;

    if (values.includes(null)) {
        return {
            cypherQuery: `((node.${field} IS NULL) OR (${isFieldInValuesQuery}))`,
            parameters: { [valuesVariableName]: valuesWithoutNulls },
        };
    }

    return { cypherQuery: isFieldInValuesQuery, parameters: { [valuesVariableName]: valuesWithoutNulls } };
};

export const textFilterToQuery = (
    field: string,
    { type, filter }: IAGGridTextFilter,
    parametersParentVariableName: string,
): CypherQueryWithParameters => {
    const filterVariableName = `${field}_filter`;
    const filterVariablePath = `${parametersParentVariableName}.${filterVariableName}`;

    switch (type) {
        case 'equals':
            return {
                cypherQuery: `toLower(node.${field}) = toLower($${filterVariablePath})`,
                parameters: { [filterVariableName]: filter },
            };
        case 'notEqual':
            return {
                cypherQuery: `toLower(node.${field}) <> toLower($${filterVariablePath})`,
                parameters: { [filterVariableName]: filter },
            };
        case 'contains':
            return {
                cypherQuery: `toLower(node.${field}) CONTAINS toLower($${filterVariablePath})`,
                parameters: { [filterVariableName]: filter },
            };
        case 'notContains':
            return {
                cypherQuery: `NOT node.${field} CONTAINS $${filterVariablePath}`,
                parameters: { [filterVariableName]: filter },
            };
        case 'startsWith':
            return {
                cypherQuery: `toLower(node.${field}) STARTS WITH toLower($${filterVariablePath})`,
                parameters: { [filterVariableName]: filter },
            };
        case 'endsWith':
            return {
                cypherQuery: `toLower(node.${field}) ENDS WITH toLower($${filterVariablePath})`,
                parameters: { [filterVariableName]: filter },
            };
        case 'blank':
            return { cypherQuery: `node.${field} IS NULL`, parameters: {} };
        case 'notBlank':
            return { cypherQuery: `node.${field} IS NOT NULL`, parameters: {} };
        default:
            throw new Error('Invalid supported ag-grid filter type method');
    }
};

export const numberFilterToQuery = (
    field: string,
    { type, filter, filterTo }: IAGGidNumberFilter,
    parametersParentVariableName: string,
): CypherQueryWithParameters => {
    const filterVariableName = `${field}_filter`;
    const filterVariablePath = `${parametersParentVariableName}.${filterVariableName}`;

    switch (type) {
        case 'equals':
            return { cypherQuery: `node.${field} = $${filterVariablePath}`, parameters: { [filterVariableName]: filter } };
        case 'notEqual':
            return { cypherQuery: `node.${field} <> $${filterVariablePath}`, parameters: { [filterVariableName]: filter } };
        case 'lessThan':
            return { cypherQuery: `node.${field} < $${filterVariablePath}`, parameters: { [filterVariableName]: filter } };
        case 'lessThanOrEqual':
            return { cypherQuery: `node.${field} <= $${filterVariablePath}`, parameters: { [filterVariableName]: filter } };
        case 'greaterThan':
            return { cypherQuery: `node.${field} > $${filterVariablePath}`, parameters: { [filterVariableName]: filter } };
        case 'greaterThanOrEqual':
            return { cypherQuery: `node.${field} >= $${filterVariablePath}`, parameters: { [filterVariableName]: filter } };
        case 'inRange': {
            assert(filterTo, 'inRange must have filter & filterTo');
            const filterToVariableName = `${field}_filterTo`;
            const filterToVariablePath = `${parametersParentVariableName}.${filterToVariableName}`;

            return {
                cypherQuery: `$${filterVariablePath} <= node.${field} <= $${filterToVariablePath}`,
                parameters: { [filterVariableName]: filter, [filterToVariableName]: filterTo },
            };
        }
        case 'blank':
            return { cypherQuery: `node.${field} IS NULL`, parameters: {} };
        case 'notBlank':
            return { cypherQuery: `node.${field} IS NOT NULL`, parameters: {} };
        default:
            throw new Error('Invalid supported ag-grid filter type method');
    }
};

export const dateFilterToQuery = (
    field: string,
    { type, dateFrom: dateFromString, dateTo: dateToString }: IAGGridDateFilter,
    parametersParentVariableName: string,
): CypherQueryWithParameters => {
    if (!dateFromString) {
        switch (type) {
            case 'blank':
                return { cypherQuery: `node.${field} IS NULL`, parameters: {} };
            case 'notBlank':
                return { cypherQuery: `node.${field} IS NOT NULL`, parameters: {} };
            default:
                throw new Error('Invalid supported ag-grid filter type method');
        }
    }

    const dateFrom = formatDate(dateFromString);
    const dateFromVariableName = `${field}_dateFrom`;
    const dateFromVariablePath = `${parametersParentVariableName}.${dateFromVariableName}`;

    switch (type) {
        case 'equals':
            return { cypherQuery: `date(node.${field}) = date($${dateFromVariablePath})`, parameters: { [dateFromVariableName]: dateFrom } };
        case 'notEqual':
            return { cypherQuery: `date(node.${field}) <> date($${dateFromVariablePath})`, parameters: { [dateFromVariableName]: dateFrom } };
        case 'lessThan':
            return { cypherQuery: `date(node.${field}) < date($${dateFromVariablePath})`, parameters: { [dateFromVariableName]: dateFrom } };
        case 'lessThanOrEqual':
            return { cypherQuery: `date(node.${field}) <= date($${dateFromVariablePath})`, parameters: { [dateFromVariableName]: dateFrom } };
        case 'greaterThan':
            return { cypherQuery: `date(node.${field}) > date($${dateFromVariablePath})`, parameters: { [dateFromVariableName]: dateFrom } };
        case 'greaterThanOrEqual':
            return { cypherQuery: `date(node.${field}) >= date($${dateFromVariablePath})`, parameters: { [dateFromVariableName]: dateFrom } };
        case 'inRange': {
            assert(dateToString, 'inRange must have dateFrom & dateTo');

            const dateTo = formatDate(dateToString);
            const dateToVariableName = `${field}_dateTo`;
            const dateToVariablePath = `${parametersParentVariableName}.${dateToVariableName}`;

            return {
                cypherQuery: `date($${dateFromVariablePath}) <= date(node.${field}) <= date($${dateToVariablePath})`,
                parameters: { [dateFromVariableName]: dateFrom, [dateToVariableName]: dateTo },
            };
        }
        default:
            throw new Error('Invalid supported ag-grid filter type method');
    }
};

// filterModel with parameters to escape quotes and such, and to prevent injections by user input
// see https://neo4j.com/developer/kb/protecting-against-cypher-injection
export const filterModelToQuery = (filterModel: IAGGridFilterModel, parametersParentVariableName: string): CypherQueryWithParameters => {
    const queries = Object.keys(filterModel).map((field) => {
        const fieldFilter = filterModel[field];

        switch (fieldFilter.filterType) {
            case 'text':
                return textFilterToQuery(field, fieldFilter, parametersParentVariableName);
            case 'number':
                return numberFilterToQuery(field, fieldFilter, parametersParentVariableName);
            case 'date':
                return dateFilterToQuery(field, fieldFilter, parametersParentVariableName);
            case 'set':
                return setFilterToQuery(field, fieldFilter, parametersParentVariableName);
            default:
                throw new Error('Invalid supported ag-grid filter type');
        }
    });
    return {
        cypherQuery: queries.map(({ cypherQuery }) => cypherQuery).join(' AND '),
        parameters: queries
            .map(({ parameters }) => parameters)
            .reduce((prevParameters, currParameters) => ({ ...prevParameters, ...currParameters }), {}),
    };
};

export const sortModelToNeo4JSort = (sortModel: IAGGridSort[]) => {
    const sortOptions = sortModel.map(({ colId, sort }) => `node.${colId} ${sort}`);

    return sortOptions.join(',');
};

const constructFilterQuery = (
    templateIds: string[],
    filterModel: IAGGridFilterModel,
    parametersParentVariableName: string,
): CypherQueryWithParameters => {
    const filterModelQuery = filterModelToQuery(filterModel, parametersParentVariableName);
    const filterTemplateIds = templateIds.map((templateId) => `node:\`${templateId}\``).join(' OR ');

    const doesBothFiltersPartsExist = templateIds.length > 0 && Object.keys(filterModel).length;

    return {
        cypherQuery: `WHERE ${filterTemplateIds}${doesBothFiltersPartsExist ? ' AND ' : ''}${filterModelQuery.cypherQuery}`,
        parameters: filterModelQuery.parameters,
    };
};

export const escapeRegExp = (text: string) => {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

const escapeNeo4jQuerySpecialChars = (quickFilter: string) => {
    const escapeNeo4jQueryRegexStr = specialCharsToEscapeNeo4jQuery
        .map(escapeRegExp)
        .map((char) => `(${char})`)
        .join('|');

    return quickFilter.replace(new RegExp(escapeNeo4jQueryRegexStr, 'g'), '\\$&');
};

export const agGridSearchRequestToNeo4JRequest = (
    templateIds: string[],
    latestIndex: string,
    agGridRequest: IAGGridRequest,
    calculateOverallCount = false,
): CypherQueryWithParameters => {
    const filterParamsVariableName = 'filterParams';
    const filterQuery = constructFilterQuery(templateIds, agGridRequest.filterModel, 'filterParams');

    // warning, in fulltext (lucene) query '*' works only on terms, and not phrases, we assume here the analyzer is "unicode_whitespace".
    // for example in the standard analyzer "foo,bar" is a phrase (with two terms), so searching "*foo,bar*" wont work at all.
    // but with "unicode_whitespace" analyzer, adding '*' at start and end, will always search on terms and not phrases,
    // because in whitespace analyzer "foo,bar" is one term, so '*' will work on it,
    // and searching "*foo bar*" will also work, because it will search "*foo" and "bar*" separately
    // read also this to understand: https://stackoverflow.com/questions/25450308/full-text-search-in-neo4j-with-spaces
    const query = `*${escapeNeo4jQuerySpecialChars(agGridRequest.quickFilter!)}*`;

    if (calculateOverallCount) {
        return {
            cypherQuery: `
                CALL db.index.fulltext.queryNodes($latestIndex, $query)
                YIELD node
                ${filterQuery.cypherQuery}
                RETURN count(node)`,
            parameters: { latestIndex, query, [filterParamsVariableName]: filterQuery.parameters },
        };
    }

    const sortQueryOfUser = agGridRequest.sortModel.length ? `${sortModelToNeo4JSort(agGridRequest.sortModel)},` : '';
    // sort by scoring, but only as the lowest priority, to not override user defined sorts
    const defaultSortQuery = 'score DESC';
    const sortQuery = `ORDER BY ${sortQueryOfUser} ${defaultSortQuery}`;

    return {
        cypherQuery: `
            CALL db.index.fulltext.queryNodes($latestIndex, $query)
            YIELD node, score
            ${filterQuery.cypherQuery}
            RETURN node, score
            ${sortQuery}
            SKIP toInteger($skip)
            LIMIT toInteger($limit)`,
        parameters: {
            latestIndex,
            query,
            skip: agGridRequest.startRow,
            limit: agGridRequest.endRow - agGridRequest.startRow + 1,
            [filterParamsVariableName]: filterQuery.parameters,
        },
    };
};

export const agGridRequestToNeo4JRequest = (
    templateIds: string[],
    agGridRequest: IAGGridRequest,
    calculateOverallCount = false,
): CypherQueryWithParameters => {
    const filterParamsVariableName = 'filterParams';
    const filterQuery = constructFilterQuery(templateIds, agGridRequest.filterModel, filterParamsVariableName);

    if (calculateOverallCount) {
        return {
            cypherQuery: `
                MATCH (node) 
                ${filterQuery.cypherQuery}
                RETURN count(node)`,
            parameters: { [filterParamsVariableName]: filterQuery.parameters },
        };
    }

    const sortModel = [...agGridRequest.sortModel];
    if (sortModel.every(({ colId }) => colId !== 'updatedAt')) {
        // if user not specified, by default sort by updatedAt,
        // but only as the lowest priority (end of array in sortModel), to not override user defined sorts
        sortModel.push({ colId: 'updatedAt', sort: 'desc' });
    }

    const sortQuery = `ORDER BY ${sortModelToNeo4JSort(sortModel)}`;

    return {
        cypherQuery: `
            MATCH (node) 
            ${filterQuery.cypherQuery}
            RETURN node 
            ${sortQuery}
            SKIP toInteger($skip)
            LIMIT toInteger($limit)`,
        parameters: {
            skip: agGridRequest.startRow,
            limit: agGridRequest.endRow - agGridRequest.startRow + 1,
            [filterParamsVariableName]: filterQuery.parameters,
        },
    };
};
