import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
        uploadsFolderPath: env.get('UPLOADS_FOLDER_PATH').default('public/uploads/').asString(),
        supportedFilesTypes: env.get('SUPPORTED_FILES_TYPES').default(['png']).asJsonArray(),
    },
    mongo: {
        uri: env.get('MONGO_URI').required().asUrlString(),
        entityTemplateCollectionName: env.get('MONGO_ENTITY_TEMPLATE_COLLECTION_NAME').required().asString(),
        categoryCollectionName: env.get('MONGO_CATEGORY_COLLECTION_NAME').required().asString(),
    },
    relationshipTemplateManager: {
        uri: env.get('RELATIONSHIP_TEMPLATE_MANAGER_URI').required().asString(),
        getByIdRoute: env.get('RELATIONSHIP_TEMPLATE_MANAGER_GET_BY_ID_ROUTE').default('/api/relationships/templates/').asString(),
        getManyRoute: env.get('RELATIONSHIP_TEMPLATE_MANAGER_GET_MANY_ROUTE').default('/api/relationships/templates/').asString(),
    },
    storageService: {
        uri: env.get('STORAGE_SERVICE_URI').required().asString(),
        uploadFileRoute: env.get('STORAGE_SERVICE_UPLOAD_FILE_ROUTE').required().asString(),
        downloadFileRoute: env.get('STORAGE_SERVICE_DOWNLOAD_FILE_ROUTE').required().asString(),
        deleteFileRoute: env.get('STORAGE_SERVICE_DELETE_FILE_ROUTE').required().asString(),
    },
    rabbit: {
        uri: env.get('RABBIT_URI').required().asUrlString(),
        retryOptions: {
            minTimeout: env.get('RABBIT_RETRY_MIN_TIMEOUT').default(1000).asIntPositive(),
            retries: env.get('RABBIT_RETRY_RETRIES').default(10).asIntPositive(),
            factor: env.get('RABBIT_RETRY_FACTOR').default(1.8).asFloatPositive(),
        },
        queueName: env.get('QUEUE_NAME').default('searchQueue').asString(),
    },
};

export default config;
