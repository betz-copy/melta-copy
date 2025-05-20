import 'dotenv/config';
import * as env from 'env-var';

const config = {
    service: {
        port: env.get('PORT').default(8000).asPortNumber(),
        workspaceIdHeaderName: env.get('WORKSPACE_ID_HEADER_NAME').default('workspace-id').asString(),
        maxFileSize: env.get('MAX_FILE_BYTE_SIZE').required().asInt(),
        maxRequestSize: env.get('MAX_REQUEST_BYTE_SIZE').required().asInt(),
    },
    minio: {
        url: env.get('MINIO_ENDPOINT').default('localhost').asString(),
        port: env.get('MINIO_PORT').default(9000).asPortNumber(),
        accessKey: env.get('MINIO_ACCESS_KEY').default('minioadmin').asString(),
        secretKey: env.get('MINIO_SECRET_KEY').default('minioadmin').asString(),
        bucketName: env.get('MINIO_BUCKET_NAME').default('bucket').asString(),
        useSSL: false,
        useDevBucket: env.get('USE_DEV_BUCKETS').default('false').asBool(),
        devBucketPrefix: env.get('DEV_BUCKET_PREFIX').default('dev-').asString(),
    },
    logs: {
        format: env.get('LOGGING_DATE_FORMAT').default('YYYY-MM-DD HH:mm:ss').asString(),
        enableFile: env.get('ENABLE_FILE_LOGGING').default('false').asBool(),
        enableRotateFile: env.get('ENABLE_ROTATE_FILE_LOGGING').default('true').asBool(),
        label: env.get('LOG_LABEL').default('preview').asString(),
        extraDefault: {
            serviceName: env.get('LOG_SERVICE_NAME').default('preview-service').asString(),
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
    },
    document: {
        previewPrefix: env.get('DOCUMENT_PREVIEW_PREFIX').default('preview').asString(),
        previewFileType: env.get('DOCUMENT_PREVIEW_FILE_TYPE').default('.pdf').asString(),
    },
};

export default config;
