/* eslint-disable no-plusplus */
import pickBy from 'lodash.pickby';
import { EntityTemplateManagerService } from '../../externalServices/entityTemplateManager';
import { InstanceManagerService, IRelationshipConnections } from '../../externalServices/instanceManager';
import { getPermissions, isRuleManager } from '../../externalServices/permissionsApi';
import { deleteFiles } from '../../externalServices/storageService';
import { filteredMap, trycatch } from '../../utils';
import { ShragaUser } from '../../utils/express/passport';
import { ServiceError } from '../error';
import { InstancesManager } from '../instances/manager';

import {
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
import UsersManager from '../users/manager';
import { IAgGridRequest, IAgGridResult } from '../../utils/agGrid/interface';
import { NotificationService } from '../../externalServices/notificationService';

const { errorCodes } = config;

export class RuleBreachesManager {
    static async createRuleBreachRequest<T>(
        ruleBreachRequestData: Omit<IRuleBreachRequest<T>, '_id' | 'createdAt' | 'originUserId'>,
        userId: string,
        files: Express.Multer.File[] = [],
    ): Promise<IRuleBreachRequest<T>> {
        await RuleBreachesManager.uploadRuleBreachFiles(ruleBreachRequestData as unknown as Partial<IRuleBreach>, files);

        const { result, err } = await trycatch(async () => {
            const ruleBreachRequest = await RuleBreachService.createRuleBreachRequest<T>({ ...ruleBreachRequestData, originUserId: userId });
            await RuleBreachesManager.sendNotification<IRuleBreachRequestNotificationMetadata>(
                NotificationType.ruleBreachRequest,
                { requestId: ruleBreachRequest._id },
                [userId],
            );

            return ruleBreachRequest;
        });

        if (err || !result) {
            await RuleBreachesManager.deleteRuleBreachFiles(ruleBreachRequestData as unknown as Partial<IRuleBreach>);
            throw err;
        }

        return result;
    }

    static async createRuleBreachAlert<T>(
        ruleBreachAlertData: Omit<IRuleBreachAlert<T>, '_id' | 'createdAt' | 'originUserId'>,
        userId: string,
        files: Express.Multer.File[] = [],
    ): Promise<IRuleBreachAlert<T>> {
        await RuleBreachesManager.uploadRuleBreachFiles(ruleBreachAlertData as unknown as Partial<IRuleBreach>, files);

        const { result, err } = await trycatch(async () => {
            const rulesBreachAlert = await RuleBreachService.createRuleBreachAlert<T>({ ...ruleBreachAlertData, originUserId: userId });
            await RuleBreachesManager.sendNotification<IRuleBreachAlertNotificationMetadata>(
                NotificationType.ruleBreachAlert,
                { alertId: rulesBreachAlert._id },
                [userId],
            );

            return rulesBreachAlert;
        });

        if (err || !result) {
            await RuleBreachesManager.deleteRuleBreachFiles(ruleBreachAlertData as unknown as Partial<IRuleBreach>);
            throw err;
        }

        return result;
    }

    static checkIfRuleBreachRequestIsReviewable(ruleBreachRequest: IRuleBreachRequest) {
        if (ruleBreachRequest.status !== RuleBreachRequestStatus.Pending) {
            throw new ServiceError(400, 'rule breach requests was already reviewed');
        }
    }

    static async approveRuleBreachRequest(ruleBreachRequestId: string, user: ShragaUser): Promise<IRuleBreachRequestPopulated> {
        const ruleBreachRequest = await RuleBreachService.getRuleBreachRequestById(ruleBreachRequestId);

        RuleBreachesManager.checkIfRuleBreachRequestIsReviewable(ruleBreachRequest);

        try {
            if (isCreateRelationshipRuleBreach(ruleBreachRequest)) await RuleBreachesManager.createRelationship(ruleBreachRequest);
            else if (isDeleteRelationshipRuleBreach(ruleBreachRequest)) await RuleBreachesManager.deleteRelationship(ruleBreachRequest);
            else if (isUpdateEntityRuleBreach(ruleBreachRequest)) await RuleBreachesManager.updateEntity(ruleBreachRequest);
            else if (isUpdateEntityStatusRuleBreach(ruleBreachRequest)) await RuleBreachesManager.updateEntityStatus(ruleBreachRequest);
        } catch (error: any) {
            if (error.metadata.errorCode === errorCodes.ruleBlock) {
                await RuleBreachService.updateRuleBreachRequestBrokenRules(ruleBreachRequestId, error.metadata.rawBrokenRules);
            }

            throw error;
        }

        const updatedRuleBreachRequest = await RuleBreachService.updateRuleBreachRequestStatus(
            ruleBreachRequestId,
            user.id,
            RuleBreachRequestStatus.Approved,
        );
        await RuleBreachesManager.sendNotification<IRuleBreachResponseNotificationMetadata>(
            NotificationType.ruleBreachResponse,
            {
                requestId: ruleBreachRequest._id,
            },
            [ruleBreachRequest.originUserId],
        );

        return RuleBreachesManager.populateRuleBreachRequest(updatedRuleBreachRequest);
    }

    private static async sendNotification<T>(type: NotificationType, metadata: T, extraViewers: string[] = []) {
        const rulesPermissions = await getPermissions({ resourceType: 'Rules' });
        const viewers = new Set<string>();

        rulesPermissions.forEach((rulesPermission) => viewers.add(rulesPermission.userId));
        extraViewers.forEach((extraViewer) => viewers.add(extraViewer));

        return NotificationService.rabbitCreateNotification<T>(Array.from(viewers), type, metadata);
    }

    private static async createRelationship(ruleBreachRequest: IRuleBreachRequest<ICreateRelationshipMetadata>) {
        const { relationshipTemplateId, sourceEntityId, destinationEntityId } = ruleBreachRequest.actionMetadata;

        await InstancesManager.createRelationshipInstance(
            { templateId: relationshipTemplateId, sourceEntityId, destinationEntityId, properties: {} as any },
            ruleBreachRequest.brokenRules,
            ruleBreachRequest.originUserId,
            false,
        );
    }

    private static async deleteRelationship(ruleBreachRequest: IRuleBreachRequest<IDeleteRelationshipMetadata>) {
        await InstancesManager.deleteRelationshipInstance(
            ruleBreachRequest.actionMetadata.relationshipId,
            ruleBreachRequest.brokenRules,
            ruleBreachRequest.originUserId,
            false,
        );
    }

    private static async updateEntityStatus(ruleBreachRequest: IRuleBreachRequest<IUpdateEntityStatusMetadata>) {
        await InstancesManager.updateEntityStatus(
            ruleBreachRequest.actionMetadata.entityId,
            ruleBreachRequest.actionMetadata.disabled,
            ruleBreachRequest.brokenRules,
            ruleBreachRequest.originUserId,
            false,
        );
    }

    private static async updateEntity(ruleBreachRequest: IRuleBreachRequest<IUpdateEntityMetadata>) {
        const { entityId, updatedFields } = ruleBreachRequest.actionMetadata;

        const entity = await InstanceManagerService.getEntityInstanceById(entityId);
        const newEntityProperties = { ...entity.properties, ...updatedFields };

        // updatedFields specifies fields to remove w/ nulls. but shouldn't be in the IEntity properties
        const newEntityPropertiesWithoutNulls = pickBy(newEntityProperties, (property) => property !== null);

        await InstancesManager.updateEntityInstance(
            entityId,
            { ...entity, properties: newEntityPropertiesWithoutNulls },
            [],
            ruleBreachRequest.brokenRules,
            ruleBreachRequest.originUserId,
            false,
        );

        await RuleBreachService.updateRuleBreachRequestActionMetadata(ruleBreachRequest._id, ruleBreachRequest.actionType, {
            ...ruleBreachRequest.actionMetadata,
            before: entity,
        });
    }

    static async discardRuleBreachRequest(
        ruleBreachRequest: IRuleBreachRequest,
        user: ShragaUser,
        type: RuleBreachRequestStatus,
    ): Promise<IRuleBreachRequestPopulated> {
        RuleBreachesManager.checkIfRuleBreachRequestIsReviewable(ruleBreachRequest);
        RuleBreachesManager.deleteRuleBreachFiles(ruleBreachRequest);

        const [updatedRuleBreachRequest, { actionMetadata: updatedMetadata }] = await Promise.all([
            RuleBreachService.updateRuleBreachRequestStatus(ruleBreachRequest._id, user.id, type),

            isUpdateEntityRuleBreach(ruleBreachRequest)
                ? InstanceManagerService.getEntityInstanceById(ruleBreachRequest.actionMetadata.entityId).then((entity) =>
                      RuleBreachService.updateRuleBreachRequestActionMetadata(ruleBreachRequest._id, ruleBreachRequest.actionType, {
                          ...ruleBreachRequest.actionMetadata,
                          before: entity,
                      }),
                  )
                : { actionMetadata: ruleBreachRequest.actionMetadata },
        ]);

        await RuleBreachesManager.sendNotification<IRuleBreachResponseNotificationMetadata>(
            NotificationType.ruleBreachResponse,
            {
                requestId: ruleBreachRequest._id,
            },
            [ruleBreachRequest.originUserId],
        );

        return RuleBreachesManager.populateRuleBreachRequest({ ...updatedRuleBreachRequest, actionMetadata: updatedMetadata });
    }

    static async denyRuleBreachRequest(ruleBreachRequestId: string, user: ShragaUser): Promise<IRuleBreachRequestPopulated> {
        const ruleBreachRequest = await RuleBreachService.getRuleBreachRequestById(ruleBreachRequestId);
        return RuleBreachesManager.discardRuleBreachRequest(ruleBreachRequest, user, RuleBreachRequestStatus.Denied);
    }

    static async cancelRuleBreachRequest(ruleBreachRequestId: string, user: ShragaUser): Promise<IRuleBreachRequestPopulated> {
        const ruleBreachRequest = await RuleBreachService.getRuleBreachRequestById(ruleBreachRequestId);

        if (ruleBreachRequest.originUserId !== user.id) {
            throw new ServiceError(403, 'only the origin user can cancel rule breach request');
        }

        return RuleBreachesManager.discardRuleBreachRequest(ruleBreachRequest, user, RuleBreachRequestStatus.Canceled);
    }

    private static async uploadRuleBreachFiles(ruleBreach: Partial<IRuleBreach>, files: Express.Multer.File[]) {
        if (!isUpdateEntityRuleBreach(ruleBreach) || !files.length) return;

        const uploadedFilesProperties = await InstancesManager.uploadInstanceFiles(files);

        // eslint-disable-next-line no-param-reassign
        ruleBreach.actionMetadata.updatedFields = {
            ...ruleBreach.actionMetadata.updatedFields,
            ...uploadedFilesProperties,
        };
    }

    private static async deleteRuleBreachFiles(ruleBreach: Partial<IRuleBreach>) {
        if (!isUpdateEntityRuleBreach(ruleBreach)) return;

        const entity = await InstanceManagerService.getEntityInstanceById(ruleBreach.actionMetadata.entityId);
        const entityTemplate = await EntityTemplateManagerService.getEntityTemplateById(entity.templateId);

        const filePropertiesKeys = InstancesManager.getFilePropertiesKeysByTemplate(entityTemplate);

        const filesToDelete = filteredMap(Object.entries(ruleBreach.actionMetadata.updatedFields), ([key, id]) => ({
            include: filePropertiesKeys.includes(key),
            value: id,
        }));

        await deleteFiles(filesToDelete);
    }

    static async searchRuleBreachRequests(agGridRequest: IAgGridRequest, user: ShragaUser): Promise<IAgGridResult<IRuleBreachRequestPopulated>> {
        const updatedAgGridRequest = await RuleBreachesManager.agGridSearchRuleBreachesOfUser(agGridRequest, user);

        const result = await RuleBreachService.searchRuleBreachRequests(updatedAgGridRequest);

        return {
            ...result,
            rows: await RuleBreachesManager.populateRulesBreachRequests(result.rows),
        };
    }

    static async searchRuleBreachAlerts(agGridRequest: IAgGridRequest, user: ShragaUser): Promise<IAgGridResult<IRuleBreachAlertPopulated>> {
        const updatedAgGridRequest = await RuleBreachesManager.agGridSearchRuleBreachesOfUser(agGridRequest, user);

        const result = await RuleBreachService.searchRuleBreachAlerts(updatedAgGridRequest);

        return {
            ...result,
            rows: await RuleBreachesManager.populateRulesBreachAlerts(result.rows),
        };
    }

    static async getRuleBreachRequestById(ruleBreachRequestId: string, user?: ShragaUser): Promise<IRuleBreachRequestPopulated> {
        const ruleBreachRequest = await RuleBreachService.getRuleBreachRequestById(ruleBreachRequestId);

        if (user && ruleBreachRequest.originUserId !== user.id && !(await isRuleManager(user.id))) {
            throw new ServiceError(403, 'user does not have permissions to this rule breach request');
        }

        return RuleBreachesManager.populateRuleBreachRequest(ruleBreachRequest);
    }

    static async getRuleBreachAlertsById(ruleBreachAlertId: string, user?: ShragaUser): Promise<IRuleBreachAlertPopulated> {
        const ruleBreachAlert = await RuleBreachService.getRuleBreachAlertById(ruleBreachAlertId);

        if (user && ruleBreachAlert.originUserId !== user.id && !(await isRuleManager(user.id))) {
            throw new ServiceError(403, 'user does not have permissions to this rule breach alert');
        }

        return RuleBreachesManager.populateRuleBreachAlert(ruleBreachAlert);
    }

    private static async agGridSearchRuleBreachesOfUser(agGridRequest: IAgGridRequest, user: ShragaUser): Promise<IAgGridRequest> {
        if (await isRuleManager(user.id)) return agGridRequest;

        const updatedAgGridRequest: IAgGridRequest = { ...agGridRequest };

        updatedAgGridRequest.filterModel.originUserId = {
            filterType: 'text',
            type: 'equals',
            filter: user.id,
        };

        return updatedAgGridRequest;
    }

    private static async populateBrokenRule(brokenRule: IBrokenRule): Promise<IBrokenRulePopulated> {
        const includesCreatedRelationshipId = brokenRule.relationshipIds.includes('created-relationship-id');

        const relationshipConnections: IRelationshipConnections[] = await InstanceManagerService.getRelationshipsConnectionsByIds(
            brokenRule.relationshipIds,
        );

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

    public static async populateBrokenRules(brokenRules: IBrokenRule[]): Promise<IBrokenRulePopulated[]> {
        return Promise.all(brokenRules.map(RuleBreachesManager.populateBrokenRule));
    }

    private static async populateSourceAndDestinationEntities(sourceEntityId: string, destinationEntityId: string) {
        const [sourceEntity, destinationEntity] = await Promise.all([
            InstanceManagerService.getEntityInstanceById(sourceEntityId).catch(() => null),
            InstanceManagerService.getEntityInstanceById(destinationEntityId).catch(() => null),
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

    public static async populateUpdateEntityActionMetadata(actionMetadata: IUpdateEntityMetadata): Promise<IUpdateEntityMetadataPopulated> {
        const { entityId, ...restOfMetadata } = actionMetadata;

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

    public static async populateRuleBreach(ruleBreach: IRuleBreach): Promise<IRuleBreachPopulated> {
        const { originUserId, brokenRules, ...restOfRuleBreach } = ruleBreach;

        let populatedActionMetadataPromise: Promise<IActionMetadataPopulated>;

        if (isCreateRelationshipRuleBreach(ruleBreach))
            populatedActionMetadataPromise = RuleBreachesManager.populateCreateRelationshipActionMetadata(ruleBreach.actionMetadata);
        else if (isDeleteRelationshipRuleBreach(ruleBreach))
            populatedActionMetadataPromise = RuleBreachesManager.populateDeleteRelationshipActionMetadata(ruleBreach.actionMetadata);
        else if (isUpdateEntityRuleBreach(ruleBreach))
            populatedActionMetadataPromise = RuleBreachesManager.populateUpdateEntityActionMetadata(ruleBreach.actionMetadata);
        else if (isUpdateEntityStatusRuleBreach(ruleBreach))
            populatedActionMetadataPromise = RuleBreachesManager.populateUpdateEntityStatusActionMetadata(ruleBreach.actionMetadata);

        const [populatedBrokenRules, originUser, actionMetadata] = await Promise.all([
            RuleBreachesManager.populateBrokenRules(brokenRules),
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
