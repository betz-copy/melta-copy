import * as env from 'env-var';
import './dotenv';

const config = {
    rabbit: {
        uri: env.get('RABBIT_URI').required().asString(),
        retryOptions: {
            minTimeout: env.get('RABBIT_RETRY_MIN_TIMEOUT').default(1000).asIntPositive(),
            retries: env.get('RABBIT_RETRY_RETRIES').default(10).asIntPositive(),
            factor: env.get('RABBIT_RETRY_FACTOR').default(1.8).asFloatPositive(),
        },
        queueName: env.get('RABBIT_QUEUE_NAME').default('search-queue').asString(),
    },
    templateManager: {
        url: env.get('TEMPLATE_MANAGER_URL').required().asString(),
        getTemplatesRoute: env.get('TEMPLATE_MANAGER_GET_TEMPLATES_ROUTE').default('/api/entities/templates').asString(),
        timeout: env.get('TEMPLATE_MANAGER_TIMEOUT').default(5000).asIntPositive(),
    },
    neo4j: {
        url: env.get('NEO4J_URL').default('neo4j://localhost').asUrlString(),
        auth: {
            username: env.get('NEO4J_USERNAME').default('neo4j').asString(),
            password: env.get('NEO4J_PASSWORD').default('test').asString(),
        },
        database: env.get('NEO4J_DATABASE').default('neo4j').asString(),
        connectionRetries: env.get('NEO4J_CONNECTION_RETRIES').default(5).asIntPositive(),
        connectionRetryDelay: env.get('NEO4J_CONNECTION_RETRY_DELAY').default(3000).asIntPositive(),
        globalSearchIndexes: env.get('NEO4J_GLOBAL_SEARCH_INDEXES').default('primaryGlobalSearch,secondaryGlobalSearch').asArray(),
    },
    redis: {
        url: env.get('REDIS_HOST').default('redis://redis:6379').asString(),
        globalSearchKeyName: env.get('GLOBAL_SEARCH_KEY_NAME').default('latestIndex').asString(),
    },
};

export default config;
