/* eslint-disable no-plusplus */
import pickBy from 'lodash.pickby';
import { EntityTemplateService } from '../../externalServices/entityTemplateService';
import { IEntity } from '../../externalServices/instanceService/interfaces/entities';
import { IConnection } from '../../externalServices/instanceService/interfaces/rules';
import { InstancesService } from '../../externalServices/instanceService';
import { StorageService } from '../../externalServices/storageService';
import { filteredMap, trycatch } from '../../utils';
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
} from '../../externalServices/ruleBreachService/interfaces/populated';
import {
    IBrokenRule,
    ICreateRelationshipMetadata,
    IDeleteRelationshipMetadata,
    IRuleBreach,
    IRuleBreachAlert,
    IRuleBreachRequest,
    isCreateRelationshipRuleBreach,
    isDeleteRelationshipRuleBreach,
    isUpdateEntityRuleBreach,
    isUpdateEntityStatusRuleBreach,
    IUpdateEntityMetadata,
    IUpdateEntityStatusMetadata,
    RuleBreachRequestStatus,
} from '../../externalServices/ruleBreachService/interfaces';
import { RuleBreachService } from '../../externalServices/ruleBreachService';
import { UsersManager } from '../users/manager';
import { IAgGridRequest, IAgGridResult } from '../../utils/agGrid/interface';
import { RabbitManager } from '../../utils/rabbit';
import {
    INotificationMetadataPopulated,
    IRuleBreachAlertNotificationMetadataPopulated,
    IRuleBreachRequestNotificationMetadataPopulated,
    IRuleBreachResponseNotificationMetadataPopulated,
} from '../../externalServices/notificationService/interfaces/populated';
import DefaultManagerProxy from '../../utils/express/manager';
import { UserService } from '../../externalServices/userService';
import { PermissionScope } from '../../externalServices/userService/interfaces/permissions';

const { errorCodes } = config;

export class RuleBreachesManager extends DefaultManagerProxy<RuleBreachService> {
    private storageService: StorageService;

    private entityTemplateService: EntityTemplateService;

    private instancesService: InstancesService;

    private instancesManager: InstancesManager;

    private rabbitManager: RabbitManager;

    constructor(private workspaceId: string) {
        super(new RuleBreachService(workspaceId));
        this.storageService = new StorageService(workspaceId);
        this.entityTemplateService = new EntityTemplateService(workspaceId);
        this.instancesService = new InstancesService(workspaceId);
        this.instancesManager = new InstancesManager(workspaceId);

        this.rabbitManager = new RabbitManager(workspaceId);
    }

