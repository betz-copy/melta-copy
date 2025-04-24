import config from '../config';
import { WorkspaceTypes } from '../workspaces/inteface';
import { InstanceService } from '../services/instance';
import { WorkspaceManager } from '../workspaces/manager';
import logger from '../utils/logger/logsLogger';
import * as schedule from 'node-schedule';
import { groupBy, Dictionary } from 'lodash';
import { Kartoffel } from '../services/kartoffel';
import { IEntity } from '../instance/entity/interface';
import { IKartoffelUser } from '../services/kartoffel/interface';
import { EntityTemplateService, IMongoEntityTemplatePopulated } from '../services/entityTemplate';

const { userFieldsSync } = config;

const checkForEntityToUpdate = (
    entity: IEntity,
    entityTemplate: IMongoEntityTemplatePopulated,
    kartoffelUsersMapById: Dictionary<IKartoffelUser[]>,
) => {
    const userKeysKartoffelIdsMap: Record<string, string> = {};
    const propertiesToUpdate = {};

    Object.entries(entityTemplate.properties.properties).forEach(([key, value]) => {
        const fieldValue = entity.properties[key];
        if (value.format === 'user' && fieldValue) userKeysKartoffelIdsMap[key] = JSON.parse(fieldValue)._id;
    });

    if (Object.keys(userKeysKartoffelIdsMap).length === 0) return {};

    Object.entries(entityTemplate.properties.properties).forEach(([key, value]) => {
        if (value.format === 'kartoffelUserField') {
            const kartoffelId = userKeysKartoffelIdsMap[value.expandedUserField?.relatedUserField || ''];

            if (kartoffelId) {
                const kartoffelUser = kartoffelUsersMapById[kartoffelId][0];
                const kartoffelFieldValue = kartoffelUser[value.expandedUserField?.kartoffelField || ''];
                if (entity.properties[key] !== kartoffelFieldValue) {
                    propertiesToUpdate[key] = kartoffelFieldValue;
                }
            }
        }
    });

    return propertiesToUpdate;
};

const getAllEntitiesOfTemplates = async (templates: IMongoEntityTemplatePopulated[], instanceService: InstanceService) => {
    const entitiesArrays = await Promise.all(
        templates.map(async (template) => {
            const { count } = await instanceService.searchEntitiesOfTemplateRequest(template._id, { limit: 1 });

            if (count === 0) return [];

            const { entities: instances } = await instanceService.searchEntitiesOfTemplateRequest(template._id, {
                limit: count,
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
        logger.debug({ workspaceIdsCount: workspaceIds.length });

        await Promise.all(
            workspaceIds.map(async (workspaceId) => {
                const instanceService = new InstanceService(workspaceId);
                const templateService = new EntityTemplateService(workspaceId);
                const usersIds = new Set<string>();

                try {
                    // get all the entity templates that have kartoffelUserField
                    const templates = await templateService.searchEntityTemplatesIncludesFormat('kartoffelUserField');
                    const templatesMapById = groupBy(templates, (template) => template._id);

                    logger.debug({ templatesCount: templates.length });

                    // get all the instances by the templates
                    const instances = await getAllEntitiesOfTemplates(templates, instanceService);

                    // collect all the users ids from the instances
                    const entitiesIds: string[] = [];
                    instances.forEach((entity) => {
                        const entityTemplate = templatesMapById[entity.entity.templateId][0];
                        entitiesIds.push(entity.entity.properties._id);
                        Object.entries(entityTemplate.properties.properties).forEach(([key, value]) => {
                            const fieldValue = entity.entity.properties[key];
                            if (value.format === 'user' && fieldValue) usersIds.add(JSON.parse(fieldValue)._id);
                        });
                    });

                    const kartoffelUsers = await Promise.all(Array.from(usersIds).map((userId) => Kartoffel.getUserById(userId)));
                    const kartoffelUsersMapById = groupBy(kartoffelUsers, (user) => user._id);
                    const formatedEntities = await instanceService.getEntityInstancesByIds(entitiesIds);
                    const formatedEntitiesMapById = groupBy(formatedEntities, (entity) => entity.properties._id);

                    const updatedEntities = await Promise.all(
                        instances.map((entity) => {
                            const entityTemplate = templatesMapById[entity.entity.templateId][0];
                            // for each user field in each instance, check if the user from kartoffel is different in one of the fields of the user in the instance
                            // update the user fields if needed
                            const updatedProperies = checkForEntityToUpdate(entity.entity, entityTemplate, kartoffelUsersMapById);
                            if (Object.keys(updatedProperies).length === 0) return;

                            return instanceService.updateEntityInstance(
                                entity.entity.properties._id,
                                {
                                    ...formatedEntitiesMapById[entity.entity.properties._id][0],
                                    properties: { ...formatedEntitiesMapById[entity.entity.properties._id][0].properties, ...updatedProperies },
                                },
                                [],
                            );
                        }),
                    );

                    logger.debug({ updatedEntities });
                } catch (error) {
                    logger.error('Error syncing kartoffel users:', { error });
                }
            }),
        );
    });
};
