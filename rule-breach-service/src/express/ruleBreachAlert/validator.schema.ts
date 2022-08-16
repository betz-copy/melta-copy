/* eslint-disable import/prefer-default-export */
import * as joi from 'joi';
import { ruleBreachSchema } from '../../utils/joi/schemas';

// POST /api/rule-breaches/alerts
export const createRuleBreachAlertSchema = joi.object({
    query: {},
    body: ruleBreachSchema,
    params: {},
});
