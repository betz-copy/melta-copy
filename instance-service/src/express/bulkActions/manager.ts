/* eslint-disable no-await-in-loop */
import groupBy from 'lodash.groupby';
import { Transaction } from 'neo4j-driver';
import pickBy from 'lodash.pickby';
import {
    IMongoEntityTemplate,
    IMongoRelationshipTemplate,
    ActionTypes,
    ActionErrors,
    ICreateEntityMetadata,
    ICreateRelationshipMetadata,
    IDuplicateEntityMetadata,
    IUpdateEntityMetadata,
    IAction,
    IBrokenRule,
    IRequiredConstraint,
    IEntity,
    IRelationship,
    IActivityLog,
    BadRequestError,
} from '@microservices/shared';
import ActivityLogProducer from '../../externalServices/activityLog/producer';
import EntityTemplateManagerService from '../../externalServices/templates/entityTemplateManager';
import RelationshipsTemplateManagerService from '../../externalServices/templates/relationshipTemplateManager';
import DefaultManagerNeo4j from '../../utils/neo4j/manager';
import { EntitiesIdsRulesReasonsMap, RunRuleReason } from '../entities/interface';
import EntityManager from '../entities/manager';
import RelationshipManager from '../relationships/manager';
import { throwIfActionCausedRuleFailures } from '../rules/throwIfActionCausedRuleFailures';
import config from '../../config';

