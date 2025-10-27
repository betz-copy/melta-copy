import { IEntityTemplate, IMongoEntityTemplatePopulated, ServiceError, WorkspaceTypes } from '@microservices/shared';
import { logger } from 'elastic-apm-node';
import WorkspaceManager from '../../express/workspaces/manager';
import EntityTemplateService from '../../externalServices/templates/entityTemplateService';

const updatePastAlertDateNotification = async (entityTemplateService: EntityTemplateService, entityTemplate: IMongoEntityTemplatePopulated) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, createdAt, updatedAt, disabled, ...restProperties } = entityTemplate;
    let updatedProperties = '';

    let hasDateNotification = false;

    let update: Omit<IEntityTemplate, 'disabled'> = {
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
                            isDatePastAlert: true,
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
            `Succeeded in updating past date alert on fields that include date notification in entity Template: ${entityTemplate._id} - ${entityTemplate.name} in properties: ${updatedProperties}`,
        );
    } catch (error) {
        throw new ServiceError(
            undefined,
            `Failed in updating past date alert on fields that include date notification in entity Template: ${entityTemplate._id} - ${entityTemplate.name} in properties: ${updatedProperties}`,
            { error },
        );
    }
};

const main = async () => {
    const workspaceIds = await WorkspaceManager.getWorkspaceIds(WorkspaceTypes.mlt);

    await Promise.all(
        workspaceIds.map(async (workspaceId) => {
            const entityTemplateService = new EntityTemplateService(workspaceId);

            const allEntityTemplates = await entityTemplateService.searchEntityTemplates('');
            await Promise.all(allEntityTemplates.map((entityTemplate) => updatePastAlertDateNotification(entityTemplateService, entityTemplate)));
        }),
    );
};

main().catch((error) => logger.error('Main error: ', { error }));
