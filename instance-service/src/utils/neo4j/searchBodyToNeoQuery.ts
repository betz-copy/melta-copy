import mapValues from 'lodash.mapvalues';
import { Date as Neo4jDate, DateTime as Neo4jDateTime } from 'neo4j-driver';
import {
    IMongoEntityTemplate,
    IEntitySingleProperty,
    ISearchBatchBody,
    IFilterOfField,
    IFilterGroup,
    FilterLogicalOperator,
    IFilterOfTemplate,
} from '@microservices/shared';
import { getNeo4jDate, getNeo4jDateTime } from './lib';
import config from '../../config';
import addDefaultFieldsToTemplate from '../addDefaultsFieldsToEntityTemplate';

const {
    neo4j: { specialCharsToEscapeNeo4jQuery },
} = config;

export const escapeRegExp = (text: string) => {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

export const escapeNeo4jQuerySpecialChars = (quickFilter: string) => {
    const escapeNeo4jQueryRegexStr = specialCharsToEscapeNeo4jQuery.map((char) => `(${escapeRegExp(char)})`).join('|');

    return quickFilter.replace(new RegExp(escapeNeo4jQueryRegexStr, 'g'), '\\$&');
};

export type CypherQueryWithParameters = { cypherQuery: string; parameters: Record<string, any> };

const simplePartFilterOfFieldToNeoQuery = (
    field: string,
    operator: Exclude<keyof IFilterOfField, '$eqi' | '$in'>,
    rhs: boolean | string | number | null,
    parametersParentVariableName: string,
    fieldTemplate: IEntitySingleProperty,
): CypherQueryWithParameters => {
    if (rhs === null && operator === '$eq') {
        return { cypherQuery: `node.${field} IS NULL`, parameters: {} };
    }
    if (rhs === null && operator === '$ne') {
        return { cypherQuery: `node.${field} IS NOT NULL`, parameters: {} };
    }

    const rhsParamName = 'rhs';
    const rhsParamPath = `${parametersParentVariableName}.${rhsParamName}`;

    let rhsParamValue: boolean | string | number | Neo4jDate<number> | Neo4jDateTime<number> | null;
    if (rhs && fieldTemplate.format === 'date') {
        rhsParamValue = getNeo4jDate(new Date(rhs as string));
    } else if (rhs && fieldTemplate.format === 'date-time') {
        rhsParamValue = getNeo4jDateTime(new Date(rhs as string));
    } else {
        rhsParamValue = rhs;
    }

    let operatorQuery: string;
    switch (operator) {
        case '$eq':
            operatorQuery = '=';
            break;
        case '$ne':
            operatorQuery = '<>';
            break;
        case '$gt':
            operatorQuery = '>';
            break;
        case '$gte':
            operatorQuery = '>=';
            break;
        case '$lt':
            operatorQuery = '<';
            break;
        case '$lte':
            operatorQuery = '<=';
            break;
        default:
            throw new Error(`missing implementation for operator "${operator}" of filter of field`);
    }

    return { cypherQuery: `node.${field} ${operatorQuery} $${rhsParamPath}`, parameters: { [rhsParamName]: rhsParamValue } };
};

const inFilterOfField = (
    field: string,
    rhs: NonNullable<IFilterOfField['$in']>,
    parametersParentVariableName: string,
    fieldTemplate: IEntitySingleProperty,
) => {
    const rhsParamName = 'rhs';
    const rhsParamPath = `${parametersParentVariableName}.${rhsParamName}`;

    const rhsParamValue = rhs.map((rhsItem) => {
        if (!rhsItem) return rhsItem;

        switch (fieldTemplate.format) {
            case 'date':
                return getNeo4jDate(new Date(rhsItem as string));
            case 'date-time':
                return getNeo4jDateTime(new Date(rhsItem as string));
            default:
                return rhsItem;
        }
    });

    if (rhsParamValue.includes(null)) {
        return {
            cypherQuery: `(node.${field} IS NULL) OR (node.${field} IN $${rhsParamPath})`,
            parameters: { [rhsParamName]: rhsParamValue.filter((rhsItem) => rhsItem !== null) },
        };
    }

    return { cypherQuery: `node.${field} IN $${rhsParamPath}`, parameters: { [rhsParamName]: rhsParamValue } };
};

const caseInsensitiveEqualFilterOfField = (field: string, rhs: NonNullable<IFilterOfField['$eqi']>, parametersParentVariableName: string) => {
    const rhsParamName = 'rhs';
    const rhsParamPath = `${parametersParentVariableName}.${rhsParamName}`;

    return { cypherQuery: `toLower(node.${field}) = toLower($${rhsParamPath})`, parameters: { [rhsParamName]: rhs } };
};

const regexFilterOfField = (field: string, rhs: NonNullable<IFilterOfField['$eqi']>, parametersParentVariableName: string) => {
    const rhsParamName = 'rhs';
    const rhsParamPath = `${parametersParentVariableName}.${rhsParamName}`;

    return { cypherQuery: `node.${field} =~ $${rhsParamPath}`, parameters: { [rhsParamName]: rhs } };
};

const notFilterOfField = (
    field: string,
    innerFilterOfField: IFilterOfField,
    parametersParentVariableName: string,
    fieldTemplate: IEntitySingleProperty,
): CypherQueryWithParameters => {
    // eslint-disable-next-line no-use-before-define -- recursive use
    const filterOfFieldQuery = filterOfFieldToNeoQuery(field, innerFilterOfField, parametersParentVariableName, fieldTemplate);

    return { cypherQuery: `NOT (${filterOfFieldQuery.cypherQuery})`, parameters: filterOfFieldQuery.parameters };
};

const simplePartFilterOfArrayFieldToNeoQuery = (
    field: string,
    operator: '$eq' | '$ne',
    rhs: boolean | string | number | null,
    parametersParentVariableName: string,
): CypherQueryWithParameters => {
    if (rhs === null && operator === '$eq') {
        return { cypherQuery: `node.${field} IS NULL`, parameters: {} };
    }
    if (rhs === null && operator === '$ne') {
        return { cypherQuery: `node.${field} IS NOT NULL`, parameters: {} };
    }

    const rhsParamName = 'rhs';
    const rhsParamPath = `${parametersParentVariableName}.${rhsParamName}`;

    return { cypherQuery: `${operator === '$ne' ? 'NOT ' : ''}$${rhsParamPath} IN node.${field}`, parameters: { [rhsParamName]: rhs } };
};

const inFilterOfArrayField = (field: string, rhs: NonNullable<IFilterOfField['$in']>, parametersParentVariableName: string) => {
    const rhsParamName = 'rhs';
    const rhsParamPath = `${parametersParentVariableName}.${rhsParamName}`;

    return { cypherQuery: `size([rhsItem IN $${rhsParamPath} WHERE rhsItem IN node.${field}]) > 0`, parameters: { [rhsParamName]: rhs } };
};

const filterOfFieldToNeoQuery = (
    field: string,
    filterOfField: IFilterOfField,
    parametersParentVariableName: string,
    fieldTemplate: IEntitySingleProperty,
): CypherQueryWithParameters => {
    let filterField = field;

    const queries: CypherQueryWithParameters[] = Object.entries(filterOfField).map(([key, filterRhs]) => {
        const filterType = key as keyof IFilterOfField;

        if (filterType !== '$not') {
            if (fieldTemplate.format === 'relationshipReference') {
                filterField = `\`${field}.properties.${fieldTemplate.relationshipReference!.relatedTemplateField}${
                    config.neo4j.relationshipReferencePropertySuffix
                }\``;
            }

            if (fieldTemplate.format === 'user') {
                filterField = `\`${field}.fullName_userField\``;
            }

            if (fieldTemplate.type === 'array' && fieldTemplate.items?.format === 'user') {
                filterField = `\`${field}.fullNames_usersFields\``;
            }
        }

        let partFilterOfFieldQuery: CypherQueryWithParameters;
        switch (filterType) {
            case '$eq':
            case '$ne':
            case '$gt':
            case '$gte':
            case '$lt':
            case '$lte':
                if (fieldTemplate.type !== 'array') {
                    partFilterOfFieldQuery = simplePartFilterOfFieldToNeoQuery(
                        filterField,
                        filterType,
                        filterRhs,
                        `${parametersParentVariableName}.\`${filterType}\``,
                        fieldTemplate,
                    );
                    break;
                }
                partFilterOfFieldQuery = simplePartFilterOfArrayFieldToNeoQuery(
                    filterField,
                    filterType as '$eq' | '$ne',
                    filterRhs,
                    `${parametersParentVariableName}.\`${filterType}\``,
                );
                break;

            case '$eqi':
                partFilterOfFieldQuery = caseInsensitiveEqualFilterOfField(filterField, filterRhs, `${parametersParentVariableName}.\`$eqi\``);
                break;

            case '$rgx':
                partFilterOfFieldQuery = regexFilterOfField(filterField, filterRhs, `${parametersParentVariableName}.\`$rgx\``);
                break;

            case '$in':
                if (fieldTemplate.type !== 'array') {
                    partFilterOfFieldQuery = inFilterOfField(filterField, filterRhs, `${parametersParentVariableName}.\`$in\``, fieldTemplate);
                    break;
                }
                partFilterOfFieldQuery = inFilterOfArrayField(filterField, filterRhs, `${parametersParentVariableName}.\`$in\``);
                break;

            case '$not':
                partFilterOfFieldQuery = notFilterOfField(filterField, filterRhs, `${parametersParentVariableName}.\`$not\``, fieldTemplate);
                break;

            default:
                throw new Error(`missing implementation for filter type "${filterType}" of filter of field`);
        }

        if (fieldTemplate.format === 'user') {
            const userIdFilterString = simplePartFilterOfFieldToNeoQuery(
                `\`${field}.id_userField\``,
                filterType as '$eq' | '$ne' | '$rgx' | '$gt' | '$gte' | '$lt' | '$lte' | '$not',
                filterRhs,
                `${parametersParentVariableName}.\`${filterType}\``,
                fieldTemplate,
            );

            partFilterOfFieldQuery.cypherQuery = `(${partFilterOfFieldQuery.cypherQuery}) OR (${userIdFilterString.cypherQuery})`;
        }

        return { cypherQuery: partFilterOfFieldQuery.cypherQuery, parameters: { [filterType]: partFilterOfFieldQuery.parameters } };
    });

    return {
        cypherQuery: queries.map((query) => `(${query.cypherQuery})`).join(' AND '),
        parameters: queries
            .map(({ parameters }) => parameters)
            .reduce((prevParameters, currParameters) => ({ ...prevParameters, ...currParameters }), {}),
    };
};

const filterOfTemplateToNeoQuery = (
    filterOfTemplate: IFilterGroup,
    parametersParentVariableName: string,
    entityTemplate: IMongoEntityTemplate,
): CypherQueryWithParameters => {
    const fieldsNeoQueries: CypherQueryWithParameters[] = Object.entries(filterOfTemplate)
        .filter(([_field, filterOfField]) => Boolean(filterOfField))
        .map(([filterKey, filterOfField]) => {
            if (filterKey === FilterLogicalOperator.AND || filterKey === FilterLogicalOperator.OR) {
                // eslint-disable-next-line no-use-before-define
                return filterLogicalOperatorsToNeoQuery(filterKey, filterOfField, parametersParentVariableName, entityTemplate);
            }

            const filterOfFieldQuery = filterOfFieldToNeoQuery(
                filterKey,
                filterOfField!,
                `${parametersParentVariableName}.${filterKey}`,
                entityTemplate.properties.properties[filterKey],
            );
            return {
                cypherQuery: filterOfFieldQuery.cypherQuery,
                parameters: { [filterKey]: filterOfFieldQuery.parameters },
            };
        });

    return {
        cypherQuery: fieldsNeoQueries.map((fieldNeoQuery) => `(${fieldNeoQuery.cypherQuery})`).join(' AND '),
        parameters: fieldsNeoQueries
            .map(({ parameters }) => parameters)
            .reduce((prevParameters, currParameters) => ({ ...prevParameters, ...currParameters }), {}),
    };
};

const filterLogicalOperatorsToNeoQuery = (
    field: FilterLogicalOperator,
    filterOfField: IFilterOfTemplate | IFilterGroup[],
    parametersParentVariableName: string,
    entityTemplate: IMongoEntityTemplate,
) => {
    if (Array.isArray(filterOfField)) {
        const queries = filterOfField.map((currFilterOfTemplate, i) =>
            filterOfTemplateToNeoQuery(currFilterOfTemplate, `${parametersParentVariableName}.\`${field}\`[${i}]`, entityTemplate),
        );

        const logicalOperator = field === FilterLogicalOperator.AND ? ' AND ' : ' OR ';

        return {
            cypherQuery: queries.map(({ cypherQuery }) => `(${cypherQuery})`).join(logicalOperator),
            parameters: {
                [field]: queries.map(({ parameters }) => parameters),
            },
        };
    }

    const andSingleQuery = filterOfTemplateToNeoQuery(filterOfField, `${parametersParentVariableName}.\`$and\``, entityTemplate);
    return {
        cypherQuery: andSingleQuery.cypherQuery,
        parameters: { $and: andSingleQuery.parameters },
    };
};

export const templatesFilterToNeoQuery = (
    templatesFilter: ISearchBatchBody['templates'],
    entityTemplatesMap: Map<string, IMongoEntityTemplate>,
): CypherQueryWithParameters => {
    const filterParamsVariableName = 'filterParams';

    const templatesFiltersQueries: CypherQueryWithParameters[] = Object.entries(templatesFilter).map(([templateId, { filter }]) => {
        if (!filter) {
            return { cypherQuery: `node:\`${templateId}\``, parameters: {} };
        }

        const field = filter?.$and ? FilterLogicalOperator.AND : FilterLogicalOperator.OR;

        const filterOfTemplateQuery = filterLogicalOperatorsToNeoQuery(
            field,
            filter[field]!,
            `${filterParamsVariableName}["${templateId}"]`,
            addDefaultFieldsToTemplate(entityTemplatesMap.get(templateId)!),
        );

        if (!filterOfTemplateQuery.cypherQuery) {
            return { cypherQuery: `node:\`${templateId}\``, parameters: {} };
        }

        return {
            cypherQuery: `node:\`${templateId}\` AND (${filterOfTemplateQuery.cypherQuery})`,
            parameters: { [templateId]: filterOfTemplateQuery.parameters },
        };
    });

    return {
        cypherQuery: templatesFiltersQueries.map(({ cypherQuery }) => `(${cypherQuery})`).join(' OR '),
        parameters: {
            [filterParamsVariableName]: templatesFiltersQueries
                .map(({ parameters }) => parameters)
                .reduce((prevParameters, currParameters) => ({ ...prevParameters, ...currParameters }), {}),
        },
    };
};

export const sortToNeo4JSort = (sortModel: ISearchBatchBody['sort']) => {
    return sortModel.map(({ field, sort }) => `node.${field} ${sort}`).join(',');
};

const buildFulltextSearchQuery = (
    searchBody: ISearchBatchBody,
    filterQuery: { cypherQuery: string; parameters: any },
    indexHandling: string,
    parameters: any,
    calculateOverallCount: boolean,
    entityIdsToInclude?: string[],
    entityIdsToExclude?: string[],
    userEntityId?: string,
) => {
    const query = `*${escapeNeo4jQuerySpecialChars(searchBody.textSearch || '')}*`;
    const entityIdMatch = entityIdsToInclude?.length
        ? `
        UNION
        MATCH (node)
        WHERE node._id IN $entityIdsToInclude
        RETURN node
    `
        : '';

    const entityIdExclude = entityIdsToExclude?.length
        ? `
        WITH node
        WHERE NOT node._id IN $entityIdsToExclude
        `
        : '';

    const userEntityIdMatch = userEntityId
        ? `
        MATCH (node)-[relationship]-(otherEntity)
        WHERE otherEntity._id = $userEntityId
        `
        : '';

    if (calculateOverallCount) {
        return {
            cypherQuery: `
                CALL() {
                    ${indexHandling}
                    YIELD node, score
                    WHERE ${filterQuery.cypherQuery}
                    RETURN node
                    ${entityIdMatch}
                }
                ${entityIdExclude}
                ${userEntityIdMatch} 
                RETURN count(node)
            `,
            parameters: {
                query,
                ...parameters,
                ...filterQuery.parameters,
                ...(entityIdsToInclude?.length && { entityIdsToInclude }),
                ...(entityIdsToExclude?.length && { entityIdsToExclude }),
                ...(userEntityId && { userEntityId }),
            },
        };
    }

    const sortQueryOfUser = searchBody.sort && searchBody.sort.length > 0 ? sortToNeo4JSort(searchBody.sort) : '';
    const defaultSortQuery = 'node.createdAt DESC';
    const sortQuery = `ORDER BY ${sortQueryOfUser ? `${sortQueryOfUser}, ` : ''}${defaultSortQuery}`;

    return {
        cypherQuery: `
            CALL () {
                ${indexHandling}
                YIELD node, score
                WHERE ${filterQuery.cypherQuery}
                RETURN node
                ${entityIdMatch}
            }
            ${entityIdExclude}
            RETURN node
            ${sortQuery}
            SKIP toInteger($skip)
            LIMIT toInteger($limit)
        `,
        parameters: {
            query,
            skip: searchBody.skip,
            limit: searchBody.limit,
            ...parameters,
            ...filterQuery.parameters,
            ...(entityIdsToInclude?.length && { entityIdsToInclude }),
            ...(entityIdsToExclude?.length && { entityIdsToExclude }),
        },
    };
};

// TODO clean code
const fulltextSearchToNeoQuery = (
    searchBody: ISearchBatchBody,
    entityTemplatesMap: Map<string, IMongoEntityTemplate>,
    prefixIndexName: string,
    entityIdsToInclude?: string[],
    entityIdsToExclude?: string[],
    userEntityId?: string,
    calculateOverallCount = false,
) => {
    const filterQuery = templatesFilterToNeoQuery(searchBody.templates, entityTemplatesMap);

    let latestIndex: string = prefixIndexName;
    if (entityTemplatesMap.size === 1) latestIndex = `${config.neo4j.templateSearchIndexPrefix}${entityTemplatesMap.keys().next().value}`;

    const indexHandling = `CALL db.index.fulltext.queryNodes($latestIndex, $query)`;

    const parameters = {
        latestIndex,
    };

    return buildFulltextSearchQuery(
        searchBody,
        filterQuery,
        indexHandling,
        parameters,
        calculateOverallCount,
        entityIdsToInclude,
        entityIdsToExclude,
        userEntityId,
    );
};

const fulltextBatchSearchToNeoQuery = (
    searchBody: ISearchBatchBody,
    entityTemplatesMap: Map<string, IMongoEntityTemplate>,
    entityIdsToInclude?: string[],
    entityIdsToExclude?: string[],
    calculateOverallCount = false,
    globalSearchIndexes: string[] = [],
) => {
    const filterQuery = templatesFilterToNeoQuery(searchBody.templates, entityTemplatesMap);

    const indexHandling = `
        WITH $indexNames AS indexNames
        UNWIND indexNames AS indexName
        CALL db.index.fulltext.queryNodes(indexName, $query)
    `;

    const parameters = {
        indexNames: globalSearchIndexes,
    };

    return buildFulltextSearchQuery(
        searchBody,
        filterQuery,
        indexHandling,
        parameters,
        calculateOverallCount,
        entityIdsToInclude,
        entityIdsToExclude,
    );
};

const searchToNeoQuery = (
    searchBody: ISearchBatchBody,
    entityTemplatesMap: Map<string, IMongoEntityTemplate>,
    entityIdsToInclude?: string[],
    entityIdsToExclude?: string[],
    userEntityId?: string,
    calculateOverallCount = false,
    globalSearchIndexes: string[] = [],
): CypherQueryWithParameters => {
    if (globalSearchIndexes.length === 0)
        return fulltextSearchToNeoQuery(
            searchBody,
            entityTemplatesMap,
            config.neo4j.templateSearchIndexPrefix,
            entityIdsToInclude,
            entityIdsToExclude,
            userEntityId,
            calculateOverallCount,
        );
    if (globalSearchIndexes.length === 1)
        return fulltextSearchToNeoQuery(
            searchBody,
            entityTemplatesMap,
            config.neo4j.globalSearchIndexPrefix,
            entityIdsToInclude,
            entityIdsToExclude,
            userEntityId,
            calculateOverallCount,
        );
    return fulltextBatchSearchToNeoQuery(
        searchBody,
        entityTemplatesMap,
        entityIdsToInclude,
        entityIdsToExclude,
        calculateOverallCount,
        globalSearchIndexes,
    );
};

export const searchWithRelationshipsToNeoQuery = (
    searchBody: ISearchBatchBody,
    entityTemplatesMap: Map<string, IMongoEntityTemplate>,
    calculateOverallCount = false,
    globalSearchIndexes: string[] = [],
): CypherQueryWithParameters => {
    const { entityIdsToInclude, entityIdsToExclude, userEntityId, ...restOfSearchBody } = searchBody;

    if (calculateOverallCount) {
        return searchToNeoQuery(
            restOfSearchBody,
            entityTemplatesMap,
            entityIdsToInclude,
            entityIdsToExclude,
            userEntityId,
            true,
            globalSearchIndexes,
        );
    }

    const searchNeoQuery = searchToNeoQuery(
        restOfSearchBody,
        entityTemplatesMap,
        entityIdsToInclude,
        entityIdsToExclude,
        userEntityId,
        false,
        globalSearchIndexes,
    );

    const showRelationshipsPerTemplate = mapValues(restOfSearchBody.templates, ({ showRelationships }) => ({
        shouldShowRelationships: Boolean(showRelationships),
        relationshipTemplateIds: typeof showRelationships === 'boolean' ? [] : showRelationships,
    }));

    return {
        cypherQuery: `
        CALL {
            ${searchNeoQuery.cypherQuery}
        }
        
        WITH node, $showRelationshipsPerTemplate[labels(node)[0]] as showRelationships
        WITH node, showRelationships.shouldShowRelationships as shouldShowRelationships, showRelationships.relationshipTemplateIds as relationshipTemplateIds
        
        OPTIONAL MATCH (node)-[relationship]-(otherEntity)
        
        WHERE ${userEntityId ? `otherEntity._id = $userEntityId OR` : ''} shouldShowRelationships AND (size(relationshipTemplateIds) = 0 OR type(relationship) IN relationshipTemplateIds)

        WITH node, otherEntity, shouldShowRelationships, collect(relationship) AS relationships, collect(otherEntity) AS otherEntities
        WITH node, otherEntity, relationships, otherEntities, CASE
        WHEN NOT shouldShowRelationships THEN NULL
        WHEN size(relationships) = 0 then []
        ${userEntityId ? `WHEN otherEntity._id = $userEntityId THEN relationships` : ''} 
        ELSE [i IN range(0, size(relationships) - 1) | {relationship: relationships[i], otherEntity: otherEntities[i]}]
        END as relationshipsList
        RETURN node, relationshipsList AS relationships
        `,
        parameters: {
            ...searchNeoQuery.parameters,
            showRelationshipsPerTemplate,
            ...(userEntityId && { userEntityId }),
        },
    };
};
