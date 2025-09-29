/* eslint-disable no-plusplus */
import {
    ActionTypes,
    BadRequestError,
    ForbiddenError,
    IAction,
    IActionMetadataPopulated,
    IAgGridRequest,
    IBrokenRule,
    IBrokenRulePopulated,
    ICauseInstancePopulated,
    ICausesOfInstancePopulated,
    ICreateEntityMetadata,
    ICreateEntityMetadataPopulated,
    ICreateRelationshipMetadata,
    ICreateRelationshipMetadataPopulated,
    IDeleteRelationshipMetadata,
    IDeleteRelationshipMetadataPopulated,
    IDuplicateEntityMetadata,
    IDuplicateEntityMetadataPopulated,
    IEntity,
    IEntityForBrokenRules,
    IKartoffelUser,
    IMongoEntityTemplatePopulated,
    INotificationMetadata,
    INotificationMetadataPopulated,
    IRelationship,
    IRelationshipForBrokenRules,
    IRuleBreach,
    IRuleBreachAlert,
    IRuleBreachAlertNotificationMetadata,
    IRuleBreachAlertNotificationMetadataPopulated,
    IRuleBreachAlertPopulated,
    IRuleBreachPopulated,
    IRuleBreachRequest,
    IRuleBreachRequestNotificationMetadata,
    IRuleBreachRequestNotificationMetadataPopulated,
    IRuleBreachRequestPopulated,
    IRuleBreachResponseNotificationMetadata,
    IRuleBreachResponseNotificationMetadataPopulated,
    IRuleMail,
    IUpdateEntityMetadata,
    IUpdateEntityMetadataPopulated,
    IUpdateEntityStatusMetadata,
    IUpdateEntityStatusMetadataPopulated,
    InstancesSubclassesPermissions,
    NotificationType,
    PermissionScope,
    PermissionType,
    RuleBreachRequestStatus,
    UploadedFile,
    basicFilterOperationTypes,
} from '@microservices/shared';
import pickBy from 'lodash.pickby';
import config from '../../config';
import InstancesService from '../../externalServices/instanceService';
import RuleBreachService from '../../externalServices/ruleBreachService';
import StorageService from '../../externalServices/storageService';
import EntityTemplateService from '../../externalServices/templates/entityTemplateService';
import { trycatch } from '../../utils';
import { IAgGridResult } from '../../utils/agGrid/interface';
import { Authorizer } from '../../utils/authorizer';
import DefaultManagerProxy from '../../utils/express/manager';
import { injectValuesToEmails } from '../../utils/mailNotifications/handlebars';
import RabbitManager from '../../utils/rabbit';
import InstancesManager from '../instances/manager';
import TemplatesManager from '../templates/manager';
import UsersManager from '../users/manager';
import WorkspaceManager from '../workspaces/manager';

const { errorCodes, ruleBreachService } = config;

export class RuleBreachesManager extends DefaultManagerProxy<RuleBreachService> {
    private storageService: StorageService;

    private entityTemplateService: EntityTemplateService;

    private instancesService: InstancesService;

    private authorizer: Authorizer;

    private rabbitManager: RabbitManager;

    constructor(private workspaceId: string) {
        super(new RuleBreachService(workspaceId));
        this.storageService = new StorageService(workspaceId);
        this.entityTemplateService = new EntityTemplateService(workspaceId);
        this.instancesService = new InstancesService(workspaceId);
        this.authorizer = new Authorizer(workspaceId);
        this.rabbitManager = new RabbitManager(workspaceId);
    }

