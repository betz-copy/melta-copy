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
    IBrokenRule,
    ICreateEntityMetadata,
    ICreateRelationshipMetadata,
    IDeleteRelationshipMetadata,
    IDuplicateEntityMetadata,
    IRuleBreach,
    IRuleBreachAlert,
    IRuleBreachRequest,
    isCreateEntityRuleBreach,
    isCreateRelationshipRuleBreach,
    isDeleteRelationshipRuleBreach,
    isDuplicateEntityRuleBreach,
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
    IRuleBreachRequestNotificationMetadataPopulated,
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

        const { result, err } = await trycatch(async () => {
            const ruleBreachRequest = await RuleBreachService.createRuleBreachRequest<T>({
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
            await RuleBreachesManager.deleteRuleBreachFiles(ruleBreachRequestData as unknown as Partial<IRuleBreach>);
            throw err;
        }

        return result;
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
        const ruleBreachRequest = await RuleBreachService.getRuleBreachRequestById(ruleBreachRequestId);
        RuleBreachesManager.checkIfRuleBreachRequestIsReviewable(ruleBreachRequest);

        try {
            if (isCreateRelationshipRuleBreach(ruleBreachRequest)) await RuleBreachesManager.createRelationship(ruleBreachRequest);
            else if (isDeleteRelationshipRuleBreach(ruleBreachRequest)) await RuleBreachesManager.deleteRelationship(ruleBreachRequest);
            else if (isCreateEntityRuleBreach(ruleBreachRequest)) await RuleBreachesManager.createEntity(ruleBreachRequest);
            else if (isDuplicateEntityRuleBreach(ruleBreachRequest)) await RuleBreachesManager.duplicateEntity(ruleBreachRequest);
            else if (isUpdateEntityRuleBreach(ruleBreachRequest)) await RuleBreachesManager.updateEntity(ruleBreachRequest);
            else if (isUpdateEntityStatusRuleBreach(ruleBreachRequest)) await RuleBreachesManager.updateEntityStatus(ruleBreachRequest);
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

    private static async createEntity(ruleBreachRequest: IRuleBreachRequest<ICreateEntityMetadata>) {
        const { templateId, properties } = ruleBreachRequest.actionMetadata;

        const entity = (
            await InstancesManager.createEntityInstance(
                { templateId, properties },
                [],
                ruleBreachRequest.brokenRules,
                ruleBreachRequest.originUserId,
                false,
            )
        ).createdEntity;

        await RuleBreachService.updateRuleBreachRequestActionMetadata(ruleBreachRequest._id, ruleBreachRequest.actionType, {
            ...ruleBreachRequest.actionMetadata,
            properties: entity.properties,
        });
    }

    private static async duplicateEntity(ruleBreachRequest: IRuleBreachRequest<IDuplicateEntityMetadata>) {
        const { templateId, properties, entityIdToDuplicate } = ruleBreachRequest.actionMetadata;

        const entity = await InstancesManager.duplicateEntityInstance(
            entityIdToDuplicate,
            { templateId, properties },
            [],
            ruleBreachRequest.brokenRules,
            ruleBreachRequest.originUserId,
            false,
            false,
        );

        await RuleBreachService.updateRuleBreachRequestActionMetadata(ruleBreachRequest._id, ruleBreachRequest.actionType, {
            ...ruleBreachRequest.actionMetadata,
            properties: entity.properties,
        });
    }

    private static async updateEntity(ruleBreachRequest: IRuleBreachRequest<IUpdateEntityMetadata>) {
        const { entityId, updatedFields } = ruleBreachRequest.actionMetadata;

        const entity = await InstanceManagerService.getEntityInstanceById(entityId);
        const newEntityProperties = { ...entity.properties, ...updatedFields };

        // updatedFields specifies fields to remove w/ nulls. but shouldn't be in the IEntity properties
        const newEntityPropertiesWithoutNulls = pickBy(newEntityProperties, (property) => property !== null) as IEntity['properties'];

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
        user: Express.User,
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
        const ruleBreachRequestPopulated = await RuleBreachesManager.populateRuleBreachRequest({
            ...updatedRuleBreachRequest,
            actionMetadata: updatedMetadata,
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

    private static async uploadRuleBreachFiles(ruleBreach: Partial<IRuleBreach>, files: Express.Multer.File[]) {
        if (!files.length) return;

        if (isCreateEntityRuleBreach(ruleBreach)) {
            const { props: propertiesWithFiles } = await InstancesManager.uploadInstanceFiles(files, ruleBreach.actionMetadata.properties);
            // eslint-disable-next-line no-param-reassign
            ruleBreach.actionMetadata.properties = propertiesWithFiles;
            return;
        }

        if (isUpdateEntityRuleBreach(ruleBreach)) {
            const { props: updatedFieldsWithFiles } = await InstancesManager.uploadInstanceFiles(files, ruleBreach.actionMetadata.updatedFields);
            // eslint-disable-next-line no-param-reassign
            ruleBreach.actionMetadata.updatedFields = updatedFieldsWithFiles;
            return;
        }

        if (isDuplicateEntityRuleBreach(ruleBreach)) {
            const { templateId, properties, entityIdToDuplicate } = ruleBreach.actionMetadata;

            const currentEntity = await InstanceManagerService.getEntityInstanceById(entityIdToDuplicate);
            const currentEntityTemplate = await EntityTemplateManagerService.getEntityTemplateById(templateId);

            const fileProperties = InstancesManager.getEntityFileProperties(properties, currentEntityTemplate);

            const duplicatedFilesProperties = await InstancesManager.duplicateFileProperties(fileProperties, currentEntity);

            const { props: propertiesWithFiles } = await InstancesManager.uploadInstanceFiles(files, { ...properties, ...duplicatedFilesProperties });

            // eslint-disable-next-line no-param-reassign
            ruleBreach.actionMetadata.properties = propertiesWithFiles;
            return;
        }

        throw new ServiceError(400, 'shouldnt upload files to create rule breach request if not create/duplicate/update entity');
    }

    private static async deleteRuleBreachFiles(ruleBreach: Partial<IRuleBreach>) {
        if (isCreateEntityRuleBreach(ruleBreach) || isDuplicateEntityRuleBreach(ruleBreach)) {
            const entityTemplate = await EntityTemplateManagerService.getEntityTemplateById(ruleBreach.actionMetadata.templateId);

            const filePropertiesToDelete = InstancesManager.getEntityFileProperties(ruleBreach.actionMetadata.properties, entityTemplate);
            const fileIdsToDelete = Object.values(filePropertiesToDelete).flat();

            await deleteFiles(fileIdsToDelete);
        } else if (isUpdateEntityRuleBreach(ruleBreach)) {
            const entity = await InstanceManagerService.getEntityInstanceById(ruleBreach.actionMetadata.entityId);
            const entityTemplate = await EntityTemplateManagerService.getEntityTemplateById(entity.templateId);

            const filePropertiesToDelete = InstancesManager.getEntityFileProperties(ruleBreach.actionMetadata.updatedFields, entityTemplate);
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
        if (entityId === 'created-entity-id') {
            return 'created-entity-id';
        }
        return entitiesMap.get(entityId) ?? null;
    }

    private static populateRelationshipForBrokenRules(relationshipId: string, relationshipsMap: Map<string, IEntity>): IRelationshipForBrokenRules {
        if (relationshipId === 'created-relationship-id') {
            return 'created-relationship-id';
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

        entitiyIds.delete('created-entity-id'); // no point to do getInstanceById to unexisting entity
        relationshipIds.delete('created-relationship-id');

        const entities = await InstanceManagerService.getEntityInstancesByIds(Array.from(entitiyIds));
        const relationships = await InstanceManagerService.getEntityInstancesByIds(Array.from(relationshipIds));

        const entitiesMap = new Map(entities.map((entity) => [entity.properties._id, entity]));
        const relationshipsMap = new Map(relationships.map((relationship) => [relationship.properties._id, relationship]));

        return brokenRules.map((brokenRule) => RuleBreachesManager.populateBrokenRule(brokenRule, entitiesMap, relationshipsMap));
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

    public static async populateCreateEntityActionMetadata(actionMetadata: ICreateEntityMetadata): Promise<ICreateEntityMetadataPopulated> {
        return actionMetadata;
    }

    public static async populateDuplicateEntityActionMetadata(actionMetadata: IDuplicateEntityMetadata): Promise<IDuplicateEntityMetadataPopulated> {
        const { entityIdToDuplicate, ...restOfMetadata } = actionMetadata;

        const entityToDuplicate = await InstanceManagerService.getEntityInstanceById(entityIdToDuplicate).catch(() => null);

        return {
            entityToDuplicate,
            ...restOfMetadata,
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
        else if (isCreateEntityRuleBreach(ruleBreach))
            populatedActionMetadataPromise = RuleBreachesManager.populateCreateEntityActionMetadata(ruleBreach.actionMetadata);
        else if (isDuplicateEntityRuleBreach(ruleBreach))
            populatedActionMetadataPromise = RuleBreachesManager.populateDuplicateEntityActionMetadata(ruleBreach.actionMetadata);
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
