import Neo4jClient from '../../utils/neo4j';
import {
    generateDefaultProperties,
    getNeo4jDateTime,
    normalizeResponseCount,
    normalizeReturnedRelationship,
    normalizeRuleResult,
    normalizeReturnedDeletedRelationship,
} from '../../utils/neo4j/lib';
import { IMongoRelationshipTemplate, IRelationship } from './interface';
import { NotFoundError, ServiceError } from '../error';
import { isRelationshipLegal } from './rules';
import { IEntity } from '../entities/interface';
import config from '../../config';
import { areAllRulesLegal } from '../rules/lib';

export class RelationshipManager {
    static async getRelationshipById(id: string) {
        const relationship = await Neo4jClient.readTransaction(
            `MATCH (s)-[r]->(d) WHERE r._id='${id}' RETURN r, s, d`,
            normalizeReturnedRelationship(),
        );

        if (!relationship) {
            throw new NotFoundError(`[NEO4J] relationship "${id}" not found`);
        }

        return relationship;
    }

    static async getRelationshipsCountByTemplateId(templateId: string) {
        return Neo4jClient.readTransaction(`MATCH ()-[r: \`${templateId}\`]->() RETURN count(r)`, normalizeResponseCount);
    }

    static async createRelationshipByEntityIds(
        relationship: IRelationship,
        relationshipTemplate: IMongoRelationshipTemplate,
        sourceEntity: IEntity,
        destinationEntity: IEntity,
    ) {
        const { templateId, properties, sourceEntityId, destinationEntityId } = relationship;
        const defaultProperties = generateDefaultProperties();

        const relProps = {
            ...properties,
            ...defaultProperties,
        };

        return Neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
            const countOfExistingRelationships = await transaction.run(
                `MATCH ({_id: '${sourceEntityId}'})-[r: \`${templateId}\`]->({_id: '${destinationEntityId}'}) return count(r)`,
            );

            if (normalizeResponseCount(countOfExistingRelationships) > 0) {
                throw new ServiceError(400, `[NEO4J] relationship already exists between requested entities.`, {
                    errorCode: config.errorCodes.relationshipAlreadyExists,
                });
            }

            const edge = await transaction.run(
                `MATCH (s {_id: '${sourceEntityId}'}),(d {_id: '${destinationEntityId}'})
                MERGE (s)-[r: \`${templateId}\`]->(d)
                ON CREATE SET r = $relProps
                RETURN r, s, d`,
                { relProps },
            );

            const normalizedRelationship = normalizeReturnedRelationship()(edge) as IRelationship;

            const ruleQueries = await isRelationshipLegal(normalizedRelationship, sourceEntity, destinationEntity, relationshipTemplate);
            const ruleResults = await Promise.all(
                ruleQueries.map(async (ruleQuery) => {
                    const result = await transaction.run(ruleQuery.cypherQuery, ruleQuery.parameters);

                    return normalizeRuleResult(result);
                }),
            );

            if (!areAllRulesLegal(ruleResults)) {
                throw new ServiceError(400, `[NEO4J] relationship is blocked by rules.`, {
                    errorCode: config.errorCodes.ruleBlock,
                });
            }

            return normalizedRelationship;
        });
    }

    static async deleteRelationshipById(id: string) {
        const relationship = await Neo4jClient.writeTransaction(
            `MATCH (s)-[r]->(d)
             WHERE r._id='${id}' with *, properties(r) as rProps, type(r) as rType
             DELETE r 
             RETURN rProps, rType, s, d`,
            normalizeReturnedDeletedRelationship,
        );

        if (!relationship) {
            throw new NotFoundError(`[NEO4J] relationship "${id}" not found`);
        }

        return relationship;
    }

    static async updateRelationshipPropertiesById(id: string, relationshipProperties: object) {
        const edge = await Neo4jClient.writeTransaction(
            `MATCH (s)-[r]->(d) WHERE r._id='${id}' SET r += $props RETURN r, s, d`,
            normalizeReturnedRelationship(),
            {
                props: {
                    ...relationshipProperties,
                    updatedAt: getNeo4jDateTime(),
                },
            },
        );

        if (!edge) {
            throw new NotFoundError(`[NEO4J] relationship "${id}" not found`);
        }

        return edge;
    }
}

export default RelationshipManager;
