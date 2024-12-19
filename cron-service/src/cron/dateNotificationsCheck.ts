import { IDateAboutToExpireNotificationMetadata, NotificationType } from '../notification/interface';
import config from '../config';
import { UsersManager } from '../users/manager';
import { WorkspaceTypes } from '../workspaces/inteface';
import { InstancesService } from '../services/instance';
import { IFilterDatesRange } from '../instance/entity/interface';
import { EntityTemplateService, IMongoEntityTemplatePopulated } from '../services/entityTemplate';
import { PermissionScope, PermissionType } from '../users/intefaces/permissions';
import { WorkspaceManager } from '../workspaces/manager';
import { RabbitManager } from '../utils/rabbit/rabbit';
import logger from '../utils/logger/logsLogger';
import * as schedule from 'node-schedule';

const { notifications } = config;

const checkNotificationDateInCustomAlert = (datePropertyValue: Date, dateNotification: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dateProperty = new Date(datePropertyValue);
    dateProperty.setHours(0, 0, 0, 0);

    if (new Date(datePropertyValue) < today) return true;

    return notifications.dateAlertOptions.some((option) => {
        if (dateNotification < option) return false;
        const notificationDate = new Date(datePropertyValue);
        notificationDate.setDate(notificationDate.getDate() - option);
        notificationDate.setHours(0, 0, 0, 0);
        return notificationDate.getDate() === today.getDate();
    });
};

const getFilteredInstances = async (
    instancesService: InstancesService,
    entityTemplateId: string,
    propertiesWithDateNotifications: IFilterDatesRange[],
) => {
    const { count } = await instancesService.searchEntitiesOfTemplateRequest(entityTemplateId, { limit: 1 });
    const today = new Date();

    const dateNotificationFilterQuery = propertiesWithDateNotifications.flatMap((prop) => {
        const notificationDate = new Date();
        notificationDate.setDate(today.getDate() + prop.dateNotificationValue);
        const endDate = prop.isDateTime
            ? new Date(notificationDate.setUTCHours(23, 59, 59, 999)).toISOString()
            : notificationDate.toISOString().split('T')[0];

        return [
            {
                [prop.propertyName]: {
                    $lte: endDate,
                },
            },
        ];
    });

    const { entities } = await instancesService.searchEntitiesOfTemplateRequest(entityTemplateId, {
        limit: count,
        filter: { $or: dateNotificationFilterQuery },
    });

    return entities;
};

const sendNotificationsForEntityTemplate = async (
    workspaceId: string,
    instancesService: InstancesService,
    rabbitManager: RabbitManager,
    entityTemplate: IMongoEntityTemplatePopulated,
) => {
    const today = new Date();

    const workspaceIds = await WorkspaceManager.getWorkspaceHierarchyIds(workspaceId);

    const userIdsWithPermission = await UsersManager.searchUserIds({
        workspaceIds,
        permissions: {
            // @ts-ignore
            [PermissionType.instances]: {
                categories: {
                    [entityTemplate.category._id]: {
                        scope: PermissionScope.write,
                    },
                },
            },
        },
        limit: config.instanceService.searchEntitiesFlowMaxLimit,
    });

    const propertiesWithDateNotifications: IFilterDatesRange[] = Object.entries(entityTemplate.properties.properties)
        .filter(([_propertyName, property]) => property.dateNotification)
        .map(([propertyName, property]) => ({
            propertyName,
            dateNotificationValue: property.dateNotification!,
            isDateTime: property.format === 'date-time',
            isDailyAlert: property.isDailyAlert!,
        }));

    if (propertiesWithDateNotifications.length > 0) {
        const instances = await getFilteredInstances(instancesService, entityTemplate._id, propertiesWithDateNotifications);
        await Promise.all(
            propertiesWithDateNotifications.map(async ({ propertyName, dateNotificationValue, isDailyAlert }) => {
                instances.map(async ({ entity }) => {
                    const datePropertyValue = new Date(entity.properties[propertyName]);
                    const notificationDate = new Date(entity.properties[propertyName]);
                    notificationDate.setDate(datePropertyValue.getDate() - dateNotificationValue);

                    if (
                        (isDailyAlert && notificationDate.getTime() <= today.getTime()) ||
                        (!isDailyAlert && checkNotificationDateInCustomAlert(datePropertyValue, dateNotificationValue))
                    ) {
                        await rabbitManager.createNotification<IDateAboutToExpireNotificationMetadata>(
                            userIdsWithPermission,
                            NotificationType.dateAboutToExpire,
                            {
                                entityId: entity.properties._id,
                                propertyName,
                                datePropertyValue,
                            },
                        );
                    }
                });
            }),
        );
    }
};

export const checkForDateNotifications = async () => {
    schedule.scheduleJob(notifications.dateAlertTime, async () => {
        logger.info('Checking for Date Notifications...');
        const workspaceIds = await WorkspaceManager.getWorkspaceIds(WorkspaceTypes.mlt);

        await Promise.all(
            workspaceIds.map(async (workspaceId) => {
                const entityTemplateService = new EntityTemplateService(workspaceId);
                const instancesService = new InstancesService(workspaceId);
                const rabbitManager = new RabbitManager(workspaceId);

                try {
                    const allEntityTemplates = await entityTemplateService.searchEntityTemplates();
                    await Promise.all(
                        allEntityTemplates.map((entityTemplate) =>
                            sendNotificationsForEntityTemplate(workspaceId, instancesService, rabbitManager, entityTemplate),
                        ),
                    );
                } catch (error) {
                    logger.error('Error checking date notifications:', { error });
                }
            }),
        );
    });
};
