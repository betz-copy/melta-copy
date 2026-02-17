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
        maxRequestSize: env
            .get('MAX_REQUEST_BYTE_SIZE')
            .default(10 * 1024 * 1024)
            .asInt(),
        maxUploadFiles: env.get('MAX_UPLOAD_FILES').default(10).asIntPositive(),
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
            .default({ minLength: 128, maxLength: 512, splitter: 'sentence', delimiters: '\n###\n' })
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
        pptx: {
            extractingTextTags: env.get('PPTX_EXTRACTING_TEXT_TAGS').default('a:t').asArray(',').map(String),
            extractingDiagramTags: env.get('PPTX_EXTRACTING_DIAGRAM_TAGS').default('dgm:t,a:t').asArray(',').map(String),
            diagramTypesToFilterBy: env
                .get('PPTX_DIAGRAM_TYPES_TO_FILTER_BY')
                .default('http://schemas.openxmlformats.org/officeDocument/2006/relationships/diagramData')
                .asArray(',')
                .map(String),
            slidesSplitter: env.get('PPTX_SLIDES_SPLITTER').default('\n###\n').asString(),
            slidesPathRegex: env.get('PPTX_SLIDES_PATH_REGEX').default('^ppt\\/slides\\/slide\\d+\\.xml$').asString(),
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
        label: env.get('LOG_LABEL').default('semantic-service').asString(),
        previewLength: env.get('LOG_PREVIEW_LENGTH').default(100).asIntPositive(),
        extraDefault: {
            serviceName: env.get('LOG_SERVICE_NAME').default('semantic-service').asString(),
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
            requestTimeout: env.get('MODEL_EMBEDDING_REQUEST_TIMEOUT').default(20000).asIntPositive(),
            concurrentSentenceEmbeddingLimit: env.get('MODEL_EMBEDDING_CONCURRENT_SENTENCE_LIMIT').default(100).asInt(),
        },
        rerank: {
            baseUrl: env.get('MODEL_RERANK_API_URL').default('https://api.voyageai.com/v1/embeddings').asString(),
            rerankRoute: env.get('MODEL_RERANK_ROUTE').default('/rerank').asString(),
            requestTimeout: env.get('MODEL_RERANK_REQUEST_TIMEOUT').default(20000).asIntPositive(),
        },
    },
    openai: {
        apiKey: env.get('OPENAI_API_KEY').asString(),
        baseURL: env.get('OPENAI_BASE_URL').required().asString(),
        model: env.get('OPENAI_MODEL').default('aminadaven/dictalm2.0-instruct:q4_k_m').asString(),
        evaluatorModel: env
            .get('OPENAI_MODEL_EVALUATOR')
            .default(env.get('OPENAI_MODEL').default('aminadaven/dictalm2.0-instruct:q4_k_m').asString())
            .asString(),
        validatorModel: env
            .get('OPENAI_MODEL_VALIDATOR')
            .default(env.get('OPENAI_MODEL').default('aminadaven/dictalm2.0-instruct:q4_k_m').asString())
            .asString(),
        refinerModel: env
            .get('OPENAI_MODEL_REFINER')
            .default(env.get('OPENAI_MODEL').default('aminadaven/dictalm2.0-instruct:q4_k_m').asString())
            .asString(),
        systemPrompt: env
            .get('OPENAI_SYSTEM_PROMPT')
            .default(
                'You are a professional document summarizer.\n**STRICT LANGUAGE RULES**:\n1. Check the language of the source text.\n2. The summary MUST be written **exclusively** in that same language.\n3. If the input is Hebrew, use **ONLY** Hebrew letters (and standard numbers/punctuation). Do NOT output Cyrillic, Chinese, or Arabic characters.\n4. If the input is English, use ONLY English.\n**SYNTHESIS RULES**:\n- Combine information from all provided document partitions into one cohesive narrative.\n- Ignore "--- Document X ---" separators in the output summary.\n- Be concise and factual.',
            )
            .asString(),
        evaluatorSystemPrompt: env
            .get('OPENAI_EVALUATOR_SYSTEM_PROMPT')
            .default(
                `You are a strict content evaluator. Compare the source text and the summary.
Rate the summary on a scale of 1-5 for:
1. Accuracy: Does it match the source facts?
2. Completeness: Does it cover all key points?
3. Clarity: Is it easy to understand?

Check strictly for hallucinations (information in summary NOT in source).

Output strictly valid JSON:
{
  "grades": {
    "accuracy": number,
    "completeness": number,
    "clarity": number
  },
  "hallucinations": ["list of specific hallucinations found" or empty array],
  "missingInfo": "string summary of missing points or 'None'"
}`,
            )
            .asString(),
        validatorSystemPrompt: env
            .get('OPENAI_VALIDATOR_SYSTEM_PROMPT')
            .default(
                `You are a language compliance validator.
Rules:
1. If the summary is intended to be Hebrew, it must NOT contain Cyrillic, Chinese, or Arabic.
2. It should be coherent.

Output strictly valid JSON:
{
  "isValid": boolean,
  "detectedIssues": "string description of language inconsistency or 'None'"
}`,
            )
            .asString(),
        refinerSystemPrompt: env
            .get('OPENAI_REFINER_SYSTEM_PROMPT')
            .default(
                `You are an expert editor. Rewrite the summary to address the following feedback.
Ensure the final result matches the language of the source text and is accurate.`,
            )
            .asString(),
        // User Prompts (Templates)
        userPrompt: env
            .get('OPENAI_USER_PROMPT')
            .default(
                'Summarize the following text (approx {{maxLength}} words). If it contains multiple documents, combine their insights:\n\n{{text}}',
            )
            .asString(),
        evaluatorUserPrompt: env.get('OPENAI_EVALUATOR_USER_PROMPT').default('SOURCE TEXT:\n{{originalText}}\n\nSUMMARY:\n{{summary}}').asString(),
        validatorUserPrompt: env.get('OPENAI_VALIDATOR_USER_PROMPT').default('SUMMARY TO VALIDATE:\n{{summary}}').asString(),
        refinerUserPrompt: env
            .get('OPENAI_REFINER_USER_PROMPT')
            .default('SOURCE TEXT:\n{{originalText}}\n\nCURRENT SUMMARY:\n{{currentSummary}}\n\nFEEDBACK TO FIX:\n{{feedback}}')
            .asString(),
        maxInputChars: env.get('OPENAI_MAX_INPUT_CHARS').default(100000).asIntPositive(),
        timeout: env.get('OPENAI_TIMEOUT').default(120000).asIntPositive(),
        temperature: env.get('OPENAI_TEMPERATURE').default(0.3).asFloatPositive(),
        evaluatorTemperature: env.get('OPENAI_EVALUATOR_TEMPERATURE').default(0.1).asFloatPositive(),
        validatorTemperature: env.get('OPENAI_VALIDATOR_TEMPERATURE').default(0.1).asFloatPositive(),
        refinerTemperature: env.get('OPENAI_REFINER_TEMPERATURE').default(0.3).asFloatPositive(),
    },
    summarization: {
        enableEvaluation: env.get('SUMMARY_ENABLE_EVALUATION').default('false').asBool(),
        minLength: env.get('SUMMARY_MIN_LENGTH').default(1).asIntPositive(),
        maxLength: env.get('SUMMARY_MAX_LENGTH').default(100).asIntPositive(),
        defaultLength: env.get('SUMMARY_DEFAULT_LENGTH').default(50).asIntPositive(),
        maxRefinementIterations: env.get('SUMMARY_MAX_REFINEMENT_ITERATIONS').default(3).asIntPositive(),
        enforceHebrewOnly: env.get('ENFORCE_HEBREW_ONLY').default('true').asBool(),
    },
};

export default config;
