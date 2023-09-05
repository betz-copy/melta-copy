/* eslint-disable no-console */
import { Chance } from 'chance';
import { JSONSchemaFaker } from 'json-schema-faker';
import config from './config';
import { createCategories, getCategories } from './categories';
import { createEntityTemplates, isEntityTemplateManagerAlive } from './entityTemplates';
import { categories } from './mocks/categories';
import { entityTemplates } from './mocks/entityTemplates';
import { createInstances, createRelationshipInstances, isInstanceManagerAlive } from './instances';
import { createRelationshipTemplates, isRelationshipTemplateManagerAlive } from './relationshipTemplates';
import { relationshipTemplates } from './mocks/relationshipTemplates';
import { createPermissionsBulk, isPermissionsApiAlive } from './permissionsApi';
import { getPermissionsToCreate } from './mocks/permissionsApi';
import { createRules } from './rules';
import { createProcessTemplates, isProcessServiceAlive } from './processTemplate';
import { getProcessTemplateToCreate } from './mocks/processTemplates';
import { createProcessInstances } from './processInstances';
import { isStorageServiceAlive, uploadFile } from './storageService';
import { createGantts } from './gantts';

const main = async () => {
    console.log(`Mock started ${JSON.stringify(config, null, 4)}`);

    const { err: entityTemplateManagerAliveErr } = await isEntityTemplateManagerAlive();
    if (entityTemplateManagerAliveErr) {
        console.log('Entity Template Manager is not alive');
        throw entityTemplateManagerAliveErr;
    }

    const { err: processServiceAliveErr } = await isProcessServiceAlive();
    if (processServiceAliveErr) {
        console.log('Process Service is not alive');
        throw processServiceAliveErr;
    }

    const { err: relationshipTemplateManagerAliveErr } = await isRelationshipTemplateManagerAlive();
    if (relationshipTemplateManagerAliveErr) {
        console.log('Relationship Template Manager is not alive');
        throw relationshipTemplateManagerAliveErr;
    }

    const { err: permissionsApiAliveErr } = await isPermissionsApiAlive();
    if (permissionsApiAliveErr) {
        console.log('Permissions API is not alive');
        throw permissionsApiAliveErr;
    }

    const { err: instanceManagerAliveErr } = await isInstanceManagerAlive();
    if (instanceManagerAliveErr) {
        console.log('Instance Manager is not alive');
        throw instanceManagerAliveErr;
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

    await createGantts(createdEntityTemplates, createdRelationshipTemplates);

    console.log('Finished');
};

main();
