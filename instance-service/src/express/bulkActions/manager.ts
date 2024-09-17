/* eslint-disable no-await-in-loop */
import groupBy from 'lodash.groupby';
import { Transaction } from 'neo4j-driver';
import { IActivityLog } from '../../externalServices/activityLog/interface';
import { ActivityLogProducer } from '../../externalServices/activityLog/producer';
import { EntityTemplateManagerService } from '../../externalServices/templates/entityTemplateManager';
import { IMongoEntityTemplate } from '../../externalServices/templates/interfaces/entityTemplates';
import { IMongoRelationshipTemplate } from '../../externalServices/templates/interfaces/relationshipTemplates';
import { RelationshipsTemplateManagerService } from '../../externalServices/templates/relationshipTemplateManager';
import DefaultManagerNeo4j from '../../utils/neo4j/manager';
import { EntitiesIdsRulesReasonsMap, IEntity, RunRuleReason } from '../entities/interface';
import { EntityManager } from '../entities/manager';
import { IRelationship } from '../relationships/interfaces';
import { RelationshipManager } from '../relationships/manager';
import { IBrokenRule } from '../rules/interfaces';
import { throwIfActionCausedRuleFailures } from '../rules/throwIfActionCausedRuleFailures';
import { ActionTypes, IAction, ICreateEntityMetadata, ICreateRelationshipMetadata } from './interface';

export class BulkActionManager extends DefaultManagerNeo4j {
    private entityManager: EntityManager;

    private relationshipsManager: RelationshipManager;

    private entityTemplateService: EntityTemplateManagerService;

    private relationshipsTemplateService: RelationshipsTemplateManagerService;

    private activityLogProducer: ActivityLogProducer;

    constructor(workspaceId: string) {
        super(workspaceId);
        this.entityManager = new EntityManager(workspaceId);
        this.relationshipsManager = new RelationshipManager(workspaceId);
        this.entityTemplateService = new EntityTemplateManagerService(workspaceId);
        this.relationshipsTemplateService = new RelationshipsTemplateManagerService(workspaceId);
        this.activityLogProducer = new ActivityLogProducer(workspaceId);
    }

