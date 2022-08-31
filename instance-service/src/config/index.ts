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
    },
    templateManager: {
        url: env.get('TEMPLATE_MANAGER_URL').required().asString(),
        getByIdRoute: env.get('TEMPLATE_MANAGER_GET_BY_ID_ROUTE').default('/api/templates/entities').asString(),
        timeout: env.get('TEMPLATE_MANAGER_TIMEOUT').default(5000).asIntPositive(),
    },
    relationshipManager: {
        url: env.get('RELATIONSHIP_MANAGER_URL').required().asString(),
        getRelationshipByIdRoute: env.get('RELATIONSHIP_MANAGER_GET_RELATIONSHIP_BY_ID_ROUTE').default('/api/templates/relationships').asString(),
        searchRulesRoute: env.get('RELATIONSHIP_MANAGER_SEARCH_RULES_ROUTE').default('/api/templates/rules/search').asString(),
        searchTemplatesRoute: env.get('RELATIONSHIP_MANAGER_SEARCH_TEMPLATES_ROUTE').default('/api/templates/relationships/search').asString(),
        timeout: env.get('RELATIONSHIP_MANAGER_TIMEOUT').default(5000).asIntPositive(),
    },
    redis: {
        url: env.get('REDIS_HOST').default('redis://redis:6379').asString(),
        globalSearchKeyName: env.get('GLOBAL_SEARCH_KEY_NAME').default('latestIndex').asString(),
    },
    errorCodes: {
        entityHasRelationships: 'ENTITY_HAS_RELATIONSHIPS',
        relationshipAlreadyExists: 'RELATIONSHIP_ALREADY_EXISTS',
        ruleBlock: 'RULE_BLOCK',
    },
};

export default config;
