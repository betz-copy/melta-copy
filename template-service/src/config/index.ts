import env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
        maxRequestSize: env.get('MAX_REQUEST_BYTE_SIZE').required().asInt(),
        workspaceIdHeaderName: env.get('WORKSPACE_ID_HEADER_NAME').default('workspace-id').asString(),
    },
    notifications: {
        dateAlertOptions: env.get('DATE_NOTIFICATIONS_OPTIONS').default('1, 7, 14, 30, 90, 180').asArray(',').map(Number),
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
            maxIdleTimeMS: env.get('MONGO_MAX_IDLE_CONNECTION_TIME').default(10000).asIntPositive(), // Maximum time (in ms) that a connection can be idle before being closed
            socketTimeoutMS: env.get('MONGO_MAX_IDLE_SOCKET_TIME').default(10000).asIntPositive(), // Maximum idle time for an active connection
        },
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
    ajvCustomFormats: {
        fileIdFieldRegex: env.get('FILE_ID_FIELD_REGEX').default('.*').asRegExp(),
        textAreaFieldRegex: env.get('TEXT_AREA_FIELD_REGEX').default('.*').asRegExp(),
        relationshipReferenceFieldRegex: env.get('RELATIONSHIP_REFERENCE_FIELD_REGEX').default('.*').asRegExp(),
        locationFieldRegex: env.get('LOCATION_FIELD_REGEX').default('.*').asRegExp(),
    },
    logs: {
        format: env.get('LOGGING_DATE_FORMAT').default('YYYY-MM-DD HH:mm:ss').asString(),
        enableFile: env.get('ENABLE_FILE_LOGGING').default('false').asBool(),
        enableRotateFile: env.get('ENABLE_ROTATE_FILE_LOGGING').default('true').asBool(),
        label: env.get('LOG_LABEL').default('template').asString(),
        extraDefault: {
            serviceName: env.get('LOG_SERVICE_NAME').default('template-service').asString(),
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
