import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
        maxRequestSize: env.get('MAX_REQUEST_BYTE_SIZE').required().asInt(),
        workspaceIdHeaderName: env.get('WORKSPACE_ID_HEADER_NAME').default('workspace-id').asString(),
    },
    server: {
        port: env.get('PORT').required().asPortNumber(),
        maxRequestSize: env.get('MAX_REQUEST_BYTE_SIZE').required().default('50mb').asString(),
        workspaceIdHeader: env.get('WORKSPACE_ID_HEADER_NAME').default('workspace-id').asString(),
        retryCountHeader: env.get('RETRY_COUNT_HEADER_NAME').default('retry-count').asString(),
        correlationIdHeader: env.get('CORRELATION_ID_HEADER_NAME').default('x-correlation-id').asString(),
        contentLengthHeader: env.get('CONTENT_LENGTH_HEADER_NAME').default('content-length').asString(),
        paths: {
            base: env.get('BASE_PATH').default('/').asString(),
            health: env.get('HEALTH_PATH').default('/health').asString(),
        },
    },
    logger: {
        format: env.get('LOGGING_DATE_FORMAT').default('YYYY-MM-DD HH:mm:ss').asString(),
        enableRotateFile: env.get('ENABLE_ROTATE_FILE_LOGGING').default('true').asBool(),
        enableConsole: env.get('ENABLE_CONSOLE_LOGGING').default('true').asBool(),
        extraDefault: {
            serviceName: env.get('LOG_SERVICE_NAME').default('template-service').asString(),
            environment: env.get('LOG_ENVIRONMENT').default('dev').asString(),
        },
        fileRotateSettings: {
            datePattern: env.get('ROTATE_FILE_LOG_DATE_PATTERN').default('YYYY-MM-DD').asString(),
            maxSize: env.get('ROTATE_FILE_LOG_MAX_SIZE').default('20m').asString(),
            maxFiles: env.get('ROTATE_FILE_LOG_MAX_FILES').default('14d').asString(),
            dirname: env.get('ROTATE_FILE_LOG_DIRNAME').default('./logs').asString(),
        },
        consoleSettings: {
            format: env.get('CONSOLE_LOG_FORMAT').default('YYYY-MM-DD HH:mm:ss').asString(),
            level: env
                .get('CONSOLE_LOG_LEVEL')
                .default('info')
                .asEnum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'] as const),
            colorize: env.get('CONSOLE_LOG_COLORIZE').default('true').asBool(),
            prettyPrint: env.get('CONSOLE_LOG_PRETTY_PRINT').default('true').asBool(),
        },
    },
    mongo: {
        url: env.get('MONGO_URL').required().asString(),
        relationshipTemplatesCollectionName: env.get('MONGO_RELATIONSHIP_TEMPLATES_COLLECTION_NAME').required().asString(),
        printingTemplatesCollectionName: env.get('MONGO_PRINTING_TEMPLATES_COLLECTION_NAME').required().asString(),
        ruleCollectionName: env.get('MONGO_RULES_COLLECTION_NAME').required().asString(),
        entityTemplatesCollectionName: env.get('MONGO_ENTITY_TEMPLATES_COLLECTION_NAME').required().asString(),
        childTemplatesCollectionName: env.get('MONGO_CHILD_TEMPLATES_COLLECTION_NAME').required().asString(),
        categoriesCollectionName: env.get('MONGO_CATEGORIES_COLLECTION_NAME').required().asString(),
        configsCollectionName: env.get('MONGO_CONFIGS_COLLECTION_NAME').required().asString(),
        connectionOptions: {
            maxIdleTimeMS: env.get('MONGO_MAX_IDLE_CONNECTION_TIME').default(10000).asIntPositive(),
            socketTimeoutMS: env.get('MONGO_MAX_IDLE_SOCKET_TIME').default(10000).asIntPositive(),
        },
    },
    rabbit: {
        url: env.get('RABBIT_URL').required().asUrlString(),
        queues: {
            updateSearchIndexQueue: env.get('UPDATE_SEARCH_INDEX_QUEUE_NAME').default('search-queue').asString(),
        },
        updateSearchIndexQueueName: env.get('UPDATE_SEARCH_INDEX_QUEUE_NAME').default('search-queue').asString(),
        retryOptions: {
            minTimeout: env.get('RABBIT_RETRY_MIN_TIMEOUT').default(1000).asIntPositive(),
            retries: env.get('RABBIT_RETRY_RETRIES').default(10).asIntPositive(),
            factor: env.get('RABBIT_RETRY_FACTOR').default(1.8).asFloatPositive(),
        },
        clientRetryOptions: {
            minTimeout: env.get('RABBIT_CLIENT_RETRY_MIN_TIMEOUT').default(1000).asIntPositive(),
            retries: env.get('RABBIT_CLIENT_RETRY_RETRIES').default(10).asIntPositive(),
            factor: env.get('RABBIT_CLIENT_RETRY_FACTOR').default(1.8).asFloatPositive(),
        },
        queueRetryOptions: {
            queueRetryDelay: env.get('RABBIT_QUEUE_RETRY_DELAY').default(1000).asIntPositive(),
            maxRetries: env.get('RABBIT_QUEUE_MAX_RETRIES').default(3).asIntPositive(),
        },
    },
    throttle: {
        ttl: env.get('THROTTLE_TTL').default(60000).asIntPositive(),
        limit: env.get('THROTTLE_LIMIT').default(100).asIntPositive(),
    },
    swagger: {
        enabled: env.get('SWAGGER_ENABLED').default('true').asBool(),
        path: env.get('SWAGGER_PATH').default('docs').asString(),
        title: env.get('SWAGGER_TITLE').default('Template Service API').asString(),
        description: env.get('SWAGGER_DESCRIPTION').default('API for managing entity templates, relationships, categories, and rules').asString(),
        version: env.get('SWAGGER_VERSION').default('1.0').asString(),
    },
    ajvCustomFormats: {
        fileIdFieldRegex: env.get('FILE_ID_FIELD_REGEX').default('.*').asRegExp(),
        textAreaFieldRegex: env.get('TEXT_AREA_FIELD_REGEX').default('.*').asRegExp(),
        relationshipReferenceFieldRegex: env.get('RELATIONSHIP_REFERENCE_FIELD_REGEX').default('.*').asRegExp(),
        locationFieldRegex: env.get('LOCATION_FIELD_REGEX').default('.*').asRegExp(),
    },
    notifications: {
        dateAlertOptions: env.get('DATE_NOTIFICATIONS_OPTIONS').default('1,7,14,30,90,180').asArray(',').map(Number),
    },
    kartoffel: {
        url: env.get('KARTOFFEL_BASE_URL').required().asString(),
        baseEntitiesRoute: env.get('KARTOFFEL_BASE_ENTITIES_ROUTE').default('/api/entities').asString(),
        requestTimeout: env.get('KARTOFFEL_REQUEST_TIMEOUT').default(10000).asIntPositive(),
        maxPageSize: env.get('KARTOFFEL_MAX_PAGE_SIZE').default(10000).asIntPositive(),
    },
};

export default config;
