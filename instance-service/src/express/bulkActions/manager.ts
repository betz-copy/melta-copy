/* eslint-disable no-await-in-loop */
import { Transaction } from 'neo4j-driver';
import groupBy from 'lodash.groupby';
import Neo4jClient from '../../utils/neo4j';
import { IRelationship } from '../relationships/interfaces';
import { ActionTypes, IAction, ICreateEntityMetadata, ICreateRelationshipMetadata, IUpdateEntityMetadata } from '../relationships/interfaces/action';
import EntityManager from '../entities/manager';
import { EntitiesIdsRulesReasonsMap, IEntity } from '../entities/interface';
import { EntityTemplateManagerService } from '../../externalServices/templates/entityTemplateManager';
import { throwIfActionCausedRuleFailures } from '../rules/throwIfActionCausedRuleFailures';
import { IBrokenRule } from '../rules/interfaces';
import { RelationshipsTemplateManagerService } from '../../externalServices/templates/relationshipTemplateManager';
import { IMongoRelationshipTemplate } from '../../externalServices/templates/interfaces/relationshipTemplates';
import { IMongoEntityTemplate } from '../../externalServices/templates/interfaces/entityTemplates';
import RelationshipManager from '../relationships/manager';
import { IActivityLog } from '../../externalServices/activityLog/interface';
import { createActivityLog } from '../../externalServices/activityLog/producer';

export class BulkActionManager {
    static getRelationshipByPrevResults(relationship: IRelationship, results: (IEntity | IRelationship)[]) {
        const relationshipToReturn: IRelationship = relationship;
        if (relationship.destinationEntityId.startsWith('$') && relationship.destinationEntityId.endsWith('._id')) {
            const numberPart = parseInt(relationship.destinationEntityId.slice(1, -4), 10);
            relationshipToReturn.destinationEntityId = (results[numberPart] as IEntity).properties._id;
        }
        if (relationship.sourceEntityId.startsWith('$') && relationship.sourceEntityId.endsWith('._id')) {
            const numberPart = parseInt(relationship.sourceEntityId.slice(1, -4), 10);
            relationshipToReturn.sourceEntityId = (results[numberPart] as IEntity).properties._id;
        }

        return relationshipToReturn;
    }

    static getEntityIdByPrevResults(actionMetadata: IUpdateEntityMetadata, results: (IEntity | IRelationship)[]): IUpdateEntityMetadata {
        const { entityId, updatedFields, entityTemplateId } = actionMetadata;

        if (entityId.startsWith('$') && entityId.endsWith('._id')) {
            const numberPart = parseInt(entityId.slice(1, -4), 10);
            const createdEntity = results[numberPart] as IEntity;
            return { entityId: createdEntity.properties._id, before: createdEntity.properties, updatedFields, entityTemplateId };
        }

        return actionMetadata;
    }

    static getEntitiesIdsRulesReasonsBefore = async (actions: IAction[], relationshipsTemplatesByIds: Map<string, IMongoRelationshipTemplate>) => {
        const entitiesIdsRulesReasonsMapBeforeRunActions: EntitiesIdsRulesReasonsMap = new Map();

        const entitiesTemplatesIdsOfRules = new Set<string>();

        await Promise.all(
            actions.map(async (action) => {
                if (action.actionType === ActionTypes.CreateEntity) {
                    entitiesTemplatesIdsOfRules.add((action.actionMetadata as ICreateEntityMetadata).templateId);
                } else if (action.actionType === ActionTypes.CreateRelationship) {
                    const actionMetadata = action.actionMetadata as ICreateRelationshipMetadata;

                    const relationshipTemplate = relationshipsTemplatesByIds.get(actionMetadata.relationshipTemplateId)!;

                    const entitiesDatas = [
                        {
                            entityId: actionMetadata.sourceEntityId,
                            entityTemplateId: relationshipTemplate.sourceEntityId,
                        },
                        {
                            entityId: actionMetadata.destinationEntityId,
                            entityTemplateId: relationshipTemplate.destinationEntityId,
                        },
                    ].filter(({ entityId }) => {
                        return !entityId.startsWith('$'); // then it's entity that will be created in prev actions, so cant run rule on entity that doesnt exist
                    });

                    entitiesDatas.forEach((entityData) => {
                        entitiesTemplatesIdsOfRules.add(entityData.entityTemplateId);
                        const reasons = entitiesIdsRulesReasonsMapBeforeRunActions.get(entityData.entityId)?.reasons || [];
                        reasons.push({ type: 'dependentViaAggregation', dependentRelationshipTemplateId: actionMetadata.relationshipTemplateId });

                        entitiesIdsRulesReasonsMapBeforeRunActions.set(entityData.entityId, {
                            reasons,
                            entityTemplateId: entityData.entityTemplateId,
                        });
                    });
                } else if (action.actionType === ActionTypes.UpdateEntity) {
                    const actionMetadata = action.actionMetadata as IUpdateEntityMetadata;
                    if (actionMetadata.entityTemplateId) entitiesTemplatesIdsOfRules.add(actionMetadata.entityTemplateId);
                    else if (!actionMetadata.entityId.startsWith('$') && actionMetadata.entityId.endsWith('._id')) {
                        const entity = await EntityManager.getEntityById(actionMetadata.entityId);
                        const entityTemplate = await EntityTemplateManagerService.getEntityTemplateById(entity.templateId);
                        entitiesTemplatesIdsOfRules.add(entityTemplate._id);
                    }
                }
            }),
        );

        return { entitiesIdsRulesReasonsMapBeforeRunActions, entitiesTemplatesIdsOfRules };
    };

