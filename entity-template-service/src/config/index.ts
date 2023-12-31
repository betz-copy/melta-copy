import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
    },
    mongo: {
        url: env.get('MONGO_URL').required().asString(),
        entityTemplatesCollectionName: env.get('MONGO_ENTITY_TEMPLATES_COLLECTION_NAME').required().asString(),
        categoriesCollectionName: env.get('MONGO_CATEGORIES_COLLECTION_NAME').required().asString(),
    },
    relationshipTemplateService: {
        url: env.get('RELATIONSHIP_TEMPLATE_SERVICE_URL').required().asString(),
        baseRoute: env.get('RELATIONSHIP_TEMPLATE_SERVICE_BASE_ROUTE').default('/api/templates/relationships').asString(),
        searchRoute: env.get('RELATIONSHIP_TEMPLATE_SERVICE_SEARCH_ROUTE').default('/search').asString(),
    },
    rabbit: {
        url: env.get('RABBIT_URL').required().asUrlString(),
        retryOptions: {
            minTimeout: env.get('RABBIT_RETRY_MIN_TIMEOUT').default(1000).asIntPositive(),
            retries: env.get('RABBIT_RETRY_RETRIES').default(10).asIntPositive(),
            factor: env.get('RABBIT_RETRY_FACTOR').default(1.8).asFloatPositive(),
        },
        updateSearchIndexQueueName: env.get('UPDATE_SEARCH_INDEX_QUEUE_NAME').default('search-queue').asString(),
    },
};

export default config;
