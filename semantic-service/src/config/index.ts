import * as env from 'env-var';
import './dotenv';

type SplitOptions = {
    minLength?: number;
    maxLength?: number;
    overlap?: number;
    splitter?: 'sentence' | 'paragraph';
    delimiters?: string;
};

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
        maxSentenceLength: env.get('MODEL_MAX_SENTENCE_LENGTH').default(1).asInt(),
        sentenceSplitter: env.get('MODEL_SENTENCE_SPILTTER').default('.').asString(),
        charsToRemove: env.get('MODEL_CHARS_TO_REMOVE').default('\n\t').asString(),
        llmChunkSplitterOptions: env
            .get('LLM_CHUNK_SPLITTER_OPTIONS')
            .default({ minLength: 128, maxLength: 512, splitter: 'sentence' })
            .asJsonObject() as SplitOptions,
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
        useDevBucket: env.get('USE_DEV_BUCKETS').default('false').asBool(),
        devBucketPrefix: env.get('DEV_BUCKET_PREFIX').default('dev-').asString(),
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
        rrfWindowFieldName: env.get('ELASTIC_RRF_WINDOW_FIELD_NAME').default('window_size').asString(),
        rrfRankConstant: env.get('ELASTIC_RRF_RANK_CONSTANT').default(60).asInt(),
        vectorDims: env.get('ELASTIC_VECTOR_DIMS').default(770).asInt(),
        similarityAlgorithm: env.get('SIMILARITY_ALGORITHM').default('l2_norm').asString(),
        queryMinScore: env.get('ELASTIC_QUERY_MIN_SCORE').default(1.0).asFloat(),
        uniqueEntityForAggSize: env.get('ELASTIC_UNIQUE_ENTITY_FOR_AGG_SIZE').default(10000).asInt(),
        topHitsByGroupSize: env.get('ELASTIC_TOP_HITS_BY_GROUP_SIZE').default(1).asInt(),
        uniqueEntityForAgg: env.get('ELASTIC_UNIQUE_ENTITY_FOR_AGG').default('minioFileId').asString(),
    },
    modelApi: {
        embedding: {
            baseUrl: env.get('MODEL_EMBEDDING_API_URL').default('https://api.voyageai.com/v1/embeddings').asString(),
            embeddingRoute: env.get('MODEL_EMBEDDING_ROUTE').default('/embed').asString(),
            requestTimeout: env.get('MODEL_EMBEDDING_REQUEST_TIMEOUT').default(10000).asIntPositive(),
            concurrentSentenceEmbeddingLimit: env.get('MODEL_EMBEDDING_CONCURRENT_SENTENCE_LIMIT').default(100).asInt(),
        },
        rerank: {
            baseUrl: env.get('MODEL_RERANK_API_URL').default('https://api.voyageai.com/v1/embeddings').asString(),
            rerankRoute: env.get('MODEL_RERANK_ROUTE').default('/rerank').asString(),
            requestTimeout: env.get('MODEL_RERANK_REQUEST_TIMEOUT').default(10000).asIntPositive(),
        },
    },
};

export default config;
