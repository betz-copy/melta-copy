import { EntityTemplateManagerService, IEntityTemplate } from '../../externalServices/templates/entityTemplateService';
import logger from '../logger/logsLogger';

enum dateNotificationOptions {
    day = 1,
    week = 7,
    twoWeeks = 14,
    month = 30,
    threeMonths = 90,
    halfYear = 180,
}

async function main() {
    const allEntityTemplates = await EntityTemplateManagerService.searchEntityTemplates();

    allEntityTemplates.map(async (entity) => {
        const { _id, createdAt, updatedAt, ...restProperties } = entity;
        let updatedProperties = '';

        let hasDateNotification = false;

        let update: IEntityTemplate = {
            ...restProperties,
            category: entity.category._id,
            properties: {
                ...entity.properties,
                properties: {
                    ...entity.properties.properties,
                },
            },
        };

        Object.entries(entity.properties.properties).map(async ([propertyName, property]) => {
            if (property.dateNotification) {
                updatedProperties += ` ${propertyName} `;
                hasDateNotification = true;
                update = {
                    ...restProperties,
                    category: entity.category._id,
                    properties: {
                        ...entity.properties,
                        properties: {
                            ...update.properties.properties,
                            [propertyName]: {
                                ...property,
                                isDailyAlert: true,
                                dateNotification: dateNotificationOptions[
                                    entity.properties.properties[propertyName].dateNotification!
                                ] as unknown as number,
                            },
                        },
                    },
                };
            }
        });

        if (hasDateNotification) {
            try {
                await EntityTemplateManagerService.updateEntityTemplate(entity._id, update);
                logger.info(
                    `Succeed to update fields that have a date notification in entityTemplate: ${entity._id} - ${entity.name} in properties: ${updatedProperties}`,
                );
            } catch (error) {
                logger.error(
                    `Failed to update fields that have a date notification in entityTemplate: ${entity._id} - ${entity.name} in properties: ${updatedProperties}`,
                    error,
                );
            }
        }
    });
}

main();
