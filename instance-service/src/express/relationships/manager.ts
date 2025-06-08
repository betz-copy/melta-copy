/* eslint-disable no-await-in-loop */
import { Transaction } from 'neo4j-driver';
import {
    ActionsLog,
    IMongoRelationshipTemplate,
    IBrokenRule,
    IRelationship,
    IActivityLog,
    NotFoundError,
    BadRequestError,
} from '@microservices/shared';
import config from '../../config';
import ActivityLogProducer from '../../externalServices/activityLog/producer';
import RelationshipsTemplateManagerService from '../../externalServices/templates/relationshipTemplateManager';
import {
    generateDefaultProperties,
    getNeo4jDateTime,
    normalizeResponseCount,
    normalizeReturnedDeletedRelationship,
    normalizeReturnedRelationship,
    runInTransactionAndNormalize,
} from '../../utils/neo4j/lib';
import DefaultManagerNeo4j from '../../utils/neo4j/manager';
import EntityManager from '../entities/manager';
import { throwIfActionCausedRuleFailures } from '../rules/throwIfActionCausedRuleFailures';

class RelationshipManager extends DefaultManagerNeo4j {
    private relationshipsTemplateManagerService: RelationshipsTemplateManagerService;

    private activityLogProducer: ActivityLogProducer;

    constructor(workspaceId: string) {
        super(workspaceId);
        this.relationshipsTemplateManagerService = new RelationshipsTemplateManagerService(workspaceId);
        this.activityLogProducer = new ActivityLogProducer(workspaceId);
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

    async getRelationshipsByEntitiesAndTemplate(sourceEntityId: string, destEntityId: string, templateId: string) {
        const relationships = await this.neo4jClient.readTransaction(
            `MATCH (s: \`${sourceEntityId}\`)-[r: \`${templateId}\`]-(d: \`${destEntityId}\`) RETURN r, s, d`,
            normalizeReturnedRelationship('multipleResponses'),
        );

        if (!relationships) throw new NotFoundError(`[NEO4J] relationship not found by provided entities and template`);

        return relationships;
    }

    getRelationshipByEntitiesAndTemplate = async (sourceEntityId: string, destEntityId: string, templateId: string, transaction: Transaction) => {
        const relationship = await runInTransactionAndNormalize(
            transaction,
            `MATCH (s {_id: '${sourceEntityId}'})-[r: \`${templateId}\`]->(d {_id: '${destEntityId}'}) RETURN r, s, d`,
            normalizeReturnedRelationship('singleResponse'),
        );

        if (!relationship) throw new NotFoundError(`[NEO4J] relationship not found by provided entities and template`);

        return relationship;
    };

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

    async runRulesDependOnRelationship(
        transaction: Transaction,
        relationshipTemplate: IMongoRelationshipTemplate,
        sourceEntityId: string,
        destinationEntityId: string,
    ) {
        const entityManager = new EntityManager(this.workspaceId);

        const ruleFailuresOnSourceEntityPromise = entityManager.runRulesOnEntityDependentViaAggregation(
            transaction,
            sourceEntityId,
            relationshipTemplate.sourceEntityId,
            relationshipTemplate._id,
        );

        const ruleFailuresOnDestinationEntityPromise = entityManager.runRulesOnEntityDependentViaAggregation(
            transaction,
            destinationEntityId,
            relationshipTemplate.destinationEntityId,
            relationshipTemplate._id,
        );

        const ruleFailures = await Promise.all([ruleFailuresOnSourceEntityPromise, ruleFailuresOnDestinationEntityPromise]);

        return ruleFailures.flat();
    }

    validateCreateRelationshipDuplicate = async (
        transaction: Transaction,
        templateId: string,
        sourceEntityId: string,
        destinationEntityId: string,
    ) => {
        const countOfExistingRelationships = await runInTransactionAndNormalize(
            transaction,
            `MATCH ({_id: '${sourceEntityId}'})-[r: \`${templateId}\`]->({_id: '${destinationEntityId}'}) return count(r)`,
            normalizeResponseCount,
        );

        if (countOfExistingRelationships > 0) {
            throw new BadRequestError(`[NEO4J] relationship already exists between requested entities.`, {
                errorCode: config.errorCodes.relationshipAlreadyExists,
            });
        }
    };

    async createRelationshipByEntityIdsInTransaction(
        relationship: IRelationship,
        relationshipTemplate: IMongoRelationshipTemplate,
        ignoredRules: IBrokenRule[],
        transaction: Transaction,
        userId?: string,
    ) {
        const { templateId, sourceEntityId, destinationEntityId } = relationship;

        await this.validateCreateRelationshipDuplicate(transaction, templateId, sourceEntityId, destinationEntityId);

        const ruleFailuresBeforeAction = await this.runRulesDependOnRelationship(
            transaction,
            relationshipTemplate,
            sourceEntityId,
            destinationEntityId,
        );

        const { createdRelationship, activityLogsToCreate } = await this.createRelationshipInTransaction(transaction, relationship, userId);

        const ruleFailuresAfterAction = await this.runRulesDependOnRelationship(
            transaction,
            relationshipTemplate,
            sourceEntityId,
            destinationEntityId,
        );

        throwIfActionCausedRuleFailures(ignoredRules, ruleFailuresBeforeAction, ruleFailuresAfterAction, [
            {
                createdRelationshipId: createdRelationship.properties._id,
            },
        ]);

        return { createdRelationship, activityLogsToCreate };
    }

    createRelationshipInTransaction = async (transaction: Transaction, relationship: IRelationship, userId?: string) => {
        const { templateId, properties, sourceEntityId, destinationEntityId } = relationship;

        const activityLogsToCreate: Omit<IActivityLog, '_id'>[] = [];

        const createdRelationship = await runInTransactionAndNormalize(
            transaction,
            `MATCH (s {_id: '${sourceEntityId}'}),(d {_id: '${destinationEntityId}'})
                 MERGE (s)-[r: \`${templateId}\`]->(d)
                 ON CREATE SET r = $relProps
                 RETURN r, s, d`,
            normalizeReturnedRelationship('singleResponseNotNullable'),
            { relProps: { ...properties, ...generateDefaultProperties() } },
        );

        if (userId) {
            const updatedFields = {
                action: ActionsLog.CREATE_RELATIONSHIP,
                timestamp: new Date(),
                userId,
                metadata: {
                    relationshipTemplateId: createdRelationship.templateId,
                    relationshipId: createdRelationship.properties._id,
                },
            };

            activityLogsToCreate.push({
                ...updatedFields,
                entityId: createdRelationship.sourceEntityId,
                metadata: { ...updatedFields.metadata, entityId: createdRelationship.destinationEntityId },
            });

            activityLogsToCreate.push({
                ...updatedFields,
                entityId: createdRelationship.destinationEntityId,
                metadata: { ...updatedFields.metadata, entityId: createdRelationship.sourceEntityId },
            });
        }

        return { createdRelationship, activityLogsToCreate };
    };

    async createRelationshipByEntityIds(
        relationship: IRelationship,
        relationshipTemplate: IMongoRelationshipTemplate,
        ignoredRules: IBrokenRule[],
        userId: string,
    ) {
        return this.neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
            const { createdRelationship, activityLogsToCreate } = await this.createRelationshipByEntityIdsInTransaction(
                relationship,
                relationshipTemplate,
                ignoredRules,
                transaction,
                userId,
            );

            const activityLogsPromises = activityLogsToCreate.map((activityLogToCreate) =>
                this.activityLogProducer.createActivityLog(activityLogToCreate),
            );
            await Promise.all(activityLogsPromises);

            return createdRelationship;
        });
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

