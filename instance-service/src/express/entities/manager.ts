/* eslint-disable class-methods-use-this */
/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
import differenceWith from 'lodash.differencewith';
import groupBy from 'lodash.groupby';
import mapValues from 'lodash.mapvalues';
import pickBy from 'lodash.pickby';
import { Neo4jError, Transaction } from 'neo4j-driver';
import config from '../../config';
import { ActionsLog, IActivityLog, IUpdatedFields } from '../../externalServices/activityLog/interface';
import { ActivityLogProducer } from '../../externalServices/activityLog/producer';
import { EntityTemplateManagerService } from '../../externalServices/templates/entityTemplateManager';
import { IEntitySingleProperty, IMongoEntityTemplate, IRelationshipReference } from '../../externalServices/templates/interfaces/entityTemplates';
import { IMongoRule } from '../../externalServices/templates/interfaces/rules';
import { RelationshipsTemplateManagerService } from '../../externalServices/templates/relationshipTemplateManager';
import { arraysEqualsNonOrdered } from '../../utils/lib';
import { expandEntityToNeoQuery, getExpandedFilteredGraphRecursively } from '../../utils/neo4j/getExpandedEntityByIdRecursive';
import {
    generateDefaultProperties,
    getNeo4jDateTime,
    normalizeGetDbConstraints,
    normalizeNeighboursOfEntityForRule,
    normalizeResponseCount,
    normalizeResponseTemplatesCount,
    normalizeReturnedEntity,
    normalizeReturnedRelAndEntities,
    normalizeSearchWithRelationships,
    runInTransactionAndNormalize,
} from '../../utils/neo4j/lib';
import DefaultManagerNeo4j from '../../utils/neo4j/manager';
import { escapeNeo4jQuerySpecialChars, searchWithRelationshipsToNeoQuery } from '../../utils/neo4j/searchBodyToNeoQuery';
import { NotFoundError, ServiceError } from '../error';
import { IRelationship } from '../relationships/interfaces';
import { RelationshipManager } from '../relationships/manager';
import { filterDependentRulesOnEntity, filterDependentRulesViaAggregation } from '../rules/getParametersOfFormula';
import { IBrokenRule, IRuleFailure } from '../rules/interfaces';
import { runRulesOnEntity } from '../rules/runRulesOnEntity';
import { throwIfActionCausedRuleFailures } from '../rules/throwIfActionCausedRuleFailures';
import {
    EntitiesIdsRulesReasonsMap,
    IConstraint,
    IConstraintsOfTemplate,
    IEntity,
    IEntityWithDirectRelationships,
    IGetExpandedEntityBody,
    IRequiredConstraint,
    ISearchBatchBody,
    ISearchEntitiesByTemplatesBody,
    ISearchEntitiesOfTemplateBody,
    IUniqueConstraint,
    IUniqueConstraintOfTemplate,
    RunRuleReason,
} from './interface';
import { addStringFieldsAndNormalizeDateValues } from './validator.template';

export class EntityManager extends DefaultManagerNeo4j {
    private entityTemplateManagerService: EntityTemplateManagerService;

    private relationshipsTemplateManagerService: RelationshipsTemplateManagerService;

    private relationshipManager: RelationshipManager;

    private activityLogProducer: ActivityLogProducer;

    constructor(workspaceId: string) {
        super(workspaceId);
        this.entityTemplateManagerService = new EntityTemplateManagerService(workspaceId);
        this.relationshipsTemplateManagerService = new RelationshipsTemplateManagerService(workspaceId);
        this.relationshipManager = new RelationshipManager(workspaceId);
        this.activityLogProducer = new ActivityLogProducer(workspaceId);
    }

    private getRelevantRulesOfEntities = (
        entitiesIdsRulesReasonsMapBeforeRunActions: EntitiesIdsRulesReasonsMap,
        rulesByEntityTemplateIds: Record<string, IMongoRule[]>,
    ) => {
        // sort relevant rules by each entity
        // entityId -> rules[], entityTemplateId
        const entitiesRelevantRulesMap = new Map<
            string,
            {
                rules: IMongoRule[];
                entityTemplateId: string;
            }
        >();

        entitiesIdsRulesReasonsMapBeforeRunActions.forEach(({ reasons, entityTemplateId }, entityId) => {
            const relevantRules: IMongoRule[] = [];
            const rulesIds: Set<string> = new Set<string>();

            reasons.forEach((reason) => {
                if (reason.type === RunRuleReason.dependentOnEntity) {
                    relevantRules.push(
                        ...filterDependentRulesOnEntity(rulesByEntityTemplateIds[entityTemplateId] || [], entityTemplateId).filter(
                            (rule) => !rulesIds.has(rule._id),
                        ),
                    );
                    relevantRules.forEach((rule) => rulesIds.add(rule._id));
                } else if (reason.type === RunRuleReason.dependentViaAggregation) {
                    relevantRules.push(
                        ...filterDependentRulesViaAggregation(
                            rulesByEntityTemplateIds[entityTemplateId] || [],
                            reason.dependentRelationshipTemplateId,
                            reason.updatedProperties,
                        ).filter((rule) => !rulesIds.has(rule._id)),
                    );
                    relevantRules.forEach((rule) => rulesIds.add(rule._id));
                }
            });

            entitiesRelevantRulesMap.set(entityId, { rules: relevantRules, entityTemplateId });
        });

        return entitiesRelevantRulesMap;
    };

    async runRulesOnEntitiesWithRuleReasons(
        transaction: Transaction,
        entitiesIdsRulesReasonsMap: EntitiesIdsRulesReasonsMap,
        rulesByEntityTemplateIds: Record<string, IMongoRule[]>,
    ) {
        const entitiesRelevantRulesMap = this.getRelevantRulesOfEntities(entitiesIdsRulesReasonsMap, rulesByEntityTemplateIds);

        const ruleFailuresPromises: Promise<IRuleFailure[]>[] = [];
        entitiesRelevantRulesMap.forEach(({ rules }, entityId) => {
            ruleFailuresPromises.push(runRulesOnEntity(transaction, entityId, rules));
        });

        return (await Promise.all(ruleFailuresPromises)).flat();
    }

    runRulesOnEntityDependentViaAggregation = async (
        transaction: Transaction,
        entityId: string,
        entityTemplateId: string,
        dependentRelationshipTemplateId: string,
        updatedProperties?: string[],
    ): Promise<IRuleFailure[]> => {
        const rulesOfEntity = await this.relationshipsTemplateManagerService.searchRules({
            entityTemplateIds: [entityTemplateId],
        });

        const relevantRules = filterDependentRulesViaAggregation(rulesOfEntity, dependentRelationshipTemplateId, updatedProperties);

        return runRulesOnEntity(transaction, entityId, relevantRules);
    };

