import * as env from 'env-var';
import './dotenv';

const config = {
    entityTemplateManager: {
        uri: env.get('ENTITY_TEMPLATE_MANAGER_URI').required().asString(),
        createEntityTemplateRoute: env.get('CREATE_ENTITY_TEMPLATE_ROUTE').default('api/entities/templates').asString(),
        createCategoryRoute: env.get('CREATE_CATEGORY_ROUTE').default('api/categories').asString(),
    },
    relationshipTemplateManager: {
        uri: env.get('ENTITY_TEMPLATE_MANAGER_URI').required().asString(),
        createrelationshipTemplateRoute: env.get('CREATE_ENTITY_TEMPLATE_ROUTE').default('api/entities/templates').asString(),
    },
    instacnceManager: {
        uri: env.get('INSTANCE_MANAGER_URI').required().asString(),
        createEntityRoute: env.get('CREATE_ENTITY_ROUTE').default('api/entities').asString(),
        maxNumberOfEntities: env.get('MAX_NUMBER_OF_ENTITIES').default(100).asInt(),
        minNumberOfEntities: env.get('MIN_NUMBER_OF_ENTITIES').default(0).asInt(),
    },
};

export default config;
