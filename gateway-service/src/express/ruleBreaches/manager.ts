/* eslint-disable no-plusplus */
import pickBy from 'lodash.pickby';
import { EntityTemplateManagerService } from '../../externalServices/templates/entityTemplateService';
import { IEntity } from '../../externalServices/instanceService/interfaces/entities';
import { InstanceManagerService } from '../../externalServices/instanceService';
import { getPermissions, isRuleManager } from '../../externalServices/permissionsService';
import { deleteFiles } from '../../externalServices/storageService';
import { trycatch } from '../../utils';
import { ServiceError } from '../error';
import { InstancesManager } from '../instances/manager';

import {
    INotificationMetadata,
    IRuleBreachAlertNotificationMetadata,
    IRuleBreachRequestNotificationMetadata,
    IRuleBreachResponseNotificationMetadata,
    NotificationType,
} from '../../externalServices/notificationService/interfaces';
import config from '../../config';
import {
    IBrokenRulePopulated,
    IRuleBreachPopulated,
    ICreateRelationshipMetadataPopulated,
    IDeleteRelationshipMetadataPopulated,
    IUpdateEntityMetadataPopulated,
    IActionMetadataPopulated,
    IRuleBreachRequestPopulated,
    IRuleBreachAlertPopulated,
    IUpdateEntityStatusMetadataPopulated,
    ICausesOfInstancePopulated,
    IEntityForBrokenRules,
    ICreateEntityMetadataPopulated,
    IRelationshipForBrokenRules,
    ICauseInstancePopulated,
    IDuplicateEntityMetadataPopulated,
} from '../../externalServices/ruleBreachService/interfaces/populated';
import {
    ActionTypes,
    IAction,
    IBrokenRule,
    ICreateEntityMetadata,
    ICreateRelationshipMetadata,
    IDeleteRelationshipMetadata,
    IDuplicateEntityMetadata,
    IRuleBreach,
    IRuleBreachAlert,
    IRuleBreachRequest,
    IUpdateEntityMetadata,
    IUpdateEntityStatusMetadata,
    RuleBreachRequestStatus,
} from '../../externalServices/ruleBreachService/interfaces';
import { RuleBreachService } from '../../externalServices/ruleBreachService';
import UsersManager from '../users/manager';
import { IAgGridRequest, IAgGridResult } from '../../utils/agGrid/interface';
import { rabbitCreateNotification } from '../../utils/notifications/createNotification';
import {
    INotificationMetadataPopulated,
    IRuleBreachAlertNotificationMetadataPopulated,
    IRuleBreachRequestNotificationMetadataPopulated,
    IRuleBreachResponseNotificationMetadataPopulated,
} from '../../externalServices/notificationService/interfaces/populated';
import { IRelationship } from '../../externalServices/instanceService/interfaces/relationships';

const { errorCodes, ruleBreachService } = config;

export class RuleBreachesManager {
    static async createRuleBreachRequest(
        ruleBreachRequestData: Omit<IRuleBreachRequest, '_id' | 'createdAt' | 'originUserId'>,
        userId: string,
        files: Express.Multer.File[] = [],
    ): Promise<IRuleBreachRequestPopulated> {
        await RuleBreachesManager.uploadRuleBreachFiles(ruleBreachRequestData, files);

        const { result, err } = await trycatch(async () => {
            const ruleBreachRequest = await RuleBreachService.createRuleBreachRequest({
                ...ruleBreachRequestData,
                originUserId: userId,
            });

            const request = await RuleBreachesManager.getRuleBreachRequestById(ruleBreachRequest._id);

            await RuleBreachesManager.sendNotification<IRuleBreachRequestNotificationMetadata, IRuleBreachRequestNotificationMetadataPopulated>(
                NotificationType.ruleBreachRequest,
                { requestId: ruleBreachRequest._id },
                { request },
                [userId],
            );

            return request;
        });

        if (err || !result) {
            await RuleBreachesManager.deleteRuleBreachFiles(ruleBreachRequestData);
            throw err;
        }

        return result;
    }

    static async getManyRuleBreachRequests(body: { rulesBreachIds: string[]; isPopulate: boolean }) {
        const ruleBreaches = await RuleBreachService.getManyRuleBreaches(body.rulesBreachIds);
        if (!body.isPopulate) return ruleBreaches;

        return Promise.all(ruleBreaches.map((ruleBreach) => RuleBreachesManager.getRuleBreachRequestById(ruleBreach._id)));
    }

