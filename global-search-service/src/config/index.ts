import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        maxRequestSize: env.get('MAX_REQUEST_BYTE_SIZE').required().asInt(),
    },
    rabbit: {
        url: env.get('RABBIT_URL').required().asString(),
        retryOptions: {
            minTimeout: env.get('RABBIT_RETRY_MIN_TIMEOUT').default(1000).asIntPositive(),
            retries: env.get('RABBIT_RETRY_RETRIES').default(10).asIntPositive(),
            factor: env.get('RABBIT_RETRY_FACTOR').default(1.8).asFloatPositive(),
        },
        queueName: env.get('RABBIT_QUEUE_NAME').default('search-queue').asString(),
    },
    templateService: {
        url: env.get('TEMPLATE_SERVICE_URL').required().asString(),
        entities: {
            baseRoute: env.get('TEMPLATE_SERVICE_ENTITIES_BASE_ROUTE').default('/api/templates/entities').asString(),
            searchTemplatesRoute: env.get('TEMPLATE_SERVICE_ENTITIES_SEARCH_ROUTE').default('/search').asString(),
        },
        timeout: env.get('TEMPLATE_SERVICE_TIMEOUT').default(5000).asIntPositive(),
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
    logs: {
        format: env.get('LOGGING_DATE_FORMAT').default('YYYY-MM-DD HH:mm:ss').asString(),
        enableApm: env.get('ENABLE_APM').default('true').asBool(),
        apmServerUrl: env.get('APM_SERVER_URL').default('http://apm-server:8200').asString(),
        enableFile: env.get('ENABLE_FILE_LOGGING').default('false').asBool(),
        enableRotateFile: env.get('ENABLE_ROTATE_FILE_LOGGING').default('true').asBool(),
        label: env.get('LOG_LABEL').default('global-search').asString(),
        extraDefault: {
            serviceName: env.get('LOG_SERVICE_NAME').default('global-search-service').asString(),
            environment: env.get('LOG_ENVIRONMENT').default('dev').required().asString(),
        },
        fileSettings: {
            datePattern: env.get('FILE_LOG_DATE_PATTERN').default('YYYY-MM-DD').asString(),
            maxSize: env.get('FILE_LOG_MAX_SIZE').default('3g').asString(),
            maxFiles: env.get('FILE_LOG_MAX_FILES').default(3).asIntPositive(),
            filename: env.get('FILE_LOG_FILENAME').default('log_file.log').asString(),
            dirname: env.get('FILE_LOG_DIRNAME').default('./logs').asString(),
        },
        fileRotateSettings: {
            datePattern: env.get('ROTATE_FILE_LOG_DATE_PATTERN').default('YYYY-MM-DD').asString(),
            maxSize: env.get('ROTATE_FILE_LOG_MAX_SIZE').default('20m').asString(),
            maxFiles: env.get('ROTATE_FILE_LOG_MAX_FILES').default('14d').asString(),
            dirname: env.get('ROTATE_FILE_LOG_DIRNAME').default('./logs').asString(),
        },
    },
};

export default config;
