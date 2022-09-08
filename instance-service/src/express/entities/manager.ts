import { Neo4jError, Transaction } from 'neo4j-driver';
import Neo4jClient from '../../utils/neo4j';
import {
    generateDefaultProperties,
    getNeo4jDateTime,
    normalizeReturnedRelAndEntities,
    normalizeReturnedEntity,
    normalizeResponseCount,
    normalizeRelAndEntitiesForRule,
} from '../../utils/neo4j/lib';
import { IEntity, IMongoEntityTemplate } from './interface';
import { NotFoundError, ServiceError } from '../error';
import { agGridRequestToNeo4JRequest, agGridSearchRequestToNeo4JRequest, IAGGridRequest } from '../../utils/agGridFilterModelToNeoQuery';
import getLatestIndex from '../../utils/redis/getLatestIndex';
import { areAllBrokenRulesIgnored, createRulesQueries, getBrokenRules, getRulesByEntityTemplateId, searchRuleTemplates } from '../rules/lib';
import { IBrokenRule } from '../rules/interfaces';
import { transactionRunAndNormalize, getRuleResults } from '../rules/transaction';
import config from '../../config';

export class EntityManager {
    static createEntity(entity: IEntity) {
        const { templateId, properties } = entity;

        return Neo4jClient.writeTransaction(`CREATE (e: \`${templateId}\` $properties) RETURN e`, normalizeReturnedEntity('singleResponse'), {
            properties: {
                ...generateDefaultProperties(),
                ...properties,
            },
        });
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

    static async getEntityById(id: string): Promise<IEntity> {
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

    private static getRuleQueryBySourceId = async (
        transaction: Transaction,
        entityTemplateId: string,
        sourceEntityId: string,
        destinationEntityId: string,
    ) => {
        const pathsConnectedToSourceIdRules = await searchRuleTemplates({ pinnedEntityTemplateIds: [entityTemplateId] });

        if (!pathsConnectedToSourceIdRules.length) {
            return [];
        }

        const pathsConnectedToSourceId = await transactionRunAndNormalize(
            transaction,
            `MATCH (s {_id: '${sourceEntityId}'})-[r]-(d) WHERE d._id <> '${destinationEntityId}'  RETURN s, r, d`,
            normalizeRelAndEntitiesForRule,
        );

        return createRulesQueries(pathsConnectedToSourceId, pathsConnectedToSourceIdRules);
    };

    public static getRulesConnectedToEntityInstances = async (transaction: Transaction, entities: IEntity[], excludedEntityId: string) => {
        const destinationRulesPromises = entities.flatMap(async (entity) => {
            return EntityManager.getRuleQueryBySourceId(transaction, entity.templateId, entity.properties._id, excludedEntityId);
        });

        const destinationRules = await Promise.all(destinationRulesPromises);

        return destinationRules.flat();
    };

    private static async verifyRuleForEntityUpdate(
        transaction: Transaction,
        entityTemplate: IMongoEntityTemplate,
        updatedEntity: IEntity,
        ignoredRules: IBrokenRule[],
    ) {
        const rulesByEntityTemplateId = await getRulesByEntityTemplateId(entityTemplate._id);
        const connectionsWithSourceId = await transactionRunAndNormalize(
            transaction,
            `MATCH (s {_id: '${updatedEntity.properties._id}'})-[r]-(d)  RETURN s, r, d`,
            normalizeRelAndEntitiesForRule,
        );

        const destinationRules = await EntityManager.getRulesConnectedToEntityInstances(
            transaction,
            connectionsWithSourceId.map(({ destinationEntity }) => destinationEntity),
            updatedEntity.properties._id,
        );

        const ruleQueries = await Promise.all([...createRulesQueries(connectionsWithSourceId, rulesByEntityTemplateId), ...destinationRules]);

        const ruleResults = await getRuleResults(transaction, ruleQueries.flat());

        const brokenRules = getBrokenRules(ruleResults);

        if (!areAllBrokenRulesIgnored(brokenRules, ignoredRules)) {
            throw new ServiceError(400, `[NEO4J] entity update is blocked by rules.`, {
                errorCode: config.errorCodes.ruleBlock,
                brokenRules,
            });
        }
    }

    static async updateEntityById(
        id: string,
        entityProperties: Record<string, any>,
        entityTemplate: IMongoEntityTemplate,
        ignoredRules: IBrokenRule[],
    ) {
        return Neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
            const entity = await transactionRunAndNormalize(
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

            const updatedEntity = (await transactionRunAndNormalize(
                transaction,
                `MATCH (e {_id: '${id}'})
                 WITH e.createdAt AS createdAt, e.disabled AS disabled, e AS e
                 SET e = $props 
                 SET e.createdAt = createdAt
                 SET e.disabled = disabled 
                 RETURN e`,
                normalizeReturnedEntity('singleResponse'),
                {
                    props: {
                        ...entityProperties,
                        updatedAt: getNeo4jDateTime(),
                        _id: id,
                    },
                },
            )) as IEntity;

            await EntityManager.verifyRuleForEntityUpdate(transaction, entityTemplate, updatedEntity, ignoredRules);

            return updatedEntity;
        });
    }
}

export default EntityManager;
