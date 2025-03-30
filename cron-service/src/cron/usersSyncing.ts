import config from '../config';
import { WorkspaceTypes } from '../workspaces/inteface';
import { InstancesService } from '../services/instance';
import { WorkspaceManager } from '../workspaces/manager';
import logger from '../utils/logger/logsLogger';
import * as schedule from 'node-schedule';
import { groupBy, Dictionary } from 'lodash';
import { Kartoffel } from '../services/kartoffel';
import { IEntity } from '../instance/entity/interface';
import { IKartoffelUser } from '../services/kartoffel/interface';

const { userFieldsSync } = config;

const checkForEntityToUpdate = (entity: IEntity, kartoffelUsersMapById: Dictionary<IKartoffelUser[]>) => {
    const expandedUsersFields: Record<string, string[]> = {};
    // const userDefaultFields = userFieldsSync.userOriginalAndSuffixFieldsMap; // TODO: sync also those fields?
    const propertiesToUpdate = {};

    Object.entries(entity.properties).forEach(([key, value]) => {
        if (key.includes('id_userField')) {
            expandedUsersFields[`${key.split('.')[0]}_${value}`] = [];
        }
    });

    Object.keys(expandedUsersFields).forEach((userFieldKeyAndId) => {
        const userFieldKey = userFieldKeyAndId.split('_')[0];
        console.log({ userFieldKey });
        expandedUsersFields[userFieldKeyAndId] = Object.keys(entity.properties).filter((key) => key.startsWith(`userprefix_${userFieldKey}_`));
    });

    Object.entries(expandedUsersFields).forEach(([userFieldKey, expandedFields]) => {
        expandedFields.forEach((expandedField) => {
            const userId = userFieldKey.split('_')[1];
            const updatedKartoffelUserField = kartoffelUsersMapById[userId][0][expandedField.split('_')[2]];
            console.log({
                updatedKartoffelUserField,
                expandedField,
                splitedExpandedField: expandedField.split('_')[2],
                kartoffelUser: kartoffelUsersMapById[userId],
            });
            if (updatedKartoffelUserField !== entity.properties[expandedField]) {
                propertiesToUpdate[expandedField] = updatedKartoffelUserField;
            }
        });
    });

    return propertiesToUpdate;
};

export const checkForUsersToSync = async () => {
    schedule.scheduleJob(userFieldsSync.usersSyncTime, async () => {
        logger.info('Checking for users to sync...');
        const workspaceIds = await WorkspaceManager.getWorkspaceIds(WorkspaceTypes.mlt);
        console.log({ workspaceIdsCount: workspaceIds.length });

        await Promise.all(
            workspaceIds.map(async (workspaceId) => {
                const instancesService = new InstancesService(workspaceId);
                const usersIds = new Set<string>();

                try {
                    // get all the entity instances that have user field
                    const instances = await instancesService.searchEntitiesWithUserFields();
                    console.log({ instances, workspaceId });

                    // collect all the users ids from the instances
                    const entitiesIds: string[] = [];
                    instances.forEach((entity) => {
                        entitiesIds.push(entity.properties._id);
                        Object.entries(entity.properties).forEach(([key, value]) => {
                            if (key.includes('id_userField')) usersIds.add(value);
                        });
                    });

                    const kartoffelUsers = await Promise.all(Array.from(usersIds).map((userId) => Kartoffel.getUserById(userId)));
                    const kartoffelUsersMapById = groupBy(kartoffelUsers, (user) => user._id);
                    const formatedEntities = await instancesService.getEntityInstancesByIds(entitiesIds);
                    const formatedEntitiesMapById = groupBy(formatedEntities, (entity) => entity.properties._id);

                    const updatedEntities = await Promise.all(
                        instances.map((entity) => {
                            const updatedProperies = checkForEntityToUpdate(entity, kartoffelUsersMapById);
                            console.log({ updatedProperies });
                            if (Object.keys(updatedProperies).length === 0) {
                                console.log('nothing to update');
                                return;
                            }

                            return instancesService.updateEntityInstance(
                                entity.properties._id,
                                {
                                    ...formatedEntitiesMapById[entity.properties._id][0],
                                    properties: { ...formatedEntitiesMapById[entity.properties._id][0].properties, ...updatedProperies },
                                },
                                [],
                                'aa',
                            );
                        }),
                    );

                    logger.debug({ updatedEntities });

                    // for each user field in each instance, check if the user from kartoffel is different in one of the fields of the user in the instance
                    // update the user fields if needed
                } catch (error) {
                    logger.error('Error checking date notifications:', { error });
                }
            }),
        );
    });
};

// TODO: lir - handle delete user field
