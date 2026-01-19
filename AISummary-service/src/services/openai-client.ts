import OpenAI from 'openai';
import config from '../config';

// Initialize OpenAI client
// If openaiBaseUrl is provided (e.g. for Ollama), it will use that.
// Otherwise it defaults to OpenAI's standard API.
const openai = new OpenAI({
    apiKey: config.openai.apiKey || 'dummy-key', // Local servers often need a non-empty key
    baseURL: config.openai.baseUrl,
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
    // GPT-4o has 128k context, local models might be 32k or 8k.
    // 32k tokens is roughly 120,000 chars. Let's be safe with 100k chars ~ 25k tokens.
    const maxInputChars = 100000;
    const truncatedText = text.length > maxInputChars ? text.substring(0, maxInputChars) + '...[truncated]' : text;

    const systemPrompt = `You are a professional document summarizer.
**STRICT LANGUAGE RULES**:
1. Check the language of the source text.
2. The summary MUST be written **exclusively** in that same language.
3. If the input is Hebrew, use **ONLY** Hebrew letters (and standard numbers/punctuation). Do NOT output Cyrillic, Chinese, or Arabic characters.
4. If the input is English, use ONLY English.
**SYNTHESIS RULES**:
- Combine information from all provided document partitions into one cohesive narrative.
- Ignore "--- Document X ---" separators in the output summary.
- Be concise and factual.`;

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
            temperature: 0.3,
        });

        return response.choices[0]?.message?.content?.trim() || 'No summary generated.';
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`OpenAI summarization failed: ${error.message}`);
        }
        throw new Error('OpenAI summarization failed: Unknown error');
    }
}