    static async createRuleBreachAlert(
        ruleBreachAlertData: Omit<IRuleBreachAlert, '_id' | 'createdAt' | 'originUserId'>,
        userId: string,
        files: Express.Multer.File[] = [],
    ): Promise<IRuleBreachAlertPopulated> {
        await RuleBreachesManager.uploadRuleBreachFiles(ruleBreachAlertData, files);

        const { result, err } = await trycatch(async () => {
            const rulesBreachAlert = await RuleBreachService.createRuleBreachAlert({ ...ruleBreachAlertData, originUserId: userId });
            const alert = await RuleBreachesManager.getRuleBreachAlertsById(rulesBreachAlert._id);

            await RuleBreachesManager.sendNotification<IRuleBreachAlertNotificationMetadata, IRuleBreachAlertNotificationMetadataPopulated>(
                NotificationType.ruleBreachAlert,
                { alertId: rulesBreachAlert._id },
                { alert },
                [userId],
            );

            return alert;
        });

        if (err || !result) {
            await RuleBreachesManager.deleteRuleBreachFiles(ruleBreachAlertData);
            throw err;
        }

        return result;
    }

    static checkIfRuleBreachRequestIsReviewable(ruleBreachRequest: IRuleBreachRequest) {
        if (ruleBreachRequest.status !== RuleBreachRequestStatus.Pending) {
            throw new ServiceError(400, 'rule breach requests was already reviewed');
        }
    }

    static async approveRuleBreachRequest(
        ruleBreachRequestId: string,
        user: Express.User,
    ): Promise<
        | IRuleBreachRequestPopulated
        | { actionsResults: PromiseSettledResult<(IRelationship | IEntity)[]>[]; ruleBreachRequestPopulated: IRuleBreachRequestPopulated }
    > {
        const ruleBreachRequest = await RuleBreachService.getRuleBreachRequestById(ruleBreachRequestId);
        RuleBreachesManager.checkIfRuleBreachRequestIsReviewable(ruleBreachRequest);
        let actionsResults;

        if (ruleBreachRequest.actions.length > 1) {
            const fixedActionsPromises = await this.addBeforeFieldToUpdateAction(ruleBreachRequest.actions);
            const fixedActions = await Promise.all(fixedActionsPromises);

            await RuleBreachService.updateRuleBreachRequestActionsMetadata(ruleBreachRequest._id, fixedActions);

            actionsResults = await InstanceManagerService.runBulkOfActions([fixedActions], false, user.id, ruleBreachRequest.brokenRules);
        } else
            try {
                // only 1 action
                const [{ actionType, actionMetadata }] = ruleBreachRequest.actions;

                if (actionType === ActionTypes.CreateRelationship)
                    await RuleBreachesManager.createRelationship(
                        ruleBreachRequest.originUserId,
                        { actionMetadata: actionMetadata as ICreateRelationshipMetadata, actionType },
                        ruleBreachRequest.brokenRules,
                    );
                else if (actionType === ActionTypes.DeleteRelationship)
                    await RuleBreachesManager.deleteRelationship(
                        ruleBreachRequest.originUserId,
                        { actionMetadata: actionMetadata as IDeleteRelationshipMetadata, actionType },
                        ruleBreachRequest.brokenRules,
                    );
                else if (actionType === ActionTypes.CreateEntity)
                    await RuleBreachesManager.createEntity(
                        ruleBreachRequest._id,
                        ruleBreachRequest.originUserId,
                        { actionMetadata: actionMetadata as ICreateEntityMetadata, actionType },
                        ruleBreachRequest.brokenRules,
                    );
                else if (actionType === ActionTypes.DuplicateEntity)
                    await RuleBreachesManager.duplicateEntity(
                        ruleBreachRequest._id,
                        ruleBreachRequest.originUserId,
                        { actionMetadata: actionMetadata as IDuplicateEntityMetadata, actionType },
                        ruleBreachRequest.brokenRules,
                    );
                else if (actionType === ActionTypes.UpdateEntity)
                    await RuleBreachesManager.updateEntity(
                        ruleBreachRequest._id,
                        ruleBreachRequest.originUserId,
                        { actionMetadata: actionMetadata as IUpdateEntityMetadata, actionType },
                        ruleBreachRequest.brokenRules,
                    );
                else if (actionType === ActionTypes.UpdateStatus)
                    await RuleBreachesManager.updateEntityStatus(
                        ruleBreachRequest.originUserId,
                        { actionMetadata: actionMetadata as IUpdateEntityStatusMetadata, actionType },
                        ruleBreachRequest.brokenRules,
                    );
            } catch (error: any) {
                if (error instanceof ServiceError && error.metadata.errorCode === errorCodes.ruleBlock) {
                    await RuleBreachService.updateRuleBreachRequestBrokenRules(ruleBreachRequestId, error.metadata.rawBrokenRules);
                }

                throw error;
            }

        const updatedRuleBreachRequest = await RuleBreachService.updateRuleBreachRequestStatus(
            ruleBreachRequestId,
            user.id,
            RuleBreachRequestStatus.Approved,
        );

        const ruleBreachRequestPopulated = await RuleBreachesManager.populateRuleBreachRequest(updatedRuleBreachRequest);

        await RuleBreachesManager.sendNotification<IRuleBreachResponseNotificationMetadata, IRuleBreachResponseNotificationMetadataPopulated>(
            NotificationType.ruleBreachResponse,
            {
                requestId: ruleBreachRequest._id,
            },
            { request: ruleBreachRequestPopulated },
            [ruleBreachRequest.originUserId],
        );

        if (ruleBreachRequest.actions.length > 1) {
            return { ruleBreachRequestPopulated, actionsResults };
        }

        return ruleBreachRequestPopulated;
    }