    static getEntitiesIdsRulesReasonsAfter = (
        actions: IAction[],
        results: (IEntity | IRelationship)[],
        relationshipsTemplatesByIds: Map<string, IMongoRelationshipTemplate>,
    ) => {
        const entitiesIdsRulesReasonsMapAfterRunActions: EntitiesIdsRulesReasonsMap = new Map();
        actions.forEach((action, i) => {
            if (action.actionType === ActionTypes.CreateEntity || action.actionType === ActionTypes.UpdateEntity) {
                const entity = results[i] as IEntity;

                const entityData = {
                    entityId: entity.properties._id,
                    entityTemplateId: entity.templateId,
                };

                const reasons = entitiesIdsRulesReasonsMapAfterRunActions.get(entityData.entityId)?.reasons || [];
                reasons.push({ type: 'dependentOnEntity' });

                entitiesIdsRulesReasonsMapAfterRunActions.set(entityData.entityId, { reasons, entityTemplateId: entityData.entityTemplateId });
            } else if (action.actionType === ActionTypes.CreateRelationship) {
                const relationship = results[i] as IRelationship;

                const relationshipTemplate = relationshipsTemplatesByIds.get(relationship.templateId)!;

                const entitiesDatas = [
                    {
                        entityId: relationship.sourceEntityId,
                        entityTemplateId: relationshipTemplate.sourceEntityId,
                    },
                    {
                        entityId: relationship.destinationEntityId,
                        entityTemplateId: relationshipTemplate.destinationEntityId,
                    },
                ];

                entitiesDatas.forEach((entityData) => {
                    const reasons = entitiesIdsRulesReasonsMapAfterRunActions.get(entityData.entityId)?.reasons || [];
                    reasons.push({ type: 'dependentViaAggregation', dependentRelationshipTemplateId: relationship.templateId });

                    entitiesIdsRulesReasonsMapAfterRunActions.set(entityData.entityId, { reasons, entityTemplateId: entityData.entityTemplateId });
                });
            }
        });

        return entitiesIdsRulesReasonsMapAfterRunActions;
    };

    static async runBulkOfActionsInTransaction(
        transaction: Transaction,
        actions: IAction[],
        entitiesTemplatesByIds: Map<string, IMongoEntityTemplate>,
        userId: string,
    ) {
        const results: (IEntity | IRelationship)[] = [];
        const allActivityLogsToCreate: Omit<IActivityLog, '_id'>[] = [];

        for (const action of actions) {
            switch (action.actionType) {
                case ActionTypes.CreateEntity: {
                    const actionMetadata = action.actionMetadata as ICreateEntityMetadata;

                    const { createdEntity, activityLogsToCreate } = await EntityManager.createEntityInTransaction(
                        transaction,
                        actionMetadata.properties,
                        entitiesTemplatesByIds.get(actionMetadata.templateId)!,
                        userId,
                    );

                    results.push(createdEntity);

                    allActivityLogsToCreate.push(...activityLogsToCreate);

                    break;
                }

                case ActionTypes.CreateRelationship: {
                    const actionMetadata = action.actionMetadata as ICreateRelationshipMetadata;
                    const relationship: IRelationship = {
                        templateId: actionMetadata.relationshipTemplateId,
                        sourceEntityId: actionMetadata.sourceEntityId,
                        destinationEntityId: actionMetadata.destinationEntityId,
                        properties: {},
                    };
                    const fixedRelationship = this.getRelationshipByPrevResults(relationship, results);

                    await RelationshipManager.validateCreateRelationshipDuplicate(
                        transaction,
                        fixedRelationship.templateId,
                        fixedRelationship.sourceEntityId,
                        fixedRelationship.destinationEntityId,
                    );

                    const { createdRelationship, activityLogsToCreate } = await RelationshipManager.createRelationshipInTransaction(
                        transaction,
                        fixedRelationship,
                        userId,
                    );

                    allActivityLogsToCreate.push(...activityLogsToCreate);

                    results.push(createdRelationship);
                    break;
                }

                case ActionTypes.UpdateEntity: {
                    const actionMetadata = action.actionMetadata as IUpdateEntityMetadata;
                    const fixedMetaData = this.getEntityIdByPrevResults(actionMetadata, results);
                    const { updatedEntity, activityLogsToCreate } = await EntityManager.handleUpdateEntity(fixedMetaData, transaction, userId);

                    results.push(updatedEntity);
                    allActivityLogsToCreate.push(...activityLogsToCreate);
                    break;
                }
                default:
                    break;
            }
        }

        return { results, allActivityLogsToCreate };
    }

