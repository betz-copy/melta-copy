import env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
        meltaBaseUrl: env.get('SYSTEM_MELTA_BASE_URL').required().asString(),
        systemUnavailableURL: env.get('SYSTEM_UNAVAILABLE_URL').required().asString(),
        uploadsFolderPath: env.get('UPLOADS_FOLDER_PATH').default('public/uploads/').asString(),
        maxFileSize: env.get('MAX_FILE_BYTE_SIZE').required().asInt(),
        maxRequestSize: env.get('MAX_REQUEST_BYTE_SIZE').required().asInt(),
        searchEntitiesChunkSize: env.get('SEARCH_ENTITIES_CHUNK_SIZE').default(50).asIntPositive(),
        excelFilePath: env.get('EXCEL_FILE_PATH').default('/usr/src/app').asString(),
        maxPatchIterations: env.get('MAX_PATCH_ITERATIONS').default(100).asIntPositive(),
        jewishDateIndicator: env.get('JEWISH_DATE_INDICATOR').default('_jewish_date').asString(),
        hebrewDateIndicator: env.get('HEBREW_DATE_INDICATOR').default('_hebrew_date').asString(),
        docxHeaders: env.get('DOCX_HEADERS').default({
            headers: {
                Accept: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            },
        }).asJsonObject,
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
            // for example: [{"userId": "5e5688324203fc40043591aa", "password": "noamisgod"}]
            users: env.get('BASIC_AUTHENTICATION_USERS').required().asJsonArray() as Array<{ userId: string; password: string }>,
        },
    },
    templateService: {
        url: env.get('TEMPLATE_SERVICE_URL').required().asString(),
        entities: {
            baseEntitiesRoute: env.get('TEMPLATE_SERVICE_ENTITIES_BASE_ROUTE').default('/api/templates/entities').asString(),
            baseCategoriesRoute: env.get('TEMPLATE_SERVICE_CATEGORIES_BASE_ROUTE').default('/api/templates/categories').asString(),
        },
        relationships: {
            baseRelationshipsRoute: env.get('TEMPLATE_SERVICE_RELATIONSHIPS_BASE_ROUTE').default('/api/templates/relationships').asString(),
            baseRulesRoute: env.get('TEMPLATE_SERVICE_RELATIONSHIPS_RULES_BASE_ROUTE').default('/api/templates/rules').asString(),
            updateRuleStatusByIdRouteSuffix: env
                .get('TEMPLATE_SERVICE_RELATIONSHIPS_UPDATE_RULE_STATUS_BY_ID_ROUTE_SUFFIX')
                .default('/status')
                .asString(),
        },
        requestTimeout: env.get('ENTITY_TEMPLATE_SERVICE_REQUEST_TIMEOUT').default(50000).asIntPositive(),
    },
    storageService: {
        url: env.get('STORAGE_SERVICE_URL').required().asString(),
        uploadFileRoute: env.get('STORAGE_SERVICE_UPLOAD_FILE_ROUTE').default('api/files').asString(),
        uploadFilesRoute: env.get('STORAGE_SERVICE_UPLOAD_FILES_ROUTE').default('api/files/bulk').asString(),
        downloadFileRoute: env.get('STORAGE_SERVICE_DOWNLOAD_FILE_ROUTE').default('api/files').asString(),
        deleteFileRoute: env.get('STORAGE_SERVICE_DELETE_FILE_ROUTE').default('api/files').asString(),
        deleteFilesRoute: env.get('STORAGE_SERVICE_DELETE_FILES_ROUTE').default('api/files/delete-bulk').asString(),
        duplicateFilesRoute: env.get('STORAGE_SERVICE_DUPLICATE_FILES_ROUTE').default('api/files/duplicate-bulk').asString(),
        fileIdLength: env.get('STORAGE_SERVICE_FILE_ID_LENGTH').default(32).asIntPositive(),
        requestTimeout: env.get('STORAGE_SERVICE_SERVICE_REQUEST_TIMEOUT').default(10000).asIntPositive(),
    },
    instanceService: {
        url: env.get('INSTANCE_SERVICE_URL').required().asString(),
        baseEntitiesRoute: env.get('INSTANCE_SERVICE_BASE_ENTITIES_ROUTE').default('/api/instances/entities').asString(),
        baseRelationshipsRoute: env.get('INSTANCE_SERVICE_BASE_RELATIONSHIPS_ROUTE').default('/api/instances/relationships').asString(),
        baseBulkActionsRoute: env.get('INSTANCE_SERVICE_BASE_BULK_ACTIONS_ROUTE').default('/api/instances/bulk-actions').asString(),
        baseConstraintsRoute: env.get('INSTANCE_SERVICE_BASE_CONSTRAINTS_ROUTE').default('/api/instances/entities/constraints').asString(),
        searchOfTemplateRoute: env.get('INSTANCE_SERVICE_SEARCH_OF_TEMPLATE_ROUTE').default('/search/template').asString(),
        requestTimeout: env.get('INSTANCE_SERVICE_REQUEST_TIMEOUT').default(50000).asIntPositive(),
        searchEntitiesFlowMaxLimit: env.get('SEARCH_ENTITIES_FLOW_MAX_LIMIT').default(50000).asIntPositive(),
    },
    permissionService: {
        baseUrl: env.get('PERMISSION_SERVICE_BASE_URL').required().asString(),
        baseRoute: env.get('PERMISSION_SERVICE_BASE_ROUTE').default('/api/permissions').asString(),
        checkAuthorizationRoute: env.get('PERMISSION_SERVICE_CHECK_AUTHERIZATION_ROUTE').default('authorization').asString(),
        requestTimeout: env.get('PERMISSION_SERVICE_REQUEST_TIMEOUT').default(500000).asIntPositive(),
    },
    activityLogService: {
        url: env.get('ACTIVITY_LOG_SERVICE_URL').required().asString(),
        baseRoute: env.get('ACTIVITY_LOG_SERVICE_BASE_ROUTE').default('/api/activity-log').asString(),
        requestTimeout: env.get('ACTIVITY_LOG_SERVICE_REQUEST_TIMEOUT').default(50000).asIntPositive(),
    },
    notificationService: {
        url: env.get('NOTIFICATION_SERVICE_URL').required().asString(),
        baseRoute: env.get('NOTIFICATION_SERVICE_BASE_ROUTE').default('/api/notifications').asString(),
        requestTimeout: env.get('NOTIFICATION_SERVICE_REQUEST_TIMEOUT').default(50000).asIntPositive(),
    },
    ruleBreachService: {
        url: env.get('RULE_BREACH_SERVICE_URL').required().asString(),
        baseRoute: env.get('RULE_BREACH_SERVICE_BASE_ROUTE').default('/api/rule-breaches').asString(),
        requestTimeout: env.get('RULE_BREACH_SERVICE_REQUEST_TIMEOUT').default(50000).asIntPositive(),
        brokenRulesFakeEntityIdPrefix: env.get('BROKEN_RULES_FAKE_ENTITY_ID_PREFIX').default('$').asString(),
    },
    processService: {
        url: env.get('PROCESS_SERVICE_URL').required().asString(),
        templatesBaseRoute: env.get('PROCESSES_SERVICE_TEMPLATES_BASE_ROUTE').default('/api/processes/templates').asString(),
        instancesBaseRoute: env.get('PROCESSES_SERVICE_INSTANCES_BASE_ROUTE').default('/api/processes/instances').asString(),
        requestTimeout: env.get('PROCESS_SERVICE_REQUEST_TIMEOUT').default(50000).asIntPositive(),
        internalSearchPullLimit: env.get('PROCESS_SERVICE_INTERNAL_SEARCH_PULL_LIMIT').default(1000).asIntPositive(),
    },
    ganttService: {
        url: env.get('GANTT_SERVICE_URL').required().asString(),
        baseRoute: env.get('GANTT_SERVICE_BASE_ROUTE').default('/api/gantts').asString(),
        requestTimeout: env.get('GANTT_SERVICE_REQUEST_TIMEOUT').default(50000).asIntPositive(),
    },
    previewService: {
        url: env.get('PREVIEW_SERVICE_URL').required().asString(),
        baseRoute: env.get('PREVIEW_SERVICE_BASE_ROUTE').default('/api/preview').asString(),
        requestTimeout: env.get('PREVIEW_SERVICE_REQUEST_TIMEOUT').default(50000).asIntPositive(),
    },
    getUsersLimitForPermissionsOfUsers: env.get('GET_USERS_LIMIT_FOR_PERMISSIONS_OF_USERS').default(20).asIntPositive(),
    kartoffel: {
        baseUrl: env.get('KARTOFFEL_BASE_URL').required().asString(),
        baseEntitiesRoute: env.get('KARTOFFEL_BASE_ENTITIES_ROUTE').default('/api/entities').asString(),
        requestTimeout: env.get('KARTOFFEL_REQUEST_TIMEOUT').default(50000).asIntPositive(),
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
        url: env.get('RABBIT_URL').required().asUrlString(),
        retryOptions: {
            minTimeout: env.get('RABBIT_RETRY_MIN_TIMEOUT').default(1000).asIntPositive(),
            retries: env.get('RABBIT_RETRY_RETRIES').default(10).asIntPositive(),
            factor: env.get('RABBIT_RETRY_FACTOR').default(1.8).asFloatPositive(),
        },
        notificationQueue: env.get('NOTIFICATION_QUEUE_NAME').default('notifications-queue').asString(),
        mailNotificationQueue: env.get('MAIL_NOTIFICATION_QUEUE_NAME').default('mail-notifications-queue').asString(),
    },
    mailerService: {
        mailUser: env.get('NOTIFICATIONS_MAIL_FROM').default('hope39@ethereal.email').asString(),
    },
    logs: {
        format: env.get('LOGGING_DATE_FORMAT').default('YYYY-MM-DD HH:mm:ss').asString(),
        enableApm: env.get('ENABLE_APM').default('false').asBool(),
        apmServerUrl: env.get('APM_SERVER_URL').default('http://apm-server:8200').asString(),
        enableFile: env.get('ENABLE_FILE_LOGGING').default('false').asBool(),
        enableRotateFile: env.get('ENABLE_ROTATE_FILE_LOGGING').default('true').asBool(),
        label: env.get('LOG_LABEL').default('gateway').asString(),
        extraDefault: {
            serviceName: env.get('LOG_SERVICE_NAME').default('gateway-service').asString(),
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
    notifications: {
        dateAlertOptions: env.get('DATE_NOTIFICATIONS_OPTIONS').default('1, 7, 14, 30, 90, 180').asArray(',').map(Number),
        dateAlertTime: env.get('DATE_ALERT_TIME').default('0 0 * * *').asString(),
    },
    brokenRulesFakeEntityIdPrefix: env.get('BROKEN_RULES_FAKE_ENTITY_ID_PREFIX').default('$').asString(),
};

export default config;
