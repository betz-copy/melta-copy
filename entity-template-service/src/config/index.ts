import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
    },
    mongo: {
        uri: env.get('MONGO_URI').required().asUrlString(),
        entityTemplateCollectionName: env.get('MONGO_ENTITY_TEMPLATE_COLLECTION_NAME').required().asString(),
        categoryCollectionName: env.get('MONGO_CATEGORY_COLLECTION_NAME').required().asString(),
    },
    relationshipTemplateManager: {
        uri: env.get('RELATIONSHIP_TEMPLATE_MANAGER_URI').required().asString(),
        getByIdRoute: env.get('RELATIONSHIP_TEMPLATE_MANAGER_GET_BY_ID_ROUTE').default('/api/relationships/templates/').asString(),
        getManyRoute: env.get('RELATIONSHIP_TEMPLATE_MANAGER_GET_MANY_ROUTE').default('/api/relationships/templates/').asString(),
    },
};

export default config;
