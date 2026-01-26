import {
    ActionOnFail,
    ActionsLog,
    ActionTypes,
    BadRequestError,
    IAction,
    IActivityLog,
    IBrokenRule,
    ICausesOfInstance,
    IChartBody,
    IChildTemplatePopulated,
    IConstraint,
    IConstraintsOfTemplate,
    ICreateEntityMetadata,
    IDeleteEntityBody,
    IDeleteRelationshipReference,
    IDuplicateEntityMetadata,
    IEntity,
    IEntitySingleProperty,
    IEntityTemplate,
    IEntityWithDirectRelationships,
    IGetUnits,
    IMongoEntityTemplate,
    IMongoRelationshipTemplate,
    IMongoRule,
    IMultipleSelect,
    IPropertyValue,
    IRelationship,
    IRelationshipReference,
    IRequiredConstraint,
    IRuleMail,
    ISearchBatchBody,
    ISearchEntitiesByLocationBody,
    ISearchEntitiesByTemplatesBody,
    ISearchEntitiesOfTemplateBody,
    ISemanticSearchResult,
    IUniqueConstraint,
    IUniqueConstraintOfTemplate,
    IUpdatedFields,
    IUpdateEntityMetadata,
    logger,
    NotFoundError,
    Polygon,
    PropertyFormat,
    PropertyType,
    ServiceError,
    ValidationError,
} from '@microservices/shared';
import { booleanPointInPolygon, featureCollection, intersect, point as turfPoint, polygon as turfPolygon } from '@turf/turf';
import { startOfToday, startOfYesterday } from 'date-fns';
import { flatten, unflatten } from 'flatley';
import { StatusCodes } from 'http-status-codes';
import { cloneDeep, differenceWith, groupBy, isEqual, mapValues, partition, pickBy } from 'lodash';
import { Neo4jError, QueryResult, RecordShape, Transaction } from 'neo4j-driver';
import pLimit from 'p-limit';
import config from '../../config';
import ActivityLogProducer from '../../externalServices/activityLog/producer';
import GatewayServiceProducer from '../../externalServices/gateway/producer';
import ChildTemplateService from '../../externalServices/templates/childTemplateManager';
import EntityTemplateService from '../../externalServices/templates/entityTemplateManager';
import RelationshipsTemplateManagerService from '../../externalServices/templates/relationshipTemplateManager';
import { executeActionCodeAndGetEntitiesToUpdate } from '../../utils/actions/executeScript';
import isBodyFunctionHasContent from '../../utils/actions/isBodyFunctionHasContent';
import filteredMap from '../../utils/filteredMap';
import { arraysEqualsNonOrdered } from '../../utils/lib';
import { expandEntityToNeoQuery } from '../..//utils/neo4j/getExpandedEntityByIdRecursive';
import {
    generateDefaultProperties,
    getNeo4jDateTime,
    getNeo4jLocation,
    normalizeChartResponse,
    normalizeFields,
    normalizeGetDbConstraints,
    normalizeNeighborsOfEntityForRule,
    normalizeResponseCount,
    normalizeResponseTemplatesCount,
    normalizeReturnedEntity,
    normalizeReturnedRelAndEntities,
    normalizeSearchByLocationResponse,
    normalizeSearchWithRelationships,
    runInTransactionAndNormalize,
} from '../../utils/neo4j/lib';
import closePolygon from '../../utils/neo4j/location';
import DefaultManagerNeo4j from '../../utils/neo4j/manager';
import { escapeNeo4jQuerySpecialChars, searchWithRelationshipsToNeoQuery, templatesFilterToNeoQuery } from '../../utils/neo4j/searchBodyToNeoQuery';
import { getEntitiesForPrintByRelIds, getOnlyTemplateIdsTree } from '../../utils/print/neo4j';
import { buildEntityTree } from '../../utils/print/printEntity';
import { buildTemplateTree } from '../..//utils/print/printTemplatesRelationship';
import { buildChartAggregationQuery, handleChartPropertiesTemplate, manipulateReturnedChart } from '../../utils/templateCharts';
import BulkActionManager from '../bulkActions/manager';
import RelationshipManager from '../relationships/manager';
import { getCausesOfRuleFailure } from '../rules/calcNewCausesOfRuleFailure';
import { filterDependentRulesOnEntity, filterDependentRulesViaAggregation } from '../rules/getParametersOfFormula';
import { IRuleFailure } from '../rules/interfaces';
import { runRuleOnEntitiesOfTemplate, runRulesOnEntity } from '../rules/runRulesOnEntity';
import { throwIfActionCausedRuleFailures } from '../rules/throwIfActionCausedRuleFailures';
import {
    EntitiesIdsRulesReasonsMap,
    IEntityCrudAction,
    IExecutionOutput,
    IGetExpandedEntityBody,
    IRelationShipTreeNode,
    RunRuleReason,
} from './interface';
import { updateColorsForIndicatorRulesWithTodayFunc } from './updateColorsForBrokenRulesWithIndicator';
import { addStringFieldsAndNormalizeSpecialStringValues } from './validator.template';

const {
    brokenRulesFakeEntityIdPrefix,
    deleteEntitiesMaxLimit,
    map: {
        wgs84: { maxLatitude, maxLongitude, minLatitude, minLongitude },
    },
} = config;

const { BAD_REQUEST: badRequestStatus } = StatusCodes;

class EntityManager extends DefaultManagerNeo4j {
    private entityTemplateManagerService: EntityTemplateService;

    private childTemplateManagerService: ChildTemplateService;

    private relationshipsTemplateManagerService: RelationshipsTemplateManagerService;

    private relationshipManager: RelationshipManager;

    private activityLogProducer: ActivityLogProducer;

    private gatewayServiceProducer: GatewayServiceProducer;

    constructor(workspaceId: string) {
        super(workspaceId);
        this.entityTemplateManagerService = new EntityTemplateService(workspaceId);
        this.relationshipsTemplateManagerService = new RelationshipsTemplateManagerService(workspaceId);
        this.relationshipManager = new RelationshipManager(workspaceId);
        this.activityLogProducer = new ActivityLogProducer(workspaceId);
        this.childTemplateManagerService = new ChildTemplateService(workspaceId);
        this.gatewayServiceProducer = new GatewayServiceProducer(workspaceId);
    }

    private getRelevantRulesOfEntities = (
        entitiesIdsRulesReasonsMapBeforeRunActions: EntitiesIdsRulesReasonsMap,
        rulesByEntityTemplateIds: Record<string, IMongoRule[]>,
    ) => {
        // sort relevant rules by each entity
        // entityId -> rules[], entityTemplateId

        const entitiesRelevantRulesMap = new Map<
            string,
            {
                rules: IMongoRule[];
                entityTemplateId: string;
            }
        >();

        entitiesIdsRulesReasonsMapBeforeRunActions.forEach(({ reasons, entityTemplateId }, entityId) => {
            const relevantRules: IMongoRule[] = [];
            const rulesIds: Set<string> = new Set<string>();

            reasons.forEach((reason) => {
                if (reason.type === RunRuleReason.dependentOnEntity) {
                    relevantRules.push(
                        ...filterDependentRulesOnEntity(rulesByEntityTemplateIds[entityTemplateId] || [], entityTemplateId).filter(
                            (rule) => !rulesIds.has(rule._id),
                        ),
                    );
                    relevantRules.forEach((rule) => {
                        rulesIds.add(rule._id);
                    });
                } else if (reason.type === RunRuleReason.dependentViaAggregation) {
                    relevantRules.push(
                        ...filterDependentRulesViaAggregation(
                            rulesByEntityTemplateIds[entityTemplateId] || [],
                            reason.dependentRelationshipTemplateId,
                            reason.updatedProperties,
                        ).filter((rule) => !rulesIds.has(rule._id)),
                    );
                    relevantRules.forEach((rule) => {
                        rulesIds.add(rule._id);
                    });
                }
            });

            entitiesRelevantRulesMap.set(entityId, { rules: relevantRules, entityTemplateId });
        });

        return entitiesRelevantRulesMap;
    };

    async runRulesOnEntitiesWithRuleReasons(
        transaction: Transaction,
        entitiesIdsRulesReasonsMap: EntitiesIdsRulesReasonsMap,
        rulesByEntityTemplateIds: Record<string, IMongoRule[]>,
    ): Promise<IRuleFailure[]> {
        const entitiesRelevantRulesMap = this.getRelevantRulesOfEntities(entitiesIdsRulesReasonsMap, rulesByEntityTemplateIds);

        const ruleFailuresPromises = Array.from(entitiesRelevantRulesMap.entries()).map(async ([entityId, { rules }]) => {
            const entity = await this.getEntityByIdInTransaction(entityId, transaction);
            const entityTemplate = await this.entityTemplateManagerService.getEntityTemplateById(entity.templateId);
            return runRulesOnEntity(transaction, entityId, rules, entityTemplate);
        });

        const ruleFailuresNested = await Promise.all(ruleFailuresPromises);
        return ruleFailuresNested.flat();
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

        const entityTemplate = await this.entityTemplateManagerService.getEntityTemplateById(entityTemplateId);

        return runRulesOnEntity(transaction, entityId, relevantRules, entityTemplate);
    };

    throwServiceErrorIfFailedConstraintsValidation = (err: unknown): never => {
        if (!(err instanceof Neo4jError) || err.code !== 'Neo.ClientError.Schema.ConstraintValidationFailed') throw err;

        const { message: neo4jMessage } = err;

        if (neo4jMessage.includes('must have the property')) {
            // neo4jMessage = Node(...) with label `someLabel...` must have the property `property1`
            const variableMatchesInMessage = neo4jMessage.matchAll(/`(.*?)`/g)!;
            const [label, property] = Array.from(variableMatchesInMessage).map((match) => match[1]);
            const fixedProperty = property.endsWith(config.neo4j.relationshipReferencePropertySuffix) ? property.split('.')[0] : property;

            const requiredConstraint: Omit<IRequiredConstraint, 'constraintName'> = {
                type: 'REQUIRED',
                templateId: label,
                property: fixedProperty,
            };

            throw new ServiceError(badRequestStatus, `[NEO4J] instance is missing required property`, {
                errorCode: config.errorCodes.failedConstraintsValidation,
                constraint: requiredConstraint,
                neo4jMessage,
            });
        } else if (neo4jMessage.includes('already exists with')) {
            let label = '';
            let properties: string[] = [];
            const values = {};

            if (neo4jMessage.includes('uniqueConstraint')) {
                label = neo4jMessage.substr(neo4jMessage.indexOf(':') + 1, 24);
                const keys = neo4jMessage.substring(neo4jMessage.indexOf('{') + 1, neo4jMessage.indexOf('}'));
                properties = keys.split(',').map((key) => key.trim());
            } else {
                // neo4jMessage = Node(...) already exists with label `someLabel...` and properties `property1` = ..., `property2` = ...
                // support unique w/ multiple props
                const variableMatchesInMessage = neo4jMessage.matchAll(/`(.*?)`/g)!;
                [label, ...properties] = Array.from(variableMatchesInMessage).map((match) => match[1]);

                // get unique values
                const valueMatch = neo4jMessage.match(/= '(.*?)'/);
                if (valueMatch) {
                    const propertyValue = valueMatch[1];
                    values[properties[0]] = propertyValue;
                }

                properties = properties.map((property) =>
                    property.endsWith(config.neo4j.relationshipReferencePropertySuffix) ? property.split('.')[0] : property,
                );
            }

            const uniqueConstraint: Omit<IUniqueConstraint, 'constraintName'> = {
                type: 'UNIQUE',
                templateId: label,
                uniqueGroupName: '',
                properties,
                values,
            };

            throw new ServiceError(badRequestStatus, `[NEO4J] instance has duplicates on unique properties`, {
                errorCode: config.errorCodes.failedConstraintsValidation,
                constraint: uniqueConstraint,
                neo4jMessage,
            });
        } else {
            // unsupported constraint validation error. possibly neo4j broke expected message
            throw err;
        }
    };

    getColoredFields(rules: IMongoRule[]) {
        return rules.reduce<Record<string, string>>((acc, rule) => {
            if (!rule.fieldColor) return acc;

            acc[rule.fieldColor.field] = rule.fieldColor.color;
            return acc;
        }, {});
    }

