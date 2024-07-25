/* eslint-disable no-plusplus */
import pickBy from 'lodash.pickby';
import { EntityTemplateService } from '../../externalServices/templates/entityTemplateService';
import { IEntity } from '../../externalServices/instanceService/interfaces/entities';
import { InstancesService } from '../../externalServices/instanceService';
import { StorageService } from '../../externalServices/storageService';
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

    checkIfRuleBreachRequestIsReviewable(ruleBreachRequest: IRuleBreachRequest) {
        if (ruleBreachRequest.status !== RuleBreachRequestStatus.Pending) {
            throw new ServiceError(400, 'rule breach requests was already reviewed');
        }
    }

    async approveRuleBreachRequest(ruleBreachRequestId: string, user: Express.User): Promise<IRuleBreachRequestPopulated> {
        const ruleBreachRequest = await this.service.getRuleBreachRequestById(ruleBreachRequestId);
        this.checkIfRuleBreachRequestIsReviewable(ruleBreachRequest);

        try {
            if (isCreateRelationshipRuleBreach(ruleBreachRequest)) await this.createRelationship(ruleBreachRequest);
            else if (isDeleteRelationshipRuleBreach(ruleBreachRequest)) await this.deleteRelationship(ruleBreachRequest);
            else if (isCreateEntityRuleBreach(ruleBreachRequest)) await this.createEntity(ruleBreachRequest);
            else if (isDuplicateEntityRuleBreach(ruleBreachRequest)) await this.duplicateEntity(ruleBreachRequest);
            else if (isUpdateEntityRuleBreach(ruleBreachRequest)) await this.updateEntity(ruleBreachRequest);
            else if (isUpdateEntityStatusRuleBreach(ruleBreachRequest)) await this.updateEntityStatus(ruleBreachRequest);
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

    private async createEntity(ruleBreachRequest: IRuleBreachRequest<ICreateEntityMetadata>) {
        const { templateId, properties } = ruleBreachRequest.actionMetadata;

        const entity = await this.instancesManager.createEntityInstance(
            { templateId, properties },
            [],
            ruleBreachRequest.brokenRules,
            ruleBreachRequest.originUserId,
            false,
        );

        await this.service.updateRuleBreachRequestActionMetadata(ruleBreachRequest._id, ruleBreachRequest.actionType, {
            ...ruleBreachRequest.actionMetadata,
            properties: entity.properties,
        });
    }

    private async duplicateEntity(ruleBreachRequest: IRuleBreachRequest<IDuplicateEntityMetadata>) {
        const { templateId, properties, entityIdToDuplicate } = ruleBreachRequest.actionMetadata;

        const entity = await this.instancesManager.duplicateEntityInstance(
            entityIdToDuplicate,
            { templateId, properties },
            [],
            ruleBreachRequest.brokenRules,
            ruleBreachRequest.originUserId,
            false,
            false,
        );

        await this.service.updateRuleBreachRequestActionMetadata(ruleBreachRequest._id, ruleBreachRequest.actionType, {
            ...ruleBreachRequest.actionMetadata,
            properties: entity.properties,
        });
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
        this.checkIfRuleBreachRequestIsReviewable(ruleBreachRequest);

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
        if (!files.length) return;

        if (isCreateEntityRuleBreach(ruleBreach)) {
            const { props: propertiesWithFiles } = await this.instancesManager.uploadInstanceFiles(files, ruleBreach.actionMetadata.properties);
            // eslint-disable-next-line no-param-reassign
            ruleBreach.actionMetadata.properties = propertiesWithFiles;
            return;
        }

        if (isUpdateEntityRuleBreach(ruleBreach)) {
            const { props: updatedFieldsWithFiles } = await this.instancesManager.uploadInstanceFiles(files, ruleBreach.actionMetadata.updatedFields);
            // eslint-disable-next-line no-param-reassign
            ruleBreach.actionMetadata.updatedFields = updatedFieldsWithFiles;
            return;
        }

        if (isDuplicateEntityRuleBreach(ruleBreach)) {
            const { templateId, properties, entityIdToDuplicate } = ruleBreach.actionMetadata;

            const currentEntity = await this.instancesService.getEntityInstanceById(entityIdToDuplicate);
            const currentEntityTemplate = await this.entityTemplateService.getEntityTemplateById(templateId);

            const fileProperties = this.instancesManager.getEntityFileProperties(properties, currentEntityTemplate);

            const duplicatedFilesProperties = await this.instancesManager.duplicateFileProperties(fileProperties, currentEntity);

            const { props: propertiesWithFiles } = await this.instancesManager.uploadInstanceFiles(files, {
                ...properties,
                ...duplicatedFilesProperties,
            });

            // eslint-disable-next-line no-param-reassign
            ruleBreach.actionMetadata.properties = propertiesWithFiles;
            return;
        }

        throw new ServiceError(400, 'shouldnt upload files to create rule breach request if not create/duplicate/update entity');
    }

    private async deleteRuleBreachFiles(ruleBreach: Partial<IRuleBreach>) {
        if (isCreateEntityRuleBreach(ruleBreach) || isDuplicateEntityRuleBreach(ruleBreach)) {
            const entityTemplate = await this.entityTemplateService.getEntityTemplateById(ruleBreach.actionMetadata.templateId);

            const filePropertiesToDelete = this.instancesManager.getEntityFileProperties(ruleBreach.actionMetadata.properties, entityTemplate);
            const fileIdsToDelete = Object.values(filePropertiesToDelete).flat();

            await this.storageService.deleteFiles(fileIdsToDelete);
        } else if (isUpdateEntityRuleBreach(ruleBreach)) {
            const entity = await this.instancesService.getEntityInstanceById(ruleBreach.actionMetadata.entityId);
            const entityTemplate = await this.entityTemplateService.getEntityTemplateById(entity.templateId);

            const filePropertiesToDelete = this.instancesManager.getEntityFileProperties(ruleBreach.actionMetadata.updatedFields, entityTemplate);
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
        if (entityId === 'created-entity-id') {
            return 'created-entity-id';
        }
        return entitiesMap.get(entityId) ?? null;
    }

    private populateRelationshipForBrokenRules(relationshipId: string, relationshipsMap: Map<string, IEntity>): IRelationshipForBrokenRules {
        if (relationshipId === 'created-relationship-id') {
            return 'created-relationship-id';
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

        entitiyIds.delete('created-entity-id'); // no point to do getInstanceById to unexisting entity
        relationshipIds.delete('created-relationship-id');

        const entities = await this.instancesService.getEntityInstancesByIds(Array.from(entitiyIds));
        const relationships = await this.instancesService.getEntityInstancesByIds(Array.from(relationshipIds));

        const entitiesMap = new Map(entities.map((entity) => [entity.properties._id, entity]));
        const relationshipsMap = new Map(relationships.map((relationship) => [relationship.properties._id, relationship]));

        return brokenRules.map((brokenRule) => this.populateBrokenRule(brokenRule, entitiesMap, relationshipsMap));
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

    public async populateCreateEntityActionMetadata(actionMetadata: ICreateEntityMetadata): Promise<ICreateEntityMetadataPopulated> {
        return actionMetadata;
    }

    public async populateDuplicateEntityActionMetadata(actionMetadata: IDuplicateEntityMetadata): Promise<IDuplicateEntityMetadataPopulated> {
        const { entityIdToDuplicate, ...restOfMetadata } = actionMetadata;

        const entityToDuplicate = await this.instancesService.getEntityInstanceById(entityIdToDuplicate).catch(() => null);

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
        const { originUserId, brokenRules, ...restOfRuleBreach } = ruleBreach;

        let populatedActionMetadataPromise: Promise<IActionMetadataPopulated>;

        if (isCreateRelationshipRuleBreach(ruleBreach))
            populatedActionMetadataPromise = this.populateCreateRelationshipActionMetadata(ruleBreach.actionMetadata);
        else if (isDeleteRelationshipRuleBreach(ruleBreach))
            populatedActionMetadataPromise = this.populateDeleteRelationshipActionMetadata(ruleBreach.actionMetadata);
        else if (isCreateEntityRuleBreach(ruleBreach))
            populatedActionMetadataPromise = this.populateCreateEntityActionMetadata(ruleBreach.actionMetadata);
        else if (isDuplicateEntityRuleBreach(ruleBreach))
            populatedActionMetadataPromise = this.populateDuplicateEntityActionMetadata(ruleBreach.actionMetadata);
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
