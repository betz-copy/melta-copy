import env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
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
        stringPropertySuffix: env.get('STRING_PROPERTY_SUFFIX').default('_tostring').asString(),
    },
    templateManager: {
        url: env.get('TEMPLATE_MANAGER_URL').required().asString(),
        getByIdRoute: env.get('TEMPLATE_MANAGER_GET_BY_ID_ROUTE').default('/api/templates/entities').asString(),
        timeout: env.get('TEMPLATE_MANAGER_TIMEOUT').default(5000).asIntPositive(),
    },
    relationshipManager: {
        url: env.get('RELATIONSHIP_MANAGER_URL').required().asString(),
        getByIdRoute: env.get('RELATIONSHIP_MANAGER_GET_BY_ID_ROUTE').default('/api/templates/relationships').asString(),
        timeout: env.get('RELATIONSHIP_MANAGER_TIMEOUT').default(5000).asIntPositive(),
    },
    redis: {
        url: env.get('REDIS_HOST').default('redis://redis:6379').asString(),
        globalSearchKeyName: env.get('GLOBAL_SEARCH_KEY_NAME').default('latestIndex').asString(),
    },
};

export default config;