    async createRuleBreachRequest(
        ruleBreachRequestData: Omit<IRuleBreachRequest, '_id' | 'createdAt' | 'originUserId'>,
        userId: string,
        files: UploadedFile[] = [],
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
        files: UploadedFile[] = [],
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
            throw new BadRequestError('rule breach requests was already reviewed');
        }
    }

    async updateRuleBreachRequestData(id: string, actions: IAction[], results: IEntity | IRelationship[]) {
        const fixedActions = [...actions];

        actions.forEach(({ actionMetadata, actionType }, index) => {
            if (actionType === ActionTypes.CreateEntity || actionType === ActionTypes.DuplicateEntity) {
                fixedActions[index] = {
                    actionType,
                    actionMetadata: {
                        ...actionMetadata,
                        properties: results[index].properties,
                    },
                };
            }

            if (actionType === ActionTypes.UpdateEntity) {
                if ((actionMetadata as IUpdateEntityMetadata).entityId.startsWith('$')) {
                    const numberPart = parseInt((actionMetadata as IUpdateEntityMetadata).entityId.slice(1, -4), 10);
                    const createdEntity = results[numberPart] as IEntity;

                    fixedActions[index] = {
                        actionType,
                        actionMetadata: {
                            ...actionMetadata,
                            entityId: createdEntity.properties._id,
                        },
                    };
                }
            }
        });

        await this.service.updateRuleBreachRequestActionsMetadata(id, fixedActions);
    }

    async approveRuleBreachRequest(
        ruleBreachRequestId: string,
        user: Express.User,
        childTemplateId?: string,
    ): Promise<
        | IRuleBreachRequestPopulated
        | { actionsResults: PromiseSettledResult<(IRelationship | IEntity)[]>[]; ruleBreachRequestPopulated: IRuleBreachRequestPopulated }
    > {
        const ruleBreachRequest = await this.service.getRuleBreachRequestById(ruleBreachRequestId);
        this.checkIfRuleBreachRequestIsReviewable(ruleBreachRequest);
        let actionsResults;

        if (ruleBreachRequest.actions.length > 1) {
            const fixedActionsPromises = await this.addBeforeFieldToUpdateAction(ruleBreachRequest.actions);
            const fixedActions = await Promise.all(fixedActionsPromises);

            await this.service.updateRuleBreachRequestActionsMetadata(ruleBreachRequest._id, fixedActions);

            actionsResults = await this.instancesService.runBulkOfActions([ruleBreachRequest.actions], false, user.id, ruleBreachRequest.brokenRules);

            await this.updateRuleBreachRequestData(ruleBreachRequest._id, ruleBreachRequest.actions, actionsResults[0].value);
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
                        childTemplateId,
                    );
                else if (actionType === ActionTypes.DuplicateEntity)
                    await this.duplicateEntity(
                        ruleBreachRequest._id,
                        ruleBreachRequest.originUserId,
                        { actionMetadata: actionMetadata as IDuplicateEntityMetadata, actionType },
                        ruleBreachRequest.brokenRules,
                        childTemplateId,
                    );
                else if (actionType === ActionTypes.UpdateEntity)
                    await this.updateEntity(
                        ruleBreachRequest._id,
                        ruleBreachRequest.originUserId,
                        { actionMetadata: actionMetadata as IUpdateEntityMetadata, actionType },
                        ruleBreachRequest.brokenRules,
                        childTemplateId,
                    );
                else if (actionType === ActionTypes.UpdateStatus)
                    await this.updateEntityStatus(
                        ruleBreachRequest.originUserId,
                        { actionMetadata: actionMetadata as IUpdateEntityStatusMetadata, actionType },
                        ruleBreachRequest.brokenRules,
                    );
            } catch (error: any) {
                if (error.metadata.errorCode === errorCodes.ruleBlock) {
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

    private async getAssociatedUsers(entity: IEntity): Promise<IKartoffelUser[]> {
        const entityTemplate: IMongoEntityTemplatePopulated = await this.entityTemplateService.getEntityTemplateById(entity.templateId);
        const users: IKartoffelUser[] = [];
        Object.entries(entityTemplate.properties.properties).forEach(([key, value]) => {
            if (value.format === 'user' && entity.properties[key]) {
                const user = JSON.parse(entity.properties[key]);
                users.push(user);
            }

            if (value.items?.format === 'user' && entity.properties[key]) {
                const userArray = entity.properties[key].map((user) => JSON.parse(user));
                users.push(...userArray);
            }
        });

        return users;
    }

    private async getPermissionUsers(entity: IEntity): Promise<string[]> {
        const workspaceIds = await WorkspaceManager.getWorkspaceHierarchyIds(this.workspaceId);
        const entityTemplate: IMongoEntityTemplatePopulated = await this.entityTemplateService.getEntityTemplateById(entity.templateId);

        const permissionUsers = await Promise.all([
            await UsersManager.searchUserIds({
                workspaceIds,
                permissions: {
                    [PermissionType.instances]: {
                        categories: {
                            [entityTemplate.category._id]: {
                                [InstancesSubclassesPermissions.entityTemplates]: {
                                    [entityTemplate._id]: {
                                        fields: {},
                                        scope: PermissionScope.read,
                                    },
                                },
                            },
                        },
                    },
                },
                limit: config.instanceService.searchEntitiesFlowMaxLimit,
            }),

            await UsersManager.searchUserIds({
                workspaceIds,
                permissions: {
                    [PermissionType.instances]: {
                        categories: {
                            [entityTemplate.category._id]: {
                                [InstancesSubclassesPermissions.entityTemplates]: {},
                                scope: PermissionScope.read,
                            },
                        },
                    },
                },
                limit: config.instanceService.searchEntitiesFlowMaxLimit,
            }),

            await UsersManager.searchUserIds({
                workspaceIds,
                permissions: {
                    [PermissionType.admin]: {
                        scope: PermissionScope.write,
                    },
                },
                limit: config.instanceService.searchEntitiesFlowMaxLimit,
            }),
        ]);

        return permissionUsers.flat();
    }

    async sendIndicatorEmailNotifications(
        emails: IRuleMail[],
        entity: IEntity,
        userId: string,
        entityTemplate: IMongoEntityTemplatePopulated,
        relatedTemplates: Map<string, IMongoEntityTemplatePopulated>,
        baseUrl: string,
    ) {
        let permissionUsers: string[] = [];
        if (emails.some((email) => email.sendPermissionUsers)) permissionUsers = await this.getPermissionUsers(entity);
        const injectedEmails: IRuleMail[] = injectValuesToEmails(emails, entity, entityTemplate, relatedTemplates, baseUrl);

        await Promise.all(
            injectedEmails.map(async (email) => {
                const viewers = new Set<string>([userId, ...permissionUsers]);
                const externalViewers = email.sendAssociatedUsers ? await this.getAssociatedUsers(entity) : undefined;

                return this.rabbitManager.createNotification(
                    Array.from(viewers),
                    NotificationType.ruleIndicatorAlert,
                    {
                        entityId: entity.properties._id,
                        email,
                    },
                    { entity, email },
                    externalViewers,
                );
            }),
        );
    }

    private async sendNotification<
        NotificationMetadata extends INotificationMetadata,
        NotificationMetadataPopulated extends INotificationMetadataPopulated,
    >(type: NotificationType, metadata: NotificationMetadata, populatedMetaData: NotificationMetadataPopulated, extraViewers: string[] = []) {
        const workspaceIds = await WorkspaceManager.getWorkspaceHierarchyIds(this.workspaceId);

        const userIdsWithPermission = await UsersManager.searchUserIds({
            workspaceIds,
            permissions: {
                [PermissionType.rules]: {
                    scope: PermissionScope.write,
                },
            },
            limit: 1000,
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
        childTemplateId?: string,
    ) {
        const { templateId, properties } = action.actionMetadata;
        const instancesManager = new InstancesManager(this.workspaceId);

        const entity = await instancesManager.createEntityInstance(
            { templateId, properties },
            [],
            brokenRules,
            originUserId,
            childTemplateId,
            undefined,
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

    private async duplicateEntity(
        _id: string,
        originUserId: string,
        action: {
            actionType: ActionTypes;
            actionMetadata: IDuplicateEntityMetadata;
        },
        brokenRules: IBrokenRule[],
        childTemplateId?: string,
    ) {
        const { templateId, properties, entityIdToDuplicate } = action.actionMetadata;
        const instancesManager = new InstancesManager(this.workspaceId);

        const entity = await instancesManager.duplicateEntityInstance(
            entityIdToDuplicate,
            { templateId, properties },
            [],
            brokenRules,
            originUserId,
            childTemplateId,
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
        childTemplateId?: string,
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
            childTemplateId,
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

    async addBeforeFieldToUpdateAction(actions: IAction[]): Promise<(IAction | Promise<IAction>)[]> {
        const updateActions = actions.filter((action) => action.actionType === ActionTypes.UpdateEntity);

        return Promise.all(
            actions.map(async (action) => {
                if (!updateActions.includes(action)) return action;

                const { entityId } = action.actionMetadata as IUpdateEntityMetadata;
                let before: ICreateEntityMetadata | IEntity;

                if (entityId.startsWith(ruleBreachService.brokenRulesFakeEntityIdPrefix)) {
                    const numberPart = parseInt(entityId.slice(1, -4), 10);
                    before = actions[numberPart].actionMetadata as ICreateEntityMetadata;
                } else before = await this.instancesService.getEntityInstanceById(entityId);

                return {
                    actionType: action.actionType,
                    actionMetadata: {
                        ...action.actionMetadata,
                        before: before.properties,
                    },
                };
            }),
        );
    }

    async discardRuleBreachRequest(
        ruleBreachRequest: IRuleBreachRequest,
        user: Express.User,
        type: RuleBreachRequestStatus,
    ): Promise<IRuleBreachRequestPopulated> {
        this.checkIfRuleBreachRequestIsReviewable(ruleBreachRequest);

        this.deleteRuleBreachFiles(ruleBreachRequest);

        const fixedActionsPromises = await this.addBeforeFieldToUpdateAction(ruleBreachRequest.actions);
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
            throw new ForbiddenError('only the origin user can cancel rule breach request');
        }

        return this.discardRuleBreachRequest(ruleBreachRequest, user, RuleBreachRequestStatus.Canceled);
    }

    private async uploadRuleBreachFiles(ruleBreach: Omit<IRuleBreachAlert, '_id' | 'createdAt' | 'originUserId'>, files: UploadedFile[] = []) {
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

        throw new BadRequestError('shouldnt upload files to create rule breach request if not create/duplicate/update entity');
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
            let entityTemplateId;
            const { entityId } = action.actionMetadata as IUpdateEntityMetadata;

            if (entityId.startsWith(ruleBreachService.brokenRulesFakeEntityIdPrefix)) {
                const numberPart = parseInt(entityId.slice(1, -4), 10);
                entityTemplateId = (ruleBreach.actions[numberPart].actionMetadata as ICreateEntityMetadataPopulated).templateId;
            } else {
                const entity = await this.instancesService.getEntityInstanceById((action.actionMetadata as IUpdateEntityMetadata).entityId);
                entityTemplateId = entity.templateId;
            }

            const entityTemplate = await this.entityTemplateService.getEntityTemplateById(entityTemplateId);

            const filePropertiesToDelete = instancesManager.getEntityFileProperties(
                (action.actionMetadata as IUpdateEntityMetadata).updatedFields,
                entityTemplate,
            );
            const fileIdsToDelete = Object.values(filePropertiesToDelete).flat();

            await this.storageService.deleteFiles(fileIdsToDelete);
        }
    }

    async getAllowedRuleBreaches(result: IAgGridResult<IRuleBreachRequest | IRuleBreachAlert>, user: Express.User) {
        const usersPermissions = await this.authorizer.getWorkspacePermissions(user.id);
        const templateManager = new TemplatesManager(this.workspaceId);

        const allowedEntityTemplateIds = await templateManager.getAllowedEntityTemplateIds(usersPermissions, user.id);

        const res = await Promise.all(
            result.rows.map(async (row) => {
                const isRowAllowed = await Promise.all(
                    row.actions.map(async (action) => {
                        let entityTemplateId = '-';

                        switch (action.actionType) {
                            case ActionTypes.CreateEntity:
                                entityTemplateId = (action.actionMetadata as ICreateEntityMetadataPopulated).templateId;
                                break;
                            case ActionTypes.DuplicateEntity:
                                entityTemplateId = (action.actionMetadata as IDuplicateEntityMetadataPopulated).templateId;
                                break;
                            case ActionTypes.UpdateEntity: {
                                const actionMetadata = action.actionMetadata as IUpdateEntityMetadata;
                                const entity = await this.instancesService.getEntityInstanceById(actionMetadata.entityId);
                                entityTemplateId = entity.templateId || '-';
                                break;
                            }
                            default:
                                entityTemplateId = '-';
                        }

                        return allowedEntityTemplateIds.includes(entityTemplateId);
                    }),
                );

                return isRowAllowed.every(Boolean);
            }),
        );

        return result.rows.filter((_row, index) => res[index]);
    }

    async searchRuleBreachRequests(agGridRequest: IAgGridRequest, user: Express.User): Promise<IAgGridResult<IRuleBreachRequestPopulated>> {
        const updatedAgGridRequest = await this.agGridSearchRuleBreachesOfUser(agGridRequest, user);

        const result = await this.service.searchRuleBreachRequests(updatedAgGridRequest);

        const allowedRows = await this.getAllowedRuleBreaches(result, user);

        return {
            rows: await this.populateRulesBreachRequests(allowedRows as IRuleBreachRequest[]),
            lastRowIndex: allowedRows.length,
        };
    }

    async searchRuleBreachAlerts(agGridRequest: IAgGridRequest, user: Express.User): Promise<IAgGridResult<IRuleBreachAlertPopulated>> {
        const updatedAgGridRequest = await this.agGridSearchRuleBreachesOfUser(agGridRequest, user);

        const result = await this.service.searchRuleBreachAlerts(updatedAgGridRequest);

        const allowedRows = await this.getAllowedRuleBreaches(result, user);

        return {
            rows: await this.populateRulesBreachAlerts(allowedRows as IRuleBreachAlert[]),
            lastRowIndex: allowedRows.length,
        };
    }

    async updateManyRuleBreachRequestsStatusesByRelatedEntityId(entityId: string, status: RuleBreachRequestStatus): Promise<IRuleBreachRequest[]> {
        return this.service.updateManyRuleBreachRequestsStatusesByRelatedEntityId(entityId, status);
    }

    async getRuleBreachRequestById(ruleBreachRequestId: string, user?: Express.User): Promise<IRuleBreachRequestPopulated> {
        const ruleBreachRequest = await this.service.getRuleBreachRequestById(ruleBreachRequestId);

        if (user && ruleBreachRequest.originUserId !== user.id) {
            const userPermissions = await this.authorizer.getWorkspacePermissions(user.id);
            if (!userPermissions.admin?.scope && userPermissions.rules?.scope !== PermissionScope.write)
                throw new ForbiddenError('user does not have permissions to this rule breach request');
        }

        return this.populateRuleBreachRequest(ruleBreachRequest);
    }

    async getRuleBreachAlertsById(ruleBreachAlertId: string, user?: Express.User): Promise<IRuleBreachAlertPopulated> {
        const ruleBreachAlert = await this.service.getRuleBreachAlertById(ruleBreachAlertId);

        if (user && ruleBreachAlert.originUserId !== user.id) {
            const userPermissions = await this.authorizer.getWorkspacePermissions(user.id);
            if (!userPermissions.admin?.scope && userPermissions.rules?.scope !== PermissionScope.write)
                throw new ForbiddenError('user does not have permissions to this rule breach alert');
        }

        return this.populateRuleBreachAlert(ruleBreachAlert);
    }

    private async agGridSearchRuleBreachesOfUser(agGridRequest: IAgGridRequest, user: Express.User): Promise<IAgGridRequest> {
        const userPermissions = await this.authorizer.getWorkspacePermissions(user.id);
        if (userPermissions.admin?.scope || userPermissions.rules?.scope === PermissionScope.write) return agGridRequest;

        const updatedAgGridRequest: IAgGridRequest = { ...agGridRequest };

        updatedAgGridRequest.filterModel.originUserId = {
            filterType: 'text',
            type: basicFilterOperationTypes.equals,
            filter: user.id,
        };

        return updatedAgGridRequest;
    }

    private populateEntityForBrokenRules(entityId: string, entitiesMap: Map<string, IEntity>): IEntityForBrokenRules {
        if (entityId.startsWith(ruleBreachService.brokenRulesFakeEntityIdPrefix)) {
            return entityId;
        }
        return entitiesMap.get(entityId) ?? null;
    }

    private populateRelationshipForBrokenRules(
        relationshipId: string,
        relationshipsMap: Map<string, IRelationship>,
        entitiesMap: Map<string, IEntity>,
    ): IRelationshipForBrokenRules {
        if (relationshipId.startsWith(ruleBreachService.brokenRulesFakeEntityIdPrefix)) {
            return relationshipId;
        }
        const relationship = relationshipsMap.get(relationshipId) ?? null;

        if (!relationship) return null;

        return {
            ...relationship,
            sourceEntity: entitiesMap.get(relationship.sourceEntityId)!,
            destinationEntity: entitiesMap.get(relationship.destinationEntityId)!,
        };
    }

    private populateBrokenRule(
        { ruleId, failures }: IBrokenRule,
        entitiesMap: Map<string, IEntity>,
        relationshipsMap: Map<string, IRelationship>,
    ): IBrokenRulePopulated {
        const failuresPopulated: IBrokenRulePopulated['failures'] = failures.map((failure) => {
            return {
                entity: this.populateEntityForBrokenRules(failure.entityId, entitiesMap),
                causes: failure.causes.map((cause): ICausesOfInstancePopulated => {
                    let aggregatedRelationship: ICauseInstancePopulated['aggregatedRelationship'];

                    if (cause.instance.aggregatedRelationship) {
                        const { relationshipId, otherEntityId } = cause.instance.aggregatedRelationship;
                        aggregatedRelationship = {
                            relationship: this.populateRelationshipForBrokenRules(relationshipId, relationshipsMap, entitiesMap),
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
        const entityIds = new Set<string>();
        const relationshipIds = new Set<string>();
        brokenRules.forEach(({ failures }) => {
            failures.forEach(({ entityId, causes }) => {
                entityIds.add(entityId);

                causes.forEach(({ instance }) => {
                    entityIds.add(instance.entityId);

                    if (instance.aggregatedRelationship) {
                        entityIds.add(instance.aggregatedRelationship.otherEntityId);
                        relationshipIds.add(instance.aggregatedRelationship.relationshipId);
                    }
                });
            });
        });

        relationshipIds.forEach((str) => {
            if (str.startsWith(ruleBreachService.brokenRulesFakeEntityIdPrefix)) {
                relationshipIds.delete(str);
            }
        });

        const relationships = await this.instancesService.getRelationshipsByIds(Array.from(relationshipIds));

        relationships.forEach((relationship) => {
            entityIds.add(relationship.sourceEntityId);
            entityIds.add(relationship.destinationEntityId);
        });

        // no point to do getInstanceById to unexisting entity
        entityIds.forEach((str) => {
            if (str.startsWith(ruleBreachService.brokenRulesFakeEntityIdPrefix)) {
                entityIds.delete(str);
            }
        });

        const entities = await this.instancesService.getEntityInstancesByIds(Array.from(entityIds));

        const entitiesMap = new Map(entities.map((entity) => [entity.properties._id, entity]));
        const relationshipsMap = new Map(relationships.map((relationship) => [relationship.properties._id, relationship]));

        return brokenRules.map((brokenRule) => this.populateBrokenRule(brokenRule, entitiesMap, relationshipsMap));
    }

    private async populateSourceAndDestinationEntities(sourceEntityId: string, destinationEntityId: string) {
        const [sourceEntity, destinationEntity] = await Promise.all([
            sourceEntityId.startsWith(ruleBreachService.brokenRulesFakeEntityIdPrefix)
                ? sourceEntityId
                : this.instancesService.getEntityInstanceById(sourceEntityId).catch(() => null),
            destinationEntityId.startsWith(ruleBreachService.brokenRulesFakeEntityIdPrefix)
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
        const { templateId, properties } = actionMetadata;

        const entityTemplate = await this.entityTemplateService.getEntityTemplateById(templateId);
        const createdEntityWithPopulatedRelationshipReferences = await this.getPopulatedRelationshipReferences(entityTemplate, properties);

        await this.instancesService.getEntityInstanceById(properties._id).catch(() => {
            createdEntityWithPopulatedRelationshipReferences._id = null;
        });

        return { ...actionMetadata, properties: createdEntityWithPopulatedRelationshipReferences };
    }

    public async populateDuplicateEntityActionMetadata(actionMetadata: IDuplicateEntityMetadata): Promise<IDuplicateEntityMetadataPopulated> {
        const { entityIdToDuplicate, templateId, properties } = actionMetadata;

        const entityToDuplicate = entityIdToDuplicate.startsWith(ruleBreachService.brokenRulesFakeEntityIdPrefix)
            ? entityIdToDuplicate
            : await this.instancesService.getEntityInstanceById(entityIdToDuplicate).catch(() => null);

        const entityTemplate = await this.entityTemplateService.getEntityTemplateById(templateId);
        const duplicatedEntityWithPopulatedRelationshipReferences = await this.getPopulatedRelationshipReferences(entityTemplate, properties);

        return {
            entityToDuplicate,
            properties: duplicatedEntityWithPopulatedRelationshipReferences,
            templateId,
        };
    }

    public async getPopulatedRelationshipReferences(entityTemplate: IMongoEntityTemplatePopulated, properties: Record<string, any>) {
        const populatedProperties = JSON.parse(JSON.stringify(properties));

        await Promise.all(
            Object.entries(entityTemplate.properties.properties).map(async ([name, value]) => {
                const propertyValue = properties[name];

                if (value.format === 'relationshipReference' && propertyValue && typeof propertyValue === 'string') {
                    populatedProperties[name] = await this.instancesService.getEntityInstanceById(propertyValue).catch(() => null);
                }
            }),
        );

        return populatedProperties;
    }

    public async populateUpdateEntityActionMetadata(
        actionMetadata: IUpdateEntityMetadata,
        actions: IAction[],
    ): Promise<IUpdateEntityMetadataPopulated> {
        const { entityId, ...restOfMetadata } = actionMetadata;

        let entity: IEntity | null;

        if (entityId.startsWith(ruleBreachService.brokenRulesFakeEntityIdPrefix)) {
            const numberPart = parseInt(entityId.slice(1, -4), 10);
            entity = actions[numberPart].actionMetadata as IEntity;
            entity.properties._id = entityId;
        } else entity = await this.instancesService.getEntityInstanceById(entityId).catch(() => null);

        if (entity) {
            const { templateId, properties } = entity;
            const entityTemplate = await this.entityTemplateService.getEntityTemplateById(templateId);

            const [currentEntityWithReferences, updatedEntityWithReferences, beforeEntityWithReferences] = await Promise.all([
                this.getPopulatedRelationshipReferences(entityTemplate, properties),
                this.getPopulatedRelationshipReferences(entityTemplate, actionMetadata.updatedFields),
                restOfMetadata.before ? this.getPopulatedRelationshipReferences(entityTemplate, restOfMetadata.before) : Promise.resolve(undefined), // For before if it exists
            ]);

            return {
                updatedFields: updatedEntityWithReferences,
                entity: { templateId, properties: currentEntityWithReferences },
                ...(restOfMetadata.before && { before: beforeEntityWithReferences }),
            };
        }

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

    public populateActionsMetaData = async (actions: IAction[]): Promise<{ actionType: ActionTypes; actionMetadata: IActionMetadataPopulated }[]> => {
        const populatedActionsMetadataPromises: Promise<IActionMetadataPopulated>[] = [];

        if (actions) {
            actions.forEach((action) => {
                if (action.actionType === ActionTypes.CreateRelationship)
                    populatedActionsMetadataPromises.push(
                        this.populateCreateRelationshipActionMetadata(action.actionMetadata as ICreateRelationshipMetadata),
                    );
                else if (action.actionType === ActionTypes.DeleteRelationship)
                    populatedActionsMetadataPromises.push(
                        this.populateDeleteRelationshipActionMetadata(action.actionMetadata as IDeleteRelationshipMetadata),
                    );
                else if (action.actionType === ActionTypes.UpdateEntity) {
                    populatedActionsMetadataPromises.push(
                        this.populateUpdateEntityActionMetadata(action.actionMetadata as IUpdateEntityMetadata, actions),
                    );
                } else if (action.actionType === ActionTypes.UpdateStatus)
                    populatedActionsMetadataPromises.push(
                        this.populateUpdateEntityStatusActionMetadata(action.actionMetadata as IUpdateEntityStatusMetadata),
                    );
                else if (action.actionType === ActionTypes.CreateEntity)
                    populatedActionsMetadataPromises.push(this.populateCreateEntityActionMetadata(action.actionMetadata as ICreateEntityMetadata));
                else if (action.actionType === ActionTypes.DuplicateEntity)
                    populatedActionsMetadataPromises.push(
                        this.populateDuplicateEntityActionMetadata(action.actionMetadata as IDuplicateEntityMetadata),
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

    public async populateRuleBreach(ruleBreach: IRuleBreach): Promise<IRuleBreachPopulated> {
        const { originUserId, actions, brokenRules, ...restOfRuleBreach } = ruleBreach;

        const [populatedBrokenRules, originUser] = await Promise.all([this.populateBrokenRules(brokenRules), UsersManager.getUserById(originUserId)]);

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
        return Promise.all(ruleBreachRequests.map((request) => this.populateRuleBreachRequest(request)));
    }

    public async populateRulesBreachAlerts(ruleBreachAlerts: IRuleBreachAlert[]): Promise<IRuleBreachAlertPopulated[]> {
        return Promise.all(ruleBreachAlerts.map((alert) => this.populateRuleBreachAlert(alert)));
    }
}

export default RuleBreachesManager;
