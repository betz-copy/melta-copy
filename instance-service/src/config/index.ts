import env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
        workspaceIdHeaderName: env.get('WORKSPACE_ID_HEADER_NAME').default('workspace-id').asString(),
        maxRequestSize: env.get('MAX_REQUEST_BYTE_SIZE').required().asInt(),
    },
    neo4j: {
        url: env.get('NEO4J_URL').default('neo4j://localhost').asUrlString(),
        auth: {
            username: env.get('NEO4J_USERNAME').default('neo4j').asString(),
            password: env.get('NEO4J_PASSWORD').default('test').asString(),
        },
        connectionRetries: env.get('NEO4J_CONNECTION_RETRIES').default(5).asIntPositive(),
        connectionRetryDelay: env.get('NEO4J_CONNECTION_RETRY_DELAY').default(3000).asIntPositive(),
        globalSearchIndex: env.get('NEO4J_GLOBAL_SEARCH_INDEX').default('primaryGlobalSearch').asString(),
        templateSearchIndexPrefix: env.get('NEO4J_TEMPLATE_SEARCH_INDEX_PREFIX').default('primaryGlobalSearch_').asString(),
        stringPropertySuffix: env.get('STRING_PROPERTY_SUFFIX').default('_tostring').asString(),
        relationshipReferencePropertySuffix: env.get('RELATIONSHIP_REFERENCE_PROPERTY_SUFFIX').default('_reference').asString(),
        mockUserId: env.get('NEO4J_MOCK_USER_ID').default('mock-user-id').asString(),
        // taken from lucene 8.2.0 syntax (for neo4j 4.0.6):
        // https://lucene.apache.org/core/8_2_0/queryparser/org/apache/lucene/queryparser/classic/package-summary.html#Escaping_Special_Characters
        specialCharsToEscapeNeo4jQuery: env.get('SPECIAL_CHARS_TO_ESCAPE_NEO4J_QUERY').default('+,-,&&,||,!,(,),{,},[,],^,",~,*,?,:,\\,/').asArray(),
        workspaceNamePrefix: env.get('NEO4J_WORKSPACE_NAME_PREFIX').default('workspace-').asString(),
    },
    rabbit: {
        url: env.get('RABBIT_URL').required().asUrlString(),
        retryOptions: {
            minTimeout: env.get('RABBIT_RETRY_MIN_TIMEOUT').default(1000).asIntPositive(),
            retries: env.get('RABBIT_RETRY_RETRIES').default(10).asIntPositive(),
            factor: env.get('RABBIT_RETRY_FACTOR').default(1.8).asFloatPositive(),
        },
        activityLogQueue: env.get('ACTIVITY_LOG_QUEUE_NAME').default('activity-log-queue').asString(),
    },
    templateService: {
        url: env.get('TEMPLATE_SERVICE_URL').required().asString(),
        timeout: env.get('TEMPLATE_SERVICE_TIMEOUT').default(5000).asIntPositive(),
        entities: {
            getByIdRoute: env.get('TEMPLATE_SERVICE_ENTITIES_GET_BY_ID_ROUTE').default('/api/templates/entities').asString(),
            getRelatedByIdRoute: env.get('TEMPLATE_SERVICE_ENTITIES_GET_RELATED_BY_ID_ROUTE').default('/api/templates/entities/related').asString(),
            searchRoute: env.get('TEMPLATE_SERVICE_ENTITIES_SEARCH_ROUTE').default('/api/templates/entities/search').asString(),
        },
        relationships: {
            getRelationshipByIdRoute: env
                .get('TEMPLATE_SERVICE_RELATIONSHIPS_GET_RELATIONSHIP_BY_ID_ROUTE')
                .default('/api/templates/relationships')
                .asString(),
            searchRulesRoute: env.get('TEMPLATE_SERVICE_RELATIONSHIPS_SEARCH_RULES_ROUTE').default('/api/templates/rules/search').asString(),
            searchTemplatesRoute: env
                .get('TEMPLATE_SERVICE_RELATIONSHIPS_SEARCH_TEMPLATES_ROUTE')
                .default('/api/templates/relationships/search')
                .asString(),
        },
    },
    redis: {
        url: env.get('REDIS_HOST').default('redis://redis:6379').asString(),
        globalSearchKeyName: env.get('GLOBAL_SEARCH_KEY_NAME').default('latestIndex').asString(),
        templateSearchKeyNamePrefix: env.get('TEMPLATE_SEARCH_KEY_NAME_PREFIX').default('latestIndex_').asString(),
    },
    errorCodes: {
        entityHasRelationships: 'ENTITY_HAS_RELATIONSHIPS',
        relationshipAlreadyExists: 'RELATIONSHIP_ALREADY_EXISTS',
        ruleBlock: 'RULE_BLOCK',
        failedToCreateConstraints: 'FAILED_TO_CREATE_CONSTRAINTS',
        failedConstraintsValidation: 'FAILED_CONSTRAINTS_VALIDATION',
    },
    createdEntityIdInBrokenRules: env.get('CREATED_ENTITY_ID_IN_BROKEN_RULES').default('created-entity-id').asString(),
    createdRelationshipIdInBrokenRules: env.get('CREATED_RELATIONSHIP_ID_IN_BROKEN_RULES').default('created-relationship-id').asString(),
    uniqueConstraintsPrefixName: env.get('UNIQUE_CONSTRAINTS_PREFIX_NAME').default('uniqueConstraint').asString(),
    requiredConstraintsPrefixName: env.get('REQUIRED_CONSTRAINTS_PREFIX_NAME').default('requiredConstraint').asString(),
    requiredConstraint: env.get('REQUIRED_CONSTRAINT').default('requiredConstraint').asString(),
    uniqueConstraint: env.get('UNIQUE_CONSTRAINT').default('uniqueConstraint').asString(),
    constraintsNameDelimiter: env.get('CONSTRAINTS_NAME_DELIMITER').default('-').asString(), // default "-" because template properties cant have "-" chars (variableName format validation)
    searchEntitiesMaxLimit: env.get('SEARCH_ENTITIES_MAX_LIMIT').default(10000).asIntPositive(),
    cypherRulesResultValueVariableNameSuffix: env.get('CYPHER_RULES_RESULT_VALUE_VARIABLE_NAME_SUFFIX').default('value').asString(),
    cypherRulesResultCausesVariableNameSuffix: env.get('CYPHER_RULES_RESULT_CAUSES_VARIABLE_NAME_SUFFIX').default('instancesCauses').asString(),
    logs: {
        format: env.get('LOGGING_DATE_FORMAT').default('YYYY-MM-DD HH:mm:ss').asString(),
        enableFile: env.get('ENABLE_FILE_LOGGING').default('false').asBool(),
        enableRotateFile: env.get('ENABLE_ROTATE_FILE_LOGGING').default('true').asBool(),
        label: env.get('LOG_LABEL').default('instance').asString(),
        extraDefault: {
            serviceName: env.get('LOG_SERVICE_NAME').default('instance-service').asString(),
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
