/* eslint-disable no-plusplus */
import pickBy from 'lodash.pickby';
import { EntityTemplateManagerService } from '../../externalServices/entityTemplateService';
import { IEntity } from '../../externalServices/instanceService/interfaces/entities';
import { IConnection } from '../../externalServices/instanceService/interfaces/rules';
import { InstanceManagerService } from '../../externalServices/instanceService';
import { getPermissions, isRuleManager } from '../../externalServices/permissionsService';
import { deleteFiles } from '../../externalServices/storageService';
import { filteredMap, trycatch } from '../../utils';
import { ServiceError } from '../error';
import { InstancesManager } from '../instances/manager';

import {
    INotificationMetadata,
    IRuleBreachAlertNotificationMetadata,
    // IRuleBreachRequestNotificationMetadata,
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
    ActionTypes,
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
import { rabbitCreateNotification } from '../../utils/notifications/createNotification';
import {
    INotificationMetadataPopulated,
    IRuleBreachAlertNotificationMetadataPopulated,
    // IRuleBreachRequestNotificationMetadataPopulated,
    IRuleBreachResponseNotificationMetadataPopulated,
} from '../../externalServices/notificationService/interfaces/populated';

const { errorCodes } = config;

export class RuleBreachesManager {
    static async createRuleBreachRequest<T>(
        ruleBreachRequestData: Omit<IRuleBreachRequest<T>, '_id' | 'createdAt' | 'originUserId'>,
        userId: string,
        files: Express.Multer.File[] = [],
    ): Promise<IRuleBreachRequestPopulated<IActionMetadataPopulated>> {
        await RuleBreachesManager.uploadRuleBreachFiles(ruleBreachRequestData as unknown as Partial<IRuleBreach>, files);
        // TODO - here

        console.log('create rule breach!!');
        console.log({ ruleBreachRequestData: JSON.stringify(ruleBreachRequestData) });
        const { result, err } = await trycatch(async () => {
            const ruleBreachRequest = await RuleBreachService.createRuleBreachRequest<T>({
                ...ruleBreachRequestData,
                originUserId: userId,
            });

            console.log({ ruleBreachRequest });
            const request = await RuleBreachesManager.getRuleBreachRequestById(ruleBreachRequest._id);

            // await RuleBreachesManager.sendNotification<IRuleBreachRequestNotificationMetadata, IRuleBreachRequestNotificationMetadataPopulated>(
            //     NotificationType.ruleBreachRequest,
            //     { requestId: ruleBreachRequest._id },
            //     { request },
            //     [userId],
            // );

            return request;
        });

        console.log({ err: (err as any)?.response?.data });

        if (err || !result) {
            await RuleBreachesManager.deleteRuleBreachFiles(ruleBreachRequestData as unknown as Partial<IRuleBreach>);
            throw err;
        }

        return result;
    }

    static async getManyRuleBreachRequests(body: { rulesBreachIds: string[] }) {
        const ruleBreaches = await RuleBreachService.getManyRuleBreaches(body.rulesBreachIds);
        
        const populatedRuleBreachesPromises = ruleBreaches.map((ruleBreach) => {
            return RuleBreachesManager.getRuleBreachRequestById(ruleBreach._id);
        });

        return Promise.all(populatedRuleBreachesPromises);
    }

    static async createRuleBreachAlert<T>(
        ruleBreachAlertData: Omit<IRuleBreachAlert<T>, '_id' | 'createdAt' | 'originUserId'>,
        userId: string,
        files: Express.Multer.File[] = [],
    ): Promise<IRuleBreachAlertPopulated<IActionMetadataPopulated>> {
        await RuleBreachesManager.uploadRuleBreachFiles(ruleBreachAlertData as unknown as Partial<IRuleBreach>, files);

        const { result, err } = await trycatch(async () => {
            const rulesBreachAlert = await RuleBreachService.createRuleBreachAlert<T>({ ...ruleBreachAlertData, originUserId: userId });
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

    static async approveRuleBreachRequest(ruleBreachRequestId: string, user: Express.User): Promise<IRuleBreachRequestPopulated> {
        const ruleBreachRequest = await RuleBreachService.getRuleBreachRequestById(ruleBreachRequestId); // here
        RuleBreachesManager.checkIfRuleBreachRequestIsReviewable(ruleBreachRequest);

        if (ruleBreachRequest.actions.length > 1) {
            // TODO - use the new route of run bulk of actions
            console.log('run bulk of action of rule breach');
        }
        else {
                try {
                    if (isCreateRelationshipRuleBreach(ruleBreachRequest.actions[0].actionType))
                        await RuleBreachesManager.createRelationship(
                            ruleBreachRequest.originUserId,
                            {
                                actionMetadata: ruleBreachRequest.actions[0].actionMetadata as ICreateRelationshipMetadata,
                                actionType: ruleBreachRequest.actions[0].actionType,
                            },
                            ruleBreachRequest.brokenRules,
                        );
                    else if (isDeleteRelationshipRuleBreach(ruleBreachRequest.actions[0].actionType))
                        await RuleBreachesManager.deleteRelationship(
                            ruleBreachRequest.originUserId,
                            {
                                actionMetadata: ruleBreachRequest.actions[0].actionMetadata as IDeleteRelationshipMetadata,
                                actionType: ruleBreachRequest.actions[0].actionType,
                            },
                            ruleBreachRequest.brokenRules,
                        );
                    else if (isUpdateEntityRuleBreach(ruleBreachRequest.actions[0].actionType))
                        await RuleBreachesManager.updateEntity(
                            ruleBreachRequest.originUserId,
                            {
                                actionMetadata: ruleBreachRequest.actions[0].actionMetadata as IUpdateEntityMetadata,
                                actionType: ruleBreachRequest.actions[0].actionType,
                            },
                            ruleBreachRequest._id,
                            ruleBreachRequest.brokenRules,
                        );
                    else if (isUpdateEntityStatusRuleBreach(ruleBreachRequest.actions[0].actionType))
                        await RuleBreachesManager.updateEntityStatus(
                            ruleBreachRequest.originUserId,
                            {
                                actionMetadata: ruleBreachRequest.actions[0].actionMetadata as IUpdateEntityStatusMetadata,
                                actionType: ruleBreachRequest.actions[0].actionType,
                            },
                            ruleBreachRequest.brokenRules,
                        );
                } catch (error: any) {
                    if (error.metadata.errorCode === errorCodes.ruleBlock) {
                        await RuleBreachService.updateRuleBreachRequestBrokenRules(ruleBreachRequestId, error.metadata.rawBrokenRules);
                    }
    
                    throw error;
                }
            
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

    private static async updateEntity(
        originUserId: string,
        action: {
            actionType: ActionTypes;
            actionMetadata: IUpdateEntityMetadata;
        },
        _id: string,
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

        await RuleBreachService.updateRuleBreachRequestActionMetadata(_id, action.actionType, {
            ...action.actionMetadata,
            before: entity,
        });
    }

    static async discardRuleBreachRequest(ruleBreachRequest: IRuleBreachRequest, user: Express.User, type: RuleBreachRequestStatus): Promise<any> {
        console.log({ ruleBreachRequest, user, type });

        // TODO - fix function
        // Promise<IRuleBreachRequestPopulated> {
        // ruleBreachRequest.actions.forEach(async (action) => {
        //     RuleBreachesManager.checkIfRuleBreachRequestIsReviewable(ruleBreachRequest);
        //     RuleBreachesManager.deleteRuleBreachFiles(ruleBreachRequest);
        //     const [updatedRuleBreachRequest, { actionMetadata: updatedMetadata }] = await Promise.all([
        //         RuleBreachService.updateRuleBreachRequestStatus(ruleBreachRequest._id, user.id, type),
        //         isUpdateEntityRuleBreach(action.actionType)
        //             ? InstanceManagerService.getEntityInstanceById((action.actionMetadata as IUpdateEntityMetadata).entityId).then((entity) =>
        //                   RuleBreachService.updateRuleBreachRequestActionMetadata(ruleBreachRequest._id, action.actionType, {
        //                       ...action.actionMetadata,
        //                       before: entity,
        //                   }),
        //               )
        //             : { actionMetadata: action.actionMetadata },
        //     ]);
        //     const ruleBreachRequestPopulated = await RuleBreachesManager.populateRuleBreachRequest({
        //         ...updatedRuleBreachRequest,
        //         actionMetadata: updatedMetadata,
        //     });
        //     await RuleBreachesManager.sendNotification<IRuleBreachResponseNotificationMetadata, IRuleBreachResponseNotificationMetadataPopulated>(
        //         NotificationType.ruleBreachResponse,
        //         {
        //             requestId: ruleBreachRequest._id,
        //         },
        //         { request: ruleBreachRequestPopulated },
        //         [ruleBreachRequest.originUserId],
        //     );
        //     return ruleBreachRequestPopulated;
        // });
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

    private static async uploadRuleBreachFiles(ruleBreach: Partial<IRuleBreach>, files: Express.Multer.File[]) {
        ruleBreach.actions?.forEach(async (action) => {
            if (!isUpdateEntityRuleBreach(action.actionType) || !files.length) return;

            const { props: uploadedFilesProperties } = await InstancesManager.uploadInstanceFiles(
                files,
                (action.actionMetadata as IUpdateEntityMetadata).updatedFields,
            );

            // eslint-disable-next-line no-param-reassign
            (action.actionMetadata as IUpdateEntityMetadata).updatedFields = {
                ...(action.actionMetadata as IUpdateEntityMetadata).updatedFields,
                ...uploadedFilesProperties,
            };
        });
    }

    private static async deleteRuleBreachFiles(ruleBreach: Partial<IRuleBreach>) {
        ruleBreach.actions?.forEach(async (action) => {
            if (!isUpdateEntityRuleBreach(action.actionType)) return;

            const entity = await InstanceManagerService.getEntityInstanceById((action.actionMetadata as IUpdateEntityMetadata).entityId);
            const entityTemplate = await EntityTemplateManagerService.getEntityTemplateById(entity.templateId);

            const filePropertiesKeys = InstancesManager.getFilePropertiesKeysByTemplate(entityTemplate);

            const filesToDelete = filteredMap(Object.entries((action.actionMetadata as IUpdateEntityMetadata).updatedFields), ([key, id]) => ({
                include: filePropertiesKeys.includes(key),
                value: id,
            }));

            await deleteFiles(filesToDelete);
        });
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

    private static async populateBrokenRule(brokenRule: IBrokenRule): Promise<IBrokenRulePopulated> {
        const includesCreatedRelationshipId = brokenRule.relationshipIds.includes('created-relationship-id');

        const relationshipConnections: IConnection[] = await InstanceManagerService.getRelationshipsConnectionsByIds(brokenRule.relationshipIds);

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
        const { originUserId, actions, brokenRules, ...restOfRuleBreach } = ruleBreach;

        const populatedActionMetadatasPromises: Promise<IActionMetadataPopulated>[] = [];

        if (actions) {
            actions.forEach((action) => {
                if (isCreateRelationshipRuleBreach(action.actionType))
                    populatedActionMetadatasPromises.push(
                        RuleBreachesManager.populateCreateRelationshipActionMetadata(action.actionMetadata as ICreateRelationshipMetadata),
                    );
                else if (isDeleteRelationshipRuleBreach(action.actionType))
                    populatedActionMetadatasPromises.push(
                        RuleBreachesManager.populateDeleteRelationshipActionMetadata(action.actionMetadata as IDeleteRelationshipMetadata),
                    );
                else if (isUpdateEntityRuleBreach(action.actionType))
                    populatedActionMetadatasPromises.push(
                        RuleBreachesManager.populateUpdateEntityActionMetadata(action.actionMetadata as IUpdateEntityMetadata),
                    );
                else if (isUpdateEntityStatusRuleBreach(action.actionType))
                    populatedActionMetadatasPromises.push(
                        RuleBreachesManager.populateUpdateEntityStatusActionMetadata(action.actionMetadata as IUpdateEntityStatusMetadata),
                    );
            });
        }

        const actionsMetadatas = await Promise.all(populatedActionMetadatasPromises!);

        const [populatedBrokenRules, originUser] = await Promise.all([
            RuleBreachesManager.populateBrokenRules(brokenRules),
            UsersManager.getUserById(originUserId),
        ]);

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