    async createRuleBreachRequest<T>(
        ruleBreachRequestData: Omit<IRuleBreachRequest<T>, '_id' | 'createdAt' | 'originUserId'>,
        userId: string,
        files: Express.Multer.File[] = [],
    ): Promise<IRuleBreachRequestPopulated<IActionMetadataPopulated>> {
        await this.uploadRuleBreachFiles(ruleBreachRequestData as unknown as Partial<IRuleBreach>, files);

        const { result, err } = await trycatch(async () => {
            const ruleBreachRequest = await this.service.createRuleBreachRequest<T>({
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
            await this.deleteRuleBreachFiles(ruleBreachRequestData as unknown as Partial<IRuleBreach>);
            throw err;
        }

        return result;
    }

    async createRuleBreachAlert<T>(
        ruleBreachAlertData: Omit<IRuleBreachAlert<T>, '_id' | 'createdAt' | 'originUserId'>,
        userId: string,
        files: Express.Multer.File[] = [],
    ): Promise<IRuleBreachAlertPopulated<IActionMetadataPopulated>> {
        await this.uploadRuleBreachFiles(ruleBreachAlertData as unknown as Partial<IRuleBreach>, files);

        const { result, err } = await trycatch(async () => {
            const rulesBreachAlert = await this.service.createRuleBreachAlert<T>({ ...ruleBreachAlertData, originUserId: userId });
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
            await this.deleteRuleBreachFiles(ruleBreachAlertData as unknown as Partial<IRuleBreach>);
            throw err;
        }

        return result;
    }

    static checkIfRuleBreachRequestIsReviewable(ruleBreachRequest: IRuleBreachRequest) {
        if (ruleBreachRequest.status !== RuleBreachRequestStatus.Pending) {
            throw new ServiceError(400, 'rule breach requests was already reviewed');
        }
    }

    async approveRuleBreachRequest(ruleBreachRequestId: string, user: Express.User): Promise<IRuleBreachRequestPopulated> {
        const ruleBreachRequest = await this.service.getRuleBreachRequestById(ruleBreachRequestId);
        RuleBreachesManager.checkIfRuleBreachRequestIsReviewable(ruleBreachRequest);

        try {
            if (isCreateRelationshipRuleBreach(ruleBreachRequest)) await this.createRelationship(ruleBreachRequest);
            else if (isDeleteRelationshipRuleBreach(ruleBreachRequest)) await this.deleteRelationship(ruleBreachRequest);
            else if (isUpdateEntityRuleBreach(ruleBreachRequest)) await this.updateEntity(ruleBreachRequest);
            else if (isUpdateEntityStatusRuleBreach(ruleBreachRequest)) await this.updateEntityStatus(ruleBreachRequest);
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

        return ruleBreachRequestPopulated;
    }

    private async sendNotification<
        NotificationMetadata extends INotificationMetadata,
        NotificationMetadataPopulated extends INotificationMetadataPopulated,
    >(type: NotificationType, metadata: NotificationMetadata, populatedMetaData: NotificationMetadataPopulated, extraViewers: string[] = []) {
        const rulesPermissions = await getPermissions({ resourceType: 'Rules' });
        const viewers = new Set<string>();

        rulesPermissions.forEach((rulesPermission) => viewers.add(rulesPermission.userId));
        extraViewers.forEach((extraViewer) => viewers.add(extraViewer));

        await this.rabbitManager.createNotification(Array.from(viewers), type, metadata, populatedMetaData);
    }

    private async createRelationship(ruleBreachRequest: IRuleBreachRequest<ICreateRelationshipMetadata>) {
        const { relationshipTemplateId, sourceEntityId, destinationEntityId } = ruleBreachRequest.actionMetadata;

        await this.instancesManager.createRelationshipInstance(
            { templateId: relationshipTemplateId, sourceEntityId, destinationEntityId, properties: {} as any },
            ruleBreachRequest.brokenRules,
            ruleBreachRequest.originUserId,
            false,
        );
    }

    private async deleteRelationship(ruleBreachRequest: IRuleBreachRequest<IDeleteRelationshipMetadata>) {
        await this.instancesManager.deleteRelationshipInstance(
            ruleBreachRequest.actionMetadata.relationshipId,
            ruleBreachRequest.brokenRules,
            ruleBreachRequest.originUserId,
            false,
        );
    }

    private async updateEntityStatus(ruleBreachRequest: IRuleBreachRequest<IUpdateEntityStatusMetadata>) {
        await this.instancesManager.updateEntityStatus(
            ruleBreachRequest.actionMetadata.entityId,
            ruleBreachRequest.actionMetadata.disabled,
            ruleBreachRequest.brokenRules,
            ruleBreachRequest.originUserId,
            false,
        );
    }

    private async updateEntity(ruleBreachRequest: IRuleBreachRequest<IUpdateEntityMetadata>) {
        const { entityId, updatedFields } = ruleBreachRequest.actionMetadata;

        const entity = await this.instancesService.getEntityInstanceById(entityId);
        const newEntityProperties = { ...entity.properties, ...updatedFields };

        // updatedFields specifies fields to remove w/ nulls. but shouldn't be in the IEntity properties
        const newEntityPropertiesWithoutNulls = pickBy(newEntityProperties, (property) => property !== null) as IEntity['properties'];

        await this.instancesManager.updateEntityInstance(
            entityId,
            { ...entity, properties: newEntityPropertiesWithoutNulls },
            [],
            ruleBreachRequest.brokenRules,
            ruleBreachRequest.originUserId,
            false,
        );

        await this.service.updateRuleBreachRequestActionMetadata(ruleBreachRequest._id, ruleBreachRequest.actionType, {
            ...ruleBreachRequest.actionMetadata,
            before: entity,
        });
    }

    async discardRuleBreachRequest(
        ruleBreachRequest: IRuleBreachRequest,
        user: Express.User,
        type: RuleBreachRequestStatus,
    ): Promise<IRuleBreachRequestPopulated> {
        RuleBreachesManager.checkIfRuleBreachRequestIsReviewable(ruleBreachRequest);

        this.deleteRuleBreachFiles(ruleBreachRequest);

        const [updatedRuleBreachRequest, { actionMetadata: updatedMetadata }] = await Promise.all([
            this.service.updateRuleBreachRequestStatus(ruleBreachRequest._id, user.id, type),

            isUpdateEntityRuleBreach(ruleBreachRequest)
                ? this.instancesService.getEntityInstanceById(ruleBreachRequest.actionMetadata.entityId).then((entity) =>
                      this.service.updateRuleBreachRequestActionMetadata(ruleBreachRequest._id, ruleBreachRequest.actionType, {
                          ...ruleBreachRequest.actionMetadata,
                          before: entity,
                      }),
                  )
                : { actionMetadata: ruleBreachRequest.actionMetadata },
        ]);
        const ruleBreachRequestPopulated = await this.populateRuleBreachRequest({
            ...updatedRuleBreachRequest,
            actionMetadata: updatedMetadata,
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

    private async uploadRuleBreachFiles(ruleBreach: Partial<IRuleBreach>, files: Express.Multer.File[]) {
        if (!isUpdateEntityRuleBreach(ruleBreach) || !files.length) return;

        const { props: uploadedFilesProperties } = await this.instancesManager.uploadInstanceFiles(files, ruleBreach.actionMetadata.updatedFields);

        // eslint-disable-next-line no-param-reassign
        ruleBreach.actionMetadata.updatedFields = {
            ...ruleBreach.actionMetadata.updatedFields,
            ...uploadedFilesProperties,
        };
    }

    private async deleteRuleBreachFiles(ruleBreach: Partial<IRuleBreach>) {
        if (!isUpdateEntityRuleBreach(ruleBreach)) return;

        const entity = await this.instancesService.getEntityInstanceById(ruleBreach.actionMetadata.entityId);
        const entityTemplate = await this.entityTemplateService.getEntityTemplateById(entity.templateId);

        const filePropertiesKeys = InstancesManager.getFilePropertiesKeysByTemplate(entityTemplate);

        const filesToDelete = filteredMap(Object.entries(ruleBreach.actionMetadata.updatedFields), ([key, id]) => ({
            include: filePropertiesKeys.includes(key),
            value: id,
        }));

        await this.storageService.deleteFiles(filesToDelete);
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

    private async populateBrokenRule(brokenRule: IBrokenRule): Promise<IBrokenRulePopulated> {
        const includesCreatedRelationshipId = brokenRule.relationshipIds.includes('created-relationship-id');

        const relationshipConnections: IConnection[] = await this.instancesService.getRelationshipsConnectionsByIds(brokenRule.relationshipIds);

        const relationships: IBrokenRulePopulated['relationships'] = relationshipConnections.map(
            ({ sourceEntity, destinationEntity, relationship: { sourceEntityId, destinationEntityId, ...restOfRelationship } }) => ({
                ...restOfRelationship,
                sourceEntity,
                destinationEntity,
            }),
        );

        const unknownRelationshipIdsCount = brokenRule.relationshipIds.length - relationships.length - (includesCreatedRelationshipId ? 1 : 0);

        for (let i = 0; i < unknownRelationshipIdsCount; i++) relationships.push(null);
        if (includesCreatedRelationshipId) relationships.push('created-relationship-id');

        return {
            ruleId: brokenRule.ruleId,
            relationships,
        };
    }

    public async populateBrokenRules(brokenRules: IBrokenRule[]): Promise<IBrokenRulePopulated[]> {
        return Promise.all(brokenRules.map(this.populateBrokenRule));
    }

    private async populateSourceAndDestinationEntities(sourceEntityId: string, destinationEntityId: string) {
        const [sourceEntity, destinationEntity] = await Promise.all([
            this.instancesService.getEntityInstanceById(sourceEntityId).catch(() => null),
            this.instancesService.getEntityInstanceById(destinationEntityId).catch(() => null),
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
        const { originUserId, brokenRules, ...restOfRuleBreach } = ruleBreach;

        let populatedActionMetadataPromise: Promise<IActionMetadataPopulated>;

        if (isCreateRelationshipRuleBreach(ruleBreach))
            populatedActionMetadataPromise = this.populateCreateRelationshipActionMetadata(ruleBreach.actionMetadata);
        else if (isDeleteRelationshipRuleBreach(ruleBreach))
            populatedActionMetadataPromise = this.populateDeleteRelationshipActionMetadata(ruleBreach.actionMetadata);
        else if (isUpdateEntityRuleBreach(ruleBreach))
            populatedActionMetadataPromise = this.populateUpdateEntityActionMetadata(ruleBreach.actionMetadata);
        else if (isUpdateEntityStatusRuleBreach(ruleBreach))
            populatedActionMetadataPromise = this.populateUpdateEntityStatusActionMetadata(ruleBreach.actionMetadata);

        const [populatedBrokenRules, originUser, actionMetadata] = await Promise.all([
            this.populateBrokenRules(brokenRules),
            UsersManager.getUserById(originUserId),
            populatedActionMetadataPromise!,
        ]);

        return {
            ...restOfRuleBreach,
            originUser,
            actionMetadata,
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
