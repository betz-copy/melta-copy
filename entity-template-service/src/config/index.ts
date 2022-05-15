import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
        supportedFilesTypes: env.get('SUPPORTED_FILES_TYPES').default(['png']).asJsonArray(),
    },
    mongo: {
        uri: env.get('MONGO_URI').required().asUrlString(),
        entityTemplateCollectionName: env.get('MONGO_ENTITY_TEMPLATE_COLLECTION_NAME').required().asString(),
        categoryCollectionName: env.get('MONGO_CATEGORY_COLLECTION_NAME').required().asString(),
    },
    relationshipTemplateManager: {
        uri: env.get('RELATIONSHIP_TEMPLATE_MANAGER_URI').required().asString(),
        baseRoute: env.get('RELATIONSHIP_TEMPLATE_MANAGER_BASE_ROUTE').default('/api/templates/relationships').asString(),
        searchRoute: env.get('RELATIONSHIP_TEMPLATE_MANAGER_SEARCH_ROUTE').default('/search').asString(),
    },
    rabbit: {
        uri: env.get('RABBIT_URI').required().asUrlString(),
        retryOptions: {
            minTimeout: env.get('RABBIT_RETRY_MIN_TIMEOUT').default(1000).asIntPositive(),
            retries: env.get('RABBIT_RETRY_RETRIES').default(10).asIntPositive(),
            factor: env.get('RABBIT_RETRY_FACTOR').default(1.8).asFloatPositive(),
        },
        queueName: env.get('QUEUE_NAME').default('search-queue').asString(),
    },
};

export default config;
