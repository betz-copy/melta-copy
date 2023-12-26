import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
    },
    mongo: {
        uri: env.get('MONGO_URI').required().asString(),
        relationshipTemplateCollectionName: env.get('MONGO_RELATIONSHIP_TEMPLATE_COLLECTION_NAME').required().asString(),
        ruleCollectionName: env.get('MONGO_RULE_COLLECTION_NAME').required().asString(),
    },
    entityTemplateManager: {
        uri: env.get('ENTITY_TEMPLATE_MANAGER_URI').required().asString(),
        baseEntitiesRoute: env.get('ENTITY_TEMPLATE_MANAGER_ENTITIES_BASE_ROUTE').default('/api/templates/entities').asString(),
        requestTimeout: env.get('ENTITY_TEMPLATE_MANAGER_REQUEST_TIMEOUT').default(10000).asIntPositive(),
    },
};

export default config;