    async createEntityInTransaction(
        transaction: Transaction,
        properties: IEntity['properties'],
        entityTemplate: IMongoEntityTemplate,
        userId?: string,
        newDestinationWallet?: IEntity,
        duplicatedFromId?: string,
    ) {
        const fixedProperties = JSON.parse(JSON.stringify(properties));
        const relatedEntitiesByIds: Record<string, IEntity> = {};

        await Promise.all(
            Object.entries(entityTemplate.properties.properties).map(async ([name, property]) => {
                if (property.format === 'relationshipReference') {
                    const relatedEntityId = properties[name];

                    if (relatedEntityId) {
                        const { fixedField, relatedEntity } = await this.fixRelationshipReferenceField(relatedEntityId, transaction);

                        fixedProperties[name] = fixedField;

                        if (entityTemplate.walletTransfer && name === entityTemplate.walletTransfer.to && newDestinationWallet) {
                            const { properties, templateId } = newDestinationWallet;
                            const { updatedAt, createdAt, disabled, _id } = properties;

                            fixedProperties[name] = { ...fixedProperties[name], updatedAt, createdAt, disabled, _id };
                            relatedEntitiesByIds[properties._id] = {
                                ...relatedEntity,
                                properties: { ...relatedEntity.properties, ...properties },
                                templateId,
                            };
                        } else relatedEntitiesByIds[relatedEntityId] = relatedEntity;
                    }
                }
            }),
        );

        const createdEntity = await runInTransactionAndNormalize(
            transaction,
            `CREATE (e: \`${entityTemplate._id}\` $properties) RETURN e`,
            normalizeReturnedEntity('singleResponseNotNullable', { type: 'pure', metadata: entityTemplate }, false),
            {
                properties: {
                    ...generateDefaultProperties(),
                    ...(await addStringFieldsAndNormalizeSpecialStringValues(fixedProperties, entityTemplate, this.entityTemplateManagerService)),
                },
            },
        );

        await Promise.all(
            Object.entries(entityTemplate.properties.properties).map(async ([name, property]) => {
                if (property.format === 'relationshipReference') {
                    if (createdEntity.properties[name]) {
                        await this.createRelationshipReference(
                            property.relationshipReference!,
                            relatedEntitiesByIds[createdEntity.properties[name].properties._id],
                            createdEntity.properties._id,
                            transaction,
                            userId,
                        );
                    }
                }
            }),
        );

        const allActivityLogsToCreate: Omit<IActivityLog, '_id'>[] = [];

        if (userId) {
            allActivityLogsToCreate.push({
                action: duplicatedFromId ? ActionsLog.DUPLICATE_ENTITY : ActionsLog.CREATE_ENTITY,
                entityId: createdEntity.properties._id,
                metadata: duplicatedFromId ? { entityIdDuplicatedFrom: duplicatedFromId } : {},
                timestamp: new Date(),
                userId,
            });
        }

        return { createdEntity, activityLogsToCreate: allActivityLogsToCreate };
    }

    async getEntityByIdInTransaction(id: string, transaction: Transaction, isGetMode: boolean = true) {
        const entity = await runInTransactionAndNormalize(
            transaction,
            `MATCH (e {_id: '${id}'}) RETURN e`,
            normalizeReturnedEntity('singleResponse', { type: 'function', metadata: this.workspaceId }, isGetMode),
        );

        if (!entity) throw new NotFoundError(`[NEO4J] entity "${id}" not found`);

        return entity;
    }

    async createRelationshipReference(
        relationshipReference: IRelationshipReference,
        relatedEntity: IEntity,
        originalEntityId: string,
        transaction: Transaction,
        userId?: string,
    ) {
        const { relationshipTemplateId, relationshipTemplateDirection, relatedTemplateId } = relationshipReference;

        if (relatedEntity.templateId !== relatedTemplateId)
            throw new ValidationError(`[NEO4J] Related entity "${relatedEntity.properties._id}" is not of template "${relatedTemplateId}"`);

        const relationshipToCreate = {
            sourceEntityId: relationshipTemplateDirection === 'incoming' ? relatedEntity.properties._id : originalEntityId,
            destinationEntityId: relationshipTemplateDirection === 'incoming' ? originalEntityId : relatedEntity.properties._id,
            templateId: relationshipTemplateId!,
            properties: {},
        };

        const relationshipTemplate = await this.relationshipsTemplateManagerService.getRelationshipTemplateById(relationshipTemplateId!);

        return this.relationshipManager.createRelationshipByEntityIdsInTransaction(
            relationshipToCreate,
            relationshipTemplate,
            [],
            transaction,
            userId,
        );
    }

    async fixRelationshipReferenceField(relatedEntityId: string, transaction: Transaction) {
        const relatedEntity = await this.getEntityByIdInTransaction(relatedEntityId, transaction);
        const relatedEntityTemplate = await this.entityTemplateManagerService.getEntityTemplateById(relatedEntity.templateId);
        const relatedEntityFixProperties = await addStringFieldsAndNormalizeSpecialStringValues(
            relatedEntity.properties,
            relatedEntityTemplate,
            this.entityTemplateManagerService,
            undefined,
            true,
        );

        return {
            fixedField: {
                ...relatedEntityFixProperties,
                _id: relatedEntityId,
                updatedAt: getNeo4jDateTime(relatedEntity.properties.updatedAt),
                createdAt: getNeo4jDateTime(relatedEntity.properties.createdAt),
                disabled: relatedEntity.properties.disabled,
            },
            relatedEntity,
        };
    }

    async getRelatedEntitiesOfEntity(originalTemplateId: string, originalEntityIds: string[], transaction: Transaction) {
        const allEntityTemplates = await this.entityTemplateManagerService.getTemplatesUsingRelationshipReference(originalTemplateId);
        const relatedEntityIdsByFieldToChange: Record<string, string[]> = {};

        await Promise.all(
            allEntityTemplates.map(async (entityTemplate) => {
                await Promise.all(
                    Object.entries(entityTemplate.properties.properties).map(async ([propertyName, property]) => {
                        if (property.format === 'relationshipReference' && property.relationshipReference!.relatedTemplateId === originalTemplateId) {
                            if (!relatedEntityIdsByFieldToChange[propertyName]) relatedEntityIdsByFieldToChange[propertyName] = [];

                            const entities = await this.searchRelatedEntitiesOfEntitiesInTransaction(
                                originalEntityIds,
                                entityTemplate._id,
                                propertyName,
                                transaction,
                            );
                            const entityIds = entities.map((entity) => entity.properties._id);

                            relatedEntityIdsByFieldToChange[propertyName].push(...entityIds);
                        }
                    }),
                );
            }),
        );

        return relatedEntityIdsByFieldToChange;
    }

    async getAllRelationshipReferencesEntityTemplates(templateId: string, actions?: string) {
        const entityTemplates = await this.entityTemplateManagerService.searchEntityTemplates({ limit: 0, skip: 0 });
        const templatesMap = new Map(entityTemplates.map((template) => [template._id, template]));

        const baseTemplate = templatesMap.get(templateId)!;

        const templatePropertiesQueue = [baseTemplate.properties.properties];
        const relationshipReferenceIdsMap = new Map<string, IMongoEntityTemplate>([[templateId, { ...baseTemplate, actions }]]);

        while (templatePropertiesQueue.length > 0) {
            const currentEntityProperties = templatePropertiesQueue.shift()!;

            Object.values(currentEntityProperties).forEach((propertyValues) => {
                if (propertyValues.format === 'relationshipReference') {
                    const { relatedTemplateId = '' } = propertyValues.relationshipReference!;

                    if (!relationshipReferenceIdsMap.has(relatedTemplateId)) {
                        const relatedTemplate = templatesMap.get(relatedTemplateId)!;
                        relationshipReferenceIdsMap.set(relatedTemplateId, relatedTemplate);

                        templatePropertiesQueue.push(relatedTemplate.properties.properties);
                    }
                }
            });
        }

        return relationshipReferenceIdsMap;
    }

    async createOrDuplicateAction(
        metadata: ICreateEntityMetadata,
        transaction: Transaction,
        entitiesTemplatesByIds: Map<string, IMongoEntityTemplate>,
        userId?: string,
    ) {
        const { properties, templateId } = metadata;
        const entityTemplate = entitiesTemplatesByIds.get(templateId)!;
        const { createdEntity } = await this.createEntityInTransaction(transaction, properties, entityTemplate, userId);
        return createdEntity;
    }

    async updateAction(
        metadata: IUpdateEntityMetadata,
        transaction: Transaction,
        entitiesTemplatesByIds: Map<string, IMongoEntityTemplate>,
        userId?: string,
    ) {
        const { entityId } = metadata;
        const entity = await this.getEntityByIdInTransaction(entityId, transaction, false);
        const entityTemplate = entitiesTemplatesByIds.get(entity.templateId)!;
        const bulkManager = new BulkActionManager(this.workspaceId);

        const fixedFields = bulkManager.fixUpdatedFields(metadata, entityTemplate, entity);
        return this.updateEntityByIdInnerTransaction(
            entityId,
            fixedFields.updatedFields,
            entityTemplate,
            transaction,
            userId,
            undefined,
            false,
            false,
        );
    }

    async executeEntityTemplateActionOnInstanceCrud(
        { actionType, actionMetadata }: IAction,
        crudAction: IEntityCrudAction,
        entitiesTemplatesByIds: Map<string, IMongoEntityTemplate>,
        userId?: string,
        childTemplate?: IChildTemplatePopulated,
    ): Promise<IExecutionOutput[]> {
        return this.neo4jClient.performComplexTransaction(
            'writeTransaction',
            async (transaction) => {
                const actionHandlers: Record<
                    Exclude<
                        ActionTypes,
                        ActionTypes.UpdateStatus | ActionTypes.CreateRelationship | ActionTypes.DeleteRelationship | ActionTypes.CronjobRun
                    >,
                    () => Promise<IEntity | undefined>
                > = {
                    [ActionTypes.CreateEntity]: async () =>
                        this.createOrDuplicateAction(actionMetadata as ICreateEntityMetadata, transaction, entitiesTemplatesByIds, userId),
                    [ActionTypes.DuplicateEntity]: async () =>
                        this.createOrDuplicateAction(actionMetadata as ICreateEntityMetadata, transaction, entitiesTemplatesByIds, userId),
                    [ActionTypes.UpdateEntity]: async () => {
                        const { updatedEntity } = await this.updateAction(
                            actionMetadata as IUpdateEntityMetadata,
                            transaction,
                            entitiesTemplatesByIds,
                            userId,
                        );
                        return updatedEntity;
                    },
                };

                const handler = actionHandlers[actionType];
                const entityAfterAction: IEntity = await handler();
                const entityTemplate = entitiesTemplatesByIds.get(entityAfterAction.templateId)!;

                return executeActionCodeAndGetEntitiesToUpdate(
                    entityTemplate,
                    entityAfterAction,
                    crudAction,
                    transaction,
                    entitiesTemplatesByIds,
                    this.workspaceId,
                    childTemplate,
                );
            },
            true,
        );
    }

    buildMainAction = (
        crudAction: IEntityCrudAction,
        properties: IEntity['properties'],
        entityTemplate: IMongoEntityTemplate,
        entity?: IEntity,
        duplicatedFromId?: string,
    ): IAction => {
        switch (crudAction) {
            case IEntityCrudAction.onUpdateEntity:
                return {
                    actionType: ActionTypes.UpdateEntity,
                    actionMetadata: {
                        entityId: entity?.properties._id,
                        updatedFields: this.getUpdatedProperties(entity?.properties ?? {}, properties, entityTemplate),
                        before: entity?.properties,
                    } as IUpdateEntityMetadata,
                };

            case IEntityCrudAction.onCreateEntity:
                return duplicatedFromId
                    ? {
                          actionType: ActionTypes.DuplicateEntity,
                          actionMetadata: {
                              templateId: entityTemplate._id,
                              properties,
                              entityIdToDuplicate: duplicatedFromId,
                          } as IDuplicateEntityMetadata,
                      }
                    : {
                          actionType: ActionTypes.CreateEntity,
                          actionMetadata: { templateId: entityTemplate._id, properties } as ICreateEntityMetadata,
                      };

            default:
                throw new ValidationError('Invalid crudAction');
        }
    };

    buildUpdatedActions = async (
        properties: IEntity['properties'],
        entityTemplate: IMongoEntityTemplate,
        entitiesToUpdate: IExecutionOutput[],
        entitiesTemplatesByIds: Map<string, IMongoEntityTemplate>,
    ) => {
        const actions: IAction[] = [];

        await Promise.all(
            entitiesToUpdate.map(async ({ entityId, properties: allProperties }) => {
                let updatedFields: Record<string, IPropertyValue>;
                let before: Record<string, IPropertyValue>;

                if (entityId.startsWith(brokenRulesFakeEntityIdPrefix)) {
                    updatedFields = this.getUpdatedProperties(properties, allProperties, entityTemplate);
                    before = properties;
                } else {
                    const currentEntity = await this.getEntityById(entityId);
                    const currentEntityTemplate = entitiesTemplatesByIds.get(currentEntity.templateId)!;
                    const currentNotPopulated = {
                        ...currentEntity,
                        properties: this.relationshipReferenceObjectToId(currentEntity, currentEntityTemplate),
                    };

                    updatedFields = this.getUpdatedProperties(currentNotPopulated.properties, allProperties, currentEntityTemplate);
                    before = currentEntity.properties;
                }

                if (!Object.entries(updatedFields).length) return;

                actions.push({
                    actionType: ActionTypes.UpdateEntity,
                    actionMetadata: {
                        entityId,
                        updatedFields,
                        before,
                    } as IUpdateEntityMetadata,
                });
            }),
        );

        return actions;
    };

