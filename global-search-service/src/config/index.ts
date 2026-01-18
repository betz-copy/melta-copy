import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        workspaceIdHeaderName: env.get('WORKSPACE_ID_HEADER_NAME').default('workspace-id').asString(),
        maxRequestSize: env.get('MAX_REQUEST_BYTE_SIZE').required().asInt(),
    },
    rabbit: {
        url: env.get('RABBIT_URL').required().asString(),
        retryOptions: {
            minTimeout: env.get('RABBIT_RETRY_MIN_TIMEOUT').default(1000).asIntPositive(),
            retries: env.get('RABBIT_RETRY_RETRIES').default(10).asIntPositive(),
            factor: env.get('RABBIT_RETRY_FACTOR').default(1.8).asFloatPositive(),
        },
        queueName: env.get('RABBIT_QUEUE_NAME').default('search-queue').asString(),
    },
    templateService: {
        url: env.get('TEMPLATE_SERVICE_URL').required().asString(),
        entities: {
            baseRoute: env.get('TEMPLATE_SERVICE_ENTITIES_BASE_ROUTE').default('/api/templates/entities').asString(),
            searchTemplatesRoute: env.get('TEMPLATE_SERVICE_ENTITIES_SEARCH_ROUTE').default('/search').asString(),
        },
        timeout: env.get('TEMPLATE_SERVICE_TIMEOUT').default(5000).asIntPositive(),
    },
    fileIdLength: env.get('FILE_ID_LENGTH').default(32).asIntPositive(),
    neo4j: {
        url: env.get('NEO4J_URL').default('neo4j://localhost').asString(),
        auth: {
            username: env.get('NEO4J_USERNAME').default('neo4j').asString(),
            password: env.get('NEO4J_PASSWORD').default('test').asString(),
        },
        database: env.get('NEO4J_DATABASE').default('neo4j').asString(),
        connectionRetries: env.get('NEO4J_CONNECTION_RETRIES').default(5).asIntPositive(),
        connectionRetryDelay: env.get('NEO4J_CONNECTION_RETRY_DELAY').default(3000).asIntPositive(),
        globalSearchIndexPrefix: env.get('NEO4J_GLOBAL_SEARCH_INDEX').default('globalSearch').asString(),
        indexPropertiesLimit: env.get('NEO4J_INDEX_PROPERTIES_LIMIT').default(1000).asIntPositive(),
        templateSearchIndexPrefix: env.get('NEO4J_TEMPLATE_SEARCH_INDEX_PREFIX').default('templateSearch_').asString(),
        stringPropertySuffix: env.get('STRING_PROPERTY_SUFFIX').default('_tostring').asString(),
        booleanPropertySuffix: env.get('BOOLEAN_PROPERTY_SUFFIX').default('_toheboolean').asString(),
        filePropertySuffix: env.get('FILE_PROPERTY_SUFFIX').default('_tofilename').asString(),
        booleanHeYesValue: env.get('BOOLEAN_HE_YES_VALUE').default('כן').asString(),
        booleanHeNoValue: env.get('BOOLEAN_HE_NO_VALUE').default('לא').asString(),
        relationshipReferencePropertySuffix: env.get('RELATIONSHIP_REFERENCE_PROPERTY_SUFFIX').default('_reference').asString(),
        usersFieldsPropertySuffix: env.get('USERS_FIELDS_PROPERTY_SUFFIX').default('_usersFields').asString(), // TODO: REMOVE
        userFieldPropertySuffix: env.get('USER_FIELD_PROPERTY_SUFFIX').default('_userField').asString(), // TODO: REMOVE
        userOriginalAndSuffixFieldsMap: env
            .get('USER_ORIGINAL_AND_SUFFIX_FIELDS_MAP')
            .default([
                { originalFieldName: 'fullName', suffixFieldName: '.fullName' },
                { originalFieldName: 'jobTitle', suffixFieldName: '.jobTitle' },
                { originalFieldName: 'hierarchy', suffixFieldName: '.hierarchy' },
                { originalFieldName: 'mail', suffixFieldName: '.mail' },
            ])
            .required()
            .asJsonArray() as Array<{ originalFieldName: string; suffixFieldName: string }>,
        usersArrayOriginalAndSuffixFieldsMap: env
            .get('USERS_ARRAY_ORIGINAL_AND_SUFFIX_FIELDS_MAP')
            .default([
                { originalFieldName: 'fullName', suffixFieldName: '.fullNames' },
                { originalFieldName: 'jobTitle', suffixFieldName: '.jobTitles' },
                { originalFieldName: 'hierarchy', suffixFieldName: '.hierarchies' },
                { originalFieldName: 'mail', suffixFieldName: '.mails' },
            ])
            .required()
            .asJsonArray() as Array<{ originalFieldName: string; suffixFieldName: string }>,
        workspaceNamePrefix: env.get('NEO4J_WORKSPACE_NAME_PREFIX').default('workspace-').asString(),
        dummyTemplateId: env.get('NEO4J_DUMMY_TEMPLATE_ID').default('DUMMY').asString(),
    },
    logs: {
        format: env.get('LOGGING_DATE_FORMAT').default('YYYY-MM-DD HH:mm:ss').asString(),
        enableFile: env.get('ENABLE_FILE_LOGGING').default('false').asBool(),
        enableRotateFile: env.get('ENABLE_ROTATE_FILE_LOGGING').default('true').asBool(),
        label: env.get('LOG_LABEL').default('global-search').asString(),
        extraDefault: {
            serviceName: env.get('LOG_SERVICE_NAME').default('global-search-service').asString(),
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
