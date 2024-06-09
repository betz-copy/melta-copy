import * as joi from 'joi';
import { mongoIdSchema } from '.';
import { ActionTypes } from '../../interfaces/actionMetadata';
import { validateActionMetadata } from '../validateActionMetadata';

export const brokenRulesSchema = joi
    .array()
    .items(
        joi.object({
            ruleId: mongoIdSchema.required(),
            relationshipIds: joi.array().items(joi.string()).required(),
        }),
    )
    .min(1);

export const ruleBreachSchema = joi.object({
    originUserId: mongoIdSchema.required(),
    brokenRules: brokenRulesSchema.required(),
    actions: joi.array().items({
        actionType: joi
            .string()
            .valid(...Object.values(ActionTypes))
            .required(),
        actionMetadata: joi.custom(validateActionMetadata).required(),
    }),
});
