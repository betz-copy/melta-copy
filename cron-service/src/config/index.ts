import env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
        workspaceIdHeaderName: env.get('WORKSPACE_ID_HEADER_NAME').default('workspace-id').asString(),
    },
    instanceService: {
        url: env.get('INSTANCE_SERVICE_URL').required().asString(),
        baseEntitiesRoute: env.get('INSTANCE_SERVICE_BASE_ENTITIES_ROUTE').default('/api/instances/entities').asString(),
        searchOfTemplateRoute: env.get('INSTANCE_SERVICE_SEARCH_OF_TEMPLATE_ROUTE').default('/search/template').asString(),
        requestTimeout: env.get('INSTANCE_SERVICE_REQUEST_TIMEOUT').default(10000).asIntPositive(),
        searchEntitiesFlowMaxLimit: env.get('SEARCH_ENTITIES_FLOW_MAX_LIMIT').default(10000).asIntPositive(),
    },
    templateService: {
        url: env.get('TEMPLATE_SERVICE_URL').required().asString(),
        entities: {
            baseEntitiesRoute: env.get('TEMPLATE_SERVICE_ENTITIES_BASE_ROUTE').default('/api/templates/entities').asString(),
        },
        requestTimeout: env.get('ENTITY_TEMPLATE_SERVICE_REQUEST_TIMEOUT').default(10000).asIntPositive(),
    },
    rabbit: {
        url: env.get('RABBIT_URL').required().asUrlString(),
        notificationQueue: env.get('NOTIFICATION_QUEUE_NAME').default('notifications-queue').asString(),
        runRulesWithTodayFuncQueue: env.get('RUN_RULES_WITH_TODAY_FUNC_QUEUE_NAME').default('run-rules-with-today-func-queue').asString(),
        retryOptions: {
            minTimeout: env.get('RABBIT_RETRY_MIN_TIMEOUT').default(1000).asIntPositive(),
            retries: env.get('RABBIT_RETRY_RETRIES').default(10).asIntPositive(),
            factor: env.get('RABBIT_RETRY_FACTOR').default(1.8).asFloatPositive(),
        },
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
    workspaceService: {
        url: env.get('WORKSPACE_SERVICE_URL').required().asString(),
        baseRoute: env.get('WORKSPACES_SERVICE_BASE_ROUTE').default('/api/workspaces').asString(),
        requestTimeout: env.get('WORKSPACES_SERVICE_REQUEST_TIMEOUT').default(10000).asIntPositive(),
    },
    userService: {
        url: env.get('USER_SERVICE_URL').required().asString(),
        usersRoute: env.get('USER_SERVICE_BASE_ROUTE').default('/api/users').asString(),
        requestTimeout: env.get('PERMISSION_SERVICE_REQUEST_TIMEOUT').default(100000).asIntPositive(),
    },
    notifications: {
        dateAlertOptions: env.get('DATE_NOTIFICATIONS_OPTIONS').default('1, 7, 14, 30, 90, 180').asArray(',').map(Number),
        dateAlertTime: env.get('DATE_ALERT_TIME').default('0 0 * * *').asString(),
        displayCronDates: env.get('DISPLAY_CRON_DATES').default('true').asString(),
    },
    userFieldsSync: {
        usersSyncTime: env.get('USERS_SYNC_TIME').default('0 */12 * * *').asString(),
        isSyncingUsers: env.get('IS_SYNCING_USERS').default('true').asString(),
    }, //TODO: check if remove
    rulesWithTodayFunc: {
        runOnStart: env.get('RULES_WITH_TODAY_FUNC_RUN_ON_START').default('false').asBool(), // for development
        cronTime: env.get('RULES_WITH_TODAY_FUNC_CRON_TIME').default('0 0 * * *').asString(),
        runCron: env.get('RULES_WITH_TODAY_FUNC_RUN_CRON').default('true').asBool(),
    },
    kartoffel: {
        url: env.get('KARTOFFEL_BASE_URL').required().asString(),
        baseEntitiesRoute: env.get('KARTOFFEL_BASE_ENTITIES_ROUTE').default('/api/entities').asString(),
        requestTimeout: env.get('KARTOFFEL_REQUEST_TIMEOUT').default(10000).asIntPositive(),
        getByIdRoute: env.get('KARTOFFEL_FIND_USER_BY_ID_ROUTE').default('').asString(),
    },
};

export default config;
