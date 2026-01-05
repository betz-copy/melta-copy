import { ActionTypes } from '@packages/rule-breach';
import * as joi from 'joi';
import { validateActionMetadata } from '../validateActionMetadata';
import { mongoIdSchema } from '.';

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
    ruleId: mongoIdSchema.required(),
    failures: joi
        .array()
        .items({
            entityId: joi.string().required(),
            causes: joi.array().items(causesOfInstanceSchema).required(),
        })
        .min(1)
        .required(),
});

export const brokenRulesSchema = joi.array().items(brokenRuleSchema).min(1);

export const ruleBreachSchema = joi.object({
    originUserId: mongoIdSchema.allow(null).required(),
    brokenRules: brokenRulesSchema.required(),
    actions: joi.array().items({
        actionType: joi
            .string()
            .valid(...Object.values(ActionTypes))
            .required(),
        actionMetadata: joi.custom(validateActionMetadata).required(),
    }),
});
