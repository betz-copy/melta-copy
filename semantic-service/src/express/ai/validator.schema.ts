import * as joi from 'joi';
import config from '../../config';

const { minLength, maxLength, defaultLength } = config.summarization;

// POST /api/semantic/ai/summarize
export const summarizeRequestSchema = joi.object({
    query: {},
    body: joi.object({
        maxLength: joi.number().min(minLength).max(maxLength).default(defaultLength),
    }),
    params: {},
});
