import joi from 'joi';
import { ExtendedJoi, fileSchema, MongoIdSchema } from '../../utils/joi';

export const brokenRuleSchema = joi.object({
    ruleId: MongoIdSchema.required(),
    relationshipIds: joi.array().items(joi.string()).required(),
});

const ruleBreachSchema = joi.object({
    brokenRules: ExtendedJoi.stringToArray().items(brokenRuleSchema).min(1).required(),
    actionType: joi.string().required(),
    actionMetadata: ExtendedJoi.stringToObject().required(),
});

const agGridRequestSchema = joi.object({
    startRow: joi.number().required(),
    endRow: joi.number().required(),
    filterModel: joi.object().required(),
    sortModel: joi
        .array()
        .items(
            joi.object({
                colId: joi.string(),
                sort: joi.string(),
            }),
        )
        .required(),
});

// POST /api/rule-breaches/requests
export const createRuleBreachRequestRequestSchema = joi.object({
    query: {},
    body: ruleBreachSchema,
    params: {},
    files: joi.array().items(fileSchema),
});

// POST /api/rule-breaches/requests/:id/approve
export const approveRuleBreachRequestRequestSchema = joi.object({
    query: {},
    body: {},
    params: {
        ruleBreachRequestId: MongoIdSchema.required(),
    },
});

// POST /api/notifications/requests/:id/deny
export const denyRuleBreachRequestRequestSchema = joi.object({
    query: {},
    body: {},
    params: {
        ruleBreachRequestId: MongoIdSchema.required(),
    },
});

// POST /api/notifications/requests/:id/cancel
export const cancelRuleBreachRequestRequestSchema = joi.object({
    query: {},
    body: {},
    params: {
        ruleBreachRequestId: MongoIdSchema.required(),
    },
});

// POST /api/notifications/requests/search
export const searchRuleBreachRequestsRequestSchema = joi.object({
    query: {},
    body: agGridRequestSchema,
    params: {},
});

// POST /api/notifications/alerts/search
export const searchRuleBreachAlertsRequestSchema = joi.object({
    query: {},
    body: agGridRequestSchema,
    params: {},
});

// GET /api/rule-breaches/requests/:ruleBreachRequestId
export const getRuleBreachRequestByIdRequestSchema = joi.object({
    query: {},
    body: {},
    params: {
        ruleBreachRequestId: MongoIdSchema.required(),
    },
});

// GET /api/rule-breaches/alerts/:ruleBreachRequestId
export const getRuleBreachAlertByIdRequestSchema = joi.object({
    query: {},
    body: {},
    params: {
        ruleBreachAlertId: MongoIdSchema.required(),
    },
});
