import * as joi from 'joi';
import config from '../../config';

const { maxLengthMin, maxLengthMax, maxLengthDefault } = config.summarization;

// POST /api/semantic/ai/summarize
export const summarizeRequestSchema = joi.object({
    query: {},
    body: joi.object({
        maxLength: joi.number().min(maxLengthMin).max(maxLengthMax).default(maxLengthDefault),
    }),
    params: {},
});
