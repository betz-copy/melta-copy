/* eslint-disable no-console */
import { Chance } from 'chance';
import { JSONSchemaFaker } from 'json-schema-faker';
import config from './config';
import { createCategories, getCategories } from './templates/categories';
import { createEntityTemplates } from './templates/entityTemplates';
import { categories } from './mocks/categories';
import { entityTemplates } from './mocks/entityTemplates';
import { createInstances, createRelationshipInstances, isInstanceServiceAlive } from './instances';
import { createRelationshipTemplates } from './templates/relationshipTemplates';
import { relationshipTemplates } from './mocks/relationshipTemplates';
import { createPermissionsBulk, isPermissionServiceAlive } from './permissionsApi';
import { getPermissionsToCreate } from './mocks/permissionsApi';
import { createRules } from './templates/rules';
import { createProcessTemplates, isProcessServiceAlive } from './processTemplate';
import { getProcessTemplateToCreate } from './mocks/processTemplates';
import { createProcessInstances } from './processInstances';
import { isStorageServiceAlive, uploadFile } from './storageService';
import { createGantts } from './gantts';
import { isTemplateServiceAlive } from './templates';

const main = async () => {
    console.log(`Mock started ${JSON.stringify(config, null, 4)}`);

    const { err: templateServiceAliveErr } = await isTemplateServiceAlive();
    if (templateServiceAliveErr) {
        console.log('Entity Template Service is not alive');
        throw templateServiceAliveErr;
    }

    const { err: processServiceAliveErr } = await isProcessServiceAlive();
    if (processServiceAliveErr) {
        console.log('Process Service is not alive');
        throw processServiceAliveErr;
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

    if ((await getCategories()).length !== 0) {
        console.log('DB not empty');
        return;
    }

    console.log('All services alive!');

    const seed = config.seed ?? Math.floor(Math.random() * 1000);
    console.log(`Picked seed ${seed}`);

    const chance = new Chance(seed);
    JSONSchemaFaker.option({ random: () => chance.floating({ min: 0, max: 0.9999, fixed: 4 }) });

    console.log('Creating categories');

    const createdCategories = await createCategories(categories);

    console.log('Creating entity templates');

    const createdEntityTemplates = await createEntityTemplates(entityTemplates, createdCategories);

    console.log('Creating relationshipTemplates templates');

    const createdRelationshipTemplates = await createRelationshipTemplates(relationshipTemplates, createdEntityTemplates);

    console.log('Creating rules');

    await createRules(createdEntityTemplates, createdRelationshipTemplates);

    console.log('Creating permissions');

    await createPermissionsBulk(getPermissionsToCreate(createdCategories));

    console.log('Creating example file');

    const exampleFileId = await uploadFile();

    console.log('Creating entities');

    const createdEntityInstances = await createInstances(createdEntityTemplates, chance, exampleFileId);

    console.log('Creating relationships');

    await createRelationshipInstances(createdEntityInstances, createdRelationshipTemplates, chance);

    console.log('Creating process templates');

    const createdProcessTemplates = await createProcessTemplates(getProcessTemplateToCreate(chance));

    console.log('Creating process Instances');

    await createProcessInstances(createdProcessTemplates, chance, exampleFileId);

    console.log('Creating gantts');

    await createGantts(chance, createdEntityTemplates, createdRelationshipTemplates);

    console.log('Finished');
};

main();
