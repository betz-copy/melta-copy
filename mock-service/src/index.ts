/* eslint-disable no-console */
import config from './config';
import { createCategories } from './categories';
import { createEntityTemplates } from './entityTemplates';
import { categories } from './mocks/categories';
import { entityTemplates } from './mocks/entityTemplates';
import { createInstances } from './instances';

const main = async () => {
    console.log(`Mock started ${JSON.stringify(config, null, 4)}`);

    const createdCategories = await createCategories(categories);

    const createdEntityTemplates = await createEntityTemplates(entityTemplates, createdCategories);

    const createdInstances = await createInstances(createdEntityTemplates);

    console.log(createdInstances);
};

main().catch((err) => console.error(err));
