import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
        workspaceIdHeaderName: env.get('WORKSPACE_ID_HEADER_NAME').default('workspace-id').asString(),
        maxRequestSize: env.get('MAX_REQUEST_BYTE_SIZE').required().asInt(),
    },
    mongo: {
        url: env.get('MONGO_URL').required().asString(),
        ruleBreachAlertsCollectionName: env.get('MONGO_RULE_BREACH_ALERTS_COLLECTION_NAME').default('rule-breach-alerts').asString(),
        ruleBreachRequestsCollectionName: env.get('MONGO_RULE_BREACH_REQUESTS_COLLECTION_NAME').default('rule-breach-requests').asString(),
        connectionOptions: {
            maxIdleTimeMS: env.get('MONGO_MAX_IDLE_CONNECTION_TIME').default(10000).asIntPositive(), // Maximum time (in ms) that a connection can be idle before being closed
            socketTimeoutMS: env.get('MONGO_MAX_IDLE_SOCKET_TIME').default(10000).asIntPositive(), // Maximum idle time for an active connection
        },
    },
    logs: {
        format: env.get('LOGGING_DATE_FORMAT').default('YYYY-MM-DD HH:mm:ss').asString(),
        enableApm: env.get('ENABLE_APM').default('false').asBool(),
        apmServerUrl: env.get('APM_SERVER_URL').default('http://apm-server:8200').asString(),
        enableFile: env.get('ENABLE_FILE_LOGGING').default('false').asBool(),
        enableRotateFile: env.get('ENABLE_ROTATE_FILE_LOGGING').default('true').asBool(),
        label: env.get('LOG_LABEL').default('rule-breach').asString(),
        extraDefault: {
            serviceName: env.get('LOG_SERVICE_NAME').default('rule-breash-service').asString(),
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
