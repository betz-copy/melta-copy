import Neo4jClient from '../../utils/neo4j';
import { generateDefaultProperties, getNeo4jDate, normalizeResponseCount, normalizeReturnedRelationship } from '../../utils/neo4j/lib';
import { IRelationship } from './interface';
import { NotFoundError, ServiceError } from '../error';

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

    static async createRelationshipByEntityIds(relationship: IRelationship) {
        const { templateId, properties, sourceEntityId, destinationEntityId } = relationship;
        const defaultProperties = generateDefaultProperties();

        const relProps = {
            ...properties,
            ...defaultProperties,
        };

        const edge = await Neo4jClient.writeTransaction(
            `MATCH (s {_id: '${sourceEntityId}'}),(d {_id: '${destinationEntityId}'}) CREATE (s)-[r: \`${templateId}\` $relProps]->(d) RETURN r, s, d`,
            normalizeReturnedRelationship(),
            { relProps },
        );

        if (!edge) {
            throw new ServiceError(404, `[NEO4J] relationship not created. Source/destination entity node not found.`);
        }

        return edge;
    }

    static async deleteRelationshipById(id: string) {
        const relationship = await Neo4jClient.writeTransaction(
            `MATCH (s)-[r]-(d) WHERE r._id='${id}' DELETE r RETURN r, s, d`,
            normalizeReturnedRelationship(),
        );

        if (!relationship) {
            throw new NotFoundError(`[NEO4J] relationship "${id}" not found`);
        }
    }

    static async updateRelationshipPropertiesById(id: string, relationshipProperties: object) {
        const edge = await Neo4jClient.writeTransaction(
            `MATCH (s)-[r]->(d) WHERE r._id='${id}' SET r += $props RETURN r, s, d`,
            normalizeReturnedRelationship(),
            {
                props: {
                    ...relationshipProperties,
                    updatedAt: getNeo4jDate(),
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
