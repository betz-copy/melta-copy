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
import { EntitiesIdsRulesReasonsMap, IRelationship } from './interfaces';
import { ActionTypes, IAction, ICreateEntityMetadata, ICreateRelationshipMetadata } from './interfaces/action';
import { NotFoundError, ServiceError } from '../error';
import EntityManager from '../entities/manager';
import { IEntity } from '../entities/interface';
import { EntityTemplateManagerService } from '../../externalServices/templates/entityTemplateManager';
import { runRulesOnEntity } from '../rules/runRulesOnEntity';
import { throwIfActionCausedRuleFailures } from '../rules/throwIfActionCausedRuleFailures';
import { IBrokenRule, IRuleFailure } from '../rules/interfaces';
import { filterDependentRulesOnEntity, filterDependentRulesViaAggregation } from '../rules/getParametersOfFormula';
import config from '../../config';
import { RelationshipsTemplateManagerService } from '../../externalServices/templates/relationshipTemplateManager';
import { IMongoRelationshipTemplate } from '../../externalServices/templates/interfaces/relationshipTemplates';
import groupBy from 'lodash.groupby';
import { IMongoRule } from '../../externalServices/templates/interfaces/rules';
import { IMongoEntityTemplate } from '../../externalServices/templates/interfaces/entityTemplates';

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

    /**
     *
     * search many rules
     *
     * map rules by entity
     *
     * const [
     *  {
     *      entity,
     *      ruleReason:
     *          { type: 'dependentViaAggregation', dependentRelationshipTemplateId: string, updatedProperties?: string[] }
     *          | { type: 'dependentOnEntity', updatedProperties?: string[] }
     *  }
     * ]
     *
     * const [
     *  {entity, relevantRules: []}
     * ]
     */

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

            throwIfActionCausedRuleFailures(ignoredRules, ruleFailuresBeforeAction, ruleFailuresAfterAction, [
                {
                    createdRelationshipId: createdRelationship.properties._id,
                },
            ]);

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

    static getEntitiesIdsRulesReasonsBefore = (actions: IAction[], relationshipsTemplatesByIds: Map<string, IMongoRelationshipTemplate>) => {
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
                    const reasons = entitiesIdsRulesReasonsMapBeforeRunActions.get(entityData) || [];
                    reasons.push({ type: 'dependentViaAggregation', dependentRelationshipTemplateId: actionMetadata.relationshipTemplateId });

                    entitiesIdsRulesReasonsMapBeforeRunActions.set(entityData, reasons);
                });
            }
        });

        return { entitiesIdsRulesReasonsMapBeforeRunActions, entitiesTemplatesIdsOfRules };
    };

    static getEntitiesIdsRulesReasonsAfter = (
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

                const reasons = entitiesIdsRulesReasonsMapAfterRunActions.get(entityData) || [];
                reasons.push({ type: 'dependentOnEntity' });

                entitiesIdsRulesReasonsMapAfterRunActions.set(entityData, reasons);
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
                    const reasons = entitiesIdsRulesReasonsMapAfterRunActions.get(entityData) || [];
                    reasons.push({ type: 'dependentViaAggregation', dependentRelationshipTemplateId: relationship.templateId });

                    entitiesIdsRulesReasonsMapAfterRunActions.set(entityData, reasons);
                });
            }
        });

        return entitiesIdsRulesReasonsMapAfterRunActions;
    };

    static getRelevantRulesOfEntities = (
        entitiesIdsRulesReasonsMapBeforeRunActions: EntitiesIdsRulesReasonsMap,
        rulesByEntityTemplateIds: Record<string, IMongoRule[]>,
    ) => {
        // sort relevant rules by each entity
        const entitiesRelevantRulesMap = new Map<
            {
                entityId: string;
                entityTemplateId: string;
            },
            IMongoRule[]
        >();

        entitiesIdsRulesReasonsMapBeforeRunActions.forEach((reasons, entityData) => {
            const relevantRules: IMongoRule[] = [];

            reasons.forEach((reason) => {
                if (reason.type === 'dependentOnEntity') {
                    relevantRules.push(
                        ...filterDependentRulesOnEntity(rulesByEntityTemplateIds[entityData.entityTemplateId] || [], entityData.entityTemplateId),
                    );
                } else if (reason.type === 'dependentViaAggregation') {
                    relevantRules.push(
                        ...filterDependentRulesViaAggregation(
                            rulesByEntityTemplateIds[entityData.entityTemplateId] || [],
                            reason.dependentRelationshipTemplateId,
                            reason.updatedProperties,
                        ),
                    );
                }
            });

            entitiesRelevantRulesMap.set(entityData, relevantRules);
        });

        return entitiesRelevantRulesMap;
    };

    static async runRulesOnEntitiesWithRuleReasons(
        transaction: Transaction,
        entitiesIdsRulesReasonsMap: EntitiesIdsRulesReasonsMap,
        rulesByEntityTemplateIds: Record<string, IMongoRule[]>,
    ) {
        const entitiesRelevantRulesMap = RelationshipManager.getRelevantRulesOfEntities(entitiesIdsRulesReasonsMap, rulesByEntityTemplateIds);

        const ruleFailuresPromises: Promise<IRuleFailure[]>[] = [];
        entitiesRelevantRulesMap.forEach((relevantRules, entityData) => {
            ruleFailuresPromises.push(runRulesOnEntity(transaction, entityData.entityId, relevantRules));
        });

        const ruleFailures = (await Promise.all(ruleFailuresPromises)).flat();

        return ruleFailures;
    }

    static async runBulkOfActionsInTransaction(transaction: Transaction, actions: IAction[], entitiesTemplatesByIds: Map<string, IMongoEntityTemplate>) { 
        const results: (IEntity | IRelationship)[] = [];
        for (const action of actions) {
            if (action.actionType === ActionTypes.CreateEntity) {
                const actionMetadata = action.actionMetadata as ICreateEntityMetadata;
                results.push(
                    await EntityManager.createEntityInTransaction(
                        transaction,
                        actionMetadata,
                        entitiesTemplatesByIds.get(actionMetadata.templateId)!,
                    ),
                );
            } else {
                const actionMetadata = action.actionMetadata as ICreateRelationshipMetadata;
                const relationship: IRelationship = {
                    templateId: actionMetadata.relationshipTemplateId,
                    sourceEntityId: actionMetadata.sourceEntityId,
                    destinationEntityId: actionMetadata.destinationEntityId,
                    properties: {},
                };
                const fixedRelationship = RelationshipManager.getRelationshipByPrevResults(relationship, results);

                await RelationshipManager.validateCreateRelationshipDuplicate(
                    transaction,
                    fixedRelationship.templateId,
                    fixedRelationship.sourceEntityId,
                    fixedRelationship.destinationEntityId,
                );

                results.push(await RelationshipManager.createRelationshipInTransaction(transaction, fixedRelationship));
            }
        }

        return results;
    }

    static async runBulkOfActions(actions: IAction[], ignoredRules: IBrokenRule[], dryRun: boolean) {
        return Neo4jClient.performComplexTransaction(
            'writeTransaction',
            async (transaction) => {
                // collecting all relationshipTemplatesIds
                const entityTemplateIds: string[] = [];
                const relationshipTemplateIds: string[] = [];

                actions.forEach((action) => {
                    if (action.actionType === ActionTypes.CreateRelationship) {
                        relationshipTemplateIds.push((action.actionMetadata as ICreateRelationshipMetadata).relationshipTemplateId);
                    } else if (action.actionType === ActionTypes.CreateEntity) {
                        entityTemplateIds.push((action.actionMetadata as ICreateEntityMetadata).templateId);
                    }
                });

                // get all entityTemplates group by entityTemplateId
                const entityTemplates = await EntityTemplateManagerService.searchEntityTemplates({ ids: entityTemplateIds });
                const relationshipTemplates = await RelationshipsTemplateManagerService.searchRelationshipTemplates({ ids: relationshipTemplateIds });

                const entitiesTemplatesByIds = new Map(entityTemplates.map((entityTemplate) => [entityTemplate._id, entityTemplate]));
                const relationshipsTemplatesByIds = new Map(
                    relationshipTemplates.map((relationshipTemplate) => [relationshipTemplate._id, relationshipTemplate]),
                );

                // collecting all the entitiesIds and their rules for preparation to search their related rules
                const { entitiesIdsRulesReasonsMapBeforeRunActions, entitiesTemplatesIdsOfRules } =
                    RelationshipManager.getEntitiesIdsRulesReasonsBefore(actions, relationshipsTemplatesByIds);

                // search rules of entities
                const rulesOfEntities = await RelationshipsTemplateManagerService.searchRules({
                    entityTemplateIds: [...entitiesTemplatesIdsOfRules],
                });

                const rulesByEntityTemplateIds = groupBy(rulesOfEntities, (rule) => rule.entityTemplateId);

                const ruleFailuresBeforeAll = await RelationshipManager.runRulesOnEntitiesWithRuleReasons(
                    transaction,
                    entitiesIdsRulesReasonsMapBeforeRunActions,
                    rulesByEntityTemplateIds,
                );

                const results = await RelationshipManager.runBulkOfActionsInTransaction(transaction, actions, entitiesTemplatesByIds);

                const entitiesIdsRulesReasonsMapAfterRunActions = RelationshipManager.getEntitiesIdsRulesReasonsAfter(
                    actions,
                    results,
                    relationshipsTemplatesByIds,
                );

                const ruleFailuresAfterAll = await RelationshipManager.runRulesOnEntitiesWithRuleReasons(
                    transaction,
                    entitiesIdsRulesReasonsMapAfterRunActions,
                    rulesByEntityTemplateIds,
                );

                throwIfActionCausedRuleFailures(
                    ignoredRules,
                    ruleFailuresBeforeAll,
                    ruleFailuresAfterAll,
                    actions.map((action) => {
                        if (action.actionType === ActionTypes.CreateEntity)
                            return { createdEntityId: (action.actionMetadata as ICreateEntityMetadata).properties._id };
                        if (action.actionType === ActionTypes.CreateRelationship)
                            return { createdRelationshipId: (action.actionMetadata as ICreateRelationshipMetadata).relationshipTemplateId };
                        return {};
                    }),
                );

                return results;
            },
            dryRun,
        );
    }

    static async runBulkOfActionsInMultipleTransactions(actionsGroups: IAction[][], ignoredRules: IBrokenRule[], dryRun: boolean) {
        const transactionsPromises = actionsGroups.map((actionsGroup) => {
            return RelationshipManager.runBulkOfActions(actionsGroup, ignoredRules, dryRun);
        });

        return Promise.allSettled(transactionsPromises);
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

            throwIfActionCausedRuleFailures(ignoredRules, ruleFailuresBeforeAction, ruleFailuresAfterAction, [{}]);

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
