import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
    },
    mongo: {
        url: env.get('MONGO_URL').required().asString(),
        relationshipTemplatesCollectionName: env.get('MONGO_RELATIONSHIP_TEMPLATES_COLLECTION_NAME').required().asString(),
        ruleCollectionName: env.get('MONGO_RULES_COLLECTION_NAME').required().asString(),
    },
    entityTemplateService: {
        url: env.get('ENTITY_TEMPLATE_SERVICE_URL').required().asString(),
        baseEntitiesRoute: env.get('ENTITY_TEMPLATE_SERVICE_ENTITIES_BASE_ROUTE').default('/api/templates/entities').asString(),
        requestTimeout: env.get('ENTITY_TEMPLATE_SERVICE_REQUEST_TIMEOUT').default(10000).asIntPositive(),
    },
    errorCodes: {
        failedToDeleteField: 'FAILED_DELETE_FIELD',
    },
};

export default config;
