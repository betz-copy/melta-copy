import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
    },
    mongo: {
        uri: env.get('MONGO_URI').required().asString(),
        relationshipTemplateCollectionName: env.get('MONGO_RELATIONSHIP_TEMPLATE_COLLECTION_NAME').required().asString(),
    },
    entityTemplateManager: {
        uri: env.get('ENTITY_TEMPLATE_MANAGER_URI').required().asString(),
        getByIdRoute: env.get('ENTITY_TEMPLATE_MANAGER_ROUTE_GET_BY_ID_ROUTE').default('/api/entities/templates/').asString(),
    },
};

export default config;
