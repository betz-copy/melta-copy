/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
import { Neo4jError, Transaction } from 'neo4j-driver';
import pickBy from 'lodash.pickby';
import differenceWith from 'lodash.differencewith';
import groupBy from 'lodash.groupby';
import mapValues from 'lodash.mapvalues';
import Neo4jClient from '../../utils/neo4j';
import {
    generateDefaultProperties,
    getNeo4jDateTime,
    normalizeReturnedRelAndEntities,
    normalizeReturnedEntity,
    normalizeResponseCount,
    normalizeNeighboursOfEntityForRule,
    normalizeGetDbConstraints,
    runInTransactionAndNormalize,
    normalizeSearchWithRelationships,
} from '../../utils/neo4j/lib';
import {
    IConstraint,
    IConstraintsOfTemplate,
    IEntity,
    IGetExpandedEntityBody,
    IRequiredConstraint,
    ISearchBatchBody,
    ISearchEntitiesOfTemplateBody,
    IUniqueConstraint,
    IUniqueConstraintOfTemplate,
} from './interface';
import { NotFoundError, ServiceError } from '../error';
import { getLatestGlobalSearchIndex, getLatestTemplateSearchIndex } from '../../utils/redis/getLatestIndex';
import { runRulesOnEntity } from '../rules/runRulesOnEntity';
import { throwIfActionCausedRuleFailures } from '../rules/throwIfActionCausedRuleFailures';
import { IBrokenRule, IRuleFailure } from '../rules/interfaces';
import { filterDependentRulesOnEntity } from '../rules/getParametersOfFormula';
import config from '../../config';
import { EntityTemplateManagerService } from '../../externalServices/templates/entityTemplateManager';
import { RelationshipsTemplateManagerService } from '../../externalServices/templates/relationshipTemplateManager';
import { addStringFieldsAndNormalizeDateValues } from './validator.template';
import { arraysEqualsNonOrdered } from '../../utils/lib';
import { searchWithRelationshipsToNeoQuery } from '../../utils/neo4j/searchBodyToNeoQuery';
import RelationshipManager from '../relationships/manager';
import { getExpandedFilteredGraphRecursively, expandEntityToNeoQuery } from '../../utils/neo4j/getExpandedEntityByIdRecursive';
import { IMongoEntityTemplate, IEntitySingleProperty, IRelationshipReference } from '../../externalServices/templates/interfaces/entityTemplates';
import { createActivityLog } from '../../externalServices/activityLog/producer';
import { IUpdatedFields } from '../../externalServices/activityLog/interface';
import { IRelationship } from '../relationships/interface';

