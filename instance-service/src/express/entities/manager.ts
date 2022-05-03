import { Neo4jError } from 'neo4j-driver';
import Neo4jClient from '../../utils/neo4j';
import {
    generateDefaultProperties,
    getNeo4jDate,
    normalizeReturnedRelAndEntities,
    normalizeReturnedEntity,
    normalizeReturnedEntitiesCount,
} from '../../utils/neo4j/lib';
import { IEntity } from './interface';
import { NotFoundError, ServiceError } from '../error';
import { agGridRequestToNeo4JRequest, agGridSearchRequestToNeo4JRequest, IAGGridRequest } from '../../utils/agGridFilterModelToNeoQuery';
import RedisClient from '../../utils/redis';

export class EntityManager {
    static createEntity(entity: IEntity) {
        const { templateId, properties } = entity;

        return Neo4jClient.writeTransaction(`CREATE (e: \`${templateId}\` $properties) RETURN e`, normalizeReturnedEntity(), {
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
            Neo4jClient.readTransaction(agGridRequestToNeo4JRequest(templateId, agGridRequest, true), normalizeReturnedEntitiesCount),
        ]);

        return { rows: nodes, lastRowIndex: nodesOverallCount };
    }

    private static async getEntitiesWithSearch(templateId: string, agGridRequest: IAGGridRequest) {
        const redisClient = RedisClient.getClient();
        const latestIndex = await redisClient.get('latestIndex');

        if (!latestIndex) {
            throw new ServiceError(400, `[NEO4J] Global search index not found.`);
        }

        const [nodes, nodesOverallCount] = await Promise.all([
            Neo4jClient.readTransaction(
                agGridSearchRequestToNeo4JRequest(templateId, latestIndex, agGridRequest),
                normalizeReturnedEntity('multipleResponses'),
            ),
            Neo4jClient.readTransaction(
                agGridSearchRequestToNeo4JRequest(templateId, latestIndex, agGridRequest, true),
                normalizeReturnedEntitiesCount,
            ),
        ]);

        return { rows: nodes, lastRowIndex: nodesOverallCount };
    }

    static async getEntityById(id: string): Promise<IEntity> {
        const node = await Neo4jClient.readTransaction(`MATCH (e {_id: '${id}'}) RETURN e`, normalizeReturnedEntity());

        if (!node) {
            throw new NotFoundError(`[NEO4J] entity "${id}" not found`);
        }

        return node;
    }

    static async getExpandedEntityById(id: string) {
        const nodeAndConnections = await Neo4jClient.readTransaction(
            `MATCH (n {_id:'${id}'}) OPTIONAL MATCH (n)-[r]-(m) return n,r,m`,
            normalizeReturnedRelAndEntities,
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
                normalizeReturnedEntity(),
            );

            if (!node) {
                throw new NotFoundError(`[NEO4J] entity '${id}' not found`);
            }

            return id;
        } catch (error) {
            if (error instanceof Neo4jError && error.code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
                throw new ServiceError(400, `[NEO4J] entity '${id}' has existing relationships. Delete them first.`);
            }

            throw error;
        }
    }

    static async deleteByTemplateId(templateId: string) {
        return Neo4jClient.writeTransaction(`MATCH (e: \`${templateId}\`) DETACH DELETE e`, normalizeReturnedEntity('multipleResponses'));
    }

    static async updateEntityById(id: string, entityProperties: object) {
        const node = await Neo4jClient.writeTransaction(`MATCH (e {_id: '${id}'}) SET e += $props RETURN e`, normalizeReturnedEntity(), {
            props: {
                ...entityProperties,
                updatedAt: getNeo4jDate(),
            },
        });

        if (!node) {
            throw new NotFoundError(`[NEO4J] entity "${id}" not found`);
        }

        return node;
    }
}

export default EntityManager;
