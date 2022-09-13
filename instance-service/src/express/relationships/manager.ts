import { Transaction } from 'neo4j-driver';
import Neo4jClient from '../../utils/neo4j';
import {
    generateDefaultProperties,
    getNeo4jDateTime,
    normalizeResponseCount,
    normalizeReturnedRelationship,
    normalizeReturnedDeletedRelationship,
    normalizeRelAndEntitiesForRule,
} from '../../utils/neo4j/lib';
import { IMongoRelationshipTemplate, IRelationship } from './interface';
import { NotFoundError, ServiceError } from '../error';
import { searchRuleTemplates, getBrokenRules, areAllBrokenRulesIgnored, createRulesQueries } from '../rules/lib';
import { IBrokenRule } from '../rules/interfaces';
import { getRelationshipTemplateById } from './template';
import { filterDependentRules } from '../rules/getParametersOfFormula';
import { transactionRunAndNormalize, getRuleResults } from '../rules/transaction';
import config from '../../config';

export class RelationshipManager {
    static async getRelationshipById(id: string) {
        const relationship = await Neo4jClient.readTransaction(
            `MATCH (s)-[r]->(d) WHERE r._id='${id}' RETURN r, s, d`,
            normalizeReturnedRelationship('singleResponse'),
        );

        if (!relationship) {
            throw new NotFoundError(`[NEO4J] relationship "${id}" not found`);
        }

        return relationship;
    }

    static async getRelationshipsConnectionsById(ids: string[]) {
        return Neo4jClient.readTransaction(
            `MATCH (s)-[r]->(d) WHERE r._id IN [${ids.map((id) => `'${id}'`).join(',')}] RETURN s, r, d`,
            normalizeRelAndEntitiesForRule,
        );
    }

    static async getRelationshipsCountByTemplateId(templateId: string) {
        return Neo4jClient.readTransaction(`MATCH ()-[r: \`${templateId}\`]->() RETURN count(r)`, normalizeResponseCount);
    }

    private static getRuleQueryByRelId = async (
        transaction: Transaction,
        templateId: string,
        sourceEntityId: string,
        destinationEntityId: string,
    ) => {
        const pathsConnectedWithRelIdRules = await searchRuleTemplates({ relationshipTemplateIds: [templateId] });

        if (!pathsConnectedWithRelIdRules.length) {
            return [];
        }

        const pathsWithRelId = await transactionRunAndNormalize(
            transaction,
            `MATCH (s {_id: '${sourceEntityId}'})-[r: \`${templateId}\`]->(d {_id: '${destinationEntityId}'}) RETURN s, r, d`,
            normalizeRelAndEntitiesForRule,
        );

        return createRulesQueries(pathsWithRelId, pathsConnectedWithRelIdRules);
    };

    private static getRuleQueryBySourceId = async (
        transaction: Transaction,
        relationshipTemplate: IMongoRelationshipTemplate,
        sourceEntityId: string,
        destinationEntityId: string,
    ) => {
        const pathsConnectedToSourceIdRules = await searchRuleTemplates({ pinnedEntityTemplateIds: [relationshipTemplate.sourceEntityId] });
        const relevantRules = filterDependentRules(pathsConnectedToSourceIdRules, relationshipTemplate._id);

        if (!relevantRules.length) {
            return [];
        }

        const pathsConnectedToSourceId = await transactionRunAndNormalize(
            transaction,
            `MATCH (s {_id: '${sourceEntityId}'})-[r]-(d) WHERE d._id <> '${destinationEntityId}' RETURN s, r, d`,
            normalizeRelAndEntitiesForRule,
        );

        return createRulesQueries(pathsConnectedToSourceId, relevantRules);
    };

