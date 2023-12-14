import env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
        systemUnavailableURL: env.get('SYSTEM_UNAVAILABLE_URL').required().asString(),
        uploadsFolderPath: env.get('UPLOADS_FOLDER_PATH').default('public/uploads/').asString(),
        maxFileSize: env.get('MAX_FILE_SIZE').default(50000000).asInt(),
        searchEntitiesChunkSize: env.get('SEARCH_ENTITIES_CHUNK_SIZE').default(500).asIntPositive(),
        excelFilePath: env.get('EXCEL_FILE_PATH').default('/usr/src/app').asString(),
        dateAlertTime: env.get('DATE_ALERT_TIME').default('0 0 * * *').asString(),
    },
    authentication: {
        isRequired: env.get('IS_AUTHENTICATION_REQUIRED').default('true').asBool(),
        mockAuthenticatedUserId: env.get('MOCK_AUTHENTICATED_USER_ID').default('5e5688324203fc40043591aa').asString(), // niky adidas
        shragaAuthentication: {
            tokenSecret: env.get('TOKEN_SECRET').required().asString(),
            callbackURL: env.get('CALLBACK_URL').required().asString(),
            shragaURL: env.get('SHRAGA_URL').required().asString(),
            useEnrichId: env.get('USE_ENRICH_ID').default('true').asBool(),
            accessTokenName: env.get('ACCESS_TOKEN_NAME').required().asString(),
            accessTokenExpirationTime: env.get('ACCESS_TOKEN_EXPIRATION_TIME').default('1d').asString(),
        },
        basicAuthentication: {
            // userId must be users of kartoffel with permissions in our permissions-api DB
            // for example: [{"userId": "5e5688324203fc40043591aa", "password": "noamisgod"}, {"userId": "5e5689514203fc40043591ae", "password":"iamtapuz"}]
            users: env.get('BASIC_AUTHENTICATION_USERS').required().asJsonArray() as Array<{ userId: string; password: string }>,
        },
    },
    entityTemplateManager: {
        uri: env.get('ENTITY_TEMPLATE_MANAGER_URI').required().asString(),
        baseEntitiesRoute: env.get('ENTITY_TEMPLATE_MANAGER_ENTITIES_BASE_ROUTE').default('/api/templates/entities').asString(),
        baseCategoriesRoute: env.get('ENTITY_TEMPLATE_MANAGER_CATEGORIES_BASE_ROUTE').default('/api/templates/categories').asString(),
        requestTimeout: env.get('ENTITY_TEMPLATE_MANAGER_REQUEST_TIMEOUT').default(10000).asIntPositive(),
    },
    relationshipTemplateManager: {
        uri: env.get('RELATIONSHIP_TEMPLATE_MANAGER_URI').required().asString(),
        baseRelationshipsRoute: env.get('RELATIONSHIP_TEMPLATE_MANAGER_BASE_RELATIONSHIPS_ROUTE').default('/api/templates/relationships').asString(),
        baseRulesRoute: env.get('RELATIONSHIP_TEMPLATE_MANAGER_BASE_RULES_ROUTE').default('/api/templates/rules').asString(),
        updateRuleStatusByIdRouteSuffix: env.get('RELATIONSHIP_TEMPLATE_MANAGER_UPDATE_RULE_STATUS_BY_ID_ROUTE_SUFFIX').default('/status').asString(),
        requestTimeout: env.get('RELATIONSHIP_TEMPLATE_MANAGER_REQUEST_TIMEOUT').default(10000).asIntPositive(),
    },
    storageService: {
        uri: env.get('STORAGE_SERVICE_URI').required().asString(),
        uploadFileRoute: env.get('STORAGE_SERVICE_UPLOAD_FILE_ROUTE').default('api/files').asString(),
        uploadFilesRoute: env.get('STORAGE_SERVICE_UPLOAD_FILES_ROUTE').default('api/files/bulk').asString(),
        downloadFileRoute: env.get('STORAGE_SERVICE_DOWNLOAD_FILE_ROUTE').default('api/files').asString(),
        deleteFileRoute: env.get('STORAGE_SERVICE_DELETE_FILE_ROUTE').default('api/files').asString(),
        deleteFilesRoute: env.get('STORAGE_SERVICE_DELETE_FILES_ROUTE').default('api/files/delete-bulk').asString(),
        duplicateFilesRoute: env.get('STORAGE_SERVICE_DUPLICATE_FILES_ROUTE').default('api/files/duplicate-bulk').asString(),
        fileHyperLink: env.get('STORAGE_SERVICE_FILE_HYPER_LINK').required().asString(),
        fileIdLength: env.get('STORAGE_SERVICE_FILE_ID_LENGTH').default(32).asIntPositive(),
    },
    instanceManager: {
        uri: env.get('INSTANCE_MANAGER_URI').required().asString(),
        baseEntitiesRoute: env.get('INSTANCE_MANAGER_BASE_ENTITIES_ROUTE').default('/api/instances/entities').asString(),
        baseRelationshipsRoute: env.get('INSTANCE_MANAGER_BASE_RELATIONSHIPS_ROUTE').default('/api/instances/relationships').asString(),
        baseConstraintsRoute: env.get('INSTANCE_MANAGER_BASE_CONSTRAINTS_ROUTE').default('/api/instances/entities/constraints').asString(),
        searchOfTemplateRoute: env.get('INSTANCE_MANAGER_SEARCH_OF_TEMPLATE_ROUTE').default('/search/template').asString(),
        requestTimeout: env.get('INSTANCE_MANAGER_REQUEST_TIMEOUT').default(10000).asIntPositive(),
    },
    permissionApi: {
        baseUrl: env.get('PERMISSION_API_BASE_URL').required().asString(),
        baseRoute: env.get('PERMISSION_API_BASE_ROUTE').default('/api/permissions').asString(),
        checkAuthorizationRoute: env.get('PERMISSION_API_CHECK_AUTHERIZATION_ROUTE').default('authorization').asString(),
        requestTimeout: env.get('PERMISSION_API_REQUEST_TIMEOUT').default(10000).asIntPositive(),
    },
    activityLog: {
        uri: env.get('ACTIVITY_LOG_URI').required().asString(),
        baseRoute: env.get('ACTIVITY_LOG_BASE_ROUTE').default('/api/activity-log').asString(),
        requestTimeout: env.get('ACTIVITY_LOG_REQUEST_TIMEOUT').default(10000).asIntPositive(),
    },
    notificationService: {
        uri: env.get('NOTIFICATION_SERVICE_URI').required().asString(),
        baseRoute: env.get('NOTIFICATION_SERVICE_BASE_ROUTE').default('/api/notifications').asString(),
        requestTimeout: env.get('NOTIFICATION_SERVICE_REQUEST_TIMEOUT').default(10000).asIntPositive(),
    },
    ruleBreachService: {
        uri: env.get('RULE_BREACH_SERVICE_URI').required().asString(),
        baseRoute: env.get('RULE_BREACH_SERVICE_BASE_ROUTE').default('/api/rule-breaches').asString(),
        requestTimeout: env.get('RULE_BREACH_SERVICE_REQUEST_TIMEOUT').default(10000).asIntPositive(),
    },
    processService: {
        uri: env.get('PROCESS_SERVICE_URI').required().asString(),
        templatesBaseRoute: env.get('PROCESSES_TEMPLATES_BASE_ROUTE').default('/api/processes/templates').asString(),
        instancesBaseRoute: env.get('PROCESSES_INSTANCES_BASE_ROUTE').default('/api/processes/instances').asString(),
        requestTimeout: env.get('PROCESS_SERVICE_REQUEST_TIMEOUT').default(10000).asIntPositive(),
        internalSearchPullLimit: env.get('PROCESS_SERVICE_INTERNAL_SEARCH_PULL_LIMIT').default(1000).asIntPositive(),
    },
    ganttsService: {
        uri: env.get('GANTTS_SERVICE_URI').required().asString(),
        baseRoute: env.get('GANTTS_SERVICE_BASE_ROUTE').default('/api/gantts').asString(),
        requestTimeout: env.get('GANTTS_SERVICE_REQUEST_TIMEOUT').default(10000).asIntPositive(),
    },
    previewService: {
        uri: env.get('PREVIEW_SERVICE_URI').required().asString(),
        baseRoute: env.get('PREVIEW_SERVICE_BASE_ROUTE').default('/api/preview').asString(),
        requestTimeout: env.get('PREVIEW_SERVICE_REQUEST_TIMEOUT').default(10000).asIntPositive(),
    },
    getUsersLimitForPermissionsOfUsers: env.get('GET_USERS_LIMIT_FOR_PERMISSIONS_OF_USERS').default(20).asIntPositive(),
    kartoffel: {
        baseUrl: env.get('KARTOFFEL_BASE_URL').required().asString(),
        baseEntitiesRoute: env.get('KARTOFFEL_BASE_ENTITIES_ROUTE').default('/api/entities').asString(),
        requestTimeout: env.get('KARTOFFEL_REQUEST_TIMEOUT').default(10000).asIntPositive(),
        identifierRoute: env.get('KARTOFFEL_FIND_USER_BY_IDENTIFIER_ROUTE').default('/identifier').asString(),
        digitalIdentityRoute: env.get('KARTOFFEL_FIND_USER_BY_DIGITAL_IDENTITY_ROUTE').default('/digitalIdentity').asString(),
        idRoute: env.get('KARTOFFEL_FIND_USER_BY_ID_ROUTE').default('').asString(),
        fullNameRoute: env.get('KARTOFFEL_SEARCH_USER_BY_FULLNAME_ROUTE').default('/search').asString(),
    },
    errorCodes: {
        categoryHasTemplates: 'CATEGORY_HAS_TEMPLATES',
        entityTemplateHasOutgoingRelationships: 'TEMPLATE_HAS_OUTGOING_RELATIONSHIPS',
        entityTemplateHasIncomingRelationships: 'TEMPLATE_HAS_INCOMING_RELATIONSHIPS',
        entityTemplateHasInstances: 'ENTITY_TEMPLATE_HAS_INSTANCES',
        relationshipTemplateHasInstances: 'RELATIONSHIP_TEMPLATE_HAS_INSTANCES',
        relationshipTemplateHasRules: 'RELATIONSHIP_TEMPLATE_HAS_RULES',
        ruleBlock: 'RULE_BLOCK',
        ruleHasAlertsOrRequests: 'RULE_HAS_ALERTS_OR_REQUESTS',
    },
    rabbit: {
        uri: env.get('RABBIT_URI').required().asUrlString(),
        retryOptions: {
            minTimeout: env.get('RABBIT_RETRY_MIN_TIMEOUT').default(1000).asIntPositive(),
            retries: env.get('RABBIT_RETRY_RETRIES').default(10).asIntPositive(),
            factor: env.get('RABBIT_RETRY_FACTOR').default(1.8).asFloatPositive(),
        },
        notificationQueue: env.get('NOTIFICATION_QUEUE_NAME').default('notifications-queue').asString(),
    },
};

export default config;