export class EntityManager {
    private static throwServiceErrorIfFailedConstraintsValidation(err: unknown): never {
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
        } else if (neo4jMessage.includes('already exists with')) {
            // neo4jMessage = Node(...) already exists with label `someLabel...` and properties `property1` = ..., `property2` = ...
            // support unique w/ multiple props
            const variableMatchesInMessage = neo4jMessage.matchAll(/`(.*?)`/g)!;
            const [label, ...properties] = Array.from(variableMatchesInMessage).map((match) => match[1]);
            const fixedProperties = properties.map((property) =>
                property.endsWith(config.neo4j.relationshipReferencePropertySuffix) ? property.split('.')[0] : property,
            );

            const uniqueConstraint: Omit<IUniqueConstraint, 'constraintName'> = {
                type: 'UNIQUE',
                templateId: label,
                uniqueGroupName: '',
                properties: fixedProperties,
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

    static async getEntityByIdInTransaction(id: string, transaction: Transaction) {
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

    static async createRelationshipReference(
        relationshipReference: IRelationshipReference,
        relatedEntity: IEntity,
        originalEntityId: string,
        transaction: Transaction,
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

        const relationshipTemplate = await RelationshipsTemplateManagerService.getRelationshipTemplateById(relationshipTemplateId!);

        return RelationshipManager.createRelationshipByEntityIdsInTransaction(relationshipToCreate, relationshipTemplate, [], transaction);
    }

    static async fixRelationshipReferenceField(relatedEntityId: string, transaction: Transaction) {
        const relatedEntity = await this.getEntityByIdInTransaction(relatedEntityId, transaction);
        const relatedEntityTemplate = await EntityTemplateManagerService.getEntityTemplateById(relatedEntity.templateId);
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

    static async getRelatedEntitiesOfEntity(originalTemplateId: string, originalEntityIds: string[], transaction: Transaction) {
        const allEntityTemplates = await EntityTemplateManagerService.getTemplatesUsingRelationshipReferance(originalTemplateId);
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

    static async createEntity(
        properties: IEntity['properties'],
        entityTemplate: IMongoEntityTemplate,
        ignoredRules: IBrokenRule[],
        userId: string,
        duplicatedFromId?: string,
    ) {
        const createdRelationships: IRelationship[] = [];

        const entity = await Neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
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
                            const createdRelationship = await this.createRelationshipReference(
                                property.relationshipReference!,
                                relatedEntitiesByIds[newEntity.properties[name].properties._id],
                                newEntity.properties._id,
                                transaction,
                            );
                            createdRelationships.push(createdRelationship);
                        }
                    }
                }),
            );
            const ruleFailuresAfterAction = await EntityManager.runRulesOnEntity(transaction, newEntity);

            throwIfActionCausedRuleFailures(ignoredRules, [], ruleFailuresAfterAction, { createdEntityId: newEntity.properties._id });

            return newEntity;
        }).catch(EntityManager.throwServiceErrorIfFailedConstraintsValidation); // constraint validation is performed on end of transaction

        await Promise.all(
            createdRelationships.map(async (relationship) => {
                const relatedEntityId =
                    relationship.sourceEntityId === entity.properties._id ? relationship.destinationEntityId : relationship.sourceEntityId;

                await createActivityLog({
                    action: 'CREATE_RELATIONSHIP' as const,
                    entityId: relatedEntityId,
                    metadata: {
                        relationshipTemplateId: relationship.templateId,
                        relationshipId: relationship.properties._id,
                        entityId: entity.properties._id,
                    },
                    timestamp: new Date(),
                    userId,
                });
            }),
        );

        await createActivityLog({
            action: duplicatedFromId ? 'DUPLICATE_ENTITY' : 'CREATE_ENTITY',
            entityId: entity.properties._id,
            metadata: duplicatedFromId ? { entityIdDuplicatedFrom: duplicatedFromId } : {},
            timestamp: new Date(),
            userId,
        });

        return entity;
    }

    static async searchEntitiesOfTemplate(searchBody: ISearchEntitiesOfTemplateBody, entityTemplate: IMongoEntityTemplate) {
        let latestIndex: string | null = null;

        if (searchBody.textSearch) {
            latestIndex = await getLatestTemplateSearchIndex(entityTemplate._id);

            if (!latestIndex) {
                throw new ServiceError(400, `[NEO4J] Global search index not found.`);
            }
        }

        const searchBodyOfTemplate: ISearchBatchBody = {
            skip: searchBody.skip,
            limit: searchBody.limit,
            textSearch: searchBody.textSearch,
            templates: {
                [entityTemplate._id]: { filter: searchBody.filter, showRelationships: searchBody.showRelationships },
            },
            sort: searchBody.sort,
        };

        const searchCypherQuery = searchWithRelationshipsToNeoQuery(
            searchBodyOfTemplate,
            latestIndex,
            new Map([[entityTemplate._id, entityTemplate]]),
        );
        const searchCountCypherQuery = searchWithRelationshipsToNeoQuery(
            searchBodyOfTemplate,
            latestIndex,
            new Map([[entityTemplate._id, entityTemplate]]),
            true,
        );

        const [entities, count] = await Promise.all([
            Neo4jClient.readTransaction(searchCypherQuery.cypherQuery, normalizeSearchWithRelationships, searchCypherQuery.parameters),
            Neo4jClient.readTransaction(searchCountCypherQuery.cypherQuery, normalizeResponseCount, searchCountCypherQuery.parameters),
        ]);

        return { entities, count };
    }

    static searchRelatedEntitiesOfEntitiesInTransaction(
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

    static async searchEntitiesBatch(searchBody: ISearchBatchBody, entityTemplatesMap: Map<string, IMongoEntityTemplate>) {
        let latestIndex: string | null = null;
        if (searchBody.textSearch) {
            latestIndex = await getLatestGlobalSearchIndex();

            if (!latestIndex) {
                throw new ServiceError(400, `[NEO4J] Global search index not found.`);
            }
        }

        const searchCypherQuery = searchWithRelationshipsToNeoQuery(searchBody, latestIndex, entityTemplatesMap);
        const searchCountCypherQuery = searchWithRelationshipsToNeoQuery(searchBody, latestIndex, entityTemplatesMap, true);

        const [entities, count] = await Promise.all([
            Neo4jClient.readTransaction(searchCypherQuery.cypherQuery, normalizeSearchWithRelationships, searchCypherQuery.parameters),
            Neo4jClient.readTransaction(searchCountCypherQuery.cypherQuery, normalizeResponseCount, searchCountCypherQuery.parameters),
        ]);

        return { entities, count };
    }

    static async getEntityById(id: string) {
        const node = await Neo4jClient.readTransaction(`MATCH (e {_id: '${id}'}) RETURN e`, normalizeReturnedEntity('singleResponse'));

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

    static async getEntitiesByIds(ids: string[]) {
        return Neo4jClient.readTransaction(`MATCH (e) WHERE e._id IN $ids RETURN e`, normalizeReturnedEntity('multipleResponses'), { ids });
    }

    static async getExpandedGraphById(
        id: string,
        reqBody: IGetExpandedEntityBody,
        entityTemplatesMap: Map<string, IMongoEntityTemplate>,
        userId: string,
    ) {
        const { disabled, templateIds, expandedParams, filters } = reqBody;
        const fixSearchBody = filters ?? {};
        const initialCypherQuery = await expandEntityToNeoQuery(fixSearchBody, id, templateIds, expandedParams, entityTemplatesMap, id);
        const initialExpandedEntity = await Neo4jClient.readTransaction(
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
            disabled || null,
            initialExpandedEntity,
            fixSearchBody,
            templateIds,
            expandedParams,
            entityTemplatesMap,
        );

        await createActivityLog({
            action: 'VIEW_ENTITY',
            entityId: id,
            metadata: {},
            timestamp: new Date(),
            userId,
        });

        return filterRes;
    }

    static async deleteRelationshipReferenceInTransaction(
        relationshipReference: IRelationshipReference,
        relatedEntityId: string,
        originalEntityId: string,
        transaction: Transaction,
    ) {
        const { relationshipTemplateId, relationshipTemplateDirection } = relationshipReference;

        const sourceEntityId = relationshipTemplateDirection === 'incoming' ? relatedEntityId : originalEntityId;
        const destinationEntityId = relationshipTemplateDirection === 'incoming' ? originalEntityId : relatedEntityId;
        const templateId = relationshipTemplateId!;

        const relationshipToDelete = await RelationshipManager.getRelationshipByEntitiesAndTemplate(
            sourceEntityId,
            destinationEntityId,
            templateId,
            transaction,
        );

        return RelationshipManager.deleteRelationshipByIdInTransaction(relationshipToDelete.properties._id, [], transaction);
    }

    static async deleteEntityById(id: string, deleteAllRelationships: boolean) {
        try {
            return Neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
                const entityToDelete = await this.getEntityByIdInTransaction(id, transaction);
                const entityTemplate = await EntityTemplateManagerService.getEntityTemplateById(entityToDelete.templateId);

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

    static async getIsFieldUsed(id: string, fieldValue: string, fieldName: string, type: string) {
        let node;
        if (type === 'array') {
            node = await Neo4jClient.readTransaction(
                `MATCH (e: \`${id}\`) WHERE '${fieldValue}' IN e.${fieldName} RETURN e`,
                normalizeReturnedEntity('singleResponse'),
            );
        } else {
            node = await Neo4jClient.readTransaction(
                `MATCH (e: \`${id}\`) WHERE e.${fieldName} = '${fieldValue}' RETURN e`,
                normalizeReturnedEntity('singleResponse'),
            );
        }
        return node;
    }

    static async deleteByTemplateId(templateId: string) {
        return Neo4jClient.writeTransaction(`MATCH (e: \`${templateId}\`) DETACH DELETE e`, normalizeReturnedEntity('multipleResponses'));
    }

    static async updateStatusById(id: string, disabled: boolean, ignoredRules: IBrokenRule[], userId: string) {
        const updateEntity = await Neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
            const entity = await runInTransactionAndNormalize(
                transaction,
                `MATCH (e {_id: '${id}'}) RETURN e`,
                normalizeReturnedEntity('singleResponse'),
            );

            if (!entity) {
                throw new NotFoundError(`[NEO4J] entity "${id}" not found`);
            }

            const entityTemplate = await EntityTemplateManagerService.getEntityTemplateById(entity.templateId);
            const updatedProperties = EntityManager.getUpdatedProperties(
                entity,
                { ...entity, properties: { ...entity.properties, disabled, updatedAt: new Date().toISOString() } },
                entityTemplate,
            );

            const ruleFailuresBeforeAction = await EntityManager.runRulesDependOnEntityUpdate(transaction, entity, updatedProperties);

            const updatedEntity = await runInTransactionAndNormalize(
                transaction,
                `MATCH (e {_id: '${id}'}) SET e.disabled = $disabled RETURN e`,
                normalizeReturnedEntity('singleResponseNotNullable'),
                { disabled },
            );

            await this.updateRelationshipReference(updatedEntity, updatedProperties, entityTemplate, transaction);

            const ruleFailuresAfterAction = await EntityManager.runRulesDependOnEntityUpdate(transaction, updatedEntity, updatedProperties);

            throwIfActionCausedRuleFailures(ignoredRules, ruleFailuresBeforeAction, ruleFailuresAfterAction, {});

            return updatedEntity;
        });

        await createActivityLog({
            action: disabled ? 'DISABLE_ENTITY' : 'ACTIVATE_ENTITY',
            metadata: {},
            entityId: id,
            timestamp: new Date(),
            userId,
        });

        return updateEntity;
    }

    private static runRulesOnEntity = async (transaction: Transaction, entity: IEntity, updatedProperties?: string[]): Promise<IRuleFailure[]> => {
        const rulesOfEntity = await RelationshipsTemplateManagerService.searchRules({
            entityTemplateIds: [entity.templateId],
        });
        const relevantRulesOfEntity = filterDependentRulesOnEntity(rulesOfEntity, entity.templateId, updatedProperties);

        return runRulesOnEntity(transaction, entity.properties._id, relevantRulesOfEntity);
    };

    private static runRulesOnNeighboursOfUpdatedEntity = async (
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
            return RelationshipManager.runRulesOnEntityDependentViaAggregation(
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

    private static async runRulesDependOnEntityUpdate(transaction: Transaction, updatedEntity: IEntity, updatedProperties: string[]) {
        const ruleFailuresOfUpdatedEntityPromise = EntityManager.runRulesOnEntity(transaction, updatedEntity, updatedProperties);

        const ruleFailuresOnNeighboursOfEntityPromise = EntityManager.runRulesOnNeighboursOfUpdatedEntity(
            transaction,
            updatedEntity,
            updatedProperties,
        );

        const [ruleFailuresOfUpdatedEntity, ruleFailuresOfNeighboursOfEntity] = await Promise.all([
            ruleFailuresOfUpdatedEntityPromise,
            ruleFailuresOnNeighboursOfEntityPromise,
        ]);
        const ruleFailures = [...ruleFailuresOfUpdatedEntity, ...ruleFailuresOfNeighboursOfEntity];

        return ruleFailures;
    }

    public static getUpdatedProperties(oldEntity: IEntity, newEntity: IEntity, entityTemplate: IMongoEntityTemplate) {
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

    static async handleRelationshipReferenceFieldsChanges(
        entity: IEntity,
        entityTemplate: IMongoEntityTemplate,
        entityProperties: Record<string, any>,
        updatedProperties: string[],
        transaction: Transaction,
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
                        const createdRelationship = await this.createRelationshipReference(
                            property.relationshipReference!,
                            relatedEntity,
                            entityId,
                            transaction,
                        );

                        createdRelationships.push(createdRelationship);
                    }
                }
            }),
        );

        return { fixedProperties, createdRelationships, deletedRelationships };
    }

    static async updateRelationshipReference(
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

    static async updateEntityById(
        id: string,
        entityProperties: Record<string, any>,
        entityTemplate: IMongoEntityTemplate,
        ignoredRules: IBrokenRule[],
        userId: string,
    ) {
        const activityLogUpdatedFields: IUpdatedFields[] = [];
        let createdRelationships: IRelationship[] = [];
        let deletedRelationships: IRelationship[] = [];

        const updatedInstance = await Neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
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

            const updatedProperties = EntityManager.getUpdatedProperties(
                entity,
                { templateId: entity.templateId, properties: { ...entityProperties, updatedAt: new Date().toISOString() } },
                entityTemplate,
            );
            const ruleFailuresBeforeAction = await EntityManager.runRulesDependOnEntityUpdate(transaction, entity, updatedProperties);

            const {
                fixedProperties,
                createdRelationships: newCreatedRelationships,
                deletedRelationships: newDeletedRelationships,
            } = await this.handleRelationshipReferenceFieldsChanges(entity, entityTemplate, entityProperties, updatedProperties, transaction);
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

            const ruleFailuresAfterAction = await EntityManager.runRulesDependOnEntityUpdate(transaction, updatedEntity, updatedProperties);

            throwIfActionCausedRuleFailures(ignoredRules, ruleFailuresBeforeAction, ruleFailuresAfterAction, {});

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
        }).catch(EntityManager.throwServiceErrorIfFailedConstraintsValidation); // constraint validation is performed on end of transaction

        await Promise.all(
            createdRelationships.map(async (relationship) => {
                const relatedEntityId = relationship.sourceEntityId === id ? relationship.destinationEntityId : relationship.sourceEntityId;

                await createActivityLog({
                    action: 'CREATE_RELATIONSHIP' as const,
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

                await createActivityLog({
                    action: 'DELETE_RELATIONSHIP' as const,
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

        await createActivityLog({
            action: 'UPDATE_ENTITY',
            entityId: id,
            metadata: { updatedFields: activityLogUpdatedFields },
            timestamp: new Date(),
            userId,
        });

        return updatedInstance;
    }

    static async updateRelationshipReferencesEnumField(
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

    static async updateEnumFieldValue(id: string, newValue: string, oldValue: string, field: any) {
        return Neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
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
        }).catch((error) => {
            throw error instanceof NotFoundError ? new NotFoundError(`[NEO4J] entity not found`) : new Error('Change failed');
        });
    }

    private static getConstraintFromName(constraintName: string): IConstraint {
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

    private static buildConstraintsOfTemplate(templateId: string, constraints: IConstraint[]) {
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

    static async getConstraintsOfTemplate(templateId: string) {
        const constraints = await Neo4jClient.readTransaction('call db.constraints', normalizeGetDbConstraints);
        const constraintsArrayOfTemplate = constraints
            .filter(({ name }) => {
                return name.startsWith(config.requiredConstraintsPrefixName) || name.startsWith(config.uniqueConstraintsPrefixName);
            })
            .map(({ name }) => EntityManager.getConstraintFromName(name))
            .filter((constraint) => templateId === constraint.templateId);

        return EntityManager.buildConstraintsOfTemplate(templateId, constraintsArrayOfTemplate);
    }

    static async getAllConstraints() {
        const neo4jConstraints = await Neo4jClient.readTransaction('call db.constraints', normalizeGetDbConstraints);
        const constraints = neo4jConstraints
            .filter(({ name }) => {
                return name.startsWith(config.requiredConstraintsPrefixName) || name.startsWith(config.uniqueConstraintsPrefixName);
            })
            .map(({ name }) => EntityManager.getConstraintFromName(name));

        const constraintsByTemplateIds = groupBy(constraints, 'templateId');
        const constraintsOfTemplates = Object.values(
            mapValues(constraintsByTemplateIds, (constraintsArray, templateId) => {
                return EntityManager.buildConstraintsOfTemplate(templateId, constraintsArray);
            }),
        );

        return constraintsOfTemplates;
    }

    private static throwServiceErrorIfFailedToCreateConstraint(err: unknown, constraint: IConstraint) {
        if (err instanceof Neo4jError && err.code === 'Neo.DatabaseError.Schema.ConstraintCreationFailed') {
            throw new ServiceError(400, `[NEO4J] failed to create constraint due to existing invalid data`, {
                errorCode: config.errorCodes.failedToCreateConstraints,
                constraint,
                neo4jMessage: err.message,
            });
        }
        throw err;
    }

    private static async updateRequiredConstraintsOfTemplate(
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
                    `CREATE CONSTRAINT \`${constraint.constraintName}\` ON (n:\`${templateId}\`) ASSERT exists(n.\`${constraint.property}${
                        template.properties.properties[constraint.property].format === 'relationshipReference' ? '.properties._id_reference' : ''
                    }\`)`,
                )
                .catch((err) => EntityManager.throwServiceErrorIfFailedToCreateConstraint(err, constraint));
        });

        const deleteConstraintsPromises = existingRequiredConstraintsToDelete.map(({ constraintName }) =>
            transaction.run(`DROP CONSTRAINT \`${constraintName}\``),
        );

        return Promise.all([...createRequiredConstraintsPromises, ...deleteConstraintsPromises]);
    }

    private static async updateUniqueConstraintsOfTemplate(
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
                .run(`CREATE CONSTRAINT \`${constraint.constraintName}\` ON (n:\`${templateId}\`) ASSERT (${propsPart}) IS NODE KEY`)
                .catch((err) => EntityManager.throwServiceErrorIfFailedToCreateConstraint(err, constraint));
        });

        const deleteConstraintsPromises = existingUniqueConstraintsToDelete.map(({ constraintName }) =>
            transaction.run(`DROP CONSTRAINT \`${constraintName}\``),
        );

        await Promise.all([...createUniqueConstraintsPromises, ...deleteConstraintsPromises]);
    }

    static async updateConstraintsOfTemplate(
        template: IMongoEntityTemplate,
        requiredConstraints: string[],
        uniqueConstraints: IUniqueConstraintOfTemplate[],
    ) {
        return Neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
            const existingNeo4jConstraints = await runInTransactionAndNormalize(transaction, 'call db.constraints', normalizeGetDbConstraints);

            const updateConstraintsPromises: Promise<any>[] = [];

            const existingRequiredConstraints = existingNeo4jConstraints
                .filter(({ name }) => name.startsWith(config.requiredConstraintsPrefixName))
                .map(({ name }) => EntityManager.getConstraintFromName(name) as IRequiredConstraint);

            const updateRequiredConstraintsPromise = EntityManager.updateRequiredConstraintsOfTemplate(
                transaction,
                template,
                requiredConstraints,
                existingRequiredConstraints,
            );
            updateConstraintsPromises.push(updateRequiredConstraintsPromise);

            const existingUniqueConstraints = existingNeo4jConstraints
                .filter(({ name }) => name.startsWith(config.uniqueConstraintsPrefixName))
                .map(({ name }) => EntityManager.getConstraintFromName(name) as IUniqueConstraint);

            const updateUniqueConstraintsPromise = EntityManager.updateUniqueConstraintsOfTemplate(
                transaction,
                template,
                uniqueConstraints,
                existingUniqueConstraints,
            );
            updateConstraintsPromises.push(updateUniqueConstraintsPromise);

            await Promise.all(updateConstraintsPromises);
        });
    }

    static async enumerateNewSerialNumberFields(templateId: string, newSerialNumberFields: object) {
        return Neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
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

export default EntityManager;
