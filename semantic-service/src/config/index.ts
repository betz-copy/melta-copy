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
        apiKey: env.get('OPENAI_API_KEY').required().asString(),
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
        maxLengthMin: env.get('SUMMARY_MAX_LENGTH_MIN').default(1).asIntPositive(),
        maxLengthMax: env.get('SUMMARY_MAX_LENGTH_MAX').default(10).asIntPositive(),
        maxLengthDefault: env.get('SUMMARY_MAX_LENGTH_DEFAULT').default(1).asIntPositive(),
        maxRefinementIterations: env.get('SUMMARY_MAX_REFINEMENT_ITERATIONS').default(3).asIntPositive(),
        enforceHebrewOnly: env.get('ENFORCE_HEBREW_ONLY').default('true').asBool(),
    },

    logs: {
        label: env.get('LOG_LABEL').default('semantic-service').asString(),
        previewLength: env.get('LOG_PREVIEW_LENGTH').default(100).asIntPositive(),
        extraDefault: {
            serviceName: env.get('LOG_SERVICE_NAME').default('semantic-service').asString(),
            environment: env.get('LOG_ENVIRONMENT').default('dev').asString(),
        },
    },
};

export default config;
