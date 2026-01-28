import './dotenv';
import env from 'env-var';

const config = {
    service: {
        port: env.get('PORT').default(3000).asPortNumber(),
        maxRequestSize: env
            .get('MAX_REQUEST_BYTE_SIZE')
            .default(10 * 1024 * 1024)
            .asInt(),
        maxUploadFiles: env.get('MAX_UPLOAD_FILES').default(10).asIntPositive(),
    },
    openai: {
        apiKey: env.get('OPENAI_API_KEY').asString(),
        baseUrl: env.get('OPENAI_BASE_URL').asString(),
        model: env.get('OPENAI_MODEL').default('aminadaven/dictalm2.0-instruct:q4_k_m').asString(),
        systemPrompt: env
            .get('OPENAI_SYSTEM_PROMPT')
            .default(
                'You are a professional document summarizer.\n**STRICT LANGUAGE RULES**:\n1. Check the language of the source text.\n2. The summary MUST be written **exclusively** in that same language.\n3. If the input is Hebrew, use **ONLY** Hebrew letters (and standard numbers/punctuation). Do NOT output Cyrillic, Chinese, or Arabic characters.\n4. If the input is English, use ONLY English.\n**SYNTHESIS RULES**:\n- Combine information from all provided document partitions into one cohesive narrative.\n- Ignore "--- Document X ---" separators in the output summary.\n- Be concise and factual.',
            )
            .asString(),
        maxInputChars: env.get('OPENAI_MAX_INPUT_CHARS').default(100000).asIntPositive(),
        timeout: env.get('OPENAI_TIMEOUT').default(120000).asIntPositive(),
        temperature: env.get('OPENAI_TEMPERATURE').default(0.3).asFloatPositive(),
    },
    summarization: {
        maxLengthMin: env.get('SUMMARY_MAX_LENGTH_MIN').default(1).asIntPositive(),
        maxLengthMax: env.get('SUMMARY_MAX_LENGTH_MAX').default(10).asIntPositive(),
        maxLengthDefault: env.get('SUMMARY_MAX_LENGTH_DEFAULT').default(1).asIntPositive(),
    },

    logs: {
        label: env.get('LOG_LABEL').default('ai-summary').asString(),
        previewLength: env.get('LOG_PREVIEW_LENGTH').default(100).asIntPositive(),
        extraDefault: {
            serviceName: env.get('LOG_SERVICE_NAME').default('ai-summary-service').asString(),
            environment: env.get('LOG_ENVIRONMENT').default('dev').asString(),
        },
    },
};

// Validation
if (!config.openai.apiKey && !config.openai.baseUrl) {
    console.warn('⚠️  Warning: OPENAI_API_KEY or OPENAI_BASE_URL should be set.');
}

export default config;
