import { HfInference } from '@huggingface/inference';
import config from '../config';

const hf = new HfInference(config.huggingface.token);

/**
 * Generates a summary of the provided text using Hugging Face Inference API.
 * Optimized for Hebrew content but works with any language.
 *
 * @param text - The text to summarize
 * @param maxLength - Optional maximum length for the summary (in tokens)
 * @returns The generated summary
 */
export async function generateSummary(text: string, maxLength: number = 500): Promise<string> {
    if (!config.huggingface.token || config.huggingface.token === 'hf_your_token_here') {
        throw new Error('HF_TOKEN is not configured. Please set it in your .env file.');
    }

    // Truncate very long texts to avoid token limits (rough estimate: 4 chars per token)
    const maxInputChars = 12000; // ~3000 tokens, leaving room for output
    const truncatedText = text.length > maxInputChars ? text.substring(0, maxInputChars) + '...[truncated]' : text;

    // Prompt designed to work well with Hebrew and English
    const prompt = `Please provide a concise summary of the following document. If the text is in Hebrew, respond in Hebrew. If in English, respond in English.

Document:
${truncatedText}

Summary:`;

    try {
        const response = await hf.textGeneration({
            model: config.huggingface.model,
            inputs: prompt,
            parameters: {
                max_new_tokens: maxLength,
                temperature: 0.3,
                top_p: 0.9,
                return_full_text: false,
            },
        });

        return response.generated_text.trim();
    } catch (error) {
        // Handle specific HF errors
        if (error instanceof Error) {
            if (error.message.includes('rate limit')) {
                throw new Error('Rate limit exceeded. Please wait a moment and try again.');
            }
            if (error.message.includes('Model') && error.message.includes('not found')) {
                throw new Error(`Model ${config.huggingface.model} is not available. Try a different model in .env`);
            }
            throw new Error(`Summarization failed: ${error.message}`);
        }
        throw new Error('Summarization failed: Unknown error');
    }
}
