import env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
        meltaBaseUrl: env.get('SYSTEM_MELTA_BASE_URL').required().asString(),
        workspaceIdHeaderName: env.get('WORKSPACE_ID_HEADER_NAME').default('workspace-id').asString(),
        systemUnavailableURL: env.get('SYSTEM_UNAVAILABLE_URL').required().asString(),
        uploadsFolderPath: env.get('UPLOADS_FOLDER_PATH').default('public/uploads/').asString(),
        maxFileSize: env.get('MAX_FILE_BYTE_SIZE').required().asInt(),
        maxRequestSize: env.get('MAX_REQUEST_BYTE_SIZE').required().asInt(),
        highWaterMark: env
            .get('HIGH_WATER_MARK')
            .default(600 * 1024 * 1024)
            .asInt(),
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
    frontendConfig: {
        matotmo: {
            baseUrl: env.get('FRONTEND_CONFIG_MATOMO_BASE_URL').default('http://localhost:8016').required().asString(),
            siteId: env.get('FRONTEND_CONFIG_MATOMO_SITE_ID').default(1).required().asInt(),
        },
        mapLayers: env
            .get('FRONTEND_CONFIG_MAP_LAYERS')
            .default({
                OpenStreetMap: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'Satellite (Esri)': 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                OpenTopoMap: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
            })
            .required()
            .asJsonObject(),
        textLayers: env
            .get('FRONTEND_CONFIG_TEXT_LAYERS')
            .default({
                'Labels (OSM Hot)': 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
                'Hillshading (Wikimedia)': 'https://tiles.wmflabs.org/hillshading/{z}/{x}/{y}.png',
                'Boundaries (OpenMapTiles)': 'https://{s}.tile.opentiles.org/admin/{z}/{x}/{y}.png',
            })
            .required()
            .asJsonObject(),
        isOutsideDevelopment: env.get('FRONTEND_CONFIG_IS_OUTSIDE_DEVELOPMENT').default('true').required().asBool(),

        agGridLimit: {
            deleteLimit: env.get('DELETE_ENTITIES_MAX_LIMIT').default(1000).asIntPositive(),
        },
        meltaUpdates: env.get('FRONTEND_CONFIG_MELTA_UPDATES').default({ אא: 'בב', גג: 'דד' }).asJsonObject(),
        meltaUpdatesDescription: env.get('FRONTEND_CONFIG_MELTA_UPDATES_DESCRIPTION').default('תיאור').asString(),
        clientSideWorkspaceId: env.get('CLIENT_SIDE_WORKSPACE_ID').default('68347c4b1652e05582afa8b8').asString(),
        units: env.get('FRONTEND_CONFIG_UNITS').default('es,unit1,unit2,unit3,unit4,unit5,unit6,unit7,unit8,unit9,unit10').asArray(',').map(String),
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
            unauthorizedId: env.get('UNAUTHORIZED_ID').default('unauthorized').asString(),
            clientSideId: env.get('CLIENT_SIDE_ID').default('client-side').asString(),
            clientSideEndURL: env.get('CLIENT_SIDE_END_URL').default('/client-side/test.mlt').asString(), // TODO: yona - change to better unique url for client side end user
        },
        basicAuthentication: {
            // userId must be users of kartoffel with permissions in our permissions-api DB
            // for example: [{"userId": "5e5688324203fc40043591aa", "password": "noamisgod"}]
            users: env.get('BASIC_AUTHENTICATION_USERS').required().asJsonArray() as Array<{ userId: string; password: string }>,
        },
    },
    templateService: {
        url: env.get('TEMPLATE_SERVICE_URL').required().asString(),
        baseRoute: env.get('TEMPLATE_SERVICE_BASE_ROUTE').default('/api/templates').asString(),
        entities: {
            baseEntitiesRoute: env.get('TEMPLATE_SERVICE_ENTITIES_BASE_ROUTE').default('/api/templates/entities').asString(),
            baseCategoriesRoute: env.get('TEMPLATE_SERVICE_CATEGORIES_BASE_ROUTE').default('/api/templates/categories').asString(),
            baseChildTemplatesRoute: env.get('TEMPLATE_SERVICE_CHILD_TEMPLATES_BASE_ROUTE').default('/api/templates/child').asString(),
            baseConfigRoute: env.get('TEMPLATE_SERVICE_CONFIG_BASE_ROUTE').default('/api/templates/config').asString(),
        },
        relationships: {
            baseRelationshipsRoute: env.get('TEMPLATE_SERVICE_RELATIONSHIPS_BASE_ROUTE').default('/api/templates/relationships').asString(),
            baseRulesRoute: env.get('TEMPLATE_SERVICE_RELATIONSHIPS_RULES_BASE_ROUTE').default('/api/templates/rules').asString(),
            updateRuleStatusByIdRouteSuffix: env
                .get('TEMPLATE_SERVICE_RELATIONSHIPS_UPDATE_RULE_STATUS_BY_ID_ROUTE_SUFFIX')
                .default('/status')
                .asString(),
        },
        requestTimeout: env.get('ENTITY_TEMPLATE_SERVICE_REQUEST_TIMEOUT').default(10000).asIntPositive(),
        userDoesntExistUnderReq: env.get('USER_NOT_EXIST_UNDER_REQUEST').default(`User doesn't exists under request`).asString(),
    },
    storageService: {
        url: env.get('STORAGE_SERVICE_URL').required().asString(),
        baseRoute: env.get('STORAGE_SERVICE_BASE_ROUTE').default('/api/files').asString(),
        uploadFileRoute: env.get('STORAGE_SERVICE_UPLOAD_FILE_ROUTE').default('api/files').asString(),
        uploadFilesRoute: env.get('STORAGE_SERVICE_UPLOAD_FILES_ROUTE').default('api/files/bulk').asString(),
        downloadFileRoute: env.get('STORAGE_SERVICE_DOWNLOAD_FILE_ROUTE').default('api/files').asString(),
        deleteFileRoute: env.get('STORAGE_SERVICE_DELETE_FILE_ROUTE').default('api/files').asString(),
        deleteFilesRoute: env.get('STORAGE_SERVICE_DELETE_FILES_ROUTE').default('api/files/delete-bulk').asString(),
        duplicateFilesRoute: env.get('STORAGE_SERVICE_DUPLICATE_FILES_ROUTE').default('api/files/duplicate-bulk').asString(),
        fileIdLength: env.get('STORAGE_SERVICE_FILE_ID_LENGTH').default(32).asIntPositive(),
        requestTimeout: env.get('STORAGE_SERVICE_SERVICE_REQUEST_TIMEOUT').default(10000).asIntPositive(),
        usersGlobalBucketName: env.get('MINIO_USERS_BUCKET_NAME').default('users-global-bucket').asString(),
    },
    semanticSearchService: {
        requestTimeout: env.get('SEMANTIC_SEARCH_SERVICE_REQUEST_TIMEOUT').default(20000).asIntPositive(),
        url: env.get('SEMANTIC_SEARCH_SERVICE').required().asString(),
        baseRoute: env.get('SEMANTIC_SEARCH_SERVICE_BASE_ROUTE').default('/api/semantic').asString(),
        searchRoute: env.get('SEMANTIC_SEARCH_SERVICE_SEARCH_ROUTE').default('/search').asString(),
        rerankRoute: env.get('SEMANTIC_SEARCH_SERVICE_RERANK_ROUTE').default('/rerank').asString(),
    },
    instanceService: {
        url: env.get('INSTANCE_SERVICE_URL').required().asString(),
        baseRoute: env.get('INSTANCE_SERVICE_BASE_ROUTE').default('/api/instances').asString(),
        baseEntitiesRoute: env.get('INSTANCE_SERVICE_BASE_ENTITIES_ROUTE').default('/api/instances/entities').asString(),
        baseRelationshipsRoute: env.get('INSTANCE_SERVICE_BASE_RELATIONSHIPS_ROUTE').default('/api/instances/relationships').asString(),
        baseBulkActionsRoute: env.get('INSTANCE_SERVICE_BASE_BULK_ACTIONS_ROUTE').default('/api/instances/bulk-actions').asString(),
        baseConstraintsRoute: env.get('INSTANCE_SERVICE_BASE_CONSTRAINTS_ROUTE').default('/api/instances/entities/constraints').asString(),
        searchOfTemplateRoute: env.get('INSTANCE_SERVICE_SEARCH_OF_TEMPLATE_ROUTE').default('/search/template').asString(),
        searchEntitiesByLocationRoute: env.get('INSTANCE_SERVICE_SEARCH_ENTITIES_BY_LOCATION_ROUTE').default('/search/location').asString(),
        requestTimeout: env.get('INSTANCE_SERVICE_REQUEST_TIMEOUT').default(10000).asIntPositive(),
        searchEntitiesFlowMaxLimit: env.get('SEARCH_ENTITIES_FLOW_MAX_LIMIT').default(10000).asIntPositive(),
        searchEntitiesMaxLimit: env.get('SEARCH_ENTITIES_MAX_LIMIT').default(10000).asIntPositive(),
    },
    userService: {
        url: env.get('USER_SERVICE_URL').required().asString(),
        usersRoute: env.get('USER_SERVICE_USERS_BASE_ROUTE').default('/api/users').asString(),
        rolesRoute: env.get('USER_SERVICE_ROLES_BASE_ROUTE').default('/api/roles').asString(),
        permissionsRoute: env.get('USER_SERVICE_PERMISSION_BASE_ROUTE').default('/api/permissions').asString(),
        checkAuthorizationRoute: env.get('PERMISSION_SERVICE_CHECK_AUTHERIZATION_ROUTE').default('authorization').asString(),
        requestTimeout: env.get('PERMISSION_SERVICE_REQUEST_TIMEOUT').default(100000).asIntPositive(),
        profilePathPattern: env
            .get('PROFILE_PATH_PATTERN')
            .default('^(kartoffelProfile|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{8}.*)$')
            .asRegExp(),
    },
    activityLogService: {
        url: env.get('ACTIVITY_LOG_SERVICE_URL').required().asString(),
        baseRoute: env.get('ACTIVITY_LOG_SERVICE_BASE_ROUTE').default('/api/activity-log').asString(),
        requestTimeout: env.get('ACTIVITY_LOG_SERVICE_REQUEST_TIMEOUT').default(10000).asIntPositive(),
    },
    notificationService: {
        url: env.get('NOTIFICATION_SERVICE_URL').required().asString(),
        baseRoute: env.get('NOTIFICATION_SERVICE_BASE_ROUTE').default('/api/notifications').asString(),
        requestTimeout: env.get('NOTIFICATION_SERVICE_REQUEST_TIMEOUT').default(10000).asIntPositive(),
    },
    ruleBreachService: {
        url: env.get('RULE_BREACH_SERVICE_URL').required().asString(),
        baseRoute: env.get('RULE_BREACH_SERVICE_BASE_ROUTE').default('/api/rule-breaches').asString(),
        requestTimeout: env.get('RULE_BREACH_SERVICE_REQUEST_TIMEOUT').default(10000).asIntPositive(),
        brokenRulesFakeEntityIdPrefix: env.get('BROKEN_RULES_FAKE_ENTITY_ID_PREFIX').default('$').asString(),
    },
    processService: {
        url: env.get('PROCESS_SERVICE_URL').required().asString(),
        templatesBaseRoute: env.get('PROCESSES_SERVICE_TEMPLATES_BASE_ROUTE').default('/api/processes/templates').asString(),
        instancesBaseRoute: env.get('PROCESSES_SERVICE_INSTANCES_BASE_ROUTE').default('/api/processes/instances').asString(),
        requestTimeout: env.get('PROCESS_SERVICE_REQUEST_TIMEOUT').default(10000).asIntPositive(),
        internalSearchPullLimit: env.get('PROCESS_SERVICE_INTERNAL_SEARCH_PULL_LIMIT').default(1000).asIntPositive(),
    },
    ganttService: {
        url: env.get('GANTT_SERVICE_URL').required().asString(),
        baseRoute: env.get('GANTT_SERVICE_BASE_ROUTE').default('/api/gantts').asString(),
        requestTimeout: env.get('GANTT_SERVICE_REQUEST_TIMEOUT').default(10000).asIntPositive(),
    },
    previewService: {
        url: env.get('PREVIEW_SERVICE_URL').required().asString(),
        baseRoute: env.get('PREVIEW_SERVICE_BASE_ROUTE').default('/api/preview').asString(),
        requestTimeout: env.get('PREVIEW_SERVICE_REQUEST_TIMEOUT').default(10000).asIntPositive(),
    },
    workspaceService: {
        url: env.get('WORKSPACE_SERVICE_URL').required().asString(),
        baseRoute: env.get('WORKSPACES_SERVICE_BASE_ROUTE').default('/api/workspaces').asString(),
        requestTimeout: env.get('WORKSPACES_SERVICE_REQUEST_TIMEOUT').default(10000).asIntPositive(),
    },
    dashboardService: {
        url: env.get('DASHBOARD_SERVICE_URL').required().asString(),
        requestTimeout: env.get('DASHBOARD_SERVICE_REQUEST_TIMEOUT').default(10000).asIntPositive(),
        baseRoute: env.get('DASHBOARD_SERVICE_BASE_ROUTE').default('/api/dashboard').asString(),
        charts: {
            baseRoute: env.get('DASHBOARD_SERVICE_CHARTS_ROUTE').default('/charts').asString(),
        },
        iframes: {
            baseRoute: env.get('DASHBOARD_SERVICE_IFRAMES_ROUTE').default('/iframes').asString(),
        },
        dashboard: {
            baseRoute: env.get('DASHBOARD_SERVICE_DASHBOARD_ROUTE').default('/items').asString(),
        },
    },
    getUsersLimitForPermissionsOfUsers: env.get('GET_USERS_LIMIT_FOR_PERMISSIONS_OF_USERS').default(20).asIntPositive(),
    kartoffel: {
        url: env.get('KARTOFFEL_BASE_URL').required().asString(),
        baseEntitiesRoute: env.get('KARTOFFEL_BASE_ENTITIES_ROUTE').default('/api/entities').asString(),
        getByIdRoute: env.get('KARTOFFEL_FIND_USER_BY_ID_ROUTE').default('').asString(),
        searchRoute: env.get('KARTOFFEL_SEARCH_ROUTE').default('/search').asString(),
        fieldToSearch: env.get('KARTOFFEL_FIELDS_TO_SEARCH').default('fullName,uniqueId,personalNumber,identityCard').asString(),
        requestTimeout: env.get('KARTOFFEL_REQUEST_TIMEOUT').default(10000).asIntPositive(),
        profilePath: env.get('KARTOFFEL_PROFILE_PATH').default('pictures/profile').asString(),
    },
    hebrew: { yes: 'כן', no: 'לא' },
    errorCodes: {
        categoryHasTemplates: 'CATEGORY_HAS_TEMPLATES',
        entityTemplateHasOutgoingRelationships: 'TEMPLATE_HAS_OUTGOING_RELATIONSHIPS',
        entityTemplateHasIncomingRelationships: 'TEMPLATE_HAS_INCOMING_RELATIONSHIPS',
        entityTemplateHasInstances: 'ENTITY_TEMPLATE_HAS_INSTANCES',
        relationshipTemplateHasInstances: 'RELATIONSHIP_TEMPLATE_HAS_INSTANCES',
        relationshipTemplateHasRules: 'RELATIONSHIP_TEMPLATE_HAS_RULES',
        ruleBlock: 'RULE_BLOCK',
        ruleHasAlertsOrRequests: 'RULE_HAS_ALERTS_OR_REQUESTS',
        failedToDeleteField: 'FAILED_DELETE_FIELD',
        failedToArchiveField: 'FAILED_ARCHIVE_FIELD',
        moreThenOneRelationshipInstanceExist: 'MORE_THEN_ONE_RELATIONSHIP_INSTANCE_EXIST',
        failedConstraintsValidation: 'FAILED_CONSTRAINTS_VALIDATION',
        templateValidationError: 'TemplateValidationError',
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
        deleteUnusedFilesQueue: env.get('DELETE_UNUSED_FILES_QUEUE_NAME').default('delete-unused-files-queue').asString(),
        insertDocsSemanticQueue: env.get('INSERT_DOCS_SEMATIC_QUEUE').default('insert_documents_queue').asString(),
        deleteDocsSemanticQueue: env.get('DELETE_DOCS_SEMATIC_QUEUE').default('delete_documents_queue').asString(),
    },
    mailerService: {
        mailUser: env.get('NOTIFICATIONS_MAIL_FROM').default('hope39@ethereal.email').asString(),
    },
    logs: {
        format: env.get('LOGGING_DATE_FORMAT').default('YYYY-MM-DD HH:mm:ss').asString(),
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
    excel: {
        multipleFilesName: env.get('MULTIPLE_FILES_NAME').default('attachmentZip').asString(),
        columnWidth: env.get('COLUMN_WIDTH').default(20).asIntPositive(),
    },
    loadExcel: {
        maxValidationRow: env.get('MAX_VALIDATION_ROW').default(100).asIntPositive(),
        minValidationRow: env.get('MIN_VALIDATION_ROW').default(2).asIntPositive(),
        entitiesFileLimit: env.get('ENTITIES_FILE_LIMIT').default(500).asIntPositive(),
        filesLimit: env.get('FILES_LIMIT').default(5).asIntPositive(),
        invalidDate: env.get('INVALID_DATE').default('Invalid Date').asString(),
        invalidTime: env.get('INVALID_TIME').default('Invalid time value').asString(),
        templateIdRegex: env.get('TEMPLATE_ID_REGEX').default('label `([^`]*)`').asRegExp(),
        propertiesRegex: env.get('PROPERTIES_REGEX').default('properties \\((.*?)\\)').asRegExp(),
    },
    flowCube: {
        flowRequestHostName: env.get('REQUEST_HOST_NAME').default('host-name').required().asString(),
        flowSystemName: env.get('FLOW_SYSTEM_NAME').default('system-name').required().asString(),
    },
    map: {
        polygon: {
            polygonPrefix: env.get('POLYGON_PREFIX').default('POLYGON((').asString(),
            polygonSuffix: env.get('POLYGON_SUFFIX').default('))').asString(),
        },
        epsgCode: {
            epsg: env.get('EPSG').default('EPSG').asString(),
            wgs84: env.get('WGS84').default('EPSG:4326').asString(),
            southHemiUTM: env.get('SOUTH_HEMI_UTM').default('327').asString(),
            northHemiUTM: env.get('NORTH_HEMI_UTM').default('326').asString(),
        },
        utm: {
            utmRegex: env
                .get('UTM_REGEX')
                .default('\\b([1-9]|[1-5][0-9]|60)([C-HJ-NP-X])\\s([0-9]+(?:\\.[0-9]+)?)\\s([0-9]+(?:\\.[0-9]+)?)\\b')
                .asRegExp(),

            utmPolygonRegex: env
                .get('UTM_POLYGON_REGEX')
                .default('\\b([1-9]|[1-5][0-9]|60)([C-HJ-NP-X])\\s([0-9]+(?:\\.[0-9]+)?)\\s([0-9]+(?:\\.[0-9]+)?)\\b')
                .asRegExp('g'),

            minZone: env.get('MIN_ZONE').default(1).asInt(),
            maxZone: env.get('MAX_ZONE').default(60).asInt(),
            minEasting: env.get('MIN_EASTING').default(160000).asInt(),
            maxEasting: env.get('MAX_EASTING').default(834000).asInt(),
            minNorthing: env.get('MIN_NORTHING').default(0).asInt(),
            maxNorthing: env.get('MAX_NORTHING').default(10000000).asInt(),
        },
        wgs84: { maxLongitude: env.get('MAX_LONGITUDE').default(180).asInt(), maxLatitude: env.get('MAX_LATITUDE').default(90).asInt() },
    },
    clientSide: {
        usersInfoChildTemplateId: env.get('CLIENT_SIDE_USERS_INFO_TEMPLATE_ID').default('68347c4b1652e05582afa8b8').asString(),
        numOfPropsToShow: env.get('CLIENT_SIDE_NUM_OF_PROPS_TO_SHOW').default(9).asIntPositive(),
        clientSideWorkspaceName: env.get('CLIENT_SIDE_WORKSPACE_NAME').default('simba').asString(),
    },
};

export default config;
