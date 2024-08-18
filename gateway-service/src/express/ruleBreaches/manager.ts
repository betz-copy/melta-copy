/* eslint-disable no-plusplus */
import pickBy from 'lodash.pickby';
import { IEntity } from '../../externalServices/instanceService/interfaces/entities';
import { trycatch } from '../../utils';
import { ServiceError } from '../error';
import { InstancesManager } from '../instances/manager';

import config from '../../config';
import { IRelationship } from '../../externalServices/instanceService/interfaces/relationships';
import {
    INotificationMetadata,
    IRuleBreachAlertNotificationMetadata,
    IRuleBreachRequestNotificationMetadata,
    IRuleBreachResponseNotificationMetadata,
    NotificationType,
} from '../../externalServices/notificationService/interfaces';
import {
    INotificationMetadataPopulated,
    IRuleBreachAlertNotificationMetadataPopulated,
    IRuleBreachRequestNotificationMetadataPopulated,
    IRuleBreachResponseNotificationMetadataPopulated,
} from '../../externalServices/notificationService/interfaces/populated';
import { RuleBreachService } from '../../externalServices/ruleBreachService';
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
import {
    IActionMetadataPopulated,
    IBrokenRulePopulated,
    ICauseInstancePopulated,
    ICausesOfInstancePopulated,
    ICreateEntityMetadataPopulated,
    ICreateRelationshipMetadataPopulated,
    IDeleteRelationshipMetadataPopulated,
    IDuplicateEntityMetadataPopulated,
    IEntityForBrokenRules,
    IRelationshipForBrokenRules,
    IRuleBreachAlertPopulated,
    IRuleBreachPopulated,
    IRuleBreachRequestPopulated,
    IUpdateEntityMetadataPopulated,
    IUpdateEntityStatusMetadataPopulated,
} from '../../externalServices/ruleBreachService/interfaces/populated';
import DefaultManagerProxy from '../../utils/express/manager';
import { UsersManager } from '../users/manager';
import { UserService } from '../../externalServices/userService';
import { PermissionType, PermissionScope } from '../../externalServices/userService/interfaces/permissions';
import { IAgGridRequest, IAgGridResult } from '../../utils/agGrid/interface';
import { StorageService } from '../../externalServices/storageService';
import { EntityTemplateService } from '../../externalServices/templates/entityTemplateService';
import { InstancesService } from '../../externalServices/instanceService';
import { RabbitManager } from '../../utils/rabbit';

const { errorCodes } = config;

export class RuleBreachesManager extends DefaultManagerProxy<RuleBreachService> {
    private storageService: StorageService;

    private entityTemplateService: EntityTemplateService;

    private instancesService: InstancesService;

    private rabbitManager: RabbitManager;

    constructor(private workspaceId: string) {
        super(new RuleBreachService(workspaceId));
        this.storageService = new StorageService(workspaceId);
        this.entityTemplateService = new EntityTemplateService(workspaceId);
        this.instancesService = new InstancesService(workspaceId);
        this.rabbitManager = new RabbitManager(workspaceId);
    }

    async createRuleBreachRequest(
        ruleBreachRequestData: Omit<IRuleBreachRequest, '_id' | 'createdAt' | 'originUserId'>,
        userId: string,
        files: Express.Multer.File[] = [],
    ): Promise<IRuleBreachRequestPopulated> {
        await this.uploadRuleBreachFiles(ruleBreachRequestData, files);

        const { result, err } = await trycatch(async () => {
            const ruleBreachRequest = await this.service.createRuleBreachRequest({
                ...ruleBreachRequestData,
                originUserId: userId,
            });

            const request = await this.getRuleBreachRequestById(ruleBreachRequest._id);

            await this.sendNotification<IRuleBreachRequestNotificationMetadata, IRuleBreachRequestNotificationMetadataPopulated>(
                NotificationType.ruleBreachRequest,
                { requestId: ruleBreachRequest._id },
                { request },
                [userId],
            );

            return request;
        });

        if (err || !result) {
            await this.deleteRuleBreachFiles(ruleBreachRequestData);
            throw err;
        }

        return result;
    }

