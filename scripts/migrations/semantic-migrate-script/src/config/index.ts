import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        workspaceIdHeaderName: env.get('WORKSPACE_ID_HEADER_NAME').default('workspace-id').asString(),
    },
    mongo: {
        url: env.get('MONGO_URL').required().asString(),
        entityTemplatesCollectionName: env.get('MONGO_ENTITY_TEMPLATES_COLLECTION_NAME').required().asString(),
        categoriesCollectionName: env.get('MONGO_CATEGORIES_COLLECTION_NAME').required().asString(),
        connectionOptions: {
            maxIdleTimeMS: env.get('MONGO_MAX_IDLE_CONNECTION_TIME').default(10000).asIntPositive(), // Maximum time (in ms) that a connection can be idle before being closed
            socketTimeoutMS: env.get('MONGO_MAX_IDLE_SOCKET_TIME').default(10000).asIntPositive(), // Maximum idle time for an active connection
        },
    },
    neo4j: {
        url: env.get('NEO4J_URL').default('neo4j://localhost').asString(),
        auth: {
            username: env.get('NEO4J_USERNAME').default('neo4j').asString(),
            password: env.get('NEO4J_PASSWORD').default('test').asString(),
        },
        connectionRetries: env.get('NEO4J_CONNECTION_RETRIES').default(5).asIntPositive(),
        connectionRetryDelay: env.get('NEO4J_CONNECTION_RETRY_DELAY').default(3000).asIntPositive(),
        globalSearchIndexPrefix: env.get('NEO4J_GLOBAL_SEARCH_INDEX').default('globalSearch').asString(),
        templateSearchIndexPrefix: env.get('NEO4J_TEMPLATE_SEARCH_INDEX_PREFIX').default('templateSearch_').asString(),
        stringPropertySuffix: env.get('STRING_PROPERTY_SUFFIX').default('_tostring').asString(),
        relationshipReferencePropertySuffix: env.get('RELATIONSHIP_REFERENCE_PROPERTY_SUFFIX').default('_reference').asString(),
        mockUserId: env.get('NEO4J_MOCK_USER_ID').default('mock-user-id').asString(),
        // taken from lucene 8.2.0 syntax (for neo4j 4.0.6):
        // https://lucene.apache.org/core/8_2_0/queryparser/org/apache/lucene/queryparser/classic/package-summary.html#Escaping_Special_Characters
        specialCharsToEscapeNeo4jQuery: env.get('SPECIAL_CHARS_TO_ESCAPE_NEO4J_QUERY').default('+,-,&&,||,!,(,),{,},[,],^,",~,*,?,:,\\,/').asArray(),
        workspaceNamePrefix: env.get('NEO4J_WORKSPACE_NAME_PREFIX').default('workspace-').asString(),
    },
    rabbit: {
        url: env.get('RABBIT_URL').required().asString(),
        insertQueue: env.get('RABBIT_INSERT_QUEUE').default('insert_documents_queue').asString(),
        deleteQueue: env.get('RABBIT_DELETE_QUEUE').default('delete_documents_queue').asString(),
        retryOptions: {
            minTimeout: env.get('RABBIT_RETRY_MIN_TIMEOUT').default(1000).asIntPositive(),
            retries: env.get('RABBIT_RETRY_RETRIES').default(10).asIntPositive(),
            factor: env.get('RABBIT_RETRY_FACTOR').default(1.8).asFloatPositive(),
        },
        asyncMsgAmount: env.get('RABBIT_ASYNC_MSG_AMOUNT').default(100).asFloatPositive(),
        asyncMsgWait: env.get('RABBIT_ASYNC_MSG_WAIT').default(10000).asFloatPositive(),
    },
    services: {
        workspacesUri: env.get('WORKSPACE_SERVICE_URL').default('http://workspace-service:8000').asString(),
        baseRoute: env.get('WORKSPACE_SERVICE_BASE_ROUTE').default('/api/workspaces').asString(),
    },
};

export default config;
