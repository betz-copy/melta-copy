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

const { errorCodes } = config;

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

        const populatedRuleBreachesPromises = ruleBreaches.map((ruleBreach) => {
            return RuleBreachesManager.getRuleBreachRequestById(ruleBreach._id);
        });

        return Promise.all(populatedRuleBreachesPromises);
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

    static async approveRuleBreachRequest(ruleBreachRequestId: string, user: Express.User): Promise<IRuleBreachRequestPopulated> {
        const ruleBreachRequest = await RuleBreachService.getRuleBreachRequestById(ruleBreachRequestId);
        RuleBreachesManager.checkIfRuleBreachRequestIsReviewable(ruleBreachRequest);

        if (ruleBreachRequest.actions.length > 1) {
            await InstanceManagerService.runBulkOfActions([ruleBreachRequest.actions], false, ruleBreachRequest.brokenRules, user.id);
        } else
            try {
                // only 1 action
                const { actionType } = ruleBreachRequest.actions[0];
                const { actionMetadata } = ruleBreachRequest.actions[0];

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

        await RuleBreachService.updateRuleBreachRequestActionsMetadatas(_id, [
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

        await RuleBreachService.updateRuleBreachRequestActionsMetadatas(_id, [
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

        await RuleBreachService.updateRuleBreachRequestActionsMetadatas(_id, [
            {
                actionType: action.actionType,
                actionMetadata: {
                    ...action.actionMetadata,
                    before: entity,
                },
            },
        ]);
    }

    static async discardRuleBreachRequest(
        ruleBreachRequest: IRuleBreachRequest,
        user: Express.User,
        type: RuleBreachRequestStatus,
    ): Promise<IRuleBreachRequestPopulated> {
        RuleBreachesManager.checkIfRuleBreachRequestIsReviewable(ruleBreachRequest);

        RuleBreachesManager.deleteRuleBreachFiles(ruleBreachRequest);

        const fixedActionsPromises: (IAction | Promise<IAction>)[] = ruleBreachRequest.actions.map((action) => {
            if (action.actionType === ActionTypes.UpdateEntity) {
                return InstanceManagerService.getEntityInstanceById((action.actionMetadata as IUpdateEntityMetadata).entityId).then((entity) => {
                    return {
                        actionType: action.actionType,
                        actionMetadata: {
                            ...action.actionMetadata,
                            before: entity,
                        },
                    };
                });
            }
            return action;
        });

        const fixedActions = await Promise.all(fixedActionsPromises);

        const [updatedRuleBreachRequest] = await Promise.all([
            RuleBreachService.updateRuleBreachRequestStatus(ruleBreachRequest._id, user.id, type),
            RuleBreachService.updateRuleBreachRequestActionsMetadatas(ruleBreachRequest._id, fixedActions),
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

    private static async uploadRuleBreachFiles(
        ruleBreach: Omit<IRuleBreachAlert, '_id' | 'createdAt' | 'originUserId'>,
        files: Express.Multer.File[],
    ) {
        if (!files.length) return;

        // TODO - support upload files for multiple actions. for now, don't allow in bulk api...
        const action = ruleBreach.actions[0];

        if (action.actionType === ActionTypes.CreateEntity) {
            const { props: propertiesWithFiles } = await InstancesManager.uploadInstanceFiles(
                files,
                (action.actionMetadata as ICreateEntityMetadata).properties,
            );
            // eslint-disable-next-line no-param-reassign
            (action.actionMetadata as ICreateEntityMetadata).properties = propertiesWithFiles;
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
        const action = ruleBreach.actions[0];

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
            const entity = await InstanceManagerService.getEntityInstanceById((action.actionMetadata as IUpdateEntityMetadata).entityId);
            const entityTemplate = await EntityTemplateManagerService.getEntityTemplateById(entity.templateId);

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
        if (entityId.startsWith('$')) {
            return entityId;
        }
        return entitiesMap.get(entityId) ?? null;
    }

    private static populateRelationshipForBrokenRules(relationshipId: string, relationshipsMap: Map<string, IEntity>): IRelationshipForBrokenRules {
        if (relationshipId.startsWith('$')) {
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
            if (str.startsWith('$')) {
                entitiyIds.delete(str);
            }
        });
        relationshipIds.forEach((str) => {
            if (str.startsWith('$')) {
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
            sourceEntityId.startsWith('$') ? sourceEntityId : InstanceManagerService.getEntityInstanceById(sourceEntityId).catch(() => null),
            destinationEntityId.startsWith('$')
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
        return actionMetadata;
    }

    public static async populateDuplicateEntityActionMetadata(actionMetadata: IDuplicateEntityMetadata): Promise<IDuplicateEntityMetadataPopulated> {
        const { entityIdToDuplicate, ...restOfMetadata } = actionMetadata;

        const entityToDuplicate = entityIdToDuplicate.startsWith('$')
            ? entityIdToDuplicate
            : await InstanceManagerService.getEntityInstanceById(entityIdToDuplicate).catch(() => null);

        return {
            entityToDuplicate,
            ...restOfMetadata,
        };
    }

    public static async populateUpdateEntityActionMetadata(actionMetadata: IUpdateEntityMetadata): Promise<IUpdateEntityMetadataPopulated> {
        const { entityId, ...restOfMetadata } = actionMetadata;
        /// i get null when update the created entity and then it doesn't know the id so it makes it null
        // i can define it $0._id and then get the first place but its ugly
        const entity = await InstanceManagerService.getEntityInstanceById(entityId).catch(() => null);

        return {
            ...restOfMetadata,
            entity,
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
        const populatedActionMetadatasPromises: Promise<IActionMetadataPopulated>[] = [];

        if (actions) {
            actions.forEach((action) => {
                if (action.actionType === ActionTypes.CreateRelationship)
                    populatedActionMetadatasPromises.push(
                        RuleBreachesManager.populateCreateRelationshipActionMetadata(action.actionMetadata as ICreateRelationshipMetadata),
                    );
                else if (action.actionType === ActionTypes.DeleteRelationship)
                    populatedActionMetadatasPromises.push(
                        RuleBreachesManager.populateDeleteRelationshipActionMetadata(action.actionMetadata as IDeleteRelationshipMetadata),
                    );
                else if (action.actionType === ActionTypes.UpdateEntity)
                    populatedActionMetadatasPromises.push(
                        RuleBreachesManager.populateUpdateEntityActionMetadata(action.actionMetadata as IUpdateEntityMetadata),
                    );
                else if (action.actionType === ActionTypes.UpdateStatus)
                    populatedActionMetadatasPromises.push(
                        RuleBreachesManager.populateUpdateEntityStatusActionMetadata(action.actionMetadata as IUpdateEntityStatusMetadata),
                    );
                else if (action.actionType === ActionTypes.CreateEntity)
                    populatedActionMetadatasPromises.push(
                        RuleBreachesManager.populateCreateEntityActionMetadata(action.actionMetadata as ICreateEntityMetadata),
                    );
                else if (action.actionType === ActionTypes.DuplicateEntity)
                    populatedActionMetadatasPromises.push(
                        RuleBreachesManager.populateDuplicateEntityActionMetadata(action.actionMetadata as IDuplicateEntityMetadata),
                    );
            });
        }

        const actionsMetadatas = await Promise.all(populatedActionMetadatasPromises!);

        const populatedActions: {
            actionType: ActionTypes;
            actionMetadata: IActionMetadataPopulated;
        }[] = actions
            ? actions.map((action, index) => {
                  return {
                      actionType: action.actionType,
                      actionMetadata: actionsMetadatas[index],
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
