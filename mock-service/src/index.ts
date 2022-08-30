/* eslint-disable no-console */
import config from './config';
import { createCategories, getCategories } from './categories';
import { createEntityTemplates, isEntityTemplateManagerAlive } from './entityTemplates';
import { categories } from './mocks/categories';
import { entityTemplates } from './mocks/entityTemplates';
import { createInstances, createRelationshipInstances, isInstanceManagerAlive } from './instances';
import { createRealtionshipTemplates, isRelationshipTemplateManagerAlive } from './relationshipTemplates';
import { relationshipTemplates } from './mocks/relationshipTemplates';
import { createPermissionsBulk, isPermissionsApiAlive } from './permissionsApi';
import { getPermissionsToCreate } from './mocks/permissionsApi';
import { createRules } from './rules';

const main = async () => {
    console.log(`Mock started ${JSON.stringify(config, null, 4)}`);

    const { err: entityTemplateManagerAliveErr } = await isEntityTemplateManagerAlive();
    if (entityTemplateManagerAliveErr) {
        console.log('Entity Template Manager is not alive');
        throw entityTemplateManagerAliveErr;
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

    if ((await getCategories()).length !== 0) {
        console.log('DB not empty');
        return;
    }

    console.log('All services alive!');

    console.log('Creating categories');

    const createdCategories = await createCategories(categories);

    console.log('Creating entity templates');

    const createdEntityTemplates = await createEntityTemplates(entityTemplates, createdCategories);

    console.log('Creating relationshipTemplates templates');

    const createdRelationshipTemplates = await createRealtionshipTemplates(relationshipTemplates, createdEntityTemplates);

    console.log('Creating rules');

    await createRules(createdEntityTemplates, createdRelationshipTemplates);

    console.log('Creating permissions');

    await createPermissionsBulk(getPermissionsToCreate(createdCategories));

    console.log('Creating entities');

    const createdEntityInstances = await createInstances(createdEntityTemplates);

    await createRelationshipInstances(createdEntityInstances, createdRelationshipTemplates);

    console.log('Finished');
};

main();