    private static async sendNotification<
        NotificationMetadata extends INotificationMetadata,
        NotificationMetadataPopulated extends INotificationMetadataPopulated,
    >(type: NotificationType, metadata: NotificationMetadata, populatedMetaData: NotificationMetadataPopulated, extraViewers: string[] = []) {
        const rulesPermissions = await getPermissions({ resourceType: 'Rules' });
        const viewers = new Set<string>();

        rulesPermissions.forEach((rulesPermission) => viewers.add(rulesPermission.userId));
        extraViewers.forEach((extraViewer) => viewers.add(extraViewer));

        await rabbitCreateNotification(Array.from(viewers), type, metadata, populatedMetaData);
    }

    private static async createRelationship(
        originUserId: string,
        action: {
            actionType: ActionTypes;
            actionMetadata: ICreateRelationshipMetadata;
        },
        brokenRules: IBrokenRule[],
    ) {
        const { relationshipTemplateId, sourceEntityId, destinationEntityId } = action.actionMetadata;

        await InstancesManager.createRelationshipInstance(
            { templateId: relationshipTemplateId, sourceEntityId, destinationEntityId, properties: {} as any },
            brokenRules,
            originUserId,
            false,
        );
    }

    private static async deleteRelationship(
        originUserId: string,
        action: {
            actionType: ActionTypes;
            actionMetadata: IDeleteRelationshipMetadata;
        },
        brokenRules: IBrokenRule[],
    ) {
        await InstancesManager.deleteRelationshipInstance(action.actionMetadata.relationshipId, brokenRules, originUserId, false);
    }

    private static async updateEntityStatus(
        originUserId: string,
        action: {
            actionType: ActionTypes;
            actionMetadata: IUpdateEntityStatusMetadata;
        },
        brokenRules: IBrokenRule[],
    ) {
        await InstancesManager.updateEntityStatus(action.actionMetadata.entityId, action.actionMetadata.disabled, brokenRules, originUserId, false);
    }

    private static async createEntity(
        _id: string,
        originUserId: string,
        action: {
            actionType: ActionTypes;
            actionMetadata: ICreateEntityMetadata;
        },
        brokenRules: IBrokenRule[],
    ) {
        const { templateId, properties } = action.actionMetadata;

        const entity = await InstancesManager.createEntityInstance({ templateId, properties }, [], brokenRules, originUserId, false);

        await RuleBreachService.updateRuleBreachRequestActionsMetadata(_id, [
            {
                actionType: action.actionType,
                actionMetadata: {
                    ...action.actionMetadata,
                    properties: entity.createdEntity.properties,
                },
            },
        ]);
    }

    private static async duplicateEntity(
        _id: string,
        originUserId: string,
        action: {
            actionType: ActionTypes;
            actionMetadata: IDuplicateEntityMetadata;
        },
        brokenRules: IBrokenRule[],
    ) {
        const { templateId, properties, entityIdToDuplicate } = action.actionMetadata;

        const entity = await InstancesManager.duplicateEntityInstance(
            entityIdToDuplicate,
            { templateId, properties },
            [],
            brokenRules,
            originUserId,
            false,
            false,
        );

        await RuleBreachService.updateRuleBreachRequestActionsMetadata(_id, [
            {
                actionType: action.actionType,
                actionMetadata: {
                    ...action.actionMetadata,
                    properties: entity.createdEntity.properties,
                },
            },
        ]);
    }

    private static async updateEntity(
        _id: string,
        originUserId: string,
        action: {
            actionType: ActionTypes;
            actionMetadata: IUpdateEntityMetadata;
        },
        brokenRules: IBrokenRule[],
    ) {
        const { entityId, updatedFields } = action.actionMetadata;

        const entity = await InstanceManagerService.getEntityInstanceById(entityId);
        const newEntityProperties = { ...entity.properties, ...updatedFields };

        // updatedFields specifies fields to remove w/ nulls. but shouldn't be in the IEntity properties
        const newEntityPropertiesWithoutNulls = pickBy(newEntityProperties, (property) => property !== null) as IEntity['properties'];

        await InstancesManager.updateEntityInstance(
            entityId,
            { ...entity, properties: newEntityPropertiesWithoutNulls },
            [],
            brokenRules,
            originUserId,
            false,
        );

        await RuleBreachService.updateRuleBreachRequestActionsMetadata(_id, [
            {
                actionType: action.actionType,
                actionMetadata: {
                    ...action.actionMetadata,
                    before: entity,
                },
            },
        ]);
    }

