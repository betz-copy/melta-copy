import { logger } from '@microservices/shared';
import http from 'http';
import OpenAI from 'openai';
import config from '../config';

// Effective base URL with IP substitution for Docker networking
const effectiveBaseUrl = (config.openai.baseUrl || '').replace('host.docker.internal', '172.17.0.1');

// Custom HTTP agent with keep-alive disabled to avoid connection pooling issues
const httpAgent = new http.Agent({
    keepAlive: false,
});

// Initialize OpenAI client with custom configuration
const openai = new OpenAI({
    apiKey: config.openai.apiKey || 'dummy-key',
    baseURL: effectiveBaseUrl,
    timeout: config.openai.timeout, // client-level timeout for LLM inference
    httpAgent: httpAgent,
});

/**
 * Generates a summary of the provided text using OpenAI-compatible API.
 *
 * @param text - The text to summarize
 * @param maxLength - Optional target length instruction (not strict token limit)
 * @returns The generated summary
 */
export async function generateSummary(text: string, maxLength: number = 500): Promise<string> {
    // Truncate text if it's extremely long to avoid context window issues
    const maxInputChars = config.openai.maxInputChars;
    const truncatedText = text.length > maxInputChars ? text.substring(0, maxInputChars) + '...[truncated]' : text;

    const systemPrompt = config.openai.systemPrompt;

    try {
        const response = await openai.chat.completions.create({
            model: config.openai.model,
            messages: [
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: `Summarize the following text (approx ${maxLength} words). If it contains multiple documents, combine their insights:\n\n${truncatedText}`,
                },
            ],
            temperature: config.openai.temperature,
        });

        return response.choices[0]?.message?.content?.trim() || 'No summary generated.';
    } catch (error) {
        logger.error('[generateSummary] OpenAI request failed', error);
        if (error instanceof Error) {
            throw new Error(`OpenAI summarization failed: ${error.message}`);
        }
        throw new Error('OpenAI summarization failed: Unknown error');
    }
}
