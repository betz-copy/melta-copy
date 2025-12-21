/* eslint-disable import/prefer-default-export */

import { ActionTypes, RuleBreachRequestStatus } from '@packages/rule-breach';
import * as joi from 'joi';
import { mongoIdSchema } from '../../utils/joi/schemas';
import { agGridRequestSchema } from '../../utils/joi/schemas/agGrid';
import { brokenRulesSchema, ruleBreachSchema } from '../../utils/joi/schemas/ruleBreach';
import { validateActionMetadata } from '../../utils/joi/validateActionMetadata';

// POST /api/rule-breaches/requests/search
export const searchRuleBreachRequestsRequestSchema = joi.object({
    query: {},
    body: agGridRequestSchema,
    params: {},
});

// POST /api/rule-breaches/getMany
export const getManyRuleBreachesByIds = joi.object({
    query: {},
    body: {
        rulesBreachIds: joi.array().items(mongoIdSchema),
    },
    params: {},
});

// POST /api
export const getManyRuleBreachRequests = joi.object({
    query: {},
    body: {
        rulesBreachIds: joi.array().items(mongoIdSchema),
    },
    params: {},
});

// POST /api/rule-breaches/requests
export const createRuleBreachRequestRequestSchema = joi.object({
    query: {},
    body: ruleBreachSchema,
    params: {},
});

// PUT /api/rule-breaches/requests/many/status/:entityId
export const updateManyRuleBreachRequestsStatusesByRelatedEntityIdRequestSchema = joi.object({
    query: {},
    body: {
        status: joi
            .string()
            .valid(...Object.values(RuleBreachRequestStatus))
            .required(),
    },
    params: {
        entityId: joi.string().required(),
    },
});

// PATCH /api/rule-breaches/requests/:ruleBreachRequestId/status
export const updateRuleBreachRequestStatusRequestSchema = joi.object({
    query: {},
    body: {
        reviewerId: mongoIdSchema.required(),
        status: joi
            .string()
            .valid(...Object.values(RuleBreachRequestStatus))
            .required(),
    },
    params: {
        ruleBreachRequestId: mongoIdSchema.required(),
    },
});

// PATCH /api/rule-breaches/requests/:ruleBreachRequestId/action-metadata
export const updateRuleBreachRequestActionMetadataRequestSchema = joi.object({
    query: {},
    body: {
        actions: joi.array().items({
            actionType: joi
                .string()
                .valid(...Object.values(ActionTypes))
                .required(),
            actionMetadata: joi.custom(validateActionMetadata).required(),
        }),
    },
    params: {
        ruleBreachRequestId: mongoIdSchema.required(),
    },
});

// PATCH /api/rule-breaches/requests/:ruleBreachRequestId/broken-rules
export const updateRuleBreachRequestBrokenRulesRequestSchema = joi.object({
    query: {},
    body: {
        brokenRules: brokenRulesSchema.required(),
    },
    params: {
        ruleBreachRequestId: mongoIdSchema.required(),
    },
});

// GET /api/rule-breaches/requests/:ruleBreachRequestId
export const getRuleBreachRequestByIdRequestSchema = joi.object({
    query: {},
    body: {},
    params: {
        ruleBreachRequestId: mongoIdSchema.required(),
    },
});

// GET /api/rule-breaches/requests/broken-rules/:ruleId
export const getRuleBreachRequestsByRuleIdRequestSchema = joi.object({
    query: {},
    body: {},
    params: {
        ruleId: mongoIdSchema.required(),
    },
});
