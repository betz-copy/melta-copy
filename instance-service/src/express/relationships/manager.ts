/* eslint-disable no-await-in-loop */
import { Transaction } from 'neo4j-driver';
import Neo4jClient from '../../utils/neo4j';
import {
    generateDefaultProperties,
    getNeo4jDateTime,
    normalizeResponseCount,
    normalizeReturnedRelationship,
    normalizeReturnedDeletedRelationship,
    runInTransactionAndNormalize,
} from '../../utils/neo4j/lib';
import { IRelationship } from './interfaces';
import { NotFoundError, ServiceError } from '../error';
import EntityManager from '../entities/manager';
import { IEntity } from '../entities/interface';
import { throwIfActionCausedRuleFailures } from '../rules/throwIfActionCausedRuleFailures';
import { IBrokenRule } from '../rules/interfaces';
import config from '../../config';
import { RelationshipsTemplateManagerService } from '../../externalServices/templates/relationshipTemplateManager';
import { IMongoRelationshipTemplate } from '../../externalServices/templates/interfaces/relationshipTemplates';
import { createActivityLog } from '../../externalServices/activityLog/producer';
import { ActionsLog, IActivityLog } from '../../externalServices/activityLog/interface';
import { StatusCodes } from 'http-status-codes';

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

    static async getRelationshipByEntitiesAndTemplate(sourceEntityId: string, destEntityId: string, templateId: string, transaction: Transaction) {
        const relationship = await runInTransactionAndNormalize(
            transaction,
            `MATCH (s {_id: '${sourceEntityId}'})-[r: \`${templateId}\`]->(d {_id: '${destEntityId}'}) RETURN r, s, d`,
            normalizeReturnedRelationship('singleResponse'),
        );

        if (!relationship) throw new NotFoundError(`[NEO4J] relationship not found by provided entities and template`);

        return relationship;
    }

    static async getRelationshipsByIds(ids: string[]) {
        return Neo4jClient.readTransaction(
            `MATCH (s)-[r]->(d) WHERE r._id IN $ids RETURN s, r, d`,
            normalizeReturnedRelationship('multipleResponses'),
            { ids },
        );
    }

    static async getRelationshipsCountByTemplateId(templateId: string) {
        return Neo4jClient.readTransaction(`MATCH ()-[r: \`${templateId}\`]->() RETURN count(r)`, normalizeResponseCount);
    }

    static async runRulesDependOnRelationship(
        transaction: Transaction,
        relationshipTemplate: IMongoRelationshipTemplate,
        sourceEntityId: string,
        destinationEntityId: string,
    ) {
        const ruleFailuresOnSourceEntityPromise = EntityManager.runRulesOnEntityDependentViaAggregation(
            transaction,
            sourceEntityId,
            relationshipTemplate.sourceEntityId,
            relationshipTemplate._id,
        );

        const ruleFailuresOnDestinationEntityPromise = EntityManager.runRulesOnEntityDependentViaAggregation(
            transaction,
            destinationEntityId,
            relationshipTemplate.destinationEntityId,
            relationshipTemplate._id,
        );

        const ruleFailures = await Promise.all([ruleFailuresOnSourceEntityPromise, ruleFailuresOnDestinationEntityPromise]);

        return ruleFailures.flat();
    }

    static async validateCreateRelationshipDuplicate(
        transaction: Transaction,
        templateId: string,
        sourceEntityId: string,
        destinationEntityId: string,
    ) {
        const countOfExistingRelationships = await runInTransactionAndNormalize(
            transaction,
            `MATCH ({_id: '${sourceEntityId}'})-[r: \`${templateId}\`]->({_id: '${destinationEntityId}'}) return count(r)`,
            normalizeResponseCount,
        );

        if (countOfExistingRelationships > 0) {
            throw new ServiceError(StatusCodes.BAD_REQUEST, `[NEO4J] relationship already exists between requested entities.`, {
                errorCode: config.errorCodes.relationshipAlreadyExists,
            });
        }
    }

    static async createRelationshipByEntityIdsInTransaction(
        relationship: IRelationship,
        relationshipTemplate: IMongoRelationshipTemplate,
        ignoredRules: IBrokenRule[],
        transaction: Transaction,
        userId: string,
    ) {
        const { templateId, sourceEntityId, destinationEntityId } = relationship;

        await RelationshipManager.validateCreateRelationshipDuplicate(transaction, templateId, sourceEntityId, destinationEntityId);

        const ruleFailuresBeforeAction = await RelationshipManager.runRulesDependOnRelationship(
            transaction,
            relationshipTemplate,
            sourceEntityId,
            destinationEntityId,
        );

        const { createdRelationship, activityLogsToCreate } = await RelationshipManager.createRelationshipInTransaction(
            transaction,
            relationship,
            userId,
        );

        const ruleFailuresAfterAction = await RelationshipManager.runRulesDependOnRelationship(
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

    static async createRelationshipInTransaction(transaction: Transaction, relationship: IRelationship, userId: string) {
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

        return { createdRelationship, activityLogsToCreate };
    }

    static async createRelationshipByEntityIds(
        relationship: IRelationship,
        relationshipTemplate: IMongoRelationshipTemplate,
        ignoredRules: IBrokenRule[],
        userId: string,
    ) {
        return Neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
            const { createdRelationship, activityLogsToCreate } = await RelationshipManager.createRelationshipByEntityIdsInTransaction(
                relationship,
                relationshipTemplate,
                ignoredRules,
                transaction,
                userId,
            );

            const activityLogsPromises = activityLogsToCreate.map((activityLogToCreate) => createActivityLog(activityLogToCreate));
            await Promise.all(activityLogsPromises);

            return createdRelationship;
        });
    }

    static getRelationshipByPrevResults(relationship: IRelationship, results: (IEntity | IRelationship)[]) {
        const relationshipToReturn: IRelationship = relationship;
        if (relationship.destinationEntityId.startsWith('$') && relationship.destinationEntityId.endsWith('._id')) {
            const numberPart = parseInt(relationship.destinationEntityId.slice(1, -4));
            relationshipToReturn.destinationEntityId = (results[numberPart] as IEntity).properties._id;
        }
        if (relationship.sourceEntityId.startsWith('$') && relationship.sourceEntityId.endsWith('._id')) {
            const numberPart = parseInt(relationship.sourceEntityId.slice(1, -4));
            relationshipToReturn.sourceEntityId = (results[numberPart] as IEntity).properties._id;
        }

        return relationshipToReturn;
    }

    static async deleteRelationshipByIdInTransaction(id: string, ignoredRules: IBrokenRule[], transaction: Transaction) {
        const relationship = await runInTransactionAndNormalize(
            transaction,
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

        const ruleFailuresAfterAction = await RelationshipManager.runRulesDependOnRelationship(
            transaction,
            relationshipTemplate,
            relationship.sourceEntityId,
            relationship.destinationEntityId,
        );

        throwIfActionCausedRuleFailures(ignoredRules, ruleFailuresBeforeAction, ruleFailuresAfterAction, [{}]);

        return relationship;
    }

    static async deleteRelationshipById(id: string, ignoredRules: IBrokenRule[], userId: string) {
        const removedRelationship = await Neo4jClient.performComplexTransaction('writeTransaction', (transaction) => {
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