    async getManyRuleBreachRequests(body: { rulesBreachIds: string[]; isPopulate: boolean }) {
        const ruleBreaches = await this.service.getManyRuleBreaches(body.rulesBreachIds);
        if (!body.isPopulate) return ruleBreaches;

        return Promise.all(ruleBreaches.map((ruleBreach) => this.getRuleBreachRequestById(ruleBreach._id)));
    }

    async createRuleBreachAlert(
        ruleBreachAlertData: Omit<IRuleBreachAlert, '_id' | 'createdAt' | 'originUserId'>,
        userId: string,
        files: Express.Multer.File[] = [],
    ): Promise<IRuleBreachAlertPopulated> {
        await this.uploadRuleBreachFiles(ruleBreachAlertData, files);

        const { result, err } = await trycatch(async () => {
            const rulesBreachAlert = await this.service.createRuleBreachAlert({ ...ruleBreachAlertData, originUserId: userId });
            const alert = await this.getRuleBreachAlertsById(rulesBreachAlert._id);

            await this.sendNotification<IRuleBreachAlertNotificationMetadata, IRuleBreachAlertNotificationMetadataPopulated>(
                NotificationType.ruleBreachAlert,
                { alertId: rulesBreachAlert._id },
                { alert },
                [userId],
            );

            return alert;
        });

        if (err || !result) {
            await this.deleteRuleBreachFiles(ruleBreachAlertData);
            throw err;
        }

        return result;
    }

    checkIfRuleBreachRequestIsReviewable(ruleBreachRequest: IRuleBreachRequest) {
        if (ruleBreachRequest.status !== RuleBreachRequestStatus.Pending) {
            throw new ServiceError(400, 'rule breach requests was already reviewed');
        }
    }

