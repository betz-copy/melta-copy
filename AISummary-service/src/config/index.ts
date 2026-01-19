import './dotenv';
import env from 'env-var';

const config = {
    service: {
        port: env.get('PORT').default(3000).asPortNumber(),
        maxRequestSize: env
            .get('MAX_REQUEST_BYTE_SIZE')
            .default(10 * 1024 * 1024)
            .asInt(),
    },
    openai: {
        apiKey: env.get('OPENAI_API_KEY').asString(),
        baseUrl: env.get('OPENAI_BASE_URL').asString(),
        model: env.get('OPENAI_MODEL').default('gpt-4o').asString(),
    },
    huggingface: {
        token: env.get('HF_TOKEN').asString(),
        model: env.get('HF_MODEL').default('mistralai/Mistral-7B-Instruct-v0.2').asString(),
    },
    logs: {
        label: env.get('LOG_LABEL').default('ai-summary').asString(),
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