    private throwServiceErrorIfFailedConstraintsValidation(err: unknown): never {
        if (!(err instanceof Neo4jError) || err.code !== 'Neo.ClientError.Schema.ConstraintValidationFailed') {
            throw err;
        }

        const { message: neo4jMessage } = err;

        if (neo4jMessage.includes('must have the property')) {
            // neo4jMessage = Node(...) with label `someLabel...` must have the property `property1`
            const variableMatchesInMessage = neo4jMessage.matchAll(/`(.*?)`/g)!;
            const [label, property] = Array.from(variableMatchesInMessage).map((match) => match[1]);
            const fixedProperty = property.endsWith(config.neo4j.relationshipReferencePropertySuffix) ? property.split('.')[0] : property;

            const requiredConstraint: Omit<IRequiredConstraint, 'constraintName'> = {
                type: 'REQUIRED',
                templateId: label,
                property: fixedProperty,
            };
            throw new ServiceError(400, `[NEO4J] instance is missing required property`, {
                errorCode: config.errorCodes.failedConstraintsValidation,
                constraint: requiredConstraint,
                neo4jMessage,
            });
        } else if (neo4jMessage.includes('already exists with') || neo4jMessage.includes('uniqueConstraint')) {
            let label = '';
            let properties: any[] = [];
            if (neo4jMessage.includes('already exists with')) {
                // neo4jMessage = Node(...) already exists with label `someLabel...` and properties `property1` = ..., `property2` = ...
                // support unique w/ multiple props
                const variableMatchesInMessage = neo4jMessage.matchAll(/`(.*?)`/g)!;
                [label, ...properties] = Array.from(variableMatchesInMessage).map((match) => match[1]);
                properties = properties.map((property) =>
                    property.endsWith(config.neo4j.relationshipReferencePropertySuffix) ? property.split('.')[0] : property,
                );
            } else {
                label = neo4jMessage.substr(neo4jMessage.indexOf(':') + 1, 24);
                const keys = neo4jMessage.substring(neo4jMessage.indexOf('{') + 1, neo4jMessage.indexOf('}'));
                properties = keys.split(',').map((key) => key.trim());
            }

            const uniqueConstraint: Omit<IUniqueConstraint, 'constraintName'> = {
                type: 'UNIQUE',
                templateId: label,
                uniqueGroupName: '',
                properties,
            };

            throw new ServiceError(400, `[NEO4J] instance has duplicates on unique properties`, {
                errorCode: config.errorCodes.failedConstraintsValidation,
                constraint: uniqueConstraint,
                neo4jMessage,
            });
        } else {
            // unsupported constraint validation error. possibly neo4j broke expected message
            throw err;
        }
    }

    async createEntityInTransaction(
        transaction: Transaction,
        properties: IEntity['properties'],
        entityTemplate: IMongoEntityTemplate,
        userId: string,
        duplicatedFromId?: string,
    ) {
        const createdRelationships: IRelationship[] = [];

        const fixedProperties = JSON.parse(JSON.stringify(properties));
        const relatedEntitiesByIds: Record<string, IEntity> = {};

        await Promise.all(
            Object.entries(entityTemplate.properties.properties).map(async ([name, property]) => {
                if (property.format === 'relationshipReference') {
                    const relatedEntityId = properties[name];

                    if (relatedEntityId) {
                        const { fixedField, relatedEntity } = await this.fixRelationshipReferenceField(relatedEntityId, transaction);
                        fixedProperties[name] = fixedField;
                        relatedEntitiesByIds[relatedEntityId] = relatedEntity;
                    }
                }
            }),
        );

        const newEntity = await runInTransactionAndNormalize(
            transaction,
            `CREATE (e: \`${entityTemplate._id}\` $properties) RETURN e`,
            normalizeReturnedEntity('singleResponseNotNullable'),
            {
                properties: {
                    ...generateDefaultProperties(),
                    ...addStringFieldsAndNormalizeDateValues(fixedProperties, entityTemplate),
                },
            },
        );

        await Promise.all(
            Object.entries(entityTemplate.properties.properties).map(async ([name, property]) => {
                if (property.format === 'relationshipReference') {
                    if (newEntity.properties[name]) {
                        const { createdRelationship } = await this.createRelationshipReference(
                            property.relationshipReference!,
                            relatedEntitiesByIds[newEntity.properties[name].properties._id],
                            newEntity.properties._id,
                            transaction,
                            userId,
                        );
                        createdRelationships.push(createdRelationship);
                    }
                }
            }),
        );

        const allActivityLogsToCreate: Omit<IActivityLog, '_id'>[] = [];

        await Promise.all(
            createdRelationships.map(async (relationship) => {
                const relatedEntityId =
                    relationship.sourceEntityId === newEntity.properties._id ? relationship.destinationEntityId : relationship.sourceEntityId;

                allActivityLogsToCreate.push({
                    action: ActionsLog.CREATE_RELATIONSHIP,
                    entityId: relatedEntityId,
                    metadata: {
                        relationshipTemplateId: relationship.templateId,
                        relationshipId: relationship.properties._id,
                        entityId: newEntity.properties._id,
                    },
                    timestamp: new Date(),
                    userId,
                });
            }),
        );

        allActivityLogsToCreate.push({
            action: duplicatedFromId ? ActionsLog.DUPLICATE_ENTITY : ActionsLog.CREATE_ENTITY,
            entityId: newEntity.properties._id,
            metadata: duplicatedFromId ? { entityIdDuplicatedFrom: duplicatedFromId } : {},
            timestamp: new Date(),
            userId,
        });

        return { newEntity, activityLogsToCreate: allActivityLogsToCreate };
    }

    async getEntityByIdInTransaction(id: string, transaction: Transaction) {
        const entity = await runInTransactionAndNormalize(
            transaction,
            `MATCH (e {_id: '${id}'}) RETURN e`,
            normalizeReturnedEntity('singleResponse'),
        );

        if (!entity) {
            throw new NotFoundError(`[NEO4J] entity "${id}" not found`);
        }

        return entity;
    }

    async createRelationshipReference(
        relationshipReference: IRelationshipReference,
        relatedEntity: IEntity,
        originalEntityId: string,
        transaction: Transaction,
        userId: string,
    ) {
        const { relationshipTemplateId, relationshipTemplateDirection, relatedTemplateId } = relationshipReference;

        if (relatedEntity.templateId !== relatedTemplateId)
            throw new ServiceError(400, `[NEO4J] Related entity "${relatedEntity.properties._id}" is not of template "${relatedTemplateId}"`);

        const relationshipToCreate = {
            sourceEntityId: relationshipTemplateDirection === 'incoming' ? relatedEntity.properties._id : originalEntityId,
            destinationEntityId: relationshipTemplateDirection === 'incoming' ? originalEntityId : relatedEntity.properties._id,
            templateId: relationshipTemplateId!,
            properties: {},
        };

        const relationshipTemplate = await this.relationshipsTemplateManagerService.getRelationshipTemplateById(relationshipTemplateId!);

        return this.relationshipManager.createRelationshipByEntityIdsInTransaction(
            relationshipToCreate,
            relationshipTemplate,
            [],
            transaction,
            userId,
        );
    }