    private static getRuleQueryByDestId = async (
        transaction: Transaction,
        relationshipTemplate: IMongoRelationshipTemplate,
        sourceEntityId: string,
        destinationEntityId: string,
    ) => {
        const pathsConnectedToDestIdRules = await searchRuleTemplates({ pinnedEntityTemplateIds: [relationshipTemplate.destinationEntityId] });
        const relevantRules = filterDependentRules(pathsConnectedToDestIdRules, relationshipTemplate._id);

        if (!relevantRules.length) {
            return [];
        }

        const pathsConnectedToDestId = await transactionRunAndNormalize(
            transaction,
            `MATCH (s)-[r]-(d {_id: '${destinationEntityId}'}) WHERE s._id <> '${sourceEntityId}' RETURN s, r, d`,
            normalizeRelAndEntitiesForRule,
        );

        return createRulesQueries(pathsConnectedToDestId, relevantRules);
    };

    private static async verifyRuleForRelationshipCreation(
        transaction: Transaction,
        relationshipTemplate: IMongoRelationshipTemplate,
        createdRelationship: IRelationship,
        ignoredRules: IBrokenRule[],
    ) {
        const { sourceEntityId, destinationEntityId, properties } = createdRelationship;

        const ruleQueryByRelId = await RelationshipManager.getRuleQueryByRelId(
            transaction,
            relationshipTemplate._id,
            sourceEntityId,
            destinationEntityId,
        );
        const ruleQueryBySourceId = await RelationshipManager.getRuleQueryBySourceId(
            transaction,
            relationshipTemplate,
            sourceEntityId,
            destinationEntityId,
        );
        const ruleQueryByDestId = await RelationshipManager.getRuleQueryByDestId(
            transaction,
            relationshipTemplate,
            sourceEntityId,
            destinationEntityId,
        );
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
            const countOfExistingRelationships = await transactionRunAndNormalize(
                transaction,
                `MATCH ({_id: '${sourceEntityId}'})-[r: \`${templateId}\`]->({_id: '${destinationEntityId}'}) return count(r)`,
                normalizeResponseCount,
            );

            if (countOfExistingRelationships > 0) {
                throw new ServiceError(400, `[NEO4J] relationship already exists between requested entities.`, {
                    errorCode: config.errorCodes.relationshipAlreadyExists,
                });
            }

            const createdRelationship = await transactionRunAndNormalize(
                transaction,
                `MATCH (s {_id: '${sourceEntityId}'}),(d {_id: '${destinationEntityId}'})
                 MERGE (s)-[r: \`${templateId}\`]->(d)
                 ON CREATE SET r = $relProps
                 RETURN r, s, d`,
                normalizeReturnedRelationship('singleResponse'),
                { relProps: { ...properties, ...generateDefaultProperties() } },
            );

            await RelationshipManager.verifyRuleForRelationshipCreation(transaction, relationshipTemplate, createdRelationship, ignoredRules);

            return createdRelationship;
        });
    }

    private static async verifyRuleForRelationshipDeletion(
        transaction: Transaction,
        deletedRelationship: IRelationship,
        ignoredRules: IBrokenRule[],
    ) {
        const { sourceEntityId, destinationEntityId, templateId } = deletedRelationship;

        const relationshipTemplate = await getRelationshipTemplateById(templateId);

        const ruleQueryBySourceId = await RelationshipManager.getRuleQueryBySourceId(
            transaction,
            relationshipTemplate,
            sourceEntityId,
            destinationEntityId,
        );
        const ruleQueryByDestId = await RelationshipManager.getRuleQueryByDestId(
            transaction,
            relationshipTemplate,
            sourceEntityId,
            destinationEntityId,
        );
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
            const relationship = await transactionRunAndNormalize(
                transaction,
                `MATCH (s)-[r]->(d)
                 WHERE r._id='${id}' with *, properties(r) as rProps, type(r) as rType
                 DELETE r 
                 RETURN rProps, rType, s, d`,
                normalizeReturnedDeletedRelationship,
            );

            if (!relationship) {
                throw new NotFoundError(`[NEO4J] relationship "${id}" not found`);
            }

            await RelationshipManager.verifyRuleForRelationshipDeletion(transaction, relationship, ignoredRules);

            return relationship;
        });
    }

    static async updateRelationshipPropertiesById(id: string, relationshipProperties: object) {
        const edge = await Neo4jClient.writeTransaction(
            `MATCH (s)-[r]->(d) WHERE r._id='${id}' SET r += $props RETURN r, s, d`,
            normalizeReturnedRelationship('singleResponse'),
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
