import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
        systemUnavailableURL: env.get('SYSTEM_UNAVAILABLE_URL').required().asString(),
        uploadsFolderPath: env.get('UPLOADS_FOLDER_PATH').default('public/uploads/').asString(),
    },
    authentication: {
        tokenSecret: env.get('TOKEN_SECRET').required().asString(),
        isRequired: env.get('IS_AUTHENTICATION_REQUIRED').default('true').asBool(),
        callbackURL: env.get('CALLBACK_URL').required().asString(),
        shragaURL: env.get('SHRAGA_URL').required().asString(),
        useEnrichId: env.get('USE_ENRICH_ID').default('true').asBool(),
        sessionSecret: env.get('SESSION_SECRET').default('secret').asString(),
        shragaTokenSecret: env.get('SHRAGA_TOKEN_SECRET').default('secret').asString(),
        accessTokenName: env.get('ACCESS_TOKEN_NAME').required().asString(),
        accessTokenExpirationTime: env.get('ACCESS_TOKEN_EXPIRATION_TIME').default('1d').asString(),
    },
    entityTemplateManager: {
        uri: env.get('ENTITY_TEMPLATE_MANAGER_URI').required().asString(),
        baseEntitiesRoute: env.get('ENTITY_TEMPLATE_MANAGER_ENTITIES_BASE_ROUTE').default('/api/templates/entities').asString(),
        baseCategoriesRoute: env.get('ENTITY_TEMPLATE_MANAGER_CATEGORIES_BASE_ROUTE').default('/api/templates/categories').asString(),
        requestTimeout: env.get('ENTITY_TEMPLATE_MANAGER_REQUEST_TIMEOUT').default(10000).asIntPositive(),
    },
    relationshipTemplateManager: {
        uri: env.get('RELATIONSHIP_TEMPLATE_MANAGER_URI').required().asString(),
        baseRoute: env.get('RELATIONSHIP_TEMPLATE_MANAGER_BASE_ROUTE').default('/api/templates/relationships').asString(),
        requestTimeout: env.get('RELATIONSHIP_TEMPLATE_MANAGER_REQUEST_TIMEOUT').default(10000).asIntPositive(),
    },
    storageService: {
        uri: env.get('STORAGE_SERVICE_URI').required().asString(),
        uploadFileRoute: env.get('STORAGE_SERVICE_UPLOAD_FILE_ROUTE').default('api/files').asString(),
        uploadFilesRoute: env.get('STORAGE_SERVICE_UPLOAD_FILES_ROUTE').default('api/files/bulk').asString(),
        downloadFileRoute: env.get('STORAGE_SERVICE_DOWNLOAD_FILE_ROUTE').default('api/files').asString(),
        deleteFileRoute: env.get('STORAGE_SERVICE_DELETE_FILE_ROUTE').default('api/files').asString(),
        deleteFilesRoute: env.get('STORAGE_SERVICE_DELETE_FILES_ROUTE').default('api/files/delete-bulk').asString(),
    },
    instanceManager: {
        uri: env.get('INSTANCE_MANAGER_URI').required().asString(),
        baseEntitiesRoute: env.get('INSTANCE_MANAGER_BASE_ENTITIES_ROUTE').default('/api/instances/entities').asString(),
        baseRelationshipsRoute: env.get('INSTANCE_MANAGER_BASE_RELATIONSHIPS_ROUTE').default('/api/instances/relationships').asString(),
        requestTimeout: env.get('INSTANCE_MANAGER_REQUEST_TIMEOUT').default(10000).asIntPositive(),
    },
    permissionApi: {
        baseUrl: env.get('PERMISSION_API_BASE_URL').required().asString(),
        baseRoute: env.get('PERMISSION_API_BASE_ROUTE').default('/api/permissions').asString(),
        checkAuthorizationRoute: env.get('PERMISSION_API_CHECK_AUTHERIZATION_ROUTE').default('authorization').asString(),
        requestTimeout: env.get('PERMISSION_API_REQUEST_TIMEOUT').default(10000).asIntPositive(),
    },
    getUsersLimitForPermissionsOfUsers: env.get('GET_USERS_LIMIT_FOR_PERMISSIONS_OF_USERS').default(20).asIntPositive(),
    kartoffel: {
        baseUrl: env.get('KARTOFFEL_BASE_URL').required().asString(),
        baseEntitiesRoute: env.get('KARTOFFEL_BASE_ENTITIES_ROUTE').default('/api/entities').asString(),
        searchRoute: env.get('KARTOFFEL_SEARCH_ENTITIES').default('/search').asString(),
        requestTimeout: env.get('KARTOFFEL_REQUEST_TIMEOUT').default(10000).asIntPositive(),
    },
};

export default config;
