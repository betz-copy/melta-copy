import * as joi from 'joi';
import config from '../../config';

// POST /api/semantic/summarize
export const summarizeRequestSchema = joi.object({
    query: {},
    body: joi.object({
        maxLength: joi
            .number()
            .min(config.summarization.maxLengthMin)
            .max(config.summarization.maxLengthMax)
            .default(config.summarization.maxLengthDefault),
    }),
    params: {},
});
