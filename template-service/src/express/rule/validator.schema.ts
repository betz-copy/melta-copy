import { ActionOnFail, MongoIdSchema } from '@microservices/shared';
import Joi from 'joi';

export const fieldColorSchema = Joi.object({
    display: Joi.boolean(),
    field: Joi.string().when('display', { is: true, then: Joi.string().required(), otherwise: Joi.string().allow('') }),
    color: Joi.string().when('display', { is: true, then: Joi.string().required(), otherwise: Joi.string().allow('') }),
});

export const mailSchema = Joi.object({
    display: Joi.boolean(),
    title: Joi.string().when('display', { is: true, then: Joi.string().required(), otherwise: Joi.string().allow('') }),
    body: Joi.string().when('display', { is: true, then: Joi.string().required(), otherwise: Joi.string().allow('') }),
    sendPermissionUsers: Joi.boolean().default(false),
    sendAssociatedUsers: Joi.boolean().default(false),
}).or('sendAssociatedUsers', 'sendPermissionUsers');

const indicatorCondition = Joi.object({ actionOnFail: Joi.valid(ActionOnFail.INDICATOR) }).unknown();

const indicatorSchema = Joi.object().custom((value, helpers) => {
    const fieldColorDisplay = value.fieldColor?.display === true;
    const mailDisplay = value.fieldColor.display === true;
    if (!fieldColorDisplay && !mailDisplay) {
        return helpers.error('indicator.custom');
    }

    return value;
});

const nonIndicatorSchema = Joi.object({
    fieldColor: Joi.forbidden(),
    mail: Joi.forbidden(),
});

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
    body: Joi.object({
        name: Joi.string().required(),
        description: Joi.string().required(),
        actionOnFail: Joi.string()
            .valid(...Object.values(ActionOnFail))
            .required(),
        entityTemplateId: MongoIdSchema.required(),
        formula: Joi.object().required(),
        disabled: Joi.boolean().default(false),
        fieldColor: fieldColorSchema,
        mail: mailSchema,
    }).when(indicatorCondition, { then: indicatorSchema, otherwise: nonIndicatorSchema }),
    query: {},
    params: {},
});

// PUT /api/templates/rules/:ruleId
export const updateRuleByIdRequestSchema = Joi.object({
    body: Joi.object({
        name: Joi.string(),
        description: Joi.string(),
        // todo: (extra feature) allow update stuff that could break, only if no alerts/requests created yet
        actionOnFail: Joi.string()
            .valid(...Object.values(ActionOnFail))
            .required(),
        fieldColor: fieldColorSchema,
        mail: mailSchema,
    }).when(indicatorCondition, { then: indicatorSchema, otherwise: nonIndicatorSchema }),
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
        doesFormulaHaveTodayFunc: Joi.boolean(),
        disabled: Joi.boolean(),
        limit: Joi.number().integer().min(0).default(0),
        skip: Joi.number().integer().min(0).default(0),
    },
    query: {},
    params: {},
});
