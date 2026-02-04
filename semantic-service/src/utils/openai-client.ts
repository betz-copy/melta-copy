import { logger } from '@microservices/shared';
import http from 'http';
import OpenAI from 'openai';
import config from '../config';
import { OpenAIError } from './errors';
import { IEvaluationResult, IValidationResult } from './types';

const { apiKey, baseURL, timeout, model, evaluatorModel, validatorModel, refinerModel } = config.openai;
const {
    systemPrompt,
    userPrompt,
    evaluatorSystemPrompt,
    evaluatorUserPrompt,
    validatorSystemPrompt,
    validatorUserPrompt,
    refinerSystemPrompt,
    refinerUserPrompt,
    maxInputChars,
    temperature,
    evaluatorTemperature,
    validatorTemperature,
    refinerTemperature,
} = config.openai;

// Custom HTTP agent with keep-alive disabled to avoid connection pooling issues
const httpAgent = new http.Agent({
    keepAlive: false,
});

// Initialize OpenAI client with custom configuration
const openai = new OpenAI({
    apiKey,
    baseURL,
    timeout, // client-level timeout for LLM inference
    httpAgent,
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
    const truncatedText = text.length > maxInputChars ? `${text.substring(0, maxInputChars)}...[truncated]` : text;

    try {
        const response = await openai.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: userPrompt.replace('{{maxLength}}', String(maxLength)).replace('{{text}}', truncatedText),
                },
            ],
            temperature,
        });

        return response.choices[0]?.message?.content?.trim() || 'No summary generated.';
    } catch (error) {
        logger.error('[generateSummary] OpenAI request failed', error);
        if (error instanceof Error) {
            throw new OpenAIError(`OpenAI summarization failed: ${error.message}`);
        }
        throw new OpenAIError('OpenAI summarization failed: Unknown error');
    }
}

/**
 * Evaluates the summary for content accuracy against the original text.
 */
export async function evaluateSummary(originalText: string, summary: string): Promise<IEvaluationResult> {
    try {
        const response = await openai.chat.completions.create({
            model: evaluatorModel,
            messages: [
                {
                    role: 'system',
                    content: evaluatorSystemPrompt,
                },
                {
                    role: 'user',
                    content: evaluatorUserPrompt.replace('{{originalText}}', originalText).replace('{{summary}}', summary),
                },
            ],
            temperature: evaluatorTemperature, // Lower temperature for evaluation
            response_format: { type: 'json_object' },
        });

        const content = response.choices[0]?.message?.content?.trim();
        if (!content) throw new OpenAIError('Empty response from evaluator');

        return JSON.parse(content) as IEvaluationResult;
    } catch (error) {
        logger.error('[evaluateSummary] Evaluation failed', error);
        // Fallback: Return low grades to force refinement if possible, or handle strictly
        return {
            grades: { accuracy: 0, completeness: 0, clarity: 0 },
            critique: 'Error during evaluation',
            hallucinations: [],
            missingInfo: 'Error during evaluation',
        };
    }
}

/**
 * Validates that the summary follows strict language compliance rules.
 */
export async function validateLanguage(summary: string): Promise<IValidationResult> {
    try {
        const response = await openai.chat.completions.create({
            model: validatorModel,
            messages: [
                {
                    role: 'system',
                    content: validatorSystemPrompt,
                },
                {
                    role: 'user',
                    content: validatorUserPrompt.replace('{{summary}}', summary),
                },
            ],
            temperature: validatorTemperature,
            response_format: { type: 'json_object' },
        });

        const content = response.choices[0]?.message?.content?.trim();
        if (!content) throw new OpenAIError('Empty response from validator');

        const result = JSON.parse(content) as IValidationResult;

        // Explicit strict check for foreign characters (Cyrillic, CJK)
        // Cyrillic: \u0400-\u04FF, CJK Unified Ideographs: \u4E00-\u9FFF
        const foreignCharsRegex = /[\u0400-\u04FF\u4E00-\u9FFF]/;
        if (foreignCharsRegex.test(summary)) {
            result.isValid = false;
            result.detectedIssues =
                result.detectedIssues && result.detectedIssues !== 'None'
                    ? `${result.detectedIssues}. Detected foreign characters (Cyrillic/Asian).`
                    : 'Detected foreign characters (Cyrillic/Asian).';
        }

        return result;
    } catch (error) {
        logger.error('[validateLanguage] Validation failed', error);
        return { isValid: true, detectedIssues: 'Error during validation' };
    }
}

/**
 * Refines the summary based on the evaluation and validation feedback.
 */
export async function refineSummary(
    originalText: string,
    currentSummary: string,
    evaluation: IEvaluationResult,
    validation: IValidationResult,
): Promise<string> {
    try {
        // Use the critique directly as the primary feedback
        let feedbackText = evaluation.critique;

        // Append language validation issues if any
        if (!validation.isValid) {
            feedbackText += `\nLanguage Issues: ${validation.detectedIssues}`;
        }

        const response = await openai.chat.completions.create({
            model: refinerModel,
            messages: [
                {
                    role: 'system',
                    content: refinerSystemPrompt,
                },
                {
                    role: 'user',
                    content: refinerUserPrompt
                        .replace('{{originalText}}', originalText)
                        .replace('{{currentSummary}}', currentSummary)
                        .replace('{{feedback}}', feedbackText),
                },
            ],
            temperature: refinerTemperature,
        });

        return response.choices[0]?.message?.content?.trim() || currentSummary;
    } catch (error) {
        logger.error('[refineSummary] Refinement failed', error);
        return currentSummary; // Fallback to original
    }
}