    async approveRuleBreachRequest(
        ruleBreachRequestId: string,
        user: Express.User,
    ): Promise<
        | IRuleBreachRequestPopulated
        | { actionsResults: PromiseSettledResult<(IRelationship | IEntity)[]>[]; ruleBreachRequestPopulated: IRuleBreachRequestPopulated }
    > {
        const ruleBreachRequest = await this.service.getRuleBreachRequestById(ruleBreachRequestId);
        this.checkIfRuleBreachRequestIsReviewable(ruleBreachRequest);
        let actionsResults;

        if (ruleBreachRequest.actions.length > 1) {
            actionsResults = await this.instancesService.runBulkOfActions([ruleBreachRequest.actions], false, user.id, ruleBreachRequest.brokenRules);
        } else
            try {
                // only 1 action
                const [{ actionType, actionMetadata }] = ruleBreachRequest.actions;

                if (actionType === ActionTypes.CreateRelationship)
                    await this.createRelationship(
                        ruleBreachRequest.originUserId,
                        { actionMetadata: actionMetadata as ICreateRelationshipMetadata, actionType },
                        ruleBreachRequest.brokenRules,
                    );
                else if (actionType === ActionTypes.DeleteRelationship)
                    await this.deleteRelationship(
                        ruleBreachRequest.originUserId,
                        { actionMetadata: actionMetadata as IDeleteRelationshipMetadata, actionType },
                        ruleBreachRequest.brokenRules,
                    );
                else if (actionType === ActionTypes.CreateEntity)
                    await this.createEntity(
                        ruleBreachRequest._id,
                        ruleBreachRequest.originUserId,
                        { actionMetadata: actionMetadata as ICreateEntityMetadata, actionType },
                        ruleBreachRequest.brokenRules,
                    );
                else if (actionType === ActionTypes.DuplicateEntity)
                    await this.duplicateEntity(
                        ruleBreachRequest._id,
                        ruleBreachRequest.originUserId,
                        { actionMetadata: actionMetadata as IDuplicateEntityMetadata, actionType },
                        ruleBreachRequest.brokenRules,
                    );
                else if (actionType === ActionTypes.UpdateEntity)
                    await this.updateEntity(
                        ruleBreachRequest._id,
                        ruleBreachRequest.originUserId,
                        { actionMetadata: actionMetadata as IUpdateEntityMetadata, actionType },
                        ruleBreachRequest.brokenRules,
                    );
                else if (actionType === ActionTypes.UpdateStatus)
                    await this.updateEntityStatus(
                        ruleBreachRequest.originUserId,
                        { actionMetadata: actionMetadata as IUpdateEntityStatusMetadata, actionType },
                        ruleBreachRequest.brokenRules,
                    );
            } catch (error: any) {
                if (error instanceof ServiceError && error.metadata.errorCode === errorCodes.ruleBlock) {
                    await this.service.updateRuleBreachRequestBrokenRules(ruleBreachRequestId, error.metadata.rawBrokenRules);
                }

                throw error;
            }

        const updatedRuleBreachRequest = await this.service.updateRuleBreachRequestStatus(
            ruleBreachRequestId,
            user.id,
            RuleBreachRequestStatus.Approved,
        );

        const ruleBreachRequestPopulated = await this.populateRuleBreachRequest(updatedRuleBreachRequest);

        await this.sendNotification<IRuleBreachResponseNotificationMetadata, IRuleBreachResponseNotificationMetadataPopulated>(
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

    private async sendNotification<
        NotificationMetadata extends INotificationMetadata,
        NotificationMetadataPopulated extends INotificationMetadataPopulated,
    >(type: NotificationType, metadata: NotificationMetadata, populatedMetaData: NotificationMetadataPopulated, extraViewers: string[] = []) {
        const userIdsWithPermission = await UsersManager.searchUserIds({
            workspaceId: this.workspaceId,
            permissions: {
                [PermissionType.rules]: {
                    scope: PermissionScope.write,
                },
            },
            limit: config.instanceService.searchEntitiesFlowMaxLimit,
        });

        const viewers = new Set<string>(userIdsWithPermission);

        extraViewers.forEach((extraViewer) => viewers.add(extraViewer));

        await this.rabbitManager.createNotification(Array.from(viewers), type, metadata, populatedMetaData);
    }

    private async createRelationship(
        originUserId: string,
        action: {
            actionType: ActionTypes;
            actionMetadata: ICreateRelationshipMetadata;
        },
        brokenRules: IBrokenRule[],
    ) {
        const { relationshipTemplateId, sourceEntityId, destinationEntityId } = action.actionMetadata;
        const instancesManager = new InstancesManager(this.workspaceId);

        await instancesManager.createRelationshipInstance(
            { templateId: relationshipTemplateId, sourceEntityId, destinationEntityId, properties: {} as any },
            brokenRules,
            originUserId,
            false,
        );
    }

    private async deleteRelationship(
        originUserId: string,
        action: {
            actionType: ActionTypes;
            actionMetadata: IDeleteRelationshipMetadata;
        },
        brokenRules: IBrokenRule[],
    ) {
        const instancesManager = new InstancesManager(this.workspaceId);
        await instancesManager.deleteRelationshipInstance(action.actionMetadata.relationshipId, brokenRules, originUserId, false);
    }

    private async updateEntityStatus(
        originUserId: string,
        action: {
            actionType: ActionTypes;
            actionMetadata: IUpdateEntityStatusMetadata;
        },
        brokenRules: IBrokenRule[],
    ) {
        const instancesManager = new InstancesManager(this.workspaceId);
        await instancesManager.updateEntityStatus(action.actionMetadata.entityId, action.actionMetadata.disabled, brokenRules, originUserId, false);
    }

    private async createEntity(
        _id: string,
        originUserId: string,
        action: {
            actionType: ActionTypes;
            actionMetadata: ICreateEntityMetadata;
        },
        brokenRules: IBrokenRule[],
    ) {
        const { templateId, properties } = action.actionMetadata;
        const instancesManager = new InstancesManager(this.workspaceId);

        const entity = await instancesManager.createEntityInstance({ templateId, properties }, [], brokenRules, originUserId, false);

        await this.service.updateRuleBreachRequestActionsMetadata(_id, [
            {
                actionType: action.actionType,
                actionMetadata: {
                    ...action.actionMetadata,
                    properties: entity.properties,
                },
            },
        ]);
    }

    private async duplicateEntity(
        _id: string,
        originUserId: string,
        action: {
            actionType: ActionTypes;
            actionMetadata: IDuplicateEntityMetadata;
        },
        brokenRules: IBrokenRule[],
    ) {
        const { templateId, properties, entityIdToDuplicate } = action.actionMetadata;
        const instancesManager = new InstancesManager(this.workspaceId);

        const entity = await instancesManager.duplicateEntityInstance(
            entityIdToDuplicate,
            { templateId, properties },
            [],
            brokenRules,
            originUserId,
            false,
            false,
        );

        await this.service.updateRuleBreachRequestActionsMetadata(_id, [
            {
                actionType: action.actionType,
                actionMetadata: {
                    ...action.actionMetadata,
                    properties: entity.properties,
                },
            },
        ]);
    }

    private async updateEntity(
        _id: string,
        originUserId: string,
        action: {
            actionType: ActionTypes;
            actionMetadata: IUpdateEntityMetadata;
        },
        brokenRules: IBrokenRule[],
    ) {
        const { entityId, updatedFields } = action.actionMetadata;
        const instancesManager = new InstancesManager(this.workspaceId);

        const entity = await this.instancesService.getEntityInstanceById(entityId);
        const newEntityProperties = { ...entity.properties, ...updatedFields };

        // updatedFields specifies fields to remove w/ nulls. but shouldn't be in the IEntity properties
        const newEntityPropertiesWithoutNulls = pickBy(newEntityProperties, (property) => property !== null) as IEntity['properties'];

        await instancesManager.updateEntityInstance(
            entityId,
            { ...entity, properties: newEntityPropertiesWithoutNulls },
            [],
            brokenRules,
            originUserId,
            false,
        );

        await this.service.updateRuleBreachRequestActionsMetadata(_id, [
            {
                actionType: action.actionType,
                actionMetadata: {
                    ...action.actionMetadata,
                    before: entity,
                },
            },
        ]);
    }

    async discardRuleBreachRequest(
        ruleBreachRequest: IRuleBreachRequest,
        user: Express.User,
        type: RuleBreachRequestStatus,
    ): Promise<IRuleBreachRequestPopulated> {
        this.checkIfRuleBreachRequestIsReviewable(ruleBreachRequest);

        this.deleteRuleBreachFiles(ruleBreachRequest);

        const fixedActionsPromises: (IAction | Promise<IAction>)[] = ruleBreachRequest.actions.map((action) => {
            if (action.actionType === ActionTypes.UpdateEntity) {
                return this.instancesService.getEntityInstanceById((action.actionMetadata as IUpdateEntityMetadata).entityId).then((entity) => {
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
            this.service.updateRuleBreachRequestStatus(ruleBreachRequest._id, user.id, type),
            this.service.updateRuleBreachRequestActionsMetadata(ruleBreachRequest._id, fixedActions),
        ]);
        const ruleBreachRequestPopulated = await this.populateRuleBreachRequest({
            ...updatedRuleBreachRequest,
            actions: fixedActions,
        });
        await this.sendNotification<IRuleBreachResponseNotificationMetadata, IRuleBreachResponseNotificationMetadataPopulated>(
            NotificationType.ruleBreachResponse,
            {
                requestId: ruleBreachRequest._id,
            },
            { request: ruleBreachRequestPopulated },
            [ruleBreachRequest.originUserId],
        );

        return ruleBreachRequestPopulated;
    }

    async denyRuleBreachRequest(ruleBreachRequestId: string, user: Express.User): Promise<IRuleBreachRequestPopulated> {
        const ruleBreachRequest = await this.service.getRuleBreachRequestById(ruleBreachRequestId);
        return this.discardRuleBreachRequest(ruleBreachRequest, user, RuleBreachRequestStatus.Denied);
    }

    async cancelRuleBreachRequest(ruleBreachRequestId: string, user: Express.User): Promise<IRuleBreachRequestPopulated> {
        const ruleBreachRequest = await this.service.getRuleBreachRequestById(ruleBreachRequestId);

        if (ruleBreachRequest.originUserId !== user.id) {
            throw new ServiceError(403, 'only the origin user can cancel rule breach request');
        }

        return this.discardRuleBreachRequest(ruleBreachRequest, user, RuleBreachRequestStatus.Canceled);
    }

    private async uploadRuleBreachFiles(ruleBreach: Omit<IRuleBreachAlert, '_id' | 'createdAt' | 'originUserId'>, files: Express.Multer.File[]) {
        if (!files.length) return;

        const instancesManager = new InstancesManager(this.workspaceId);

        // TODO - support upload files for multiple actions. for now, don't allow in bulk api...
        const [action] = ruleBreach.actions;

        if (action.actionType === ActionTypes.CreateEntity) {
            const { props: propertiesWithFiles } = await instancesManager.uploadInstanceFiles(
                files,
                (action.actionMetadata as ICreateEntityMetadata).properties,
            );
            // eslint-disable-next-line no-param-reassign
            (action.actionMetadata as ICreateEntityMetadata).properties = propertiesWithFiles;
            return;
        }

        if (action.actionType === ActionTypes.UpdateEntity) {
            const { props: updatedFieldsWithFiles } = await instancesManager.uploadInstanceFiles(
                files,
                (action.actionMetadata as IUpdateEntityMetadata).updatedFields,
            );
            // eslint-disable-next-line no-param-reassign
            (action.actionMetadata as IUpdateEntityMetadata).updatedFields = updatedFieldsWithFiles;
            return;
        }

        if (action.actionType === ActionTypes.DuplicateEntity) {
            const { templateId, properties, entityIdToDuplicate } = action.actionMetadata as IDuplicateEntityMetadata;

            const currentEntity = await this.instancesService.getEntityInstanceById(entityIdToDuplicate);
            const currentEntityTemplate = await this.entityTemplateService.getEntityTemplateById(templateId);

            const fileProperties = instancesManager.getEntityFileProperties(properties, currentEntityTemplate);

            const duplicatedFilesProperties = await instancesManager.duplicateFileProperties(fileProperties, currentEntity);

            const { props: propertiesWithFiles } = await instancesManager.uploadInstanceFiles(files, {
                ...properties,
                ...duplicatedFilesProperties,
            });

            // eslint-disable-next-line no-param-reassign
            (action.actionMetadata as IDuplicateEntityMetadata).properties = propertiesWithFiles;
            return;
        }

        throw new ServiceError(400, 'shouldnt upload files to create rule breach request if not create/duplicate/update entity');
    }

    private async deleteRuleBreachFiles(ruleBreach: Omit<IRuleBreachRequest | IRuleBreachAlert, '_id' | 'createdAt' | 'originUserId'>) {
        // TODO - support delete for multiple actions. for now, don't allow in bulk api...
        const [action] = ruleBreach.actions;

        const instancesManager = new InstancesManager(this.workspaceId);

        if (action.actionType === ActionTypes.CreateEntity || action.actionType === ActionTypes.DuplicateEntity) {
            const entityTemplate = await this.entityTemplateService.getEntityTemplateById(
                (action.actionMetadata as ICreateEntityMetadata | IDuplicateEntityMetadata).templateId,
            );

            const filePropertiesToDelete = instancesManager.getEntityFileProperties(
                (action.actionMetadata as ICreateEntityMetadata | IDuplicateEntityMetadata).properties,
                entityTemplate,
            );
            const fileIdsToDelete = Object.values(filePropertiesToDelete).flat();

            await this.storageService.deleteFiles(fileIdsToDelete);
        } else if (action.actionType === ActionTypes.UpdateEntity) {
            const entity = await this.instancesService.getEntityInstanceById((action.actionMetadata as IUpdateEntityMetadata).entityId);
            const entityTemplate = await this.entityTemplateService.getEntityTemplateById(entity.templateId);

            const filePropertiesToDelete = instancesManager.getEntityFileProperties(
                (action.actionMetadata as IUpdateEntityMetadata).updatedFields,
                entityTemplate,
            );
            const fileIdsToDelete = Object.values(filePropertiesToDelete).flat();

            await this.storageService.deleteFiles(fileIdsToDelete);
        }
    }

    async searchRuleBreachRequests(agGridRequest: IAgGridRequest, user: Express.User): Promise<IAgGridResult<IRuleBreachRequestPopulated>> {
        const updatedAgGridRequest = await this.agGridSearchRuleBreachesOfUser(agGridRequest, user);

        const result = await this.service.searchRuleBreachRequests(updatedAgGridRequest);

        return {
            ...result,
            rows: await this.populateRulesBreachRequests(result.rows),
        };
    }

    async searchRuleBreachAlerts(agGridRequest: IAgGridRequest, user: Express.User): Promise<IAgGridResult<IRuleBreachAlertPopulated>> {
        const updatedAgGridRequest = await this.agGridSearchRuleBreachesOfUser(agGridRequest, user);

        const result = await this.service.searchRuleBreachAlerts(updatedAgGridRequest);

        return {
            ...result,
            rows: await this.populateRulesBreachAlerts(result.rows),
        };
    }

    async getRuleBreachRequestById(ruleBreachRequestId: string, user?: Express.User): Promise<IRuleBreachRequestPopulated> {
        const ruleBreachRequest = await this.service.getRuleBreachRequestById(ruleBreachRequestId);

        if (user && ruleBreachRequest.originUserId !== user.id) {
            const userPermissions = await UserService.getUserPermissions(user.id);
            if (userPermissions[this.workspaceId].rules?.scope !== PermissionScope.write) {
                throw new ServiceError(403, 'user does not have permissions to this rule breach request');
            }
        }

        return this.populateRuleBreachRequest(ruleBreachRequest);
    }

    async getRuleBreachAlertsById(ruleBreachAlertId: string, user?: Express.User): Promise<IRuleBreachAlertPopulated> {
        const ruleBreachAlert = await this.service.getRuleBreachAlertById(ruleBreachAlertId);

        if (user && ruleBreachAlert.originUserId !== user.id) {
            const userPermissions = await UserService.getUserPermissions(user.id);
            if (userPermissions[this.workspaceId].rules?.scope !== PermissionScope.write) {
                throw new ServiceError(403, 'user does not have permissions to this rule breach request');
            }
        }

        return this.populateRuleBreachAlert(ruleBreachAlert);
    }

    private async agGridSearchRuleBreachesOfUser(agGridRequest: IAgGridRequest, user: Express.User): Promise<IAgGridRequest> {
        const userPermissions = await UserService.getUserPermissions(user.id);
        if (userPermissions[this.workspaceId].rules?.scope === PermissionScope.write) return agGridRequest;

        const updatedAgGridRequest: IAgGridRequest = { ...agGridRequest };

        updatedAgGridRequest.filterModel.originUserId = {
            filterType: 'text',
            type: 'equals',
            filter: user.id,
        };

        return updatedAgGridRequest;
    }

    private populateEntityForBrokenRules(entityId: string, entitiesMap: Map<string, IEntity>): IEntityForBrokenRules {
        if (entityId.startsWith(config.ruleBreachService.brokenRulesFakeEntityIdPrefix)) {
            return entityId;
        }
        return entitiesMap.get(entityId) ?? null;
    }

    private populateRelationshipForBrokenRules(relationshipId: string, relationshipsMap: Map<string, IEntity>): IRelationshipForBrokenRules {
        if (relationshipId.startsWith(config.ruleBreachService.brokenRulesFakeEntityIdPrefix)) {
            return relationshipId;
        }
        return relationshipsMap.get(relationshipId) ?? null;
    }

    private populateBrokenRule(
        { ruleId, failures }: IBrokenRule,
        entitiesMap: Map<string, IEntity>,
        relationshipsMap: Map<string, IEntity>,
    ): IBrokenRulePopulated {
        const failuresPopulated: IBrokenRulePopulated['failures'] = failures.map((failure) => {
            return {
                entity: this.populateEntityForBrokenRules(failure.entityId, entitiesMap),
                causes: failure.causes.map((cause): ICausesOfInstancePopulated => {
                    let aggregatedRelationship: ICauseInstancePopulated['aggregatedRelationship'];

                    if (cause.instance.aggregatedRelationship) {
                        const { relationshipId, otherEntityId } = cause.instance.aggregatedRelationship;
                        aggregatedRelationship = {
                            relationship: this.populateRelationshipForBrokenRules(relationshipId, relationshipsMap),
                            otherEntity: this.populateEntityForBrokenRules(otherEntityId, entitiesMap),
                        };
                    }

                    return {
                        properties: cause.properties,
                        instance: {
                            entity: this.populateEntityForBrokenRules(cause.instance.entityId, entitiesMap),
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

    public async populateBrokenRules(brokenRules: IBrokenRule[]): Promise<IBrokenRulePopulated[]> {
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

        const entities = await this.instancesService.getEntityInstancesByIds(Array.from(entitiyIds));
        const relationships = await this.instancesService.getEntityInstancesByIds(Array.from(relationshipIds));

        const entitiesMap = new Map(entities.map((entity) => [entity.properties._id, entity]));
        const relationshipsMap = new Map(relationships.map((relationship) => [relationship.properties._id, relationship]));

        return brokenRules.map((brokenRule) => this.populateBrokenRule(brokenRule, entitiesMap, relationshipsMap));
    }

    private async populateSourceAndDestinationEntities(sourceEntityId: string, destinationEntityId: string) {
        const [sourceEntity, destinationEntity] = await Promise.all([
            sourceEntityId.startsWith('$') ? sourceEntityId : this.instancesService.getEntityInstanceById(sourceEntityId).catch(() => null),
            destinationEntityId.startsWith('$')
                ? destinationEntityId
                : this.instancesService.getEntityInstanceById(destinationEntityId).catch(() => null),
        ]);

        return {
            sourceEntity,
            destinationEntity,
        };
    }

    public async populateCreateRelationshipActionMetadata(
        actionMetadata: ICreateRelationshipMetadata,
    ): Promise<ICreateRelationshipMetadataPopulated> {
        const { sourceEntityId, destinationEntityId, ...restOfMetadata } = actionMetadata;

        return {
            ...restOfMetadata,
            ...(await this.populateSourceAndDestinationEntities(sourceEntityId, destinationEntityId)),
        };
    }

    public async populateDeleteRelationshipActionMetadata(
        actionMetadata: IDeleteRelationshipMetadata,
    ): Promise<IDeleteRelationshipMetadataPopulated> {
        const { sourceEntityId, destinationEntityId, ...restOfMetadata } = actionMetadata;

        return {
            ...restOfMetadata,
            ...(await this.populateSourceAndDestinationEntities(sourceEntityId, destinationEntityId)),
        };
    }

    public async populateCreateEntityActionMetadata(actionMetadata: ICreateEntityMetadata): Promise<ICreateEntityMetadataPopulated> {
        return actionMetadata;
    }

    public async populateDuplicateEntityActionMetadata(actionMetadata: IDuplicateEntityMetadata): Promise<IDuplicateEntityMetadataPopulated> {
        const { entityIdToDuplicate, ...restOfMetadata } = actionMetadata;

        const entityToDuplicate = entityIdToDuplicate.startsWith('$')
            ? entityIdToDuplicate
            : await this.instancesService.getEntityInstanceById(entityIdToDuplicate).catch(() => null);

        return {
            entityToDuplicate,
            ...restOfMetadata,
        };
    }

    public async populateUpdateEntityActionMetadata(actionMetadata: IUpdateEntityMetadata): Promise<IUpdateEntityMetadataPopulated> {
        const { entityId, ...restOfMetadata } = actionMetadata;

        const entity = await this.instancesService.getEntityInstanceById(entityId).catch(() => null);

        return {
            ...restOfMetadata,
            entity,
        };
    }

    public async populateUpdateEntityStatusActionMetadata(
        actionMetadata: IUpdateEntityStatusMetadata,
    ): Promise<IUpdateEntityStatusMetadataPopulated> {
        const { entityId, ...restOfMetadata } = actionMetadata;

        const entity = await this.instancesService.getEntityInstanceById(entityId).catch(() => null);

        return {
            ...restOfMetadata,
            entity,
        };
    }

    public async populateRuleBreach(ruleBreach: IRuleBreach): Promise<IRuleBreachPopulated> {
        const { originUserId, actions, brokenRules, ...restOfRuleBreach } = ruleBreach;

        const populatedActionMetadatasPromises: Promise<IActionMetadataPopulated>[] = [];

        if (actions) {
            actions.forEach((action) => {
                if (action.actionType === ActionTypes.CreateRelationship)
                    populatedActionMetadatasPromises.push(
                        this.populateCreateRelationshipActionMetadata(action.actionMetadata as ICreateRelationshipMetadata),
                    );
                else if (action.actionType === ActionTypes.DeleteRelationship)
                    populatedActionMetadatasPromises.push(
                        this.populateDeleteRelationshipActionMetadata(action.actionMetadata as IDeleteRelationshipMetadata),
                    );
                else if (action.actionType === ActionTypes.UpdateEntity)
                    populatedActionMetadatasPromises.push(this.populateUpdateEntityActionMetadata(action.actionMetadata as IUpdateEntityMetadata));
                else if (action.actionType === ActionTypes.UpdateStatus)
                    populatedActionMetadatasPromises.push(
                        this.populateUpdateEntityStatusActionMetadata(action.actionMetadata as IUpdateEntityStatusMetadata),
                    );
                else if (action.actionType === ActionTypes.CreateEntity)
                    populatedActionMetadatasPromises.push(this.populateCreateEntityActionMetadata(action.actionMetadata as ICreateEntityMetadata));
                else if (action.actionType === ActionTypes.DuplicateEntity)
                    populatedActionMetadatasPromises.push(
                        this.populateDuplicateEntityActionMetadata(action.actionMetadata as IDuplicateEntityMetadata),
                    );
            });
        }

        const actionsMetadatas = await Promise.all(populatedActionMetadatasPromises!);

        const [populatedBrokenRules, originUser] = await Promise.all([this.populateBrokenRules(brokenRules), UsersManager.getUserById(originUserId)]);

        const populatedActions =
            actions?.map((action, index) => ({
                actionType: action.actionType,
                actionMetadata: actionsMetadatas[index],
            })) || [];

        return {
            ...restOfRuleBreach,
            originUser,
            actions: populatedActions,
            brokenRules: populatedBrokenRules,
        };
    }

    public async populateRuleBreachRequest(ruleBreachRequest: IRuleBreachRequest): Promise<IRuleBreachRequestPopulated> {
        const { reviewerId, ...restOfRulesBreachRequest } = ruleBreachRequest;

        const [populatedRuleBreach, reviewer] = await Promise.all([
            this.populateRuleBreach(restOfRulesBreachRequest),
            reviewerId ? UsersManager.getUserById(reviewerId) : undefined,
        ]);

        return {
            ...populatedRuleBreach,
            status: ruleBreachRequest.status,
            reviewer,
        };
    }

    public async populateRuleBreachAlert(ruleBreachAlert: IRuleBreachAlert): Promise<IRuleBreachAlertPopulated> {
        return this.populateRuleBreach(ruleBreachAlert);
    }

    public async populateRulesBreachRequests(ruleBreachRequests: IRuleBreachRequest[]): Promise<IRuleBreachRequestPopulated[]> {
        return Promise.all(ruleBreachRequests.map(this.populateRuleBreachRequest));
    }

    public async populateRulesBreachAlerts(ruleBreachAlerts: IRuleBreachAlert[]): Promise<IRuleBreachAlertPopulated[]> {
        return Promise.all(ruleBreachAlerts.map(this.populateRuleBreachAlert));
    }
}

export default RuleBreachesManager;
