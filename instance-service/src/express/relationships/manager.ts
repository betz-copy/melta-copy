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
import { runRulesOnRelationshipsOfPinnedEntity, runRulesOnRelationship, throwIfActionCausedBrokenRules } from '../rules/lib';
import { IBrokenRule, IRuleFailureWithCauses } from '../rules/interfaces';
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

    private static runRulesOnRelationship = async (
        transaction: Transaction,
        relationshipTemplate: IMongoRelationshipTemplate,
        sourceEntityId: string,
        destinationEntityId: string,
        relationshipId: string,
    ): Promise<IRuleFailureWithCauses[]> => {
        const rulesOfRelationship = await RelationshipsTemplateManagerService.searchRules({
            relationshipTemplateIds: [relationshipTemplate._id],
        });

        const ruleFailures = await runRulesOnRelationship(
            transaction,
            rulesOfRelationship,
            sourceEntityId,
            destinationEntityId,
            relationshipId,
            relationshipTemplate.sourceEntityId,
        );

        return ruleFailures.map((ruleFailure) => ({ ...ruleFailure, isTriggeredViaAggregation: false }));
    };

    // todo: use in update entity?
    private static runRulesOfPinnedEntityDependentViaAggregation = async (
        transaction: Transaction,
        pinnedEntityId: string,
        pinnedEntityTemplateId: string,
        dependentRelationshipTemplateId: string,
        excludedUnpinnedEntityId?: string,
    ): Promise<IRuleFailureWithCauses[]> => {
        const rulesOfPinnedEntity = await RelationshipsTemplateManagerService.searchRules({
            pinnedEntityTemplateIds: [pinnedEntityTemplateId],
        });

        const relevantRules = filterDependentRulesViaAggregation(rulesOfPinnedEntity, dependentRelationshipTemplateId);

        const ruleFailures = await runRulesOnRelationshipsOfPinnedEntity(transaction, pinnedEntityId, relevantRules, excludedUnpinnedEntityId);
        return ruleFailures.map((ruleFailure) => ({ ...ruleFailure, isTriggeredViaAggregation: true }));
    };

    private static async runRulesDependOnRelationship(
        transaction: Transaction,
        relationshipTemplate: IMongoRelationshipTemplate,
        sourceEntityId: string,
        destinationEntityId: string,
        relationshipId?: string, // undefined when running rules before relationship created or after was deleted
    ) {
        const ruleFailuresAgainstRelationshipPromise = relationshipId
            ? RelationshipManager.runRulesOnRelationship(transaction, relationshipTemplate, sourceEntityId, destinationEntityId, relationshipId)
            : Promise.resolve([]);

        const ruleFailuresAgainstSourceEntityPromise = RelationshipManager.runRulesOfPinnedEntityDependentViaAggregation(
            transaction,
            sourceEntityId,
            relationshipTemplate.sourceEntityId,
            relationshipTemplate._id,
            destinationEntityId,
        );

        const ruleFailuresAgainstDestinationEntityPromise = RelationshipManager.runRulesOfPinnedEntityDependentViaAggregation(
            transaction,
            destinationEntityId,
            relationshipTemplate.destinationEntityId,
            relationshipTemplate._id,
            sourceEntityId,
        );

        const [ruleFailuresAgainstCreatedRelationship, ruleFailuresAgainstSourceEntity, ruleFailuresAgainstDestinationEntity] = await Promise.all([
            ruleFailuresAgainstRelationshipPromise,
            ruleFailuresAgainstSourceEntityPromise,
            ruleFailuresAgainstDestinationEntityPromise,
        ]);

        const ruleFailures = [...ruleFailuresAgainstCreatedRelationship, ...ruleFailuresAgainstSourceEntity, ...ruleFailuresAgainstDestinationEntity];
        return ruleFailures;
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

            const ruleFailuresBeforeAction = await RelationshipManager.runRulesDependOnRelationship(
                transaction,
                relationshipTemplate,
                sourceEntityId,
                destinationEntityId,
            );

            const createdRelationship = await runInTransactionAndNormalize(
                transaction,
                `MATCH (s {_id: '${sourceEntityId}'}),(d {_id: '${destinationEntityId}'})
                 MERGE (s)-[r: \`${templateId}\`]->(d)
                 ON CREATE SET r = $relProps
                 RETURN r, s, d`,
                normalizeReturnedRelationship('singleResponseNotNullable'),
                { relProps: { ...properties, ...generateDefaultProperties() } },
            );

            const ruleFailuresAfterAction = await RelationshipManager.runRulesDependOnRelationship(
                transaction,
                relationshipTemplate,
                sourceEntityId,
                destinationEntityId,
                createdRelationship.properties._id,
            );

            throwIfActionCausedBrokenRules(ignoredRules, ruleFailuresBeforeAction, ruleFailuresAfterAction, createdRelationship.properties._id);

            return createdRelationship;
        });
    }

    static async deleteRelationshipById(id: string, ignoredRules: IBrokenRule[]) {
        return Neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
            const relationship = await Neo4jClient.readTransaction(
                `MATCH (s)-[r]->(d) WHERE r._id='${id}' RETURN r, s, d`,
                normalizeReturnedRelationship('singleResponse'),
            );

            if (!relationship) {
                throw new NotFoundError(`[NEO4J] relationship "${id}" not found`);
            }

            const relationshipTemplate = await RelationshipsTemplateManagerService.getRelationshipTemplateById(relationship.templateId);

            const ruleFailuresBeforeAction = await RelationshipManager.runRulesDependOnRelationship(
                transaction,
                relationshipTemplate,
                relationship.sourceEntityId,
                relationship.destinationEntityId,
                relationship.properties._id,
            );

            const deletedRelationship = await runInTransactionAndNormalize(
                transaction,
                `MATCH (s)-[r]->(d)
                 WHERE r._id='${id}' with *, properties(r) as rProps, type(r) as rType
                 DELETE r 
                 RETURN rProps, rType, s, d`,
                normalizeReturnedDeletedRelationship,
            );

            // just to make sure wasnt deleted after first check
            if (!deletedRelationship) {
                throw new NotFoundError(`[NEO4J] relationship "${id}" not found`);
            }

            const ruleFailuresAfterAction = await RelationshipManager.runRulesDependOnRelationship(
                transaction,
                relationshipTemplate,
                relationship.sourceEntityId,
                relationship.destinationEntityId,
            );

            throwIfActionCausedBrokenRules(ignoredRules, ruleFailuresBeforeAction, ruleFailuresAfterAction);

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
