import * as joi from 'joi';
import { mongoIdSchema } from '../../utils/joi/schemas';
import { agGridRequestSchema } from '../../utils/joi/schemas/agGrid';
import { ruleBreachSchema } from '../../utils/joi/schemas/ruleBreach';

// POST /api/rule-breaches/search
export const searchRuleBreachAlertsRequestSchema = joi.object({
    query: {},
    body: agGridRequestSchema,
    params: {},
});

// POST /api/rule-breaches/alerts
export const createRuleBreachAlertRequestSchema = joi.object({
    query: {},
    body: ruleBreachSchema,
    params: {},
});

// GET /api/rule-breaches/alerts/:ruleBreachAlertId
export const getRuleBreachAlertByIdRequestSchema = joi.object({
    query: {},
    body: {},
    params: {
        ruleBreachAlertId: mongoIdSchema.required(),
    },
});

// GET /api/rule-breaches/alerts/ruleId/:ruleId
export const getRuleBreachAlertsByRuleIdRequestSchema = joi.object({
    query: {},
    body: {},
    params: {
        ruleId: mongoIdSchema.required(),
    },
});
