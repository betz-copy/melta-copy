import * as schedule from 'node-schedule';

import { EntityTemplateManagerService } from './externalServices/entityTemplateManager';
import { IEntity, InstanceManagerService } from './externalServices/instanceManager';
import { getPermissions } from './externalServices/permissionsApi';
import { NotificationService } from './externalServices/notificationService';
import { IDateAboutToExpireNotificationMetadata, NotificationType } from './externalServices/notificationService/interfaces';
import config from './config';

enum dateNotificationOptions {
    day = 1,
    week = 7,
    twoWeeks = 14,
}

const getEntitiesChunk = async (id: string, currentFirstRow: number, currentEndRow: number) => {
    return InstanceManagerService.getInstancesByTemplateIds([id], {
        startRow: currentFirstRow,
        endRow: currentEndRow,
        sortModel: [],
        filterModel: {},
    });
};

const getAllInstances = async (entityTemplateId: string) => {
    const rowsEachReq = config.service.numOfRowsEachReq;
    const { lastRowIndex: numberOfRows } = await getEntitiesChunk(entityTemplateId, 0, 0);
    const instances: IEntity[] = [];
    for (let firstRow = 0; numberOfRows - firstRow > 0; firstRow += rowsEachReq + 1) {
        // eslint-disable-next-line no-await-in-loop
        const { rows } = await getEntitiesChunk(entityTemplateId, firstRow, firstRow + rowsEachReq);
        instances.push(...rows);
    }
    return instances;
};

export const checkForDateNotifications = async () => {
    schedule.scheduleJob('0 0 * * *', async () => {
        console.log('Checking for Date Notifications...');
        const allEntityTemplates = await EntityTemplateManagerService.searchEntityTemplates();

        for (const entityTemplate of allEntityTemplates) {
            // eslint-disable-next-line no-await-in-loop
            const InstancesPermissions = await getPermissions({ resourceType: 'Instances', category: entityTemplate.category._id });
            const userIdsWithPermission = InstancesPermissions.map((instancePermission) => instancePermission.userId);
            // eslint-disable-next-line no-undef-init
            let instances: IEntity[] | undefined = undefined;
            for (const [propertyName, property] of Object.entries(entityTemplate.properties.properties)) {
                // eslint-disable-next-line no-continue
                if (!property.dateNotification) continue;
                // eslint-disable-next-line no-await-in-loop
                if (!instances) instances = await getAllInstances(entityTemplate._id);
                instances.forEach(async (instance) => {
                    const today = new Date();
                    const datePropertyValue = new Date(instance.properties[propertyName]);
                    if (datePropertyValue.getTime() < today.getTime()) {
                        return;
                    }
                    const notificationDate = new Date(instance.properties[propertyName]);
                    notificationDate.setDate(datePropertyValue.getDate() - dateNotificationOptions[property.dateNotification!]);

                    if (notificationDate.getTime() <= today.getTime()) {
                        await NotificationService.rabbitCreateNotification<IDateAboutToExpireNotificationMetadata>(
                            userIdsWithPermission,
                            NotificationType.dateAboutToExpire,
                            {
                                entityId: instance.properties._id,
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
