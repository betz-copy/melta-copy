import env from 'env-var';
import './dotenv.js';

const config = {
    mongo: {
        uri: env.get('MONGO_URI').default('mongodb://localhost:27017').required().asString(),
        permissionsCollection: env.get('PERMISSIONS_COLLECTION').default('permissions').required().asString(),
        globalDatabase: env.get('GLOBAL_DATABASE').default('global').required().asString(),
        templatesCollection: env.get('TEMPLATES_COLLECTION').default('entity-templates').required().asString(),
        categoriesCollection: env.get('CATEGORIES_COLLECTION').default('categories').required().asString(),
        configsCollection: env.get('CONFIGS_COLLECTION').default('configs').required().asString(),
    },
    neo: {
        uri: env.get('NEO_URI').default('bolt://localhost:7687').required().asString(),
        user: env.get('NEO_USER').default('neo4j').required().asString(),
        password: env.get('PASSWORD').default('test1234').required().asString(),
    },
};

export default config;
