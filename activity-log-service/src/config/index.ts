import * as env from 'env-var';
import './dotenv';

const BYTE_TO_MB = 1024 * 1024;

const config = {
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
            serviceName: env.get('LOG_SERVICE_NAME').default('activity-log-service').asString(),
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
        url: env.get('MONGO_URL').required().asUrlString(),
        activitiesCollectionName: env.get('MONGO_ACTIVITIES_COLLECTION_NAME').required().default('activities').asString(),
        mongoDuplicateKeyErrorCode: env.get('MONGO_DUPLICATE_KEY_ERROR_CODE').default(11000).asIntPositive(),
        mongoDuplicateErrorName: env.get('MONGO_DUPLICATE_ERROR_NAME').default('MongoServerError').asString(),
        connectionOptions: {
            maxIdleTimeMS: env.get('MONGO_MAX_IDLE_CONNECTION_TIME').default(10000).asIntPositive(),
            socketTimeoutMS: env.get('MONGO_MAX_IDLE_SOCKET_TIME').default(10000).asIntPositive(),
            serverSelectionTimeoutMS: env.get('MONGO_SERVER_SELECTION_TIMEOUT').default(5000).asIntPositive(),
        },
    },
    rabbit: {
        url: env.get('RABBIT_URL').required().asUrlString(),
        queues: {
            activityLogQueue: env.get('ACTIVITY_LOG_QUEUE').default('activity-log-queue').asString(),
            activityLogDelayQueue: env.get('ACTIVITY_LOG_DELAY_QUEUE').default('activity-log-queue.delay').asString(),
        },
        clientRetryOptions: {
            minTimeout: env.get('RABBIT_RETRY_MIN_TIMEOUT').default(1000).asIntPositive(),
            retries: env.get('RABBIT_RETRY_RETRIES').default(10).asIntPositive(),
            factor: env.get('RABBIT_RETRY_FACTOR').default(1.8).asFloatPositive(),
        },
        queueRetryOptions: {
            maxRetries: env.get('RABBIT_QUEUE_MAX_RETRIES').default(3).asIntPositive(),
            queueRetryDelay: env.get('RABBIT_QUEUE_DELAY').default(1000).asIntPositive(),
        },
    },
    throttle: {
        ttl: env.get('THROTTLE_TTL').default(60000).asIntPositive(),
        limit: env.get('THROTTLE_LIMIT').default(100).asIntPositive(),
    },
    memory: {
        heapLimit: env.get('MOMORY_HEAP_LIMIT').default(300).asIntPositive() * BYTE_TO_MB,
        rssLimit: env.get('MOMORY_RSS_LIMIT').default(500).asIntPositive() * BYTE_TO_MB,
    },
    swagger: {
        enabled: env.get('SWAGGER_ENABLED').default('true').asBool(),
        path: env.get('SWAGGER_PATH').default('docs').asString(),
        title: env.get('SWAGGER_TITLE').default('Backend API').asString(),
        description: env.get('SWAGGER_DESCRIPTION').default('API Documentation').asString(),
        version: env.get('SWAGGER_VERSION').default('1.0').asString(),
    },
} as const;

export default config;
