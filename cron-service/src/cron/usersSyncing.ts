import { IEntity } from '@packages/entity';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '@packages/entity-template';
import { logger } from '@packages/utils';
import { WorkspaceTypes } from '@packages/workspace';
import { keyBy } from 'lodash';
import schedule from 'node-schedule';
import config from '../config';
import EntityTemplateService from '../services/entityTemplate';
import InstanceService from '../services/instance';
import Kartoffel from '../services/kartoffel';
import { IKartoffelUser } from '../services/kartoffel/interface';
import WorkspaceManager from '../workspaces/manager';

const { userFieldsSync } = config;

// Helper to get typed entries from Record<string, IEntitySingleProperty>
const getTypedPropertyEntries = (properties: Record<string, IEntitySingleProperty>) => {
    return Object.entries(properties) as [string, IEntitySingleProperty][];
};

const checkForEntityToUpdate = (
    entity: IEntity,
    entityTemplate: IMongoEntityTemplatePopulated,
    kartoffelUsersMapById: Record<string, IKartoffelUser>,
) => {
    const userKeysKartoffelIdsMap: Record<string, string> = {};
    const propertiesToUpdate = {};

    getTypedPropertyEntries(entityTemplate.properties.properties).forEach(([key, value]) => {
        const fieldValue = entity.properties[key];
        if (value.format === 'user' && fieldValue) userKeysKartoffelIdsMap[key] = JSON.parse(fieldValue)._id;
    });

    if (Object.keys(userKeysKartoffelIdsMap).length === 0) return {};

    getTypedPropertyEntries(entityTemplate.properties.properties).forEach(([key, value]) => {
        if (value.format === 'kartoffelUserField') {
            const kartoffelId = userKeysKartoffelIdsMap[value.expandedUserField?.relatedUserField || ''];

            if (kartoffelId) {
                const kartoffelUser = kartoffelUsersMapById[kartoffelId];
                const kartoffelFieldValue = kartoffelUser[value.expandedUserField?.kartoffelField || ''];

                if (entity.properties[key] !== kartoffelFieldValue) propertiesToUpdate[key] = kartoffelFieldValue;
            }
        }
    });

    return propertiesToUpdate;
};

const getAllEntitiesOfTemplates = async (templates: IMongoEntityTemplatePopulated[], instanceService: InstanceService) => {
    const entitiesArrays = await Promise.all(
        templates.map(async (template) => {
            const { count } = await instanceService.searchEntitiesOfTemplateRequest(template._id, {
                limit: 1,
                skip: 0,
                showRelationships: false,
                sort: [],
            });

            if (count === 0) return [];

            const { entities: instances } = await instanceService.searchEntitiesOfTemplateRequest(template._id, {
                limit: count,
                skip: 0,
                showRelationships: false,
                sort: [],
            });

            return instances;
        }),
    );

    return entitiesArrays.flat();
};

export const updateKartoffelFields = async () => {
    schedule.scheduleJob(userFieldsSync.usersSyncTime, async () => {
        logger.info('Checking for users to sync...');
        const workspaceIds = await WorkspaceManager.getWorkspaceIds(WorkspaceTypes.mlt);
        logger.info({ workspaceIdsCount: workspaceIds.length });

        await Promise.all(
            workspaceIds.map(async (workspaceId) => {
                const instanceService = new InstanceService(workspaceId);
                const templateService = new EntityTemplateService(workspaceId);
                const usersIds = new Set<string>();

                try {
                    // get all the entity templates that have kartoffelUserField
                    const templates = await templateService.searchEntityTemplatesIncludesFormat('kartoffelUserField');
                    const templatesMapById = keyBy(templates, '_id');

                    logger.info({ templatesCount: templates.length });

                    // get all the instances by the templates
                    const instances = (await getAllEntitiesOfTemplates(templates, instanceService)).map(({ entity }) => entity);

                    // collect all the users ids from the instances
                    const entitiesIds: string[] = [];
                    instances.forEach(({ properties, templateId }) => {
                        const entityTemplate = templatesMapById[templateId];

                        entitiesIds.push(properties._id);

                        getTypedPropertyEntries(entityTemplate.properties.properties).forEach(([key, value]) => {
                            const field = value as IEntitySingleProperty;
                            const fieldValue = properties[key];

                            if (field.format === 'user' && fieldValue) usersIds.add(JSON.parse(fieldValue)._id);
                        });
                    });

                    const kartoffelUsers = await Promise.all(Array.from(usersIds).map((userId) => Kartoffel.getUserById(userId)));
                    const kartoffelUsersMapById = keyBy(kartoffelUsers, '_id');

                    const entitiesMapById: Record<string, IEntity> = keyBy<IEntity>(instances, (entity) => entity.properties._id);

                    const updatedEntities = await Promise.allSettled(
                        instances.map(async (entity) => {
                            const entityTemplate = templatesMapById[entity.templateId];
                            // for each user field in each instance, check if the user from kartoffel is different in one of the fields of the user in the instance
                            // update the user fields if needed
                            const updatedProperties = checkForEntityToUpdate(entity, entityTemplate, kartoffelUsersMapById);

                            if (!Object.keys(updatedProperties).length) return;

                            const entityById = entitiesMapById[entity.properties._id];

                            return instanceService.updateEntityInstance(
                                entity.properties._id,
                                {
                                    ...entityById,
                                    properties: { ...entityById.properties, ...updatedProperties },
                                },
                                [],
                            );
                        }),
                    );

                    logger.info({ updatedEntities });
                } catch (error) {
                    logger.error('Error syncing kartoffel users:', { error });
                }
            }),
        );
    });
};
