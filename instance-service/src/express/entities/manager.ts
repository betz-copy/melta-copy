import { Neo4jError, Transaction } from 'neo4j-driver';
import pickBy from 'lodash.pickby';
import Neo4jClient from '../../utils/neo4j';
import {
    generateDefaultProperties,
    getNeo4jDateTime,
    normalizeReturnedRelAndEntities,
    normalizeReturnedEntity,
    normalizeResponseCount,
    normalizeRelAndEntitiesForRule,
    runInTransactionAndNormalize,
} from '../../utils/neo4j/lib';
import { IEntity } from './interface';
import { NotFoundError, ServiceError } from '../error';
import { agGridRequestToNeo4JRequest, agGridSearchRequestToNeo4JRequest, IAGGridRequest } from '../../utils/agGridFilterModelToNeoQuery';
import getLatestIndex from '../../utils/redis/getLatestIndex';
import { areAllBrokenRulesIgnored, getBrokenRules, runRulesOnRelationship, runRulesOnRelationshipsOfPinnedEntity } from '../rules/lib';
import { IBrokenRule, IConnection } from '../rules/interfaces';
import { filterDependentRulesOnProperties, filterDependentRulesViaAggregation } from '../rules/getParametersOfFormula';
import config from '../../config';
import { IMongoEntityTemplate } from '../../externalServices/entityTemplateManager';
import { RelationshipsTemplateManagerService } from '../../externalServices/relationshipTemplateManager';
import { addStringFieldsAndNormalizeDateValues } from './validator.template';

export class EntityManager {
    static createEntity(entity: IEntity, entityTemplate: IMongoEntityTemplate) {
        const { templateId, properties } = entity;

        return Neo4jClient.writeTransaction(
            `CREATE (e: \`${templateId}\` $properties) RETURN e`,
            normalizeReturnedEntity('singleResponseNotNullable'),
            {
                properties: {
                    ...generateDefaultProperties(),
                    ...addStringFieldsAndNormalizeDateValues(properties, entityTemplate),
                },
            },
        );
    }

    static async getEntities(templateId: string, agGridRequest: IAGGridRequest) {
        if (agGridRequest.quickFilter) {
            return EntityManager.getEntitiesWithSearch(templateId, agGridRequest);
        }

        const [nodes, nodesOverallCount] = await Promise.all([
            Neo4jClient.readTransaction(agGridRequestToNeo4JRequest(templateId, agGridRequest), normalizeReturnedEntity('multipleResponses')),
            Neo4jClient.readTransaction(agGridRequestToNeo4JRequest(templateId, agGridRequest, true), normalizeResponseCount),
        ]);

        return { rows: nodes, lastRowIndex: nodesOverallCount };
    }

    private static async getEntitiesWithSearch(templateId: string, agGridRequest: IAGGridRequest) {
        const latestIndex = await getLatestIndex();

        if (!latestIndex) {
            throw new ServiceError(400, `[NEO4J] Global search index not found.`);
        }

        const [nodes, nodesOverallCount] = await Promise.all([
            Neo4jClient.readTransaction(
                agGridSearchRequestToNeo4JRequest(templateId, latestIndex, agGridRequest),
                normalizeReturnedEntity('multipleResponses'),
            ),
            Neo4jClient.readTransaction(agGridSearchRequestToNeo4JRequest(templateId, latestIndex, agGridRequest, true), normalizeResponseCount),
        ]);

        return { rows: nodes, lastRowIndex: nodesOverallCount };
    }

    static async getEntityById(id: string) {
        const node = await Neo4jClient.readTransaction(`MATCH (e {_id: '${id}'}) RETURN e`, normalizeReturnedEntity('singleResponse'));

        if (!node) {
            throw new NotFoundError(`[NEO4J] entity "${id}" not found`);
        }

        return node;
    }

