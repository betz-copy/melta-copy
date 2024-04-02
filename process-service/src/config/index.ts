import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
        maxRequestSize: env.get('MAX_REQUEST_BYTE_SIZE').required().asInt(),
    },
    mongo: {
        url: env.get('MONGO_URL').required().asString(),
        processTemplatesCollectionName: env.get('MONGO_PROCESS_TEMPLATES_COLLECTION_NAME').required().asString(),
        processInstancesCollectionName: env.get('MONGO_PROCESS_INSTANCES_COLLECTION_NAME').required().asString(),
        stepTemplatesCollectionName: env.get('MONGO_STEP_TEMPLATES_COLLECTION_NAME').required().asString(),
        stepInstancesCollectionName: env.get('MONGO_STEP_INSTANCES_COLLECTION_NAME').required().asString(),
    },
    processFields: {
        name: env.get('PROCESS_FIELDS_NAME').default('name').asString(),
        displayName: env.get('PROCESS_FIELDS_DISPLAY_NAME').default('displayName').asString(),
        details: env.get('PROCESS_FIELDS_DETAILS').default('details').asString(),
        steps: env.get('PROCESS_FIELDS_STEPS').default('steps').asString(),
    },
    stepFields: {
        templateId: env.get('STEP_FIELDS_TEMPLATE_ID').default('templateId').asString(),
        reviewers: env.get('STEP_FIELDS_REVIEWERS').default('reviewers').asString(),
    },
    logs: {
        format: env.get('LOGGING_DATE_FORMAT').default('YYYY-MM-DD HH:mm:ss').asString(),
        enableFile: env.get('ENABLE_FILE_LOGGING').default('false').asBool(),
        enableRotateFile: env.get('ENABLE_ROTATE_FILE_LOGGING').default('true').asBool(),
        extraDefault: {
            serviceName: env.get('LOG_SERVICE_NAME').default('process-service').asString(),
            environment: env.get('LOG_ENVIRONMENT').default('dev').asString(),
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