    static async addBeforeFieldToUpdateAction(actions: IAction[]): Promise<(IAction | Promise<IAction>)[]> {
        return Promise.all(
            actions.map(async (action) => {
                if (action.actionType === ActionTypes.UpdateEntity) {
                    const { entityId } = action.actionMetadata as IUpdateEntityMetadata;
                    let before;

                    if (entityId.startsWith(ruleBreachService.brokenRulesFakeEntityIdPrefix)) {
                        const numberPart = parseInt(entityId.slice(1, -4), 10);
                        before = actions[numberPart].actionMetadata as ICreateEntityMetadata;
                    } else {
                        before = await InstanceManagerService.getEntityInstanceById(entityId);
                    }
                    return {
                        actionType: action.actionType,
                        actionMetadata: {
                            ...action.actionMetadata,
                            before: before.properties,
                        },
                    };
                }

                return action;
            }),
        );
    }

    static async discardRuleBreachRequest(
        ruleBreachRequest: IRuleBreachRequest,
        user: Express.User,
        type: RuleBreachRequestStatus,
    ): Promise<IRuleBreachRequestPopulated> {
        RuleBreachesManager.checkIfRuleBreachRequestIsReviewable(ruleBreachRequest);

        RuleBreachesManager.deleteRuleBreachFiles(ruleBreachRequest);

        const fixedActionsPromises = await this.addBeforeFieldToUpdateAction(ruleBreachRequest.actions);
        const fixedActions = await Promise.all(fixedActionsPromises);
        await RuleBreachService.updateRuleBreachRequestActionsMetadata(ruleBreachRequest._id, fixedActions);

        const [updatedRuleBreachRequest] = await Promise.all([
            RuleBreachService.updateRuleBreachRequestStatus(ruleBreachRequest._id, user.id, type),
            RuleBreachService.updateRuleBreachRequestActionsMetadata(ruleBreachRequest._id, fixedActions),
        ]);
        const ruleBreachRequestPopulated = await RuleBreachesManager.populateRuleBreachRequest({
            ...updatedRuleBreachRequest,
            actions: fixedActions,
        });
        await RuleBreachesManager.sendNotification<IRuleBreachResponseNotificationMetadata, IRuleBreachResponseNotificationMetadataPopulated>(
            NotificationType.ruleBreachResponse,
            {
                requestId: ruleBreachRequest._id,
            },
            { request: ruleBreachRequestPopulated },
            [ruleBreachRequest.originUserId],
        );

        return ruleBreachRequestPopulated;
    }

    static async denyRuleBreachRequest(ruleBreachRequestId: string, user: Express.User): Promise<IRuleBreachRequestPopulated> {
        const ruleBreachRequest = await RuleBreachService.getRuleBreachRequestById(ruleBreachRequestId);
        return RuleBreachesManager.discardRuleBreachRequest(ruleBreachRequest, user, RuleBreachRequestStatus.Denied);
    }

    static async cancelRuleBreachRequest(ruleBreachRequestId: string, user: Express.User): Promise<IRuleBreachRequestPopulated> {
        const ruleBreachRequest = await RuleBreachService.getRuleBreachRequestById(ruleBreachRequestId);

        if (ruleBreachRequest.originUserId !== user.id) {
            throw new ServiceError(403, 'only the origin user can cancel rule breach request');
        }

        return RuleBreachesManager.discardRuleBreachRequest(ruleBreachRequest, user, RuleBreachRequestStatus.Canceled);
    }

    private static removeBasicProperties = (properties: Record<string, any>) => {
        const { createdAt, updatedAt, _id, disabled, ...rest } = properties;
        return rest;
    };

