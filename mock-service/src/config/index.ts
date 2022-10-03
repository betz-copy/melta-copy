import * as env from 'env-var';
import './dotenv';

const config = {
    permissionsApi: {
        uri: env.get('PERMISSIONS_API_URI').required().asString(),
        baseRoute: env.get('PERMISSIONS_API_BASE_ROUTE').default('/api/permissions').asString(),
        isAliveRoute: env.get('PERMISSIONS_API_ALIVE_ROUTE').default('/isAlive').asString(),
        kartoffelIds: env.get('KARTOFFEL_IDS').required().asArray(),
    },
    entityTemplateManager: {
        uri: env.get('ENTITY_TEMPLATE_MANAGER_URI').required().asString(),
        isAliveRoute: env.get('CATEGORY_IS_ALIVE_ROUTE').default('/isAlive').asString(),
        createEntityTemplateRoute: env.get('CREATE_ENTITY_TEMPLATE_ROUTE').default('/api/templates/entities').asString(),
        createCategoryRoute: env.get('CREATE_CATEGORY_ROUTE').default('/api/templates/categories').asString(),
    },
    relationshipTemplateManager: {
        uri: env.get('RELATIONSHIP_TEMPLATE_MANAGER_URI').required().asString(),
        isAliveRoute: env.get('RELATIONSHIP_TEMPLATE_MANAGER_IS_ALIVE_ROUTE').default('/isAlive').asString(),
        createRelationshipTemplateRoute: env.get('CREATE_RELATIONSHIP_TEMPLATE_ROUTE').default('/api/templates/relationships').asString(),
        createRuleRoute: env.get('CREATE_RULE_ROUTE').default('/api/templates/rules').asString(),
    },
    instacnceManager: {
        uri: env.get('INSTANCE_MANAGER_URI').required().asString(),
        isAliveRoute: env.get('INSTANCE_MANAGER_IS_ALIVE_ROUTE').default('/isAlive').asString(),
        createEntityRoute: env.get('CREATE_ENTITY_ROUTE').default('/api/instances/entities').asString(),
        maxNumberOfEntities: env.get('MAX_NUMBER_OF_ENTITIES').default(100).asInt(),
        minNumberOfEntities: env.get('MIN_NUMBER_OF_ENTITIES').default(1).asInt(),
        createRelationshipRoute: env.get('CREATE_RELATIONSHIP_ROUTE').default('/api/instances/relationships').asString(),
        maxNumberOfRelationships: env.get('MAX_NUMBER_OF_RELATIONSHIPS').default(100).asInt(),
        minNumberOfRelationships: env.get('MIN_NUMBER_OF_RELATIONSHIPS').default(0).asInt(),
    },
    requestLimit: env.get('REQUEST_LIMIT').default(10).asInt(),
};

export default config;