const { brokenRulesFakeEntityIdPrefix } = config;

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

    getRelationshipByPrevResults = (relationship: IRelationship, results: (IEntity | IRelationship)[]) => {
        const relationshipToReturn: IRelationship = relationship;
        if (relationship.destinationEntityId.startsWith(brokenRulesFakeEntityIdPrefix) && relationship.destinationEntityId.endsWith('._id')) {
            const numberPart = parseInt(relationship.destinationEntityId.slice(1, -4), 10);
            relationshipToReturn.destinationEntityId = (results[numberPart] as IEntity).properties._id;
        }
        if (relationship.sourceEntityId.startsWith(brokenRulesFakeEntityIdPrefix) && relationship.sourceEntityId.endsWith('._id')) {
            const numberPart = parseInt(relationship.sourceEntityId.slice(1, -4), 10);
            relationshipToReturn.sourceEntityId = (results[numberPart] as IEntity).properties._id;
        }

        return relationshipToReturn;
    };

    getEntityIdByPrevResults = (actionMetadata: IUpdateEntityMetadata, results: (IEntity | IRelationship)[]): IUpdateEntityMetadata => {
        const { entityId, updatedFields } = actionMetadata;

        if (entityId.startsWith(brokenRulesFakeEntityIdPrefix)) {
            const numberPart = parseInt(entityId.slice(1, -4), 10);
            const createdEntity = results[numberPart] as IEntity;
            return { entityId: createdEntity.properties._id, before: createdEntity.properties, updatedFields };
        }

        return actionMetadata;
    };

    fixUpdatedFields = (actionMetadata: IUpdateEntityMetadata, entityTemplate: IMongoEntityTemplate, entity: IEntity) => {
        const { updatedFields } = actionMetadata;

        const newEntityProperties = { ...entity.properties, ...updatedFields };
        const newEntityPropertiesWithoutNulls = pickBy(newEntityProperties, (property) => property !== null) as IEntity['properties'];

        const entityAfterManipulations = JSON.parse(JSON.stringify(newEntityPropertiesWithoutNulls));

        Object.entries(entityTemplate.properties.properties).forEach(([name, value]) => {
            if (name in newEntityPropertiesWithoutNulls) {
                const propertyValue = newEntityPropertiesWithoutNulls[name];

                if (value.format === 'relationshipReference' && typeof propertyValue !== 'string') {
                    entityAfterManipulations[name] = (propertyValue as IEntity).properties._id;
                }
            }
        });

        return {
            ...actionMetadata,
            updatedFields: entityAfterManipulations,
        };
    };

    getEntitiesIdsRulesReasonsBefore = async (
        actions: IAction[],
        relationshipsTemplatesByIds: Map<string, IMongoRelationshipTemplate>,
        transaction: Transaction,
    ) => {
        const entitiesIdsRulesReasonsMapBeforeRunActions: EntitiesIdsRulesReasonsMap = new Map();
        const entitiesTemplatesIdsOfRules = new Set<string>();

        await Promise.all(
            actions.map(async (action) => {
                if (action.actionType === ActionTypes.CreateEntity) {
                    entitiesTemplatesIdsOfRules.add((action.actionMetadata as ICreateEntityMetadata).templateId);
                } else if (action.actionType === ActionTypes.DuplicateEntity) {
                    entitiesTemplatesIdsOfRules.add((action.actionMetadata as IDuplicateEntityMetadata).templateId);
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
                        return !entityId.startsWith(brokenRulesFakeEntityIdPrefix); // then it's entity that will be created in prev actions, so cant run rule on entity that doesnt exist
                    });

                    entitiesDatas.forEach((entityData) => {
                        entitiesTemplatesIdsOfRules.add(entityData.entityTemplateId);
                        const reasons = entitiesIdsRulesReasonsMapBeforeRunActions.get(entityData.entityId)?.reasons || [];
                        reasons.push({
                            type: RunRuleReason.dependentViaAggregation,
                            dependentRelationshipTemplateId: actionMetadata.relationshipTemplateId,
                        });

                        entitiesIdsRulesReasonsMapBeforeRunActions.set(entityData.entityId, {
                            reasons,
                            entityTemplateId: entityData.entityTemplateId,
                        });
                    });
                } else if (action.actionType === ActionTypes.UpdateEntity) {
                    const actionMetadata = action.actionMetadata as IUpdateEntityMetadata;
                    if (!actionMetadata.entityId.startsWith(brokenRulesFakeEntityIdPrefix)) {
                        const entity = await this.entityManager.getEntityByIdInTransaction(actionMetadata.entityId, transaction);
                        const entityTemplate = await this.entityTemplateService.getEntityTemplateById(entity.templateId);
                        entitiesTemplatesIdsOfRules.add(entityTemplate._id);

                        const reasons = entitiesIdsRulesReasonsMapBeforeRunActions.get(actionMetadata.entityId)?.reasons || [];
                        reasons.push({
                            type: RunRuleReason.dependentOnEntity,
                            updatedProperties: Object.keys(actionMetadata.updatedFields),
                        });

                        entitiesIdsRulesReasonsMapBeforeRunActions.set(actionMetadata.entityId, {
                            reasons,
                            entityTemplateId: entityTemplate._id,
                        });

                        await this.getNeighborsOfUpdatedEntity(
                            actionMetadata.entityId,
                            transaction,
                            Object.keys(actionMetadata.updatedFields),
                            entitiesIdsRulesReasonsMapBeforeRunActions,
                            entitiesTemplatesIdsOfRules,
                            true,
                        );
                    }
                }
            }),
        );

        return { entitiesIdsRulesReasonsMapBeforeRunActions, entitiesTemplatesIdsOfRules };
    };

    getNeighborsOfUpdatedEntity = async (
        entityId: string,
        transaction: Transaction,
        updatedProperties: string[],
        entitiesIdsRulesReasonsMap: EntitiesIdsRulesReasonsMap,
        entitiesTemplatesIdsOfRules?: Set<string>,
        beforeActions = false,
    ) => {
        const neighborsOfUpdatedEntity = await this.entityManager.getNeighborsOfUpdatedEntityForRule(transaction, entityId);

        neighborsOfUpdatedEntity.forEach(({ neighborOfEntity, relationshipTemplate }) => {
            const reasons = entitiesIdsRulesReasonsMap.get(neighborOfEntity.properties._id)?.reasons || [];

            if (beforeActions && entitiesTemplatesIdsOfRules) entitiesTemplatesIdsOfRules.add(neighborOfEntity.templateId);

            reasons.push({
                type: RunRuleReason.dependentViaAggregation,
                updatedProperties,
                dependentRelationshipTemplateId: relationshipTemplate,
            });

            entitiesIdsRulesReasonsMap.set(neighborOfEntity.properties._id, {
                reasons,
                entityTemplateId: neighborOfEntity.templateId,
            });
        });
    };

    addEntityRuleReasonFromResult = (entity: IEntity, entitiesIdsRulesReasonsMapAfterRunActions: EntitiesIdsRulesReasonsMap) => {
        const entityData = {
            entityId: entity.properties._id,
            entityTemplateId: entity.templateId,
        };

        const reasons = entitiesIdsRulesReasonsMapAfterRunActions.get(entityData.entityId)?.reasons || [];
        reasons.push({ type: RunRuleReason.dependentOnEntity });

        entitiesIdsRulesReasonsMapAfterRunActions.set(entityData.entityId, { reasons, entityTemplateId: entityData.entityTemplateId });
    };

    getEntitiesIdsRulesReasonsAfter = async (
        actions: IAction[],
        results: (IEntity | IRelationship)[],
        relationshipsTemplatesByIds: Map<string, IMongoRelationshipTemplate>,
        transaction: Transaction,
    ) => {
        const entitiesIdsRulesReasonsMapAfterRunActions: EntitiesIdsRulesReasonsMap = new Map();
        const neighborsPromises: Promise<void>[] = [];

        for (const [i, action] of actions.entries()) {
            if (action.actionType === ActionTypes.CreateEntity || action.actionType === ActionTypes.DuplicateEntity) {
                this.addEntityRuleReasonFromResult(results[i], entitiesIdsRulesReasonsMapAfterRunActions);
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

                for (const entityData of entitiesDatas) {
                    const reasons = entitiesIdsRulesReasonsMapAfterRunActions.get(entityData.entityId)?.reasons || [];
                    reasons.push({ type: RunRuleReason.dependentViaAggregation, dependentRelationshipTemplateId: relationship.templateId });

                    entitiesIdsRulesReasonsMapAfterRunActions.set(entityData.entityId, {
                        reasons,
                        entityTemplateId: entityData.entityTemplateId,
                    });
                }
            } else if (action.actionType === ActionTypes.UpdateEntity) {
                const updatedEntity = results[i];

                this.addEntityRuleReasonFromResult(updatedEntity, entitiesIdsRulesReasonsMapAfterRunActions);

                neighborsPromises.push(
                    this.getNeighborsOfUpdatedEntity(
                        updatedEntity.properties._id,
                        transaction,
                        Object.keys((action.actionMetadata as IUpdateEntityMetadata).updatedFields),
                        entitiesIdsRulesReasonsMapAfterRunActions,
                    ),
                );
            }
        }

        await Promise.all(neighborsPromises);

        return entitiesIdsRulesReasonsMapAfterRunActions;
    };

    async runBulkOfActionsInTransaction(
        transaction: Transaction,
        actions: IAction[],
        entitiesTemplatesByIds: Map<string, IMongoEntityTemplate>,
        userId?: string,
    ) {
        const results: (IEntity | IRelationship)[] = [];
        const allActivityLogsToCreate: Omit<IActivityLog, '_id'>[] = [];

        for (const action of actions) {
            switch (action.actionType) {
                case ActionTypes.CreateEntity: {
                    const actionMetadata = action.actionMetadata as ICreateEntityMetadata;
                    const { createdEntity, activityLogsToCreate } = await this.entityManager.createEntityInTransaction(
                        transaction,
                        actionMetadata.properties,
                        entitiesTemplatesByIds.get(actionMetadata.templateId)!,
                        userId,
                    );

                    results.push(createdEntity);
                    allActivityLogsToCreate.push(...activityLogsToCreate);
                    break;
                }
                case ActionTypes.DuplicateEntity: {
                    const actionMetadata = action.actionMetadata as IDuplicateEntityMetadata;

                    const { createdEntity, activityLogsToCreate } = await this.entityManager.createEntityInTransaction(
                        transaction,
                        actionMetadata.properties,
                        entitiesTemplatesByIds.get(actionMetadata.templateId)!,
                        userId,
                        actionMetadata.entityIdToDuplicate,
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
                    break;
                }

                case ActionTypes.UpdateEntity: {
                    const actionMetadata = action.actionMetadata as IUpdateEntityMetadata;
                    const fixedMetaData = this.getEntityIdByPrevResults(actionMetadata, results);
                    const { updatedEntity, activityLogsToCreate } = await this.entityManager.updateAction(
                        fixedMetaData,
                        transaction,
                        entitiesTemplatesByIds,
                        userId,
                    );

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

    processActions = async (actions: IAction[], actionHandlers, ...extraArgs) => {
        await Promise.all(
            actions.map(async (action) => {
                const handler = actionHandlers[action.actionType];
                if (handler) {
                    await handler(action, ...extraArgs);
                }
            }),
        );
    };

    async processBeforeRunBulk(actions: IAction[], transaction: Transaction) {
        const relationshipTemplateIds: string[] = [];
        const entityTemplateIds: string[] = [];

        const actionHandlers = {
            [ActionTypes.CreateEntity]: (action) => {
                entityTemplateIds.push((action.actionMetadata as ICreateEntityMetadata).templateId);
            },
            [ActionTypes.CreateRelationship]: (action) => {
                relationshipTemplateIds.push((action.actionMetadata as ICreateRelationshipMetadata).relationshipTemplateId);
            },
            [ActionTypes.DuplicateEntity]: (action) => {
                entityTemplateIds.push((action.actionMetadata as IDuplicateEntityMetadata).templateId);
            },
            [ActionTypes.UpdateEntity]: async (action) => {
                const actionMetadata = action.actionMetadata as IUpdateEntityMetadata;
                if (!actionMetadata.entityId.startsWith(brokenRulesFakeEntityIdPrefix)) {
                    const entity = await this.entityManager.getEntityByIdInTransaction(actionMetadata.entityId, transaction);
                    const entityTemplate = await this.entityTemplateService.getEntityTemplateById(entity.templateId);

                    entityTemplateIds.push(entityTemplate._id);

                    const neighborsOfUpdatedEntity = await this.entityManager.getNeighborsOfUpdatedEntityForRule(
                        transaction,
                        actionMetadata.entityId,
                    );

                    neighborsOfUpdatedEntity.forEach(({ neighborOfEntity }) => entityTemplateIds.push(neighborOfEntity.templateId));
                }
            },
        };

        await this.processActions(actions, actionHandlers, relationshipTemplateIds, entityTemplateIds);

        return { relationshipTemplateIds, entityTemplateIds };
    }

    async throwRequiredErrors(actions: IAction[]) {
        const constraints = await this.entityManager.getAllConstraints();

        actions.forEach((action, index) => {
            if (action.actionType === ActionTypes.CreateEntity) {
                const { templateId, properties } = action.actionMetadata as ICreateEntityMetadata;
                const templateConstraint = constraints.find((constraint) => constraint.templateId === templateId);

                if (templateConstraint) {
                    const missingProperty = templateConstraint.requiredConstraints.find(
                        (requiredProperty) => !Object.keys(properties).includes(requiredProperty),
                    );

                    if (missingProperty) {
                        const requiredConstraint: Omit<IRequiredConstraint, 'constraintName'> = {
                            type: ActionErrors.required,
                            templateId,
                            property: missingProperty,
                            index,
                        };
                        throw new BadRequestError('instance is missing required property', {
                            errorCode: config.errorCodes.failedConstraintsValidation,
                            constraint: requiredConstraint,
                        });
                    }
                }
            }
        });
    }

    async runBulkOfActions(actions: IAction[], ignoredRules: IBrokenRule[], dryRun: boolean, userId?: string) {
        return this.neo4jClient
            .performComplexTransaction(
                'writeTransaction',
                async (transaction) => {
                    const { entityTemplateIds, relationshipTemplateIds } = await this.processBeforeRunBulk(actions, transaction);

                    // get all entityTemplates group by entityTemplateId
                    const [entityTemplates, relationshipTemplates] = await Promise.all([
                        this.entityTemplateService.searchEntityTemplates({ ids: [...entityTemplateIds] }),
                        this.relationshipsTemplateService.searchRelationshipTemplates({ ids: [...relationshipTemplateIds] }),
                    ]);

                    const entitiesTemplatesByIds = new Map(entityTemplates.map((entityTemplate) => [entityTemplate._id, entityTemplate]));
                    const relationshipsTemplatesByIds = new Map(
                        relationshipTemplates.map((relationshipTemplate) => [relationshipTemplate._id, relationshipTemplate]),
                    );

                    this.throwRequiredErrors(actions);

                    // collecting all the entitiesIds and their rules for preparation to search their related rules
                    const { entitiesIdsRulesReasonsMapBeforeRunActions, entitiesTemplatesIdsOfRules } = await this.getEntitiesIdsRulesReasonsBefore(
                        actions,
                        relationshipsTemplatesByIds,
                        transaction,
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

                    const entitiesIdsRulesReasonsMapAfterRunActions = await this.getEntitiesIdsRulesReasonsAfter(
                        actions,
                        results,
                        relationshipsTemplatesByIds,
                        transaction,
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
                            if (action.actionType === ActionTypes.CreateEntity || action.actionType === ActionTypes.DuplicateEntity)
                                return { createdEntityId: results[index].properties._id };
                            if (action.actionType === ActionTypes.CreateRelationship) return { createdRelationshipId: results[index].properties._id };
                            if (action.actionType === ActionTypes.UpdateEntity) return { updatedEntityId: results[index].properties._id };
                            return {};
                        }),
                        actions,
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
