import { Transaction } from 'neo4j-driver';
import Neo4jClient from '../../utils/neo4j';
import {
    generateDefaultProperties,
    getNeo4jDateTime,
    normalizeResponseCount,
    normalizeReturnedRelationship,
    normalizeReturnedDeletedRelationship,
} from '../../utils/neo4j/lib';
import { IMongoRelationshipTemplate, IRelationship } from './interface';
import { NotFoundError, ServiceError } from '../error';
import { searchRuleTemplates, getBrokenRules, areAllBrokenRulesIgnored, createRuleQuery, getRuleResults } from '../rules/lib';
import { IBrokenRule } from '../rules/interfaces';
import { getRelationshipTemplateById } from './template';
import config from '../../config';

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

    private static getRuleQueryByRelId = async (transaction: Transaction, templateId: string, sourceEntityId: string) => {
        const pathsConnectedWithRelIdRules = await searchRuleTemplates({ relationshipTemplateIds: [templateId] });

        if (!pathsConnectedWithRelIdRules.length) {
            return [];
        }

        const pathsWithRelId = await transaction.run(`MATCH (s {_id: '${sourceEntityId}'})-[r: \`${templateId}\`]->(d) RETURN s, r, d`);

        return createRuleQuery(pathsWithRelId, pathsConnectedWithRelIdRules);
    };

    private static getRuleQueryBySourceId = async (
        transaction: Transaction,
        relationshipTemplate: IMongoRelationshipTemplate,
        sourceEntityId: string,
        destinationEntityId: string,
    ) => {
        const pathsConnectedToSourceIdRules = await searchRuleTemplates({ pinnedEntityTemplateIds: [relationshipTemplate.sourceEntityId] });

        if (!pathsConnectedToSourceIdRules.length) {
            return [];
        }

        const pathsConnectedToSourceId = await transaction.run(
            `MATCH (s {_id: '${sourceEntityId}'})-[r]-(d) WHERE d._id <> '${destinationEntityId}' RETURN s, r, d`,
        );

        return createRuleQuery(pathsConnectedToSourceId, pathsConnectedToSourceIdRules);
    };

    private static getRuleQueryByDestId = async (
        transaction: Transaction,
        relationshipTemplate: IMongoRelationshipTemplate,
        sourceEntityId: string,
        destinationEntityId: string,
    ) => {
        const pathsConnectedToDestIdRules = await searchRuleTemplates({ pinnedEntityTemplateIds: [relationshipTemplate.destinationEntityId] });

        if (!pathsConnectedToDestIdRules.length) {
            return [];
        }

        const pathsConnectedToDestId = await transaction.run(
            `MATCH (s)-[r]-(d {_id: '${destinationEntityId}'}) WHERE s._id <> '${sourceEntityId}' RETURN s, r, d`,
        );

        return createRuleQuery(pathsConnectedToDestId, pathsConnectedToDestIdRules);
    };

    private static async verifyRuleForRelationshipCreation(
        transaction: Transaction,
        relationshipTemplate: IMongoRelationshipTemplate,
        createdRelationship: IRelationship,
        ignoredRules: IBrokenRule[],
    ) {
        const { sourceEntityId, destinationEntityId, properties } = createdRelationship;

        const ruleQueryByRelId = await this.getRuleQueryByRelId(transaction, relationshipTemplate._id, sourceEntityId);
        const ruleQueryBySourceId = await this.getRuleQueryBySourceId(transaction, relationshipTemplate, sourceEntityId, destinationEntityId);
        const ruleQueryByDestId = await this.getRuleQueryByDestId(transaction, relationshipTemplate, sourceEntityId, destinationEntityId);
        const ruleQueries = await Promise.all([...ruleQueryBySourceId, ...ruleQueryByDestId, ...ruleQueryByRelId]);

        const ruleResults = await getRuleResults(transaction, ruleQueries.flat());

        const brokenRules = getBrokenRules(ruleResults, properties._id);

        if (!areAllBrokenRulesIgnored(brokenRules, ignoredRules)) {
            throw new ServiceError(400, `[NEO4J] relationship creation is blocked by rules.`, {
                errorCode: config.errorCodes.ruleBlock,
                brokenRules,
            });
        }
    }

    static async createRelationshipByEntityIds(
        relationship: IRelationship,
        relationshipTemplate: IMongoRelationshipTemplate,
        ignoredRules: IBrokenRule[],
    ) {
        const { templateId, properties, sourceEntityId, destinationEntityId } = relationship;

        return Neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
            const countOfExistingRelationships = await transaction.run(
                `MATCH ({_id: '${sourceEntityId}'})-[r: \`${templateId}\`]->({_id: '${destinationEntityId}'}) return count(r)`,
            );

            if (normalizeResponseCount(countOfExistingRelationships) > 0) {
                throw new ServiceError(400, `[NEO4J] relationship already exists between requested entities.`, {
                    errorCode: config.errorCodes.relationshipAlreadyExists,
                });
            }

            const createdRelationship = await transaction.run(
                `MATCH (s {_id: '${sourceEntityId}'}),(d {_id: '${destinationEntityId}'})
                MERGE (s)-[r: \`${templateId}\`]->(d)
                ON CREATE SET r = $relProps
                RETURN r, s, d`,
                {
                    relProps: {
                        ...properties,
                        ...generateDefaultProperties(),
                    },
                },
            );

            const normalizedRelationship = normalizeReturnedRelationship()(createdRelationship) as IRelationship;

            await RelationshipManager.verifyRuleForRelationshipCreation(transaction, relationshipTemplate, normalizedRelationship, ignoredRules);

            return normalizedRelationship;
        });
    }

    private static async verifyRuleForRelationshipDeletion(
        transaction: Transaction,
        deletedRelationship: IRelationship,
        ignoredRules: IBrokenRule[],
    ) {
        const { sourceEntityId, destinationEntityId, templateId } = deletedRelationship;

        const relationshipTemplate = await getRelationshipTemplateById(templateId);

        const ruleQueryBySourceId = await this.getRuleQueryBySourceId(transaction, relationshipTemplate, sourceEntityId, destinationEntityId);
        const ruleQueryByDestId = await this.getRuleQueryByDestId(transaction, relationshipTemplate, sourceEntityId, destinationEntityId);
        const ruleQueries = await Promise.all([...ruleQueryBySourceId, ...ruleQueryByDestId]);

        const ruleResults = await getRuleResults(transaction, ruleQueries.flat());

        const brokenRules = getBrokenRules(ruleResults);

        if (!areAllBrokenRulesIgnored(brokenRules, ignoredRules)) {
            throw new ServiceError(400, `[NEO4J] relationship deletion blocked by rules.`, {
                errorCode: config.errorCodes.ruleBlock,
                brokenRules,
            });
        }
    }

    static async deleteRelationshipById(id: string, ignoredRules: IBrokenRule[]) {
        return Neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
            const relationship = await transaction.run(`
            MATCH (s)-[r]->(d)
            WHERE r._id='${id}' with *, properties(r) as rProps, type(r) as rType
            DELETE r 
            RETURN rProps, rType, s, d`);

            const normalizedRelationship = normalizeReturnedDeletedRelationship(relationship) as IRelationship;

            if (!normalizedRelationship) {
                throw new NotFoundError(`[NEO4J] relationship "${id}" not found`);
            }

            await RelationshipManager.verifyRuleForRelationshipDeletion(transaction, normalizedRelationship, ignoredRules);

            return normalizedRelationship;
        });
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
