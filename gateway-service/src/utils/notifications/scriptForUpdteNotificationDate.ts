import { IEntityTemplate, IMongoEntityTemplatePopulated } from '@packages/entity-template';
import { logger, ServiceError } from '@packages/utils';
import { WorkspaceTypes } from '@packages/workspace';
import WorkspaceManager from '../../express/workspaces/manager';
import EntityTemplateService from '../../externalServices/templates/entityTemplateService';

enum dateNotificationOptions {
    day = 1,
    week = 7,
    twoWeeks = 14,
    month = 30,
    threeMonths = 90,
    halfYear = 180,
}

const checkDateNotification = async (entityTemplateService: EntityTemplateService, entityTemplate: IMongoEntityTemplatePopulated) => {
    const { _id, createdAt: _createdAt, updatedAt: _updatedAt, ...restProperties } = entityTemplate;
    let updatedProperties = '';

    let hasDateNotification = false;

    let update: IEntityTemplate = {
        ...restProperties,
        category: entityTemplate.category._id,
        properties: {
            ...entityTemplate.properties,
            properties: {
                ...entityTemplate.properties.properties,
            },
        },
    };

    Object.entries(entityTemplate.properties.properties).map(async ([propertyName, property]) => {
        if (property.dateNotification) {
            updatedProperties += ` ${propertyName} `;
            hasDateNotification = true;
            update = {
                ...restProperties,
                category: entityTemplate.category._id,
                properties: {
                    ...entityTemplate.properties,
                    properties: {
                        ...update.properties.properties,
                        [propertyName]: {
                            ...property,
                            isDailyAlert: true,
                            dateNotification: dateNotificationOptions[
                                entityTemplate.properties.properties[propertyName].dateNotification!
                            ] as unknown as number,
                        },
                    },
                },
            };
        }
    });

    if (!hasDateNotification) return;

    try {
        await entityTemplateService.updateEntityTemplate(entityTemplate._id, update);
        logger.info(
            `Succeed to update fields that have a date notification in entityTemplate: ${entityTemplate._id} - ${entityTemplate.name} in properties: ${updatedProperties}`,
        );
    } catch (error) {
        throw new ServiceError(
            undefined,
            `Failed to update fields that have a date notification in entityTemplate: ${entityTemplate._id} - ${entityTemplate.name} in properties: ${updatedProperties}`,
            { error },
        );
    }
};

const main = async () => {
    const workspaceIds = await WorkspaceManager.getWorkspaceIds(WorkspaceTypes.mlt);

    await Promise.all(
        workspaceIds.map(async (workspaceId) => {
            const entityTemplateService = new EntityTemplateService(workspaceId);

            const allEntityTemplates = await entityTemplateService.searchEntityTemplates({ _id: '', kartoffelId: '' });
            await Promise.all(allEntityTemplates.map((entityTemplate) => checkDateNotification(entityTemplateService, entityTemplate)));
        }),
    );
};

main().catch((error) => logger.error('Main error: ', { error }));