    buildActionsArray = async (
        crudAction: IEntityCrudAction,
        properties: IEntity['properties'],
        entityTemplate: IMongoEntityTemplate,
        userId?: string,
        entity?: IEntity,
        duplicatedFromId?: string,
        childTemplate?: IChildTemplatePopulated,
    ) => {
        const entitiesTemplatesByIds = await this.getAllRelationshipReferencesEntityTemplates(entityTemplate._id, entityTemplate.actions);

        const mainAction = this.buildMainAction(crudAction, properties, entityTemplate, entity, duplicatedFromId);

        const entitiesToUpdate = await this.executeEntityTemplateActionOnInstanceCrud(
            mainAction,
            crudAction,
            entitiesTemplatesByIds,
            userId,
            childTemplate,
        );
        const actionsOfUpdatedEntities = await this.buildUpdatedActions(properties, entityTemplate, entitiesToUpdate, entitiesTemplatesByIds);

        return [mainAction, ...actionsOfUpdatedEntities];
    };

    fixActions = (actions: IAction[], results: IEntity[]) =>
        actions.map((action, index) => {
            const { actionMetadata, actionType } = action;

            if (actionType === ActionTypes.CreateEntity || actionType === ActionTypes.DuplicateEntity)
                return {
                    ...action,
                    actionMetadata: {
                        ...actionMetadata,
                        properties: results[index].properties,
                    },
                };

            if (actionType === ActionTypes.UpdateEntity) {
                const { entityId } = actionMetadata as IUpdateEntityMetadata;

                if (entityId.startsWith(brokenRulesFakeEntityIdPrefix)) {
                    const numberPart = parseInt(entityId.slice(1, -4), 10);
                    const createdEntity = results[numberPart] as IEntity;

                    return {
                        ...action,
                        actionMetadata: {
                            ...actionMetadata,
                            entityId: createdEntity.properties._id,
                        },
                    };
                }
            }

            return action;
        });

    private async createEntityPipelineInTransaction(
        transaction: Transaction,
        properties: IEntity['properties'],
        template: IMongoEntityTemplate,
        userId: string,
        duplicatedFromId?: string,
        childTemplate?: IChildTemplatePopulated,
        newDestWallet?: IEntity,
        ignoredRules: IBrokenRule[] = [],
    ): Promise<{ createdEntity: IEntity; emails: IRuleMail[]; actions: IAction[]; activityLogsToCreate?: Omit<IActivityLog, '_id'>[] }> {
        const updatedProperties = properties;

        if (template.actions && isBodyFunctionHasContent(template.actions, IEntityCrudAction.onCreateEntity)) {
            const actions = await this.buildActionsArray(
                IEntityCrudAction.onCreateEntity,
                updatedProperties,
                template,
                userId,
                newDestWallet,
                duplicatedFromId,
                childTemplate,
            );

            const bulkManager = new BulkActionManager(this.workspaceId);
            const results = await bulkManager.runBulkOfActions(actions, ignoredRules, false, userId);
            const createdEntity = await this.getEntityById(results.instances[0].properties._id);
            const fixedActions = this.fixActions(actions, results.instances);
            return { createdEntity, actions: fixedActions, emails: results.emails };
        }

        const { createdEntity, activityLogsToCreate } = await this.createEntityInTransaction(
            transaction,
            updatedProperties,
            template,
            userId,
            newDestWallet,
            duplicatedFromId,
        );

        const ruleFailures = await this.runRulesOnEntity(transaction, createdEntity);

        const [indicatorRules, rulesToThrowError] = partition(ruleFailures, (r) => r.rule.actionOnFail === ActionOnFail.INDICATOR);

        throwIfActionCausedRuleFailures(ignoredRules, [], rulesToThrowError, [{ createdEntityId: createdEntity.properties._id }], []);

        const { updatedEntity } = await this.updateEntityByIdInnerTransaction(
            createdEntity.properties._id,
            createdEntity.properties,
            template,
            transaction,
            userId,
            indicatorRules,
        );

        return {
            createdEntity: updatedEntity,
            emails: indicatorRules.flatMap((r) => (r.rule.mail?.display ? r.rule.mail : [])),
            actions: [],
            activityLogsToCreate,
        };
    }

    async createEntity(
        properties: IEntity['properties'],
        entityTemplate: IMongoEntityTemplate,
        ignoredRules: IBrokenRule[],
        userId: string,
        duplicatedFromId?: string,
        childTemplateId?: string,
        newDestWalletData?: IEntity,
    ) {
        let template = entityTemplate;
        let childTemplate: IChildTemplatePopulated | undefined;

        if (childTemplateId) {
            childTemplate = await this.childTemplateManagerService.getChildTemplateById(childTemplateId);
            template = { ...entityTemplate, actions: childTemplate.actions };
        }

        return this.neo4jClient
            .performComplexTransaction('writeTransaction', async (transaction) => {
                const allActivityLogsToCreate: Omit<IActivityLog, '_id'>[] = [];
                let destWalletResult: {
                    createdEntity: IEntity;
                    emails: IRuleMail[];
                    actions: IAction[];
                    activityLogsToCreate?: Omit<IActivityLog, '_id'>[];
                } | null = null;
                let newDestWallet: IEntity | undefined;

                if (template.walletTransfer && newDestWalletData) {
                    const destTemplate = await this.entityTemplateManagerService.getEntityTemplateById(newDestWalletData.templateId);

                    destWalletResult = await this.createEntityPipelineInTransaction(
                        transaction,
                        newDestWalletData.properties,
                        destTemplate,
                        userId,
                        undefined,
                        undefined,
                        undefined,
                        ignoredRules,
                    );

                    newDestWallet = destWalletResult.createdEntity;
                    if (destWalletResult.activityLogsToCreate) allActivityLogsToCreate.push(...destWalletResult.activityLogsToCreate);
                    properties[template.walletTransfer.to] = newDestWallet?.properties._id;
                }

                const entityResult = await this.createEntityPipelineInTransaction(
                    transaction,
                    properties,
                    template,
                    userId,
                    duplicatedFromId,
                    childTemplate,
                    newDestWallet,
                    ignoredRules,
                );

                if (entityResult.activityLogsToCreate) {
                    allActivityLogsToCreate.push(...entityResult.activityLogsToCreate);
                }

                await Promise.all(allActivityLogsToCreate.map((l) => this.activityLogProducer.createActivityLog(l)));

                return {
                    createdEntity: entityResult.createdEntity,
                    emails: [...(destWalletResult?.emails ?? []), ...entityResult.emails],
                };
            })
            .catch((err) => this.throwServiceErrorIfFailedConstraintsValidation(err));
    }

    async searchEntitiesOfTemplate(searchBody: ISearchEntitiesOfTemplateBody, entityTemplate: IMongoEntityTemplate) {
        const searchBodyOfTemplate: ISearchBatchBody = {
            skip: searchBody.skip,
            limit: searchBody.limit,
            textSearch: searchBody.textSearch,
            templates: {
                [entityTemplate._id]: {
                    filter: searchBody.filter,
                    showRelationships: searchBody.showRelationships,
                },
            },
            sort: searchBody.sort ?? [],
            entityIdsToInclude: searchBody.entityIdsToInclude,
            entityIdsToExclude: searchBody.entityIdsToExclude,
            userEntityId: searchBody.userEntityId,
        };

        const searchCypherQuery = searchWithRelationshipsToNeoQuery(searchBodyOfTemplate, new Map([[entityTemplate._id, entityTemplate]]));

        const searchCountCypherQuery = searchWithRelationshipsToNeoQuery(searchBodyOfTemplate, new Map([[entityTemplate._id, entityTemplate]]), true);

        const [entities, count] = await Promise.all([
            this.neo4jClient.readTransaction(
                searchCypherQuery.cypherQuery,
                (result) => normalizeSearchWithRelationships(result, this.workspaceId),
                searchCypherQuery.parameters,
            ),
            this.neo4jClient.readTransaction(searchCountCypherQuery.cypherQuery, normalizeResponseCount, searchCountCypherQuery.parameters),
        ]);

        return { entities, count };
    }

    async searchEntitiesByTemplates(searchByTemplates: ISearchEntitiesByTemplatesBody, entityTemplatesMap: Map<string, IMongoEntityTemplate>) {
        const results: {
            [templateId: string]: {
                entities: IEntityWithDirectRelationships[];
                count: number;
            };
        } = {};

        const { searchConfigs } = searchByTemplates;

        await Promise.all(
            Object.entries(searchConfigs).map(async ([templateId, searchBody]) => {
                const entityTemplate = entityTemplatesMap.get(templateId)!;
                const { entities, count } = await this.searchEntitiesOfTemplate(searchBody, entityTemplate);
                results[templateId] = { entities, count };
            }),
        );

        return results;
    }

    async getEntitiesCountByTemplates(templateIds: string[], semanticSearchResult: ISemanticSearchResult = {}, textSearch = '') {
        const includeSemantic = Boolean(Object.keys(semanticSearchResult).length);

        const entityIdMatch = includeSemantic
            ? `
            UNION
            MATCH (node)
            // Search for entities that have an Id of specific entities (keys($semanticSearchResult[templateId]))
            // and that are in the current searched template
            WHERE templateId IN labels(node)
                AND $semanticSearchResult[templateId] IS NOT NULL
                AND node._id IN keys($semanticSearchResult[templateId])
            RETURN node
        `
            : '';

        const textSearchFixed = `*${escapeNeo4jQuerySpecialChars((textSearch || '').toLowerCase())}*`;

        const query = `
            UNWIND $templateIds AS templateId
            CALL (templateId) {
                WITH $textSearchFixed as textSearch, '${config.neo4j.templateSearchIndexPrefix}' + templateId AS indexName
                CALL db.index.fulltext.queryNodes(indexName, textSearch) YIELD node, score
                RETURN node
                ${entityIdMatch}
            }
            RETURN templateId, count(node) as count ${includeSemantic ? ', $semanticSearchResult[templateId] as entitiesWithFiles' : ''};
        `;

        return this.neo4jClient.readTransaction(query, normalizeResponseTemplatesCount, {
            templateIds,
            textSearchFixed,
            ...(includeSemantic && { semanticSearchResult }),
        });
    }

    async countEntitiesOfTemplatesByUserEntityId(templateIds: string[], userEntityId: string) {
        const query = `
            UNWIND $templateIds AS templateId
            MATCH (s) -[r]-> (d)
            WHERE labels(s)[0] = templateId AND d._id = $userEntityId
            RETURN templateId, count(s) as count
        `;

        return this.neo4jClient.readTransaction(query, normalizeResponseTemplatesCount, {
            templateIds,
            userEntityId,
        });
    }

    searchRelatedEntitiesOfEntitiesInTransaction(
        entityIds: string[],
        entityTemplateId: string,
        relationshipReferenceFieldName: string,
        transaction: Transaction,
    ) {
        return runInTransactionAndNormalize(
            transaction,
            `MATCH (e: \`${entityTemplateId}\`)
            WHERE e.\`${relationshipReferenceFieldName}.properties._id${config.neo4j.relationshipReferencePropertySuffix}\` IN $entityIds
            RETURN e
            `,
            normalizeReturnedEntity('multipleResponses', { type: 'function', metadata: this.workspaceId }),
            { entityIds },
        );
    }

    async searchEntitiesBatch(searchBody: ISearchBatchBody, entityTemplatesMap: Map<string, IMongoEntityTemplate>) {
        const globalSearchIndexes = await this.neo4jClient.getAllGlobalSearchIndexNames();

        if (globalSearchIndexes.length === 0) {
            throw new ValidationError(`[NEO4J] Global search index not found.`);
        }

        const searchCypherQuery = searchWithRelationshipsToNeoQuery(searchBody, entityTemplatesMap, false, globalSearchIndexes);
        const searchCountCypherQuery = searchWithRelationshipsToNeoQuery(searchBody, entityTemplatesMap, true, globalSearchIndexes);

        const [entities, count] = await Promise.all([
            this.neo4jClient.readTransaction(
                searchCypherQuery.cypherQuery,
                (result) => normalizeSearchWithRelationships(result, this.workspaceId),
                searchCypherQuery.parameters,
            ),
            this.neo4jClient.readTransaction(searchCountCypherQuery.cypherQuery, normalizeResponseCount, searchCountCypherQuery.parameters),
        ]);

        return { entities, count };
    }

    private buildBaseQuery() {
        return `
            WITH $templates AS templates
            UNWIND keys(templates) AS templateId
            WITH templateId, templates[templateId] AS templateData
            MATCH (n)
            WHERE labels(n) = [templateId]
        `;
    }

    private buildCircleQuery() {
        return `
            AND templateData.circle IS NOT NULL

            WITH n, templateData,
            point({
                latitude: templateData.circle.coordinate[0],
                longitude: templateData.circle.coordinate[1]
            }) AS circle_center

            // Filter location fields within the circle
            WITH n, templateData, circle_center,
            [ field IN templateData.locationFields
            WHERE n[field] IS NOT NULL AND (
                // Check if n[field] is a list (polygon)
                (n[field][0] IS NOT NULL AND
                ANY(pointItem IN n[field] WHERE point.distance(pointItem, circle_center) <= templateData.circle.radius)
                ) OR
                // Else, n[field] is a single point
                (n[field] IS NOT NULL AND
                point.distance(n[field], circle_center) <= templateData.circle.radius
                )
            )
            | field ] AS matchingFields

            WITH n, matchingFields
            WHERE size(matchingFields) > 0

            RETURN n, matchingFields
        `;
    }

