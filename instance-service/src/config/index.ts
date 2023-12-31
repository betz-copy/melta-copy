import env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
    },
    neo4j: {
        url: env.get('NEO4J_URL').default('neo4j://localhost').asUrlString(),
        auth: {
            username: env.get('NEO4J_USERNAME').default('neo4j').asString(),
            password: env.get('NEO4J_PASSWORD').default('test').asString(),
        },
        database: env.get('NEO4J_DATABASE').default('neo4j').asString(),
        connectionRetries: env.get('NEO4J_CONNECTION_RETRIES').default(5).asIntPositive(),
        connectionRetryDelay: env.get('NEO4J_CONNECTION_RETRY_DELAY').default(3000).asIntPositive(),
        stringPropertySuffix: env.get('STRING_PROPERTY_SUFFIX').default('_tostring').asString(),
        // taken from lucene 8.2.0 syntax (for neo4j 4.0.6):
        // https://lucene.apache.org/core/8_2_0/queryparser/org/apache/lucene/queryparser/classic/package-summary.html#Escaping_Special_Characters
        specialCharsToEscapeNeo4jQuery: env.get('SPECIAL_CHARS_TO_ESCAPE_NEO4J_QUERY').default('+,-,&&,||,!,(,),{,},[,],^,",~,*,?,:,\\,/').asArray(),
    },
    entityTemplateService: {
        url: env.get('ENTITY_TEMPLATE_SERVICE_URL').required().asString(),
        getByIdRoute: env.get('ENTITY_TEMPLATE_SERVICE_GET_BY_ID_ROUTE').default('/api/templates/entities').asString(),
        searchRoute: env.get('ENTITY_TEMPLATE_SERVICE_SEARCH_ROUTE').default('/api/templates/entities/search').asString(),
        timeout: env.get('ENTITY_TEMPLATE_SERVICE_TIMEOUT').default(5000).asIntPositive(),
    },
    relationshipTemplateService: {
        url: env.get('RELATIONSHIP_TEMPLATE_SERVICE_URL').required().asString(),
        getRelationshipByIdRoute: env
            .get('RELATIONSHIP_TEMPLATE_SERVICE_GET_RELATIONSHIP_BY_ID_ROUTE')
            .default('/api/templates/relationships')
            .asString(),
        searchRulesRoute: env.get('RELATIONSHIP_TEMPLATE_SERVICE_SEARCH_RULES_ROUTE').default('/api/templates/rules/search').asString(),
        searchTemplatesRoute: env
            .get('RELATIONSHIP_TEMPLATE_SERVICE_SEARCH_TEMPLATES_ROUTE')
            .default('/api/templates/relationships/search')
            .asString(),
        timeout: env.get('RELATIONSHIP_TEMPLATE_SERVICE_TIMEOUT').default(5000).asIntPositive(),
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
    createdRelationshipIdInBrokenRules: env.get('CREATED_RELATIONSHIP_ID_IN_BROKEN_RULES').default('created-relationship-id').asString(),
    uniqueConstraintsPrefixName: env.get('UNIQUE_CONSTRAINTS_PREFIX_NAME').default('uniqueConstraint').asString(),
    requiredConstraintsPrefixName: env.get('REQUIRED_CONSTRAINTS_PREFIX_NAME').default('requiredConstraint').asString(),
    constraintsNameDelimiter: env.get('CONSTRAINTS_NAME_DELIMITER').default('-').asString(), // default "-" because template properties cant have "-" chars (variableName format validation)
    searchEntitiesMaxLimit: env.get('SEARCH_ENTITIES_MAX_LIMIT').default(10000).asIntPositive(),
};

export default config;