    private static async uploadRuleBreachFiles(
        ruleBreach: Omit<IRuleBreachAlert, '_id' | 'createdAt' | 'originUserId'>,
        files: Express.Multer.File[],
    ) {
        if (!files.length) return;

        // TODO - support upload files for multiple actions. for now, don't allow in bulk api...
        const [action] = ruleBreach.actions;

        if (action.actionType === ActionTypes.CreateEntity) {
            const entityTemplate = await EntityTemplateManagerService.getEntityTemplateById(
                (action.actionMetadata as ICreateEntityMetadata).templateId,
            );
            // temp solution
            const fileProperties = InstancesManager.getEntityFileProperties(
                this.removeBasicProperties((action.actionMetadata as ICreateEntityMetadata).properties),
                entityTemplate,
            );

            if (!fileProperties) {
                const { props: propertiesWithFiles } = await InstancesManager.uploadInstanceFiles(
                    files,
                    (action.actionMetadata as ICreateEntityMetadata).properties,
                );
                // eslint-disable-next-line no-param-reassign
                (action.actionMetadata as ICreateEntityMetadata).properties = propertiesWithFiles;
            }
            return;
        }

        if (action.actionType === ActionTypes.UpdateEntity) {
            const { props: updatedFieldsWithFiles } = await InstancesManager.uploadInstanceFiles(
                files,
                (action.actionMetadata as IUpdateEntityMetadata).updatedFields,
            );
            // eslint-disable-next-line no-param-reassign
            (action.actionMetadata as IUpdateEntityMetadata).updatedFields = updatedFieldsWithFiles;
            return;
        }

        if (action.actionType === ActionTypes.DuplicateEntity) {
            const { templateId, properties, entityIdToDuplicate } = action.actionMetadata as IDuplicateEntityMetadata;

            const currentEntity = await InstanceManagerService.getEntityInstanceById(entityIdToDuplicate);
            const currentEntityTemplate = await EntityTemplateManagerService.getEntityTemplateById(templateId);

            const fileProperties = InstancesManager.getEntityFileProperties(properties, currentEntityTemplate);

            const duplicatedFilesProperties = await InstancesManager.duplicateFileProperties(fileProperties, currentEntity);

            const { props: propertiesWithFiles } = await InstancesManager.uploadInstanceFiles(files, { ...properties, ...duplicatedFilesProperties });

            // eslint-disable-next-line no-param-reassign
            (action.actionMetadata as IDuplicateEntityMetadata).properties = propertiesWithFiles;
            return;
        }

        throw new ServiceError(400, 'shouldnt upload files to create rule breach request if not create/duplicate/update entity');
    }

    private static async deleteRuleBreachFiles(ruleBreach: Omit<IRuleBreachRequest | IRuleBreachAlert, '_id' | 'createdAt' | 'originUserId'>) {
        // TODO - support delete for multiple actions. for now, don't allow in bulk api...
        const [action] = ruleBreach.actions;

        if (action.actionType === ActionTypes.CreateEntity || action.actionType === ActionTypes.DuplicateEntity) {
            const entityTemplate = await EntityTemplateManagerService.getEntityTemplateById(
                (action.actionMetadata as ICreateEntityMetadata | IDuplicateEntityMetadata).templateId,
            );

            const filePropertiesToDelete = InstancesManager.getEntityFileProperties(
                (action.actionMetadata as ICreateEntityMetadata | IDuplicateEntityMetadata).properties,
                entityTemplate,
            );
            const fileIdsToDelete = Object.values(filePropertiesToDelete).flat();

            await deleteFiles(fileIdsToDelete);
        } else if (action.actionType === ActionTypes.UpdateEntity) {
            let entityTemplateId;
            const { entityId } = action.actionMetadata as IUpdateEntityMetadata;

            if (entityId.startsWith(ruleBreachService.brokenRulesFakeEntityIdPrefix)) {
                const numberPart = parseInt(entityId.slice(1, -4), 10);
                entityTemplateId = (ruleBreach.actions[numberPart].actionMetadata as ICreateEntityMetadataPopulated).templateId;
            } else {
                const entity = await InstanceManagerService.getEntityInstanceById((action.actionMetadata as IUpdateEntityMetadata).entityId);
                entityTemplateId = entity.templateId;
            }

            const entityTemplate = await EntityTemplateManagerService.getEntityTemplateById(entityTemplateId);

            const filePropertiesToDelete = InstancesManager.getEntityFileProperties(
                (action.actionMetadata as IUpdateEntityMetadata).updatedFields,
                entityTemplate,
            );
            const fileIdsToDelete = Object.values(filePropertiesToDelete).flat();

            await deleteFiles(fileIdsToDelete);
        }
    }

    static async searchRuleBreachRequests(agGridRequest: IAgGridRequest, user: Express.User): Promise<IAgGridResult<IRuleBreachRequestPopulated>> {
        const updatedAgGridRequest = await RuleBreachesManager.agGridSearchRuleBreachesOfUser(agGridRequest, user);

        const result = await RuleBreachService.searchRuleBreachRequests(updatedAgGridRequest);

        return {
            ...result,
            rows: await RuleBreachesManager.populateRulesBreachRequests(result.rows),
        };
    }

    static async searchRuleBreachAlerts(agGridRequest: IAgGridRequest, user: Express.User): Promise<IAgGridResult<IRuleBreachAlertPopulated>> {
        const updatedAgGridRequest = await RuleBreachesManager.agGridSearchRuleBreachesOfUser(agGridRequest, user);

        const result = await RuleBreachService.searchRuleBreachAlerts(updatedAgGridRequest);

        return {
            ...result,
            rows: await RuleBreachesManager.populateRulesBreachAlerts(result.rows),
        };
    }

    static async getRuleBreachRequestById(ruleBreachRequestId: string, user?: Express.User): Promise<IRuleBreachRequestPopulated> {
        const ruleBreachRequest = await RuleBreachService.getRuleBreachRequestById(ruleBreachRequestId);

        if (user && ruleBreachRequest.originUserId !== user.id && !(await isRuleManager(user.id))) {
            throw new ServiceError(403, 'user does not have permissions to this rule breach request');
        }

        return RuleBreachesManager.populateRuleBreachRequest(ruleBreachRequest);
    }