    private buildBoundingBox(coordFields: { lon: string; lat: string } = { lon: 'longitude', lat: 'latitude' }): string {
        return `
        reduce(minLon = ${maxLongitude}, p IN searchPolygon | CASE WHEN p.${coordFields.lon} < minLon THEN p.${coordFields.lon} ELSE minLon END) AS polyMinLon,
        reduce(maxLon = ${minLongitude}, p IN searchPolygon | CASE WHEN p.${coordFields.lon} > maxLon THEN p.${coordFields.lon} ELSE maxLon END) AS polyMaxLon,
        reduce(minLat = ${maxLatitude}, p IN searchPolygon | CASE WHEN p.${coordFields.lat} < minLat THEN p.${coordFields.lat} ELSE minLat END) AS polyMinLat,
        reduce(maxLat = ${minLatitude}, p IN searchPolygon | CASE WHEN p.${coordFields.lat} > maxLat THEN p.${coordFields.lat} ELSE maxLat END) AS polyMaxLat
    `;
    }

    private buildPolygonQuery() {
        // filter entities that their bounding box is intersecting the search polygon bounding box
        return `
            AND templateData.polygon IS NOT NULL

            WITH n, templateData,
            [p IN templateData.polygon | point({longitude: p[0], latitude: p[1], crs:'wgs-84'})] AS searchPolygon

            // Compute search polygon bounding box
            WITH n, templateData, searchPolygon,
            ${this.buildBoundingBox()}
            WITH n, templateData, polyMinLon, polyMaxLon, polyMinLat, polyMaxLat,
             point({longitude: polyMinLon, latitude: polyMinLat, crs:'wgs-84'}) AS lowerLeft,
             point({longitude: polyMaxLon, latitude: polyMaxLat, crs:'wgs-84'}) AS upperRight

            WITH n, templateData, lowerLeft, upperRight,
             [ field IN templateData.locationFields
               WHERE n[field] IS NOT NULL AND (
                 // Case 1: polygon (list of points → build its bounding box)
                 (n[field][0] IS NOT NULL AND
                reduce(minLon = ${maxLongitude}, pt IN n[field] | CASE WHEN pt.x < minLon THEN pt.x ELSE minLon END) <= polyMaxLon AND
                reduce(maxLon = ${minLongitude}, pt IN n[field] | CASE WHEN pt.x > maxLon THEN pt.x ELSE maxLon END) >= polyMinLon AND
                reduce(minLat = ${maxLatitude}, pt IN n[field] | CASE WHEN pt.y < minLat THEN pt.y ELSE minLat END) <= polyMaxLat AND
                reduce(maxLat = ${minLatitude}, pt IN n[field] | CASE WHEN pt.y > maxLat THEN pt.y ELSE maxLat END) >= polyMinLat
                 )
                 OR
                 // Case 2: single point
                 (point.withinBBox(n[field], lowerLeft, upperRight))
               )
             | field ] AS matchingFields

            WITH n, matchingFields
            WHERE size(matchingFields) > 0
            RETURN n, matchingFields
        `;
    }

    private filterIntersectingEntities(searchResults: { node: IEntity; matchingFields: string[] }[], polygon: Polygon) {
        const polygonCoords = closePolygon(polygon);
        const searchPolygon = turfPolygon([polygonCoords]);

        return searchResults.flatMap(({ node, matchingFields }) => {
            const filteredFields = matchingFields.filter((field) => {
                const nodeFieldValue = node.properties[field].location;
                const neo4jLocation = getNeo4jLocation(nodeFieldValue, node.properties, field);

                if (Array.isArray(neo4jLocation)) {
                    const coords = neo4jLocation.map((p): [number, number] => [p.x, p.y]);
                    const closedPolygon = closePolygon(coords);
                    const entityPolygon = turfPolygon([closedPolygon]);
                    return Boolean(intersect(featureCollection([searchPolygon, entityPolygon])));
                }

                const entityPoint = turfPoint([neo4jLocation.x, neo4jLocation.y]);
                return booleanPointInPolygon(entityPoint, searchPolygon);
            });

            return filteredFields.length ? [{ node, matchingFields: filteredFields }] : [];
        });
    }

    async searchEntitiesByLocation(requestBody: ISearchEntitiesByLocationBody) {
        const { circle, polygon, templates } = requestBody;

        if (!circle && !polygon) throw new ValidationError('Payload must include either circle or polygon.');

        let query: string = this.buildBaseQuery();

        query += circle ? this.buildCircleQuery() : this.buildPolygonQuery();

        const updatedTemplates = Object.fromEntries(Object.entries(templates).map(([key, value]) => [key, { ...value, circle, polygon }]));

        const searchResults = await this.neo4jClient.readTransaction(query, (result) => normalizeSearchByLocationResponse(result, this.workspaceId), {
            templates: updatedTemplates,
        });

        if (!polygon) return searchResults;

        return this.filterIntersectingEntities(searchResults, polygon);
    }

    async getEntityById(id: string, isGetMode: boolean = true) {
        const node = await this.neo4jClient.readTransaction(
            `MATCH (e {_id: '${id}'}) RETURN e`,
            normalizeReturnedEntity('singleResponse', { type: 'function', metadata: this.workspaceId }, isGetMode),
        );

        if (!node) throw new NotFoundError(`[NEO4J] entity "${id}" not found`);

        return node;
    }

    /**
     * Converts a flattened entity (that has a relationshipReference field) into an unflattened (nested) entity
     * @param acc accumulator, accumulates the unflattened fields and in the end becomes the unflattened entity properties
     * @returns the unflattened properties of the previously flattened entity
     */
    static fixReturnedEntityReferencesFields(properties: IEntity['properties'], acc: IEntity['properties'] = {}) {
        Object.entries(properties).forEach(([key, value]) => {
            if (!key.endsWith(config.neo4j.relationshipReferencePropertySuffix)) {
                acc[key] = value;
                return;
            }

            acc[key.replace(config.neo4j.relationshipReferencePropertySuffix, '')] = value;
        });

        acc = unflatten(acc);

        Object.entries(acc).forEach(async ([key, value]) => {
            if (!value.properties) return;
            const { properties: props, coloredFields } = await normalizeFields(flatten(value.properties, { safe: true }));
            acc[key] = { ...value, properties: EntityManager.fixReturnedEntityReferencesFields(props), coloredFields };
        });

        return acc;
    }

    async getEntitiesByIds(ids: string[]) {
        return this.neo4jClient.readTransaction(
            `MATCH (e) WHERE e._id IN $ids RETURN e`,
            normalizeReturnedEntity('multipleResponses', { type: 'function', metadata: this.workspaceId }),
            { ids },
        );
    }

    async getNestedRelationshipTemplatesForPrint(
        id: string,
        reqBody: Pick<IGetExpandedEntityBody, 'templateIds' | 'expandedParams' | 'relationshipIds'>,
        entityTemplatesMap: Map<string, IMongoEntityTemplate>,
        relationShipsMap: Map<string, IMongoRelationshipTemplate>,
        userId: string,
    ) {
        const { templateIds, expandedParams, relationshipIds } = reqBody;

        const childTemplates = await this.childTemplateManagerService.searchChildTemplates();
        const templateIdsWithChildren = Array.from(new Set([...templateIds, ...childTemplates.map(({ parentTemplate: { _id } }) => _id)]));

        const initialCypherQuery = getOnlyTemplateIdsTree(id, templateIdsWithChildren, relationshipIds, expandedParams);

        const initialExpandedEntity = await this.neo4jClient.readTransaction<IRelationShipTreeNode[]>(
            initialCypherQuery.cypherQuery,
            buildTemplateTree(entityTemplatesMap, relationShipsMap),
            initialCypherQuery.parameters,
        );

        if (!initialExpandedEntity) throw new NotFoundError(`[NEO4J] entity "${id}" not found`);

        if (JSON.stringify(expandedParams) === '{}') return initialExpandedEntity;

        await this.activityLogProducer.createActivityLog({
            action: ActionsLog.VIEW_ENTITY,
            entityId: id,
            metadata: {},
            timestamp: new Date(),
            userId,
        });

        return initialExpandedEntity;
    }

    async printEntities(rootId: string, relationshipIds: string[], isShowDisabled: boolean) {
        const initialCypherQuery = getEntitiesForPrintByRelIds(relationshipIds, isShowDisabled);

        return this.neo4jClient.readTransaction(
            initialCypherQuery.cypherQuery,
            buildEntityTree(rootId, this.workspaceId),
            initialCypherQuery.parameters,
        );
    }

    async getExpandedGraphById(id: string, reqBody: IGetExpandedEntityBody, entityTemplatesMap: Map<string, IMongoEntityTemplate>, userId: string) {
        const { templateIds, expandedParams, filters, relationshipIds } = reqBody;

        const fixSearchBody = filters ?? {};

        const childTemplates = await this.childTemplateManagerService.searchChildTemplates();
        const templateIdsWithChildren = Array.from(new Set([...templateIds, ...childTemplates.map(({ parentTemplate: { _id } }) => _id)]));

        const initialCypherQuery = expandEntityToNeoQuery(
            fixSearchBody,
            id,
            templateIdsWithChildren,
            relationshipIds,
            expandedParams,
            entityTemplatesMap,
            id,
        );

        const initialExpandedEntity = await this.neo4jClient.readTransaction(
            initialCypherQuery.cypherQuery,
            normalizeReturnedRelAndEntities(this.workspaceId),
            initialCypherQuery.parameters,
        );

        if (!initialExpandedEntity) throw new NotFoundError(`[NEO4J] entity "${id}" not found`);

        if (JSON.stringify(expandedParams) === '{}') return initialExpandedEntity;

        await this.activityLogProducer.createActivityLog({
            action: ActionsLog.VIEW_ENTITY,
            entityId: id,
            metadata: {},
            timestamp: new Date(),
            userId,
        });

        return initialExpandedEntity;
    }

    async deleteRelationshipReferenceInTransaction({
        originalEntityId,
        relatedEntityId,
        relationshipReference,
        transaction,
    }: IDeleteRelationshipReference) {
        const { relationshipTemplateId, relationshipTemplateDirection } = relationshipReference;

        const sourceEntityId = relationshipTemplateDirection === 'incoming' ? relatedEntityId : originalEntityId;
        const destinationEntityId = relationshipTemplateDirection === 'incoming' ? originalEntityId : relatedEntityId;
        const templateId = relationshipTemplateId!;

        const relationshipToDelete = await this.relationshipManager.getRelationshipByEntitiesAndTemplate(
            sourceEntityId,
            destinationEntityId,
            templateId,
            transaction,
        );

        return this.relationshipManager.deleteRelationshipByIdInTransaction(relationshipToDelete.properties._id, [], transaction);
    }

    async getSelectedEntities(
        searchBody: IMultipleSelect<boolean>,
        entityTemplate: IMongoEntityTemplate,
        showRelationships = true,
    ): Promise<IEntityWithDirectRelationships[]> {
        if (searchBody.selectAll) {
            const { idsToExclude, filter, textSearch = '' } = searchBody as IMultipleSelect<true>;

            const { entities } = await this.searchEntitiesOfTemplate(
                { sort: [], limit: deleteEntitiesMaxLimit, skip: 0, filter, showRelationships, textSearch, entityIdsToExclude: idsToExclude },
                entityTemplate,
            );

            return entities;
        } else {
            const { idsToInclude } = searchBody as IMultipleSelect<false>;
            const { entities } = await this.searchEntitiesOfTemplate(
                {
                    sort: [],
                    limit: deleteEntitiesMaxLimit,
                    skip: 0,
                    showRelationships,
                    entityIdsToInclude: idsToInclude,
                    filter: { $and: [{ _id: { $in: idsToInclude } }] },
                },
                entityTemplate,
            );

            return entities;
        }
    }

