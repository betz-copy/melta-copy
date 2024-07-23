import { Transaction } from 'neo4j-driver';
import config from '../../config';
import { createActivityLog } from '../../externalServices/activityLog/producer';
import { IMongoRelationshipTemplate } from '../../externalServices/templates/interfaces/relationshipTemplates';
import { RelationshipsTemplateManagerService } from '../../externalServices/templates/relationshipTemplateManager';
import {
    generateDefaultProperties,
    getNeo4jDateTime,
    normalizeResponseCount,
    normalizeReturnedDeletedRelationship,
    normalizeReturnedRelationship,
    runInTransactionAndNormalize,
} from '../../utils/neo4j/lib';
import DefaultManagerNeo4j from '../../utils/neo4j/manager';
import { NotFoundError, ServiceError } from '../error';
import { filterDependentRulesViaAggregation } from '../rules/getParametersOfFormula';
import { IBrokenRule, IRuleFailure } from '../rules/interfaces';
import { runRulesOnEntity } from '../rules/runRulesOnEntity';
import { throwIfActionCausedRuleFailures } from '../rules/throwIfActionCausedRuleFailures';
import { IRelationship } from './interface';

export class RelationshipManager extends DefaultManagerNeo4j {
    private relationshipsTemplateManagerService: RelationshipsTemplateManagerService;

    constructor(dbName: string) {
        super(dbName);
        this.relationshipsTemplateManagerService = new RelationshipsTemplateManagerService(dbName);
    }

    async getRelationshipById(id: string) {
        const relationship = await this.neo4jClient.readTransaction(
            `MATCH (s)-[r]->(d) WHERE r._id='${id}' RETURN r, s, d`,
            normalizeReturnedRelationship('singleResponse'),
        );

        if (!relationship) {
            throw new NotFoundError(`[NEO4J] relationship "${id}" not found`);
        }

        return relationship;
    }

    async getRelationshipByEntitiesAndTemplate(sourceEntityId: string, destEntityId: string, templateId: string, transaction: Transaction) {
        const relationship = await runInTransactionAndNormalize(
            transaction,
            `MATCH (s {_id: '${sourceEntityId}'})-[r: \`${templateId}\`]->(d {_id: '${destEntityId}'}) RETURN r, s, d`,
            normalizeReturnedRelationship('singleResponse'),
        );

        if (!relationship) throw new NotFoundError(`[NEO4J] relationship not found by provided entities and template`);

        return relationship;
    }

    async getRelationshipsByIds(ids: string[]) {
        return this.neo4jClient.readTransaction(
            `MATCH (s)-[r]->(d) WHERE r._id IN $ids RETURN s, r, d`,
            normalizeReturnedRelationship('multipleResponses'),
            { ids },
        );
    }

    async getRelationshipsCountByTemplateId(templateId: string) {
        return this.neo4jClient.readTransaction(`MATCH ()-[r: \`${templateId}\`]->() RETURN count(r)`, normalizeResponseCount);
    }

    runRulesOnEntityDependentViaAggregation = async (
        transaction: Transaction,
        entityId: string,
        entityTemplateId: string,
        dependentRelationshipTemplateId: string,
        updatedProperties?: string[],
    ): Promise<IRuleFailure[]> => {
        const rulesOfEntity = await this.relationshipsTemplateManagerService.searchRules({
            entityTemplateIds: [entityTemplateId],
        });

        const relevantRules = filterDependentRulesViaAggregation(rulesOfEntity, dependentRelationshipTemplateId, updatedProperties);

        return runRulesOnEntity(transaction, entityId, relevantRules);
    };

    private async runRulesDependOnRelationship(
        transaction: Transaction,
        relationshipTemplate: IMongoRelationshipTemplate,
        sourceEntityId: string,
        destinationEntityId: string,
    ) {
        const ruleFailuresOnSourceEntityPromise = this.runRulesOnEntityDependentViaAggregation(
            transaction,
            sourceEntityId,
            relationshipTemplate.sourceEntityId,
            relationshipTemplate._id,
        );

        const ruleFailuresOnDestinationEntityPromise = this.runRulesOnEntityDependentViaAggregation(
            transaction,
            destinationEntityId,
            relationshipTemplate.destinationEntityId,
            relationshipTemplate._id,
        );

        const ruleFailures = await Promise.all([ruleFailuresOnSourceEntityPromise, ruleFailuresOnDestinationEntityPromise]);

        return ruleFailures.flat();
    }