    static async getRuleBreachAlertsById(ruleBreachAlertId: string, user?: Express.User): Promise<IRuleBreachAlertPopulated> {
        const ruleBreachAlert = await RuleBreachService.getRuleBreachAlertById(ruleBreachAlertId);

        if (user && ruleBreachAlert.originUserId !== user.id && !(await isRuleManager(user.id))) {
            throw new ServiceError(403, 'user does not have permissions to this rule breach alert');
        }

        return RuleBreachesManager.populateRuleBreachAlert(ruleBreachAlert);
    }

    private static async agGridSearchRuleBreachesOfUser(agGridRequest: IAgGridRequest, user: Express.User): Promise<IAgGridRequest> {
        if (await isRuleManager(user.id)) return agGridRequest;

        const updatedAgGridRequest: IAgGridRequest = { ...agGridRequest };

        updatedAgGridRequest.filterModel.originUserId = {
            filterType: 'text',
            type: 'equals',
            filter: user.id,
        };

        return updatedAgGridRequest;
    }

    private static populateEntityForBrokenRules(entityId: string, entitiesMap: Map<string, IEntity>): IEntityForBrokenRules {
        if (entityId.startsWith(ruleBreachService.brokenRulesFakeEntityIdPrefix)) {
            return entityId;
        }
        return entitiesMap.get(entityId) ?? null;
    }

    private static populateRelationshipForBrokenRules(relationshipId: string, relationshipsMap: Map<string, IEntity>): IRelationshipForBrokenRules {
        if (relationshipId.startsWith(ruleBreachService.brokenRulesFakeEntityIdPrefix)) {
            return relationshipId;
        }
        return relationshipsMap.get(relationshipId) ?? null;
    }

    private static populateBrokenRule(
        { ruleId, failures }: IBrokenRule,
        entitiesMap: Map<string, IEntity>,
        relationshipsMap: Map<string, IEntity>,
    ): IBrokenRulePopulated {
        const failuresPopulated: IBrokenRulePopulated['failures'] = failures.map((failure) => {
            return {
                entity: RuleBreachesManager.populateEntityForBrokenRules(failure.entityId, entitiesMap),
                causes: failure.causes.map((cause): ICausesOfInstancePopulated => {
                    let aggregatedRelationship: ICauseInstancePopulated['aggregatedRelationship'];

                    if (cause.instance.aggregatedRelationship) {
                        const { relationshipId, otherEntityId } = cause.instance.aggregatedRelationship;
                        aggregatedRelationship = {
                            relationship: RuleBreachesManager.populateRelationshipForBrokenRules(relationshipId, relationshipsMap),
                            otherEntity: RuleBreachesManager.populateEntityForBrokenRules(otherEntityId, entitiesMap),
                        };
                    }

                    return {
                        properties: cause.properties,
                        instance: {
                            entity: RuleBreachesManager.populateEntityForBrokenRules(cause.instance.entityId, entitiesMap),
                            aggregatedRelationship,
                        },
                    };
                }),
            };
        });
        return {
            ruleId,
            failures: failuresPopulated,
        };
    }

    public static async populateBrokenRules(brokenRules: IBrokenRule[]): Promise<IBrokenRulePopulated[]> {
        const entitiyIds = new Set<string>();
        const relationshipIds = new Set<string>();
        brokenRules.forEach(({ failures }) => {
            failures.forEach(({ entityId, causes }) => {
                entitiyIds.add(entityId);

                causes.forEach(({ instance }) => {
                    entitiyIds.add(instance.entityId);

                    if (instance.aggregatedRelationship) {
                        entitiyIds.add(instance.aggregatedRelationship.otherEntityId);
                        relationshipIds.add(instance.aggregatedRelationship.relationshipId);
                    }
                });
            });
        });

        // no point to do getInstanceById to unexisting entity
        entitiyIds.forEach((str) => {
            if (str.startsWith(ruleBreachService.brokenRulesFakeEntityIdPrefix)) {
                entitiyIds.delete(str);
            }
        });
        relationshipIds.forEach((str) => {
            if (str.startsWith(ruleBreachService.brokenRulesFakeEntityIdPrefix)) {
                relationshipIds.delete(str);
            }
        });

        const entities = await InstanceManagerService.getEntityInstancesByIds(Array.from(entitiyIds));
        const relationships = await InstanceManagerService.getEntityInstancesByIds(Array.from(relationshipIds));

        const entitiesMap = new Map(entities.map((entity) => [entity.properties._id, entity]));
        const relationshipsMap = new Map(relationships.map((relationship) => [relationship.properties._id, relationship]));

        return brokenRules.map((brokenRule) => RuleBreachesManager.populateBrokenRule(brokenRule, entitiesMap, relationshipsMap));
    }

