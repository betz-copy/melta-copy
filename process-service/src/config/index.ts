import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
        dbHeaderName: env.get('DB_HEADER_NAME').default('dbName').asString(),
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
};

export default config;
