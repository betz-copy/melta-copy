import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
    },
    mongo: {
        uri: env.get('MONGO_URI').required().asString(),
        processTemplateCollectionName: env.get('MONGO_PROCESS_TEMPLATE_COLLECTION_NAME').required().asString(),
        processInstanceCollectionName: env.get('MONGO_PROCESS_INSTANCE_COLLECTION_NAME').required().asString(),
        stepTemplateCollectionName: env.get('MONGO_STEP_TEMPLATE_COLLECTION_NAME').required().asString(),
        stepInstanceCollectionName: env.get('MONGO_STEP_INSTANCE_COLLECTION_NAME').required().asString(),
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
