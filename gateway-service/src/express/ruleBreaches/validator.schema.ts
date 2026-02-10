import { fileSchema, MongoIdSchema } from '@packages/utils';
import joi from 'joi';
import { ExtendedJoi } from '../../utils/joi';

const causesOfInstanceSchema = joi.object({
    instance: joi
        .object({
            entityId: joi.string().required(),
            aggregatedRelationship: joi.object({
                relationshipId: joi.string().required(),
                otherEntityId: joi.string().required(),
            }),
        })
        .required(),
    properties: joi.array().items(joi.string()).required(),
});

export const brokenRuleSchema = joi.object({
    ruleId: MongoIdSchema.required(),
    failures: joi
        .array()
        .items({
            entityId: joi.string().required(),
            causes: joi.array().items(causesOfInstanceSchema).required(),
        })
        .required(),
});

const ruleBreachSchema = joi.object({
    brokenRules: ExtendedJoi.stringToArray().items(brokenRuleSchema).min(1).required(),
    actions: ExtendedJoi.stringToArray().items(
        joi.object({
            actionType: joi.string().required(),
            actionMetadata: joi.object().required(),
        }),
    ),
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
    body: { childTemplateId: joi.string() },
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

// POST /api/rule-breaches/getMany
export const getManyRuleBreachesByIds = joi.object({
    query: {},
    body: {
        rulesBreachIds: joi.array().items(MongoIdSchema),
        isPopulate: joi.bool().default(true),
    },
    params: {},
});
