/* eslint-disable import/prefer-default-export */
import * as joi from 'joi';
import { actionMetadataSchema, mongoIdSchema } from '../../utils/joi/schemas';
import { agGridRequestSchema } from '../../utils/joi/schemas/agGrid';

// POST /api/rule-breaches/search
export const searchRuleBreachesSchema = joi.object({
    query: {},
    body: {
        ...agGridRequestSchema,
        originUserId: mongoIdSchema,
    },
    params: {},
});

// PATCH /api/rule-breaches/:ruleBreachId/action-metadata
export const updateRuleBreachActionMetadataSchema = joi.object({
    query: {},
    body: actionMetadataSchema,
    params: {
        ruleBreachId: mongoIdSchema.required(),
    },
});

// GET /api/rule-breaches/:ruleBreachId
export const getRuleBreachByIdSchema = joi.object({
    query: {},
    body: {},
    params: {
        ruleBreachId: mongoIdSchema.required(),
    },
});
