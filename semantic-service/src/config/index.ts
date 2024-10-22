import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
        workspaceIdHeaderName: env.get('WORKSPACE_ID_HEADER_NAME').default('workspace-id').asString(),
        maxRequestSize: env.get('MAX_REQUEST_BYTE_SIZE').required().asInt(),
    },
    consts: {
        fileIdLength: env.get('FILE_ID_LENGTH').default('32').asInt(),
    },
    model: {
        chunkSize: env.get('MODEL_CHUNK_SIZE').default(1).asInt(),
        chunkSplitter: env.get('MODEL_CHUNK_SPLITTER').default('.').asString(),
        charsToRemove: env.get('MODEL_CHARS_TO_REMOVE').default('["\n","\t",",","."]').asArray(),
    },
    minio: {
        url: env.get('MINIO_ENDPOINT').default('localhost').asString(),
        port: env.get('MINIO_PORT').default(9000).asPortNumber(),
        accessKey: env.get('MINIO_ACCESS_KEY').default('minioadmin').asString(),
        secretKey: env.get('MINIO_SECRET_KEY').default('minioadmin').asString(),
        bucketName: env.get('MINIO_BUCKET_NAME').default('bucket').asString(),
        useSSL: false,
        transportAgent: {
            timeout: env.get('TRANSPORT_AGENT_TIMEOUT').default(60000).asIntPositive(),
            maxSockets: env.get('TRANSPORT_AGENT_MAX_SOCKETS').default(1000).asIntPositive(),
            keepAlive: env.get('TRANSPORT_AGENT_KEEP_ALIVE').default(1).asBool(),
            keepAliveMsecs: env.get('TRANSPORT_AGENT_KEEP_ALIVE_MSECS').default(1000).asIntPositive(),
        },
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
    },
    logs: {
        format: env.get('LOGGING_DATE_FORMAT').default('YYYY-MM-DD HH:mm:ss').asString(),
        enableFile: env.get('ENABLE_FILE_LOGGING').default('false').asBool(),
        enableRotateFile: env.get('ENABLE_ROTATE_FILE_LOGGING').default('true').asBool(),
        label: env.get('LOG_LABEL').default('notification').asString(),
        extraDefault: {
            serviceName: env.get('LOG_SERVICE_NAME').default('notification-service').asString(),
            environment: env.get('LOG_ENVIRONMENT').default('dev').asString(),
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
    elastic: {
        url: env.get('ELASTIC_CLIENT_URL').default('http://elastic:9200').asUrlString(),
        index: env.get('ELASTIC_PROCESS_SEARCH_INDEX').default('documents').asString(),
        user: env.get('ELASTIC_USER').default('elastic').asString(),
        password: env.get('ELASTIC_PASSWORD').default('elastic').asString(),
        lexicalFuzziness: env.get('ELASTIC_LEXICAL_FUZZINESS').default('1').asString(),
        knnGroupSize: env.get('ELASTIC_KNN_GROUP_SIZE').default(20).asInt(),
        rrfWindowConstant: env.get('ELASTIC_RRF_WINDOW_CONSTANT').default(50).asInt(),
        rrfRankConstant: env.get('ELASTIC_RRF_RANK_CONSTANT').default(60).asInt(),
        vectorDims: env.get('ELASTIC_VECTOR_DIMS').default(770).asInt(),
        similarityAlgorithm: env.get('SIMILARITY_ALGORITHM').default('l2_norm').asString(),
        queryMinScore: env.get('ELASTIC_QUERY_MIN_SCORE').default(0.1).asFloat(),
        topHitsByGroupSize: env.get('ELASTIC_TOP_HITS_BY_GROUP_SIZE').default(1).asInt(),
        groupByEntityIdSize: env.get('ELASTIC_GROUP_BY_ENTITY_ID_SIZE').default(100).asInt(),
    },
    modelApi: {
        url: env.get('MODEL_API_URL').default('https://api.voyageai.com/v1/embeddings').asString(),
        searchRoute: env.get('MODEL_API_SEARCH_ROUTE').default('').asString(),
        endpoint: env.get('MODEL_API_ENDPOINT').default('embed').asString(),
        chunkBatchSize: env.get('MODEL_API_CHUNK_BATCH_SIZE').default(100).asInt(),
        token: env.get('MODEL_API_TOKEN').default('pa-Ij1f9ka-IVcyRfdg9sfLntx36vDiRmvXhTY1Dr_EZxc').asString(),
        modelName: env.get('MODEL_API_MODEL_NAME').default('voyage-2').asString(),
    },
};

export default config;
