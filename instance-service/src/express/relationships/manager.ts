import { Transaction } from 'neo4j-driver';
import Neo4jClient from '../../utils/neo4j';
import {
    generateDefaultProperties,
    getNeo4jDateTime,
    normalizeResponseCount,
    normalizeReturnedRelationship,
    normalizeReturnedDeletedRelationship,
    normalizeRelAndEntitiesForRule,
    runInTransactionAndNormalize,
} from '../../utils/neo4j/lib';
import { IRelationship } from './interface';
import { NotFoundError, ServiceError } from '../error';
import { getBrokenRules, areAllBrokenRulesIgnored, runRulesOnRelationshipsOfPinnedEntity, runRulesOnRelationship } from '../rules/lib';
import { IBrokenRule } from '../rules/interfaces';
import { filterDependentRulesViaAggregation } from '../rules/getParametersOfFormula';
import config from '../../config';
import { IMongoRelationshipTemplate, RelationshipsTemplateManagerService } from '../../externalServices/relationshipTemplateManager';

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

    private static runRulesOnCreatedRelationship = async (
        transaction: Transaction,
        relationshipTemplate: IMongoRelationshipTemplate,
        createdRelationship: IRelationship,
    ) => {
        const rulesOfRelationship = await RelationshipsTemplateManagerService.searchRules({
            relationshipTemplateIds: [relationshipTemplate._id],
        });

        return runRulesOnRelationship(transaction, rulesOfRelationship, createdRelationship, relationshipTemplate.sourceEntityId);
    };

    // todo: use in update entity?
    private static runRulesOfPinnedEntityDependentViaAggregation = async (
        transaction: Transaction,
        pinnedEntityId: string,
        pinnedEntityTemplateId: string,
        dependentRelationshipTemplateId: string,
        excludedUnpinnedEntityId?: string,
    ) => {
        const rulesOfPinnedEntity = await RelationshipsTemplateManagerService.searchRules({
            pinnedEntityTemplateIds: [pinnedEntityTemplateId],
        });

        const relevantRules = filterDependentRulesViaAggregation(rulesOfPinnedEntity, dependentRelationshipTemplateId);

        return runRulesOnRelationshipsOfPinnedEntity(transaction, pinnedEntityId, relevantRules, excludedUnpinnedEntityId);
    };

    private static async verifyRuleForRelationshipCreation(
        transaction: Transaction,
        relationshipTemplate: IMongoRelationshipTemplate,
        createdRelationship: IRelationship,
        ignoredRules: IBrokenRule[],
    ) {
        const { sourceEntityId, destinationEntityId, properties } = createdRelationship;

        const ruleResultsAgainstCreatedRelationshipPromise = RelationshipManager.runRulesOnCreatedRelationship(
            transaction,
            relationshipTemplate,
            createdRelationship,
        );

        const ruleResultsAgainstSourceEntityPromise = RelationshipManager.runRulesOfPinnedEntityDependentViaAggregation(
            transaction,
            sourceEntityId,
            relationshipTemplate.sourceEntityId,
            createdRelationship.templateId,
            destinationEntityId,
        );

        const ruleResultsAgainstDestinationEntityPromise = RelationshipManager.runRulesOfPinnedEntityDependentViaAggregation(
            transaction,
            destinationEntityId,
            relationshipTemplate.destinationEntityId,
            createdRelationship.templateId,
            sourceEntityId,
        );

        const [ruleResultsAgainstCreatedRelationship, ruleResultsAgainstSourceEntity, ruleResultsAgainstDestinationEntity] = await Promise.all([
            ruleResultsAgainstCreatedRelationshipPromise,
            ruleResultsAgainstSourceEntityPromise,
            ruleResultsAgainstDestinationEntityPromise,
        ]);
        const ruleResults = [...ruleResultsAgainstCreatedRelationship, ...ruleResultsAgainstSourceEntity, ...ruleResultsAgainstDestinationEntity];

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
            const countOfExistingRelationships = await runInTransactionAndNormalize(
                transaction,
                `MATCH ({_id: '${sourceEntityId}'})-[r: \`${templateId}\`]->({_id: '${destinationEntityId}'}) return count(r)`,
                normalizeResponseCount,
            );

            if (countOfExistingRelationships > 0) {
                throw new ServiceError(400, `[NEO4J] relationship already exists between requested entities.`, {
                    errorCode: config.errorCodes.relationshipAlreadyExists,
                });
            }

            const createdRelationship = await runInTransactionAndNormalize(
                transaction,
                `MATCH (s {_id: '${sourceEntityId}'}),(d {_id: '${destinationEntityId}'})
                 MERGE (s)-[r: \`${templateId}\`]->(d)
                 ON CREATE SET r = $relProps
                 RETURN r, s, d`,
                normalizeReturnedRelationship('singleResponseNotNullable'),
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

        const relationshipTemplate = await RelationshipsTemplateManagerService.getRelationshipTemplateById(templateId);

        const ruleResultsAgainstSourceEntityPromise = RelationshipManager.runRulesOfPinnedEntityDependentViaAggregation(
            transaction,
            sourceEntityId,
            relationshipTemplate.sourceEntityId,
            deletedRelationship.templateId,
        );

        const ruleResultsAgainstDestinationEntityPromise = RelationshipManager.runRulesOfPinnedEntityDependentViaAggregation(
            transaction,
            destinationEntityId,
            relationshipTemplate.destinationEntityId,
            deletedRelationship.templateId,
        );

        const [ruleResultsAgainstSourceEntity, ruleResultsAgainstDestinationEntity] = await Promise.all([
            ruleResultsAgainstSourceEntityPromise,
            ruleResultsAgainstDestinationEntityPromise,
        ]);

        const brokenRules = getBrokenRules([...ruleResultsAgainstSourceEntity, ...ruleResultsAgainstDestinationEntity]);

        if (!areAllBrokenRulesIgnored(brokenRules, ignoredRules)) {
            throw new ServiceError(400, `[NEO4J] relationship deletion is blocked by rules.`, {
                errorCode: config.errorCodes.ruleBlock,
                brokenRules,
            });
        }
    }

    static async deleteRelationshipById(id: string, ignoredRules: IBrokenRule[]) {
        return Neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
            const relationship = await runInTransactionAndNormalize(
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
