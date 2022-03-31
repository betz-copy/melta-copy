/* eslint-disable no-console */
import config from './config';
import { createCategories, getCategories } from './categories';
import { createEntityTemplates } from './entityTemplates';
import { categories } from './mocks/categories';
import { entityTemplates } from './mocks/entityTemplates';
import { createInstances, createRelationshipInstances } from './instances';
import { createRealtionshipTemplates } from './relationshipTemplates';
import { relationshipTemplates } from './mocks/relationshipTemplates';

const main = async () => {
    console.log(`Mock started ${JSON.stringify(config, null, 4)}`);

    if ((await getCategories()).length !== 0) {
        console.log('DB not empty');
        return;
    }

    console.log('Createing categories');

    const createdCategories = await createCategories(categories);

    console.log('Createing entity templates');

    const createdEntityTemplates = await createEntityTemplates(entityTemplates, createdCategories);

    console.log('Createing relationshipTemplates templates');

    const createdRelationshipTemplates = await createRealtionshipTemplates(relationshipTemplates, createdEntityTemplates);

    console.log('Createing entities');

    const createdEntityInstances = await createInstances(createdEntityTemplates);

    await createRelationshipInstances(createdEntityInstances, createdRelationshipTemplates);

    console.log('Finished');
};

main().catch((err) => console.error(err));