        throwIfActionCausedRuleFailures(ignoredRules, ruleFailuresBeforeAction, ruleFailuresAfterAction, [{}]);

        return relationship;
    }

    async deleteRelationshipById(id: string, ignoredRules: IBrokenRule[], userId: string) {
        const removedRelationship = await this.neo4jClient.performComplexTransaction('writeTransaction', (transaction) => {
            return this.deleteRelationshipByIdInTransaction(id, ignoredRules, transaction);
        });

        const updatedFields = {
            action: ActionsLog.DELETE_RELATIONSHIP,
            timestamp: new Date(),
            userId,
            metadata: {
                relationshipTemplateId: removedRelationship.templateId,
                relationshipId: removedRelationship.properties._id,
            },
        };
        await this.activityLogProducer.createActivityLog({
            ...updatedFields,
            entityId: removedRelationship.sourceEntityId,
            metadata: { ...updatedFields.metadata, entityId: removedRelationship.destinationEntityId },
        });
        await this.activityLogProducer.createActivityLog({
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

    async deleteRelationshipByTemplateIds(transaction: Transaction, templateIds: string[]) {
        return runInTransactionAndNormalize(
            transaction,
            `MATCH (s)-[r]->(d)
             WHERE type(r) IN $templateIds
             WITH *, properties(r) as rProps, type(r) as rType
             DELETE r 
             RETURN rProps, rType, s, d`,
            normalizeReturnedDeletedRelationship,
            { templateIds },
        );
    }
}

export default RelationshipManager;
