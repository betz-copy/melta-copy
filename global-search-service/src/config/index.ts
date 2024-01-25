import * as env from 'env-var';
import './dotenv';

const config = {
    rabbit: {
        url: env.get('RABBIT_URL').required().asString(),
        retryOptions: {
            minTimeout: env.get('RABBIT_RETRY_MIN_TIMEOUT').default(1000).asIntPositive(),
            retries: env.get('RABBIT_RETRY_RETRIES').default(10).asIntPositive(),
            factor: env.get('RABBIT_RETRY_FACTOR').default(1.8).asFloatPositive(),
        },
        queueName: env.get('RABBIT_QUEUE_NAME').default('search-queue').asString(),
    },
    entityTemplateService: {
        url: env.get('ENTITY_TEMPLATE_SERVICE_URL').required().asString(),
        baseRoute: env.get('ENTITY_TEMPLATE_SERVICE_BASE_ROUTE').default('/api/templates/entities').asString(),
        searchTemplatesRoute: env.get('ENTITY_TEMPLATE_SERVICE_SEARCH_ROUTE').default('/search').asString(),
        timeout: env.get('ENTITY_TEMPLATE_SERVICE_TIMEOUT').default(5000).asIntPositive(),
    },
    neo4j: {
        url: env.get('NEO4J_URL').default('neo4j://localhost').asString(),
        auth: {
            username: env.get('NEO4J_USERNAME').default('neo4j').asString(),
            password: env.get('NEO4J_PASSWORD').default('test').asString(),
        },
        database: env.get('NEO4J_DATABASE').default('neo4j').asString(),
        connectionRetries: env.get('NEO4J_CONNECTION_RETRIES').default(5).asIntPositive(),
        connectionRetryDelay: env.get('NEO4J_CONNECTION_RETRY_DELAY').default(3000).asIntPositive(),
        globalSearchIndexes: env.get('NEO4J_GLOBAL_SEARCH_INDEXES').default('primaryGlobalSearch,secondaryGlobalSearch').asArray(),
        templateSearchIndexPrefixes: env.get('NEO4J_TEMPLATE_SEARCH_INDEX_PREFIXES').default('primaryGlobalSearch_,secondaryGlobalSearch_').asArray(),
        stringPropertySuffix: env.get('STRING_PROPERTY_SUFFIX').default('_tostring').asString(),
    },
    redis: {
        url: env.get('REDIS_HOST').default('redis://redis:6379').asString(),
        globalSearchKeyName: env.get('REDIS_GLOBAL_SEARCH_KEY_NAME').default('latestIndex').asString(),
        templateSearchKeyNamePrefix: env.get('REDIS_TEMPLATE_SEARCH_KEY_NAME_PREFIX').default('latestIndex_').asString(),
    },
};

export default config;
