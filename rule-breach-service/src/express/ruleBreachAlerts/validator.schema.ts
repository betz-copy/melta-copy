/* eslint-disable import/prefer-default-export */
import * as joi from 'joi';
import { ActionTypes } from '../../utils/interfaces/actionMetadata';
import { mongoIdSchema, ruleBreachSchema } from '../../utils/joi/schemas/actionMetadata';
import { agGridRequestSchema } from '../../utils/joi/schemas/agGrid';
import { validateActionMetadata } from '../../utils/joi/validateActionMetadata';

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

// PATCH /api/rule-breaches/alerts/:ruleBreachAlertId/action-metadata
export const updateRuleBreachAlertActionMetadataRequestSchema = joi.object({
    query: {},
    body: {
        actionType: joi
            .string()
            .valid(...Object.values(ActionTypes))
            .required(),
        actionMetadata: joi.custom(validateActionMetadata).required(),
    },
    params: {
        ruleBreachAlertId: mongoIdSchema.required(),
    },
});

// GET /api/rule-breaches/alerts/:ruleBreachAlertId
export const getRuleBreachAlertByIdRequestSchema = joi.object({
    query: {},
    body: {},
    params: {
        ruleBreachAlertId: mongoIdSchema.required(),
    },
});