    async fixRelationshipReferenceField(relatedEntityId: string, transaction: Transaction) {
        const relatedEntity = await this.getEntityByIdInTransaction(relatedEntityId, transaction);
        const relatedEntityTemplate = await this.entityTemplateManagerService.getEntityTemplateById(relatedEntity.templateId);
        const relatedEntityFixProperties = addStringFieldsAndNormalizeDateValues(relatedEntity.properties, relatedEntityTemplate, true);
        return {
            fixedField: {
                ...relatedEntityFixProperties,
                _id: relatedEntityId,
                updatedAt: getNeo4jDateTime(relatedEntity.properties.updatedAt),
                createdAt: getNeo4jDateTime(relatedEntity.properties.createdAt),
                disabled: relatedEntity.properties.disabled,
            },
            relatedEntity,
        };
    }

    async getRelatedEntitiesOfEntity(originalTemplateId: string, originalEntityIds: string[], transaction: Transaction) {
        const allEntityTemplates = await this.entityTemplateManagerService.getTemplatesUsingRelationshipReferance(originalTemplateId);
        const relatedEntityIdsByFieldToChange: Record<string, string[]> = {};

        await Promise.all(
            allEntityTemplates.map(async (entityTemplate) => {
                await Promise.all(
                    Object.entries(entityTemplate.properties.properties).map(async ([propertyName, property]) => {
                        if (property.format === 'relationshipReference' && property.relationshipReference!.relatedTemplateId === originalTemplateId) {
                            if (!relatedEntityIdsByFieldToChange[propertyName]) relatedEntityIdsByFieldToChange[propertyName] = [];

                            const entities = await this.searchRelatedEntitiesOfEntitiesInTransaction(
                                originalEntityIds,
                                entityTemplate._id,
                                propertyName,
                                transaction,
                            );
                            const entityIds = entities.map((entity) => entity.properties._id);

                            relatedEntityIdsByFieldToChange[propertyName].push(...entityIds);
                        }
                    }),
                );
            }),
        );

        return relatedEntityIdsByFieldToChange;
    }

    async createEntity(
        properties: IEntity['properties'],
        entityTemplate: IMongoEntityTemplate,
        ignoredRules: IBrokenRule[],
        userId: string,
        duplicatedFromId?: string,
    ) {
        return this.neo4jClient
            .performComplexTransaction('writeTransaction', async (transaction) => {
                const { newEntity, activityLogsToCreate } = await this.createEntityInTransaction(
                    transaction,
                    properties,
                    entityTemplate,
                    userId,
                    duplicatedFromId,
                );

                const ruleFailuresAfterAction = await this.runRulesOnEntity(transaction, newEntity);

                throwIfActionCausedRuleFailures(ignoredRules, [], ruleFailuresAfterAction, [{ createdEntityId: newEntity.properties._id }]);

                const activityLogsPromises = activityLogsToCreate.map((activityLogToCreate) =>
                    this.activityLogProducer.createActivityLog(activityLogToCreate),
                );

                await Promise.all(activityLogsPromises);

                return newEntity;
            })
            .catch((err) => this.throwServiceErrorIfFailedConstraintsValidation(err)); // constraint validation is performed on end of transaction
    }

    async searchEntitiesOfTemplate(searchBody: ISearchEntitiesOfTemplateBody, entityTemplate: IMongoEntityTemplate) {
        const searchBodyOfTemplate: ISearchBatchBody = {
            skip: searchBody.skip,
            limit: searchBody.limit,
            textSearch: searchBody.textSearch,
            templates: {
                [entityTemplate._id]: { filter: searchBody.filter, showRelationships: searchBody.showRelationships },
            },
            sort: searchBody.sort,
        };

        const searchCypherQuery = searchWithRelationshipsToNeoQuery(searchBodyOfTemplate, new Map([[entityTemplate._id, entityTemplate]]));

        const searchCountCypherQuery = searchWithRelationshipsToNeoQuery(searchBodyOfTemplate, new Map([[entityTemplate._id, entityTemplate]]), true);

        const [entities, count] = await Promise.all([
            this.neo4jClient.readTransaction(searchCypherQuery.cypherQuery, normalizeSearchWithRelationships, searchCypherQuery.parameters),
            this.neo4jClient.readTransaction(searchCountCypherQuery.cypherQuery, normalizeResponseCount, searchCountCypherQuery.parameters),
        ]);

        return { entities, count };
    }

    async searchEntitiesByTemplates(searchByTemplates: ISearchEntitiesByTemplatesBody, entityTemplatesMap: Map<string, IMongoEntityTemplate>) {
        const results: {
            [templateId: string]: {
                entities: IEntityWithDirectRelationships[];
                count: number;
            };
        } = {};

        const { searchConfigs } = searchByTemplates;

        await Promise.all(
            Object.entries(searchConfigs).map(async ([templateId, searchBody]) => {
                const entityTemplate = entityTemplatesMap.get(templateId)!;
                const { entities, count } = await this.searchEntitiesOfTemplate(searchBody, entityTemplate);
                results[templateId] = { entities, count };
            }),
        );

        return results;
    }

    async getEntitiesCountByTemplates(templateIds: string[], textSearch: string = '') {
        const textSearchFixed = `*${escapeNeo4jQuerySpecialChars(textSearch || '')}*`;

        const query = `
            UNWIND $templateIds AS templateId
            WITH templateId, $textSearchFixed as textSearch, '${config.neo4j.templateSearchIndexPrefixes}' + templateId AS indexName
            CALL db.index.fulltext.queryNodes(indexName, textSearch) YIELD node, score
            RETURN templateId, count(node) AS count;
        `;

        return this.neo4jClient.readTransaction(query, normalizeResponseTemplatesCount, { templateIds, textSearchFixed });
    }

    searchRelatedEntitiesOfEntitiesInTransaction(
        entityIds: string[],
        entityTemplateId: string,
        relationshipReferenceFieldName: string,
        transaction: Transaction,
    ) {
        return runInTransactionAndNormalize(
            transaction,
            `MATCH (e: \`${entityTemplateId}\`)
            WHERE e.\`${relationshipReferenceFieldName}.properties._id${config.neo4j.relationshipReferencePropertySuffix}\` IN $entityIds
            RETURN e
            `,
            normalizeReturnedEntity('multipleResponses'),
            { entityIds },
        );
    }