    private static async populateSourceAndDestinationEntities(sourceEntityId: string, destinationEntityId: string) {
        const [sourceEntity, destinationEntity] = await Promise.all([
            sourceEntityId.startsWith(ruleBreachService.brokenRulesFakeEntityIdPrefix)
                ? sourceEntityId
                : InstanceManagerService.getEntityInstanceById(sourceEntityId).catch(() => null),
            destinationEntityId.startsWith(ruleBreachService.brokenRulesFakeEntityIdPrefix)
                ? destinationEntityId
                : InstanceManagerService.getEntityInstanceById(destinationEntityId).catch(() => null),
        ]);

        return {
            sourceEntity,
            destinationEntity,
        };
    }

    public static async populateCreateRelationshipActionMetadata(
        actionMetadata: ICreateRelationshipMetadata,
    ): Promise<ICreateRelationshipMetadataPopulated> {
        const { sourceEntityId, destinationEntityId, ...restOfMetadata } = actionMetadata;

        return {
            ...restOfMetadata,
            ...(await RuleBreachesManager.populateSourceAndDestinationEntities(sourceEntityId, destinationEntityId)),
        };
    }

    public static async populateDeleteRelationshipActionMetadata(
        actionMetadata: IDeleteRelationshipMetadata,
    ): Promise<IDeleteRelationshipMetadataPopulated> {
        const { sourceEntityId, destinationEntityId, ...restOfMetadata } = actionMetadata;

        return {
            ...restOfMetadata,
            ...(await RuleBreachesManager.populateSourceAndDestinationEntities(sourceEntityId, destinationEntityId)),
        };
    }

    public static async populateCreateEntityActionMetadata(actionMetadata: ICreateEntityMetadata): Promise<ICreateEntityMetadataPopulated> {
        const { templateId, properties } = actionMetadata;
        const createdEntityWithPopulatedRelationshipReferences = await this.getPopulatedRelationshipReferences(templateId, properties);
        return { ...actionMetadata, properties: createdEntityWithPopulatedRelationshipReferences };
    }

    public static async populateDuplicateEntityActionMetadata(actionMetadata: IDuplicateEntityMetadata): Promise<IDuplicateEntityMetadataPopulated> {
        const { entityIdToDuplicate, ...restOfMetadata } = actionMetadata;

        const entityToDuplicate = entityIdToDuplicate.startsWith(ruleBreachService.brokenRulesFakeEntityIdPrefix)
            ? entityIdToDuplicate
            : await InstanceManagerService.getEntityInstanceById(entityIdToDuplicate).catch(() => null);

        return {
            entityToDuplicate,
            ...restOfMetadata,
        };
    }

    public static async getPopulatedRelationshipReferences(templateId: string, properties: Record<string, any>) {
        const entityTemplate = await EntityTemplateManagerService.getEntityTemplateById(templateId);
        const populatedProperties = JSON.parse(JSON.stringify(properties));

        await Promise.all(
            Object.entries(entityTemplate.properties.properties).map(async ([name, value]) => {
                const propertyValue = properties[name];
                if (value.format === 'relationshipReference' && propertyValue) {
                    populatedProperties[name] = await InstanceManagerService.getEntityInstanceById(propertyValue).catch(() => null);
                }
            }),
        );

        return populatedProperties;
    }

    public static async populateUpdateEntityActionMetadata(
        actionMetadata: IUpdateEntityMetadata,
        actions: IAction[],
    ): Promise<IUpdateEntityMetadataPopulated> {
        const { entityId, before } = actionMetadata;

        let entity: IEntity | null;
        let beforeEntityWithPopulatedRelationshipReferences: IEntity | undefined;
        if (entityId.startsWith(ruleBreachService.brokenRulesFakeEntityIdPrefix)) {
            const numberPart = parseInt(entityId.slice(1, -4), 10);
            entity = actions[numberPart].actionMetadata as IEntity;
        } else {
            entity = await InstanceManagerService.getEntityInstanceById(entityId).catch(() => null);
        }

        const currentEntityWithPopulatedRelationshipReferences = await this.getPopulatedRelationshipReferences(
            entity!.templateId,
            entity!.properties,
        );

        const updatedEntityWithPopulatedRelationshipReferences = await this.getPopulatedRelationshipReferences(
            entity!.templateId,
            actionMetadata.updatedFields,
        );

        if (before) {
            beforeEntityWithPopulatedRelationshipReferences = await this.getPopulatedRelationshipReferences(entity!.templateId, before);
        }

        return {
            updatedFields: updatedEntityWithPopulatedRelationshipReferences,
            entity: { templateId: entity!.templateId, properties: currentEntityWithPopulatedRelationshipReferences },
            ...(before && { before: beforeEntityWithPopulatedRelationshipReferences }),
        };
    }

