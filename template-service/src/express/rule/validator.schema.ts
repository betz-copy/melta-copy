import Joi from 'joi';
import { ActionOnFail, MongoIdSchema } from '@microservices/shared';

// GET /api/templates/rules/:ruleId
export const getRuleByIdRequestSchema = Joi.object({
    query: {},
    body: {},
    params: {
        ruleId: MongoIdSchema.required(),
    },
});

// POST api/templates/rule/getMany
export const getManyRulesByIdsRequestSchema = Joi.object({
    query: {},
    body: {
        rulesIds: Joi.array().items(MongoIdSchema),
    },
    params: {},
});

// POST /api/templates/rules
export const createRuleRequestSchema = Joi.object({
    body: {
        name: Joi.string().required(),
        description: Joi.string().required(),
        actionOnFail: Joi.string()
            .valid(...Object.values(ActionOnFail))
            .required(),
        entityTemplateId: MongoIdSchema.required(),
        formula: Joi.object().required(),
        disabled: Joi.boolean().default(false),
        fieldColor: Joi.when('actionOnFail', {
            is: ActionOnFail.INDICATOR,
            then: Joi.object({
                field: Joi.string(),
                color: Joi.string(),
            }),
            otherwise: Joi.forbidden(),
        }), // TODO: after adding mail do required to one of them if it's INDICATOR
    },
    query: {},
    params: {},
});

// PUT /api/templates/rules/:ruleId
export const updateRuleByIdRequestSchema = Joi.object({
    body: {
        name: Joi.string(),
        description: Joi.string(),
        // todo: (extra feature) allow update stuff that could break, only if no alerts/requests created yet
        // actionOnFail: Joi.string().valid(ActionOnFail),
        // entityTemplateId: MongoIdSchema,
        // formula: Joi.object(),
    },
    query: {},
    params: {
        ruleId: MongoIdSchema.required(),
    },
});

// PATCH /api/templates/rules/:ruleId/status
export const updateRuleStatusByIdRequestSchema = Joi.object({
    body: {
        disabled: Joi.boolean().required(),
    },
    query: {},
    params: {
        ruleId: Joi.string().required(),
    },
});

// DELETE /api/templates/rules/:ruleId
export const deleteRuleByIdRequestSchema = Joi.object({
    body: {},
    query: {},
    params: {
        ruleId: MongoIdSchema.required(),
    },
});

// POST /api/templates/rules/search
export const searchRulesRequestSchema = Joi.object({
    body: {
        search: Joi.string(),
        entityTemplateIds: Joi.array().items(MongoIdSchema),
        disabled: Joi.boolean(),
        limit: Joi.number().integer().min(0).default(0),
        skip: Joi.number().integer().min(0).default(0),
    },
    query: {},
    params: {},
});