    async searchEntitiesBatch(searchBody: ISearchBatchBody, entityTemplatesMap: Map<string, IMongoEntityTemplate>) {
        const searchCypherQuery = searchWithRelationshipsToNeoQuery(searchBody, entityTemplatesMap);
        const searchCountCypherQuery = searchWithRelationshipsToNeoQuery(searchBody, entityTemplatesMap, true);

        const [entities, count] = await Promise.all([
            this.neo4jClient.readTransaction(searchCypherQuery.cypherQuery, normalizeSearchWithRelationships, searchCypherQuery.parameters),
            this.neo4jClient.readTransaction(searchCountCypherQuery.cypherQuery, normalizeResponseCount, searchCountCypherQuery.parameters),
        ]);

        return { entities, count };
    }

    async getEntityById(id: string) {
        const node = await this.neo4jClient.readTransaction(`MATCH (e {_id: '${id}'}) RETURN e`, normalizeReturnedEntity('singleResponse'));

        if (!node) {
            throw new NotFoundError(`[NEO4J] entity "${id}" not found`);
        }

        return node;
    }

    static fixReturnedEntityRefrencesFields(entity: IEntity) {
        const fixedExpandedEntity = entity;

        const relatedEntities = {};

        Object.entries(entity.properties).forEach(([key, value]) => {
            if (key.includes('.') && key.endsWith(`${config.neo4j.relationshipReferencePropertySuffix}`)) {
                const innerKeys = key.split('.').map((innerKey) => innerKey.replace(config.neo4j.relationshipReferencePropertySuffix, ''));

                if (!relatedEntities[innerKeys[0]]) {
                    relatedEntities[innerKeys[0]] = {
                        properties: {},
                        templateId: '',
                    };
                }

                if (innerKeys[1] === 'properties') {
                    relatedEntities[innerKeys[0]].properties[innerKeys[2]] = value;
                } else if (innerKeys[1] === 'templateId') {
                    relatedEntities[innerKeys[0]].templateId = value;
                }

                delete fixedExpandedEntity.properties[key];
            }
        });

        fixedExpandedEntity.properties = {
            ...fixedExpandedEntity.properties,
            ...relatedEntities,
        };

        return fixedExpandedEntity;
    }

    async getEntitiesByIds(ids: string[]) {
        return this.neo4jClient.readTransaction(`MATCH (e) WHERE e._id IN $ids RETURN e`, normalizeReturnedEntity('multipleResponses'), { ids });
    }

    async getExpandedEntityById(id: string, disabled: boolean | null, templateIds: string[], numOfConnections: number) {
        await this.neo4jClient.readTransaction(
            `MATCH (p {_id:'${id}'})
             CALL apoc.path.expandConfig(p, {
                labelFilter: '${templateIds.join('|')}',
                minLevel: 0,
                maxLevel: ${numOfConnections}
             })
             YIELD path
             RETURN apoc.path.elements(path)`,
            normalizeReturnedRelAndEntities(disabled),
        );
    }

    async getExpandedGraphById(id: string, reqBody: IGetExpandedEntityBody, entityTemplatesMap: Map<string, IMongoEntityTemplate>, userId: string) {
        const { disabled, templateIds, expandedParams, filters } = reqBody;
        const fixSearchBody = filters ?? {};
        const initialCypherQuery = await expandEntityToNeoQuery(fixSearchBody, id, templateIds, expandedParams, entityTemplatesMap, id);
        const initialExpandedEntity = await this.neo4jClient.readTransaction(
            initialCypherQuery.cypherQuery,
            normalizeReturnedRelAndEntities(disabled),
            initialCypherQuery.parameters,
        );
        if (!initialExpandedEntity) {
            throw new NotFoundError(`[NEO4J] entity "${id}" not found`);
        }
        if (JSON.stringify(expandedParams) === '{}') {
            return initialExpandedEntity;
        }

        const filterRes = await getExpandedFilteredGraphRecursively(
            this.neo4jClient,
            disabled || null,
            initialExpandedEntity,
            fixSearchBody,
            templateIds,
            expandedParams,
            entityTemplatesMap,
        );

        await this.activityLogProducer.createActivityLog({
            action: ActionsLog.VIEW_ENTITY,
            entityId: id,
            metadata: {},
            timestamp: new Date(),
            userId,
        });

        return filterRes;
    }

    async deleteRelationshipReferenceInTransaction(
        relationshipReference: IRelationshipReference,
        relatedEntityId: string,
        originalEntityId: string,
        transaction: Transaction,
    ) {
        const { relationshipTemplateId, relationshipTemplateDirection } = relationshipReference;

        const sourceEntityId = relationshipTemplateDirection === 'incoming' ? relatedEntityId : originalEntityId;
        const destinationEntityId = relationshipTemplateDirection === 'incoming' ? originalEntityId : relatedEntityId;
        const templateId = relationshipTemplateId!;

        const relationshipToDelete = await this.relationshipManager.getRelationshipByEntitiesAndTemplate(
            sourceEntityId,
            destinationEntityId,
            templateId,
            transaction,
        );

        return this.relationshipManager.deleteRelationshipByIdInTransaction(relationshipToDelete.properties._id, [], transaction);
    }