    static async getExpandedEntityById(id: string, disabled: boolean | null, templateIds: string[], numOfConnections: number) {
        const nodeAndConnections = await Neo4jClient.readTransaction(
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

        if (!nodeAndConnections) {
            throw new NotFoundError(`[NEO4J] entity "${id}" not found`);
        }

        return nodeAndConnections;
    }

    static async deleteEntityById(id: string, deleteAllRelationships: boolean) {
        try {
            const node = await Neo4jClient.writeTransaction(
                `MATCH (e {_id: '${id}'}) ${deleteAllRelationships ? 'DETACH' : ''} DELETE e RETURN e`,
                normalizeReturnedEntity('singleResponse'),
            );

            if (!node) {
                throw new NotFoundError(`[NEO4J] entity "${id}" not found`);
            }

            return id;
        } catch (error) {
            if (error instanceof Neo4jError && error.code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
                throw new ServiceError(400, `[NEO4J] entity "${id}" has existing relationships. Delete them first.`, {
                    errorCode: config.errorCodes.entityHasRelationships,
                });
            }

            throw error;
        }
    }

    static async deleteByTemplateId(templateId: string) {
        return Neo4jClient.writeTransaction(`MATCH (e: \`${templateId}\`) DETACH DELETE e`, normalizeReturnedEntity('multipleResponses'));
    }

    static async updateStatusById(id: string, disabled: boolean) {
        const node = await Neo4jClient.writeTransaction(
            `MATCH (e {_id: '${id}'}) SET e.disabled = $disabled RETURN e`,
            normalizeReturnedEntity('singleResponse'),
            { disabled },
        );

        if (!node) {
            throw new NotFoundError(`[NEO4J] entity "${id}" not found`);
        }

        return node;
    }

    private static runRulesOnAllRelationshipsOfUpdatedEntity = async (
        transaction: Transaction,
        connectionsOfEntity: IConnection[],
        entity: IEntity,
        updatedProperties: string[],
    ) => {
        const rulesOfEntityWhenPinned = await RelationshipsTemplateManagerService.searchRules({
            pinnedEntityTemplateIds: [entity.templateId],
        });
        const rulesOfEntityWhenUnpinned = await RelationshipsTemplateManagerService.searchRules({
            unpinnedEntityTemplateIds: [entity.templateId],
        });
        const rulesOfEntity = [...rulesOfEntityWhenPinned, ...rulesOfEntityWhenUnpinned];
        const relevantRulesOfEntity = filterDependentRulesOnProperties(rulesOfEntity, entity.templateId, updatedProperties);

        const ruleResultsForEachConnectionPromises = connectionsOfEntity.map(async ({ relationship, destinationEntity: neighbourOfEntity }) => {
            const relevantRulesOfRelationship = relevantRulesOfEntity.filter(
                ({ relationshipTemplateId }) => relationshipTemplateId === relationship.templateId,
            );

            const sourceEntityTemplateId = entity.properties._id === relationship.sourceEntityId ? entity.templateId : neighbourOfEntity.templateId;
            return runRulesOnRelationship(transaction, relevantRulesOfRelationship, relationship, sourceEntityTemplateId);
        });

        const ruleResultsForEachConnection = await Promise.all(ruleResultsForEachConnectionPromises);

        return ruleResultsForEachConnection.flat();
    };

    private static runRulesOnRelationshipsOfNeighboursOfEntityDependentViaAggregation = async (
        transaction: Transaction,
        connectionsOfDependent: IConnection[],
        dependentEntity: IEntity,
        updatedProperties: string[],
    ) => {
        const ruleResultsForEachConnectionPromises = connectionsOfDependent.map(async ({ relationship, destinationEntity: neighbourOfEntity }) => {
            const rulesOfPinnedEntity = await RelationshipsTemplateManagerService.searchRules({
                pinnedEntityTemplateIds: [neighbourOfEntity.templateId],
            });

            const rulesDependentViaAggregation = filterDependentRulesViaAggregation(rulesOfPinnedEntity, relationship.templateId, updatedProperties);

            return runRulesOnRelationshipsOfPinnedEntity(
                transaction,
                neighbourOfEntity.properties._id,
                rulesDependentViaAggregation,
                dependentEntity.properties._id,
            );
        });

        const ruleResultsForEachConnection = await Promise.all(ruleResultsForEachConnectionPromises);

        return ruleResultsForEachConnection.flat();
    };

    private static async verifyRuleForEntityUpdate(
        transaction: Transaction,
        updatedEntity: IEntity,
        ignoredRules: IBrokenRule[],
        updatedProperties: string[],
    ) {
        const connectionsOfEntity = await runInTransactionAndNormalize(
            transaction,
            `MATCH (s {_id: '${updatedEntity.properties._id}'})-[r]-(d)  RETURN s, r, d`,
            normalizeRelAndEntitiesForRule,
        );

        const ruleResultsOnAllRelationshipsOfUpdatedEntityPromise = EntityManager.runRulesOnAllRelationshipsOfUpdatedEntity(
            transaction,
            connectionsOfEntity,
            updatedEntity,
            updatedProperties,
        );

        const ruleResultsOnRelationshipsOfNeighboursOfEntityPromise =
            EntityManager.runRulesOnRelationshipsOfNeighboursOfEntityDependentViaAggregation(
                transaction,
                connectionsOfEntity,
                updatedEntity,
                updatedProperties,
            );

        const [ruleResultsOnAllRelationshipsOfUpdatedEntity, ruleResultsOnRelationshipsOfNeighboursOfEntity] = await Promise.all([
            ruleResultsOnAllRelationshipsOfUpdatedEntityPromise,
            ruleResultsOnRelationshipsOfNeighboursOfEntityPromise,
        ]);
        const ruleResults = [...ruleResultsOnAllRelationshipsOfUpdatedEntity, ...ruleResultsOnRelationshipsOfNeighboursOfEntity];

        const brokenRules = getBrokenRules(ruleResults);

        if (!areAllBrokenRulesIgnored(brokenRules, ignoredRules)) {
            throw new ServiceError(400, `[NEO4J] entity update is blocked by rules.`, {
                errorCode: config.errorCodes.ruleBlock,
                brokenRules,
            });
        }
    }

    public static getUpdatedProperties(oldEntity: IEntity, newEntity: IEntity, entityTemplate: IMongoEntityTemplate) {
        const templateUpdatedProperties = pickBy(entityTemplate.properties.properties, (_propertyTemplate, key) => {
            return newEntity.properties[key] !== oldEntity.properties[key];
        });

        const updatedProperties = Object.keys(templateUpdatedProperties);
        return updatedProperties;
    }

    static async updateEntityById(
        id: string,
        entityProperties: Record<string, any>,
        entityTemplate: IMongoEntityTemplate,
        ignoredRules: IBrokenRule[],
    ) {
        return Neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
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

            const updatedEntity = await runInTransactionAndNormalize(
                transaction,
                `MATCH (e {_id: $props._id})
                 WITH e.createdAt AS createdAt, e.disabled AS disabled, e AS e
                 SET e = $props 
                 SET e.createdAt = createdAt
                 SET e.disabled = disabled 
                 RETURN e`,
                normalizeReturnedEntity('singleResponseNotNullable'),
                {
                    props: {
                        ...addStringFieldsAndNormalizeDateValues(entityProperties, entityTemplate),
                        updatedAt: getNeo4jDateTime(),
                        _id: id,
                    },
                },
            );

            await EntityManager.verifyRuleForEntityUpdate(
                transaction,
                updatedEntity,
                ignoredRules,
                EntityManager.getUpdatedProperties(entity, updatedEntity, entityTemplate),
            );

            return updatedEntity;
        });
    }
}

export default EntityManager;
