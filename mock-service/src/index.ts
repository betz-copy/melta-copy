/* eslint-disable no-console */
import config from './config';
import { createCategories, getCategories } from './categories';
import { createEntityTemplates } from './entityTemplates';
import { categories } from './mocks/categories';
import { entityTemplates } from './mocks/entityTemplates';
import { createInstances } from './instances';

const main = async () => {
    console.log(`Mock started ${JSON.stringify(config, null, 4)}`);

    if ((await getCategories()).length === 0) {
        console.log('DB not empty');
        return;
    }

    console.log('Createing categories');

    const createdCategories = await createCategories(categories);

    console.log('Createing entity templates');

    const createdEntityTemplates = await createEntityTemplates(entityTemplates, createdCategories);

    console.log('Createing entities');

    await createInstances(createdEntityTemplates);

    console.log('Finished');
};

main().catch((err) => console.error(err));
