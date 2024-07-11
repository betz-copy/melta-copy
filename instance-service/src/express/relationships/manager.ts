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
import { ActionType, IAction, IRelationship } from './interface';
import { NotFoundError, ServiceError } from '../error';
import EntityManager from '../entities/manager';
import { IEntity } from '../entities/interface';
import { EntityTemplateManagerService } from '../../externalServices/templates/entityTemplateManager';
import { runRulesOnEntity } from '../rules/runRulesOnEntity';
import { areAllBrokenRulesIgnored, throwIfActionCausedRuleFailures } from '../rules/throwIfActionCausedRuleFailures';
import { IBrokenRule, IRuleFailure } from '../rules/interfaces';
import { filterDependentRulesViaAggregation } from '../rules/getParametersOfFormula';
import config from '../../config';
import { RelationshipsTemplateManagerService } from '../../externalServices/templates/relationshipTemplateManager';
import { IMongoRelationshipTemplate } from '../../externalServices/templates/interfaces/relationshipTemplates';

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

    static runRulesOnEntityDependentViaAggregation = async (
        transaction: Transaction,
        entityId: string,
        entityTemplateId: string,
        dependentRelationshipTemplateId: string,
        updatedProperties?: string[],
    ): Promise<IRuleFailure[]> => {
        const rulesOfEntity = await RelationshipsTemplateManagerService.searchRules({
            entityTemplateIds: [entityTemplateId],
        });

        const relevantRules = filterDependentRulesViaAggregation(rulesOfEntity, dependentRelationshipTemplateId, updatedProperties);

        return runRulesOnEntity(transaction, entityId, relevantRules);
    };

    private static async runRulesDependOnRelationship(
        transaction: Transaction,
        relationshipTemplate: IMongoRelationshipTemplate,
        sourceEntityId: string,
        destinationEntityId: string,
    ) {
        const ruleFailuresOnSourceEntityPromise = RelationshipManager.runRulesOnEntityDependentViaAggregation(
            transaction,
            sourceEntityId,
            relationshipTemplate.sourceEntityId,
            relationshipTemplate._id,
        );

        const ruleFailuresOnDestinationEntityPromise = RelationshipManager.runRulesOnEntityDependentViaAggregation(
            transaction,
            destinationEntityId,
            relationshipTemplate.destinationEntityId,
            relationshipTemplate._id,
        );

        const ruleFailures = await Promise.all([ruleFailuresOnSourceEntityPromise, ruleFailuresOnDestinationEntityPromise]);

        return ruleFailures.flat();
    }

    static async validateCreateRelationshipDuplicate(transaction: Transaction, templateId: string, sourceEntityId: string, destinationEntityId: string) {
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
    }

    static createRelationshipInTransaction(transaction: Transaction, relationship: IRelationship) {
        const { templateId, properties, sourceEntityId, destinationEntityId } = relationship;

        return runInTransactionAndNormalize(
            transaction,
            `MATCH (s {_id: '${sourceEntityId}'}),(d {_id: '${destinationEntityId}'})
             MERGE (s)-[r: \`${templateId}\`]->(d)
             ON CREATE SET r = $relProps
             RETURN r, s, d`,
            normalizeReturnedRelationship('singleResponseNotNullable'),
            { relProps: { ...properties, ...generateDefaultProperties() } },
        );
    }

    static async createRelationshipByEntityIds(
        relationship: IRelationship,
        relationshipTemplate: IMongoRelationshipTemplate,
        ignoredRules: IBrokenRule[],
    ) {
        const { templateId, sourceEntityId, destinationEntityId } = relationship;

        return Neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
            await RelationshipManager.validateCreateRelationshipDuplicate(transaction, templateId, sourceEntityId, destinationEntityId);

            const ruleFailuresBeforeAction = await RelationshipManager.runRulesDependOnRelationship(
                transaction,
                relationshipTemplate,
                sourceEntityId,
                destinationEntityId,
            );

            const createdRelationship = await RelationshipManager.createRelationshipInTransaction(transaction, relationship);

            const ruleFailuresAfterAction = await RelationshipManager.runRulesDependOnRelationship(
                transaction,
                relationshipTemplate,
                sourceEntityId,
                destinationEntityId,
            );

            throwIfActionCausedRuleFailures(ignoredRules, ruleFailuresBeforeAction, ruleFailuresAfterAction, {
                createdRelationshipId: createdRelationship.properties._id,
            });

            return createdRelationship;
        });
    }

    static getRelationshipByResults(relationship: IRelationship, results: (IEntity | IRelationship | IBrokenRule[])[]) {
        const relationshipToReturn: IRelationship = relationship;
        if (relationship.destinationEntityId.startsWith('$')) {
            relationshipToReturn.destinationEntityId = (results[relationship.destinationEntityId[1]] as IEntity).properties._id;
        }
        if (relationship.sourceEntityId.startsWith('$')) {
            relationshipToReturn.sourceEntityId = (results[relationship.sourceEntityId[1]] as IEntity).properties._id;
        }

        return relationshipToReturn;
    }

    static async runBulkOfActionsInTransaction(actions: IAction[], ignoredRules: IBrokenRule[], transaction: Transaction) {
        const results: (IEntity | IRelationship | IBrokenRule[])[] = [];
        const brokenRules: IBrokenRule[] = [];

        // TODO - run broken rules before and after

        for (let i = 0; i < actions.length; i += 1) {
            const action = actions[i];
            if (action.actionType === ActionType.CREATE_ENTITY) {
                const entityTemplate = await EntityTemplateManagerService.getEntityTemplateById((action.metadata.entity as IEntity).templateId);
                try {
                    results.push(await EntityManager.createEntityInTransaction(transaction, action.metadata.entity as IEntity, entityTemplate));
                } catch (error) {
                    if (error instanceof ServiceError && (error.metadata as any).errorCode === config.errorCodes.ruleBlock) {
                        results.push((error.metadata as any).brokenRules as IBrokenRule[]);
                        brokenRules.push(...((error.metadata as any).brokenRules as IBrokenRule[]));
                    }
                }
            } else {
                const relationshipTemplate = await RelationshipsTemplateManagerService.getRelationshipTemplateById(
                    (action.metadata.relationship as IRelationship).templateId,
                );
                try {
                    results.push(
                        await RelationshipManager.createRelationshipInTransaction(
                            transaction,
                            RelationshipManager.getRelationshipByResults(action.metadata.relationship as IRelationship, results),
                            relationshipTemplate,
                            [],
                        ),
                    );
                } catch (error) {
                    if (error instanceof ServiceError && (error.metadata as any).errorCode === config.errorCodes.ruleBlock) {
                        results.push((error.metadata as any).brokenRules as IBrokenRule[]);
                        brokenRules.push(...((error.metadata as any).brokenRules as IBrokenRule[])); // TODO - broken rules array foreach action
                    }
                }
            }
        }

        console.log({ignoredRules});

        // TODO
        if (!areAllBrokenRulesIgnored(brokenRules, ignoredRules)) {
        //     throw new ServiceError(400, `[NEO4J] action is blocked by rules.`, {
        //         errorCode: config.errorCodes.ruleBlock,
        //         brokenRules,
        //     });
            console.log('not all rules are ignored...');
        }

        return brokenRules;
    }

    static async runBulkOfActionsInMultipleTransactions(actionsGroups: IAction[][], ignoredRules: IBrokenRule[], dryRun: boolean) {
        const transactionsPromises = actionsGroups.map((actionsGroup) =>
            Neo4jClient.performComplexTransaction(
                'writeTransaction',
                async (transaction) => {
                    return RelationshipManager.runBulkOfActionsInTransaction(actionsGroup, ignoredRules, transaction);
                },
                dryRun,
            ),
        );

        return Promise.all(transactionsPromises);
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

            throwIfActionCausedRuleFailures(ignoredRules, ruleFailuresBeforeAction, ruleFailuresAfterAction, {});

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