    async createRelationshipByEntityIdsInTransaction(
        relationship: IRelationship,
        relationshipTemplate: IMongoRelationshipTemplate,
        ignoredRules: IBrokenRule[],
        transaction: Transaction,
    ) {
        const { templateId, properties, sourceEntityId, destinationEntityId } = relationship;

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

        const ruleFailuresBeforeAction = await this.runRulesDependOnRelationship(
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

        const ruleFailuresAfterAction = await this.runRulesDependOnRelationship(
            transaction,
            relationshipTemplate,
            sourceEntityId,
            destinationEntityId,
        );

        throwIfActionCausedRuleFailures(ignoredRules, ruleFailuresBeforeAction, ruleFailuresAfterAction, {
            createdRelationshipId: createdRelationship.properties._id,
        });

        return createdRelationship;
    }

    async createRelationshipByEntityIds(
        relationship: IRelationship,
        relationshipTemplate: IMongoRelationshipTemplate,
        ignoredRules: IBrokenRule[],
        userId: string,
    ) {
        const createdRelationship = await this.neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
            return this.createRelationshipByEntityIdsInTransaction(relationship, relationshipTemplate, ignoredRules, transaction);
        });

        const updatedFields = {
            action: 'CREATE_RELATIONSHIP' as const,
            timestamp: new Date(),
            userId,
            metadata: {
                relationshipTemplateId: createdRelationship.templateId,
                relationshipId: createdRelationship.properties._id,
            },
        };

        await createActivityLog({
            ...updatedFields,
            entityId: createdRelationship.sourceEntityId,
            metadata: { ...updatedFields.metadata, entityId: createdRelationship.destinationEntityId },
        });

        await createActivityLog({
            ...updatedFields,
            entityId: createdRelationship.destinationEntityId,
            metadata: { ...updatedFields.metadata, entityId: createdRelationship.sourceEntityId },
        });

        return createdRelationship;
    }

    async deleteRelationshipByIdInTransaction(id: string, ignoredRules: IBrokenRule[], transaction: Transaction) {
        const relationship = await runInTransactionAndNormalize(
            transaction,
            `MATCH (s)-[r]->(d) WHERE r._id='${id}' RETURN r, s, d`,
            normalizeReturnedRelationship('singleResponse'),
        );

        if (!relationship) {
            throw new NotFoundError(`[NEO4J] relationship "${id}" not found`);
        }

        const relationshipTemplate = await this.relationshipsTemplateManagerService.getRelationshipTemplateById(relationship.templateId);

        const ruleFailuresBeforeAction = await this.runRulesDependOnRelationship(
            transaction,
            relationshipTemplate,
            relationship.sourceEntityId,
            relationship.destinationEntityId,
        );

        const deletedRelationship = await runInTransactionAndNormalize(
            transaction,
            `MATCH (s)-[r]->(d)
             WHERE r._id='${id}' WITH *, properties(r) as rProps, type(r) as rType
             DELETE r 
             RETURN rProps, rType, s, d`,
            normalizeReturnedDeletedRelationship,
        );

        // Ensure the relationship was deleted
        if (!deletedRelationship) {
            throw new NotFoundError(`[NEO4J] relationship "${id}" not found`);
        }

        const ruleFailuresAfterAction = await this.runRulesDependOnRelationship(
            transaction,
            relationshipTemplate,
            relationship.sourceEntityId,
            relationship.destinationEntityId,
        );

        throwIfActionCausedRuleFailures(ignoredRules, ruleFailuresBeforeAction, ruleFailuresAfterAction, {});

        return relationship;
    }

    async deleteRelationshipById(id: string, ignoredRules: IBrokenRule[], userId: string) {
        const removedRelationship = await this.neo4jClient.performComplexTransaction('writeTransaction', (transaction) => {
            return this.deleteRelationshipByIdInTransaction(id, ignoredRules, transaction);
        });

        const updatedFields = {
            action: 'DELETE_RELATIONSHIP' as const,
            timestamp: new Date(),
            userId,
            metadata: {
                relationshipTemplateId: removedRelationship.templateId,
                relationshipId: removedRelationship.properties._id,
            },
        };
        await createActivityLog({
            ...updatedFields,
            entityId: removedRelationship.sourceEntityId,
            metadata: { ...updatedFields.metadata, entityId: removedRelationship.destinationEntityId },
        });
        await createActivityLog({
            ...updatedFields,
            entityId: removedRelationship.destinationEntityId,
            metadata: { ...updatedFields.metadata, entityId: removedRelationship.sourceEntityId },
        });

        return removedRelationship;
    }

    async updateRelationshipPropertiesById(id: string, relationshipProperties: object) {
        const edge = await this.neo4jClient.writeTransaction(
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
