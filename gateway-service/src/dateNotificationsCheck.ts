import * as schedule from 'node-schedule';

import { EntityTemplateManagerService } from './externalServices/entityTemplateService';
import { InstanceManagerService } from './externalServices/instanceService';
import { IEntityWithDirectRelationships } from './externalServices/instanceService/interfaces/entities';
import { getPermissions } from './externalServices/permissionsService';
import { NotificationService } from './externalServices/notificationService';
import { IDateAboutToExpireNotificationMetadata, NotificationType } from './externalServices/notificationService/interfaces';
import config from './config';

enum dateNotificationOptions {
    day = 1,
    week = 7,
    twoWeeks = 14,
}

const getAllInstances = async (entityTemplateId: string) => {
    const { searchEntitiesChunkSize } = config.service;
    const { count: numberOfRows } = await InstanceManagerService.searchEntitiesOfTemplateRequest(entityTemplateId, { limit: 1 });
    const instances: IEntityWithDirectRelationships[] = [];
    for (let firstRow = 0; numberOfRows - firstRow > 0; firstRow += searchEntitiesChunkSize + 1) {
        // eslint-disable-next-line no-await-in-loop
        const { entities } = await InstanceManagerService.searchEntitiesOfTemplateRequest(entityTemplateId, {
            skip: firstRow,
            limit: searchEntitiesChunkSize,
        });
        instances.push(...entities);
    }
    return instances;
};

export const checkForDateNotifications = async () => {
    schedule.scheduleJob(config.service.dateAlertTime, async () => {
        console.log('Checking for Date Notifications...');
        const allEntityTemplates = await EntityTemplateManagerService.searchEntityTemplates();

        for (const entityTemplate of allEntityTemplates) {
            // eslint-disable-next-line no-await-in-loop
            const InstancesPermissions = await getPermissions({ resourceType: 'Instances', category: entityTemplate.category._id });
            const userIdsWithPermission = InstancesPermissions.map((instancePermission) => instancePermission.userId);
            // eslint-disable-next-line no-undef-init
            let instances: IEntityWithDirectRelationships[] | undefined = undefined;
            for (const [propertyName, property] of Object.entries(entityTemplate.properties.properties)) {
                // eslint-disable-next-line no-continue
                if (!property.dateNotification) continue;
                // eslint-disable-next-line no-await-in-loop
                if (!instances) instances = await getAllInstances(entityTemplate._id);
                instances.forEach(async ({ entity }) => {
                    const today = new Date();
                    const datePropertyValue = new Date(entity.properties[propertyName]);
                    if (datePropertyValue.getTime() < today.getTime()) {
                        return;
                    }
                    const notificationDate = new Date(entity.properties[propertyName]);
                    notificationDate.setDate(datePropertyValue.getDate() - dateNotificationOptions[property.dateNotification!]);

                    if (notificationDate.getTime() <= today.getTime()) {
                        await NotificationService.rabbitCreateNotification<IDateAboutToExpireNotificationMetadata>(
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
            }
        }
    });
};