    async getEntitiesToDeleteWithoutRelationships(
        entities: IEntityWithDirectRelationships[],
        { properties: { properties: entityTemplateProperties } }: IMongoEntityTemplate,
        transaction: Transaction,
        deleteAllRelationships?: boolean,
    ) {
        const entitiesCanDelete: IEntity[] = [];

        for (const { entity, relationships } of entities) {
            if (!relationships?.length) {
                entitiesCanDelete.push(entity);
                continue;
            }

            let entityCanDelete = true;
            const relationshipReferencesToDelete: Omit<IDeleteRelationshipReference, 'transaction'>[] = [];

            for (const relationship of relationships) {
                const { templateId, sourceEntityId, destinationEntityId } = relationship.relationship;
                const { _id, isProperty, name } = await this.relationshipsTemplateManagerService.getRelationshipTemplateById(templateId);

                if (isProperty) {
                    const templateProperty = entityTemplateProperties[name];
                    if (!templateProperty) {
                        entityCanDelete = false;
                        break;
                    }

                    const { relationshipReference } = templateProperty;
                    if (!relationshipReference || relationshipReference.relationshipTemplateId !== _id) {
                        entityCanDelete = false;
                        break;
                    }

                    relationshipReferencesToDelete.push({
                        relationshipReference: relationshipReference!,
                        originalEntityId: relationshipReference!.relationshipTemplateDirection === 'incoming' ? destinationEntityId : sourceEntityId,
                        relatedEntityId: relationshipReference!.relationshipTemplateDirection === 'incoming' ? sourceEntityId : destinationEntityId,
                    });
                } else if (!deleteAllRelationships) {
                    entityCanDelete = false;
                    break;
                }
            }

            if (!entityCanDelete) continue;

            entitiesCanDelete.push(entity);

            for (const relationshipReferenceToDelete of relationshipReferencesToDelete)
                await this.deleteRelationshipReferenceInTransaction({ ...relationshipReferenceToDelete, transaction });
        }

        return entitiesCanDelete;
    }

    getFilesProperties({ properties: { properties } }: IMongoEntityTemplate) {
        return Object.keys(properties).reduce(
            (acc, propertyToRemove) => {
                const { format, items } = properties[propertyToRemove];

                if (format === 'fileId' || items?.format === 'fileId') {
                    acc[propertyToRemove] = items?.format === 'fileId';
                }

                return acc;
            },
            {} as Record<string, boolean>,
        );
    }

    getFilesOfEntities(entitiesToDelete: IEntity[], entityTemplate: IMongoEntityTemplate) {
        const filesProperties = this.getFilesProperties(entityTemplate);

        return entitiesToDelete.reduce<string[]>((filesIds, { properties }) => {
            Object.entries(filesProperties).forEach(([key, isMultiple]) => {
                const propertyValue = properties[key];

                if (propertyValue) filesIds.push(...(isMultiple ? propertyValue : [propertyValue]));
            });
            return filesIds;
        }, []);
    }

    async deleteEntityInstancesInTransaction(transaction: Transaction, ids: string[], templateId: string, deleteAllRelationships?: boolean) {
        return runInTransactionAndNormalize(
            transaction,
            `MATCH (e:\`${templateId}\`) 
             WHERE e._id IN $ids
            ${deleteAllRelationships ? 'DETACH' : ''}
            DELETE e`,
            normalizeReturnedEntity('multipleResponses', { type: 'function', metadata: this.workspaceId }),
            { ids },
        );
    }

    handleDeleteErrors(allowedEntitiesToDelete: IEntity[], deleteAllRelationships?: boolean) {
        if (allowedEntitiesToDelete.length >= deleteEntitiesMaxLimit)
            throw new BadRequestError(`can't delete more then ${deleteEntitiesMaxLimit} instances`);

        if (!allowedEntitiesToDelete.length) {
            if (deleteAllRelationships)
                throw new BadRequestError('Some entities have a relationshipReference field.', {
                    errorCode: config.errorCodes.entityHasRelationshipReferenceField,
                });
            else
                throw new BadRequestError('Some entities have a relationships.', {
                    errorCode: config.errorCodes.entityHasRelationships,
                });
        }
    }