    static async runBulkOfActions(actions: IAction[], ignoredRules: IBrokenRule[], dryRun: boolean, userId: string) {
        return Neo4jClient.performComplexTransaction(
            'writeTransaction',
            async (transaction) => {
                // collecting all relationshipTemplatesIds
                const entityTemplateIds: string[] = [];
                const relationshipTemplateIds: string[] = [];
                await Promise.all(
                    actions.map(async (action) => {
                        switch (action.actionType) {
                            case ActionTypes.CreateRelationship:
                                relationshipTemplateIds.push((action.actionMetadata as ICreateRelationshipMetadata).relationshipTemplateId);
                                break;

                            case ActionTypes.CreateEntity:
                                entityTemplateIds.push((action.actionMetadata as ICreateEntityMetadata).templateId);
                                break;

                            case ActionTypes.UpdateEntity: {
                                const actionMetadata = action.actionMetadata as IUpdateEntityMetadata;
                                if (actionMetadata.entityTemplateId) entityTemplateIds.push(actionMetadata.entityTemplateId);
                                else if (!actionMetadata.entityId.startsWith('$') && actionMetadata.entityId.endsWith('._id')) {
                                    const entity = await EntityManager.getEntityById(actionMetadata.entityId);
                                    const entityTemplate = await EntityTemplateManagerService.getEntityTemplateById(entity.templateId);
                                    entityTemplateIds.push(entityTemplate._id);
                                }

                                break;
                            }
                            default:
                                break;
                        }
                    }),
                );
                console.log({ entityTemplateIds });

                // get all entityTemplates group by entityTemplateId
                const entityTemplates = await EntityTemplateManagerService.searchEntityTemplates({ ids: entityTemplateIds });
                const relationshipTemplates = await RelationshipsTemplateManagerService.searchRelationshipTemplates({ ids: relationshipTemplateIds });

                const entitiesTemplatesByIds = new Map(entityTemplates.map((entityTemplate) => [entityTemplate._id, entityTemplate]));
                const relationshipsTemplatesByIds = new Map(
                    relationshipTemplates.map((relationshipTemplate) => [relationshipTemplate._id, relationshipTemplate]),
                );

                // collecting all the entitiesIds and their rules for preparation to search their related rules
                const { entitiesIdsRulesReasonsMapBeforeRunActions, entitiesTemplatesIdsOfRules } =
                    await BulkActionManager.getEntitiesIdsRulesReasonsBefore(actions, relationshipsTemplatesByIds);

                // search rules of entities
                const rulesOfEntities = await RelationshipsTemplateManagerService.searchRules({
                    entityTemplateIds: [...entitiesTemplatesIdsOfRules],
                });

                const rulesByEntityTemplateIds = groupBy(rulesOfEntities, (rule) => rule.entityTemplateId);

                const ruleFailuresBeforeAll = await EntityManager.runRulesOnEntitiesWithRuleReasons(
                    transaction,
                    entitiesIdsRulesReasonsMapBeforeRunActions,
                    rulesByEntityTemplateIds,
                );

                const { results, allActivityLogsToCreate } = await BulkActionManager.runBulkOfActionsInTransaction(
                    transaction,
                    actions,
                    entitiesTemplatesByIds,
                    userId,
                );

                const entitiesIdsRulesReasonsMapAfterRunActions = BulkActionManager.getEntitiesIdsRulesReasonsAfter(
                    actions,
                    results,
                    relationshipsTemplatesByIds,
                );

                const ruleFailuresAfterAll = await EntityManager.runRulesOnEntitiesWithRuleReasons(
                    transaction,
                    entitiesIdsRulesReasonsMapAfterRunActions,
                    rulesByEntityTemplateIds,
                );

                throwIfActionCausedRuleFailures(
                    ignoredRules,
                    ruleFailuresBeforeAll,
                    ruleFailuresAfterAll,
                    actions.map((action, index) => {
                        if (action.actionType === ActionTypes.CreateEntity) return { createdEntityId: results[index].properties._id };
                        if (action.actionType === ActionTypes.CreateRelationship) return { createdRelationshipId: results[index].properties._id };
                        if (action.actionType === ActionTypes.UpdateEntity) return { updatedEntityId: results[index].properties._id };
                        return {};
                    }),
                );

                if (!dryRun) {
                    const activityLogsPromises = allActivityLogsToCreate.map((activityLogToCreate) => createActivityLog(activityLogToCreate));

                    await Promise.all(activityLogsPromises);
                }

                return results;
            },
            dryRun,
        );
    }

    static async runBulkOfActionsInMultipleTransactions(actionsGroups: IAction[][], ignoredRules: IBrokenRule[], dryRun: boolean, userId: string) {
        const transactionsPromises = actionsGroups.map((actionsGroup) => {
            return BulkActionManager.runBulkOfActions(actionsGroup, ignoredRules, dryRun, userId);
        });

        return Promise.allSettled(transactionsPromises);
    }
}

export default BulkActionManager;
