import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        workspaceIdHeaderName: env.get('WORKSPACE_ID_HEADER_NAME').default('workspace-id').asString(),
        serviceName: env.get('SERVICE_NAME').default('shared-service').asString(),
        environment: env.get('ENVIRONMENT').default('dev').required().asString(),
        version: env.get('SERVICE_VERSION').default('1.0.0').asString(),
        port: env.get('PORT').default('3000').asPortNumber(),
    },
    minio: {
        url: env.get('MINIO_ENDPOINT').default('localhost').asString(),
        port: env.get('MINIO_PORT').default(9000).asPortNumber(),
        accessKey: env.get('MINIO_ACCESS_KEY').default('minioadmin').asString(),
        secretKey: env.get('MINIO_SECRET_KEY').default('minioadmin').asString(),
        bucketName: env.get('MINIO_BUCKET_NAME').default('bucket').asString(),
        useSSL: false,
        transportAgent: {
            timeout: env.get('TRANSPORT_AGENT_TIMEOUT').default(60000).asIntPositive(),
            maxSockets: env.get('TRANSPORT_AGENT_MAX_SOCKETS').default(1000).asIntPositive(),
            keepAlive: env.get('TRANSPORT_AGENT_KEEP_ALIVE').default(1).asBool(),
            keepAliveMsecs: env.get('TRANSPORT_AGENT_KEEP_ALIVE_MSECS').default(1000).asIntPositive(),
        },
        useDevBucket: env.get('USE_DEV_BUCKETS').default('false').asBool(),
        devBucketPrefix: env.get('DEV_BUCKET_PREFIX').default('dev-').asString(),
    },
    logs: {
        format: env.get('LOGGING_DATE_FORMAT').default('YYYY-MM-DD HH:mm:ss').asString(),
        enableFile: env.get('ENABLE_FILE_LOGGING').default('false').asBool(),
        enableRotateFile: env.get('ENABLE_ROTATE_FILE_LOGGING').default('true').asBool(),
        label: env.get('LOG_LABEL').default('global-search').asString(),
        enableConsole: env.get('ENABLE_CONSOLE_LOGGING').default('true').asBool(),
        extraDefault: {
            serviceName: env.get('LOG_SERVICE_NAME').default('shared-service').asString(),
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
    requestHeaders: {
        correlationIdHeader: env.get('CORRELATION_ID_HEADER_NAME').default('x-correlation-id').asString(),
        workspaceIdHeader: env.get('WORKSPACE_ID_HEADER_NAME').default('workspace-id').asString(),
        contentLengthHeader: env.get('CONTENT_LENGTH_HEADER_NAME').default('content-length').asString(),
    },
    mongo: {
        mongoDuplicateKeyErrorCode: env.get('MONGO_DUPLICATE_KEY_ERROR_CODE').default(11000).asIntPositive(),
        mongoDuplicateErrorName: env.get('MONGO_DUPLICATE_ERROR_NAME').default('MongoServerError').asString(),
        connectionOptions: {
            maxIdleTimeMS: env.get('MONGO_MAX_IDLE_CONNECTION_TIME').default(10000).asIntPositive(),
            socketTimeoutMS: env.get('MONGO_MAX_IDLE_SOCKET_TIME').default(10000).asIntPositive(),
            serverSelectionTimeoutMS: env.get('MONGO_SERVER_SELECTION_TIMEOUT').default(5000).asIntPositive(),
        },
    },
};

export default config;
