/* eslint-disable no-console */
import { Chance } from 'chance';
import { JSONSchemaFaker } from 'json-schema-faker';
import { createCategories } from './categories';
import config from './config';
import { createEntityTemplates, isEntityTemplateServiceAlive } from './entityTemplates';
import { createGantts } from './gantts';
import { createInstances, createRelationshipInstances, isInstanceServiceAlive } from './instances';
import { categories } from './mocks/categories';
import { entityTemplates } from './mocks/entityTemplates';
import { getPermissionsToCreate } from './mocks/permissionsApi';
import { getProcessTemplateToCreate } from './mocks/processTemplates';
import { relationshipTemplates } from './mocks/relationshipTemplates';
import { getWorkspacesToCreate } from './mocks/workspaces';
import { createUserPermissions, isPermissionServiceAlive } from './permissionsApi';
import { createProcessInstances } from './processInstances';
import { createProcessTemplates, isProcessServiceAlive } from './processTemplate';
import { createRelationshipTemplates, isRelationshipTemplateServiceAlive } from './relationshipTemplates';
import { createRules } from './rules';
import { isStorageServiceAlive, uploadFile } from './storageService';
import { createWorkspaces, getWorkspaces, isWorkpacesServiceAlive } from './workspaces';

const main = async () => {
    console.log(`Mock started ${JSON.stringify(config, null, 4)}`);

    const { err: workspacesServiceAliveErr } = await isWorkpacesServiceAlive();
    if (workspacesServiceAliveErr) {
        console.log('Workspace Service is not alive');
        throw workspacesServiceAliveErr;
    }

    // check only root workspace (which is created automatically) exists
    if ((await getWorkspaces()).length !== 1) {
        console.log('DB not empty');
        return;
    }

    const { err: entityTemplateServiceAliveErr } = await isEntityTemplateServiceAlive();
    if (entityTemplateServiceAliveErr) {
        console.log('Entity Template Service is not alive');
        throw entityTemplateServiceAliveErr;
    }

    const { err: processServiceAliveErr } = await isProcessServiceAlive();
    if (processServiceAliveErr) {
        console.log('Process Service is not alive');
        throw processServiceAliveErr;
    }

    const { err: relationshipTemplateServiceAliveErr } = await isRelationshipTemplateServiceAlive();
    if (relationshipTemplateServiceAliveErr) {
        console.log('Relationship Template Service is not alive');
        throw relationshipTemplateServiceAliveErr;
    }

    const { err: permissionServiceAliveErr } = await isPermissionServiceAlive();
    if (permissionServiceAliveErr) {
        console.log('Permission Service is not alive');
        throw permissionServiceAliveErr;
    }

    const { err: instanceServiceAliveErr } = await isInstanceServiceAlive();
    if (instanceServiceAliveErr) {
        console.log('Instance Service is not alive');
        throw instanceServiceAliveErr;
    }

    const { err: storageServiceAliveErr } = await isStorageServiceAlive();
    if (storageServiceAliveErr) {
        console.log('Storage Service is not alive');
        throw storageServiceAliveErr;
    }

    console.log('All services alive!');

    const seed = config.seed ?? Math.floor(Math.random() * 1000);
    console.log(`Picked seed ${seed}`);

    const chance = new Chance(seed);
    JSONSchemaFaker.option({ random: () => chance.floating({ min: 0, max: 0.9999, fixed: 4 }) });

    console.log('Creating workspaces');

    const mainWorkspace = await createWorkspaces(getWorkspacesToCreate());

    console.log('Creating categories');

    const createdCategories = await createCategories(mainWorkspace._id, categories);

    console.log('Creating entity templates');

    const createdEntityTemplates = await createEntityTemplates(mainWorkspace._id, entityTemplates, createdCategories);

    console.log('Creating relationshipTemplates templates');

    const createdRelationshipTemplates = await createRelationshipTemplates(mainWorkspace._id, relationshipTemplates, createdEntityTemplates);

    console.log('Creating rules');

    await createRules(mainWorkspace._id, createdEntityTemplates, createdRelationshipTemplates);

    console.log('Creating permissions');

    await createUserPermissions(getPermissionsToCreate(mainWorkspace._id, createdCategories));

    console.log('Creating example file');

    const exampleFileId = await uploadFile(mainWorkspace._id);

    console.log('Creating entities');

    const createdEntityInstances = await createInstances(mainWorkspace._id, createdEntityTemplates, chance, exampleFileId);

    console.log('Creating relationships');

    await createRelationshipInstances(mainWorkspace._id, createdEntityInstances, createdRelationshipTemplates, chance);

    console.log('Creating process templates');

    const createdProcessTemplates = await createProcessTemplates(mainWorkspace._id, getProcessTemplateToCreate(chance));

    console.log('Creating process Instances');

    await createProcessInstances(mainWorkspace._id, createdProcessTemplates, chance, exampleFileId);

    console.log('Creating gantts');

    await createGantts(chance, mainWorkspace._id, createdEntityTemplates, createdRelationshipTemplates);

    console.log('Finished');
};

main();
