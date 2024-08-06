import * as schedule from 'node-schedule';
import { IDateAboutToExpireNotificationMetadata, NotificationType } from '../../externalServices/notificationService/interfaces';
import { rabbitCreateNotification } from './createNotification';
import { IDateAboutToExpireMetadataPopulated } from '../../externalServices/notificationService/interfaces/populated';
import { InstanceManagerService } from '../../externalServices/instanceService';
import { EntityTemplateManagerService, IMongoEntityTemplatePopulated } from '../../externalServices/templates/entityTemplateService';
import { IFilterDatesRange } from '../../externalServices/instanceService/interfaces/entities';
import { getPermissions } from '../../externalServices/permissionsService';
import logger from '../logger/logsLogger';
import config from '../../config';
import { ServiceError } from '../../express/error';

const { notifications } = config;

const checkNotificationDateInCustomAlert = (datePropertyValue: Date, dateNotification: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dateNotificationOptions = notifications.dateAlertOptions;

    return dateNotificationOptions.some((option) => {
        if (dateNotification < option) return false;
        const notificationDate = new Date(datePropertyValue);
        notificationDate.setDate(notificationDate.getDate() - option);
        notificationDate.setHours(0, 0, 0, 0);
        return notificationDate.getDate() === today.getDate();
    });
};

const getFilteredInstances = async (entityTemplateId: string, propertiesWithDateNotifications: IFilterDatesRange[]) => {
    const { count } = await InstanceManagerService.searchEntitiesOfTemplateRequest(entityTemplateId, { limit: 1 });
    const today = new Date();

    const dateNotificationFilterQuery = propertiesWithDateNotifications.map((prop) => {
        const notificationDate = new Date();
        notificationDate.setDate(today.getDate() + prop.dateNotificationValue);
        const startDate = prop.isDateTime ? today.toISOString() : today.toISOString().split('T')[0];
        const endDate = prop.isDateTime
            ? new Date(notificationDate.setUTCHours(23, 59, 59, 999)).toISOString()
            : notificationDate.toISOString().split('T')[0];

        return {
            [prop.propertyName]: {
                $gte: startDate,
                $lte: endDate,
            },
        };
    });

    const { entities } = await InstanceManagerService.searchEntitiesOfTemplateRequest(entityTemplateId, {
        limit: count,
        filter: { $or: dateNotificationFilterQuery },
    });

    return entities;
};

const sendNotificationsForEntityTemplate = async (entityTemplate: IMongoEntityTemplatePopulated) => {
    const today = new Date();
    const InstancesPermissions = await getPermissions({ resourceType: 'Instances', category: entityTemplate.category._id });
    const userIdsWithPermission = InstancesPermissions.map((instancePermission) => instancePermission.userId);

    const propertiesWithDateNotifications: IFilterDatesRange[] = Object.entries(entityTemplate.properties.properties)
        .filter(([_propertyName, property]) => property.dateNotification)
        .map(([propertyName, property]) => ({
            propertyName,
            dateNotificationValue: property.dateNotification!,
            isDateTime: property.format === 'date-time',
            isDailyAlert: property.isDailyAlert!,
        }));

    if (propertiesWithDateNotifications.length > 0) {
        const instances = await getFilteredInstances(entityTemplate._id, propertiesWithDateNotifications);

        await Promise.all(
            propertiesWithDateNotifications.map(async ({ propertyName, dateNotificationValue, isDailyAlert }) => {
                instances.map(async ({ entity }) => {
                    const datePropertyValueDateFormat = new Date(entity.properties[propertyName]);
                    const datePropertyValue = new Date(entity.properties[propertyName]);

                    if (datePropertyValueDateFormat.setHours(0, 0, 0, 0) < today.setHours(0, 0, 0, 0)) return;

                    const notificationDate = new Date(entity.properties[propertyName]);
                    notificationDate.setDate(datePropertyValue.getDate() - dateNotificationValue);

                    if (
                        (isDailyAlert && notificationDate.getTime() <= today.getTime()) ||
                        (!isDailyAlert && checkNotificationDateInCustomAlert(datePropertyValue, dateNotificationValue))
                    ) {
                        await rabbitCreateNotification<IDateAboutToExpireNotificationMetadata, IDateAboutToExpireMetadataPopulated>(
                            userIdsWithPermission,
                            NotificationType.dateAboutToExpire,
                            {
                                entityId: entity.properties._id,
                                propertyName,
                                datePropertyValue,
                            },
                            { entity, propertyName, datePropertyValue },
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
        try {
            const allEntityTemplates = await EntityTemplateManagerService.searchEntityTemplates();
            await Promise.all(allEntityTemplates.map(sendNotificationsForEntityTemplate));
        } catch (error) {
            throw new ServiceError(500, 'Error checking date notifications', { error });
        }
    });
};