    async deleteEntityById(id: string, deleteAllRelationships: boolean) {
        try {
            return this.neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
                const entityToDelete = await this.getEntityByIdInTransaction(id, transaction);
                const entityTemplate = await this.entityTemplateManagerService.getEntityTemplateById(entityToDelete.templateId);

                await Promise.all(
                    Object.entries(entityTemplate.properties.properties).map(async ([name, property]) => {
                        if (property.format === 'relationshipReference' && entityToDelete.properties[name]) {
                            await this.deleteRelationshipReferenceInTransaction(
                                property.relationshipReference!,
                                entityToDelete.properties[name].properties._id,
                                id,
                                transaction,
                            );
                        }
                    }),
                );

                const node = await runInTransactionAndNormalize(
                    transaction,
                    `MATCH (e {_id: '${id}'}) ${deleteAllRelationships ? 'DETACH' : ''} DELETE e RETURN e`,
                    normalizeReturnedEntity('singleResponse'),
                );

                if (!node) {
                    throw new NotFoundError(`[NEO4J] entity "${id}" not found`);
                }

                return id;
            });
        } catch (error) {
            if (error instanceof Neo4jError && error.code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
                throw new ServiceError(400, `[NEO4J] entity "${id}" has existing relationships. Delete them first.`, {
                    errorCode: config.errorCodes.entityHasRelationships,
                });
            }

            throw error;
        }
    }

    async getIsFieldUsed(id: string, fieldValue: string, fieldName: string, type: string) {
        let node;
        if (type === 'array') {
            node = await this.neo4jClient.readTransaction(
                `MATCH (e: \`${id}\`) WHERE '${fieldValue}' IN e.${fieldName} RETURN e`,
                normalizeReturnedEntity('singleResponse'),
            );
        } else {
            node = await this.neo4jClient.readTransaction(
                `MATCH (e: \`${id}\`) WHERE e.${fieldName} = '${fieldValue}' RETURN e`,
                normalizeReturnedEntity('singleResponse'),
            );
        }
        return node;
    }

    async deleteByTemplateId(templateId: string) {
        return this.neo4jClient.writeTransaction(`MATCH (e: \`${templateId}\`) DETACH DELETE e`, normalizeReturnedEntity('multipleResponses'));
    }

    async updateStatusById(id: string, disabled: boolean, ignoredRules: IBrokenRule[], userId: string) {
        const updateEntity = await this.neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
            const entity = await runInTransactionAndNormalize(
                transaction,
                `MATCH (e {_id: '${id}'}) RETURN e`,
                normalizeReturnedEntity('singleResponse'),
            );

            if (!entity) {
                throw new NotFoundError(`[NEO4J] entity "${id}" not found`);
            }

            const entityTemplate = await this.entityTemplateManagerService.getEntityTemplateById(entity.templateId);
            const updatedProperties = this.getUpdatedProperties(
                entity,
                { ...entity, properties: { ...entity.properties, disabled, updatedAt: new Date().toISOString() } },
                entityTemplate,
            );

            const ruleFailuresBeforeAction = await this.runRulesDependOnEntityUpdate(transaction, entity, updatedProperties);

            const updatedEntity = await runInTransactionAndNormalize(
                transaction,
                `MATCH (e {_id: '${id}'}) SET e.disabled = $disabled RETURN e`,
                normalizeReturnedEntity('singleResponseNotNullable'),
                { disabled },
            );

            await this.updateRelationshipReference(updatedEntity, updatedProperties, entityTemplate, transaction);

            const ruleFailuresAfterAction = await this.runRulesDependOnEntityUpdate(transaction, updatedEntity, updatedProperties);

            throwIfActionCausedRuleFailures(ignoredRules, ruleFailuresBeforeAction, ruleFailuresAfterAction, [{}]);

            return updatedEntity;
        });

        await this.activityLogProducer.createActivityLog({
            action: disabled ? ActionsLog.DISABLE_ENTITY : ActionsLog.ACTIVATE_ENTITY,
            metadata: {},
            entityId: id,
            timestamp: new Date(),
            userId,
        });

        return updateEntity;
    }

    private runRulesOnEntity = async (transaction: Transaction, entity: IEntity, updatedProperties?: string[]): Promise<IRuleFailure[]> => {
        const rulesOfEntity = await this.relationshipsTemplateManagerService.searchRules({
            entityTemplateIds: [entity.templateId],
        });
        const relevantRulesOfEntity = filterDependentRulesOnEntity(rulesOfEntity, entity.templateId, updatedProperties);

        return runRulesOnEntity(transaction, entity.properties._id, relevantRulesOfEntity);
    };

    private runRulesOnNeighboursOfUpdatedEntity = async (
        transaction: Transaction,
        updatedEntity: IEntity,
        updatedProperties: string[],
    ): Promise<IRuleFailure[]> => {
        const neighboursOfUpdatedEntity = await runInTransactionAndNormalize(
            transaction,
            `MATCH (e {_id: '${updatedEntity.properties._id}'})-[r]-(neighbour) RETURN type(r) as rTemplate, neighbour`,
            normalizeNeighboursOfEntityForRule,
        );

        const ruleFailuresForEachNeighbourPromises = neighboursOfUpdatedEntity.map(async ({ relationshipTemplate, neighbourOfEntity }) => {
            return this.runRulesOnEntityDependentViaAggregation(
                transaction,
                neighbourOfEntity.properties._id,
                neighbourOfEntity.templateId,
                relationshipTemplate,
                updatedProperties,
            );
        });

        const ruleFailuresForEachNeighbour = await Promise.all(ruleFailuresForEachNeighbourPromises);
        const ruleFailures = ruleFailuresForEachNeighbour.flat();

        return ruleFailures;
    };

    private async runRulesDependOnEntityUpdate(transaction: Transaction, updatedEntity: IEntity, updatedProperties: string[]) {
        const ruleFailuresOfUpdatedEntityPromise = this.runRulesOnEntity(transaction, updatedEntity, updatedProperties);

        const ruleFailuresOnNeighboursOfEntityPromise = this.runRulesOnNeighboursOfUpdatedEntity(transaction, updatedEntity, updatedProperties);

        const [ruleFailuresOfUpdatedEntity, ruleFailuresOfNeighboursOfEntity] = await Promise.all([
            ruleFailuresOfUpdatedEntityPromise,
            ruleFailuresOnNeighboursOfEntityPromise,
        ]);
        const ruleFailures = [...ruleFailuresOfUpdatedEntity, ...ruleFailuresOfNeighboursOfEntity];

        return ruleFailures;
    }

    public getUpdatedProperties(oldEntity: IEntity, newEntity: IEntity, entityTemplate: IMongoEntityTemplate) {
        const propertiesWithGeneratedProperties: Record<string, IEntitySingleProperty> = {
            ...entityTemplate.properties.properties,
            disabled: { title: 'doesntMatter', type: 'boolean' },
            createdAt: { title: 'doesntMatter', type: 'string', format: 'date-time' },
            updatedAt: { title: 'doesntMatter', type: 'string', format: 'date-time' },
        };
        const templateUpdatedProperties = pickBy(propertiesWithGeneratedProperties, (_propertyTemplate, key) => {
            return newEntity.properties[key] !== oldEntity.properties[key];
        });

        const updatedProperties = Object.keys(templateUpdatedProperties);
        return updatedProperties;
    }

    async handleRelationshipReferenceFieldsChanges(
        entity: IEntity,
        entityTemplate: IMongoEntityTemplate,
        entityProperties: Record<string, any>,
        updatedProperties: string[],
        transaction: Transaction,
        userId: string,
    ): Promise<{ fixedProperties: Record<string, any>; createdRelationships: IRelationship[]; deletedRelationships: IRelationship[] }> {
        const entityId = entity.properties._id;
        const fixedProperties: Record<string, any> = JSON.parse(JSON.stringify(entityProperties));
        const createdRelationships: IRelationship[] = [];
        const deletedRelationships: IRelationship[] = [];

        await Promise.all(
            updatedProperties.map(async (updatedProperty) => {
                const property = entityTemplate.properties.properties[updatedProperty];

                if (property?.format === 'relationshipReference') {
                    if (entity.properties[updatedProperty]) {
                        const relatedEntityId = entity.properties[updatedProperty].properties._id;
                        const deletedRelationship = await this.deleteRelationshipReferenceInTransaction(
                            property.relationshipReference!,
                            relatedEntityId,
                            entityId,
                            transaction,
                        );

                        deletedRelationships.push(deletedRelationship);
                    }

                    const relatedEntityId = entityProperties[updatedProperty];

                    if (relatedEntityId) {
                        const { relatedEntity, fixedField } = await this.fixRelationshipReferenceField(relatedEntityId, transaction);

                        fixedProperties[updatedProperty] = fixedField;
                        const { createdRelationship } = await this.createRelationshipReference(
                            property.relationshipReference!,
                            relatedEntity,
                            entityId,
                            transaction,
                            userId,
                        );

                        createdRelationships.push(createdRelationship);
                    }
                }
            }),
        );

        return { fixedProperties, createdRelationships, deletedRelationships };
    }

    async updateRelationshipReference(
        updatedEntity: IEntity,
        updatedProperties: string[],
        entityTemplate: IMongoEntityTemplate,
        transaction: Transaction,
    ) {
        const { templateId, properties: entityProperties } = updatedEntity;
        const entitiesNeedToUpdate = await this.getRelatedEntitiesOfEntity(templateId, [entityProperties._id], transaction);

        await Promise.all(
            Object.entries(entitiesNeedToUpdate).map(async ([fieldToChange, entityIdsToUpdate]) => {
                if (entityIdsToUpdate.length === 0) return;

                const relatedEntitiesChangedValues = { updatedAt: getNeo4jDateTime() };
                updatedProperties.forEach((updatedProperty) => {
                    if (entityProperties[updatedProperty]) {
                        relatedEntitiesChangedValues[
                            `${fieldToChange}.properties.${updatedProperty}${config.neo4j.relationshipReferencePropertySuffix}`
                        ] = entityProperties[updatedProperty];
                    }
                });

                await runInTransactionAndNormalize(
                    transaction,
                    `MATCH (e)
                    WHERE e.\`_id\` IN $updateParams.ids
                    SET e += $updateParams.value
                    RETURN e`,
                    normalizeReturnedEntity('multipleResponses'),
                    {
                        updateParams: {
                            ids: entityIdsToUpdate,
                            value: addStringFieldsAndNormalizeDateValues(relatedEntitiesChangedValues, entityTemplate),
                        },
                    },
                );
            }),
        );
    }

    async updateEntityById(
        id: string,
        entityProperties: Record<string, any>,
        entityTemplate: IMongoEntityTemplate,
        ignoredRules: IBrokenRule[],
        userId: string,
    ) {
        const activityLogUpdatedFields: IUpdatedFields[] = [];
        let createdRelationships: IRelationship[] = [];
        let deletedRelationships: IRelationship[] = [];

        const updatedInstance = await this.neo4jClient
            .performComplexTransaction('writeTransaction', async (transaction) => {
                const entity = await runInTransactionAndNormalize(
                    transaction,
                    `MATCH (e {_id: '${id}'}) RETURN e`,
                    normalizeReturnedEntity('singleResponse'),
                );

                if (!entity) {
                    throw new NotFoundError(`[NEO4J] entity "${id}" not found`);
                }

                if (entity.properties.disabled) {
                    throw new ServiceError(400, `[NEO4J] cannot update disabled entity.`);
                }

                const updatedProperties = this.getUpdatedProperties(
                    entity,
                    { templateId: entity.templateId, properties: { ...entityProperties, updatedAt: new Date().toISOString() } },
                    entityTemplate,
                );
                const ruleFailuresBeforeAction = await this.runRulesDependOnEntityUpdate(transaction, entity, updatedProperties);

                const {
                    fixedProperties,
                    createdRelationships: newCreatedRelationships,
                    deletedRelationships: newDeletedRelationships,
                } = await this.handleRelationshipReferenceFieldsChanges(
                    entity,
                    entityTemplate,
                    entityProperties,
                    updatedProperties,
                    transaction,
                    userId,
                );
                createdRelationships = newCreatedRelationships;
                deletedRelationships = newDeletedRelationships;

                const updatedEntity = await runInTransactionAndNormalize(
                    transaction,
                    `MATCH (e {_id: '${id}'})
                 WITH e.createdAt AS createdAt, e.disabled AS disabled, e AS e
                 SET e = $props 
                 SET e.createdAt = createdAt
                 SET e.disabled = disabled
                 RETURN e`,
                    normalizeReturnedEntity('singleResponseNotNullable'),
                    {
                        props: {
                            ...addStringFieldsAndNormalizeDateValues(fixedProperties, entityTemplate),
                            updatedAt: getNeo4jDateTime(),
                            _id: id,
                        },
                    },
                );

                await this.updateRelationshipReference(updatedEntity, updatedProperties, entityTemplate, transaction);

                const ruleFailuresAfterAction = await this.runRulesDependOnEntityUpdate(transaction, updatedEntity, updatedProperties);

                throwIfActionCausedRuleFailures(ignoredRules, ruleFailuresBeforeAction, ruleFailuresAfterAction, [{}]);

                const fields = Object.keys(entityTemplate.properties.properties);
                for (let i = 0; i < fields.length; i++) {
                    const field = fields[i];
                    const propertyTemplate = entityTemplate.properties.properties[field];

                    let newValue: any;
                    if (propertyTemplate?.format === 'fileId' || propertyTemplate?.items?.format === 'fileId') {
                        newValue = entityProperties[field] ?? updatedEntity.properties[field];
                    } else {
                        newValue = updatedEntity.properties[field];
                    }
                    if (
                        newValue !== undefined &&
                        Array.isArray(entity.properties[field]) &&
                        newValue.length === entity.properties[field].length &&
                        newValue.every((element, index) => element === entity.properties[field][index])
                    )
                        continue;
                    if (entity.properties[field] === newValue) continue;
                    if (
                        propertyTemplate?.format === 'relationshipReference' &&
                        newValue &&
                        entity.properties[field] &&
                        newValue.properties._id === entity.properties[field].properties._id
                    )
                        continue;

                    activityLogUpdatedFields.push({
                        fieldName: field,
                        oldValue: entity.properties[field] ?? null,
                        newValue: newValue ?? null,
                    });
                }

                return updatedEntity;
            })
            .catch((err) => this.throwServiceErrorIfFailedConstraintsValidation(err)); // constraint validation is performed on end of transaction

        await Promise.all(
            createdRelationships.map(async (relationship) => {
                const relatedEntityId = relationship.sourceEntityId === id ? relationship.destinationEntityId : relationship.sourceEntityId;

                await this.activityLogProducer.createActivityLog({
                    action: ActionsLog.CREATE_RELATIONSHIP,
                    entityId: relatedEntityId,
                    metadata: {
                        relationshipTemplateId: relationship.templateId,
                        relationshipId: relationship.properties._id,
                        entityId: id,
                    },
                    timestamp: new Date(),
                    userId,
                });
            }),
        );

        await Promise.all(
            deletedRelationships.map(async (relationship) => {
                const relatedEntityId = relationship.sourceEntityId === id ? relationship.destinationEntityId : relationship.sourceEntityId;

                await this.activityLogProducer.createActivityLog({
                    action: ActionsLog.DELETE_RELATIONSHIP,
                    entityId: relatedEntityId,
                    metadata: {
                        relationshipTemplateId: relationship.templateId,
                        relationshipId: relationship.properties._id,
                        entityId: id,
                    },
                    timestamp: new Date(),
                    userId,
                });
            }),
        );

        await this.activityLogProducer.createActivityLog({
            action: ActionsLog.UPDATE_ENTITY,
            entityId: id,
            metadata: { updatedFields: activityLogUpdatedFields },
            timestamp: new Date(),
            userId,
        });

        return updatedInstance;
    }

    async updateRelationshipReferencesEnumField(
        templateId: string,
        ogirinalEntities: IEntity[],
        newValue: string,
        oldValue: string,
        field: any,
        transaction: Transaction,
    ) {
        let updateRelatedEntitiesQuery;
        const originalChangedEntityIds = ogirinalEntities.map((node) => node.properties._id);
        const entitiesNeedToUpdate = await this.getRelatedEntitiesOfEntity(templateId, originalChangedEntityIds, transaction);

        await Promise.all(
            Object.entries(entitiesNeedToUpdate).map(async ([fieldToChange, entityIdsToUpdate]) => {
                if (field.type === 'enumArray') {
                    updateRelatedEntitiesQuery = `MATCH (e)
                                WHERE e.\`_id\` IN $updateParams.ids AND '${oldValue}' IN e.\`${fieldToChange}\`
                                SET e.\`${fieldToChange}\` = [val IN e.\`${fieldToChange}\` WHERE val <> '${oldValue}'] + ['${newValue}']
                                RETURN e`;
                } else {
                    updateRelatedEntitiesQuery = `MATCH (e)
                                WHERE e.\`_id\` IN $updateParams.ids AND e.\`${fieldToChange}\` = '${oldValue}'
                                SET e.\`${fieldToChange}\` = '${newValue}'
                                RETURN e`;
                }

                await runInTransactionAndNormalize(transaction, updateRelatedEntitiesQuery, normalizeReturnedEntity('multipleResponses'), {
                    updateParams: { ids: entityIdsToUpdate },
                });
            }),
        );
    }

    async updateEnumFieldValue(id: string, newValue: string, oldValue: string, field: any) {
        return this.neo4jClient
            .performComplexTransaction('writeTransaction', async (transaction) => {
                let nodes: IEntity[] = [];

                if (field.type === 'enumArray') {
                    nodes = await runInTransactionAndNormalize(
                        transaction,
                        `MATCH (e: \`${id}\`)
                            WHERE '${oldValue}' IN e.${field.name}
                            SET e.${field.name} = [val IN e.${field.name} WHERE val <> '${oldValue}'] + ['${newValue}']
                            RETURN e`,
                        normalizeReturnedEntity('multipleResponses'),
                    );
                } else {
                    nodes = await runInTransactionAndNormalize(
                        transaction,
                        `MATCH (e: \`${id}\`)
                    WHERE e.${field.name} = '${oldValue}'
                    SET e.${field.name} = '${newValue}'
                    RETURN e`,
                        normalizeReturnedEntity('multipleResponses'),
                    );
                }

                if (nodes) await this.updateRelationshipReferencesEnumField(id, nodes, newValue, oldValue, field, transaction);

                return nodes;
            })
            .catch((error) => {
                throw error instanceof NotFoundError ? new NotFoundError(`[NEO4J] entity not found`) : new Error('Change failed');
            });
    }

    private getConstraintFromName(constraintName: string): IConstraint {
        const [constraintTypePrefix, ...parts] = constraintName.split(config.constraintsNameDelimiter);

        switch (constraintTypePrefix) {
            case config.requiredConstraint: {
                const [constraintTemplateId, property] = parts;
                return { constraintName, type: 'REQUIRED', templateId: constraintTemplateId, property };
            }
            case config.uniqueConstraint: {
                // if field isnt part of unique group -> constraintName has only two parts (groupName === '')
                const [groupName, constraintTemplateId, propertiesStr] = parts.length === 3 ? parts : ['', ...parts];
                const properties = propertiesStr.split(',');
                return { constraintName, type: 'UNIQUE', templateId: constraintTemplateId, uniqueGroupName: groupName, properties };
            }
            default:
                throw new Error('Unknown constraint type for template (checked by constraint name)');
        }
    }

    private buildConstraintsOfTemplate(templateId: string, constraints: IConstraint[]) {
        return constraints.reduce<IConstraintsOfTemplate>(
            (acc, curr) => ({
                ...acc,
                requiredConstraints: curr.type === 'REQUIRED' ? [...acc.requiredConstraints, curr.property] : acc.requiredConstraints,
                uniqueConstraints:
                    curr.type === 'UNIQUE'
                        ? [...acc.uniqueConstraints, { groupName: curr.uniqueGroupName, properties: curr.properties }]
                        : acc.uniqueConstraints,
            }),
            {
                templateId,
                requiredConstraints: [],
                uniqueConstraints: [],
            },
        );
    }

    async getConstraintsOfTemplate(templateId: string) {
        const constraints = await this.neo4jClient.readTransaction('show constraints', normalizeGetDbConstraints);
        const constraintsArrayOfTemplate = constraints
            .filter(({ name }) => {
                return name.startsWith(config.requiredConstraintsPrefixName) || name.startsWith(config.uniqueConstraintsPrefixName);
            })
            .map(({ name }) => this.getConstraintFromName(name))
            .filter((constraint) => templateId === constraint.templateId);

        return this.buildConstraintsOfTemplate(templateId, constraintsArrayOfTemplate);
    }

    async getAllConstraints() {
        const neo4jConstraints = await this.neo4jClient.readTransaction('show constraints', normalizeGetDbConstraints);
        const constraints = neo4jConstraints
            .filter(({ name }) => {
                return name.startsWith(config.requiredConstraintsPrefixName) || name.startsWith(config.uniqueConstraintsPrefixName);
            })
            .map(({ name }) => this.getConstraintFromName(name));

        const constraintsByTemplateIds = groupBy(constraints, 'templateId');
        const constraintsOfTemplates = Object.values(
            mapValues(constraintsByTemplateIds, (constraintsArray, templateId) => {
                return this.buildConstraintsOfTemplate(templateId, constraintsArray);
            }),
        );

        return constraintsOfTemplates;
    }

    private throwServiceErrorIfFailedToCreateConstraint(err: unknown, constraint: IConstraint) {
        if (err instanceof Neo4jError && err.code === 'Neo.DatabaseError.Schema.ConstraintCreationFailed') {
            throw new ServiceError(400, `[NEO4J] failed to create constraint due to existing invalid data`, {
                errorCode: config.errorCodes.failedToCreateConstraints,
                constraint,
                neo4jMessage: err.message,
            });
        }
        throw err;
    }

    private async updateRequiredConstraintsOfTemplate(
        transaction: Transaction,
        template: IMongoEntityTemplate,
        requiredConstraintsProps: string[],
        existingRequiredConstraints: IRequiredConstraint[],
    ) {
        const templateId = template._id;
        const existingRequiredConstraintsOfTemplate = existingRequiredConstraints.filter((constraint) => constraint.templateId === templateId);

        const newRequiredConstraints: IRequiredConstraint[] = requiredConstraintsProps.map((requiredConstraintProp) => ({
            type: 'REQUIRED',
            constraintName: `${config.requiredConstraintsPrefixName}${config.constraintsNameDelimiter}${templateId}${config.constraintsNameDelimiter}${requiredConstraintProp}`,
            templateId,
            property: requiredConstraintProp,
        }));

        const requiredConstraintsToCreate = differenceWith(
            newRequiredConstraints,
            existingRequiredConstraintsOfTemplate,
            (constraintA, constraintB) => constraintA.property === constraintB.property,
        );

        const existingRequiredConstraintsToDelete = differenceWith(
            existingRequiredConstraintsOfTemplate,
            newRequiredConstraints,
            (constraintA, constraintB) => constraintA.property === constraintB.property,
        );

        const createRequiredConstraintsPromises = requiredConstraintsToCreate.map(async (constraint) => {
            await transaction
                .run(
                    `CREATE CONSTRAINT \`${constraint.constraintName}\` FOR (n:\`${templateId}\`) REQUIRE (n.\`${constraint.property}${
                        template.properties.properties[constraint.property].format === 'relationshipReference' ? '.properties._id_reference' : ''
                    }\`) IS NOT NULL`,
                )
                .catch((err) => this.throwServiceErrorIfFailedToCreateConstraint(err, constraint));
        });

        const deleteConstraintsPromises = existingRequiredConstraintsToDelete.map(({ constraintName }) =>
            transaction.run(`DROP CONSTRAINT \`${constraintName}\``),
        );

        return Promise.all([...createRequiredConstraintsPromises, ...deleteConstraintsPromises]);
    }

    private async updateUniqueConstraintsOfTemplate(
        transaction: Transaction,
        template: IMongoEntityTemplate,
        uniqueConstraints: IUniqueConstraintOfTemplate[],
        existingUniqueConstraints: IUniqueConstraint[],
    ) {
        const templateId = template._id;
        const existingUniqueConstraintsOfTemplate = existingUniqueConstraints.filter((constraint) => constraint.templateId === templateId);

        const newUniqueConstraints: IUniqueConstraint[] = uniqueConstraints.flatMap((constraintGroup) => ({
            type: 'UNIQUE',
            constraintName:
                constraintGroup.groupName === ''
                    ? `${config.uniqueConstraintsPrefixName}${config.constraintsNameDelimiter}${templateId}${config.constraintsNameDelimiter}${constraintGroup.properties}`
                    : `${config.uniqueConstraintsPrefixName}${config.constraintsNameDelimiter}${constraintGroup.groupName}${config.constraintsNameDelimiter}${templateId}${config.constraintsNameDelimiter}${constraintGroup.properties}`,
            templateId,
            uniqueGroupName: constraintGroup.groupName,
            properties: constraintGroup.properties,
        }));

        const uniqueConstraintsToCreate = differenceWith(newUniqueConstraints, existingUniqueConstraintsOfTemplate, (constraintA, constraintB) =>
            arraysEqualsNonOrdered(constraintA.properties, constraintB.properties),
        );

        const existingUniqueConstraintsToDelete = differenceWith(
            existingUniqueConstraintsOfTemplate,
            newUniqueConstraints,
            (constraintA, constraintB) => arraysEqualsNonOrdered(constraintA.properties, constraintB.properties),
        );

        const createUniqueConstraintsPromises = uniqueConstraintsToCreate.map(async (constraint) => {
            const propsPart = constraint.properties.map((prop) => {
                return `n.${prop}${template.properties.properties[prop].format === 'relationshipReference' ? '.properties._id_reference' : ''}`;
            });

            await transaction
                .run(`CREATE CONSTRAINT \`${constraint.constraintName}\` FOR (n:\`${templateId}\`) REQUIRE (${propsPart}) IS NODE KEY`)
                .catch((err) => this.throwServiceErrorIfFailedToCreateConstraint(err, constraint));
        });

        const deleteConstraintsPromises = existingUniqueConstraintsToDelete.map(({ constraintName }) =>
            transaction.run(`DROP CONSTRAINT \`${constraintName}\``),
        );

        await Promise.all([...createUniqueConstraintsPromises, ...deleteConstraintsPromises]);
    }

    async updateConstraintsOfTemplate(
        template: IMongoEntityTemplate,
        requiredConstraints: string[],
        uniqueConstraints: IUniqueConstraintOfTemplate[],
    ) {
        return this.neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
            const existingNeo4jConstraints = await runInTransactionAndNormalize(transaction, 'show constraints', normalizeGetDbConstraints);

            const updateConstraintsPromises: Promise<any>[] = [];

            const existingRequiredConstraints = existingNeo4jConstraints
                .filter(({ name }) => name.startsWith(config.requiredConstraintsPrefixName))
                .map(({ name }) => this.getConstraintFromName(name) as IRequiredConstraint);

            const updateRequiredConstraintsPromise = this.updateRequiredConstraintsOfTemplate(
                transaction,
                template,
                requiredConstraints,
                existingRequiredConstraints,
            );
            updateConstraintsPromises.push(updateRequiredConstraintsPromise);

            const existingUniqueConstraints = existingNeo4jConstraints
                .filter(({ name }) => name.startsWith(config.uniqueConstraintsPrefixName))
                .map(({ name }) => this.getConstraintFromName(name) as IUniqueConstraint);

            const updateUniqueConstraintsPromise = this.updateUniqueConstraintsOfTemplate(
                transaction,
                template,
                uniqueConstraints,
                existingUniqueConstraints,
            );
            updateConstraintsPromises.push(updateUniqueConstraintsPromise);

            await Promise.all(updateConstraintsPromises);
        });
    }

    async enumerateNewSerialNumberFields(templateId: string, newSerialNumberFields: object) {
        return this.neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
            const numOfEntitiesUpdated = `
            MATCH (n: \`${templateId}\`) 
            WITH n
            ORDER BY n.createdAt
            WITH collect(n) AS entities
            UNWIND range(0, size(entities)-1) AS index
            WITH entities[index] AS currentEntity,  index AS currentIndex
            SET ${Object.entries(newSerialNumberFields)
                .map(([key, value]) => `\`currentEntity\`.${key} = toFloat(currentIndex + ${value})`)
                .join(', ')}
            RETURN count(currentEntity) AS numEntitiesUpdated`;
            return runInTransactionAndNormalize(transaction, numOfEntitiesUpdated, normalizeResponseCount);
        });
    }
}