    getEntitiesIdsRulesReasonsBefore = (actions: IAction[], relationshipsTemplatesByIds: Map<string, IMongoRelationshipTemplate>) => {
        const entitiesIdsRulesReasonsMapBeforeRunActions: EntitiesIdsRulesReasonsMap = new Map();

        const entitiesTemplatesIdsOfRules = new Set<string>();

        actions.forEach((action) => {
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
                    reasons.push({
                        type: RunRuleReason.dependentViaAggregation,
                        dependentRelationshipTemplateId: actionMetadata.relationshipTemplateId,
                    });

                    entitiesIdsRulesReasonsMapBeforeRunActions.set(entityData.entityId, { reasons, entityTemplateId: entityData.entityTemplateId });
                });
            }
        });

        return { entitiesIdsRulesReasonsMapBeforeRunActions, entitiesTemplatesIdsOfRules };
    };

    getEntitiesIdsRulesReasonsAfter = (
        actions: IAction[],
        results: (IEntity | IRelationship)[],
        relationshipsTemplatesByIds: Map<string, IMongoRelationshipTemplate>,
    ) => {
        const entitiesIdsRulesReasonsMapAfterRunActions: EntitiesIdsRulesReasonsMap = new Map();
        actions.forEach((action, i) => {
            if (action.actionType === ActionTypes.CreateEntity) {
                const entity = results[i] as IEntity;

                const entityData = {
                    entityId: entity.properties._id,
                    entityTemplateId: entity.templateId,
                };

                const reasons = entitiesIdsRulesReasonsMapAfterRunActions.get(entityData.entityId)?.reasons || [];
                reasons.push({ type: RunRuleReason.dependentOnEntity });

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
                    reasons.push({ type: RunRuleReason.dependentViaAggregation, dependentRelationshipTemplateId: relationship.templateId });

                    entitiesIdsRulesReasonsMapAfterRunActions.set(entityData.entityId, { reasons, entityTemplateId: entityData.entityTemplateId });
                });
            }
        });

        return entitiesIdsRulesReasonsMapAfterRunActions;
    };

    async runBulkOfActionsInTransaction(
        transaction: Transaction,
        actions: IAction[],
        entitiesTemplatesByIds: Map<string, IMongoEntityTemplate>,
        userId: string,
    ) {
        const results: (IEntity | IRelationship)[] = [];
        const allActivityLogsToCreate: Omit<IActivityLog, '_id'>[] = [];

        for (const action of actions) {
            if (action.actionType === ActionTypes.CreateEntity) {
                const actionMetadata = action.actionMetadata as ICreateEntityMetadata;

                const { newEntity, activityLogsToCreate } = await this.entityManager.createEntityInTransaction(
                    transaction,
                    actionMetadata.properties,
                    entitiesTemplatesByIds.get(actionMetadata.templateId)!,
                    userId,
                );

                results.push(newEntity);

                allActivityLogsToCreate.push(...activityLogsToCreate);
            } else {
                const actionMetadata = action.actionMetadata as ICreateRelationshipMetadata;
                const relationship: IRelationship = {
                    templateId: actionMetadata.relationshipTemplateId,
                    sourceEntityId: actionMetadata.sourceEntityId,
                    destinationEntityId: actionMetadata.destinationEntityId,
                    properties: {},
                };
                const fixedRelationship = this.relationshipsManager.getRelationshipByPrevResults(relationship, results);

                await this.relationshipsManager.validateCreateRelationshipDuplicate(
                    transaction,
                    fixedRelationship.templateId,
                    fixedRelationship.sourceEntityId,
                    fixedRelationship.destinationEntityId,
                );

                const { createdRelationship, activityLogsToCreate } = await this.relationshipsManager.createRelationshipInTransaction(
                    transaction,
                    fixedRelationship,
                    userId,
                );

                allActivityLogsToCreate.push(...activityLogsToCreate);

                results.push(createdRelationship);
            }
        }

        return { results, allActivityLogsToCreate };
    }

    async runBulkOfActions(actions: IAction[], ignoredRules: IBrokenRule[], dryRun: boolean, userId: string) {
        return this.neo4jClient
            .performComplexTransaction(
                'writeTransaction',
                async (transaction) => {
                    // collecting all relationshipTemplatesIds
                    const entityTemplateIds = new Set<string>();
                    const relationshipTemplateIds = new Set<string>();

                    actions.forEach((action) => {
                        if (action.actionType === ActionTypes.CreateRelationship) {
                            relationshipTemplateIds.add((action.actionMetadata as ICreateRelationshipMetadata).relationshipTemplateId);
                        } else if (action.actionType === ActionTypes.CreateEntity) {
                            entityTemplateIds.add((action.actionMetadata as ICreateEntityMetadata).templateId);
                        }
                    });

                    // get all entityTemplates group by entityTemplateId
                    const [entityTemplates, relationshipTemplates] = await Promise.all([
                        this.entityTemplateService.searchEntityTemplates({ ids: [...entityTemplateIds] }),
                        this.relationshipsTemplateService.searchRelationshipTemplates({ ids: [...relationshipTemplateIds] }),
                    ]);

                    const entitiesTemplatesByIds = new Map(entityTemplates.map((entityTemplate) => [entityTemplate._id, entityTemplate]));
                    const relationshipsTemplatesByIds = new Map(
                        relationshipTemplates.map((relationshipTemplate) => [relationshipTemplate._id, relationshipTemplate]),
                    );

                    // collecting all the entitiesIds and their rules for preparation to search their related rules
                    const { entitiesIdsRulesReasonsMapBeforeRunActions, entitiesTemplatesIdsOfRules } = this.getEntitiesIdsRulesReasonsBefore(
                        actions,
                        relationshipsTemplatesByIds,
                    );

                    // search rules of entities
                    const rulesOfEntities = await this.relationshipsTemplateService.searchRules({
                        entityTemplateIds: [...entitiesTemplatesIdsOfRules],
                    });

                    const rulesByEntityTemplateIds = groupBy(rulesOfEntities, (rule) => rule.entityTemplateId);

                    const [ruleFailuresBeforeAll, { results, allActivityLogsToCreate }] = await Promise.all([
                        this.entityManager.runRulesOnEntitiesWithRuleReasons(
                            transaction,
                            entitiesIdsRulesReasonsMapBeforeRunActions,
                            rulesByEntityTemplateIds,
                        ),
                        this.runBulkOfActionsInTransaction(transaction, actions, entitiesTemplatesByIds, userId),
                    ]);

                    const entitiesIdsRulesReasonsMapAfterRunActions = this.getEntitiesIdsRulesReasonsAfter(
                        actions,
                        results,
                        relationshipsTemplatesByIds,
                    );

                    const ruleFailuresAfterAll = await this.entityManager.runRulesOnEntitiesWithRuleReasons(
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
                            return {};
                        }),
                    );

                    if (!dryRun) {
                        const activityLogsPromises = allActivityLogsToCreate.map((activityLogToCreate) =>
                            this.activityLogProducer.createActivityLog(activityLogToCreate),
                        );
                        await Promise.all(activityLogsPromises);
                    }

                    return results;
                },
                dryRun,
            )
            .catch((err) => {
                console.log({ errFromBulk: err });
                return this.entityManager.throwServiceErrorIfFailedConstraintsValidation(err);
            });
    }

    async runBulkOfActionsInMultipleTransactions(actionsGroups: IAction[][], ignoredRules: IBrokenRule[], dryRun: boolean, userId: string) {
        const transactionsPromises = actionsGroups.map((actionsGroup) => {
            return this.runBulkOfActions(actionsGroup, ignoredRules, dryRun, userId);
        });

        return Promise.allSettled(transactionsPromises);
    }
}

export default BulkActionManager;
