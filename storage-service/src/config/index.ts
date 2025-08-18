import 'dotenv/config';
import * as env from 'env-var';
import fileExtension from './documentExtension';

const config = {
    busboy: {
        fileKeyName: 'file',
        filesKeyName: 'files',
    },
    service: {
        port: env.get('PORT').default(8000).asPortNumber(),
        meltaBaseUrl: env.get('SYSTEM_MELTA_BASE_URL').required().asString(),
        workspaceIdHeaderName: env.get('WORKSPACE_ID_HEADER_NAME').default('workspace-id').asString(),
        maxFileSize: env.get('MAX_FILE_BYTE_SIZE').required().asInt(),
        maxRequestSize: env.get('MAX_REQUEST_BYTE_SIZE').required().asInt(),
        highWaterMark: env
            .get('HIGH_WATER_MARK')
            .default(600 * 1024 * 1024)
            .asInt(),
    },
    minio: {
        url: env.get('MINIO_ENDPOINT').default('localhost').asString(),
        port: env.get('MINIO_PORT').default(9000).asPortNumber(),
        accessKey: env.get('MINIO_ACCESS_KEY').default('minioadmin').asString(),
        secretKey: env.get('MINIO_SECRET_KEY').default('minioadmin').asString(),
        bucketName: env.get('MINIO_BUCKET_NAME').default('bucket').asString(),
        usersGlobalBucketName: env.get('MINIO_USERS_BUCKET_NAME').default('users-global-bucket').asString(),
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
        label: env.get('LOG_LABEL').default('storage').asString(),
        extraDefault: {
            serviceName: env.get('LOG_SERVICE_NAME').default('storage-service').asString(),
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
    rabbit: {
        url: env.get('RABBIT_URL').required().asUrlString(),
        retryOptions: {
            minTimeout: env.get('RABBIT_RETRY_MIN_TIMEOUT').default(1000).asIntPositive(),
            retries: env.get('RABBIT_RETRY_RETRIES').default(10).asIntPositive(),
            factor: env.get('RABBIT_RETRY_FACTOR').default(1.8).asFloatPositive(),
        },
        previewQueue: env.get('PREVIEW_QUEUE_NAME').default('preview-queue').asString(),
        deleteUnusedFilesQueue: env.get('DELETE_UNUSED_FILES_QUEUE_NAME').default('delete-unused-files-queue').asString(),
    },
    document: {
        previewPrefix: env.get('DOCUMENT_PREVIEW_PREFIX').default('preview').asString(),
        previewFileType: env.get('DOCUMENT_PREVIEW_FILE_TYPE').default('.pdf').asString(),
        documentType: env.get('DOCUMENT_PREVIEW_FILE_TYPE').default(fileExtension.document.join(',')).asArray(),
        uuidLength: env.get('FILE_UUID_LENGTH').default(32).asInt(),
    },
};

export default config;
