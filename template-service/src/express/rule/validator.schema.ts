import { ActionOnFail, MongoIdSchema } from '@microservices/shared';
import Joi from 'joi';

export const fieldColorSchema = Joi.object({
    display: Joi.boolean(),
    field: Joi.string().when('display', { is: true, then: Joi.required() }),
    color: Joi.string().when('display', { is: true, then: Joi.required() }),
}).when('actionOnFail', {
    is: ActionOnFail.INDICATOR,
    then: Joi.required(),
    otherwise: Joi.forbidden(),
}); // TODO: after adding mail do required to one of them if it's INDICATOR

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
        fieldColor: fieldColorSchema,
    },
    query: {},
    params: {},
});

// PUT /api/templates/rules/:ruleId
export const updateRuleByIdRequestSchema = Joi.object({
    body: {
        name: Joi.string(),
        description: Joi.string(),
        fieldColor: fieldColorSchema,
        actionOnFail: Joi.string()
            .valid(...Object.values(ActionOnFail))
            .required(),
        // todo: (extra feature) allow update stuff that could break, only if no alerts/requests created yet
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
