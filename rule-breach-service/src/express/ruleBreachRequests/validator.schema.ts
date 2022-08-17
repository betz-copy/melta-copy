/* eslint-disable import/prefer-default-export */
import * as joi from 'joi';
import { mongoIdSchema, ruleBreachSchema } from '../../utils/joi/schemas';

// POST /api/rule-breaches/requests
export const createRuleBreachRequestSchema = joi.object({
    query: {},
    body: ruleBreachSchema,
    params: {},
});

// PATCH /api/rule-breaches/requests/:ruleBreachRequestId/review
export const reviewRuleBreachRequestSchema = joi.object({
    query: {},
    body: {
        reviewerId: mongoIdSchema.required(),
        approved: joi.boolean().required(),
    },
    params: {
        ruleBreachRequestId: mongoIdSchema.required(),
    },
});