    async deleteEntityInstances(deleteBody: IDeleteEntityBody) {
        let entityIdsToDelete: string[] = [];
        const { deleteAllRelationships, templateId } = deleteBody;

        try {
            return await this.neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
                const entityTemplate = await this.entityTemplateManagerService.getEntityTemplateById(templateId);
                const entitiesToDelete = await this.getSelectedEntities(deleteBody, entityTemplate);
                const allowedEntitiesToDelete = await this.getEntitiesToDeleteWithoutRelationships(
                    entitiesToDelete,
                    entityTemplate,
                    transaction,
                    deleteAllRelationships,
                );

                this.handleDeleteErrors(allowedEntitiesToDelete, deleteAllRelationships);
                entityIdsToDelete = allowedEntitiesToDelete.map(({ properties: { _id } }) => _id);
                await this.deleteEntityInstancesInTransaction(transaction, entityIdsToDelete, templateId, deleteAllRelationships);

                return this.getFilesOfEntities(allowedEntitiesToDelete, entityTemplate);
            });
        } catch (error) {
            if (error instanceof Neo4jError && error.code === 'Neo.ClientError.Schema.ConstraintValidationFailed')
                throw new BadRequestError(`[NEO4J] some entities with ids ${entityIdsToDelete} have existing relationships. Delete them first.`, {
                    errorCode: config.errorCodes.entityHasRelationships,
                });

            throw error;
        }
    }

    async getIsFieldUsed(id: string, fieldValue: string, fieldName: string, type: string) {
        let node: Record<string, IPropertyValue> | null;
        if (type === 'array') {
            node = await this.neo4jClient.readTransaction(
                `MATCH (e: \`${id}\`) WHERE '${fieldValue}' IN e.${fieldName} RETURN e`,
                normalizeReturnedEntity('singleResponse', { type: 'function', metadata: this.workspaceId }),
            );
        } else {
            node = await this.neo4jClient.readTransaction(
                `MATCH (e: \`${id}\`) WHERE e.${fieldName} = '${fieldValue}' RETURN e`,
                normalizeReturnedEntity('singleResponse', { type: 'function', metadata: this.workspaceId }),
            );
        }
        return node;
    }

    async deleteByTemplateId(templateId: string) {
        return this.neo4jClient.writeTransaction(
            `MATCH (e: \`${templateId}\`) DETACH DELETE e`,
            normalizeReturnedEntity('multipleResponses', { type: 'function', metadata: this.workspaceId }),
        );
    }

    async updateStatusById(id: string, disabled: boolean, ignoredRules: IBrokenRule[], userId: string) {
        const updateEntity = await this.neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
            const entity = await runInTransactionAndNormalize(
                transaction,
                `MATCH (e {_id: '${id}'}) RETURN e`,
                normalizeReturnedEntity('singleResponse', { type: 'function', metadata: this.workspaceId }),
            );

            if (!entity) {
                throw new NotFoundError(`[NEO4J] entity "${id}" not found`);
            }

            const entityTemplate = await this.entityTemplateManagerService.getEntityTemplateById(entity.templateId);
            const updatedProperties = this.getKeysOfUpdatedProperties(
                entity.properties,
                { ...entity.properties, disabled, updatedAt: new Date().toISOString() },
                entityTemplate,
            );

            const ruleFailuresBeforeAction = await this.runRulesDependOnEntityUpdate(transaction, entity, updatedProperties);

            const updatedEntity = await runInTransactionAndNormalize(
                transaction,
                `MATCH (e {_id: '${id}'}) SET e.disabled = $disabled RETURN e`,
                normalizeReturnedEntity('singleResponseNotNullable', { type: 'function', metadata: this.workspaceId }),
                { disabled },
            );

            await this.updateRelationshipReference(updatedEntity, updatedProperties, transaction, entityTemplate);

            const ruleFailuresAfterAction = await this.runRulesDependOnEntityUpdate(transaction, updatedEntity, updatedProperties);

            throwIfActionCausedRuleFailures(ignoredRules, ruleFailuresBeforeAction, ruleFailuresAfterAction, [{}], []);

            return updatedEntity;
        });

        await this.activityLogProducer.createActivityLog({
            action: disabled ? ActionsLog.DISABLE_ENTITY : ActionsLog.ACTIVATE_ENTITY,
            metadata: {},
            entityId: id,
            timestamp: new Date(),
            userId,
        });

        return updateEntity;
    }

    private runRulesOnEntity = async (transaction: Transaction, entity: IEntity, updatedProperties?: string[]): Promise<IRuleFailure[]> => {
        const rulesOfEntity = await this.relationshipsTemplateManagerService.searchRules({
            entityTemplateIds: [entity.templateId],
        });

        const relevantRulesOfEntity = filterDependentRulesOnEntity(rulesOfEntity, entity.templateId, updatedProperties);

        const entityTemplate = await this.entityTemplateManagerService.getEntityTemplateById(entity.templateId);

        return runRulesOnEntity(transaction, entity.properties._id, relevantRulesOfEntity, entityTemplate);
    };

    getNeighborsOfUpdatedEntityForRuleInTransaction = (transaction: Transaction, entityId: string) =>
        runInTransactionAndNormalize(transaction, `MATCH (e {_id: '${entityId}'})-[r]-(neighbor) RETURN type(r) as rTemplate, neighbor`, (result) =>
            normalizeNeighborsOfEntityForRule(result, this.workspaceId),
        );

    getNeighborsOfUpdatedEntityForRule = (entityId: string) =>
        this.neo4jClient.readTransaction(`MATCH (e {_id: '${entityId}'})-[r]-(neighbor) RETURN type(r) as rTemplate, neighbor`, (result) =>
            normalizeNeighborsOfEntityForRule(result, this.workspaceId),
        );

    private runRulesOnNeighborsOfUpdatedEntity = async (
        transaction: Transaction,
        updatedEntity: IEntity,
        updatedProperties: string[],
    ): Promise<IRuleFailure[]> => {
        const neighborsOfUpdatedEntity = await this.getNeighborsOfUpdatedEntityForRuleInTransaction(transaction, updatedEntity.properties._id);

        const ruleFailuresForEachNeighborPromises = neighborsOfUpdatedEntity.map(async ({ relationshipTemplate, neighborOfEntity }) => {
            return this.runRulesOnEntityDependentViaAggregation(
                transaction,
                neighborOfEntity.properties._id,
                neighborOfEntity.templateId,
                relationshipTemplate,
                updatedProperties,
            );
        });

        const ruleFailuresForEachNeighbor = await Promise.all(ruleFailuresForEachNeighborPromises);
        const ruleFailures = ruleFailuresForEachNeighbor.flat();

        return ruleFailures;
    };

    private async runRulesDependOnEntityUpdate(transaction: Transaction, updatedEntity: IEntity, updatedProperties: string[]) {
        const ruleFailuresOfUpdatedEntityPromise = await this.runRulesOnEntity(transaction, updatedEntity, updatedProperties);

        const ruleFailuresOnNeighborsOfEntityPromise = this.runRulesOnNeighborsOfUpdatedEntity(transaction, updatedEntity, updatedProperties);

        const [ruleFailuresOfUpdatedEntity, ruleFailuresOfNeighborsOfEntity] = await Promise.all([
            ruleFailuresOfUpdatedEntityPromise,
            ruleFailuresOnNeighborsOfEntityPromise,
        ]);

        const ruleFailures = [...ruleFailuresOfUpdatedEntity, ...ruleFailuresOfNeighborsOfEntity];

        return ruleFailures;
    }

    private getKeysOfUpdatedProperties(
        oldEntityProperties: Record<string, IPropertyValue>,
        newEntityProperties: Record<string, IPropertyValue>,
        entityTemplate: IMongoEntityTemplate,
    ) {
        const unPopulatedOldProperties = this.relationshipReferenceObjectToId(oldEntityProperties, entityTemplate);
        const unPopulatedNewProperties = this.relationshipReferenceObjectToId(newEntityProperties, entityTemplate);

        const propertiesWithGeneratedProperties: Record<string, IEntitySingleProperty> = {
            ...entityTemplate.properties.properties,
            disabled: { title: `doesn'tMatter`, type: PropertyType.boolean },
            createdAt: { title: `doesn'tMatter`, type: PropertyType.string, format: PropertyFormat['date-time'] },
            updatedAt: { title: `doesn'tMatter`, type: PropertyType.string, format: PropertyFormat['date-time'] },
        };

        const templateUpdatedProperties = pickBy(
            propertiesWithGeneratedProperties,
            (_propertyTemplate, key) => !isEqual(unPopulatedNewProperties[key], unPopulatedOldProperties[key]),
        );

        return Object.keys(templateUpdatedProperties);
    }

    private removeBasicProperties(properties: Record<string, IPropertyValue>) {
        const { createdAt: _createdAt, updatedAt: _updatedAt, _id, disabled: _disabled, ...rest } = properties;
        return rest;
    }

    private getUpdatedProperties(
        oldEntity: Record<string, IPropertyValue>,
        newEntity: Record<string, IPropertyValue>,
        entityTemplate: IMongoEntityTemplate,
    ) {
        const updatedPropertiesNames = this.getKeysOfUpdatedProperties(oldEntity, newEntity, entityTemplate);

        const updatedProperties = updatedPropertiesNames.reduce(
            (acc, property) => {
                acc[property] = newEntity[property];
                return acc;
            },
            {} as Record<string, IPropertyValue>,
        );

        return this.removeBasicProperties(updatedProperties);
    }

    async handleRelationshipReferenceFieldsChanges(
        entity: IEntity,
        entityTemplate: IMongoEntityTemplate,
        entityProperties: Record<string, IPropertyValue>,
        updatedProperties: string[],
        transaction: Transaction,
        userId: string,
        convertToRelationshipField = false,
    ): Promise<{ fixedProperties: Record<string, IPropertyValue>; createdRelationships: IRelationship[]; deletedRelationships: IRelationship[] }> {
        const entityId = entity.properties._id;
        const fixedProperties: Record<string, IPropertyValue> = structuredClone(entityProperties);
        const entityPropertiesList = Object.keys(entityProperties);
        const createdRelationships: IRelationship[] = [];
        const deletedRelationships: IRelationship[] = [];

        await Promise.all([
            ...updatedProperties.map(async (updatedProperty) => {
                const property = entityTemplate.properties.properties[updatedProperty];

                if (property?.format !== 'relationshipReference') return;

                if (entity.properties[updatedProperty]) {
                    const relatedEntityId = entity.properties[updatedProperty].properties._id;
                    const deletedRelationship = await this.deleteRelationshipReferenceInTransaction({
                        relationshipReference: property.relationshipReference!,
                        relatedEntityId,
                        originalEntityId: entityId,
                        transaction,
                    });

                    deletedRelationships.push(deletedRelationship);
                }

                const relatedEntityId =
                    (typeof entityProperties[updatedProperty] === 'string'
                        ? entityProperties[updatedProperty]
                        : entityProperties[updatedProperty]?.properties?._id) ?? undefined;

                if (relatedEntityId) {
                    const { relatedEntity, fixedField } = await this.fixRelationshipReferenceField(relatedEntityId, transaction);

                    fixedProperties[updatedProperty] = fixedField;

                    if (!convertToRelationshipField) {
                        const { createdRelationship } = await this.createRelationshipReference(
                            property.relationshipReference!,
                            relatedEntity,
                            entityId,
                            transaction,
                            userId,
                        );

                        createdRelationships.push(createdRelationship);
                    }
                }
            }),
            ...entityPropertiesList.map(async (entityProperty) => {
                const property = entityTemplate.properties.properties[entityProperty];

                if (property?.format !== 'relationshipReference') return;

                const relatedEntityId =
                    typeof entityProperties[entityProperty] === 'string'
                        ? entityProperties[entityProperty]
                        : entityProperties[entityProperty].properties._id;

                if (!updatedProperties.includes(entityProperty)) {
                    if (relatedEntityId) {
                        const { fixedField } = await this.fixRelationshipReferenceField(relatedEntityId, transaction);
                        fixedProperties[entityProperty] = fixedField;
                    }
                    return;
                }
            }),
        ]);
        return { fixedProperties, createdRelationships, deletedRelationships };
    }

    async updateRelationshipReference(
        updatedEntity: IEntity,
        updatedProperties: string[],
        transaction: Transaction,
        entityTemplate: IEntityTemplate,
    ) {
        const { templateId, properties: entityProperties } = updatedEntity;
        const entitiesNeedToUpdate = await this.getRelatedEntitiesOfEntity(templateId, [entityProperties._id], transaction);

        await Promise.all(
            Object.entries(entitiesNeedToUpdate).map(async ([fieldToChange, entityIdsToUpdate]) => {
                if (entityIdsToUpdate.length === 0) return;

                const relatedEntitiesChangedValues = { updatedAt: getNeo4jDateTime() };
                updatedProperties.forEach((updatedProperty) => {
                    if (entityProperties[updatedProperty]) {
                        const property = entityTemplate?.properties.properties[updatedProperty];
                        if (property?.format === 'relationshipReference') {
                            const fieldName = property.relationshipReference?.relatedTemplateField;
                            relatedEntitiesChangedValues[
                                `${fieldToChange}.properties.${updatedProperty}${config.neo4j.relationshipReferencePropertySuffix}`
                            ] = entityProperties[updatedProperty].properties[fieldName!];
                        } else if (property?.format === 'location') {
                            relatedEntitiesChangedValues[
                                `${fieldToChange}.properties.${updatedProperty}${config.neo4j.relationshipReferencePropertySuffix}`
                            ] = JSON.stringify(entityProperties[updatedProperty]);
                        } else {
                            relatedEntitiesChangedValues[
                                `${fieldToChange}.properties.${updatedProperty}${config.neo4j.relationshipReferencePropertySuffix}`
                            ] = entityProperties[updatedProperty];
                        }
                    }
                });

                await runInTransactionAndNormalize(
                    transaction,
                    `MATCH (e)
                    WHERE e.\`_id\` IN $updateParams.ids
                    SET e += $updateParams.value
                    RETURN e`,
                    normalizeReturnedEntity('multipleResponses', { type: 'function', metadata: this.workspaceId }),
                    {
                        updateParams: {
                            ids: entityIdsToUpdate,
                            value: relatedEntitiesChangedValues,
                        },
                    },
                );
            }),
        );
    }

    async updateEntityByIdInnerTransaction(
        id: string,
        entityProperties: Record<string, IPropertyValue>,
        entityTemplate: IMongoEntityTemplate,
        transaction: Transaction,
        userId?: string,
        indicatorRules?: IRuleFailure[],
        convertToRelationshipField = false,
        isGetMode: boolean = true,
    ) {
        const activityLogUpdatedFields: IUpdatedFields[] = [];
        const activityLogsToCreate: Omit<IActivityLog, '_id'>[] = [];
        const defaultValues = { updatedAt: new Date().toISOString() };
        const propertiesToUpdate = { ...entityProperties, ...defaultValues };

        const entity = await this.getEntityByIdInTransaction(id, transaction);

        if (entity.properties.disabled) throw new ValidationError(`[NEO4J] cannot update disabled entity.`);

        const updatedProperties = this.getKeysOfUpdatedProperties(entity.properties, propertiesToUpdate, entityTemplate);

        const updatedColoredFields = indicatorRules ? this.getColoredFields(indicatorRules.map(({ rule }) => rule)) : undefined;

        const { fixedProperties } = await this.handleRelationshipReferenceFieldsChanges(
            entity,
            entityTemplate,
            propertiesToUpdate,
            updatedProperties,
            transaction,
            userId ?? '',
            convertToRelationshipField,
        );

        const updatedEntity = await runInTransactionAndNormalize(
            transaction,
            `MATCH (e {_id: '${id}'})
                 WITH e.createdAt AS createdAt, e.disabled AS disabled, e AS e
                 SET e = $props
                 SET e.createdAt = createdAt
                 SET e.disabled = disabled
                 RETURN e`,
            normalizeReturnedEntity('singleResponseNotNullable', { type: 'function', metadata: this.workspaceId }, isGetMode),
            {
                props: {
                    ...(await addStringFieldsAndNormalizeSpecialStringValues(
                        fixedProperties,
                        entityTemplate,
                        this.entityTemplateManagerService,
                        updatedColoredFields,
                    )),
                    updatedAt: getNeo4jDateTime(),
                    _id: id,
                },
            },
        );

        await this.updateRelationshipReference(updatedEntity, updatedProperties, transaction, entityTemplate);

        const fields = Object.keys(entityTemplate.properties.properties);
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            const propertyTemplate = entityTemplate.properties.properties[field];

            let newValue: IPropertyValue;
            if (propertyTemplate?.format === 'fileId' || propertyTemplate?.items?.format === 'fileId')
                newValue = entityProperties[field] ?? updatedEntity.properties[field];
            else newValue = updatedEntity.properties[field];

            if (
                newValue !== undefined &&
                Array.isArray(entity.properties[field]) &&
                newValue.length === entity.properties[field].length &&
                newValue.every((element, index) => element === entity.properties[field][index])
            )
                continue;
            if (entity.properties?.[field] === newValue) continue;
            if (
                propertyTemplate?.format === 'relationshipReference' &&
                newValue &&
                entity.properties?.[field] &&
                newValue.properties?._id === entity.properties?.[field]?.properties?._id
            )
                continue;

            activityLogUpdatedFields.push({
                fieldName: field,
                oldValue: entity.properties[field] ?? null,
                newValue: newValue ?? null,
            });
        }

        if (userId) {
            activityLogsToCreate.push({
                action: ActionsLog.UPDATE_ENTITY,
                entityId: id,
                metadata: { updatedFields: activityLogUpdatedFields },
                timestamp: new Date(),
                userId,
            });
        }

        return { updatedEntity, activityLogsToCreate };
    }

    relationshipReferenceObjectToId(entityProperties: IEntity['properties'], entityTemplate: IMongoEntityTemplate) {
        const entityAfterManipulations = cloneDeep(entityProperties);

        Object.entries(entityTemplate.properties.properties).forEach(([name, value]) => {
            if (name in entityProperties) {
                const propertyValue = entityProperties[name];

                if (value.format === 'relationshipReference' && typeof propertyValue !== 'string') {
                    entityAfterManipulations[name] = (propertyValue as IEntity).properties._id;
                }
            }
        });

        return entityAfterManipulations as IEntity['properties'];
    }

    async updateEntityById(
        id: string,
        entityProperties: Record<string, IPropertyValue>,
        entityTemplate: IMongoEntityTemplate,
        ignoredRules: IBrokenRule[],
        userId?: string,
        childTemplateId?: string,
        convertToRelationshipField = false,
    ) {
        const entity = await this.getEntityById(id, false);
        const unPopulatedOldEntityProperties = this.relationshipReferenceObjectToId(entity, entityTemplate);

        if (entity.properties.disabled) throw new ValidationError(`[NEO4J] cannot update disabled entity.`);

        let template = entityTemplate;
        if (childTemplateId) {
            const childTemplate = await this.childTemplateManagerService.getChildTemplateById(childTemplateId);
            template = { ...entityTemplate, actions: childTemplate.actions };
        }

        if (template.actions && isBodyFunctionHasContent(template.actions, IEntityCrudAction.onUpdateEntity)) {
            const actions = await this.buildActionsArray(IEntityCrudAction.onUpdateEntity, entityProperties, template, userId, {
                ...entity,
                properties: unPopulatedOldEntityProperties,
            });

            const bulkManager = new BulkActionManager(this.workspaceId);
            const results = await bulkManager.runBulkOfActions(actions, ignoredRules, false, userId);
            const updatedEntity = await this.getEntityById(results.instances[0].properties._id, false);
            const fixedActions = this.fixActions(actions, results.instances);

            return { updatedEntity, actions: fixedActions, emails: results.emails };
        }

        return this.neo4jClient
            .performComplexTransaction('writeTransaction', async (transaction) => {
                const updatedProperties = this.getKeysOfUpdatedProperties(entity.properties, entityProperties, template);
                const ruleFailuresBeforeAction = await this.runRulesDependOnEntityUpdate(transaction, entity, updatedProperties);

                const { updatedEntity, activityLogsToCreate } = await this.updateEntityByIdInnerTransaction(
                    id,
                    entityProperties,
                    template,
                    transaction,
                    userId,
                    undefined,
                    convertToRelationshipField,
                    false,
                );

                const ruleFailuresAfterAction = await this.runRulesDependOnEntityUpdate(transaction, updatedEntity, updatedProperties);

                const [indicatorRules, rulesToThrowError]: [IRuleFailure[], IRuleFailure[]] = partition(
                    ruleFailuresAfterAction,
                    ({ rule: { actionOnFail } }) => actionOnFail === ActionOnFail.INDICATOR,
                );

                const emails: IRuleMail[] = indicatorRules.flatMap((rule) => {
                    if (!rule.rule.mail?.display) return [];

                    return rule.rule.mail;
                });

                const { updatedEntity: entityWithUpdatedColors } = await this.updateEntityByIdInnerTransaction(
                    id,
                    updatedEntity.properties,
                    template,
                    transaction,
                    userId,
                    indicatorRules,
                );

                throwIfActionCausedRuleFailures(
                    ignoredRules,
                    ruleFailuresBeforeAction,
                    rulesToThrowError,
                    [{}],
                    [
                        {
                            actionType: ActionTypes.UpdateEntity,
                            actionMetadata: { entityId: id, updatedFields: entityProperties, before: entity.properties },
                        },
                    ],
                );

                const activityLogsPromises = activityLogsToCreate.map((activityLogToCreate) =>
                    this.activityLogProducer.createActivityLog(activityLogToCreate),
                );

                await Promise.all(activityLogsPromises);

                return { updatedEntity: entityWithUpdatedColors, emails };
            })
            .catch((err) => this.throwServiceErrorIfFailedConstraintsValidation(err)); // constraint validation is performed on end of transaction
    }

    async convertToRelationshipField(existingRelationships: IRelationship[], addFieldToSrcEntity: boolean, fieldName: string, userId: string) {
        const updatedEntities = new Map<string, IPropertyValue>();
        return this.neo4jClient
            .performComplexTransaction('writeTransaction', async (transaction) => {
                for (const relationship of existingRelationships) {
                    const entityId = addFieldToSrcEntity ? relationship.sourceEntityId : relationship.destinationEntityId;
                    const entityToUpdate: IEntity = await this.getEntityById(entityId);
                    const entityTemplate = await this.entityTemplateManagerService.getEntityTemplateById(entityToUpdate.templateId);
                    const entityProperties = mapValues(entityToUpdate.properties, (property, key) =>
                        entityTemplate.properties.properties[key]?.format === 'relationshipReference' ? property?.properties._id : property,
                    );

                    const { updatedEntity } = await this.updateEntityByIdInnerTransaction(
                        entityId,
                        {
                            ...entityProperties,
                            [fieldName]: addFieldToSrcEntity ? relationship.destinationEntityId : relationship.sourceEntityId,
                        },
                        entityTemplate,
                        transaction,
                        userId,
                        undefined,
                        true,
                    );

                    updatedEntities.set(entityId, updatedEntity);
                }
                return updatedEntities;
            })
            .catch((err) => this.throwServiceErrorIfFailedConstraintsValidation(err));
    }

    async updateRelationshipReferencesEnumField(
        templateId: string,
        originalEntities: IEntity[],
        newValue: string,
        oldValue: string,
        field: { name: string; type: string },
        transaction: Transaction,
    ) {
        let updateRelatedEntitiesQuery: string;
        const originalChangedEntityIds = originalEntities.map((node) => node.properties._id);
        const entitiesNeedToUpdate = await this.getRelatedEntitiesOfEntity(templateId, originalChangedEntityIds, transaction);

        await Promise.all(
            Object.entries(entitiesNeedToUpdate).map(async ([fieldToChange, entityIdsToUpdate]) => {
                if (field.type === 'enumArray') {
                    updateRelatedEntitiesQuery = `MATCH (e)
                                WHERE e.\`_id\` IN $updateParams.ids AND '${oldValue}' IN e.\`${fieldToChange}\`
                                SET e.\`${fieldToChange}\` = [val IN e.\`${fieldToChange}\` WHERE val <> '${oldValue}'] + ['${newValue}']
                                RETURN e`;
                } else {
                    updateRelatedEntitiesQuery = `MATCH (e)
                                WHERE e.\`_id\` IN $updateParams.ids AND e.\`${fieldToChange}\` = '${oldValue}'
                                SET e.\`${fieldToChange}\` = '${newValue}'
                                RETURN e`;
                }

                await runInTransactionAndNormalize(
                    transaction,
                    updateRelatedEntitiesQuery,
                    normalizeReturnedEntity('multipleResponses', { type: 'function', metadata: this.workspaceId }),
                    {
                        updateParams: { ids: entityIdsToUpdate },
                    },
                );
            }),
        );
    }

    async updateEnumFieldValue(id: string, newValue: string, oldValue: string, field: { name: string; type: string }) {
        return this.neo4jClient
            .performComplexTransaction('writeTransaction', async (transaction) => {
                let nodes: IEntity[] = [];

                if (field.type === 'enumArray') {
                    nodes = await runInTransactionAndNormalize(
                        transaction,
                        `MATCH (e: \`${id}\`)
                            WHERE '${oldValue}' IN e.${field.name}
                            SET e.${field.name} = [val IN e.${field.name} WHERE val <> '${oldValue}'] + ['${newValue}']
                            RETURN e`,
                        normalizeReturnedEntity('multipleResponses', { type: 'function', metadata: this.workspaceId }),
                    );
                } else {
                    nodes = await runInTransactionAndNormalize(
                        transaction,
                        `MATCH (e: \`${id}\`)
                    WHERE e.${field.name} = '${oldValue}'
                    SET e.${field.name} = '${newValue}'
                    RETURN e`,
                        normalizeReturnedEntity('multipleResponses', { type: 'function', metadata: this.workspaceId }),
                    );
                }

                if (nodes) await this.updateRelationshipReferencesEnumField(id, nodes, newValue, oldValue, field, transaction);

                return nodes;
            })
            .catch((error) => {
                throw error instanceof NotFoundError ? new NotFoundError(`[NEO4J] entity not found`) : new Error('Change failed');
            });
    }

    async convertFieldsToPlural(templateId: string, propertiesKeysToPluralize: string[]) {
        try {
            const entityTemplate: IMongoEntityTemplate = await this.entityTemplateManagerService.getEntityTemplateById(templateId);

            await this.neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
                const allEntitiesOfTemplate = await runInTransactionAndNormalize(
                    transaction,
                    `MATCH (e: \`${templateId}\`) RETURN e`,
                    normalizeReturnedEntity('multipleResponses', { type: 'function', metadata: this.workspaceId }),
                );

                const updatePromises = allEntitiesOfTemplate.map(async (entity) => {
                    const updatedProperties = { ...entity.properties };

                    propertiesKeysToPluralize.forEach((key) => {
                        if (key in updatedProperties) updatedProperties[key] = [updatedProperties[key]];
                    });

                    return this.updateEntityByIdInnerTransaction(entity.properties._id, updatedProperties, entityTemplate, transaction);
                });

                await Promise.all(updatePromises);
            });
        } catch (err) {
            this.throwServiceErrorIfFailedConstraintsValidation(err);
        }
    }

    private getConstraintFromName(constraintName: string): IConstraint {
        const [constraintTypePrefix, ...parts] = constraintName.split(config.constraintsNameDelimiter);

        switch (constraintTypePrefix) {
            case config.requiredConstraint: {
                const [constraintTemplateId, property] = parts;
                return { constraintName, type: 'REQUIRED', templateId: constraintTemplateId, property };
            }
            case config.uniqueConstraint: {
                // if field isnt part of unique group -> constraintName has only two parts (groupName === '')
                const [groupName, constraintTemplateId, propertiesStr] = parts.length === 3 ? parts : ['', ...parts];
                const properties = propertiesStr.split(',');
                return { constraintName, type: 'UNIQUE', templateId: constraintTemplateId, uniqueGroupName: groupName, properties };
            }
            default:
                throw new Error('Unknown constraint type for template (checked by constraint name)');
        }
    }

    private buildConstraintsOfTemplate(templateId: string, constraints: IConstraint[]) {
        const result: IConstraintsOfTemplate = {
            templateId,
            requiredConstraints: [],
            uniqueConstraints: [],
        };

        for (const curr of constraints) {
            if (curr.type === 'REQUIRED') result.requiredConstraints.push(curr.property);
            else if (curr.type === 'UNIQUE')
                result.uniqueConstraints.push({
                    groupName: curr.uniqueGroupName,
                    properties: curr.properties,
                });
        }

        return result;
    }

    async getConstraintsOfTemplate(templateId: string) {
        const constraints = await this.neo4jClient.readTransaction('show constraints', normalizeGetDbConstraints);
        const constraintsArrayOfTemplate = constraints
            .filter(({ name }) => {
                return name.startsWith(config.requiredConstraintsPrefixName) || name.startsWith(config.uniqueConstraintsPrefixName);
            })
            .map(({ name }) => this.getConstraintFromName(name))
            .filter((constraint) => templateId === constraint.templateId);

        return this.buildConstraintsOfTemplate(templateId, constraintsArrayOfTemplate);
    }

    async getAllConstraints() {
        const neo4jConstraints = await this.neo4jClient.readTransaction('show constraints', normalizeGetDbConstraints);
        const constraints = neo4jConstraints
            .filter(({ name }) => {
                return name.startsWith(config.requiredConstraintsPrefixName) || name.startsWith(config.uniqueConstraintsPrefixName);
            })
            .map(({ name }) => this.getConstraintFromName(name));

        const constraintsByTemplateIds = groupBy(constraints, 'templateId');
        const constraintsOfTemplates = Object.values(
            mapValues(constraintsByTemplateIds, (constraintsArray, templateId) => {
                return this.buildConstraintsOfTemplate(templateId, constraintsArray);
            }),
        );

        return constraintsOfTemplates;
    }

    private throwServiceErrorIfFailedToCreateConstraint(err: unknown, constraint: IConstraint) {
        if (err instanceof Neo4jError && err.code === 'Neo.DatabaseError.Schema.ConstraintCreationFailed') {
            throw new ServiceError(badRequestStatus, `[NEO4J] failed to create constraint due to existing invalid data`, {
                errorCode: config.errorCodes.failedToCreateConstraints,
                constraint,
                neo4jMessage: err.message,
            });
        }
        throw err;
    }

    private async updateRequiredConstraintsOfTemplate(
        transaction: Transaction,
        template: IMongoEntityTemplate,
        requiredConstraintsProps: string[],
        existingRequiredConstraints: IRequiredConstraint[],
    ) {
        const templateId = template._id;
        const existingRequiredConstraintsOfTemplate = existingRequiredConstraints.filter((constraint) => constraint.templateId === templateId);

        const newRequiredConstraints: IRequiredConstraint[] = requiredConstraintsProps.map((requiredConstraintProp) => ({
            type: 'REQUIRED',
            constraintName: `${config.requiredConstraintsPrefixName}${config.constraintsNameDelimiter}${templateId}${config.constraintsNameDelimiter}${requiredConstraintProp}`,
            templateId,
            property: requiredConstraintProp,
        }));

        const requiredConstraintsToCreate = differenceWith(
            newRequiredConstraints,
            existingRequiredConstraintsOfTemplate,
            (constraintA, constraintB) => constraintA.property === constraintB.property,
        );

        const existingRequiredConstraintsToDelete = differenceWith(
            existingRequiredConstraintsOfTemplate,
            newRequiredConstraints,
            (constraintA, constraintB) => constraintA.property === constraintB.property,
        );

        const createRequiredConstraintsPromises = requiredConstraintsToCreate.map(async (constraint) => {
            let queryAccordingToFieldType = constraint.property;
            const constraintProp = template.properties.properties[constraint.property];

            if (constraintProp.format === 'relationshipReference') {
                queryAccordingToFieldType = `${constraint.property}.properties._id_reference`;
            } else if (constraintProp.format === 'user') {
                // For user fields, we need to use the actual property name that contains dots
                queryAccordingToFieldType = `${constraint.property}.id_userField`;
            } else if (constraintProp.items?.format === 'user') {
                // For user array fields, we need to use the actual property name that contains dots
                queryAccordingToFieldType = `${constraint.property}.ids_usersFields`;
            }
            await transaction
                .run(
                    `CREATE CONSTRAINT \`${constraint.constraintName}\` FOR (n:\`${templateId}\`) REQUIRE (n.\`${queryAccordingToFieldType}\`) IS NOT NULL`,
                )
                .catch((err) => this.throwServiceErrorIfFailedToCreateConstraint(err, constraint));
        });

        const deleteConstraintsPromises = existingRequiredConstraintsToDelete.map(({ constraintName }) =>
            transaction.run(`DROP CONSTRAINT \`${constraintName}\``),
        );

        return Promise.all([...createRequiredConstraintsPromises, ...deleteConstraintsPromises]);
    }

    private async updateUniqueConstraintsOfTemplate(
        transaction: Transaction,
        template: IMongoEntityTemplate,
        uniqueConstraints: IUniqueConstraintOfTemplate[],
        existingUniqueConstraints: IUniqueConstraint[],
    ) {
        const templateId = template._id;
        const existingUniqueConstraintsOfTemplate = existingUniqueConstraints.filter((constraint) => constraint.templateId === templateId);

        const newUniqueConstraints: IUniqueConstraint[] = uniqueConstraints.flatMap((constraintGroup) => ({
            type: 'UNIQUE',
            constraintName:
                constraintGroup.groupName === ''
                    ? `${config.uniqueConstraintsPrefixName}${config.constraintsNameDelimiter}${templateId}${config.constraintsNameDelimiter}${constraintGroup.properties}`
                    : `${config.uniqueConstraintsPrefixName}${config.constraintsNameDelimiter}${constraintGroup.groupName}${config.constraintsNameDelimiter}${templateId}${config.constraintsNameDelimiter}${constraintGroup.properties}`,
            templateId,
            uniqueGroupName: constraintGroup.groupName,
            properties: constraintGroup.properties,
        }));

        const uniqueConstraintsToCreate = differenceWith(newUniqueConstraints, existingUniqueConstraintsOfTemplate, (constraintA, constraintB) =>
            arraysEqualsNonOrdered(constraintA.properties, constraintB.properties),
        );

        const existingUniqueConstraintsToDelete = differenceWith(
            existingUniqueConstraintsOfTemplate,
            newUniqueConstraints,
            (constraintA, constraintB) => arraysEqualsNonOrdered(constraintA.properties, constraintB.properties),
        );

        const createUniqueConstraintsPromises = uniqueConstraintsToCreate.map(async (constraint) => {
            const propsPart = constraint.properties.map((prop) => {
                if (template.properties.properties[prop].format === 'relationshipReference') {
                    return `n.\`${prop}.properties._id_reference\``;
                } // TODO - also create on required
                if (template.properties.properties[prop].format === 'user') {
                    return `n.\`${prop}.id_userField\``;
                }
                if (template.properties.properties[prop].items?.format === 'user') {
                    return `n.\`${prop}.ids_usersFields\``;
                }

                return `n.${prop}`;
            });

            await transaction
                .run(`CREATE CONSTRAINT \`${constraint.constraintName}\` FOR (n:\`${templateId}\`) REQUIRE (${propsPart}) IS NODE KEY`)
                .catch((err) => this.throwServiceErrorIfFailedToCreateConstraint(err, constraint));
        });

        const deleteConstraintsPromises = existingUniqueConstraintsToDelete.map(({ constraintName }) =>
            transaction.run(`DROP CONSTRAINT \`${constraintName}\``),
        );

        await Promise.all([...createUniqueConstraintsPromises, ...deleteConstraintsPromises]);
    }

    async updateConstraintsOfTemplate(
        template: IMongoEntityTemplate,
        requiredConstraints: string[],
        uniqueConstraints: IUniqueConstraintOfTemplate[],
    ) {
        return this.neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
            const existingNeo4jConstraints = await runInTransactionAndNormalize(transaction, 'show constraints', normalizeGetDbConstraints);

            // biome-ignore lint/suspicious/noConfusingVoidType: this is the correct type
            const updateConstraintsPromises: (Promise<void> | Promise<(void | QueryResult<RecordShape>)[]>)[] = [];

            const existingRequiredConstraints = existingNeo4jConstraints
                .filter(({ name }) => name.startsWith(config.requiredConstraintsPrefixName))
                .map(({ name }) => this.getConstraintFromName(name) as IRequiredConstraint);

            const updateRequiredConstraintsPromise = this.updateRequiredConstraintsOfTemplate(
                transaction,
                template,
                requiredConstraints,
                existingRequiredConstraints,
            );
            updateConstraintsPromises.push(updateRequiredConstraintsPromise);

            const existingUniqueConstraints = existingNeo4jConstraints
                .filter(({ name }) => name.startsWith(config.uniqueConstraintsPrefixName))
                .map(({ name }) => this.getConstraintFromName(name) as IUniqueConstraint);

            const updateUniqueConstraintsPromise = this.updateUniqueConstraintsOfTemplate(
                transaction,
                template,
                uniqueConstraints,
                existingUniqueConstraints,
            );
            updateConstraintsPromises.push(updateUniqueConstraintsPromise);

            await Promise.all(updateConstraintsPromises);
        });
    }

    async enumerateNewSerialNumberFields(templateId: string, newSerialNumberFields: object) {
        return this.neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
            const numOfEntitiesUpdated = `
            MATCH (n: \`${templateId}\`) 
            WITH n
            ORDER BY n.createdAt
            WITH collect(n) AS entities
            UNWIND range(0, size(entities)-1) AS index
            WITH entities[index] AS currentEntity,  index AS currentIndex
            SET ${Object.entries(newSerialNumberFields)
                .map(([key, value]) => `\`currentEntity\`.${key} = toFloat(currentIndex + ${value})`)
                .join(', ')}
            RETURN count(currentEntity) AS numEntitiesUpdated`;
            return runInTransactionAndNormalize(transaction, numOfEntitiesUpdated, normalizeResponseCount);
        });
    }

    deletePropertiesOfTemplateInTransaction(transaction: Transaction, templateId: string, properties: string[]) {
        return runInTransactionAndNormalize(
            transaction,
            `MATCH (e: \`${templateId}\`)
            WITH collect(e) AS nodes
            CALL apoc.create.removeProperties(nodes, $properties) YIELD node
            RETURN node`,
            normalizeReturnedEntity('multipleResponses', { type: 'function', metadata: this.workspaceId }),
            {
                properties,
            },
        );
    }

    removeRelationshipReferences(relatedEntityTemplate: IMongoEntityTemplate, property: string, propertiesToRemove: string[]) {
        const propertiesWithGeneratedProperties: Record<string, IEntitySingleProperty> = {
            ...relatedEntityTemplate.properties.properties,
            disabled: { title: 'disabled', type: PropertyType.string },
            createdAt: { title: 'createdAt', type: PropertyType.string, format: PropertyFormat['date-time'] },
            updatedAt: { title: 'updatedAt', type: PropertyType.string, format: PropertyFormat['date-time'] },
            _id: { title: '_id', type: PropertyType.string },
        };

        Object.entries(propertiesWithGeneratedProperties).forEach(([key, value]) => {
            propertiesToRemove.push(`${property}.properties.${key}${config.neo4j.relationshipReferencePropertySuffix}`);

            if (value.type !== PropertyType.string)
                propertiesToRemove.push(
                    `${property}.properties.${key}${config.neo4j.stringPropertySuffix}${config.neo4j.relationshipReferencePropertySuffix}`,
                );

            if (value.type === PropertyType.boolean)
                propertiesToRemove.push(
                    `${property}.properties.${key}${config.neo4j.booleanPropertySuffix}${config.neo4j.relationshipReferencePropertySuffix}`,
                );

            if (value.format === PropertyFormat.fileId || (value.type === PropertyType.array && value.items?.format === PropertyFormat.fileId))
                propertiesToRemove.push(
                    `${property}.properties.${key}${config.neo4j.filePropertySuffix}${config.neo4j.relationshipReferencePropertySuffix}`,
                );
        });

        propertiesToRemove.push(`${property}.templateId${config.neo4j.relationshipReferencePropertySuffix}`);
    }

    // getUserProperties(userProperty: string) {
    //     return config.neo4j.userOriginalAndSuffixFieldsMap.map(
    //         (userField) => `${userProperty}${userField.suffixFieldName}${config.neo4j.userFieldPropertySuffix}`,
    //     );
    // }

    // getUsersArrayProperties(userProperty: string) {
    //     return config.neo4j.usersArrayOriginalAndSuffixFieldsMap.map(
    //         (userField) => `${userProperty}${userField.suffixFieldName}${config.neo4j.usersFieldsPropertySuffix}`,
    //     );
    // }

    async deletePropertiesOfTemplate(templateId: string, properties: string[], currentTemplateProperties: Record<string, IEntitySingleProperty>) {
        const propertiesToRemove: string[] = [];
        const relationshipTemplatesToRemove: string[] = [];

        for (const property of properties) {
            const propertyTemplate = currentTemplateProperties[property];

            // if (propertyTemplate.format === PropertyFormat.user) {
            //     propertiesToRemove.push(...this.getUserProperties(property));
            //     continue;
            // }

            // if (propertyTemplate.items?.format === PropertyFormat.user) {
            //     propertiesToRemove.push(...this.getUsersArrayProperties(property));
            //     continue;
            // }

            const { type, format, items } = propertyTemplate;
            propertiesToRemove.push(property);

            if (type !== PropertyType.string) propertiesToRemove.push(`${property}${config.neo4j.stringPropertySuffix}`);
            if (type === PropertyType.boolean) propertiesToRemove.push(`${property}${config.neo4j.booleanPropertySuffix}`);
            if (
                format === PropertyFormat.fileId ||
                (type === PropertyType.array && items?.format === PropertyFormat.fileId) ||
                format === PropertyFormat.signature
            )
                propertiesToRemove.push(`${property}${config.neo4j.filePropertySuffix}`);

            if (format !== PropertyFormat.relationshipReference) continue;

            relationshipTemplatesToRemove.push(propertyTemplate.relationshipReference?.relationshipTemplateId as string);

            const relatedEntityTemplate = await this.entityTemplateManagerService.getEntityTemplateById(
                propertyTemplate.relationshipReference?.relatedTemplateId as string,
            );

            this.removeRelationshipReferences(relatedEntityTemplate, property, propertiesToRemove);
        }

        this.neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
            await Promise.all([
                this.deletePropertiesOfTemplateInTransaction(transaction, templateId, propertiesToRemove),
                this.relationshipManager.deleteRelationshipByTemplateIds(transaction, relationshipTemplatesToRemove),
            ]);
        });
    }

    getDependentRules(rules: IMongoRule[], relationshipTemplateId: string) {
        return filterDependentRulesViaAggregation(rules, relationshipTemplateId);
    }

    async getChartByTemplate(templateId: string, { chartsData, units }: { chartsData: IChartBody[]; units: IGetUnits }) {
        const entityTemplate = await this.entityTemplateManagerService.getEntityTemplateById(templateId);

        const entityTemplatesMap = new Map([[entityTemplate._id, entityTemplate]]);
        const specialProperties = handleChartPropertiesTemplate(entityTemplate);

        const chartPromises = chartsData.map(async ({ filter, xAxis, yAxis, _id }) => {
            const templatesFilter = { [entityTemplate._id]: { filter, showRelationships: false } };

            const { cypherQuery: filterQuery, parameters } = templatesFilterToNeoQuery(templatesFilter, entityTemplatesMap);
            const query = buildChartAggregationQuery(xAxis, yAxis, specialProperties, entityTemplate, filterQuery);

            const chart = await this.neo4jClient.readTransaction(query, normalizeChartResponse, parameters);
            const manipulatedChart = await manipulateReturnedChart(xAxis, chart, entityTemplate, this.workspaceId, units);

            return _id ? { _id, chart: manipulatedChart } : manipulatedChart;
        });

        return Promise.all(chartPromises);
    }

    async runAndGetBrokenRuleWithTodayFunc(rule: IMongoRule, entityTemplatesRecord: Map<string, IMongoEntityTemplate>) {
        const entityTemplate = entityTemplatesRecord.get(rule.entityTemplateId)!;

        const brokenRule = await this.neo4jClient.performComplexTransaction('writeTransaction', async (transaction): Promise<IBrokenRule> => {
            const today = startOfToday();
            const yesterday = startOfYesterday();

            const [ruleFailuresYesterday, ruleFailuresToday] = await Promise.all([
                runRuleOnEntitiesOfTemplate(transaction, rule, entityTemplate, yesterday, true),
                runRuleOnEntitiesOfTemplate(transaction, rule, entityTemplate, today, true),
            ]);

            const ruleFailuresYesterdayRecord = Object.fromEntries(ruleFailuresYesterday.map((ruleFailure) => [ruleFailure.entityId, ruleFailure]));

            const ruleFailuresTodayWithCauses = filteredMap(ruleFailuresToday, (ruleFailure) => {
                const ruleFailureYesterday = ruleFailuresYesterdayRecord[ruleFailure.entityId];

                const causes = getCausesOfRuleFailure(
                    { rule, entityId: ruleFailure.entityId, formulaCauses: ruleFailure.formulaCauses },
                    { rule, entityId: ruleFailure.entityId, formulaCauses: ruleFailureYesterday.formulaCauses },
                    rule.formula,
                );

                if (causes.length === 0) return undefined;

                return {
                    include: true,
                    // filter out cause of getTodayFunc (UI doesnt show it anyway)
                    value: { entityId: ruleFailure.entityId, causes: causes.filter<ICausesOfInstance>((cause) => 'instance' in cause) },
                };
            });

            return { ruleId: rule._id, failures: ruleFailuresTodayWithCauses };
        });

        if (brokenRule.failures.length > 0) {
            return brokenRule;
        }

        return undefined;
    }

    async createAlertsForRulesWithTodayFunc(brokenRules: IBrokenRule[], rulesWithTodayFuncRecord: Map<string, IMongoRule>) {
        const brokenRulesOfWarningOnFail = brokenRules.filter(
            ({ ruleId }) => rulesWithTodayFuncRecord.get(ruleId)!.actionOnFail === ActionOnFail.WARNING,
        );

        const parallelLimit = pLimit(config.neo4j.sendAlertForRulesWithTodayFuncParallelLimit);

        const createAlertsPromises = brokenRulesOfWarningOnFail.flatMap((brokenRule) => {
            const createAlertsPerFailuresPromises = brokenRule.failures.map((failure) => {
                return parallelLimit(() =>
                    this.gatewayServiceProducer
                        .createAlertForRuleWithTodayFunc({
                            ruleId: brokenRule.ruleId,
                            failures: [failure],
                        })
                        .catch((error) => {
                            logger.error(`failed to rabbitmq send to create alert for broken rule's failure`, {
                                ruleId: brokenRule.ruleId,
                                failure,
                                error,
                            });
                        }),
                );
            });

            return createAlertsPerFailuresPromises;
        });

        return Promise.all(createAlertsPromises);
    }

    async runRulesWithTodayFunc() {
        const rulesWithTodayFunc = await this.relationshipsTemplateManagerService.searchRules({
            doesFormulaHaveTodayFunc: true,
        });
        const rulesWithTodayFuncRecord = new Map(rulesWithTodayFunc.map((rule) => [rule._id, rule]));

        const entityTemplates = await this.entityTemplateManagerService.searchEntityTemplates({
            ids: rulesWithTodayFunc.map((rule) => rule.entityTemplateId),
        });
        const entityTemplatesRecord = new Map(entityTemplates.map((entityTemplate) => [entityTemplate._id, entityTemplate]));

        const brokenRules: IBrokenRule[] = [];
        for (const rule of rulesWithTodayFunc) {
            const brokenRule = await this.runAndGetBrokenRuleWithTodayFunc(rule, entityTemplatesRecord);
            if (brokenRule) brokenRules.push(brokenRule);
        }

        await updateColorsForIndicatorRulesWithTodayFunc(this.neo4jClient, rulesWithTodayFuncRecord, brokenRules, this.workspaceId);

        this.createAlertsForRulesWithTodayFunc(brokenRules, rulesWithTodayFuncRecord);
    }
}

export default EntityManager;
