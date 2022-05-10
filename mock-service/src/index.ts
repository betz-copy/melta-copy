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

const main = async () => {
    console.log(`Mock started ${JSON.stringify(config, null, 4)}`);

    if ((await isEntityTemplateManagerAlive()).err) {
        console.log('Entity Template Manager is not alive');
        return;
    }

    if ((await isRelationshipTemplateManagerAlive()).err) {
        console.log('Relationship Template Manager is not alive');
        return;
    }

    if ((await isPermissionsApiAlive()).err) {
        console.log('Permissions API is not alive');
        return;
    }

    if ((await isInstanceManagerAlive()).err) {
        console.log('Instance Manager is not alive');
        return;
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

    console.log('Creating permissions');

    await createPermissionsBulk(getPermissionsToCreate(createdCategories));

    console.log('Creating entities');

    const createdEntityInstances = await createInstances(createdEntityTemplates);

    await createRelationshipInstances(createdEntityInstances, createdRelationshipTemplates);

    console.log('Finished');
};

main().catch((err) => console.error(err));