    public static async populateUpdateEntityStatusActionMetadata(
        actionMetadata: IUpdateEntityStatusMetadata,
    ): Promise<IUpdateEntityStatusMetadataPopulated> {
        const { entityId, ...restOfMetadata } = actionMetadata;

        const entity = await InstanceManagerService.getEntityInstanceById(entityId).catch(() => null);

        return {
            ...restOfMetadata,
            entity,
        };
    }

    public static populateActionsMetaData = async (
        actions: IAction[],
    ): Promise<{ actionType: ActionTypes; actionMetadata: IActionMetadataPopulated }[]> => {
        const populatedActionsMetadataPromises: Promise<IActionMetadataPopulated>[] = [];

        if (actions) {
            actions.forEach((action) => {
                if (action.actionType === ActionTypes.CreateRelationship)
                    populatedActionsMetadataPromises.push(
                        RuleBreachesManager.populateCreateRelationshipActionMetadata(action.actionMetadata as ICreateRelationshipMetadata),
                    );
                else if (action.actionType === ActionTypes.DeleteRelationship)
                    populatedActionsMetadataPromises.push(
                        RuleBreachesManager.populateDeleteRelationshipActionMetadata(action.actionMetadata as IDeleteRelationshipMetadata),
                    );
                else if (action.actionType === ActionTypes.UpdateEntity) {
                    populatedActionsMetadataPromises.push(
                        RuleBreachesManager.populateUpdateEntityActionMetadata(action.actionMetadata as IUpdateEntityMetadata, actions),
                    );
                } else if (action.actionType === ActionTypes.UpdateStatus)
                    populatedActionsMetadataPromises.push(
                        RuleBreachesManager.populateUpdateEntityStatusActionMetadata(action.actionMetadata as IUpdateEntityStatusMetadata),
                    );
                else if (action.actionType === ActionTypes.CreateEntity)
                    populatedActionsMetadataPromises.push(
                        RuleBreachesManager.populateCreateEntityActionMetadata(action.actionMetadata as ICreateEntityMetadata),
                    );
                else if (action.actionType === ActionTypes.DuplicateEntity)
                    populatedActionsMetadataPromises.push(
                        RuleBreachesManager.populateDuplicateEntityActionMetadata(action.actionMetadata as IDuplicateEntityMetadata),
                    );
            });
        }

        const actionsMetadata = await Promise.all(populatedActionsMetadataPromises!);

        const populatedActions: {
            actionType: ActionTypes;
            actionMetadata: IActionMetadataPopulated;
        }[] = actions
            ? actions.map((action, index) => {
                  return {
                      actionType: action.actionType,
                      actionMetadata: actionsMetadata[index],
                  };
              })
            : [];

        return populatedActions;
    };

    public static async populateRuleBreach(ruleBreach: IRuleBreach): Promise<IRuleBreachPopulated> {
        const { originUserId, actions, brokenRules, ...restOfRuleBreach } = ruleBreach;

        const [populatedBrokenRules, originUser] = await Promise.all([
            RuleBreachesManager.populateBrokenRules(brokenRules),
            UsersManager.getUserById(originUserId),
        ]);

        const populatedActions: {
            actionType: ActionTypes;
            actionMetadata: IActionMetadataPopulated;
        }[] = await this.populateActionsMetaData(actions);

        return {
            ...restOfRuleBreach,
            originUser,
            actions: populatedActions,
            brokenRules: populatedBrokenRules,
        };
    }

    public static async populateRuleBreachRequest(ruleBreachRequest: IRuleBreachRequest): Promise<IRuleBreachRequestPopulated> {
        const { reviewerId, ...restOfRulesBreachRequest } = ruleBreachRequest;

        const [populatedRuleBreach, reviewer] = await Promise.all([
            RuleBreachesManager.populateRuleBreach(restOfRulesBreachRequest),
            reviewerId ? UsersManager.getUserById(reviewerId) : undefined,
        ]);

        return {
            ...populatedRuleBreach,
            status: ruleBreachRequest.status,
            reviewer,
        };
    }

    public static async populateRuleBreachAlert(ruleBreachAlert: IRuleBreachAlert): Promise<IRuleBreachAlertPopulated> {
        return RuleBreachesManager.populateRuleBreach(ruleBreachAlert);
    }

    public static async populateRulesBreachRequests(ruleBreachRequests: IRuleBreachRequest[]): Promise<IRuleBreachRequestPopulated[]> {
        return Promise.all(ruleBreachRequests.map(RuleBreachesManager.populateRuleBreachRequest));
    }

    public static async populateRulesBreachAlerts(ruleBreachAlerts: IRuleBreachAlert[]): Promise<IRuleBreachAlertPopulated[]> {
        return Promise.all(ruleBreachAlerts.map(RuleBreachesManager.populateRuleBreachAlert));
    }
}

export default RuleBreachesManager;
